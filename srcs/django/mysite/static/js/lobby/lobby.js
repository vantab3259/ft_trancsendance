
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

function openMatchmakingModal() {
    const modal = document.getElementById('matchmakingModal');
    modal.style.display = 'flex';
    window.intervalAvatarMatchmaking = setInterval(changeAvatarRandomly, 2000);
}

function closeMatchmakingModal() {
    const modal = document.getElementById('matchmakingModal');
    document.getElementById('settingslobby').style.display = 'block';
    document.getElementById('settingsTOUR').style.display = 'block';
    clearInterval(window.intervalAvatarMatchmaking);
    modal.style.display = 'none';
}


if (typeof totalAvatarsMatchmaking === undefined) {
    const totalAvatarsMatchmaking = 45;
}

if (typeof currentAvatarIndexMatchmaking === undefined) {
    let currentAvatarIndexMatchmaking = 1;
} else {
    currentAvatarIndexMatchmaking = 1;
}


function changeAvatarRandomly() {

    document.getElementById('matchmakingAvatar').classList.add('fade-out');

    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * totalAvatars) + 1;
        document.getElementById('matchmakingAvatar').src = `/static/images/avatar/avatar_${randomIndex}.svg`;
        document.getElementById('matchmakingAvatar').classList.remove('fade-out');
    }, 500);
}



