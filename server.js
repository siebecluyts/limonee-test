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

// Setup
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

// Bestanden
const USERS_FILE = path.join(__dirname, 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Helperfuncties
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readMessages() {
  if (!fs.existsSync(MESSAGES_FILE)) return [];
  return JSON.parse(fs.readFileSync(MESSAGES_FILE));
}

function saveMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

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
  const messages = readMessages();
  const newMessageCounts = {};
  me.friends.forEach(friend => {
    newMessageCounts[friend] = messages.filter(m => m.from === friend && m.to === me.username).length;
  });

  res.render('dashboard', {
    username: me.username,
    friends: me.friends,
    requests: me.requests,
    error: null,
    newMessageCounts
  });
});

// Vriendschapsverzoeken
app.post('/friend-request', (req, res) => {
  const sender = req.session.username;
  const { receiver } = req.body;
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
  const users = readUsers();
  const me = users.find(u => u.username === receiver);
  const other = users.find(u => u.username === sender);

  me.requests = me.requests.filter(r => r !== sender);
  if (!me.friends.includes(sender)) me.friends.push(sender);
  if (!other.friends.includes(receiver)) other.friends.push(receiver);

  saveUsers(users);
  res.redirect('/dashboard');
});

app.post('/decline-friend', (req, res) => {
  const { sender } = req.body;
  const users = readUsers();
  const me = users.find(u => u.username === req.session.username);
  me.requests = me.requests.filter(r => r !== sender);
  saveUsers(users);
  res.redirect('/dashboard');
});

// Chat
app.get('/chat/:friend', (req, res) => {
  const me = req.session.username;
  const friend = req.params.friend;
  const users = readUsers();
  const user = users.find(u => u.username === me);
  if (!user.friends.includes(friend)) return res.send("Geen toegang");

  const messages = readMessages().filter(
    m => (m.from === me && m.to === friend) || (m.from === friend && m.to === me)
  );

  res.render('chat', { friend, messages });
});

// Socket.IO
io.on('connection', socket => {
  socket.on('join', username => socket.join(username));
  socket.on('send-message', data => {
    const { from, to, text } = data;
    const message = { from, to, text, time: new Date().toISOString() };
    const messages = readMessages();
    messages.push(message);
    saveMessages(messages);
    io.to(to).emit('receive-message', message);
    io.to(from).emit('receive-message', message);
  });
});

app.get('/messages/:friend', (req, res) => {
  const me = req.session.username;
  const friend = req.params.friend;
  const messages = readMessages().filter(
    m => (m.from === me && m.to === friend) || (m.from === friend && m.to === me)
  );
  res.send(messages.map(m =>
    `<p><strong>${m.from}:</strong> ${m.text} <small>(${new Date(m.time).toLocaleTimeString()})</small></p>`
  ).join(''));
});

// Dagelijkse verrassing
const verrassingen = [
  "Citroenfeit: Citroenen drijven omdat ze een dikke schil met luchtzakjes hebben.",
  "Limonademop: Waarom hield de limonade een speech? Omdat hij bruisend was!",
  "Citroenfeit: In de Middeleeuwen dacht men dat citroen gif kon tegengaan.",
  "Limonademop: Wat zegt de citroen tegen de limonade? Jij bent té zoet!",
  "Citroenfeit: Citroenen bevatten meer suiker dan aardbeien!",
  "Limonademop: Wat doet een citroen in de sportschool? Zich uitpersen!"
];

app.get('/verrassing', (req, res) => {
  if (!req.session.username) return res.redirect('/login');
  const today = new Date().toISOString().slice(0, 10);
  const dayIndex = new Date(today).getDate() % verrassingen.length;
  const verrassing = verrassingen[dayIndex];
  res.render('verrassing', { verrassing });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Dynamische route
app.get('/*', (req, res) => {
  const parts = req.path.split('/').filter(Boolean);
  const filePath = path.join(__dirname, 'views', ...parts) + '.ejs';
  const folderPath = path.join(__dirname, 'views', ...parts, 'index.ejs');

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      res.render(parts.join('/'));
    } else {
      fs.access(folderPath, fs.constants.F_OK, (folderErr) => {
        if (!folderErr) {
          res.render(path.join(parts.join('/'), 'index'));
        } else {
          res.status(404).render('404');
        }
      });
    }
  });
});

// Fallback 404
app.use((req, res) => res.status(404).render('404'));

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server draait op http://localhost:${PORT}`));
