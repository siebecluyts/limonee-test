const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const reviewsFile = path.join(__dirname, "../data/reviews.json");

// GET: Toon alle reviews
router.get("/", (req, res) => {
  const reviews = JSON.parse(fs.readFileSync(reviewsFile, "utf-8"));
  res.render("reviews/index", { reviews });
});

// POST: Nieuwe review toevoegen
router.post("/", (req, res) => {
  const { name, rating, message } = req.body;

  if (!name || !rating || !message) {
    return res.status(400).send("Vul alles in");
  }

  const newReview = { name, rating: parseInt(rating), message };

  const reviews = JSON.parse(fs.readFileSync(reviewsFile, "utf-8"));
  reviews.push(newReview);

  fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2), "utf-8");

  res.redirect("/reviews");
});

module.exports = router;
