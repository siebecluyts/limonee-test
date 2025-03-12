const express = require('express');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
// 🔹 Handle 404 errors
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});


// 🔹 Load reviews from file
const reviewsFile = 'reviews.json';
const loadReviews = () => {
    if (!fs.existsSync(reviewsFile)) return [];
    return JSON.parse(fs.readFileSync(reviewsFile, 'utf8'));
};
const saveReviews = (reviews) => {
    fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));
};

// 🔹 Submit a review
app.post('/submit-review', (req, res) => {
    const { productId, username, rating, comment } = req.body;
    if (!productId || !username || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const reviews = loadReviews();
    reviews.push({ productId, username, rating, comment, date: new Date() });
    saveReviews(reviews);

    res.json({ message: '✅ Review submitted successfully!' });
});

// 🔹 Get reviews for a product
app.get('/reviews/:productId', (req, res) => {
    const productId = req.params.productId;
    const reviews = loadReviews().filter(r => r.productId === productId);
    res.json(reviews);
});

// 🔹 Theme Mode Handling
app.post('/set-theme', (req, res) => {
    const { theme } = req.body;
    fs.writeFileSync('theme.json', JSON.stringify({ theme }));
    res.json({ message: '✅ Theme updated!' });
});
app.get('/get-theme', (req, res) => {
    if (!fs.existsSync('theme.json')) return res.json({ theme: 'light' });
    const data = JSON.parse(fs.readFileSync('theme.json', 'utf8'));
    res.json(data);
});

// 🔹 WebSocket for Live Support Chat
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('🔹 A user connected to live support');
    ws.on('message', message => {
        console.log('📩 Received:', message);
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});
