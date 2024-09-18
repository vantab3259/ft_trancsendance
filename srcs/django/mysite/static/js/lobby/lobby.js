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

function openMatchmakingModal() {
    const modal = document.getElementById('matchmakingModal');
    modal.style.display = 'flex';
    window.intervalAvatarMatchmaking = setInterval(changeAvatarRandomly, 2000);
}

function closeMatchmakingModal() {
    const modal = document.getElementById('matchmakingModal');
    clearInterval(window.intervalAvatarMatchmaking);
    modal.style.display = 'none';
}

var socket = null;

document.querySelector(".launch-button-game-content").addEventListener("click", () => {
    openMatchmakingModal();
    console.log("Connection local socket ");
    socket = new WebSocket('wss://localhost:4443/ws/pong/');

    socket.onopen = function(event) {
        console.log("Connexion établie avec le serveur WebSocket");
    };

    socket.onmessage = function(event) {
        let data;
        try {
            data = JSON.parse(event.data);
        } catch (error) {
            console.error("Erreur lors du parsing des données JSON :", error);
            return;
        }

        console.log("Message reçu du serveur : ", event);
        if (data.hasOwnProperty('code') && data['code'] === 4000) {
            closeMatchmakingModal();
            goToPagePongOnline();
        } else if (data.hasOwnProperty('code') && data['code'] === 4001) {
            // réception d'un message envoyé par un autre utilisateur dans la room
            injectIncomingMessage(data.username, data.date, data.userImage, data.message);
        }
    };

    socket.onclose = function(event) {
        console.log("Connexion fermée");
    };

    socket.onerror = function(error) {
        console.error("Erreur WebSocket : ", error);
    };
});

// Fonction d'envoi de message
function sendMessage() {
    const inputMessage = document.getElementById('input-message');
    const message = inputMessage.value;

    if (message.trim() !== '') {
        const date = new Date().toLocaleTimeString();  // Obtenir l'heure actuelle
        const username = "Me";  // À personnaliser avec le nom de l'utilisateur connecté
        
        // Injecter le message dans l'interface
        injectOutgoingMessage(username, date, message);

        // Envoyer le message au serveur via le WebSocket
        const data = JSON.stringify({
            code: 4002,
            message: message,
            date: date,
            username: username
        });
        socket.send(data);

        // Effacer le champ de saisie
        inputMessage.value = '';
    }
}

// Ajouter l'événement "click" sur l'icône d'envoi
document.querySelector('.icon-send').addEventListener('click', sendMessage);

// Ajouter l'événement "Enter" pour envoyer le message
document.getElementById('input-message').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        sendMessage();
    }

    console.log("key => ", event.key);

    if (event.key === ' ') {
        document.querySelector("#input-message").value = document.querySelector("#input-message").value + ' ';
    }
});

function goToPagePongOnline()
{
    document.querySelector('.lobby-include').style.display = "none";
    document.querySelector('.pong-online-include').style.display = "block";
}

function injectOutgoingMessage(username, date, message) {
    const chatContainer = document.querySelector(".msg_history");

    const outgoingMessageHTML = `
        <div class="outgoing_msg">
            <div class="sent_msg">
                <p>${message}</p>
                <span class="time_date"> ${date}</span>
            </div>
        </div>
    `;

    chatContainer.innerHTML += outgoingMessageHTML;
}

function injectIncomingMessage(username, date, userImage, message) {
    const chatContainer = document.querySelector(".msg_history");

    const incomingMessageHTML = `
        <div class="incoming_msg">
            <div class="incoming_msg_img">
                <img src="${userImage}" alt="${username}"> ${username}
            </div>
            <div class="received_msg">
                <div class="received_withd_msg">
                    <p>${message}</p>
                    <span class="time_date"> ${date}</span>
                </div>
            </div>
        </div>
    `;

    chatContainer.innerHTML += incomingMessageHTML;
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



