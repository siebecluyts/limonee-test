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
app.use(express.static(path.join(__dirname, 'public')));

// Automatische route-handler voor pagina's met dynamische parameters
app.get('/:page?/:subpage?/:person?', (req, res, next) => {
    const page = req.params.page;
    const subpage = req.params.subpage;
    const person = req.params.person; // Nieuwe parameter voor de persoon

    // Als geen pagina opgegeven, render de homepagina
    if (!page) {
        return res.render('index');
    }

    // Pad voor de huidige pagina (index.ejs)
    const pagePath = subpage ? path.join(__dirname, 'views', page, subpage, 'index.ejs') : path.join(__dirname, 'views', page, 'index.ejs');

    // Check of de index.ejs bestaat in de opgegeven map
    fs.access(pagePath, fs.constants.F_OK, (err) => {
        if (err) {
            next(); // niet gevonden ➔ naar 404
        } else {
            // Render de juiste pagina
            if (person) {
                // Als er een persoon parameter is, kun je deze gebruiken
                return res.render(path.join(page, subpage || '', 'index'), { person });
            } else {
                return res.render(path.join(page, subpage || '', 'index'));
            }
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
