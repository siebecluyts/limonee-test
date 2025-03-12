const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Connect to MongoDB (Replace 'your_mongodb_url' with your real connection string)
mongoose.connect('your_mongodb_url', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.static('public'));

// 🔹 Handle 404 errors
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

// 🔹 Import Review model
const Review = require('./models/review');

// 🔹 API to Submit a Review
app.post('/submit-review', async (req, res) => {
  try {
    const { productId, username, rating, comment } = req.body;
    const newReview = new Review({ productId, username, rating, comment });
    await newReview.save();
    res.json({ message: '✅ Review submitted successfully!' });
  } catch (error) {
    res.status(500).json({ error: '❌ Failed to submit review' });
  }
});

// 🔹 API to Get Reviews
app.get('/reviews/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: '❌ Failed to get reviews' });
  }
});
