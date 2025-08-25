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
  password: "vietnam123", // ← sett inn passordet ditt her
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
app.post("/api/slots", (req, res) => {
  const { bet } = req.body;
  if (!bet || bet <= 0) return res.status(400).json({ error: "Ugyldig innsats" });

  const grid = spinSlots();
  const { win, bonus, freeSpins, winningRows } = calculateWin(grid, bet);

  res.json({ grid, win, bonus, freeSpins, winningRows });
});

/* ---------------- USER API ---------------- */

// registrer bruker
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Mangler brukernavn eller passord" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, balance",
      [username, hashed]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      res.status(400).json({ error: "Brukernavn allerede i bruk" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Noe gikk galt" });
    }
  }
});

// login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Mangler brukernavn eller passord" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Feil brukernavn eller passord" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Feil brukernavn eller passord" });
    }

    res.json({ id: user.id, username: user.username, balance: user.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Noe gikk galt" });
  }
});

// hent saldo og info
app.get("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, username, balance, created_at FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bruker ikke funnet" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Noe gikk galt" });
  }
});

/* ---------------- START SERVER ---------------- */

app.listen(3000, () => {
  console.log("Slots server running on http://localhost:3000");
});
