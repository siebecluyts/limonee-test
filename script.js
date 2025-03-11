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
const users = []; // This will hold user data temporarily

document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    // Check if the user already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        displayMessage('User already exists!', 'error');
        return;
    }

    // Register the new user
    users.push({ username, password });
    displayMessage('Registration successful!', 'success');
    this.reset();
});

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // Check if the user exists and the password matches
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
        displayMessage('Login successful!', 'success');
    } else {
        displayMessage('Invalid username or password!', 'error');
    }
});

function displayMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = type; // You can style messages based on type
}
<script>
    window.addEventListener('load', function() {
        const path = window.location.pathname;
        // Check if the path is not the root and does not match any existing files
        if (path !== '/' && !path.includes('.html')) {
            window.location.href = '/404.html';
        }
    });
</script>
