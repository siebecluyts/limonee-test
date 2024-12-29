            // Get query parameters
            const params = new URLSearchParams(window.location.search);
            const lang = params.get('lang');
        
            // Load content based on the lang parameter
            if (lang === 'nl') {
              document.getElementById('par1-1').textContent = 'Onze limonade is een lekkere soort van limonade. Het is niet je doodgewone Fanta of andere limonade, het is zelf-gemaakte limonade, volledig met de hand.';
            }
            if (lang === 'fr') {
              document.getElementById('par1-1').textContent = "Notre limonade est une sorte de limonade savoureuse. Ce n'est pas votre Fanta ou autre limonade ordinaire, c'est de la limonade maison, entièrement à la main."
            }
            if (lang === 'nl') {
              document.getElementById('h31-1').textContent = 'Onze limonade';
            }
            if (lang === 'fr') {
              document.getElementById('h31-1').textContent = "Notre limonade"
            }
            if (lang === 'nl') {
              document.getElementById('about').textContent = 'Over ons';
            }
            if (lang === 'fr') {
              document.getElementById('about').textContent = "À propos de nous"
            }
            if (lang === 'nl') {
              document.getElementById('par1-2').textContent = 'Koop een bekertje van 25 cl bij ons kraampje voor 1.00 euro!';
            }
            if (lang === 'fr') {
              document.getElementById('par1-2').textContent = "Achetez un gobelet de 25 cl sur notre stand pour 1,00 euros !"
            }
            if (lang === 'fr') {
              document.getElementById('img').src = "images/logo-frans.png"
            }
            if (lang === 'nl') {
              document.getElementById('img').src = "images/logo.png"
            }