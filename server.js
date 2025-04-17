const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const usersFile = path.join(__dirname, 'users.json');

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: 'limonee-secret-key',
  resave: false,
  saveUninitialized: true
}));

// 🟢 API om badges van de ingelogde gebruiker op te halen
app.get('/api/badges', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Niet ingelogd' });
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const user = users.find(u => u.username === req.session.user);
  if (!user) return res.status(404).json({ error: 'Gebruiker niet gevonden' });
  res.json({ badges: user.badges || [] });
});

// 🟢 API om een badge toe te voegen aan ingelogde gebruiker
app.post('/api/badges', (req, res) => {
  const { badge } = req.body;
  if (!req.session.user) return res.status(401).json({ error: 'Niet ingelogd' });

  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const user = users.find(u => u.username === req.session.user);
  if (!user) return res.status(404).json({ error: 'Gebruiker niet gevonden' });

  if (!user.badges.includes(badge)) {
    user.badges.push(badge);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  }

  res.json({ success: true });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '/404.html'));
});

// Start de server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
