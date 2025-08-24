// games/slots.js
// Symbolnøkler må matche frontenden
const ALL = ["nam", "emil", "henrik", "bilka", "cat", "wild", "scatter"];

// Fisher–Yates shuffle
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
  return shuffle(strip); // 👈 stokker rekkefølgen!
}

// Hjul (reels) – sjeldne symboler har lav vekt
const REELS = [
  buildStrip({ nam: 28, emil: 28, henrik: 26, bilka: 26, cat: 5, wild: 3, scatter: 4 }),
  buildStrip({ nam: 26, emil: 28, henrik: 28, bilka: 26, cat: 5, wild: 3, scatter: 4 }),
  buildStrip({ nam: 28, emil: 26, henrik: 28, bilka: 26, cat: 5, wild: 3, scatter: 4 }),
  buildStrip({ nam: 27, emil: 27, henrik: 27, bilka: 25, cat: 5, wild: 3, scatter: 4 }),
  buildStrip({ nam: 26, emil: 26, henrik: 28, bilka: 28, cat: 5, wild: 3, scatter: 4 }),
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

// Payouts
const PAY = { 3: 2, 4: 5, 5: 10 };

// Gevinstlogikk: kun fra venstre, wild erstatter, scatter gir free spins, cat har bonus/jackpot
function calculateWin(grid, bet) {
  let win = 0;
  let bonus = false;
  let freeSpins = 0;
  const winningRows = [];

  // Scatter: 3+ hvor som helst
  const scatterCount = grid.flat().filter((s) => s === "scatter").length;
  if (scatterCount >= 3) freeSpins = 5;

  for (let r = 0; r < 5; r++) {
    let symbol = grid[r][0];
    if (symbol === "scatter") continue;

    let streak = 1;
    for (let c = 1; c < 5; c++) {
      const cur = grid[r][c];
      if (cur === "scatter") break;

      const matches = cur === symbol || cur === "wild" || symbol === "wild";
      if (matches) {
        if (symbol === "wild" && cur !== "wild") symbol = cur; // wild adopterer
        streak++;
      } else break;
    }

    if (streak >= 3) {
      let lineWin = 0;
      if (symbol === "cat") {
        bonus = true;
        if (streak >= 5) lineWin += bet * 100;            // JACKPOT
        else lineWin += bet * (streak === 3 ? PAY[3] : PAY[4]) + bet * 5; // cat-bonus
      } else {
        lineWin += bet * PAY[Math.min(streak, 5)];
      }
      win += lineWin;
      winningRows.push({ row: r, symbol, streak, lineWin });
    }
  }

  return { win, bonus, freeSpins, winningRows };
}

module.exports = { spinSlots, calculateWin };
