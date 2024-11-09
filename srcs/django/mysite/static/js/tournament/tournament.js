function incrementPlayers() {
  var playerCount = document.getElementById("player-count");
  var currentValue = parseInt(playerCount.value);
  playerCount.value = currentValue + 1;
}

function decrementPlayers() {
  var playerCount = document.getElementById("player-count");
  var currentValue = parseInt(playerCount.value);
  if (currentValue > 4) {
    playerCount.value = currentValue - 1;
  }
}


async function createTournament(tournamentName) {
  try {
      const response = await fetch('/tournament/create/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tournamentName })
      });
      const data = await response.json();
      if (data.status === 'success') {
          alert(`Tournament "${tournamentName}" created successfully!`);
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
  if (tournamentName) {
      createTournament(tournamentName);
  } else {
      alert("Please enter a tournament name.");
  }
}

function onJoinTournament() {
  const tournamentId = document.getElementById('join-tournament-id').value;
  if (tournamentId) {
      joinTournament(tournamentId);
  } else {
      alert("Please enter a tournament ID.");
  }
}

