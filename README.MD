# 🎰 Slots Game

Slots Game er et **fullstack hobbyprosjekt** hvor brukere kan registrere seg, logge inn, spinne hjulene for lekepenger og se sin spillhistorikk.  
Prosjektet er laget for å utforske **webutvikling med React, Node.js/Express og PostgreSQL**.

---

## 📂 Prosjektstruktur

```
SLOTSGAME/
│
├── games/              # Spill-logikk (slots-mekanikk)
│
├── slots-ui/           # Frontend (React)
│
├── server.js           # Backend server (Express + PostgreSQL)
├── package.json        # Backend avhengigheter
├── package-lock.json
├── .gitignore
└── README.md           # Dokumentasjon
```

---

## ⚙️ Teknologier

- **Frontend:** React (JavaScript, Vite/CRA)  
- **Backend:** Node.js + Express  
- **Database:** PostgreSQL  
- **Autentisering:** Egen login/registrering med sessions/tokens  
- **State-håndtering:** Saldo og spillhistorikk lagres per bruker  

---

## 🚀 Kom i gang

### 1. Klon prosjektet
```bash
git clone <repo-url>
cd SLOTSGAME
```

### 2. Installer avhengigheter
Installer både for backend og frontend:
```bash
npm install
cd slots-ui
npm install
```

### 3. Konfigurer database
Opprett en PostgreSQL-database, og legg inn tilkoblingsinformasjon i et `.env`-fil:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=din_bruker
DB_PASSWORD=passord
DB_NAME=slotsgame
```

Kjør migrasjoner / opprett tabeller:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  balance INT DEFAULT 1000
);

CREATE TABLE spins (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  result VARCHAR(255),
  win_amount INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Start backend
```bash
npm start
```
Server kjører på `http://localhost:3000`.

### 5. Start frontend
```bash
cd slots-ui
npm start
```
Frontend kjører på `http://localhost:5173` (eller den porten Vite/CRA velger).

---

## 🕹️ Funksjonalitet

- 🔑 **Brukerhåndtering** – registrering, innlogging og saldo lagret i databasen  
- 🎰 **Spillmekanikk** – spin hjulene og vinn/tap basert på tilfeldige resultater  
- 🏆 **Scatter-bonus** – mulighet for gratis spins  
- 💰 **Saldo** – oppdatert fortløpende og lagret i PostgreSQL  
- 📊 **Spillhistorikk** – logg over tidligere spins  

---

## 📌 Videre arbeid

- 🌐 Distribuere backend og frontend i sky (Heroku, Vercel, Render)  
- 🖼️ Bedre UI/UX med animasjoner  
- 📈 Leaderboard mellom spillere  
- 🔒 JWT-basert autentisering  

---

## 👨‍💻 Om prosjektet

Dette prosjektet er utviklet som et **hobbyprosjekt** for å lære mer om:  

- Fullstack utvikling  
- Databaser (PostgreSQL)  
- Autentisering og state-håndtering  
- Interaksjon mellom backend og frontend  

---

✨ Feel free to clone, teste og bygge videre!
