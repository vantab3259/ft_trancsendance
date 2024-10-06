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