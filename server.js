const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
// 404 handler voor onbekende routes
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '/404.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
