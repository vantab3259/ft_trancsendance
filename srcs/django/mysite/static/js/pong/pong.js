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
window.otherMap = false;
window.funMode = false;


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
        color: '#FFFFFF',
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
        color: '#FFFFFF',
        score: 0
    };
    window.com = com;
} else {
    window.com = com = {
        x: canvas.width - PADDLE_WIDTH,
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: '#FFFFFF',
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
        color: '#FFFFFF',
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
        color: '#FFFFFF',
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

// Initialisation de la couleur de fond
if (!window.backgroundColor) {
    window.backgroundColor = "#000000"; // Couleur par défaut
}


applyConfig(window.classicConfig)






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


window.square1 = {
    x: 600 / 2 + 55,
    y: 400 / 2 - 25,
    width: 50,
    height: 50
};

window.square2 = {
    x: 600 / 2 - 105,
    y: 400 / 2 - 25,
    width: 50,
    height: 50
};

function updateActiveClasses() {
    document.querySelectorAll('.row-config, .row-config-2').forEach(button => {
        button.classList.remove('active');
    });

    if (window.otherMap) {
        document.getElementById('map1').classList.add('active');
        // document.getElementById('tournamentMap1').classList.add('active');
    } else {
        document.getElementById('map0').classList.add('active');
        // document.getElementById('tournamentMap0').classList.add('active');
    }

    if (window.otherMap) {
        document.getElementById('locmap1').classList.add('active');
    } else {
        document.getElementById('locmap0').classList.add('active');
    }

    if (window.funMode) {
        document.getElementById('funConfig').classList.add('active');
        document.getElementById('tournamentConfigFun').classList.add('active');
    } else {
        document.getElementById('classicConfig').classList.add('active');
        document.getElementById('tournamentConfigClassic').classList.add('active');
    }

    if (window.funMode) {
        document.getElementById('locfunConfig').classList.add('active');
    } else {
        document.getElementById('locclassicConfig').classList.add('active');
    }

    if (window.funMode) {
        applyConfig(window.configurationPongFun);
    } else {
        applyConfig(window.classicConfig);
    }

}


function applyConfig(config) {

    window.ball.color = config.ball;
    window.user.color = config.paddleUser;
    window.com.color = config.paddleCom;
    window.net.color = config.net;
    window.backgroundColor = config.background;
}

applyConfig(window.classicConfig)

document.getElementById('map1').addEventListener('click', function () {
    window.otherMap = true;
    updateActiveClasses();
});

document.getElementById('map0').addEventListener('click', function () {
    window.otherMap = false;
    updateActiveClasses();
});

document.getElementById('funConfig').addEventListener('click', function () {
    window.funMode = true;
    // applyConfig(window.configurationPongFun);
    updateActiveClasses();
});

document.getElementById('classicConfig').addEventListener('click', function () {
    window.funMode = false;
    // applyConfig(window.classicConfig);
    updateActiveClasses();
});


document.addEventListener('DOMContentLoaded', function () {
    // const tournamentMap1 = document.getElementById('tournamentMap1');
    // if (tournamentMap1) {
    //     tournamentMap1.addEventListener('click', function () {
    //         window.otherMap = true;
    //         updateActiveClasses();
    //     });
    // }

    // const tournamentMap0 = document.getElementById('tournamentMap0');
    // if (tournamentMap0) {
    //     tournamentMap0.addEventListener('click', function () {
    //         window.otherMap = false;
    //         updateActiveClasses();
    //     });
    // }

    const tournamentConfigFun = document.getElementById('tournamentConfigFun');
    if (tournamentConfigFun) {
        tournamentConfigFun.addEventListener('click', function () {
            window.funMode = true;
            updateActiveClasses();
        });
    }

    const tournamentConfigClassic = document.getElementById('tournamentConfigClassic');
    if (tournamentConfigClassic) {
        tournamentConfigClassic.addEventListener('click', function () {
            window.funMode = false;
            updateActiveClasses();
        });
    }
});



document.getElementById('locmap1').addEventListener('click', function () {
    window.otherMap = true;
    updateActiveClasses();
});

document.getElementById('locmap0').addEventListener('click', function () {
    window.otherMap = false;
    updateActiveClasses();
});

document.getElementById('locfunConfig').addEventListener('click', function () {
    window.funMode = true;
    // applyConfig(window.configurationPongFun);
    updateActiveClasses();
});

document.getElementById('locclassicConfig').addEventListener('click', function () {
    window.funMode = false;
    // applyConfig(window.classicConfig);
    updateActiveClasses();
});

// document.querySelectorAll('.row-config-2').forEach(button => {
//     button.addEventListener('click', function() {
//         const mapType = this.getAttribute('data-map-type') === 'true';
//         connectWebSocket(mapType);
//     });
// });




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
    ball.speed = INITIAL_BALL_SPEED;
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
    } else {
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

let userPaddleVelocity = 0; // Vitesse de déplacement du paddle utilisateur
let comPaddleVelocity = 0; // Vitesse de déplacement du paddle com
const PADDLE_SPEED = 8;   // Vitesse des paddles

// Mise à jour de la position des paddles
function movePaddlesLocal() {
    if (modePlay === "local") {
        // Déplacer le paddle de l'utilisateur
        window.user.y += userPaddleVelocity;
        window.user.y = Math.max(0, Math.min(canvas.height - window.user.height, window.user.y));

        // Déplacer le paddle com
        window.com.y += comPaddleVelocity;
        window.com.y = Math.max(0, Math.min(canvas.height - window.com.height, window.com.y));
    }
}

function listenKeyDownPlayLocal(event) {
    if (modePlay === "local") {
        // Contrôle du paddle utilisateur avec W et S
        if (event.key === "w" || event.key === "W") {
            userPaddleVelocity = -PADDLE_SPEED; // Monter
        } else if (event.key === "s" || event.key === "S") {
            userPaddleVelocity = PADDLE_SPEED; // Descendre
        }

        // Contrôle du paddle com avec Flèche Haut et Bas
        if (event.key === "ArrowUp") {
            comPaddleVelocity = -PADDLE_SPEED; // Monter
            event.preventDefault();
        } else if (event.key === "ArrowDown") {
            comPaddleVelocity = PADDLE_SPEED; // Descendre
            event.preventDefault();
        }
    }
}

function listenKeyUpPlayLocal(event) {
    if (modePlay === "local") {
        // Arrêter le mouvement du paddle utilisateur lorsque W ou S est relâché
        if (event.key === "w" || event.key === "W" || event.key === "s" || event.key === "S") {
            userPaddleVelocity = 0;
            event.preventDefault();
        }

        // Arrêter le mouvement du paddle com lorsque Flèche Haut ou Bas est relâché
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            comPaddleVelocity = 0;
            event.preventDefault();
        }
    }
}

// Gestion des événements clavier


function resetAllGame() {
    window.user.score = 0;
    window.com.score = 0;
    resetPadCenter();
    resetBall();
    applyConfig(window.classicConfig);

    if (window.gameInterval) {
        clearInterval(window.gameInterval);
        removeLocalControls();
    }
}

function ballSquareCollision(ball, square) {
    let closestX = Math.max(square.x, Math.min(ball.x, square.x + square.width));
    let closestY = Math.max(square.y, Math.min(ball.y, square.y + square.height));

    let distanceX = ball.x - closestX;
    let distanceY = ball.y - closestY;

    let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (ball.radius * ball.radius);
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

    let angleRad = Math.random() * Math.PI / 4;

    let direction = (Math.random() > 0.5) ? 1 : -1;

    ball.speed = INITIAL_BALL_SPEED;
    ball.velocityX = direction * ball.speed * Math.cos(angleRad);
    ball.velocityY = ball.speed * Math.sin(angleRad);
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
        ball.speed = INITIAL_BALL_SPEED;

        if (modePlay === 'local' && com.score === 3) {
            // Arrête le jeu
            if (window.gameInterval) {
                clearInterval(window.gameInterval);
                removeLocalControls()
            }
            showFlashMessage('success', '✅ Right Player Win! ');
            com.score = 0;
            user.score = 0;

        }
            

    } else if (ball.x + ball.radius > canvas.width) {
        // Si la balle dépasse à droite, le joueur marque
        user.score++;
        if (document.getElementById("pauseButton")) {
            document.getElementById("pauseButton").click();
        }
        resetBall();
        resetPadCenter();
        ball.speed = INITIAL_BALL_SPEED;

        if (modePlay === 'local' && user.score === 3) {
            // Arrête le jeu
            if (window.gameInterval) {
                clearInterval(window.gameInterval);
                removeLocalControls();
            }
            showFlashMessage('success', '✅ Left Player Win ! ');
            com.score = 0;
            user.score = 0;

        }
    }

    // Mise à jour de la position de la balle
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

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

    if (window.otherMap && (modePlay != 'online'  || modePlay != 'tournament')) {
        handleSquareCollision(window.square1);
        handleSquareCollision(window.square2);
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

function handleSquareCollision(square) {
    if (ballSquareCollision(window.ball, square)) {
        let collisionPoint = getCollisionPoint(window.ball, square);


        if (collisionPoint === "top" || collisionPoint === "bottom") {
            window.ball.velocityY = -window.ball.velocityY;
            adjustBallPositionY(square, collisionPoint);
        } else if (collisionPoint === "left" || collisionPoint === "right") {
            window.ball.velocityX = -window.ball.velocityX;
            adjustBallPositionX(square, collisionPoint);
        }
    }
}

function adjustBallPositionY(square, collisionPoint) {
    if (collisionPoint === "top") {
        window.ball.y = square.y - window.ball.radius - 1;
    } else {
        window.ball.y = square.y + square.height + window.ball.radius + 1;
    }
}

function adjustBallPositionX(square, collisionPoint) {
    if (collisionPoint === "left") {
        window.ball.x = square.x - window.ball.radius - 1;
    } else {
        window.ball.x = square.x + square.width + window.ball.radius + 1;
    }
}

function getCollisionPoint(ball, square) {

    let closestX = Math.max(square.x, Math.min(ball.x, square.x + square.width));
    let closestY = Math.max(square.y, Math.min(ball.y, square.y + square.height));

    if (closestY === ball.y) {
        return (closestX === square.x) ? "left" : "right";
    } else {
        return (closestY === square.y) ? "top" : "bottom";
    }
}

function ballSquareCollision(ball, square) {
    let closestX = Math.max(square.x, Math.min(ball.x, square.x + square.width));
    let closestY = Math.max(square.y, Math.min(ball.y, square.y + square.height));
    let distanceX = ball.x - closestX;
    let distanceY = ball.y - closestY;
    let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

    return distanceSquared < (ball.radius * ball.radius);
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

    if (window.otherMap) {
        drawRect(canvas.width / 2 + 55, canvas.height / 2 - 25, 50, 50, window.ball.color);
        drawRect(canvas.width / 2 - 105, canvas.height / 2 - 25, 50, 50, window.ball.color);
    }
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

let paddleMovementInterval = null; // Stocke l'identifiant de l'intervalle

function addLocalControls() {
    // Ajoute les écouteurs pour les touches
    document.addEventListener("keydown", listenKeyDownPlayLocal);
    document.addEventListener("keyup", listenKeyUpPlayLocal);

    // Démarre l'intervalle pour déplacer les paddles
    paddleMovementInterval = setInterval(movePaddlesLocal, 1000 / FRAME_PER_SECOND);
}

function removeLocalControls() {
    // Retire les écouteurs pour les touches
    document.removeEventListener("keydown", listenKeyDownPlayLocal);
    document.removeEventListener("keyup", listenKeyUpPlayLocal);

    // Arrête l'intervalle pour déplacer les paddles
    if (paddleMovementInterval) {
        clearInterval(paddleMovementInterval);
        paddleMovementInterval = null;
    }
}


document.getElementById("pauseButton").addEventListener("click", function () {
    if (modePlay === "local") {

        addLocalControls();
        if (window.gameInterval) {
            clearInterval(window.gameInterval); // Arrête le jeu
            removeLocalControls()
        }

        this.style.display = "none"; // Cache le bouton Pause
        document.getElementById("playButton").style.display = "block"; // Affiche le bouton Play
    }

});

window.launchFirstTimeGame = true;

playButton.addEventListener("click", function () {
    modePlay = "local";
    document.querySelector(".pong-container").style.display = "block";
    if (window.gameInterval) {
        clearInterval(window.gameInterval);
        removeLocalControls()
    }

    this.style.display = "none";
    document.getElementById("pauseButton").style.display = "block";

    window.gameInterval = setInterval(game, 1000 / window.framePerSecond);
    addLocalControls();
    if (window.launchFirstTimeGame) {
        window.launchFirstTimeGame = false;
    }
});


if (window.keydownFlag === undefined) {
    window.keydownFlag = false;
}

document.addEventListener("keydown", function (event) {
    let urlG = location.href;

    if (!window.keydownFlag && event.keyCode === 32 && urlG.includes('pong') && modePlay === "local") {
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

let isPlayerLeft = false; // Définit si le joueur est à gauche (true) ou à droite (false)

function closeWebSocket() {
    if (socketPong) {
        socketPong.close();
        socketPong = null;
        console.log("WebSocket fermé proprement.");
    }
}

document.querySelector(".launch-button-game-content").addEventListener("click", function () {
    modePlay = 'online';
    const mapType = window.otherMap;
    const mapTypeStr = mapType ? 'true' : 'false';
    socketPong = new WebSocket(`wss://${window.location.host}/ws/pong/${mapTypeStr}/`);
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
            document.getElementById("goofysettings").style.display = "none";
            closeMatchmakingModal();
            showGamePage();
            lastServerUpdateTime = Date.now();
            startGame();
        }

        if (data.type === 'game_finished') {
            if (modePlay != 'tournament') {
            // document.getElementById("goofysettings").style.display = "block";
            document.getElementById("settingslobby").style.display = "block";
            document.getElementById("settingsTOUR").style.display = "block";
            }

            let winnerName = data.winner_name; // Utilise 'winner_name'
            let winnerId = data.winner_id;     // Utilise 'winner_id'

            // Vérifie si le joueur est le gagnant
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
        closeWebSocket()
        console.log("Déconnecté du WebSocket Pong Server");
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
    document.querySelector(".pong-include").style.display = "block";
}

