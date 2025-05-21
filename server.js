const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');
const http = require('http');
const multer = require('multer');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Multer configuratie voor uploads in /public/uploads
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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

// Routes: Home, Login, Register, Logout, Dashboard, etc. (idem aan jouw code)
// Voor kortheid laat ik die hier weg; focus ligt op chat + upload.

// Chat pagina GET
// Homepagina
app.get('/', (req, res) => {
  res.render('index');
});

// Registratiepagina
app.get('/register', (req, res) => {
  res.render('register');
});

// Registratie POST
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  if (users.find(u => u.username === username)) {
    return res.send("Gebruiker bestaat al");
  }
  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed, friends: [], requests: [] });
  saveUsers(users);
  res.redirect('/login');
});

// Loginpagina
app.get('/login', (req, res) => {
  res.render('login');
});

// Login POST
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

// Dashboardpagina (alleen voor ingelogde gebruikers)
app.get('/dashboard', (req, res) => {
  if (!req.session.username) return res.redirect('/login');
  const users = readUsers();
  const me = users.find(u => u.username === req.session.username);

  // Ongelezen berichten tellen
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

// Vriendschapsverzoek sturen
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

// Chatpagina tussen jou en een vriend
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

// Berichten ophalen (fallback)
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

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Dagelijkse verrassing (ingelogd)
app.get('/verrassing', (req, res) => {
  if (!req.session.username) return res.redirect('/login');

  const verrassingen = [
    "Citroenfeit: Citroenen drijven omdat ze een dikke schil met luchtzakjes hebben.",
    "Limonademop: Waarom hield de limonade een speech? Omdat hij bruisend was!",
    "Citroenfeit: In de Middeleeuwen dacht men dat citroen gif kon tegengaan.",
    "Limonademop: Wat zegt de citroen tegen de limonade? Jij bent té zoet!",
    "Citroenfeit: Citroenen bevatten meer suiker dan aardbeien!",
    "Limonademop: Wat doet een citroen in de sportschool? Zich uitpersen!"
  ];

  const today = new Date().getDate();
  const verrassing = verrassingen[today % verrassingen.length];
  res.render('verrassing', { verrassing });
});

// Dynamische pagina's (controle op bestaan van EJS-bestand of index.ejs)
app.get('/*', (req, res) => {
  const urlPath = req.path;
  const parts = urlPath.split('/').filter(Boolean);
  let filePath = path.join(__dirname, 'views', ...parts) + '.ejs';

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      res.render(parts.join('/'));
    } else {
      let folderPath = path.join(__dirname, 'views', ...parts, 'index.ejs');
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

// 404 fallback
app.use((req, res) => {
  res.status(404).render('404');
});

// Socket.IO voor real-time chat
io.on('connection', socket => {
  socket.on('join', username => {
    socket.join(username);
  });

  socket.on('send-message', data => {
    const { from, to, text, file } = data;
    const messages = readMessages();
    const message = { from, to, time: new Date().toISOString() };
    if (text) message.text = text;
    if (file) message.file = file;
    messages.push(message);
    saveMessages(messages);
    io.to(to).emit('receive-message', message);
    io.to(from).emit('receive-message', message);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server draait op http://localhost:${PORT}`));
