// server.js
const express = require("express");
const cors = require("cors");
const { spinSlots, calculateWin } = require("./games/slots");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" })); // Vite

app.get("/", (_req, res) => {
  res.send("Slots API kjører — bruk POST /api/slots med { bet }");
});

app.post("/api/slots", (req, res) => {
  const { bet } = req.body || {};
  const betNum = Number(bet);
  if (!betNum || betNum <= 0) {
    return res.status(400).json({ error: "Ugyldig bet" });
  }

  const grid = spinSlots();
  const { win, bonus, freeSpins, winningRows } = calculateWin(grid, betNum);
  res.json({ grid, win, bonus, freeSpins, winningRows });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Slots server running on http://localhost:${PORT}`);
});
