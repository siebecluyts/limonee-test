const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');


const app = express();

const PORT = process.env.PORT || 3000;
const dataFile = './designs.json';

// Middleware
app.use(express.json());
app.use(express.static('public'));
// 404 handler voor onbekende routes
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '/404.html'));
});
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '{}');

app.post('/save', (req, res) => {
  const design = req.body;
  const id = uuidv4();
  const data = JSON.parse(fs.readFileSync(dataFile));
  data[id] = design;
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  res.json({ id });
});

app.get('/design/:id', (req, res) => {
  const data = JSON.parse(fs.readFileSync(dataFile));
  const design = data[req.params.id];
  if (design) {
    res.json(design);
  } else {
    res.status(404).json({ error: 'Design not found' });
  }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
