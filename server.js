const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// EJS als view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Public folder voor styles, scripts, images, etc
app.use(express.static(path.join(__dirname, 'public')));

// Homepagina
app.get('/', (req, res) => {
  res.render('index');
});

// Dynamische route handler
app.get('/*', (req, res, next) => {
  const urlPath = req.path; // Bijvoorbeeld: /about/personen/ReindertJanssens
  const parts = urlPath.split('/').filter(Boolean); // ['about', 'personen', 'ReindertJanssens']

  let filePath = path.join(__dirname, 'views', ...parts) + '.ejs';

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Bestand bestaat niet -> 404
      res.status(404).render('404');
    } else {
      // Bestand bestaat -> renderen
      res.render(parts.join('/'));
    }
  });
});

// 404 fallback als niets matcht
app.use((req, res) => {
  res.status(404).render('404');
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
