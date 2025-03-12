const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// File where reviews are stored
const REVIEWS_FILE = path.join(__dirname, 'public', 'reviews.json');  // public map


// Serve the main page (display first 3 reviews)
app.get('/', (req, res) => {
    fs.readFile(REVIEWS_FILE, (err, data) => {
        let reviews = {};
        if (!err) {
            reviews = JSON.parse(data); // If file exists, parse it
        }

        // Get the first 3 reviews
        const productReviews = reviews.product || [];
        const firstThreeReviews = productReviews.slice(0, 3);

        // Send reviews to the main page
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
});

// Serve the all-reviews page
// Route voor het ophalen van alle reviews
app.get('/all-reviews', (req, res) => {
      res.sendFile(path.join(__dirname, 'all-reviews.html'));
    fs.readFile(REVIEWS_FILE, (err, data) => {
        if (err) {
            console.error('Error reading reviews:', err);
            return res.status(500).json({ message: 'Fout bij het ophalen van reviews' });
        }
        const reviews = JSON.parse(data);
        res.json(reviews.product || []); // Zorg ervoor dat we de juiste data versturen
    });
});

// Submit a review
app.post('/submit-review', (req, res) => {
    const { username, rating, comment } = req.body;

    const newReview = { username, rating, comment };

    fs.readFile(REVIEWS_FILE, (err, data) => {
        let reviews = {};
        if (!err) {
            reviews = JSON.parse(data); // If file exists, parse it
        }

        // If there's no product reviews, create an empty array
        if (!reviews.product) {
            reviews.product = [];
        }

        // Add the new review to the product reviews
        reviews.product.push(newReview);

        // Save the updated reviews to the file
        fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews), (err) => {
            if (err) return res.status(500).send("Error saving review.");
            res.json({ message: '✅ Review submitted!' });
        });
    });
});
// 404 handler voor onbekende routes
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '/404.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
