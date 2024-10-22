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

document.querySelector(".actualize-friends").addEventListener("click", function (e) {

    injectFriends();
});

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

    document.getElementById('loader').style.display = 'none';

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


function injectRanking() {
  fetch('/get-ranking/', {
      method: "GET", 
      headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.status === 'success') {
          injectPlayersIntoRanking(data.players);
      } else {
          console.error("Error: ", data.error);
      }
  })
  .catch(error => {
      console.error('Fetch error:', error);
  });
}

function injectPlayersIntoRanking(players) {
  const rankingList = document.querySelector(".contributor-list.ranking");
  rankingList.innerHTML = '';
  let currentUserId = document.querySelector(".user-pseudo-header").getAttribute('data-user-id');

  players.forEach((player, index) => {
      const playerItem = document.createElement('li');
      playerItem.classList.add('contributor-item');
      if (player.id.toString() === currentUserId) {
          playerItem.classList.add('highlight');
      }

      // Assurez-vous que le prénom et le nom ne sont pas vides
      const name = player.name

      playerItem.innerHTML = `
          <span class="position-number">${index + 1}</span>
          <img src="${player.profile_picture_url}" alt="${name}">
          <div class="contributor-details">
              <span class="contributor-name"></span>
              <span class="contributor-username">@${player.pseudo.toLowerCase()}</span>
          </div>
          <div class="performance-stats">
              <span class="matches-won">Matches Won: ${player.matches_won}</span>
              <span class="titles-won">Titles Won: ${player.titles_won}</span>
          </div>
      `;

      rankingList.appendChild(playerItem);
  });

  if (players.length === 0) {
      rankingList.innerHTML = '<li class="no-results">No players found in the ranking.</li>';
  }
}


function injectGameHistory() {
  fetch('/get-history-game/', {
      method: "GET", 
      headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.status === 'success') {
          injectGamesIntoHistory(data.games);
      } else {
          console.error("Error: ", data.error);
      }
  })
  .catch(error => {
      console.error('Fetch error:', error);
  });
}

function injectGamesIntoHistory(games) {
  const historyList = document.querySelector(".match-history-list");
  historyList.innerHTML = '';

  games.forEach((game) => {
      const gameItem = document.createElement('li');
      gameItem.classList.add('match-history-item', game.result);

      gameItem.innerHTML = `
          <div class="player-info-wrapper">
              <img src="${document.querySelector('.user-pseudo-header').getAttribute('data-profile-url')}" alt="Player's Profile Picture" class="player-image">
          </div>
          <div class="content-versus">
              <span class="versus">Vs</span>
          </div>
          <div class="opponent-info-wrapper">
              <span class="opponent-name">${game.opponent_name}</span>
              <img src="${game.opponent_image}" alt="Opponent's Profile Picture" class="opponent-image">
          </div>
          <div class="match-stats">
              <span class="match-date">${game.date}</span>
              <span class="match-score">Score: ${game.score}</span>
              <span class="match-duration">Duration: ${game.duration}</span>
          </div>
      `;

      historyList.appendChild(gameItem);
  });

  if (games.length === 0) {
      historyList.innerHTML = '<li class="label-no-games-found">No games found.</li>';
  }
}

