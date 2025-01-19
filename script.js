            // Get query parameters
            const params = new URLSearchParams(window.location.search);
  window.formbutton=window.formbutton||function(){(formbutton.q=formbutton.q||[]).push(arguments)};
  /* customize formbutton below*/     
  formbutton("create", {
    action: "https://formspree.io/f/xwppbanv",
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
        backgroundColor: "gray"
      },
      button: {
        backgroundColor: "gray"
      }
    }
  });
// Openingsdagen opslaan
document.getElementById('saveOpeningsdagen').addEventListener('click', () => {
    const date = document.getElementById('openingsdag').value;
    if (date) {
        alert(`De openingsdag ${date} is opgeslagen.`);
    } else {
        alert('Selecteer een datum voordat je opslaat.');
    }
});

// Werknemersplanning opslaan
document.getElementById('saveWerknemers').addEventListener('click', () => {
    alert('De werknemersplanning is opgeslagen.');
});

// Voorraad opslaan
document.getElementById('saveVoorraad').addEventListener('click', () => {
    const liters = document.getElementById('liters').value;
    alert(`${liters} liters limonade is opgeslagen.`);
});

// Bestellingen bijwerken
document.getElementById('updateBestellingen').addEventListener('click', () => {
    const bestellingen = ['Bestelling 1', 'Bestelling 2', 'Bestelling 3'];
    const list = document.getElementById('bestellingenList');
    list.innerHTML = ''; // Leeg de lijst
    bestellingen.forEach(bestelling => {
        const li = document.createElement('li');
        li.textContent = bestelling;
        list.appendChild(li);
    });
    alert('De bestellingen zijn bijgewerkt.');
});
