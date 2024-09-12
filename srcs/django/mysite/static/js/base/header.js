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

var currentPageClick = pathUrl.slice(1).replace(/\/$/, '');

function displayPage() {

    if (currentPageClick !== "login" && currentPageClick !== "login/") {
            document.querySelector(".navbar" ).style.display = "flex";
            document.querySelector(".side-bar" ).style.display = "block";
    } else {
            document.querySelector(".navbar" ).style.display = "none";
            document.querySelector(".side-bar" ).style.display = "none";
    }

    let mapPage = {
            "base": "dashboard",
            "/": "dashboard",
            "": "dashboard",
            "/home": "dashboard",
            "home": "dashboard",
            "home/": "dashboard",
            "profile/edit": "profile",

        };

    if (currentPageClick in mapPage) {
        currentPageClick = mapPage[currentPageClick];
    }

    document.querySelectorAll("div[class$='-include']").forEach(function(element) {
        element.style.display = 'none';

    });

    document.querySelector("div." + currentPageClick + "-include" ).style.display = "block";


}

 displayPage();


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
     displayPage();

    var icons = document.querySelectorAll(".side-bar i");
    icons.forEach(function (event) {
        event.style.opacity = 0.3;
    });


    if (nameMenu === "home" || nameMenu === "profile/edit") {
        nameMenu = "dashboard";
    }

    var nameIcon = document.querySelector('#' + nameMenu + "-link" + " i");
    if (nameIcon !== undefined && nameIcon) {
        nameIcon.style.opacity = 1;
    }
    document.getElementById('loader').style.display = 'none';
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
        currentPageClick = "dashboard"
        loadContent('/dashboard', 'Dashboard', "dashboard", [
            '/static/js/dashboard/dashboard.js',
        ]);
    });

    navbarLogo.addEventListener("click", function (e) {
        e.preventDefault();
        currentPageClick = "dashboard"
        loadContent('/home', 'Home', "dashboard", [ '/static/js/dashboard/dashboard.js']);
    });

    pongLink.addEventListener("click", function (e) {
        e.preventDefault();
        currentPageClick = "pong"
        loadContent('/pong', 'Pong', 'pong', [
            '/static/js/pong/pong.js',
            '/static/js/pong/confirm_leave_pong_modal.js'
        ]);

    });

    tournamentLink.addEventListener("click", function (e) {
        e.preventDefault();
        currentPageClick = "tournament"
        loadContent('/tournament', 'Tournament', 'tournament', []);
    });

    lobbyLink.addEventListener("click", function (e) {
        e.preventDefault();
        currentPageClick = "lobby"
        loadContent('/lobby', 'Lobby', 'lobby', ['/static/js/lobby/lobby.js']);
    });

    editHeaderLink.addEventListener("click", function (e) {
        e.preventDefault();
        currentPageClick = "profile"
        loadContent('/profile/edit', 'Edit', 'home', ['/static/js/profile/profile.js'], 'profile_edit');
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

                history.pushState(null, '', "/login");
                currentPageClick = "login"
                displayPage();

            })
            .catch(error => {
                console.error('Erreur:', error);
                document.body.innerHTML = '<p>Une erreur est survenue lors du chargement de la page.</p>';
            });
    });


}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}





