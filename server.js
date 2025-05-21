const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'geheime sleutel',
    resave: false,
    saveUninitialized: false,
}));

// ➤ Helper om users.json in te laden
function loadUsers() {
    return JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
}

// ➤ Helper om banlist.json in te laden
function loadBanlist() {
    if (!fs.existsSync('./data/banlist.json')) {
        fs.writeFileSync('./data/banlist.json', '[]');
    }
    return JSON.parse(fs.readFileSync('./data/banlist.json', 'utf8'));
}

// ➤ Middleware: redirect als niet ingelogd
function requireLogin(req, res, next) {
    if (!req.session.username) return res.redirect('/login');
    next();
}

// ➤ Middleware: enkel SiebeCluyts mag deze route zien
function requireAdmin(req, res, next) {
    if (req.session.username !== 'SiebeCluyts') {
        return res.status(403).send('Toegang geweigerd');
    }
    next();
}

// ✅ ROUTES

// Home
app.get('/', (req, res) => {
    res.render('index', { username: req.session.username });
});

// Login
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const users = loadUsers();
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) return res.send('Gebruiker bestaat niet');

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            req.session.username = user.username;
            res.redirect('/');
        } else {
            res.send('Wachtwoord incorrect');
        }
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// ✅ Admin banlist (alleen voor SiebeCluyts)
app.get('/admin/banlist', requireLogin, requireAdmin, (req, res) => {
    const banlist = loadBanlist();
    res.render('admin/banlist', { banlist });
});

// ✅ Verban een gebruiker via POST
app.post('/admin/ban', requireLogin, requireAdmin, (req, res) => {
    const { username } = req.body;
    let banlist = loadBanlist();

    if (!banlist.includes(username)) {
        banlist.push(username);
        fs.writeFileSync('./data/banlist.json', JSON.stringify(banlist, null, 2));
    }

    res.redirect('/admin/banlist');
});

// ❗ Bancheck middleware (indien nodig)
app.use((req, res, next) => {
    const banlist = loadBanlist();
    if (req.session.username && banlist.includes(req.session.username)) {
        return res.send('Je bent verbannen van deze site.');
    }
    next();
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server draait op http://localhost:${PORT}`);
});
