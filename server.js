const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Homepagina
app.get('/', (req, res) => {
  res.render('index');
});

// Dynamische route
app.get('/*', (req, res) => {
  const urlPath = req.path; // bijvoorbeeld: /about/personen
  const parts = urlPath.split('/').filter(Boolean); // ['about', 'personen']

  // Eerste: check of er een .ejs file direct bestaat
  let filePath = path.join(__dirname, 'views', ...parts) + '.ejs';

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      // Bestaat direct als bestand
      res.render(parts.join('/'));
    } else {
      // Tweede: check of het een map is met index.ejs erin
      let folderPath = path.join(__dirname, 'views', ...parts, 'index.ejs');
      fs.access(folderPath, fs.constants.F_OK, (folderErr) => {
        if (!folderErr) {
          // Bestaat als map/index.ejs
          res.render(path.join(parts.join('/'), 'index'));
        } else {
          // Bestaat niet -> 404
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

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
