function updateActiveFriendConversationItem(id) {
    document.querySelectorAll(".friend-conversation-item").forEach(item => {
        item.classList.remove("active-chat-friend-conversation-item");
    });

    const activeItem = document.querySelector(`.friend-conversation-item[data-id="${id}"]`);
    if (activeItem) {
        activeItem.classList.add("active-chat-friend-conversation-item");
    }
}


let searchTimeoutChat;

document.querySelector('#search-bar-friends-chat').addEventListener('input', function () {
    const query = this.value;

    clearTimeout(searchTimeoutChat);

    searchTimeoutChat = setTimeout(() => {
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
        userItem.onclick = () => updateActiveFriendConversationItem(user.id);

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

        userList.appendChild(userItem);
    });
}
