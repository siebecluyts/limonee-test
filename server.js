const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Store reviews in a JSON file
const REVIEWS_FILE = 'reviews.json';

// 🔹 Get Reviews for Display
app.get('/reviews/:productId', (req, res) => {
    fs.readFile(REVIEWS_FILE, (err, data) => {
        if (err) return res.json([]);
        const reviews = JSON.parse(data);
        res.json(reviews[req.params.productId] || []);
    });
});

// 🔹 Submit Review
app.post('/submit-review', (req, res) => {
    const { productId, username, rating, comment } = req.body;
    const newReview = { username, rating, comment };

    fs.readFile(REVIEWS_FILE, (err, data) => {
        let reviews = {};
        if (!err) reviews = JSON.parse(data);
        if (!reviews[productId]) reviews[productId] = [];
        reviews[productId].push(newReview);

        fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews), () => {
            res.json({ message: '✅ Review submitted!' });
        });
    });
});

// 🔹 Show Reviews on the Main Page (Only 3 Reviews)
app.get('/', (req, res) => {
    fs.readFile(REVIEWS_FILE, (err, data) => {
        if (err) return res.status(500).send("Error loading reviews.");
        
        const reviews = JSON.parse(data);
        const productReviews = reviews.product || [];
        const firstThreeReviews = productReviews.slice(0, 3);
        
        // Send the reviews as a JSON object to the main page
        res.sendFile(path.join(__dirname, 'index.html')); // Serve the main HTML page
    });
});

// 🔹 Show All Reviews Page
app.get('/all-reviews', (req, res) => {
    fs.readFile(REVIEWS_FILE, (err, data) => {
        if (err) return res.status(500).send("Error loading reviews.");
        
        const reviews = JSON.parse(data);
        const productReviews = reviews.product || [];
        
        // Serve the all-reviews.html page with the reviews passed
        let reviewsHtml = productReviews.map(review => {
            return `
                <div class="review-item">
                    <strong>${review.username}</strong>
                    <p>Rating: ${review.rating}</p>
                    <p>${review.comment}</p>
                </div>
            `;
        }).join('');
        
        // Send the reviews to the all-reviews.html page
        res.send(`
            <html>
                <head>
                    <title>All Reviews</title>
                    <link rel="stylesheet" href="/styles.css">
                </head>
                <body>
                    <h1>All Reviews</h1>
                    <div>${reviewsHtml}</div>
                </body>
            </html>
        `);
    });
});

// 🔹 Handle 404 errors
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
