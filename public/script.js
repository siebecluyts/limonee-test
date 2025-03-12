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

document.addEventListener('DOMContentLoaded', () => {
    loadReviews('product1');
});
// 📝 Submit Review
function submitReview() {
    const username = document.getElementById('username').value;
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;

    fetch('/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'product1', username, rating, comment })
    }).then(() => {
        loadReviews('product1');
        closeReviewForm();
    });
}

// 📄 Load Reviews
function loadReviews(productId) {
    fetch(`/reviews/${productId}`)
        .then(res => res.json())
        .then(reviews => {
            const container = document.getElementById(`reviews-${productId}`);
            container.innerHTML = reviews.map(r => `<p><strong>${r.username}:</strong> ⭐ ${r.rating} - ${r.comment}</p>`).join('');
        });
}

// 📝 Review Form
function showReviewForm(productId) {
    document.getElementById('review-form').style.display = 'block';
}
function closeReviewForm() {
    document.getElementById('review-form').style.display = 'none';
}

// 💬 Live Chat (WebSockets)
const ws = new WebSocket(`ws://${window.location.host}`);
ws.onmessage = (event) => {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<p>${event.data}</p>`;
};
function sendMessage() {
    const message = document.getElementById('chat-input').value;
    ws.send(message);
    document.getElementById('chat-input').value = '';
}
