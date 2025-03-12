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
const productId = 'product'; // The ID of the only product

// Function to load reviews
const loadReviews = (showAll = false) => {
    fetch(`/reviews/${productId}`)
        .then(response => response.json())
        .then(reviews => {
            const reviewsContainer = document.getElementById('reviews');
            reviewsContainer.innerHTML = ''; // Clear any existing reviews

            // Filter reviews if there's a search term
            const searchTerm = document.getElementById('search').value.toLowerCase();
            const filteredReviews = reviews.filter(review => 
                review.username.toLowerCase().includes(searchTerm) ||
                review.comment.toLowerCase().includes(searchTerm)
            );

            // Show only the first 3 reviews unless showAll is true
            const reviewsToShow = showAll ? filteredReviews : filteredReviews.slice(0, 3);

            // Loop through the reviews and append each one
            reviewsToShow.forEach(review => {
                const reviewElement = document.createElement('div');
                reviewElement.classList.add('review');
                reviewElement.innerHTML = `
                    <h3>${review.username} - ${review.rating}⭐</h3>
                    <p>${review.comment}</p>
                `;
                reviewsContainer.appendChild(reviewElement);
            });

            // Toggle visibility of 'See All' button
            document.getElementById('see-all-btn').style.display = filteredReviews.length > 3 && !showAll ? 'block' : 'none';
        })
        .catch(error => console.error('Error loading reviews:', error));
};

// Function to submit a review
const submitReview = (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;

    const review = { productId, username, rating, comment };

    fetch('/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadReviews(); // Reload reviews after submitting
        document.getElementById('review-form').reset();
    })
    .catch(error => console.error('Error submitting review:', error));
};

// Event listener for form submission
document.getElementById('review-form').addEventListener('submit', submitReview);

// Event listener for the 'See All' button
document.getElementById('see-all-btn').addEventListener('click', () => {
    loadReviews(true);
});

// Event listener for search input
document.getElementById('search').addEventListener('input', () => {
    loadReviews();
});

// Load reviews when the page loads
loadReviews();
