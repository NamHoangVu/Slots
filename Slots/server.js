// server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { spinSlots, calculateWin } = require("./games/slots");
const { Pool } = require("pg");

// (valgfritt lokalt) last .env hvis den finnes
try { require("dotenv").config(); } catch { /* ignore */ }

const app = express();
app.use(express.json());

/* ---------------- CORS ---------------- */
// Tillat lokal utvikling + din GitHub Pages
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://namhoangvu.github.io", // GitHub Pages (repo: NamHoangVu/Slots)
]);

app.use(
  cors({
    origin: (origin, cb) => {
      // tillat verktøy/CLI som mangler Origin
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

/* ---------------- PostgreSQL pool ---------------- */
const isProd = process.env.NODE_ENV === "production";

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        // Render/Neon krever ofte SSL i prod
        ssl: isProd ? { rejectUnauthorized: false } : false,
      }
    : {
        // Fallback til lokal utvikling
        user: process.env.PGUSER || "postgres",
        host: process.env.PGHOST || "localhost",
        database: process.env.PGDATABASE || "slotsdb",
        password: process.env.PGPASSWORD || "vietnam123",
        port: Number(process.env.PGPORT || 5432),
      }
);

pool
  .connect()
  .then((client) => {
    client.release();
    console.log("✅ Connected to PostgreSQL");
  })
  .catch((err) => console.error("❌ DB connection error:", err));

/* ---------------- HEALTH / ROOT ---------------- */
app.get("/", (req, res) => {
  res.send("Slots API kjører 🎰 Bruk POST /api/slots med { bet }");
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ---------------- SLOT API ---------------- */

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

    let balance = Number(userResult.rows[0].balance) || 0;

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
    // sjekk om finnes fra før
    const exists = await pool.query("SELECT 1 FROM users WHERE username = $1", [username]);
    if (exists.rowCount > 0) {
      return res.status(409).json({ error: "Brukernavn er allerede tatt" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // start-balance = 1000
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
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`🚀 Server lytter på port ${PORT} (NODE_ENV=${process.env.NODE_ENV || "development"})`);
});
