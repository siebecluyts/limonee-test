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
app.get('/chat/:friend', (req, res) => {
  if (!req.session.username) return res.redirect('/login');

  const me = req.session.username;
  const friend = req.params.friend;
  const users = readUsers();
  const user = users.find(u => u.username === me);

  if (!user.friends.includes(friend)) return res.send("Geen toegang");

  const messages = readMessages().filter(
    m => (m.from === me && m.to === friend) || (m.from === friend && m.to === me)
  );

  res.render('chat', { friend, messages, user: me });
});

// Upload bestand via POST, terug naar dezelfde chat
app.post('/chat/:friend/upload', upload.single('file'), (req, res) => {
  if (!req.session.username) return res.redirect('/login');
  const me = req.session.username;
  const friend = req.params.friend;

  if (!req.file) return res.status(400).send("Geen bestand geüpload.");

  // Sla het bericht op met het pad naar het bestand
  const messages = readMessages();
  messages.push({
    from: me,
    to: friend,
    text: null,
    file: `/uploads/${req.file.filename}`,
    time: new Date().toISOString()
  });
  saveMessages(messages);

  res.redirect(`/chat/${friend}`);
});

// Chat bericht verzenden via POST (indien je dat wil via form submit)
app.post('/chat/:friend/message', (req, res) => {
  if (!req.session.username) return res.redirect('/login');
  const me = req.session.username;
  const friend = req.params.friend;
  const text = req.body.text?.trim();
  if (!text) return res.redirect(`/chat/${friend}`);

  const messages = readMessages();
  messages.push({
    from: me,
    to: friend,
    text,
    time: new Date().toISOString()
  });
  saveMessages(messages);

  res.redirect(`/chat/${friend}`);
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
