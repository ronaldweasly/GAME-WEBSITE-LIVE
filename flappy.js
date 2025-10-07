const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game Constants
const BIRD_SIZE = 25;
const GRAVITY = 0.4;
const JUMP_STRENGTH = -7;
const PIPE_WIDTH = 50;
const PIPE_GAP = 100; // The vertical gap between the top and bottom pipes
const PIPE_SPACING = 150; // Horizontal distance between new pipe pairs
const GAME_SPEED = 2; // Speed at which pipes move

// Game Variables
let birdY = canvas.height / 2;
let birdVelocity = 0;
let score = 0;
let isGameOver = false;
let pipes = []; // Array to hold pipe objects
let gameInterval;

// Bird object (simple drawing)
function drawBird() {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(60, birdY, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Simple eye
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(65, birdY - 5, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Pipe object
function drawPipe(pipe) {
    ctx.fillStyle = "green";
    
    // Top pipe
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

    // Bottom pipe
    ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, canvas.height - (pipe.topHeight + PIPE_GAP));
}

// Update game state (called in the main loop)
function updateGame() {
    if (isGameOver) {
        return;
    }

    // Apply gravity to the bird
    birdVelocity += GRAVITY;
    birdY += birdVelocity;

    // Boundary check (hitting the ground or ceiling)
    if (birdY > canvas.height - BIRD_SIZE / 2 || birdY < BIRD_SIZE / 2) {
        gameOver();
        return;
    }

    // Move and draw pipes
    for (let i = 0; i < pipes.length; i++) {
        let pipe = pipes[i];
        pipe.x -= GAME_SPEED;
        
        // Draw the pipe
        drawPipe(pipe);

        // Collision detection
        if (
            // Bird is horizontally aligned with the pipe
            60 + BIRD_SIZE / 2 > pipe.x && 
            60 - BIRD_SIZE / 2 < pipe.x + PIPE_WIDTH && 
            
            // Bird hits the top or bottom of the pipe gap
            (birdY - BIRD_SIZE / 2 < pipe.topHeight || 
             birdY + BIRD_SIZE / 2 > pipe.topHeight + PIPE_GAP)
        ) {
            gameOver();
            return;
        }

        // Score update (passed the pipe)
        if (pipe.x + PIPE_WIDTH < 60 && !pipe.passed) {
            score++;
            pipe.passed = true;
        }
    }
    
    // Remove pipes that move off-screen
    if (pipes.length > 0 && pipes[0].x < -PIPE_WIDTH) {
        pipes.shift();
    }
    
    // Add new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - PIPE_SPACING) {
        createPipe();
    }

    // Draw all elements
    draw();
}

// Game loop (main rendering function)
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (can be handled by CSS, but good for game logic)
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all pipes
    pipes.forEach(drawPipe);

    // Draw the bird
    drawBird();

    // Draw the ground/foreground
    ctx.fillStyle = "#ded895";
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Draw score
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Score: " + score, 10, 30);
    
    // Game Over Message
    if (isGameOver) {
        ctx.fillStyle = "red";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "16px Arial";
        ctx.fillText("Press SPACE to Restart", canvas.width / 2, canvas.height / 2 + 10);
    }
}

// Function to generate a new pipe pair
function createPipe() {
    // Random height for the top pipe
    // Keep it within limits so the gap doesn't go too high or too low
    const minHeight = 50;
    const maxHeight = canvas.height - PIPE_GAP - 50;
    const randomHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    pipes.push({
        x: canvas.width,
        topHeight: randomHeight,
        passed: false
    });
}

// Handles the bird jump
function jump(event) {
    // Check for Spacebar (keyCode 32)
    if (event.keyCode === 32) {
        if (isGameOver) {
            resetGame();
        } else {
            birdVelocity = JUMP_STRENGTH;
        }
    }
}

// Handles game over state
function gameOver() {
    isGameOver = true;
    clearInterval(gameInterval);
}

// Resets the game state
function resetGame() {
    birdY = canvas.height / 2;
    birdVelocity = 0;
    score = 0;
    pipes = [];
    isGameOver = false;
    
    // Re-start the game loop
    gameInterval = setInterval(updateGame, 1000 / 60); // 60 FPS
}

// Event listener for jumping and restarting
document.addEventListener("keydown", jump);

// Start the game for the first time
resetGame();