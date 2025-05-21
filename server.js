const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'geheim',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.user = req.session.username || null;
  next();
});

const USERS_FILE = path.join(__dirname, 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const BANNED_FILE = path.join(__dirname, 'banned.json');

// Helpers
function readJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const data = fs.readFileSync(file);
    return JSON.parse(data);
  } catch (e) {
    console.error(`Fout bij lezen van ${file}:`, e);
    return fallback;
  }
}
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const readUsers = () => readJSON(USERS_FILE, []);
const saveUsers = (data) => saveJSON(USERS_FILE, data);
const readMessages = () => readJSON(MESSAGES_FILE, []);
const saveMessages = (data) => saveJSON(MESSAGES_FILE, data);
const readBanned = () => readJSON(BANNED_FILE, []);
const saveBanned = (data) => saveJSON(BANNED_FILE, data);

// --- Routes ---

// Home
app.get('/', (req, res) => res.render('index'));

// Registratie
app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  if (users.find(u => u.username === username)) return res.send("Gebruiker bestaat al");
  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed, friends: [], requests: [] });
  saveUsers(users);
  res.redirect('/login');
});

// Login
app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const banned = readBanned();
  if (banned.includes(username)) return res.send("Je bent geblokkeerd.");

  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.send("Gebruiker niet gevonden");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send("Wachtwoord onjuist");

  req.session.username = username;
  res.redirect('/dashboard');
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.username) return res.redirect('/login');

  const users = readUsers();
  const me = users.find(u => u.username === req.session.username);
  if (!me) return res.redirect('/login');

  // Check of admin
  const isSiebe = me.username === 'SiebeCluyts';

  // Nieuw bericht telling
  const messages = readMessages();
  const newMessageCounts = {};
  me.friends.forEach(friend => {
    const unread = messages.filter(m => m.from === friend && m.to === me.username);
    newMessageCounts[friend] = unread.length;
  });

  res.render('dashboard', {
    username: me.username,
    friends: me.friends,
    requests: me.requests,
    error: null,
    newMessageCounts,
    isSiebe
  });
});

// Admin: Gebruikerslijst bekijken en bewerken (alleen SiebeCluyts)
app.get('/userslist', (req, res) => {
  if (req.session.username !== 'SiebeCluyts') return res.status(403).send('Geen toegang');

  const users = readUsers();
  res.render('userslist', { users });
});

// Admin: Gebruiker bewerken (wachtwoord en vrienden)
app.post('/userslist/edit', async (req, res) => {
  if (req.session.username !== 'SiebeCluyts') return res.status(403).send('Geen toegang');

  const { username, newPassword, friendsCSV } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).send('Gebruiker niet gevonden');

  if (newPassword && newPassword.trim() !== '') {
    user.password = await bcrypt.hash(newPassword, 10);
  }
  // Vrienden updaten (CSV naar array)
  if (friendsCSV !== undefined) {
    user.friends = friendsCSV.split(',').map(f => f.trim()).filter(f => f.length > 0 && f !== username);
  }

  saveUsers(users);
  res.redirect('/userslist');
});

// Admin: Banlijst bekijken (alleen SiebeCluyts)
app.get('/banlist', (req, res) => {
  if (req.session.username !== 'SiebeCluyts') return res.status(403).send('Geen toegang');

  const banned = readBanned();
  res.render('banlist', { banned });
});

// Admin: User bannen
app.post('/banlist/ban', (req, res) => {
  if (req.session.username !== 'SiebeCluyts') return res.status(403).send('Geen toegang');

  const { username } = req.body;
  if (!username) return res.redirect('/banlist');

  const banned = readBanned();
  if (!banned.includes(username)) {
    banned.push(username);
    saveBanned(banned);
  }
  res.redirect('/banlist');
});

// Admin: User unbannen
app.post('/banlist/unban', (req, res) => {
  if (req.session.username !== 'SiebeCluyts') return res.status(403).send('Geen toegang');

  const { username } = req.body;
  if (!username) return res.redirect('/banlist');

  let banned = readBanned();
  banned = banned.filter(u => u !== username);
  saveBanned(banned);
  res.redirect('/banlist');
});

// Friend requests, accept, decline (zoals eerder)
// ... (je huidige code, ongewijzigd)

// Chat routes, socket.io (zoals eerder)
// ... (je huidige code, ongewijzigd)

// Verrassing, dynamische routes, fallback
// ... (je huidige code, ongewijzigd)

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server draait op http://localhost:${PORT}`));
