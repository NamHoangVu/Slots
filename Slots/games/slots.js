// games/slots.js
// Symbolnøkler må matche frontenden (cat er fjernet)
const ALL = ["nam", "emil", "henrik", "bilka", "wild", "scatter"];

// Fisher–Yates shuffle for å unngå mønstre i stripene
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Bygg en vektet strip (jo høyere count, jo oftere symbolet vises)
function buildStrip(weights) {
  const strip = [];
  for (const [sym, count] of Object.entries(weights)) {
    for (let i = 0; i < count; i++) strip.push(sym);
  }
  return shuffle(strip);
}

/**
 * Hjul (reels) – vanlige symboler like vanlige, wild/scatter litt sjeldnere.
 * Justér tallene om du vil endre RTP/volatilitet.
 */
const REELS = [
  buildStrip({ nam: 28, emil: 28, henrik: 28, bilka: 28, wild: 5, scatter: 5 }),
  buildStrip({ nam: 29, emil: 27, henrik: 28, bilka: 28, wild: 5, scatter: 5 }),
  buildStrip({ nam: 28, emil: 29, henrik: 27, bilka: 28, wild: 5, scatter: 5 }),
  buildStrip({ nam: 28, emil: 28, henrik: 29, bilka: 27, wild: 5, scatter: 5 }),
  buildStrip({ nam: 27, emil: 28, henrik: 28, bilka: 29, wild: 5, scatter: 5 }),
];

// 5x5 grid ved å stoppe hvert hjul på tilfeldig indeks og lese 5 sammenhengende symboler
function spinSlots() {
  const rows = 5;
  const cols = 5;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));

  for (let c = 0; c < cols; c++) {
    const strip = REELS[c];
    const stop = Math.floor(Math.random() * strip.length);
    for (let r = 0; r < rows; r++) {
      grid[r][c] = strip[(stop + r) % strip.length];
    }
  }
  return grid;
}

// Payouts (multiplikatorer av innsats)
const PAY = { 3: 2, 4: 5, 5: 10 };

/**
 * Gevinstlogikk:
 * - Kun sekvens FRA VENSTRE teller (klassisk line 1).
 * - Wild kan erstatte hvilket som helst symbol i sekvensen.
 * - Scatter teller ikke i linjer, men 3+ hvor som helst gir free spins.
 * - bonus-feltet beholdes for frontend-kompatibilitet (er alltid false nå).
 */
function calculateWin(grid, bet) {
  let win = 0;
  let bonus = false; // cat er fjernet
  let freeSpins = 0;
  const winningRows = [];

  // Scatter: 3+ hvor som helst
  const scatterCount = grid.flat().filter((s) => s === "scatter").length;
  if (scatterCount >= 3) freeSpins = 5; // evt. justér

  // Hver rad: sekvens fra venstre, wild kan erstatte, scatter bryter linje
  for (let r = 0; r < 5; r++) {
    let symbol = grid[r][0];
    if (symbol === "scatter") continue; // scatter kan ikke starte en linje

    let streak = 1;
    for (let c = 1; c < 5; c++) {
      const cur = grid[r][c];
      if (cur === "scatter") break; // scatter bryter linjen

      const matches = cur === symbol || cur === "wild" || symbol === "wild";
      if (matches) {
        // Hvis første hittil er wild og vi ser et ekte symbol, lås inn det
        if (symbol === "wild" && cur !== "wild") symbol = cur;
        streak++;
      } else {
        break;
      }
    }

    if (streak >= 3) {
      const lineWin = bet * PAY[Math.min(streak, 5)];
      win += lineWin;
      winningRows.push({ row: r, symbol, streak, lineWin });
    }
  }

  return { win, bonus, freeSpins, winningRows };
}

module.exports = { spinSlots, calculateWin };
