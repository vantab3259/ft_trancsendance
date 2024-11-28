document.getElementById('quitButton').addEventListener('click', function() {
    // Afficher la modal
    document.getElementById('quitModal').style.display = 'block';
    document.getElementById('quitModal').classList.add('show');
});

document.getElementById('closeModal').addEventListener('click', function() {
    // Fermer la modal
    closeModal();
});

document.getElementById('cancelButton').addEventListener('click', function() {
    // Fermer la modal
    closeModal();
});

document.getElementById('confirmQuit').addEventListener('click', function() {
    // Logic pour quitter la partie
    if (typeof pongGame !== 'undefined' && pongGame.stopGame) {
        pongGame.stopGame(); // Appeler une fonction pour arrêter le jeu
    }
    closeModal();

        document.getElementById('loader').style.display = 'unset';
        history.pushState(null, '', '/');
        document.querySelector("title").innerHTML = 'Dashboard';
        currentPageClick = "dashboard";
        displayPage();
        document.getElementById('loader').style.display = 'none';


});

function closeModal() {
    document.getElementById('quitModal').classList.remove('show');

    setTimeout(function() {

        if (document.getElementById('quitModal')) {
            document.getElementById('quitModal').style.display = 'none';
        }
    }, 150); // Attendre un peu pour l'effet de transition
}

// Fermer la modal en cliquant en dehors du contenu de la modal
window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('quitModal')) {
        closeModal();
    }
});
