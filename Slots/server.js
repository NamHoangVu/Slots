const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { spinSlots, calculateWin } = require("./games/slots");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// tillat requests fra Vite frontend
app.use(cors({ origin: "http://localhost:5173" }));

// PostgreSQL pool
const pool = new Pool({
  user: "postgres",         // ditt postgres-brukernavn
  host: "localhost",
  database: "slotsdb",      // databasen du laget
  password: "vietnam123",   // ← sett inn passordet ditt her
  port: 5432,
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ DB connection error:", err));

/* ---------------- SLOT API ---------------- */

// test-endepunkt
app.get("/", (req, res) => {
  res.send("Slots API kjører 🎰 Bruk POST /api/slots med { bet }");
});

// spin-rute
app.post("/api/slots", async (req, res) => {
  const { username, bet } = req.body;
  if (!bet || bet <= 0) return res.status(400).json({ error: "Ugyldig innsats" });

  try {
    // hent bruker
    const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Bruker ikke funnet" });
    }

    let balance = userResult.rows[0].balance;

    if (balance < bet) {
      return res.status(400).json({ error: "Ikke nok saldo" });
    }

    // trekk innsats
    balance -= bet;

    // spin slot
    const grid = spinSlots();
    const { win, bonus, freeSpins, winningRows } = calculateWin(grid, bet);

    // legg til gevinst
    balance += win;

    // oppdater i databasen
    await pool.query("UPDATE users SET balance = $1 WHERE username = $2", [balance, username]);

    res.json({ grid, win, bonus, freeSpins, winningRows, balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverfeil" });
  }
});

/* ---------------- USER API ---------------- */

// registrer bruker
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Mangler brukernavn eller passord" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Sett start-balance = 1000
    await pool.query(
      "INSERT INTO users (username, password, balance) VALUES ($1, $2, $3)",
      [username, hashedPassword, 1000]
    );

    res.json({ message: "Bruker registrert med 1000kr startbalanse" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunne ikke registrere bruker" });
  }
});

// login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Ugyldig brukernavn eller passord" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Ugyldig brukernavn eller passord" });
    }

    res.json({ message: "Login successful", username: user.username, balance: user.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverfeil" });
  }
});

/* ---------------- SERVER ---------------- */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server kjører på http://localhost:${PORT}`);
});
