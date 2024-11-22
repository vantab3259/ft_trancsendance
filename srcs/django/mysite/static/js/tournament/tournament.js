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
                playButtonHtml = `<button onclick="startTournamentGame()">Play</button>`;
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
