// Haal de parameters uit de URL
const urlParams = new URLSearchParams(window.location.search);
const cupColor = urlParams.get("color");
const cupText = urlParams.get("text");
const cupFont = urlParams.get("font");
const stickers = urlParams.get("stickers").split(",");

// Toon de gedeelde link
document.getElementById("shared-link").innerText = window.location.href;

// Laad het ontwerp op basis van de parameters
let cupElement = document.getElementById("cup");
cupElement.style.backgroundColor = cupColor;

// Voeg stickers toe
if (stickers.includes("straw")) {
  let straw = document.createElement("div");
  straw.classList.add("straw");
  cupElement.appendChild(straw);
}

if (stickers.includes("lemon")) {
  let lemon = document.createElement("div");
  lemon.classList.add("lemon");
  cupElement.appendChild(lemon);
}

// Voeg tekst toe
if (cupText) {
  let textElement = document.createElement("div");
  textElement.style.position = "absolute";
  textElement.style.bottom = "20px";
  textElement.style.width = "100%";
  textElement.style.textAlign = "center";
  textElement.style.fontSize = "16px";
  textElement.style.fontFamily = cupFont;
  textElement.style.fontWeight = "bold";
  textElement.innerHTML = cupText;
  cupElement.appendChild(textElement);
}

// Functie om de link te kopiëren
function copyLink() {
  const shareLink = document.getElementById("shared-link");
  const range = document.createRange();
  range.selectNode(shareLink);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  document.execCommand("copy");
  alert("Link gekopieerd!");
}

// Ga terug naar de ontwerp pagina
function goBack() {
  window.location.href = "index.html";
}

// Download het ontwerp als afbeelding
function downloadImage() {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = 200;
  canvas.height = 300;
  ctx.fillStyle = cupColor;
  ctx.fillRect(0, 0, 200, 300);

  // Voeg stickers toe
  if (stickers.includes("straw")) {
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(95, 0, 10, 50);
    ctx.beginPath();
    ctx.arc(100, 0, 5, 0, Math.PI * 2, true);
    ctx.fill();
  }

  if (stickers.includes("lemon")) {
    ctx.beginPath();
    ctx.arc(100, 50, 20, 0, Math.PI * 2, true);
    ctx.fillStyle = "yellow";
    ctx.fill();
  }

  // Voeg tekst toe
  if (cupText) {
    ctx.font = "16px " + cupFont;
    ctx.fillStyle = "#000";
    ctx.fillText(cupText, 50, 260);
  }

  // Download het ontwerp
  let link = document.createElement("a");
  link.download = "limonade-cup-ontwerp.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
