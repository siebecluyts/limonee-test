const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true },  // ID of the product being reviewed
  username: { type: String, required: true },   // Name of the user
  rating: { type: Number, required: true, min: 1, max: 5 }, // Rating (1-5)
  comment: { type: String, required: false },   // Optional comment
  date: { type: Date, default: Date.now }       // Timestamp
});

module.exports = mongoose.model('Review', reviewSchema);
