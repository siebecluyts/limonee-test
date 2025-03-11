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

        window.addEventListener("load", function () {
          const path = window.location.pathname;
          const validPaths = [
            "/about/",
            "/contact/",
            "/planning/",
            "/limonade/",
            "/game",
            "/about/personen/",
            "/contact/bestelling",
            "/game/1.html",
            "/game/1.html",
            "/about/personen/ArntJanssens/",
            "/about/personen/ReindertJanssens",
            "/about/personen/SiebeCluyts",
            "/about/personen/LodewijkVandueren",
            "/about/personen/TijlCluyts",
            "/",
          ]; // Add all valid paths here

          // Check if the path is not valid
          if (!validPaths.includes(path) && !path.endsWith("/404.html")) {
            window.location.href = "/404.html";
          }
        });