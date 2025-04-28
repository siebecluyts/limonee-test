const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Instellingen voor EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serveer statische bestanden vanuit de public map
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.json());

// Automatische route-handler met meerdere niveaus
app.get('/:page?/:subpage?/:person?', (req, res, next) => {
    const { page, subpage, person } = req.params;

    // Als er geen page is, stuur naar home
    if (!page) {
        return res.render('index');
    }

    // Als er een persoon is opgegeven, laad de bijbehorende pagina
    if (person) {
        const filePath = path.join(__dirname, 'views', page, subpage, `${person}.ejs`);

        // Controleer of de pagina bestaat
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                next(); // niet gevonden ➔ naar 404
            } else {
                res.render(`${page}/${subpage}/${person}`);
            }
        });
    } else if (subpage) {
        // Als er een subpagina is (zoals /about), laad die dan
        const filePath = path.join(__dirname, 'views', page, `${subpage}.ejs`);
        
        // Check of de subpagina bestaat
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                next(); // niet gevonden ➔ naar 404
            } else {
                res.render(`${page}/${subpage}`);
            }
        });
    } else {
        // Standaard geval, laad de index van de opgegeven pagina
        const filePath = path.join(__dirname, 'views', `${page}/index.ejs`);
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                next(); // niet gevonden ➔ naar 404
            } else {
                res.render(`${page}/index`);
            }
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404');
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
