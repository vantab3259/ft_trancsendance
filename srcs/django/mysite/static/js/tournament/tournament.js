async function onCreateTournament() {
    const tournamentName = document.getElementById('tournament-name').value;
    if (!tournamentName) {
        alert("Please enter a tournament name.");
        return;
    }

    console.log('Creating tournament with name:', tournamentName);

    const response = await fetch('/tournament/create/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: tournamentName })
    });

    const data = await response.json();

    if (data.status === 'success') {
        console.log('Tournament created successfully:', data.tournament_id);

        localStorage.setItem('tournament_id', data.tournament_id);
        showWaitingRoom();
        pollForPlayers(data.tournament_id);
    } else {
        console.error('Error creating tournament:', data.error);
        alert(data.error);
    }
}


async function onJoinTournament() {
    const tournamentId = document.getElementById('join-tournament-id').value;
    if (!tournamentId) {
        alert("Please enter a tournament code.");
        return;
    }

    console.log('Joining tournament with ID:', tournamentId);

    const response = await fetch(`/tournament/${tournamentId}/join/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    const data = await response.json();

    if (data.status === 'success') {
        console.log('Joined tournament successfully:', tournamentId);

        localStorage.setItem('tournament_id', tournamentId);
        showWaitingRoom();
        pollForPlayers(tournamentId);
    } else {
        console.error('Error joining tournament:', data.error);
        alert(data.error);
    }
}

function showWaitingRoom() {
    console.log('Switching to the waiting room.');
    document.getElementById('create-or-join-section').style.display = 'none';
    document.getElementById('waiting-room').style.display = 'block';
}


function showTournamentBracket() {
    document.getElementById('waiting-room').style.display = 'none';
    document.getElementById('tournament-section').style.display = 'block';
}

async function pollForPlayers(tournamentId) {
    console.log('Polling for players in tournament:', tournamentId);

    const playerListElement = document.getElementById('player-names');

    const interval = setInterval(async () => {
        console.log('Polling tournament details...');

        try {
            const response = await fetch(`/tournament/${tournamentId}/details/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                console.error('Error response from server:', response.status);
                clearInterval(interval);
                alert('Failed to fetch tournament details.');
                return;
            }

            const data = await response.json();
            console.log('Received tournament data:', data); 

            if (data.status === 'success') {
                const players = [];
                data.tournament.rounds[0].matches.forEach(match => {
                    if (match.player1) players.push(match.player1);
                    if (match.player2) players.push(match.player2);
                });

                playerListElement.innerHTML = players.map(player => {
                    const playerName = player.pseudo || player.email || 'Unknown Player';
                    return `<li>${playerName}</li>`;
                }).join('');

                if (players.length === 4) {
                    console.log('4 players joined. Launching tournament.');
                    clearInterval(interval);
                    alert("The tournament is starting!");
                    showTournamentBracket();
                    loadTournamentDetails(tournamentId);
                }
            } else {
                console.error('Error fetching tournament details:', data.error);
                clearInterval(interval);
                alert(data.error);
            }
        } catch (error) {
            console.error('Error during polling:', error);
            clearInterval(interval);
        }
    }, 2000); 
}

async function loadTournamentDetails(tournamentId) {
    try {
        console.log('Fetching tournament details for:', tournamentId); 

        const response = await fetch(`/tournament/${tournamentId}/details/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        console.log('Fetch response received'); 
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to load tournament details.');
        }

        const data = await response.json();

        if (data.status === 'success') {
            console.log('Tournament data:', data); 
            const tournament = data.tournament;

            document.querySelector('.title-tournament').textContent = tournament.name;
            displayTournamentDetails(tournament);
            document.getElementById('waiting-room').style.display = 'none';
            document.getElementById('tournament-section').style.display = 'block';
        } else {
            throw new Error(data.error || 'Failed to load tournament details.');
        }
    } catch (error) {
        console.error('Error loading tournament details:', error);
        alert(error.message);
    }
}




function displayTournamentDetails(tournament) {
    const bracketContainer = document.getElementById('tournament-bracket');
    bracketContainer.innerHTML = ''; // Clear previous content

    // No need to retrieve currentUserId from localStorage
    // const currentUserId = parseInt(localStorage.getItem('user_id'), 10);

    // Iterate over rounds
    tournament.rounds.forEach(round => {
        const roundDiv = document.createElement('div');
        roundDiv.classList.add('column');
        roundDiv.innerHTML = `<h3>Round ${round.round_number}</h3>`;

        // Iterate over matches in the round
        round.matches.forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.classList.add('match');

            const player1Name = match.player1 ? match.player1.pseudo || match.player1.email : 'TBD';
            const player2Name = match.player2 ? match.player2.pseudo || match.player2.email : 'TBD';
            const winnerId = match.winner ? match.winner.id : null;

            let playButtonHtml = '';

            // Use the flag provided by the server
            if (!match.is_complete && match.is_current_user_in_match) {
                playButtonHtml = `<button id="play-button-${match.match_id}" onclick="startTournamentGame(${match.match_id})">Ready</button>`;
            }

            const matchHtml = `
                <div class="team">
                    <span class="seed">${player1Name}</span>
                    <span class="name">${match.player1 && winnerId === match.player1.id ? '(Winner)' : ''}</span>
                </div>
                <div class="team">
                    <span class="seed">${player2Name}</span>
                    <span class="name">${match.player2 && winnerId === match.player2.id ? '(Winner)' : ''}</span>
                </div>
                ${playButtonHtml}
            `;
            matchDiv.innerHTML = matchHtml;

            roundDiv.appendChild(matchDiv);
        });

        bracketContainer.appendChild(roundDiv);
    });
}




function startTournamentGame(matchId) {
    if (!matchId) {
        console.error("No match ID provided for matchmaking.");
        alert("Unable to start the game. Please try again.");
        return;
    }

    console.log("Starting matchmaking for tournament match:", matchId);


    modePlay = 'online';
    const mapType = window.otherMap;
    const mapTypeStr = mapType ? 'true' : 'false';
    socketPong = new WebSocket(`wss://localhost:4443/ws/tournament/match/${matchId}/`);
    openMatchmakingModal();

    socketPong.onopen = function () {
        console.log("Connecté au WebSocket Pong Server");
        socketPong.send(JSON.stringify({
            'type': 'start_game'
        }));
    };

    const playButton = document.getElementById(`play-button-${matchId}`);
    if (playButton) {
        playButton.disabled = true;
        playButton.textContent = "Waiting for other player..."; 
        playButton.style.cursor = "not-allowed";
    }



    socketPong.onmessage = function (event) {
        let data = JSON.parse(event.data);

        if (data.type === 'player_position') {
            isPlayerLeft = data.isPlayerLeft; 
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
            document.getElementById("goofysettings").style.display = "block";
            document.getElementById("settingslobby").style.display = "block";

            let winnerName = data.winner_name; 
            let winnerId = data.winner_id;    

            let currentUserId = document.querySelector(".user-pseudo-header").getAttribute('data-user-id');
            let resultModal = document.querySelector("#resultModal");
            let resultText = document.querySelector("#resultText");
            closeWebSocket();
            if (winnerId.toString() === currentUserId) {
                resultText.innerHTML = "You win 😻 !";
                resultModal.style.display = "contents";
            } else {
                resultText.innerHTML = "You lose 😿 !";
                resultModal.style.display = "contents";
            }

            if (window.gameInterval) {
                clearInterval(window.gameInterval);
            }
        }

        if (data.type === 'game_update') {
            updateGameState(data);
        }
    };



    socketPong.onclose = function () {
        closeWebSocket()
        console.log("Déconnecté du WebSocket Pong Server");
    };
 
}
