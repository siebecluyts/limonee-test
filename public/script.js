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

// Function for filtering reviews by username and rating
function filterReviews() {
    const usernameSearch = document.getElementById('search-username').value.toLowerCase();
    const ratingFilter = document.getElementById('filter-rating').value;

    const reviews = document.querySelectorAll('.review-item');
    reviews.forEach((review) => {
        const username = review.querySelector('strong').textContent.toLowerCase();
        const rating = review.querySelector('p').textContent.replace('Rating: ', '');

        let matchesUsername = username.includes(usernameSearch);
        let matchesRating = !ratingFilter || rating === ratingFilter;

        if (matchesUsername && matchesRating) {
            review.style.display = 'block';
        } else {
            review.style.display = 'none';
        }
    });
}

// Event listeners for filtering reviews
document.getElementById('search-username').addEventListener('input', filterReviews);
document.getElementById('filter-rating').addEventListener('change', filterReviews);
