if (window.gameInterval) {
    clearInterval(window.gameInterval);
}

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
        y: canvas.height / 2 - 100 / 2,
        width: 20,
        height: 100,
        color: document.getElementById("userPaddleColor").value,
        score: 0
    };
    window.user = user;
}

// Create the com paddle Object
if (!window.com) {
    const com = {
        x: canvas.width - 20,
        y: canvas.height / 2 - 100 / 2,
        width: 20,
        height: 100,
        color: document.getElementById("comPaddleColor").value,
        score: 0
    };
    window.com = com;
} else {
    window.com = com = {
        x: canvas.width - 20,
        y: canvas.height / 2 - 100 / 2,
        width: 20,
        height: 100,
        color: document.getElementById("comPaddleColor").value,
        score: 0
    };
}

// Create the ball Object
if (!window.ball) {
    const ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        speed: 5,
        velocityX: 5,
        velocityY: 5,
        color: document.getElementById("ballColor").value,
    };
    window.ball = ball;
} else {
    window.ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        speed: 5,
        velocityX: 5,
        velocityY: 5,
        color: document.getElementById("ballColor").value,
    };
}

// Create the net Object
if (!window.net) {
    const net = {
        x: canvas.width / 2 - 1,
        y: 0,
        width: 2,
        height: 10,
        color: "WHITE"
    };
    window.net = net;
} else {
    window.net = {
        x: canvas.width / 2 - 1,
        y: 0,
        width: 2,
        height: 10,
        color: "WHITE"
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
    user.y = evt.clientY - rect.top - user.height / 2;
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
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 5;
}

// Update : pos, mov, score, etc Game Logic
function update() {

    // Change the score if the ball exceeds the canvas width and reset the ball
    if (ball.x - ball.radius < 0) {
        com.score++;
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        user.score++;
        resetBall();
    }

    // Increasing ball velocity
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Simples computer AI
    com.y += ((ball.y - (com.y + com.height / 2))) * 0.1;

    if (ball.y - ball.radius < 0) {
        ball.velocityY = -ball.velocityY;
        ball.y = ball.radius; // Réajuste la position de la balle juste à l'intérieur du canvas
    } else if (ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
        ball.y = canvas.height - ball.radius; // Réajuste la position de la balle juste à l'intérieur du canvas
    }

    // Check if the paddle hit the user or the com paddle
    let player = (ball.x + ball.radius < canvas.width / 2) ? user : com;

    // If the ball hits a paddle
    if (collision(ball, player)) {
        // Check where the ball hits the paddle
        let collidePoint = (ball.y - (player.y + player.height / 2));
        // Normalize the value of collidePoint, to get numbers between -1 and 1.
        collidePoint = collidePoint / (player.height / 2);

        // When the ball hits the top of a paddle we want the ball, to take a -45 degrees angle
        // When the ball hits the center of the paddle we want the ball to take a 0 degrees angle
        // When the ball hits the bottom of the paddle we want the ball to take a 45 degrees
        // Math.PI/4 = 45degrees
        let angleRad = (Math.PI / 4) * collidePoint;

        // Change the X and Y velocity direction
        let direction = (ball.x + ball.radius < canvas.width / 2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);

        // Speed up the ball every time a paddle hits it.
        ball.speed += 0.5;
    }

    // Limit the ball speed so that it doesn't go trough the paddles
    if (ball.speed >= 30) {
        ball.speed = 30;
    }
}

// Render the Game
function render() {
    // Clear the canvas
    drawRect(0, 0, canvas.clientWidth, canvas.clientHeight, window.backgroundColor);

    // Draw the net
    drawNet();

    //Draw the score
    drawText(user.score, canvas.width / 4, canvas.height / 8, "WHITE");
    drawText(com.score, 3 * canvas.width / 4, canvas.height / 8, "WHITE");

    // Draw the user and computer paddle
    drawRect(user.x, user.y, user.width, user.height, user.color);
    drawRect(com.x, com.y, com.width, com.height, com.color);

    // Draw the ball
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

// Game Init
function game() {
    update();
    render();
}

// Loop
if (window.framePerSecond) {
    window.framePerSecond = 60;
} else {
    const framePerSecond = 60;
    window.framePerSecond = 60;
}
// Sélectionne le bouton Play

if (playButton !== undefined) {
    playButton = document.getElementById("playButton");
} else {
    const playButton = document.getElementById("playButton");
}

document.getElementById("pauseButton").addEventListener("click", function () {
    if (window.gameInterval) {
        clearInterval(window.gameInterval); // Arrête le jeu
    }

    this.style.display = "none"; // Cache le bouton Pause
    document.getElementById("playButton").style.display = "block"; // Affiche le bouton Play
});


// Ajoute un événement au bouton pour lancer le jeu au clic
playButton.addEventListener("click", function () {
    document.querySelector(".pong-container").style.display = "block";
    if (window.gameInterval) {
        clearInterval(window.gameInterval);
    }

    this.style.display = "none";
    document.getElementById("pauseButton").style.display = "block";

    window.gameInterval = setInterval(game, 1000 / window.framePerSecond);
});


if (window.keydownFlag === undefined) {
    window.keydownFlag = false;
}

document.addEventListener("keydown", function (event) {
    if (!window.keydownFlag && event.keyCode === 32) // 32 est le code pour la barre d'espace
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
    if (event.keyCode === 32) {
        event.preventDefault();
        window.keydownFlag = false;
    }
});
