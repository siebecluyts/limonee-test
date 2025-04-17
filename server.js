const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const usersFile = path.join(__dirname, 'users.json');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'limonee-secret-key',
  resave: false,
  saveUninitialized: true
}));

// ✅ Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    req.session.user = username;
    res.redirect('/'); // Ga naar homepage
  } else {
    res.status(401).send('Ongeldige login');
  }
});

// ✅ Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ✅ API om huidige gebruiker op te vragen
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user });
  } else {
    res.json({ username: null });
  }
});

// ✅ Badges ophalen
app.get('/api/badges', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Niet ingelogd' });
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const user = users.find(u => u.username === req.session.user);
  if (!user) return res.status(404).json({ error: 'Gebruiker niet gevonden' });
  res.json({ badges: user.badges || [] });
});

// ✅ Badge toevoegen
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
// ✅ Register route
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Gebruikersnaam en wachtwoord zijn verplicht.');
  }

  let users = [];
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  }

  const userExists = users.find(u => u.username === username);
  if (userExists) {
    return res.status(400).send('Gebruiker bestaat al.');
  }

  const newUser = { username, password, badges: [] };
  users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  req.session.user = username; // Automatisch inloggen na registreren
  res.redirect('/'); // Terug naar homepage
});

// ✅ Profielpagina als aparte route (optioneel)
app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/'); // Of naar loginpagina
  }
  res.sendFile(path.join(__dirname, 'public/profile.html'));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '/404.html'));
});

// Start de server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
