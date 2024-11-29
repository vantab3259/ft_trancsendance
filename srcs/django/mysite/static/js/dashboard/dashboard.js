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

    const clickedButton = event.target;
    let mode = document.querySelector(".option-friend-button.active span").getAttribute('data-mode')

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



document.getElementById('search-user-btn').addEventListener('click', function () {
    const userId = document.getElementById('user-id-search').value;

    if (!userId) {
        alert('Please enter a User ID.');
        return;
    }

    fetch(`/get-user-by-id/?user_id=${userId}`, {
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
                fetchMatchHistory(userId);
            } else {
                console.error(data.error);
                alert('User not found.');
            }
        })
        .catch(error => console.error('Error:', error));
});


function populateUserData(user) {
    const profilePictureElement = document.querySelector('.dashboard-picture-header');
    profilePictureElement.src = user.profile_picture;
    profilePictureElement.alt = `${user.pseudo}'s Profile Picture`;

    const pseudoContainer = document.querySelector('.pseudo-container .row-pseudo span');
    pseudoContainer.innerText = user.first_name || user.last_name
        ? `${user.first_name} ${user.last_name}`.trim()
        : user.pseudo;

    const emailElement = document.querySelector('.row-info.mail .data a');
    emailElement.href = `mailto:${user.email}`;
    emailElement.innerText = user.email;

    const isOnlineIndicator = document.querySelector('.row-info.city .data');
    isOnlineIndicator.innerText = user.is_online ? 'Online' : 'Offline';

    const editLink = document.querySelector('.link-edit-profile-dashboard');
    if (editLink) {
        editLink.style.display = 'none';
    }
}

function fetchMatchHistory(userId) {
    fetch(`/get-user-match-history/?user_id=${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                injectGamesIntoHistory(data.games);
            } else {
                console.error(data.error);
                alert('Unable to fetch match history.');
            }
        })
        .catch(error => console.error('Error:', error));
}

function injectGamesIntoHistory(games) {
    const historyList = document.querySelector(".match-history-list");
    historyList.innerHTML = '';

    games.forEach((game) => {
        const gameItem = document.createElement('li');
        gameItem.classList.add('match-history-item', game.result);

        gameItem.innerHTML = `
            <div class="player-info-wrapper">
                <img src="${game.opponent_image}" alt="Opponent's Profile Picture" class="opponent-image">
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

function renderRankingChart(players) {
    const chartContainer = document.getElementById('rankingBarChart');
    chartContainer.innerHTML = '';

    const maxMatches = Math.max(...players.map(player => player.matches_won));

    players.forEach(player => {
        const barContainer = document.createElement('div');
        barContainer.classList.add('bar');

        const label = document.createElement('div');
        label.classList.add('bar-label');
        label.innerText = player.pseudo;

        const barInnerContainer = document.createElement('div');
        barInnerContainer.classList.add('bar-container');

        const barVisual = document.createElement('div');
        barVisual.classList.add('bar-visual');
        barVisual.style.width = `${(player.matches_won / maxMatches) * 100}%`;

        const value = document.createElement('div');
        value.classList.add('bar-value');
        value.innerText = `${player.matches_won} wins`;

        barInnerContainer.appendChild(barVisual);
        barInnerContainer.appendChild(value);

        barContainer.appendChild(label);
        barContainer.appendChild(barInnerContainer);

        chartContainer.appendChild(barContainer);
    });
}

function fetchAndRenderRankingChart() {
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
            renderRankingChart(data.players);
        } else {
            console.error("Error: ", data.error);
        }
    })
    .catch(error => console.error('Fetch error:', error));
}

fetchAndRenderRankingChart();


document.getElementById('my-profile-btn').addEventListener('click', function () {
    const loggedInUserId = document.querySelector('.user-pseudo-header').getAttribute('data-user-id');

    if (!loggedInUserId) {
        alert('Unable to retrieve your profile.');
        return;
    }

    fetch(`/get-user-by-id/?user_id=${loggedInUserId}`, {
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
                fetchMatchHistory(loggedInUserId);
            } else {
                console.error(data.error);
                alert('Unable to retrieve your profile.');
            }
        })
        .catch(error => console.error('Error:', error));
});

