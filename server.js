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

// Home
app.get('/', (req, res) => res.render('index'));

// Registratie
app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  if (users.find(u => u.username === username)) return res.send("Gebruiker bestaat al");
  const banned = readBanned();
  if (banned.includes(username)) return res.send("Je bent geblokkeerd en kan niet registreren.");

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

// Ban/unban routes — Alleen SiebeCluyts mag bannen
app.get('/banlist', (req, res) => {
  if (req.session.username !== 'SiebeCluyts') return res.status(403).send("Geen toegang");
  const banned = readBanned();
  res.render('banlist', { banned });
});

app.post('/ban', (req, res) => {
  if (req.session.username !== 'SiebeCluyts') return res.status(403).send("Geen toegang");
  const { username } = req.body;
  if (!username) return res.redirect('/banlist');

  const banned = readBanned();
  if (!banned.includes(username)) {
    banned.push(username);
    saveBanned(banned);
  }
  res.redirect('/banlist');
});

app.post('/unban', (req, res) => {
  if (req.session.username !== 'SiebeCluyts') return res.status(403).send("Geen toegang");
  const { username } = req.body;
  if (!username) return res.redirect('/banlist');

  let banned = readBanned();
  banned = banned.filter(u => u !== username);
  saveBanned(banned);
  res.redirect('/banlist');
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.username) return res.redirect('/login');

  const users = readUsers();
  const me = users.find(u => u.username === req.session.username);
  if (!me) return res.redirect('/login');

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
    isSiebe: me.username === 'SiebeCluyts' // Voor conditional rendering in dashboard.ejs
  });
});

// Secret userslist beheerpagina, alleen voor SiebeCluyts
app.get('/userslist', (req, res) => {
  if (req.session.username !== 'SiebeCluyts') return res.status(403).send('Geen toegang');

  const users = readUsers();
  res.render('userslist', { users });
});

app.post('/userslist/update', async (req, res) => {
  if (req.session.username !== 'SiebeCluyts') return res.status(403).send('Geen toegang');

  const { username, newUsername, newPassword, newFriends } = req.body;
  const users = readUsers();
  const index = users.findIndex(u => u.username === username);
  if (index === -1) return res.status(404).send('Gebruiker niet gevonden');

  users[index].username = newUsername;

  if (newPassword && newPassword.trim() !== '') {
    users[index].password = await bcrypt.hash(newPassword, 10);
  }

  try {
    users[index].friends = JSON.parse(newFriends);
  } catch {
    return res.status(400).send('Vrienden moeten geldig JSON-array zijn');
  }

  saveUsers(users);
  res.redirect('/userslist');
});

// Friend requests
app.post('/friend-request', (req, res) => {
  const { receiver } = req.body;
  const sender = req.session.username;
  if (!sender) return res.redirect('/login');

  const users = readUsers();
  const me = users.find(u => u.username === sender);
  const target = users.find(u => u.username === receiver);

  if (!target || sender === receiver) {
    return res.render('dashboard', {
      username: me.username,
      friends: me.friends,
      requests: me.requests,
      error: "Gebruiker bestaat niet."
    });
  }

  if (!target.requests.includes(sender) && !target.friends.includes(sender)) {
    target.requests.push(sender);
    saveUsers(users);
  }

  res.redirect('/dashboard');
});

app.post('/accept-friend', (req, res) => {
  const { sender } = req.body;
  const receiver = req.session.username;
  if (!receiver) return res.redirect('/login');

  const users = readUsers();
  const me = users.find(u => u.username === receiver);
  const other = users.find(u => u.username === sender);

  if (!other || !me.requests.includes(sender)) return res.send("Verzoek niet gevonden");

  me.requests = me.requests.filter(r => r !== sender);
  if (!me.friends.includes(sender)) me.friends.push(sender);
  if (!other.friends.includes(receiver)) other.friends.push(receiver);

  saveUsers(users);
  res.redirect('/dashboard');
});

app.post('/decline-friend', (req, res) => {
  const { sender } = req.body;
  const me = req.session.username;
  if (!me) return res.redirect('/login');

  const users = readUsers();
  const user = users.find(u => u.username === me);
  user.requests = user.requests.filter(r => r !== sender);
  saveUsers(users);
  res.redirect('/dashboard');
});

// Chat
app.get('/chat/:friend', (req, res) => {
  const me = req.session.username;
  const { friend } = req.params;
  const users = readUsers();
  const user = users.find(u => u.username === me);
  if (!user || !user.friends.includes(friend)) return res.send("Geen toegang");

  const messages = readMessages().filter(
    m => (m.from === me && m.to === friend) || (m.from === friend && m.to === me)
  );

  res.render('chat', { friend, messages });
});

io.on('connection', socket => {
  socket.on('join', username => {
    socket.join(username);
  });

  socket.on('send-message', data => {
    const { from, to, text } = data;
    const messages = readMessages();
    const message = { from, to, text, time: new Date().toISOString() };
    messages.push(message);
    saveMessages(messages);
    io.to(to).emit('receive-message', message);
    io.to(from).emit('receive-message', message);
  });
});

// Uitloggen
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server gestart op poort ${PORT}`);
});
