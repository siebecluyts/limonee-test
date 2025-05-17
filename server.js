import express from 'express';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import bcrypt from 'bcrypt';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Express config
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

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/register', (req, res) => res.render('register'));

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

app.get('/dashboard', (req, res) => {
  if (!req.session.username) return res.redirect('/login');
  const users = readUsers();
  const me = users.find(u => u.username === req.session.username);
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
    newMessageCounts
  });
});

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

app.post('/decline-friend', (req, res) => {
  const { sender } = req.body;
  const me = req.session.username;
  const users = readUsers();
  const user = users.find(u => u.username === me);
  user.requests = user.requests.filter(r => r !== sender);
  saveUsers(users);
  res.redirect('/dashboard');
});

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

app.get('/messages/:friend', (req, res) => {
  const me = req.session.username;
  const friend = req.params.friend;
  const messages = readMessages().filter(
    m => (m.from === me && m.to === friend) || (m.from === friend && m.to === me)
  );
  const html = messages.map(m =>
    `<p><strong>${m.from}:</strong> ${m.text} <small>(${new Date(m.time).toLocaleTimeString()})</small></p>`
  ).join('');
  res.send(html);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

const verrassingen = [
  "Citroenfeit: Citroenen drijven omdat ze een dikke schil met luchtzakjes hebben.",
  "Limonademop: Waarom hield de limonade een speech? Omdat hij bruisend was!",
  "Citroenfeit: In de Middeleeuwen dacht men dat citroen gif kon tegengaan.",
  "Limonademop: Wat zegt de citroen tegen de limonade? Jij bent té zoet!",
  "Citroenfeit: Citroenen bevatten meer suiker dan aardbeien!",
  "Limonademop: Wat doet een citroen in de sportschool? Zich uitpersen!"
];

app.get('/verrassing', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const today = new Date().toISOString().slice(0, 10);
  const dayIndex = new Date(today).getDate() % verrassingen.length;
  const verrassing = verrassingen[dayIndex];
  res.render('verrassing', { verrassing });
});

app.get('/*', (req, res) => {
  const urlPath = req.path;
  const parts = urlPath.split('/').filter(Boolean);
  let filePath = path.join(__dirname, 'views', ...parts) + '.ejs';

  fs.access(filePath, fs.constants.F_OK, err => {
    if (!err) {
      res.render(parts.join('/'));
    } else {
      let folderPath = path.join(__dirname, 'views', ...parts, 'index.ejs');
      fs.access(folderPath, fs.constants.F_OK, folderErr => {
        if (!folderErr) {
          res.render(path.join(parts.join('/'), 'index'));
        } else {
          res.status(404).render('404');
        }
      });
    }
  });
});

app.use((req, res) => res.status(404).render('404'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server draait op http://localhost:${PORT}`));
