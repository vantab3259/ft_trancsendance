
let socketPong = null;
let isGameInProgress = false;
var pathUrl = window.location.pathname;
var pathUrlArgument = pathUrl.slice(1).replace(/\/$/, '');

if (pathUrlArgument === "home" || pathUrlArgument === "profile/edit" || pathUrlArgument === "" || pathUrlArgument === "/") {
    pathUrlArgument = "dashboard";
}
var nameCurrentPageIcon = document
    .querySelector('#' + pathUrlArgument + "-link" + ' i');
if (nameCurrentPageIcon !== undefined && nameCurrentPageIcon) {
    nameCurrentPageIcon.style.opacity = 1;
}

var currentPageClick = pathUrl.slice(1).replace(/\/$/, '');

function displayPage() {
    

    if (socketPong && socketPong.readyState === WebSocket.OPEN) {
        console.log("Disconnecting socketPong...");
        socketPong.close();
        socketPong = null;
    }
    isGameInProgress = false;
    handleChallengeButtonVisibility();

    if (currentPageClick !== "login" && currentPageClick !== "login/") {
            document.querySelector(".navbar" ).style.display = "flex";
            // document.querySelector(".side-bar" ).style.display = "block";
    } else {
            document.querySelector(".navbar" ).style.display = "none";
            document.querySelector(".side-bar" ).style.display = "none";
    }

    console.log("currentPageClick => ", currentPageClick);

    if (currentPageClick === "dashboard") {
        document.querySelector('.user-search-bar').setAttribute("style", "display: flex !important;");
    } else {
        document.querySelector('.user-search-bar').setAttribute("style", "display: none !important;");
    }

    if (currentPageClick === "profile/edit") {
        currentPageClick = "dashboard";
        history.replaceState(null, '', '/dashboard');
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

    let icons = document.querySelectorAll(".side-bar i");
    icons.forEach(function (event) {
        event.style.opacity = 0.3;
    });


    let nameIcon = document.querySelector('#' + currentPageClick + "-link" + " i");
    if (nameIcon !== undefined && nameIcon) {
        nameIcon.style.opacity = 1;
    }

    if (currentPageClick === "chat") {
        friendsChats();
        document.getElementById("search-bar-friends-chat").value = '';
        document.getElementById("input-message").value = '';
        document.getElementById("search-bar-friends").value = '';
        document.querySelector(".messaging.open").classList.add("v-hidden");
        initPageChat();
    }

    if (currentPageClick === "pong") {
        resetAllGame();
        document.querySelector(".pong-container").style.display = "none";
        document.getElementById("playButton").style.display = "block";
        document.getElementById("pauseButton").style.display = "none";
        document.querySelector(".left-header-pong").style.display = 'block';
    }

    if (currentPageClick === "dashboard") {
        document.getElementById("search-bar-friends").value = '';
        let oldActiveButton = document.querySelector(".option-friend-button.active");
        oldActiveButton.classList.remove("active");
        oldActiveButton = document.querySelector(".friends-option");
        if (oldActiveButton) {
            oldActiveButton.classList.add("active");
        }
        injectFriends();
        injectRanking();
        injectGameHistory();
    }

    if (currentPageClick in mapPage) {
        currentPageClick = mapPage[currentPageClick];
    }


    document.querySelectorAll("div[class$='-include']").forEach(function(element) {
        element.style.display = 'none';

    });

    document.querySelector("div." + currentPageClick + "-include" ).style.display = "block";
    document.getElementById('loader').style.display = 'none';

    document.querySelector("body" ).style.display = "unset";
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


    if (nameMenu === "home" || nameMenu === "profile/edit" || nameMenu === "" || nameMenu === "/") {
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
    var chatLink = document.querySelector("#chat-link");

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
        document.getElementById("goofysettings").style.display = "block";
        document.getElementById("settingslobby").style.display = "block";
        document.getElementById("settingsTOUR").style.display = "block";

    });

    tournamentLink.addEventListener("click", function (e) {
        e.preventDefault();
        currentPageClick = "tournament"
        loadContent('/tournament', 'Tournament', 'tournament', []);
        document.getElementById("goofysettings").style.display = "block";
        document.getElementById("settingslobby").style.display = "block";
        document.getElementById("settingsTOUR").style.display = "block";
        resetTournamentPage()
    });

    lobbyLink.addEventListener("click", function (e) {
        e.preventDefault();
        currentPageClick = "lobby"
        loadContent('/lobby', 'Lobby', 'lobby', ['/static/js/lobby/lobby.js']);
        document.getElementById("goofysettings").style.display = "block";
        document.getElementById("settingslobby").style.display = "block";
        document.getElementById("settingsTOUR").style.display = "block";
    });

    editHeaderLink.addEventListener("click", function (e) {
        e.preventDefault();
        currentPageClick = "profile"
        loadContent('/profile/edit', 'Edit', 'home', ['/static/js/profile/profile.js'], 'profile_edit');
    });

    chatLink.addEventListener("click", function (e) {
        e.preventDefault();
        currentPageClick = "chat"
        loadContent('/chat', 'Chat', 'chat', []);
    });


    logoutNavBarLink.addEventListener("click", function (e) {
        e.preventDefault();

        var scripts = ["/static/js/login/login.js"];

        fetch('/logout', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur lors du chargement de ${page}`);
                }
                return response.text();
            })
            .then(html => {

                history.pushState(null, '', "/login");
                currentPageClick = "login";
                document.querySelector(".side-bar").classList.remove("d-block");
                document.querySelector(".side-bar").style.display = "none";
                localStorage.clear();
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


window.addEventListener("popstate", (event) => {
  let pathUrlState = window.location.pathname;
  let pathUrlArgumentState = pathUrlState.replace(/^\/|\/$/g, '');
  currentPageClick = pathUrlArgumentState;
  
  displayPage();
});


document.querySelector(".menu-mobile").addEventListener("click", () => {
    const menuMobile = document.querySelector(".side-bar");

    if (menuMobile.classList.contains("side-bar-active")) {
        menuMobile.classList.remove("side-bar-active");

        setTimeout(() => {
            menuMobile.style.display = 'none';
        }, 500);
    } else {
        menuMobile.style.display = 'block';
        setTimeout(() => {
            menuMobile.classList.add("side-bar-active");
        }, 10);
    }
});


