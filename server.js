const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Instellingen
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Reviews JSON pad
const reviewsPath = path.join(__dirname, "data", "reviews.json");

// 🟨 Reviews pagina
app.get("/reviews", (req, res) => {
  fs.readFile(reviewsPath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Fout bij lezen van reviews");
    let reviews = [];
    try {
      reviews = JSON.parse(data);
    } catch (parseError) {
      console.error("Fout bij parsen JSON:", parseError);
    }
    res.render("reviews/index", { reviews });
  });
});

// 🟨 Review POST handler
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
        console.error("JSON parse error:", e);
      }
    }

    reviews.push(nieuweReview);

    fs.writeFile(reviewsPath, JSON.stringify(reviews, null, 2), err => {
      if (err) return res.status(500).send("Fout bij opslaan van review");
      res.redirect("/reviews");
    });
  });
});

// 🟩 Dynamische route: views/map/index.ejs => /map
app.get("*", (req, res, next) => {
  const paginaPad = path.join(__dirname, "views", req.path, "index.ejs");

  fs.access(paginaPad, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).send("Pagina niet gevonden");
    res.render(path.join(req.path, "index"));
  });
});

// Start de server
app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
