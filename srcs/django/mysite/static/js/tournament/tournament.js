function incrementPlayers() {
    const playerCount = document.getElementById("player-count");
    playerCount.value = parseInt(playerCount.value) + 1;
}

function decrementPlayers() {
    const playerCount = document.getElementById("player-count");
    if (parseInt(playerCount.value) > 4) {
        playerCount.value = parseInt(playerCount.value) - 1;
    }
}

async function createTournament(name) {
    try {
        const response = await fetch('/tournament/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name })
        });
        const data = await response.json();
        if (data.status === 'success') {
            alert(`Tournament "${name}" created successfully!`);
            loadTournamentDetails(data.tournament_id);
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Error creating tournament:', error);
    }
}

async function joinTournament(tournamentId) {
    try {
        const response = await fetch(`/tournament/${tournamentId}/join/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (data.status === 'success') {
            alert('Successfully joined the tournament!');
            loadTournamentDetails(tournamentId);
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Error joining tournament:', error);
    }
}

async function loadTournamentDetails(tournamentId) {
    try {
        const response = await fetch(`/tournament/${tournamentId}/details/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (data.status === 'success') {
            displayTournamentDetails(data.tournament);
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Error loading tournament details:', error);
    }
}

async function startNextRound(tournamentId) {
    try {
        const response = await fetch(`/tournament/${tournamentId}/start-next-round/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (data.status === 'success') {
            alert('Next round started!');
            loadTournamentDetails(tournamentId);
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Error starting next round:', error);
    }
}

async function finishMatch(matchId, winnerId) {
    try {
        const response = await fetch(`/tournament/match/${matchId}/finish/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ winner_id: winnerId })
        });
        const data = await response.json();
        if (data.status === 'success') {
            alert('Match finished!');
            loadTournamentDetails(data.tournament_id);
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Error finishing match:', error);
    }
}

function onCreateTournament() {
    const tournamentName = document.getElementById('tournament-name').value;
    if (tournamentName) createTournament(tournamentName);
    else alert("Please enter a tournament name.");
}

function onJoinTournament() {
    const tournamentId = document.getElementById('join-tournament-id').value;
    if (tournamentId) joinTournament(tournamentId);
    else alert("Please enter a tournament ID.");
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
            const matchHtml = `
                <div class="team">
                    <span class="seed">${match.player1 || 'TBD'}</span>
                    <span class="name">${match.winner || 'Pending'}</span>
                </div>
                <div class="team">
                    <span class="seed">${match.player2 || 'TBD'}</span>
                    <span class="name">${match.winner || 'Pending'}</span>
                </div>
            `;
            matchDiv.innerHTML = matchHtml;
            roundDiv.appendChild(matchDiv);
        });
        bracketContainer.appendChild(roundDiv);
    });
}
