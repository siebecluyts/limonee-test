const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Inladen gebruikersdata
let users = {};
if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'limonee-super-secret',
    resave: false,
    saveUninitialized: true,
}));

// Register route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.send('Gebruiker bestaat al!');
    }
    const hashed = await bcrypt.hash(password, 10);
    users[username] = { password: hashed, badges: ["Zure Starter"] };
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.redirect('/login.html');
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.send('Ongeldige login!');
    }
    req.session.username = username;
    res.redirect('/profile');
});

// Profile page
app.get('/profile', (req, res) => {
    const user = users[req.session.username];
    if (!user) return res.redirect('/login.html');
    res.send(`
        <h1>Welkom ${req.session.username} 🍋</h1>
        <p>Jouw badges: ${user.badges.join(', ')}</p>
        <a href="/logout">Uitloggen</a>
    `);
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// 404
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '/404.html'));
});

// Start de server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
