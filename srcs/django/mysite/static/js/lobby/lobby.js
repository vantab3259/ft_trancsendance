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
if (typeof avatarIndex === undefined) {
    let avatarIndex = 1;
} else {
    avatarIndex = 1;
}

if (typeof avatarContainer === undefined) {
    let avatarContainer = document.querySelector('.avatar-container-lobby img');
} else {
    avatarContainer = document.querySelector('.avatar-container-lobby img');
}

if (typeof totalAvatars === undefined) {
    let totalAvatars = 45;
} else {
    totalAvatars = 45;
}

document.getElementById('next').addEventListener('click', () => {
    avatarIndex = (avatarIndex % totalAvatars) + 1; // Passe au suivant
    avatarContainer.src = `/static/images/avatar/avatar_${avatarIndex}.svg`; // Change l'avatar
});

document.getElementById('prev').addEventListener('click', () => {
    avatarIndex = (avatarIndex - 1 + totalAvatars) % totalAvatars || totalAvatars; // Passe au précédent
    avatarContainer.src = `/static/images/avatar/avatar_${avatarIndex}.svg`; // Change l'avatar
});

document.querySelectorAll('.choose-mode').forEach(mode => {
    mode.addEventListener('click', () => {
        document.querySelectorAll('.choose-mode').forEach(m => m.classList.remove('active-mode'));
        mode.classList.add('active-mode');
    });
});

document.querySelector('.randon-button-avatar-lobby').addEventListener('click', () => {
    avatarContainer.src = `/static/images/avatar/avatar_${Math.floor(Math.random() * totalAvatars) + 1}.svg`;
});

if (document.querySelector('.avatar-content-lobby'))  {
    document.querySelector('.avatar-content-lobby').src = `/static/images/avatar/avatar_${Math.floor(Math.random() * totalAvatars) + 1}.svg`;
}
