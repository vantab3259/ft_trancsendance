function updateActiveFriendConversationItem(id) {
  // Désactiver tous les éléments de la liste de conversation
  document.querySelectorAll(".friend-conversation-item").forEach(item => {
      item.classList.remove("active-chat-friend-conversation-item");
  });

  // Activer l'élément sélectionné
  const activeItem = document.querySelector(`.friend-conversation-item[data-id="${id}"]`);
  if (activeItem) {
      activeItem.classList.add("active-chat-friend-conversation-item");
  }

  fetch(`/chat/messages/${id}?limit=30`)
      .then(response => {
          if (!response.ok) {
              throw new Error("Erreur lors de la récupération des messages");
          }
          return response.json();
      })
      .then(data => {
          const msgHistory = document.querySelector(".msg_history");
          msgHistory.innerHTML = ""; // Effacer les messages précédents

          data.messages.forEach(msg => {
              if (msg.sender_id === id) {
                  // Message reçu
                  displayReceivedMessage({
                      message: msg.content,
                      date: msg.timestamp,
                      userImage: msg.sender_image, // URL de l'image de l'utilisateur
                      username: msg.sender_name
                  });
              } else {
                  // Message envoyé
                  displaySentMessage({
                      message: msg.content,
                      date: msg.timestamp
                  });
              }
          });
      }).then(() => {
        document.querySelector(".messaging.open").classList.remove("v-hidden");
      })
      .catch(error => {
          console.error("Erreur :", error);
      });
}



let searchTimeoutChat;

function friendsChats(query = "") {
    fetch('/search-users/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ query: query, mode: 'friends' })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                injectUsersIntoListChat(data.users, 'friends');
            } else {
                console.error('Errors', data.error);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la requête:', error);
        });
}

document.querySelector('#search-bar-friends-chat').addEventListener('input', function () {
    const query = this.value;

    clearTimeout(searchTimeoutChat);

    searchTimeoutChat = setTimeout(function () {
        friendsChats(query);
    }, 500);
});

document.querySelector('.actualize-friends-chat').addEventListener('click', function () {
    const query = document.querySelector('#search-bar-friends-chat').value;

    fetch('/search-users/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ query: query, mode: 'friends' })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                injectUsersIntoListChat(data.users, 'friends');
            } else {
                console.error('Errors', data.error);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la requête:', error);
        });

});


function injectUsersIntoListChat(users) {
    const userList = document.querySelector(".friend-conversation-list");
    userList.innerHTML = '';

    if (users.length === 0) {
        userList.innerHTML = '<li class="no-results">No friends found.</li>';
        return;
    }

    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.classList.add('friend-conversation-item');
        userItem.setAttribute('data-id', user.id);
        userItem.onclick = () => {
          updateActiveFriendConversationItem(user.id);
          openSocket(userItem);
        } 

        userItem.innerHTML = `

            <div class="friend-conversation-item-profile-img-container" onclick="openSocket(event)">
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

        userList.appendChild(userItem);
    });
}

let socketChat = null;
let selectedFriendId = null;

function openSocket() {
  if (socketChat && socketChat.readyState === WebSocket.OPEN) {
      console.log("WebSocket est déjà connecté.");
      return;
  }

  socketChat = new WebSocket(`wss://localhost:4443/ws/pong/`);

  socketChat.onopen = () => {
      console.log("Connexion WebSocket établie");
  };

  socketChat.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.code === 4001) {
          displayReceivedMessage(data);
      }
  };

  socketChat.onclose = () => {
      console.log("WebSocket fermé");
  };

  socketChat.onerror = (error) => {
      console.error("Erreur WebSocket :", error);
  };
}

// Fonction pour envoyer un message via WebSocket
function sendMessage() {
  const messageInput = document.getElementById("input-message");
  const message = messageInput.value.trim();
  let recipientId = document.querySelector('.active-chat-friend-conversation-item').getAttribute('data-id');

  if (message && recipientId && socketChat && socketChat.readyState === WebSocket.OPEN) {
    const data = { message, recipient_id: recipientId };
    socketChat.send(JSON.stringify(data));

    displaySentMessage({
      message: message,
      date: new Date().toLocaleString()
    });

    messageInput.value = "";
  }
}

// Ajouter un événement pour envoyer le message avec Enter
document.getElementById("input-message").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
      sendMessage();
  }
});

// Fonction pour afficher le message envoyé
function displaySentMessage(data) {
  const msgHistory = document.querySelector(".msg_history");
  const outgoingMsg = document.createElement("div");
  outgoingMsg.classList.add("outgoing_msg");
  outgoingMsg.innerHTML = `
      <div class="sent_msg">
          <p>${data.message}</p>
          <span class="time_date">${data.date}</span>
      </div>`;
  msgHistory.appendChild(outgoingMsg);
  let msgs = document.querySelector(".mesgs");
  msgHistory.scrollTop = msgHistory.scrollHeight;
  scrollToBottom(msgs);
}

// Fonction pour afficher le message reçu
function displayReceivedMessage(data) {
  const msgHistory = document.querySelector(".msg_history");
  let msgs = document.querySelector(".mesgs");
  const incomingMsg = document.createElement("div");
  incomingMsg.classList.add("incoming_msg");
  incomingMsg.innerHTML = `
      <div class="incoming_msg_img"><img src="${data.userImage}" alt="${data.username}"></div>
      <div class="received_msg">
          <div class="received_withd_msg">
              <p>${data.message}</p>
              <span class="time_date">${data.date}</span>
          </div>
      </div>`;
  msgHistory.appendChild(incomingMsg);
  msgHistory.scrollTop = msgHistory.scrollHeight;
  scrollToBottom(msgs);
}

// Attacher l'envoi du message au clic sur l'icône d'envoi
document.querySelector(".icon-send i").addEventListener("click", sendMessage);

// Fonction pour faire défiler automatiquement vers le bas
function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}