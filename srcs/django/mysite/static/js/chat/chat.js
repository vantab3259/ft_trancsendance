
let selectedFriendId = null;
let searchTimeoutChat;
let blockList = [];

function initPageChat() {
    setupEventListeners();
    fetchBlockList();
    friendsChats();

    
}

// Initialiser les écouteurs d'événements
function setupEventListeners() {
    document.querySelector('#search-bar-friends-chat').addEventListener('input', handleSearchInput);
    document.querySelector('.actualize-friends-chat').addEventListener('click', handleActualizeClick);
    document.querySelector(".icon-send i").addEventListener("click", sendMessage);
    document.getElementById("input-message").addEventListener("keypress", handleKeyPress);

    document.querySelector(".ban-user").addEventListener("click", handleBlockUser);
    document.querySelector("#unblock-user-button").addEventListener("click", handleUnblockUser);
}

// Gestionnaire pour la recherche d'amis
function handleSearchInput() {
    const query = this.value;
    clearTimeout(searchTimeoutChat);
    searchTimeoutChat = setTimeout(() => friendsChats(query), 500);
}

// Gestionnaire pour actualiser la liste d'amis
function handleActualizeClick() {
    const query = document.querySelector('#search-bar-friends-chat').value;
    friendsChats(query);
}

// Gestionnaire pour l'envoi du message avec la touche Entrée
function handleKeyPress(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
}

// Récupérer la liste des amis
function friendsChats(query = "") {
    searchUsers(query, 'friends', injectUsersIntoListChat);
}

// Fonction générique pour rechercher des utilisateurs
function searchUsers(query, mode, successCallback, errorCallback) {
    fetch('/search-users/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ query: query, mode: mode })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            successCallback(data.users);
        } else {
            console.error('Erreur :', data.error);
            if (errorCallback) errorCallback(data.error);
        }
    })
    .catch(error => {
        console.error('Erreur lors de la requête :', error);
        if (errorCallback) errorCallback(error);
    });
}

// Obtenir les en-têtes d'authentification
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

// Injecter les utilisateurs dans la liste de chat
function injectUsersIntoListChat(users) {
    const userList = document.querySelector(".friend-conversation-list");
    userList.innerHTML = '';

    if (users.length === 0) {
        userList.innerHTML = '<li class="no-results">No friends found.</li>';
        return;
    }

    users.forEach(user => {
        const userItem = createUserItem(user);
        userList.appendChild(userItem);
    });
}

// Créer un élément de la liste d'utilisateurs
function createUserItem(user) {
    const userItem = document.createElement('div');
    userItem.classList.add('friend-conversation-item');
    userItem.setAttribute('data-id', user.id);
    userItem.onclick = () => {
        updateActiveFriendConversationItem(user.id);
        openSocket();
    };

    userItem.innerHTML = `
        <div class="friend-conversation-item-profile-img-container">
            &nbsp;
            <img src="${user.profile_picture}" alt="${user.first_name} ${user.last_name}" class="friend-conversation-item-profile-img">
        </div>
        <div class="friend-conversation-item-message-preview">
            <div class="friend-conversation-item-message-preview-top">
                <span class="friend-conversation-item-pseudo">${user.pseudo}</span>
                <span class="friend-conversation-item-datetime">04/10/2024</span>
            </div>
            <div class="friend-conversation-item-message-preview-bottom">
                <span class="friend-conversation-item-last-message">Last message preview here...</span>
            </div>
            <div id="center-div">
                <div class="bubble">
                    <span class="bubble-outer-dot item-chat">
                        <span class="bubble-inner-dot" style="background-color: ${user.is_online ? 'green' : 'red'};"></span>
                    </span>
                </div>
            </div>
        </div>
    `;

    return userItem;
}

// Mettre à jour l'élément de conversation actif
function updateActiveFriendConversationItem(id) {
    selectedFriendId = id;
    deactivateAllConversationItems();
    activateConversationItem(id);

    const userBlockedElement = document.querySelector("#userblocked");

    if (blockList.includes(id)) {
        showBlockedMessage();
    } else {
        hideBlockedMessage();
        fetchMessages(id);
    }

    refreshUI();
}

function refreshUI() {
    const messagingOpenElement = document.querySelector(".messaging.open");
    const mesgsElement = document.querySelector(".mesgs");
    const inputMessageContainer = document.querySelector(".input-message-container");
    const userBlockedElement = document.querySelector("#userblocked");
    const unblockButton = document.querySelector("#unblock-user-button");

    if (blockList.includes(selectedFriendId)) {
        messagingOpenElement.classList.remove("v-hidden");
        mesgsElement.classList.add("hidden");
        inputMessageContainer.classList.add("hidden");
        userBlockedElement.classList.remove("hidden");
        unblockButton.classList.remove("hidden");
    } else {
        messagingOpenElement.classList.remove("v-hidden");
        mesgsElement.classList.remove("hidden");
        inputMessageContainer.classList.remove("hidden");
        userBlockedElement.classList.add("hidden");
        unblockButton.classList.add("hidden");
    }
}


// Désactiver tous les éléments de conversation
function deactivateAllConversationItems() {
    document.querySelectorAll(".friend-conversation-item").forEach(item => {
        item.classList.remove("active-chat-friend-conversation-item");
    });
}

// Activer l'élément de conversation sélectionné
function activateConversationItem(id) {
    const activeItem = document.querySelector(`.friend-conversation-item[data-id="${id}"]`);
    if (activeItem) {
        activeItem.classList.add("active-chat-friend-conversation-item");
    }
}

// Récupérer les messages entre l'utilisateur actuel et le destinataire
function fetchMessages(id) {
    fetch(`/chat/messages/${id}?limit=30`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des messages");
            }
            return response.json();
        })
        .then(data => {
            displayMessages(data.messages, id);
            document.querySelector(".messaging.open").classList.remove("v-hidden");
        })
        .catch(error => {
            console.error("Erreur :", error);
        });
}

// Afficher les messages dans l'interface
function displayMessages(messages, id) {
    const msgHistory = document.querySelector(".msg_history");
    msgHistory.innerHTML = ""; // Effacer les messages précédents

    messages.forEach(msg => {
        if (msg.sender_id === id) {
            displayReceivedMessage({
                message: msg.content,
                date: msg.timestamp,
                userImage: msg.sender_image,
                username: msg.sender_name
            });
        } else {
            displaySentMessage({
                message: msg.content,
                date: msg.timestamp
            });
        }
    });
}

// Ouvrir une connexion WebSocket
function openSocket() {
    if (socketChat && socketChat.readyState === WebSocket.OPEN) {
        console.log("WebSocket est déjà connecté.");
        return;
    }

    socketChat = new WebSocket(`wss://${window.location.host}/ws/chat/`);

    socketChat.onopen = () => {
        console.log("Connexion WebSocket établie");
    };

    socketChat.onmessage = handleSocketMessage;
    socketChat.onclose = () => {
        console.log("WebSocket fermé");
    };
    socketChat.onerror = (error) => {
        console.error("Erreur WebSocket :", error);
    };
}

// Gestionnaire pour les messages WebSocket
function handleSocketMessage(event) {
    const data = JSON.parse(event.data);
    
    if (data.code === 4001) {
        displayReceivedMessage(data);
    }
}

// Envoyer un message via WebSocket
function sendMessage() {
    const messageInput = document.getElementById("input-message");
    const message = messageInput.value.trim();

    if (message && selectedFriendId && socketChat && socketChat.readyState === WebSocket.OPEN) {
        const data = { message, recipient_id: selectedFriendId };
        socketChat.send(JSON.stringify(data));

        displaySentMessage({
            message: message,
            date: new Date().toLocaleString()
        });

        messageInput.value = "";
    }
}

// Afficher le message envoyé
function displaySentMessage(data) {
    appendMessageToHistory('outgoing_msg', `
        <div class="sent_msg">
            <p>${data.message}</p>
            <span class="time_date">${data.date}</span>
        </div>
    `);
}

// Afficher le message reçu
function displayReceivedMessage(data) {
    appendMessageToHistory('incoming_msg', `
        <div class="incoming_msg_img"><img src="${data.userImage}" alt="${data.username}"></div>
        <div class="received_msg">
            <div class="received_withd_msg">
                <p>${data.message}</p>
                <span class="time_date">${data.date}</span>
            </div>
        </div>
    `);
}

// Ajouter un message à l'historique
function appendMessageToHistory(messageClass, innerHTML) {
    const msgHistory = document.querySelector(".msg_history");
    let mesgs = document.querySelector(".mesgs");
    const messageElement = document.createElement("div");
    messageElement.classList.add(messageClass);
    messageElement.innerHTML = innerHTML;
    msgHistory.appendChild(messageElement);
    scrollToBottom(mesgs);
}

// Faire défiler automatiquement vers le bas
function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}



function handleBlockUser() {
    if (!selectedFriendId) {
        alert("No user selected to block.");
        return;
    }

    fetch('/add-to-blocked-list/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: selectedFriendId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showFlashMessage('error', '❌ User has been blocked successfully.');
            blockList.push(selectedFriendId);
            deactivateAllConversationItems();
            document.querySelector(".messaging.open").classList.add("v-hidden");
        } else {
            console.error('Error blocking user:', data.message || data.error);
            alert("An error occurred while blocking the user.");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred while blocking the user.");
    });
}


function fetchBlockList() {
    fetch('/get-blocked-list/', {
        method: 'GET',
        headers: getAuthHeaders()
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                blockList = data.blocked_users.map(user => user.id);

                if (selectedFriendId) {
                    if (blockList.includes(selectedFriendId)) {
                        showBlockedMessage();
                    } else {
                        hideBlockedMessage();
                    }
                }
            } else {
                console.error('Error fetching block list:', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function showBlockedMessage() {
    const userBlockedElement = document.querySelector("#userblocked");
    const mesgsElement = document.querySelector(".mesgs");
    const inputMessageContainer = document.querySelector(".input-message-container");

    userBlockedElement.classList.remove("hidden");
    mesgsElement.classList.add("hidden");
    inputMessageContainer.classList.add("hidden");
}

function hideBlockedMessage() {
    const userBlockedElement = document.querySelector("#userblocked");
    const mesgsElement = document.querySelector(".mesgs");
    const inputMessageContainer = document.querySelector(".input-message-container");

    userBlockedElement.classList.add("hidden");
    mesgsElement.classList.remove("hidden");
    inputMessageContainer.classList.remove("hidden");
}


function handleUnblockUser() {
    if (!selectedFriendId) {
        alert("No user selected to unblock.");
        return;
    }

    fetch('/remove-from-blocked-list/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: selectedFriendId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showFlashMessage('success', '✅ User has been unblocked successfully.');
            blockList = blockList.filter(id => id !== selectedFriendId);
            hideBlockedMessage();
            refreshUI();
        } else {
            console.error('Error unblocking user:', data.message || data.error);
            alert("An error occurred while unblocking the user.");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred while unblocking the user.");
    });
}


document.querySelector("#uservs-button").addEventListener("click", function () {
    if (socketPong && socketPong.readyState === WebSocket.OPEN) {
        console.log("Disconnecting socketPong...");
        socketPong.close();
        socketPong = null;
    }
    if (!selectedFriendId) {
        alert("Please select a friend to challenge.");
        return;
    }

    modePlay = 'online';
    const mapType = window.otherMap;
    const mapTypeStr = mapType ? 'true' : 'false';
    socketPong = new WebSocket(`wss://${window.location.host}/ws/uservs/${mapTypeStr}/${selectedFriendId}/`);
    openMatchmakingModal();


    if (socketChat && socketChat.readyState === WebSocket.OPEN) {
        isGameInProgress = true;
        handleChallengeButtonVisibility();
        const challengeMessage = {
            message: "I challenge you!",
            recipient_id: selectedFriendId,
        };
        socketChat.send(JSON.stringify(challengeMessage));

        displaySentMessage({
            message: challengeMessage.message,
            date: new Date().toLocaleString(),
        });

    } else {
        console.error("WebSocket for chat is not open. Challenge message could not be sent.");
        isGameInProgress = false;
        handleChallengeButtonVisibility();
    }

    socketPong.onopen = function () {
        console.log("Connecté au WebSocket Pong Server");
        socketPong.send(JSON.stringify({
            'type': 'start_game'
        }));
        isGameInProgress = true;
        handleChallengeButtonVisibility();
    };



    socketPong.onmessage = function (event) {
        let data = JSON.parse(event.data);

        // Réception des informations de démarrage pour savoir si le joueur est à gauche ou à droite
        if (data.type === 'player_position') {
            isPlayerLeft = data.isPlayerLeft; // Si true, le joueur est à gauche
            console.log("Votre position :", isPlayerLeft ? "Gauche" : "Droite");
        }

        if (data.message === "La partie commence!") {
            document.getElementById("goofysettings").style.display = "none";
            closeMatchmakingModal();
            showGamePage();
            lastServerUpdateTime = Date.now();
            startGame();
        }

        if (data.type === 'game_finished') {
            isGameInProgress = false;
            handleChallengeButtonVisibility();
            if (modePlay != 'tournament') {
            // document.getElementById("goofysettings").style.display = "block";
            document.getElementById("settingslobby").style.display = "block";
            document.getElementById("settingsTOUR").style.display = "block";
            }

            let winnerName = data.winner_name; // Utilise 'winner_name'
            let winnerId = data.winner_id;     // Utilise 'winner_id'

            let loggedInUserId = document.querySelector('.user-pseudo-header').getAttribute('data-user-id');

            if (winnerId == loggedInUserId ) {
                showFlashMessage('success', '✅ You Win !');
            } else {
                showFlashMessage('error', '❌ You Lose !');
            }

            // Vérifie si le joueur est le gagnant
            // let currentUserId = document.querySelector(".user-pseudo-header").getAttribute('data-user-id');
            // let resultModal = document.querySelector("#resultModal");
            // let resultText = document.querySelector("#resultText");
            closeWebSocket();
            // if (winnerId.toString() === currentUserId) {
            //     resultText.innerHTML = "You win 😻 !";
            //     resultModal.style.display = "contents";
            // } else {
            //     resultText.innerHTML = "You lose 😿 !";
            //     resultModal.style.display = "contents";
            // }

            // Arrête le jeu
            if (window.gameInterval) {
                clearInterval(window.gameInterval);
            }
        }

        // Réception des mises à jour de position des paddles/balles du joueur opposé
        if (data.type === 'game_update') {
            updateGameState(data);
        }
    };



    socketPong.onclose = function () {
        closeWebSocket()
        console.log("Déconnecté du WebSocket Pong Server");
    };
});

function handleChallengeButtonVisibility() {
    const challengeButton = document.querySelector("#uservs-button");
    if (isGameInProgress) {
        challengeButton.style.display = "none";
    } else {
        challengeButton.style.display = "block";
    }
}



document.querySelector('.view-profile').addEventListener('click', function () {
    if (!selectedFriendId) {
        alert("Please select a friend to view their profile.");
        return;
    }

    currentPageClick = "dashboard";
    loadContent('/dashboard', 'Dashboard', "dashboard", ['/static/js/dashboard/dashboard.js']);

    fetch(`/get-user-by-id/?user_id=${selectedFriendId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            populateUserData(data.user);
            fetchMatchHistory(selectedFriendId);
        } else {
            console.error(data.error);
            alert('User not found.');
        }
    })
    .catch(error => console.error('Error:', error));
});

