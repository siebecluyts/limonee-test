const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');

// EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware vóór alle routes
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Sessies
app.use(session({
  secret: 'geheime_sleutel', // verander dit in iets unieks!
  resave: false,
  saveUninitialized: false
}));

// Maak 'user' beschikbaar in alle views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Pad naar JSON-bestand met gebruikers
const USERS_FILE = path.join(__dirname, 'users.json');

// Functies om gebruikers op te slaan en in te lezen
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Homepagina
app.get('/', (req, res) => {
  res.render('index');
});

// Registratie
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  if (users.find(u => u.username === username)) {
    return res.send('Gebruiker bestaat al!');
  }
  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });
  saveUsers(users);
  res.redirect('/login');
});

// Login
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.send('Gebruiker niet gevonden');
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send('Wachtwoord fout');
  req.session.user = username;
  res.redirect('/dashboard');
});

// Dashboard (alleen als ingelogd)
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard', { username: req.session.user });
});

// Uitloggen
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
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
  if (!req.session.user) return res.redirect('/login');

  // Selecteer een verrassing per dag
  const today = new Date().toISOString().slice(0, 10); // bv. "2025-05-15"
  const dayIndex = new Date(today).getDate() % verrassingen.length;
  const verrassing = verrassingen[dayIndex];

  res.render('verrassing', { verrassing });
});

// Dynamische routes (zoals /info, /about/index.ejs, ...)
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

// Fallback 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
