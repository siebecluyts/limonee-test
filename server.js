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

// Zorg dat 'user' beschikbaar is in elke view
app.use((req, res, next) => {
  res.locals.user = req.session.username || null;
  next();
});

// Bestandspaden
const USERS_FILE = path.join(__dirname, 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// JSON helpers
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE);
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Fout bij lezen van users.json:", err);
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

function saveMessages(msgs) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(msgs, null, 2));
}

// Home
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => res.render('register'));

// Registratie
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = readUsers();
    if (users.find(u => u.username === username)) {
      return res.send("Gebruiker bestaat al");
    }
    const hashed = await bcrypt.hash(password, 10);
    users.push({ username, password: hashed, friends: [], requests: [] });
    saveUsers(users);
    res.redirect('/login');
  } catch (err) {
    console.error("Registratiefout:", err);
    res.status(500).send("Er is iets misgegaan tijdens registratie.");
  }
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

  // Bereken ongelezen berichten per vriend
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
    newMessageCounts // 👈 Zorg dat dit wordt meegegeven
  });
});

// Vriendschapsverzoek versturen
app.post('/friend-request', (req, res) => {
  const { receiver } = req.body;
  const sender = req.session.username;
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

// Vriendschapsverzoek accepteren
app.post('/accept-friend', (req, res) => {
  const { sender } = req.body;
  const receiver = req.session.username;
  const users = readUsers();
  const me = users.find(u => u.username === receiver);
  const other = users.find(u => u.username === sender);

  if (!other || !me.requests.includes(sender)) {
    return res.send("Verzoek niet gevonden");
  }

  me.requests = me.requests.filter(r => r !== sender);
  if (!me.friends.includes(sender)) me.friends.push(sender);
  if (!other.friends.includes(receiver)) other.friends.push(receiver);

  saveUsers(users);
  res.redirect('/dashboard');
});

// Vriendschapsverzoek afwijzen
app.post('/decline-friend', (req, res) => {
  const { sender } = req.body;
  const me = req.session.username;
  const users = readUsers();
  const user = users.find(u => u.username === me);
  user.requests = user.requests.filter(r => r !== sender);
  saveUsers(users);
  res.redirect('/dashboard');
});

// Chatpagina
app.get('/chat/:friend', (req, res) => {
  const me = req.session.username;
  const { friend } = req.params;
  const users = readUsers();
  const user = users.find(u => u.username === me);
  if (!user.friends.includes(friend)) return res.send("Geen toegang");

  const messages = readMessages().filter(
    m => (m.from === me && m.to === friend) || (m.from === friend && m.to === me)
  );

  res.render('chat', { friend, messages });
});

// Socket.IO realtime chat
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

    // Verstuur bericht naar ontvanger
    io.to(to).emit('receive-message', message);

    // Verstuur bericht ook naar zender voor directe weergave
    io.to(from).emit('receive-message', message);
  });
});

// Berichten ophalen als fallback
app.get('/messages/:friend', (req, res) => {
  const me = req.session.username;
  const friend = req.params.friend;
  const messages = readMessages().filter(
    m => (m.from === me && m.to === friend) || (m.from === friend && m.to === me)
  );
  const html = messages.map(m =>
    <p><strong>${m.from}:</strong> ${m.text} <small>(${new Date(m.time).toLocaleTimeString()})</small></p>
  ).join('');
  res.send(html);
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Homepagina
app.get('/', (req, res) => {
  res.render('index');
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

  // Selecteer een verrassing per dag
  const today = new Date().toISOString().slice(0, 10); // bv. "2025-05-15"
  const dayIndex = new Date(today).getDate() % verrassingen.length;
  const verrassing = verrassingen[dayIndex];

  res.render('verrassing', { verrassing });
});

// Dynamische route
app.get('/*', (req, res) => {
  const urlPath = req.path; // bijvoorbeeld: /about/personen
  const parts = urlPath.split('/').filter(Boolean); // ['about', 'personen']

  // Eerste: check of er een .ejs file direct bestaat
  let filePath = path.join(__dirname, 'views', ...parts) + '.ejs';

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      // Bestaat direct als bestand
      res.render(parts.join('/'));
    } else {
      // Tweede: check of het een map is met index.ejs erin
      let folderPath = path.join(__dirname, 'views', ...parts, 'index.ejs');
      fs.access(folderPath, fs.constants.F_OK, (folderErr) => {
        if (!folderErr) {
          // Bestaat als map/index.ejs
          res.render(path.join(parts.join('/'), 'index'));
        } else {
          // Bestaat niet -> 404
          res.status(404).render('404');
        }
      });
    }
  });
});
// 404 fallback
app.use((req, res) => res.status(404).render('404'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server draait op http://localhost:${PORT}`);
