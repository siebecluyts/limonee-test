            // Get query parameters
            const params = new URLSearchParams(window.location.search);
  window.formbutton=window.formbutton||function(){(formbutton.q=formbutton.q||[]).push(arguments)};
  /* customize formbutton below*/     
  formbutton("create", {
    action: "https://formspree.io/f/mjkybpaq",
    title: "Hoe kunnen we helpen?",
    fields: [
            { 
        type: "text", 
        label: "Naam:", 
        name: "name",
        required: true,
        placeholder: "jouw naam"
      },
      { 
        type: "email", 
        label: "Email:", 
        name: "email",
        required: true,
        placeholder: "jouw@email.com"
      },
      {
        type: "textarea",
        label: "Bericht:",
        name: "message",
        placeholder: "Wat wil je ons zeggen?",
      },
      { type: "submit" }      
    ],
    styles: {
      title: {
        backgroundColor: "yellow"
      },
      button: {
        backgroundColor: "yellow"
      }
    }
  });
// Get elements
const popup = document.getElementById("popup");
const openPopup = document.getElementById("openPopup");
const closePopup = document.getElementById("closePopup");

// Show popup when button is clicked
openPopup.addEventListener("click", () => {
    popup.style.display = "flex";
});

// Hide popup when close button is clicked
closePopup.addEventListener("click", () => {
    popup.style.display = "none";
});

// Hide popup when clicking outside of it
window.addEventListener("click", (e) => {
    if (e.target === popup) {
        popup.style.display = "none";
    }
});

window.addEventListener('scroll', function() {
    let scrolled = window.scrollY;
    document.getElementById('fruit').style.backgroundPositionY = -(scrolled * 0.3) + 'px';
    document.getElementById('ice').style.backgroundPositionY = -(scrolled * 0.5) + 'px';
});
function goToPage() {
  window.location.href = "/contact/bestelling/"; // Replace with the URL you want to redirect to
}

function closeNotification() {
  const notification = document.querySelector('.notification');
  
  // Trigger slide-out animation
  notification.style.animation = 'slideOutRight 1s ease-out forwards';
  
  // Remove the notification from the screen after animation ends
  notification.addEventListener('animationend', () => {
    notification.style.display = 'none';
  });
}
//cup maker
let cupElement = document.getElementById("cup");
let textFont = "Arial";

// Parameters voor de cup
let cupData = {
  color: "yellow",
  text: "",
  font: "Arial",
  stickers: []
};

// Verandert de kleur van de cup
function changeColor(color) {
  cupData.color = color;
  cupElement.style.backgroundColor = color;
}

// Voeg stickers toe
function addSticker(sticker) {
  cupData.stickers.push(sticker);
  if (sticker === "straw") {
    let straw = document.createElement("div");
    straw.classList.add("straw");
    cupElement.appendChild(straw);
  } else if (sticker === "lemon") {
    let lemon = document.createElement("div");
    lemon.classList.add("lemon");
    cupElement.appendChild(lemon);
  }
}

// Voeg tekst toe
function addText() {
  let text = prompt("Voer je tekst in voor de cup:");
  cupData.text = text;
  let textElement = document.createElement("div");
  textElement.style.position = "absolute";
  textElement.style.bottom = "20px";
  textElement.style.width = "100%";
  textElement.style.textAlign = "center";
  textElement.style.fontSize = "16px";
  textElement.style.fontFamily = textFont;
  textElement.style.fontWeight = "bold";
  textElement.innerHTML = text;
  cupElement.appendChild(textElement);
}

// Verander lettertype
function changeFont() {
  let fonts = ["Arial", "Verdana", "Courier New", "Comic Sans MS"];
  let currentIndex = fonts.indexOf(textFont);
  textFont = fonts[(currentIndex + 1) % fonts.length];
  alert("Het lettertype is veranderd naar " + textFont);
}

// Deel ontwerp via een popup
function shareDesign() {
  const shareUrl = generateDesignUrl();
  const shareLink = document.getElementById("share-link");
  shareLink.value = shareUrl; // De link naar de nieuwe pagina
  document.getElementById("share-popup").style.display = "flex";
}

// Kopieer de link
function copyLink() {
  const shareLink = document.getElementById("share-link");
  shareLink.select();
  document.execCommand("copy");
  alert("Link gekopieerd!");
}

// Genereer een unieke URL voor het ontwerp
function generateDesignUrl() {
  const url = new URL(window.location.href);
  url.pathname = "/design/"; // Nieuwe pagina voor elk ontwerp
  url.searchParams.set("color", cupData.color);
  url.searchParams.set("text", cupData.text);
  url.searchParams.set("font", cupData.font);
  url.searchParams.set("stickers", cupData.stickers.join(","));
  return url.toString();
}

// Sluit de popup
function closePopupCup() {
  document.getElementById("share-popup").style.display = "none";
}

// Download het ontwerp als afbeelding
function downloadImage() {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = 200;
  canvas.height = 300;
  ctx.fillStyle = cupElement.style.backgroundColor;
  ctx.fillRect(0, 0, 200, 300);

  // Voeg tekst toe
  if (cupData.text) {
    ctx.font = "16px " + cupData.font;
    ctx.fillStyle = "#000";
    ctx.fillText(cupData.text, 50, 260);
  }

  // Voeg stickers toe
  if (cupData.stickers.includes("straw")) {
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(95, 0, 10, 50);
    ctx.beginPath();
    ctx.arc(100, 0, 5, 0, Math.PI * 2, true);
    ctx.fill();
  }

  if (cupData.stickers.includes("lemon")) {
    ctx.beginPath();
    ctx.arc(100, 50, 20, 0, Math.PI * 2, true);
    ctx.fillStyle = "yellow";
    ctx.fill();
  }

  // Download het ontwerp
  let link = document.createElement("a");
  link.download = "limonade-cup-ontwerp.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
document.querySelector(".click-me").addEventListener("click", function(event) {
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.left = `${event.pageX + Math.random() * 100 - 50}px`;
    confetti.style.top = `${event.pageY + Math.random() * 50 - 25}px`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 1000); // Verwijder confetti na 1s
  }
});
               function clickLimoneMail() {
  status.textContent = "Bedankt om je in te schrijven! 🎉 Je hebt de LimoneMailer Badge gekregen.";
  
  let badges = JSON.parse(localStorage.getItem("badges")) || [];
  if (!badges.includes("limonemailer")) {
    badges.push("limonemailer");
    localStorage.setItem("badges", JSON.stringify(badges));
  }}