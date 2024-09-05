document.addEventListener("DOMContentLoaded", function () {



    let pathUrl  = window.location.pathname;
    let nameCurrentPageIcon = document
        .querySelector('#' + pathUrl.slice(1).replace(/\/$/, '') + "-link" + ' i');
    if (nameCurrentPageIcon !== undefined && nameCurrentPageIcon) {
        nameCurrentPageIcon.style.opacity = 1;
    }

    // Fonction pour charger du contenu via fetch
    function loadContent(url, title, nameMenu, scripts = [], nameTemplate = url) {
        document.getElementById('loader').style.display = 'unset';
        history.pushState(null, '', url);
        document.querySelector("title").innerHTML = title;

		let icons = document.querySelectorAll(".side-bar i");
		icons.forEach(function (event) {
			event.style.opacity = 0.3;
		});

		let nameIcon = document.querySelector('#' + nameMenu + "-link" + " i");
        if (nameIcon !== undefined && nameIcon) {
            nameIcon.style.opacity = 1;
        }


        fetch(nameTemplate + '_content')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur lors du chargement de ${title.toLowerCase()}`);
                }
                return response.text();
            })
            .then(html => {
                // Arrêter le jeu Pong si nécessaire
                if (typeof pongGame !== 'undefined' && pongGame.stopGame) {
                    pongGame.stopGame();
                }

                // Supprimer les anciens scripts spécifiés
                scripts.forEach(scriptSrc => {
                    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
                    if (existingScript) {
                        existingScript.remove();
                    }
                });

                // Insérer le contenu HTML
                pageContent.innerHTML = html;

                // Ajouter les nouveaux scripts si spécifiés
                scripts.forEach(scriptSrc => {
                    const script = document.createElement('script');
                    script.src = scriptSrc;
                    document.body.appendChild(script);
                });

                document.getElementById('loader').style.display = 'none';
            })
            .catch(error => {
                console.error('Erreur:', error);
                pageContent.innerHTML = '<p>Une erreur est survenue lors du chargement du contenu.</p>';
                document.getElementById('loader').style.display = 'none';
            });
    }

    // Gestionnaire pour le dropdown du profil
    let profileDropdownList = document.querySelector(".profile-dropdown-list");
    let btn = document.querySelector(".profile-dropdown-btn");
    let classList = profileDropdownList.classList;

    const toggleDropdown = () => classList.toggle("active");

    btn.addEventListener("click", toggleDropdown);

    window.addEventListener("click", function (e) {
        if (!btn.contains(e.target)) classList.remove("active");
    });

    // Sélecteurs pour les boutons de navigation
    let dashboardBtn = document.querySelector("#dashboard-link");
    let navbarLogo = document.querySelector("#navbar-logo");
    let pongLink = document.querySelector("#pong-link");
    let tournamentLink = document.querySelector("#tournament-link");
    let lobbyLink = document.querySelector("#lobby-link");
    var pageContent = document.querySelector("div.content");

    // Ajouter des gestionnaires d'événements
    dashboardBtn.addEventListener("click", function (e) {
        e.preventDefault();
        loadContent('/dashboard', 'Dashboard', "dashboard", [
            '/static/js/dashboard/dashboard.js',
        ]);
    });

    navbarLogo.addEventListener("click", function (e) {
        e.preventDefault();
        loadContent('/home', 'Home', "home");
    });

    pongLink.addEventListener("click", function (e) {
        e.preventDefault();
        loadContent('/pong', 'Pong', 'pong', [
            '/static/js/pong/pong.js',
            '/static/js/pong/confirm_leave_pong_modal.js'
        ]);
    });

    tournamentLink.addEventListener("click", function (e) {
        e.preventDefault();
        loadContent('/tournament', 'Tournament', 'tournament', []);
    });
	
	lobbyLink.addEventListener("click", function (e) {
        e.preventDefault();
        loadContent('/lobby', 'Lobby', 'lobby');
    });

});
