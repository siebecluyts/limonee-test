const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Instellingen voor EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Automatische route-handler
app.get('/:page?', (req, res, next) => {
    const page = req.params.page;

    if (!page) {
        // Als geen pagina opgegeven ➔ home pagina
        return res.render('index');
    }

    const filePath = path.join(__dirname, 'views', page, 'index.ejs');

    // Check of de folder + index.ejs bestaat
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            next(); // niet gevonden ➔ naar 404
        } else {
            res.render(`${page}/index`);
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404');
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
