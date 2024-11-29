// pong_tournament_game.js

function initializeTournamentGame(matchId, userId) {
    // Variables specific to the tournament game
    modePlay = 'tournament';
    window.currentMatchId = matchId;
    const canvas = document.getElementById("tournamentPongCanvas");
    const context = canvas.getContext("2d");
    const FRAME_PER_SECOND = 60;
    const BALL_RADIUS = 10;
    const PADDLE_WIDTH = 20;
    const PADDLE_HEIGHT = 100;
    const INITIAL_BALL_SPEED = 2;
    const MAX_BALL_SPEED = 20;
    const SMOOTHING_FACTOR = 0.1;
    let lastServerUpdateTime;

    // Game objects
    const userPaddle = {
        x: 0,
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: "#ffffff",
        score: 0
    };

    const opponentPaddle = {
        x: canvas.width - PADDLE_WIDTH,
        y: canvas.height / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: "#ffffff",
        score: 0
    };

    const ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: BALL_RADIUS,
        speed: INITIAL_BALL_SPEED,
        velocityX: 5,
        velocityY: 5,
        color: "#ffffff"
    };

    const net = {
        x: canvas.width / 2 - 1,
        y: 0,
        width: 2,
        height: BALL_RADIUS,
        color: "#ffffff"
    };

    let isPlayerLeft = false; 
    let gameInterval = null;
    let serverState = null;

    socketPong = new WebSocket(`wss://${window.location.host}/ws/game/tournament/${matchId}/`);

    socketPong.onopen = function() {
        console.log("Connected to tournament WebSocket");
    };

    socketPong.onmessage = function(event) {
        const data = JSON.parse(event.data);

        if (data.type === 'player_position') {
            isPlayerLeft = data.isPlayerLeft;
            console.log("Your position:", isPlayerLeft ? "Left" : "Right");
        }

        if (data.message === "Game is starting!") {
            lastServerUpdateTime = Date.now();
            startGame();
        }

        if (data.type === 'game_update') {
            updateGameState(data);
        }

        if (data.type === 'game_finished') {
            handleGameFinished(data);
        }

        if (data.type === 'player_left') {
            alert("The other player has left the game. You win!");
            if (gameInterval) {
                clearInterval(gameInterval);
            }
            socketPong.close();
        }
    };

    socketPong.onclose = function() {
        console.log("Tournament WebSocket connection closed");
        if (gameInterval) {
            clearInterval(gameInterval);
        }
    };

    function startGame() {
        gameInterval = setInterval(gameLoop, 1000 / FRAME_PER_SECOND);
    }

    function gameLoop() {
        interpolateGameState();
        render();
    }

    function interpolateGameState() {
        if (!serverState) return;

        let alpha = SMOOTHING_FACTOR;

        ball.x = ball.x + (serverState.ballX - ball.x) * alpha;
        ball.y = ball.y + (serverState.ballY - ball.y) * alpha;

        if (isPlayerLeft) {
            userPaddle.y = userPaddle.y + (serverState.playerLeftPaddleY - userPaddle.y) * alpha;
            opponentPaddle.y = opponentPaddle.y + (serverState.playerRightPaddleY - opponentPaddle.y) * alpha;
        } else {
            userPaddle.y = userPaddle.y + (serverState.playerRightPaddleY - userPaddle.y) * alpha;
            opponentPaddle.y = opponentPaddle.y + (serverState.playerLeftPaddleY - opponentPaddle.y) * alpha;
        }

        if (isPlayerLeft) {
            userPaddle.score = serverState.leftScore;
            opponentPaddle.score = serverState.rightScore;
        } else {
            userPaddle.score = serverState.rightScore;
            opponentPaddle.score = serverState.leftScore;
        }
    }

    function updateGameState(data) {
        lastServerUpdateTime = Date.now();
        serverState = data;
    }

    function handleGameFinished(data) {
        let winnerName = data.winner_name;
        let winnerId = data.winner_id;

        if (winnerId.toString() === userId.toString()) {
            alert("You win!");
        } else {
            alert("You lose!");
        }

        if (gameInterval) {
            clearInterval(gameInterval);
        }
        socketPong.close();

        window.location.href = '/tournament/';
    }

    function render() {
        drawRect(0, 0, canvas.width, canvas.height, "#000000");

        drawNet();

        drawText(userPaddle.score, canvas.width / 4, canvas.height / 5, "#ffffff");
        drawText(opponentPaddle.score, 3 * canvas.width / 4, canvas.height / 5, "#ffffff");

        drawRect(userPaddle.x, userPaddle.y, userPaddle.width, userPaddle.height, userPaddle.color);
        drawRect(opponentPaddle.x, opponentPaddle.y, opponentPaddle.width, opponentPaddle.height, opponentPaddle.color);

        drawCircle(ball.x, ball.y, ball.radius, ball.color);
    }

    function drawRect(x, y, w, h, color) {
        context.fillStyle = color;
        context.fillRect(x, y, w, h);
    }

    function drawCircle(x, y, r, color) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2, false);
        context.closePath();
        context.fill();
    }

    function drawText(text, x, y, color) {
        context.fillStyle = color;
        context.font = "45px Courier New";
        context.fillText(text, x, y);
    }

    function drawNet() {
        for (let i = 0; i <= canvas.height; i += 15) {
            drawRect(net.x, net.y + i, net.width, net.height, net.color);
        }
    }

    canvas.addEventListener("mousemove", function(evt) {
        let rect = canvas.getBoundingClientRect();
        let paddleY = evt.clientY - rect.top - userPaddle.height / 2;

        if (socketPong) {
            socketPong.send(JSON.stringify({
                'type': 'input',
                'paddleY': paddleY
            }));
        }
    });
}
