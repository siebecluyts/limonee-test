const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// ░█▀▀▀ ░█▀▀█ ▀▀█▀▀ ▀█▀ ▀▀█▀▀ ░█▀▀█ 
// ░█▀▀▀ ░█─── ─░█── ░█─ ─░█── ░█─▄▄
// ░█▄▄▄ ░█▄▄█ ─░█── ▄█▄ ─░█── ░█▄▄█

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ░█▀▀█ ▀█▀ ░█▀▀▀█ ░█▀▀█ ▀▀█▀▀ ░█▀▀█ ░█▀▄▀█ 
// ░█─── ░█─ ─▀▀▀▄▄ ░█─▄▄ ─░█── ░█─▄▄ ░█░█░█ 
// ░█▄▄█ ▄█▄ ░█▄▄▄█ ░█▄▄█ ─░█── ░█▄▄█ ░█──░█ 

const reviewsPath = path.join(__dirname, "data", "reviews.json");

// ✅ GET /reviews
app.get("/reviews", (req, res) => {
  fs.readFile(reviewsPath, "utf8", (err, data) => {
    let reviews = [];
    if (!err) {
      try {
        reviews = JSON.parse(data);
      } catch (e) {
        console.error("Fout bij parsen reviews:", e);
      }
    }
    res.render("reviews/index", { reviews });
  });
});

// ✅ POST /reviews
app.post("/reviews", (req, res) => {
  const nieuweReview = {
    gebruiker: req.body.gebruiker,
    rating: parseInt(req.body.rating),
    tekst: req.body.tekst
  };

  fs.readFile(reviewsPath, "utf8", (err, data) => {
    let reviews = [];
    if (!err) {
      try {
        reviews = JSON.parse(data);
      } catch (e) {
        console.error("Fout bij parsen reviews:", e);
      }
    }

    reviews.push(nieuweReview);

    fs.writeFile(reviewsPath, JSON.stringify(reviews, null, 2), (err) => {
      if (err) {
        console.error("Fout bij schrijven:", err);
        return res.status(500).send("Kon review niet opslaan.");
      }
      res.redirect("/reviews");
    });
  });
});

// ░█▀▀▀█ ░█▀▀█ ▀▀█▀▀ ░█▀▀█ ▀▀█▀▀ ░█▄─░█ ▀█▀ ░█▄─░█ ░█▀▀▀ 
// ─▀▀▀▄▄ ░█─── ─░█── ░█─── ─░█── ░█░█░█ ░█─ ░█░█░█ ░█▀▀▀ 
// ░█▄▄▄█ ░█▄▄█ ─░█── ░█▄▄█ ─░█── ░█──▀█ ▄█▄ ░█──▀█ ░█▄▄▄ 

app.get("*", (req, res) => {
  const viewPath = path.join(__dirname, "views", req.path, "index.ejs");

  fs.access(viewPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).render("404", { url: req.url });
    }
    res.render(path.join(req.path, "index"));
  });
});

// ░█▀▀█ ░█▀▀▀█ ▀▀█▀▀ ▀█▀ ░█▀▀▀█ ░█▀▄▀█ 
// ░█─── ░█──░█ ─░█── ░█─ ─▀▀▀▄▄ ░█░█░█ 
// ░█▄▄█ ░█▄▄▄█ ─░█── ▄█▄ ░█▄▄▄█ ░█──░█ 

app.listen(PORT, () => {
  console.log(`✅ Server draait op http://localhost:${PORT}`);
});
