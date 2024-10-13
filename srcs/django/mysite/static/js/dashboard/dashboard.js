if (typeof pageContent !== 'undefined' && pageContent) {
    pageContent = document.querySelector("div.content");
} else {
    pageContent = document.querySelector("div.content");
}


document.querySelector("#link-edit").addEventListener("click", function (e) {
    e.preventDefault();
    currentPageClick = "profile"
    displayPage();
    history.pushState(null, '', '/profile/edit');
    document.querySelector("title").innerHTML = 'Profile';


});


function injectFriends() {
    let value = document.querySelector("#search-bar-friends").value;
    let mode = document.querySelector(".option-friend-button.active span").getAttribute("data-mode");

    fetch('/search-users/', {
        method: "POST", mode: "cors", headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }, body: JSON.stringify({
            query: value, 'mode': mode
        }),
    })
        .then(response => {
            return response.json();
        })
        .then(data => {

            if (data.status === 'success') {
                injectUsersIntoList(data.users, mode);
            } else {
                console.error("Error: ", data.error);
            }

        })

}


let timeoutId;
document.querySelector("#search-bar-friends").addEventListener("keyup", function (e) {

    clearTimeout(timeoutId);

    timeoutId = setTimeout(injectFriends, 500)

});


document.getElementById('search-bar-friends').addEventListener('keydown', function (event) {

    if (event.key === ' ') {
        document.querySelector("#search-bar-friends").value = document.querySelector("#search-bar-friends").value + ' ';
    }
});


function injectUsersIntoList(users, mode) {
    const userList = document.querySelector(".contributor-list.friend");
    userList.innerHTML = '';

    users.forEach(user => {
        const userItem = document.createElement('li');
        userItem.classList.add('contributor-item', 'friend');

        // Vérifie si l'utilisateur est en ligne pour définir la couleur du point
        const onlineStatusColor = user.is_online ? 'green' : 'red';

        userItem.innerHTML = `
            <img src="${user.profile_picture}" alt="${user.first_name} ${user.last_name}">
            <div class="contributor-details friend">
                <span class="contributor-name friend">${user.first_name} ${user.last_name}</span>
                <span class="contributor-username friend">@${user.pseudo}</span>
                ${mode === "friends" ? `
                    <div id="center-div">
                        <div class="bubble">
                            <span class="bubble-outer-dot item-dashboard">
                                <span class="bubble-inner-dot" style="background-color: ${onlineStatusColor};"></span>
                            </span>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="performance-stats friend">
                ${mode === "pending"
            ? `<button onclick="addFriend(event)" class="add-friend-button" data-id="${user.id}" >Accept</button>`
            : (mode === "friends" ? '' : `<button onclick="addFriend(event)" class="add-friend-button" data-id="${user.id}" >Add</button>`)}
            </div>
        `;

        userList.appendChild(userItem);
    });

    if (users.length === 0) {
        userList.innerHTML = '<li class="no-results">No friends found.</li>';
    }
}


document.querySelectorAll(".option-friend-button").forEach((e) => {

    e.addEventListener("click", function (e) {

        let oldActiveButton = document.querySelector(".option-friend-button.active");
        oldActiveButton.classList.remove("active");
        let newActiveLabel;

        if (e.target.tagName === "SPAN") {
            newActiveLabel = e.target.parentElement;
        } else {
            newActiveLabel = e.target;
        }

        newActiveLabel.classList.add("active");
        injectFriends()


    })
});


function addFriend(event) {

    // Get the clicked button element
    const clickedButton = event.target;
    let mode = document.querySelector(".option-friend-button.active span").getAttribute('data-mode')

    // Get the value of data-id attribute
    const userId = clickedButton.dataset.id;
    fetch('/request-friend/', {
        method: "POST", mode: "cors", headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }, body: JSON.stringify({
            query: userId,
			'mode': mode
        }),
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            injectFriends()
            
            if (mode == "add") {
                showFlashMessage('success', '✅ Your invitation has been sent successfully.');
            } else {
                showFlashMessage('success', "✅ Your invitation has been successfully accepted.");
            }

        })
}




