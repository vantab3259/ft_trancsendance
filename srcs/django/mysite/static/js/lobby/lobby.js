document.querySelector('.chat-close').addEventListener('click', function() {

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


//*****************************************************************************************************

// Avatar Carousel
let avatarIndex = 1;
const avatarContainer = document.querySelector('.avatar-container-lobby img');
const totalAvatars = 45; // Nombre total d'avatars disponibles

document.getElementById('next').addEventListener('click', () => {
    avatarIndex = (avatarIndex % totalAvatars) + 1; // Passe au suivant
    avatarContainer.src = `/static/images/avatar/avatar_${avatarIndex}.svg`; // Change l'avatar
});

document.getElementById('prev').addEventListener('click', () => {
    avatarIndex = (avatarIndex - 1 + totalAvatars) % totalAvatars || totalAvatars; // Passe au précédent
    avatarContainer.src = `/static/images/avatar/avatar_${avatarIndex}.svg`; // Change l'avatar
});

// Mode Selection
const modes = document.querySelectorAll('.choose-mode');

modes.forEach(mode => {
    mode.addEventListener('click', () => {
        // Retirer la classe active-mode des autres modes
        modes.forEach(m => m.classList.remove('active-mode'));
        // Ajouter la classe active-mode au mode cliqué
        mode.classList.add('active-mode');
    });
});
