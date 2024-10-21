let modePlay = null;
let lastServerUpdateTime;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const BALL_RADIUS = 10;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const INITIAL_BALL_SPEED = 2;
const MAX_BALL_SPEED = 20;
const FRAME_PER_SECOND = 60;
const SMOOTHING_FACTOR = 1;

// modePlay = local => contre IA ou online sur un serveur webscoket 

if (window.gameInterval) {
    clearInterval(window.gameInterval);
}

window.configurationPongFun = {
    "ball": "#f4a261", "paddleUser": "#2a9d8f", "paddleCom": "#e76f51", "background": "#e9c46a", "net": "#264653",
};

window.classicConfig = {
    "ball": "#ffffff", "paddleUser": "#ffffff", "paddleCom": "#ffffff", "background": "#000000", "net": "#ffffff",
};

function applyConfig(config) {
    document.getElementById("ballColor").value = config.ball;
    document.getElementById("userPaddleColor").value = config.paddleUser;
    document.getElementById("comPaddleColor").value = config.paddleCom;
    document.getElementById("netColor").value = config.net;
    document.getElementById("backgroundGame").value = config.background;

    window.ball.color = config.ball;
    window.user.color = config.paddleUser;
    window.com.color = config.paddleCom;
    window.net.color = config.net;
    window.backgroundColor = config.background;
}

document.getElementById('funConfig').addEventListener('click', function () {
    applyConfig(window.configurationPongFun);
    document.querySelector('.row-config.active').classList.remove('active');
    this.classList.add('active');
});

document.getElementById('classicConfig').addEventListener('click', function () {
    applyConfig(window.classicConfig);
    document.querySelector('.row-config.active').classList.remove('active');
    this.classList.add('active');
});


if (window.canvas) {
    window.canvas = document.getElementById("pong");
} else {
    const canvas = document.getElementById("pong");
    window.canvas = canvas;
}

if (window.context) {
    window.context = canvas.getContext("2d");
} else {
    const context = canvas.getContext("2d");
    window.context = context;
}

// Create the user paddle Object
if (!window.user) {
    const user = {
        x: 0,
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: document.getElementById("userPaddleColor").value,
        score: 0
    };
    window.user = user;
}

// Create the com paddle Object
if (!window.com) {
    const com = {
        x: canvas.width - PADDLE_WIDTH,
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: document.getElementById("comPaddleColor").value,
        score: 0
    };
    window.com = com;
} else {
    window.com = com = {
        x: canvas.width - PADDLE_WIDTH,
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: document.getElementById("comPaddleColor").value,
        score: 0
    };
}

// Create the ball Object
if (!window.ball) {
    const ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: BALL_RADIUS,
        speed: INITIAL_BALL_SPEED,
        velocityX: 5,
        velocityY: 5,
        color: document.getElementById("ballColor").value,
    };
    window.ball = ball;
} else {
    window.ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: BALL_RADIUS,
        speed: INITIAL_BALL_SPEED,
        velocityX: 5,
        velocityY: 5,
        color: document.getElementById("ballColor").value,
    };
}

// Create the net Object
if (!window.net) {
    const net = {
        x: canvas.width / 2 - 1, y: 0, width: 2, height: BALL_RADIUS, color: "WHITE"
    };
    window.net = net;
} else {
    window.net = {
        x: canvas.width / 2 - 1, y: 0, width: 2, height: BALL_RADIUS, color: "WHITE"
    };
}


//change color 

document.getElementById("ballColor").addEventListener("input", function () {
    window.ball.color = this.value;
});

document.getElementById("userPaddleColor").addEventListener("input", function () {
    window.user.color = this.value;
});

document.getElementById("comPaddleColor").addEventListener("input", function () {
    window.com.color = this.value;
});

document.getElementById("netColor").addEventListener("input", function () {
    window.net.color = this.value;
});

document.getElementById("backgroundGame").addEventListener("input", function () {
    window.backgroundColor = this.value;
});

document.querySelector(".reset-button-container i").addEventListener("click", function () {
    window.backgroundColor = "#000000";
    document.getElementById("backgroundGame").value = "#000000";
    window.user.color = "#ffffff";
    document.getElementById("userPaddleColor").value = "#ffffff";
    window.com.color = "#ffffff";
    document.getElementById("comPaddleColor").value = "#ffffff";
    window.net.color = "#ffffff";
    document.getElementById("netColor").value = "#ffffff";
    window.ball.color = "#ffffff";
    document.getElementById("ballColor").value = "#ffffff";

});


// Initialisation de la couleur de fond
if (!window.backgroundColor) {
    window.backgroundColor = "#000000"; // Couleur par défaut
}

// Draw Net
function drawNet() {
    for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

// Draw Rect Function
function drawRect(x, y, w, h, color) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

//  Draw Circle
function drawCircle(x, y, r, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
}

function resetPadCenter() {
    window.user.y = canvas.height / 2 - window.user.height / 2;
    window.com.y = canvas.height / 2 - window.com.height / 2;
}


// Draw Text
function drawText(text, x, y, color) {
    context.fillStyle = color;
    context.font = "45px Courier New";
    context.fillText(text, x, y);
}

// Control the user paddle
canvas.addEventListener("mousemove", movePaddle);

function movePaddle(evt) {
  let rect = canvas.getBoundingClientRect();

  if (modePlay === "local") {
      user.y = evt.clientY - rect.top - user.height / 2;
  } else  {
      let paddleY = evt.clientY - rect.top - user.height / 2;

      // Envoie l'input au serveur
      if (socketPong) {
          socketPong.send(JSON.stringify({
              'type': 'input',
              'paddleY': paddleY
          }));
      }
  }
}


// Collision Detection ( b = ball , p = player)
function collision(b, p) {
    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    return b.right > p.left && b.bottom > p.top && b.left < p.right && b.top < p.bottom;
}

// Reset Ball
function resetBall() {
    ball.x = canvas.width / 2 - 4;
    ball.y = canvas.height / 2;
    ball.velocityX = -ball.velocityX;
    ball.speed = INITIAL_BALL_SPEED;
}

function update() {

  // Change the score if the ball exceeds the canvas width and reset the ball
  if (ball.x - ball.radius < 0) {
      // Si la balle dépasse à gauche, l'adversaire marque
      com.score++;
      if (document.getElementById("pauseButton")) {
          document.getElementById("pauseButton").click();
      }
      resetBall();
      resetPadCenter();

  } else if (ball.x + ball.radius > canvas.width) {
      // Si la balle dépasse à droite, le joueur marque
      user.score++;
      if (document.getElementById("pauseButton")) {
          document.getElementById("pauseButton").click();
      }
      resetBall();
      resetPadCenter();
  }

  // Mise à jour de la position de la balle
  ball.x += ball.velocityX;
  ball.y += ball.velocityY;

  // Simples computer AI (uniquement pour le mode local)
  if (modePlay === "local") {
    com.y += ((ball.y - (com.y + com.height / 2))) * 0.1;
  }

  // Gestion des collisions avec les bords supérieur et inférieur
  if (ball.y - ball.radius < 0) {
      ball.velocityY = -ball.velocityY;
      ball.y = ball.radius; // Réajustement de la balle
  } else if (ball.y + ball.radius > canvas.height) {
      ball.velocityY = -ball.velocityY;
      ball.y = canvas.height - ball.radius; // Réajustement de la balle
  }

  // Vérification si la balle touche un paddle (joueur ou adversaire)
  let player = isPlayerLeft ? user : com; // Le joueur est toujours à gauche
  let opponent = isPlayerLeft ? com : user; // L'adversaire est toujours à droite

  // Si la balle touche le paddle du joueur ou de l'adversaire
  if (collision(ball, player)) {
      handleBallCollision(player); // Gérer la collision avec le joueur
  } else if (collision(ball, opponent)) {
      handleBallCollision(opponent); // Gérer la collision avec l'adversaire
  }

  // Limite la vitesse de la balle
  if (ball.speed >= MAX_BALL_SPEED) {
      ball.speed = MAX_BALL_SPEED;
  }
}

// Fonction pour gérer la collision avec un paddle
function handleBallCollision(paddle) {
  // Point de collision entre la balle et le paddle
  let collidePoint = (ball.y - (paddle.y + paddle.height / 2));
  collidePoint = collidePoint / (paddle.height / 2); // Normalisation entre -1 et 1

  // Calculer l'angle de rebond en fonction de l'endroit où la balle touche le paddle
  let angleRad = (Math.PI / 4) * collidePoint; // 45 degrés

  // Inverser la direction de la balle
  let direction = (ball.x + ball.radius < canvas.width / 2) ? 1 : -1; 
  ball.velocityX = direction * ball.speed * Math.cos(angleRad);
  ball.velocityY = ball.speed * Math.sin(angleRad);

  // Augmenter la vitesse de la balle après chaque rebond
  ball.speed += 0.5;
}


// Render the Game
function render() {
    // Clear the canvas
    drawRect(0, 0, canvas.clientWidth, canvas.clientHeight, window.backgroundColor);

    // Draw the net
    drawNet();

    //Draw the score
    drawText(user.score, canvas.width / 4, canvas.height / INITIAL_BALL_SPEED, "WHITE");
    drawText(com.score, 3 * canvas.width / 4, canvas.height / INITIAL_BALL_SPEED, "WHITE");

    // Draw the user and computer paddle
    drawRect(user.x, user.y, user.width, user.height, user.color);
    drawRect(com.x, com.y, com.width, com.height, com.color);

    // Draw the ball
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

function game() {
  if (modePlay === 'local') {
      update();
  } else {
      interpolateGameState();
  }
  render();
}

// Loop
if (window.framePerSecond) {
    window.framePerSecond = FRAME_PER_SECOND;
} else {
    const framePerSecond = FRAME_PER_SECOND;
    window.framePerSecond = FRAME_PER_SECOND;
}
// Sélectionne le bouton Play

if (playButton !== undefined) {
    playButton = document.getElementById("playButton");
} else {
    const playButton = document.getElementById("playButton");
}

document.getElementById("pauseButton").addEventListener("click", function () {
  if (modePlay === "local") {
      if (window.gameInterval) {
        clearInterval(window.gameInterval); // Arrête le jeu
    }

    this.style.display = "none"; // Cache le bouton Pause
    document.getElementById("playButton").style.display = "block"; // Affiche le bouton Play
  }
    
});

window.launchFirstTimeGame = true;

playButton.addEventListener("click", function () {
    document.querySelector(".pong-container").style.display = "block";
    if (window.gameInterval) {
        clearInterval(window.gameInterval);
    }

    this.style.display = "none";
    document.getElementById("pauseButton").style.display = "block";

    window.gameInterval = setInterval(game, 1000 / window.framePerSecond);
    if (window.launchFirstTimeGame) {
        window.launchFirstTimeGame = false;
    }
});


if (window.keydownFlag === undefined) {
    window.keydownFlag = false;
}

document.addEventListener("keydown", function (event) {
    let urlG = location.href;

    if (!window.keydownFlag && event.keyCode === 32 && urlG.includes('pong') && modePlay === "local")
    {
        event.preventDefault();
        window.keydownFlag = true;
        if (document.getElementById("pauseButton").style.display !== "none") {
            document.getElementById("pauseButton").click();
        } else {
            document.getElementById("playButton").click();
        }
    }
});

document.addEventListener("keyup", function (event) {
    let urlG = location.href;

    if (event.keyCode === 32 && urlG.includes('pong') && modePlay === "local") {
        event.preventDefault();
        window.keydownFlag = false;
    }
});

document.querySelector("#pong").addEventListener("click", function () {

  if (modePlay === "local") {
    if (document.getElementById("pauseButton").style.display !== "none") {
      document.getElementById("pauseButton").click();
    } else {
        document.getElementById("playButton").click();
    }
  }
    
})


/****** ONLINE PLAY ******/

let socketPong = null;
let isPlayerLeft = false; // Définit si le joueur est à gauche (true) ou à droite (false)

document.querySelector(".launch-button-game-content").addEventListener("click", function () {
    modePlay = 'online';
    socketPong = new WebSocket("wss://localhost:4443/ws/pong/");
    openMatchmakingModal();

    socketPong.onopen = function () {
        console.log("Connecté au WebSocket Pong Server");
        socketPong.send(JSON.stringify({
            'type': 'start_game'
        }));
    };

    socketPong.onmessage = function (event) {
          let data = JSON.parse(event.data);
      
          // Réception des informations de démarrage pour savoir si le joueur est à gauche ou à droite
          if (data.type === 'player_position') {
              isPlayerLeft = data.isPlayerLeft; // Si true, le joueur est à gauche
              console.log("Votre position :", isPlayerLeft ? "Gauche" : "Droite");
          }
      
          if (data.message === "La partie commence!") {
              closeMatchmakingModal();
              showGamePage();
              lastServerUpdateTime = Date.now();
              startGame();
          }

          console.log("data.type => ", data.type);

          if (data.type === 'game_finished') {
            let winner = data.winner;
    
            // Vérifie si le joueur est le gagnant
            console.log("winner => ", winner);
            let currentUserId = document.querySelector(".user-pseudo-header").getAttribute('data-user-id');
            console.log("currentUserId => ", currentUserId);
            if (winner === currentUserId) {
                alert("Vous avez gagné !");
            } else {
                alert("Vous avez perdu !");
            }
    
            // Arrête le jeu
            if (window.gameInterval) {
                clearInterval(window.gameInterval);
            }
        }
      
          // Réception des mises à jour de position des paddles/balles du joueur opposé
          if (data.type === 'game_update') {
              updateGameState(data);
          }
      };
  

    socketPong.onclose = function () {
        console.log("Déconnecté du WebSocket Pong Server");
        alert("L'autre joueur s'est déconnecté.");
    };
});

function updateGameState(data) {
  lastServerUpdateTime = Date.now();

  // Mise à jour des scores
  if (isPlayerLeft) {
      window.user.score = data.leftScore;
      window.com.score = data.rightScore;
  } else {
      window.user.score = data.rightScore;
      window.com.score = data.leftScore;
  }

  // Inverser la position X de la balle pour le joueur de droite
  let ballX = isPlayerLeft ? data.ballX : canvas.width - data.ballX;
  serverState = {
      ballX: ballX,
      ballY: data.ballY,
      playerLeftPaddleY: data.playerLeftPaddleY,
      playerRightPaddleY: data.playerRightPaddleY
  };

  // console.log("serverState => ", serverState);
}




let serverState = null;

function interpolateGameState() {
  if (!serverState) return;

  // Facteur de lissage fixe
  let alpha = SMOOTHING_FACTOR;  // Ajustez cette valeur entre 0 et 1


  // Interpolation de la balle
  window.ball.x = window.ball.x + (serverState.ballX - window.ball.x) * alpha;
  window.ball.y = window.ball.y + (serverState.ballY - window.ball.y) * alpha;

  // Interpolation des paddles
  if (isPlayerLeft) {
      window.user.y = window.user.y + (serverState.playerLeftPaddleY - window.user.y) * alpha;
      window.com.y = window.com.y + (serverState.playerRightPaddleY - window.com.y) * alpha;
  } else {
      window.user.y = window.user.y + (serverState.playerRightPaddleY - window.user.y) * alpha;
      window.com.y = window.com.y + (serverState.playerLeftPaddleY - window.com.y) * alpha;
  }
}



function startGame() {
  if (modePlay !== 'local') {
      window.gameInterval = setInterval(() => {
          game();
      }, 1000 / window.framePerSecond);
  }
}

function showGamePage() {
  document.querySelector(".lobby-include").style.display = 'none';
  document.querySelector(".left-header-pong").style.display = 'none';
  document.querySelector(".pong-container").style.display = "block";
  document.querySelector(".pong-include" ).style.display = "block";
}
