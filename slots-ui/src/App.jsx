import { useMemo, useState, useEffect } from "react";
import "./App.css";
import Login from "./Login";

// Importer symbol-bildene
import nam from "./assets/faces/nam.png";
import emil from "./assets/faces/emil.png";
import henrik from "./assets/faces/henrik.png";
import bilka from "./assets/faces/blika.png";
import wild from "./assets/faces/wild.png";
import scatter from "./assets/faces/scatter.png";

// 🔁 BRUK ENV I STEDET FOR LOCALHOST
const API = import.meta.env.VITE_API_URL; // f.eks. https://slots-api-14gp.onrender.com
// console.log("API base =", API); // (valgfritt) hjelper å verifisere i prod

const SYMBOLS = { nam, emil, henrik, bilka, wild, scatter };
const FIXED_BETS = [2, 5, 10, 20, 50, 100];

function makeStrip(len = 40) {
  const keys = Object.keys(SYMBOLS);
  const arr = [];
  for (let i = 0; i < len; i++) arr.push(keys[i % keys.length]);
  return arr;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [balance, setBalance] = useState(user ? user.balance : 1000);
  const [bet, setBet] = useState(null);
  const [lockedBet, setLockedBet] = useState(null);
  const [freeSpins, setFreeSpins] = useState(0);

  const [resultGrid, setResultGrid] = useState(
    Array.from({ length: 5 }, () => Array(5).fill(""))
  );
  const [spinning, setSpinning] = useState(Array(5).fill(false));
  const [win, setWin] = useState(null);
  const [winningRows, setWinningRows] = useState([]);
  const [error, setError] = useState("");

  const strips = useMemo(() => Array.from({ length: 5 }, () => makeStrip(40)), []);

  useEffect(() => {
    if (user) {
      // 🔹 lagre også balance sammen med brukeren
      localStorage.setItem("user", JSON.stringify({ ...user, balance }));
    }
  }, [user, balance]);

  async function spin() {
    setError("");
    setWin(null);
    setWinningRows([]);

    const activeBet = freeSpins > 0 ? lockedBet : bet;
    const betNum = Number(activeBet);

    if (!betNum) {
      setError("Velg en innsats først!");
      return;
    }
    if (freeSpins <= 0 && betNum > balance) {
      setError("Ikke nok saldo til denne innsatsen.");
      return;
    }

    const betToLockIfFreeSpinsAwarded = betNum;

    if (freeSpins > 0) {
      setFreeSpins((f) => f - 1);
    } else {
      setBalance((b) => b - betNum);
    }

    setSpinning(Array(5).fill(true));
    setResultGrid(Array.from({ length: 5 }, () => Array(5).fill("")));

    let data;
    try {
      const res = await fetch(`${API}/api/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 🔹 sender med brukernavn slik at backend vet hvem som spinner
        body: JSON.stringify({ username: user.username, bet: betNum }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      data = await res.json();
    } catch (e) {
      setSpinning(Array(5).fill(false));
      setError(e.message);
      if (freeSpins <= 0) setBalance((b) => b + betNum);
      return;
    }

    const stopDelays = [1000, 1600, 2200, 2800, 3400];
    [0, 1, 2, 3, 4].forEach((col) => {
      setTimeout(() => {
        setSpinning((prev) => {
          const next = [...prev];
          next[col] = false;
          return next;
        });

        const colSymbols = data.grid.map((row) => row[col]);
        setResultGrid((prev) => {
          const g = prev.map((row) => [...row]);
          for (let r = 0; r < 5; r++) g[r][col] = colSymbols[r];
          return g;
        });

        if (col === 4) {
          setWin(data.win);
          setWinningRows(data.winningRows || []);

          // 🔹 bruk saldoen fra backend hvis den er sendt tilbake
          if (typeof data.balance === "number") {
            setBalance(data.balance);
          } else if (data.win > 0) {
            setBalance((b) => b + data.win);
          }

          if (data.freeSpins > 0) {
            if (freeSpins <= 0) setLockedBet(betToLockIfFreeSpinsAwarded);
            setFreeSpins((f) => f + data.freeSpins);
          } else {
            setFreeSpins((current) => {
              if (current === 0) setLockedBet(null);
              return current;
            });
          }
        }
      }, stopDelays[col]);
    });
  }

  const spinningNow = spinning.some(Boolean);
  const isLocked = freeSpins > 0;
  const disabled = spinningNow || (!isLocked && (!bet || bet > balance));

  function logout() {
    localStorage.removeItem("user");
    setUser(null);
    setBalance(1000);
    setBet(null);
    setLockedBet(null);
    setFreeSpins(0);
    setResultGrid(Array.from({ length: 5 }, () => Array(5).fill("")));
    setWin(null);
    setWinningRows([]); // reset glow/vinnerlinjer
  }

  if (!user) {
    // 🔹 sørger for at vi får med balance fra Login.jsx
    return <Login onLogin={(data) => {
      setUser({ username: data.username });
      setBalance(data.balance);
    }} />;
  }

  return (
    <div className="app-container">
      <div className="slot-box">
        <div className="topbar">
          <div>🎰 Slots Game</div>
          <div className="balance">
            {user.username} | Saldo: <strong>{balance} kr</strong>
          </div>
          <button className="logout-btn" onClick={logout}>Logg ut</button>
        </div>

        <div style={{ marginBottom: 8, opacity: 0.9 }}>
          {freeSpins > 0 ? (
            <span>
              🎁 Free spins igjen: <strong>{freeSpins}</strong>
              {" · "}
              Låst innsats: <strong>{lockedBet} kr</strong>
            </span>
          ) : bet ? (
            <span>Valgt innsats: <strong>{bet} kr</strong></span>
          ) : (
            <span>Velg en innsats under</span>
          )}
        </div>

        <div className="reels reels-5">
          {[0, 1, 2, 3, 4].map((col) => (
            <div key={col} className="reel">
              {spinning[col] ? (
                <div className="reel-window">
                  <div className="reel-track spinning" style={{ animationDuration: `${1 + col * 0.1}s` }}>
                    {strips[col].map((sym, i) => (
                      <div key={i} className="cell">
                        <img src={SYMBOLS[sym]} alt={sym} className="symbol-img" />
                      </div>
                    ))}
                    {strips[col].map((sym, i) => (
                      <div key={`dup-${i}`} className="cell">
                        <img src={SYMBOLS[sym]} alt={sym} className="symbol-img" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="reel-window">
                  <div className="reel-track stopped">
                    {Array.from({ length: 5 }, (_, r) => {
                      const key = resultGrid[r][col];
                      const winInfo = winningRows.find((w) => w.row === r);
                      const shouldGlow = !!winInfo && col < winInfo.streak;

                      return (
                        <div key={r} className={`cell ${shouldGlow ? "win-cell" : ""}`}>
                          {key ? (
                            <img src={SYMBOLS[key]} alt={key} className="symbol-img" />
                          ) : (
                            "❔"
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bet-buttons">
          {FIXED_BETS.map((val) => (
            <button
              key={val}
              disabled={spinningNow || isLocked || (freeSpins <= 0 && val > balance)}
              onClick={() => setBet(val)}
              className={(isLocked ? lockedBet === val : bet === val) ? "active" : ""}
            >
              {val} kr
            </button>
          ))}
        </div>

        <div className="controls">
          <button onClick={spin} disabled={disabled}>
            {spinningNow ? "Spinner..." : "Spin"}
          </button>
        </div>

        {error && <div className="message" style={{ color: "crimson" }}>❌ {error}</div>}
        {(win !== null || freeSpins > 0) && (
          <div className="message">
            {win > 0 ? (
              <strong>🎉 Du vant {win} kr!</strong>
            ) : freeSpins > 0 && lockedBet ? (
              <strong>🎁 Du har vunnet {freeSpins} free spins!</strong>
            ) : (
              <span>Ingen gevinst denne gangen.</span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
