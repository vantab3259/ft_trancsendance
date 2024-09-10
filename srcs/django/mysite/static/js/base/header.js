var pathUrl = window.location.pathname;
var pathUrlArgument = pathUrl.slice(1).replace(/\/$/, '');

if (pathUrlArgument === "home" || pathUrlArgument === "profile/edit") {
    pathUrlArgument = "dashboard";
}
var nameCurrentPageIcon = document
    .querySelector('#' + pathUrlArgument + "-link" + ' i');
if (nameCurrentPageIcon !== undefined && nameCurrentPageIcon) {
    nameCurrentPageIcon.style.opacity = 1;
}

// Fonction pour charger du contenu via fetch
function loadContent(url, title, nameMenu, scripts = [], nameTemplate = url) {


    if (window.audioElements) {
        window.audioElements.forEach(function (audio) {
            if (audio && !audio.paused) {
                audio.pause();              // Stop the audio
                audio.currentTime = 0;      // Reset the audio to the start
            }
            audio.volume = 0;      // Reset the audio to the start

        });
    }

    document.getElementById('loader').style.display = 'unset';
    history.pushState(null, '', url);
    document.querySelector("title").innerHTML = title;

    var icons = document.querySelectorAll(".side-bar i");
    icons.forEach(function (event) {
        event.style.opacity = 0.3;
    });

    var nameIcon = document.querySelector('#' + nameMenu + "-link" + " i");
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
var profileDropdownList = document.querySelector(".profile-dropdown-list");
var btn = document.querySelector(".profile-dropdown-btn");
if (profileDropdownList) {
    var classList = profileDropdownList.classList;
    const toggleDropdown = () => classList.toggle("active");

    btn.addEventListener("click", toggleDropdown);

    window.addEventListener("click", function (e) {
        if (!btn.contains(e.target)) classList.remove("active");
    });

    // Sélecteurs pour les boutons de navigation
    var dashboardBtn = document.querySelector("#dashboard-link");
    var navbarLogo = document.querySelector("#navbar-logo");
    var pongLink = document.querySelector("#pong-link");
    var tournamentLink = document.querySelector("#tournament-link");
    var lobbyLink = document.querySelector("#lobby-link");
    var editHeaderLink = document.querySelector("#edit-header-link");
    var logoutNavBarLink = document.querySelector("#logout-header-link");

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
        loadContent('/home', 'Home', "dashboard");
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
        loadContent('/lobby', 'Lobby', 'lobby', ['/static/js/lobby/lobby.js']);
    });

    editHeaderLink.addEventListener("click", function (e) {
        e.preventDefault();
        loadContent('/profile/edit', 'Edit', 'home', [], 'profile_edit');
    });

    logoutNavBarLink.addEventListener("click", function (e) {
        e.preventDefault();

        var scripts = ["/static/js/login/login.js"];

        fetch('/logout')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur lors du chargement de ${page}`);
                }
                return response.text();
            })
            .then(html => {

                // Supprimer les anciens scripts spécifiés
                scripts.forEach(scriptSrc => {
                    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
                    if (existingScript) {
                        existingScript.remove();
                    }
                });

                document.documentElement.innerHTML = html;
                history.pushState(null, '', "/login");

                scripts.forEach(scriptSrc => {
                    const script = document.createElement('script');
                    script.src = scriptSrc;
                    document.body.appendChild(script);
                });

            })
            .catch(error => {
                console.error('Erreur:', error);
                document.body.innerHTML = '<p>Une erreur est survenue lors du chargement de la page.</p>';
            });
    });


}





