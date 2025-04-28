const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Zeg tegen Express dat je EJS gebruikt
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.static('public'));

// 404 handler
app.use((req, res, next) => {
    res.status(404).render('404');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
