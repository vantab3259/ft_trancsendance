console.log("IS LOAD !")

document.querySelector('.chat-close').addEventListener('click', function() {

    console.log(document.querySelector('.messaging'))
    if (document.querySelector('.messaging').classList.contains('open')) {
        document.querySelector('.messaging').classList.remove('open');
        document.querySelector(".icon-chat-open-container").innerHTML = "<i class=\"fa-solid fa-plus\"></i>";
    } else {
        document.querySelector('.messaging').classList.add('open');
        document.querySelector(".icon-chat-open-container").innerHTML = "<i class=\"fa-solid fa-minus\"></i>";
    }
});

// Gestion de la fermeture via le bouton de fermeture dans la fenêtre de messagerie
document.querySelector('.close-button-container').addEventListener('click', function() {
    const messaging = document.querySelector('.messaging');
    messaging.classList.remove('open');
    document.querySelector(".icon-chat-open-container").innerHTML = "<i class=\"fa-solid fa-plus\"></i>";

});
