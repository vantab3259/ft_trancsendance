async function onCreateTournament() {
    const tournamentName = document.getElementById('tournament-name').value;
    const nickname = document.getElementById('tournament-player-nickname').value;
    
    if (!tournamentName) {

        showFlashMessage('error', '❌ Please enter a tournament name.');

        return;
    }

    console.log('Creating tournament with name:', tournamentName);

    const response = await fetch('/tournament/create/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: tournamentName, nickname })
    });

    const data = await response.json();

    if (data.status === 'success') {
        console.log('Tournament created successfully:', data.tournament_id);

        localStorage.setItem('tournament_id', data.tournament_id);
        showWaitingRoom(tournamentName, data.tournament_id);
        pollForPlayers(data.tournament_id);
    } else {
        console.error('Error creating tournament:', data.error);
        alert(data.error);
    }
}


async function onJoinTournament() {
    const tournamentId = document.getElementById('join-tournament-id').value;
    const nickname = document.getElementById('tournament-player-nickname').value;
    
    if (!tournamentId) {
        showFlashMessage('error', '❌ Please enter a tournament code.');
        return;
    }

    console.log('Joining tournament with ID:', tournamentId);

    const response = await fetch(`/tournament/${tournamentId}/join/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ nickname })
    });

    const data = await response.json();

    if (data.status === 'success') {
        console.log('Joined tournament successfully:', tournamentId);

        localStorage.setItem('tournament_id', tournamentId);
        showWaitingRoom(data.tournament_name, data.tournament_id);
        pollForPlayers(tournamentId);
    } else {
        console.error('Error joining tournament:', data.error);
        alert(data.error);
    }
}

function showWaitingRoom(tournamentName = '', tournamentId = '') {
    clickOnReadyButton = 0
    console.log('Switching to the waiting room.');
    document.getElementById('create-or-join-section').style.display = 'none';
    document.getElementById('waiting-room').style.display = 'block';
    document.getElementById("settingsTOUR").style.display = "none";

    if (tournamentName) {
        document.getElementById('tournament-room-name').textContent = `Tournament Name: ${tournamentName}`;
    }
    if (tournamentId) {
        document.getElementById('tournament-room-id').textContent = `Tournament ID: ${tournamentId}`;
    }
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
                showFlashMessage('error', '❌ Failed to fetch tournament details.');

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
                    return `<li class="player-information-tournament-container">${playerName}</li>`;
                }).join('');

                if (players.length === 4) {
                    console.log('4 players joined. Launching tournament.');
                    clearInterval(interval);
                    showFlashMessage('success', '✅ The tournament is starting!');

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
    bracketContainer.innerHTML = '';

    tournament.rounds.forEach(round => {
        const roundDiv = document.createElement('div');
        roundDiv.classList.add('column');
        roundDiv.innerHTML = `<h3>Round ${round.round_number}</h3>`;

        round.matches.forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.classList.add('match');

            const player1Name = match.player1 ? match.player1.pseudo || match.player1.email : 'TBD';
            const player2Name = match.player2 ? match.player2.pseudo || match.player2.email : 'TBD';
            const winnerId = match.winner ? match.winner.id : null;

            let playButtonHtml = '';

            if (!match.is_complete && match.is_current_user_in_match && clickOnReadyButton !== 2) {
                playButtonHtml = `<button id="play-button-${match.match_id}" onclick="startTournamentGame(${match.match_id}, ${tournament.id})">Ready</button>`;
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




function startTournamentGame(matchId, tournamentId) {
    if (!matchId) {
        console.error("No match ID provided for matchmaking.");

        showFlashMessage('error', '❌ Unable to start the game. Please try again.');
        return;
    }

    console.log("Starting matchmaking for tournament match:", matchId);



    modePlay = 'tournament';
    const mapType = window.otherMap;
    const mapTypeStr = mapType ? 'true' : 'false';
    socketPong = new WebSocket(`wss://${window.location.host}/ws/tournament/match/${matchId}/`);
    openMatchmakingModal();

    socketPong.onopen = function () {
        console.log("Connecté au WebSocket Pong Server");
        socketPong.send(JSON.stringify({
            'type': 'start_game'
        }));
    };

    let playButton = document.getElementById(`play-button-${matchId}`);
    if (playButton) {
        playButton.disabled = true;
        playButton.textContent = "Waiting for other player..."; 
        playButton.style.cursor = "not-allowed";
        clickOnReadyButton++;
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


            let winnerName = data.winner_name; 
            let winnerId = data.winner_id; 
            let loggedInUserId = document.querySelector('.user-pseudo-header').getAttribute('data-user-id');

            if (winnerId == loggedInUserId ) {
                showFlashMessage('success', '✅ You Win !');
            } else {
                showFlashMessage('error', '❌ You Lose !');
            }

            closeWebSocket();


            if (window.gameInterval) {
                clearInterval(window.gameInterval);
            }

            pollTournamentUpdates(tournamentId);
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


async function updateTournamentBracket(tournamentId) {
    try {
        console.log('Updating tournament bracket for:', tournamentId);

        const response = await fetch(`/tournament/${tournamentId}/details/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to load tournament details.');
        }

        const data = await response.json();

        if (data.status === 'success') {
            console.log('Tournament details updated:', data);

            const tournament = data.tournament;
            displayTournamentDetails(tournament);
        } else {
            throw new Error(data.error || 'Failed to update tournament bracket.');
        }
    } catch (error) {
        console.error('Error updating tournament bracket:', error);
        alert(error.message);
    }
}


async function pollTournamentUpdates(tournamentId) {
    console.log('Polling tournament updates for:', tournamentId);

    let hasBeenNotified = false;

    const interval = setInterval(async () => {
        try {
            const response = await fetch(`/tournament/${tournamentId}/details/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                console.error('Error fetching tournament details:', response.status);
                clearInterval(interval);

                showFlashMessage('error', '❌ Failed to fetch tournament updates.');

                return;
            }

            const data = await response.json();
            console.log('Received updated tournament data:', data);

            if (data.status === 'success') {
                const tournament = data.tournament;
                displayTournamentDetails(tournament);

                tournament.rounds.forEach(round => {
                    round.matches.forEach(match => {
                        if (!match.is_complete && match.is_current_user_in_match && !hasBeenNotified) {
 
                            showFlashMessage('success', '✅ Tournament system: You are expected for the game!');
                            hasBeenNotified = true;
                        }
                    });
                });

                if (tournament.is_completed) {
                    console.log('Tournament completed. Stopping updates.');
                    // document.getElementById("goofysettings").style.display = "block";
                    document.getElementById("settingslobby").style.display = "block";
                    document.getElementById("settingsTOUR").style.display = "block";
                    clearInterval(interval);
                    // document.getElementById('reset-tournament-section').style.display = 'block';

                    showFlashMessage('success', '✅ The tournament is over!');
                }
            } else {
                console.error('Error in tournament updates:', data.error);
                clearInterval(interval);
                alert(data.error);
            }
        } catch (error) {
            console.error('Error during tournament update polling:', error);
            clearInterval(interval);
        }
    }, 500);
}


function resetTournamentPage() {
    console.log('Resetting tournament page.');

    // Hide all sections
    document.getElementById('create-or-join-section').style.display = 'block';
    document.getElementById('waiting-room').style.display = 'none';
    document.getElementById('tournament-section').style.display = 'none';
    // document.getElementById('reset-tournament-section').style.display = 'none';

    // Reset input fields
    document.getElementById('tournament-name').value = '';
    document.getElementById('join-tournament-id').value = '';
    document.getElementById('tournament-player-nickname').value = '';

    // Clear local storage for the tournament
    localStorage.removeItem('tournament_id');

    // Clear player list
    const playerListElement = document.getElementById('player-names');
    if (playerListElement) {
        playerListElement.innerHTML = '';
    }

    console.log('Tournament page reset successfully.');
}
