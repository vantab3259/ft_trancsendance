//  Get HTML Canvas
const canvas = document.getElementById("pong");
const context = canvas.getContext("2d");

// Create the user paddle Object
const user = {
        x: 0,
        y: canvas.height/2 - 100/2,
        width: 20,
        height: 100,
        color: "WHITE",
        score: 0
}

// Create the com paddle Object
const com = {
        x: canvas.width - 20,
        y: canvas.height/2 - 100/2,
        width: 20,
        height: 100,
        color: "WHITE",
        score: 0
}

// Create the ball Object
const ball = {
        x: canvas.width/2,
        y: canvas.height/2,
        radius: 10,
        speed: 5,
        velocityX: 5,
        velocityY: 5,
        color: "WHITE"
}

// Create the net Object
const net = {
        x: canvas.width/2 - 1,
        y: 0,
        width: 2,
        height: 10,
        color: "WHITE"
}

// Draw Net
function drawNet(){
        for(let i = 0; i <= canvas.height; i+=15){
                drawRect(net.x, net.y + i, net.width, net.height, net.color);
        }
}

// Draw Rect Function
function drawRect(x,y,w,h,color){
        context.fillStyle = color;
        context.fillRect(x,y,w,h);
}

//  Draw Circle
function drawCircle(x,y,r,color){
        context.fillStyle = color;
        context.beginPath();
        context.arc(x,y,r,0,Math.PI*2,false);
        context.closePath();
        context.fill();
}

// Draw Text
function drawText(text,x,y,color){
        context.fillStyle = color;
        context.font = "45px Courier New";
        context.fillText(text,x,y);
}

// Control the user paddle
canvas.addEventListener("mousemove",movePaddle);

function movePaddle(evt){
        let rect = canvas.getBoundingClientRect();
        user.y = evt.clientY - rect.top - user.height/2;
}

// Collision Detection ( b = ball , p = player)
function collision(b,p){
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
function resetBall(){
        ball.x = canvas.width/2;
        ball.y = canvas.height/2;
        ball.velocityX = -ball.velocityX;
        ball.speed = 5;
}

// Update : pos, mov, score, etc Game Logic
function update(){
    
        // Change the score if the ball exceeds the canvas width and reset the ball
        if( ball.x - ball.radius < 0 ){
            com.score++;
            resetBall();
        }else if( ball.x + ball.radius > canvas.width){
            user.score++;
            resetBall();
        }
        
        // Increasing ball velocity
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;
        
        // Simples computer AI
        com.y += ((ball.y - (com.y + com.height/2)))*0.1;
        
        // When the ball collides with the bottom or top walls we inverse the y velocity.
        if(ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height){
            ball.velocityY = -ball.velocityY;
        }
        
        // Check if the paddle hit the user or the com paddle
        let player = (ball.x + ball.radius < canvas.width/2) ? user : com;
        
        // If the ball hits a paddle
        if(collision(ball,player)){
            // Check where the ball hits the paddle
            let collidePoint = (ball.y - (player.y + player.height/2));
            // Normalize the value of collidePoint, to get numbers between -1 and 1.
            collidePoint = collidePoint / (player.height/2);
            
            // When the ball hits the top of a paddle we want the ball, to take a -45 degrees angle
            // When the ball hits the center of the paddle we want the ball to take a 0 degrees angle
            // When the ball hits the bottom of the paddle we want the ball to take a 45 degrees
            // Math.PI/4 = 45degrees
            let angleRad = (Math.PI/4) * collidePoint;
            
            // Change the X and Y velocity direction
            let direction = (ball.x + ball.radius < canvas.width/2) ? 1 : -1;
            ball.velocityX = direction * ball.speed * Math.cos(angleRad);
            ball.velocityY = ball.speed * Math.sin(angleRad);
            
            // Speed up the ball every time a paddle hits it.
            ball.speed += 0.5;
        }
        
        // Limit the ball speed so that it doesn't go trough the paddles
        if(ball.speed >= 30){
                ball.speed = 30;
        }
    }

// Render the Game
function render(){
        // Clear the canvas
        drawRect(0,0, canvas.clientWidth, canvas.clientHeight, "BLACK");

        // Draw the net
        drawNet();

        //Draw the score
        drawText(user.score, canvas.width/4, canvas.height/8, "WHITE");
        drawText(com.score, 3*canvas.width/4, canvas.height/8, "WHITE");

        // Draw the user and computer paddle
        drawRect(user.x, user.y, user.width, user.height, user.color);
        drawRect(com.x, com.y, com.width, com.height, com.color);

        // Draw the ball
        drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

// Game Init
function game(){
        update();
        render();
}

// Loop
const framePerSecond = 60;
setInterval(game, 1000/framePerSecond);