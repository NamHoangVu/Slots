import { useState } from "react";

const API = import.meta.env.VITE_API_URL; // f.eks. https://slots-api-l4gp.onrender.com

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // dersom nettverksfeil (CORS/URL), kaster fetch før res.json()
      if (!res.ok) {
        let msg = "Innlogging feilet";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      onLogin({ username: data.username, balance: data.balance });
    } catch (err) {
      setError(err.message || "Failed to fetch");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        let msg = "Registrering feilet";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      // backend returnerer bare message; startbalanse er 1000 i server
      onLogin({ username, balance: 1000 });
    } catch (err) {
      setError(err.message || "Failed to fetch");
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>🎰 Slots Login</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form>
          <input
            type="text"
            placeholder="Brukernavn"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="login-buttons">
            <button onClick={handleLogin}>Logg inn</button>
            <button onClick={handleRegister}>Registrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
