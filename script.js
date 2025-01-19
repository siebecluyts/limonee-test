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
