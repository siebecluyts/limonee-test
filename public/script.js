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

// Change color of the cup
function changeColor(color) {
  cupElement.style.backgroundColor = color;
}

// Add stickers (straw, lemon)
function addSticker(sticker) {
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

// Add custom text
function addText() {
  let text = prompt("Voer je tekst in voor de cup:");
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

// Change font of the text
function changeFont() {
  let fonts = ["Arial", "Verdana", "Courier New", "Comic Sans MS"];
  let currentIndex = fonts.indexOf(textFont);
  textFont = fonts[(currentIndex + 1) % fonts.length];
  alert("Het lettertype is veranderd naar " + textFont);
}

// Show the share popup
function shareDesign() {
  document.getElementById("share-popup").style.display = "flex";
}

// Close the share popup
function closePopupCup() {
  document.getElementById("share-popup").style.display = "none";
}

// Download the cup design as an image
function downloadImage() {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = 200;
  canvas.height = 300;
  ctx.fillStyle = cupElement.style.backgroundColor;
  ctx.fillRect(0, 0, 200, 300);

  // Add text if present
  let textElement = cupElement.querySelector("div");
  if (textElement) {
    ctx.font = "16px " + textFont;
    ctx.fillStyle = "#000";
    ctx.fillText(textElement.innerHTML, 50, 260);
  }

  // Add straw if present
  if (cupElement.querySelector(".straw")) {
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(95, 0, 10, 50);
    ctx.beginPath();
    ctx.arc(100, 0, 5, 0, Math.PI * 2, true);
    ctx.fill();
  }

  // Add lemon if present
  if (cupElement.querySelector(".lemon")) {
    ctx.beginPath();
    ctx.arc(100, 50, 20, 0, Math.PI * 2, true);
    ctx.fillStyle = "yellow";
    ctx.fill();
  }

  // Download the image
  let link = document.createElement("a");
  link.download = "limonade-cup-ontwerp.png";
  link.href = canvas.toDataURL();
  link.click();
}

// Share on social media
function shareOnFacebook() {
  let url = "https://www.facebook.com/sharer/sharer.php?u=https://jouw-website.nl";
  window.open(url, "_blank");
}

function shareOnTwitter() {
  let url = "https://twitter.com/intent/tweet?url=https://jouw-website.nl&text=Bekijk mijn limonade ontwerp!";
  window.open(url, "_blank");
}

function shareOnInstagram() {
  alert("Instagram delen wordt niet ondersteund via deze browser.");
}
