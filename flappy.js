const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Responsive canvas (optional, comment out if you want fixed size)
canvas.width = 400;
canvas.height = 600;
// Optionally, set via CSS for clarity:
// canvas.style.width = "400px";
// canvas.style.height = "600px";

// Game Constants
const BIRD_SIZE = 40;
const GRAVITY = 0.4;
const JUMP_STRENGTH = -7;
const PIPE_WIDTH = 70;
const PIPE_GAP = 150;
const PIPE_SPACING = 220;
const GAME_SPEED = 2;
const GROUND_HEIGHT = 50;
const PIPE_ORNAMENT_HEIGHT = 45;

// Game Variables
let birdY = canvas.height / 2;
let birdVelocity = 0;
let score = 0;
let pipes = [];
let isGameOver = false;
let isGameStarted = false;

let lastTime = 0;
const MAX_DELTA_TIME = 50;

// --- Image Assets ---
const assets = {
    bird: new Image(),
    pipeTop: new Image(),
    pipeBottom: new Image(),
    backgroundSky: new Image(),
    backgroundCity: new Image(),
    ground: new Image()
};

assets.bird.src = 'https://i.ibb.co/wN2kFZCn/Gemini-Generated-Image-1hn1yy1hn1yy1hn1-removebg-preview.png';
assets.pipeTop.src = 'https://i.ibb.co/jvcYMCgK/Gemini-Generated-Image-1hn1yy1hn1yy1hn1-removebg-preview.png';
assets.pipeBottom.src = 'https://i.ibb.co/jvcYMCgK/Gemini-Generated-Image-1hn1yy1hn1yy1hn1-removebg-preview.png';
assets.backgroundSky.src = 'https://i.ibb.co/60CW0Mq8/IMG-2297.jpg';
assets.backgroundCity.src = 'https://i.ibb.co/60CW0Mq8/IMG-2297.jpg';
assets.ground.src = 'https://upload.wikimedia.org/wikipedia/commons/b/be/Ground_%28front_layer%29.png';

function loadAssets() {
    let assetsLoaded = 0;
    const totalAssets = Object.keys(assets).length;
    return new Promise(resolve => {
        for (const key in assets) {
            assets[key].onload = () => {
                if (++assetsLoaded === totalAssets) resolve();
            };
            assets[key].onerror = () => {
                // Fallback: fill with a colored rectangle if image fails
                assets[key] = null;
                if (++assetsLoaded === totalAssets) resolve();
            };
        }
    });
}

// --- Drawing Functions ---

function drawBird() {
    ctx.save();
    // Clamp angle for smoother animation
    const angle = Math.max(-Math.PI / 5, Math.min(Math.PI / 5, birdVelocity / 10));
    ctx.translate(60, birdY);
    ctx.rotate(angle);
    if (assets.bird) {
        ctx.drawImage(assets.bird, -BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
    } else {
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_SIZE / 2, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.restore();
}

function drawPipe(pipe) {
    // Top Pipe
    const topPipeHeight = pipe.topHeight;
    const topMiddleHeight = topPipeHeight - PIPE_ORNAMENT_HEIGHT;
    if (assets.pipeTop) {
        if (topMiddleHeight > 0 && assets.pipeTop.height > PIPE_ORNAMENT_HEIGHT * 2) {
            ctx.drawImage(
                assets.pipeTop,
                0, PIPE_ORNAMENT_HEIGHT,
                assets.pipeTop.width, assets.pipeTop.height - (PIPE_ORNAMENT_HEIGHT * 2),
                pipe.x, PIPE_ORNAMENT_HEIGHT,
                PIPE_WIDTH, topMiddleHeight
            );
        }
        ctx.drawImage(
            assets.pipeTop,
            0, 0,
            assets.pipeTop.width, PIPE_ORNAMENT_HEIGHT,
            pipe.x, 0,
            PIPE_WIDTH, PIPE_ORNAMENT_HEIGHT
        );
    } else {
        ctx.fillStyle = "green";
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topPipeHeight);
    }

    // Bottom Pipe
    const bottomPipeY = pipe.topHeight + PIPE_GAP;
    const bottomPipeHeight = canvas.height - bottomPipeY - GROUND_HEIGHT;
    const bottomMiddleHeight = bottomPipeHeight - PIPE_ORNAMENT_HEIGHT;
    if (assets.pipeBottom) {
        if (bottomMiddleHeight > 0 && assets.pipeBottom.height > PIPE_ORNAMENT_HEIGHT * 2) {
            ctx.drawImage(
                assets.pipeBottom,
                0, PIPE_ORNAMENT_HEIGHT,
                assets.pipeBottom.width, assets.pipeBottom.height - (PIPE_ORNAMENT_HEIGHT * 2),
                pipe.x, bottomPipeY + PIPE_ORNAMENT_HEIGHT,
                PIPE_WIDTH, bottomMiddleHeight
            );
        }
        ctx.drawImage(
            assets.pipeBottom,
            0, assets.pipeBottom.height - PIPE_ORNAMENT_HEIGHT,
            assets.pipeBottom.width, PIPE_ORNAMENT_HEIGHT,
            pipe.x, bottomPipeY + bottomMiddleHeight,
            PIPE_WIDTH, PIPE_ORNAMENT_HEIGHT
        );
    } else {
        ctx.fillStyle = "green";
        ctx.fillRect(pipe.x, bottomPipeY, PIPE_WIDTH, bottomPipeHeight);
    }
}

let bgX = 0;
let groundX = 0;

function drawBackground() {
    if (assets.backgroundSky) {
        ctx.drawImage(assets.backgroundSky, bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(assets.backgroundSky, bgX + canvas.width, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#87ceeb";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // --- Add custom background text ---
    ctx.save();
    ctx.globalAlpha = 0.15; // Make the text subtle
    ctx.fillStyle = "#ff0000"; // Bright red
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 12);
    ctx.fillText("rishu randwaA", 0, 0);
    ctx.restore();
}

function drawGround() {
    const groundY = canvas.height - GROUND_HEIGHT;
    if (assets.ground) {
        ctx.drawImage(assets.ground, groundX, groundY, canvas.width, GROUND_HEIGHT);
        ctx.drawImage(assets.ground, groundX + canvas.width, groundY, canvas.width, GROUND_HEIGHT);
    } else {
        ctx.fillStyle = "#654321";
        ctx.fillRect(0, groundY, canvas.width, GROUND_HEIGHT);
    }
}

function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "bold 30px 'Comic Sans MS', cursive, Arial";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    const scoreText = `Score: ${score}`;
    ctx.strokeText(scoreText, 10, 40);
    ctx.fillText(scoreText, 10, 40);
}

// --- Pipe Management ---
function createPipe() {
    const minHeight = PIPE_ORNAMENT_HEIGHT + 20;
    const maxHeight = canvas.height - PIPE_GAP - GROUND_HEIGHT - PIPE_ORNAMENT_HEIGHT - 20;
    if (maxHeight < minHeight) return;
    const randomHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    pipes.push({
        x: canvas.width,
        topHeight: randomHeight,
        passed: false
    });
}

// --- Core Game Logic ---
function updateGame(deltaTime) {
    const timeFactor = deltaTime / 16.67;

    if (isGameOver) {
        if (birdY < canvas.height - BIRD_SIZE / 2 - GROUND_HEIGHT) {
            birdVelocity += GRAVITY * timeFactor;
            birdY += birdVelocity * timeFactor;
        } else {
            birdY = canvas.height - BIRD_SIZE / 2 - GROUND_HEIGHT;
            birdVelocity = 0;
        }
        return;
    }

    if (!isGameStarted) return;

    bgX -= GAME_SPEED * 0.2 * timeFactor;
    if (bgX <= -canvas.width) bgX = 0;

    groundX -= GAME_SPEED * 1.5 * timeFactor;
    if (groundX <= -canvas.width) groundX = 0;

    birdVelocity += GRAVITY * timeFactor;
    birdY += birdVelocity * timeFactor;

    if (birdY + BIRD_SIZE / 2 > canvas.height - GROUND_HEIGHT) {
        birdY = canvas.height - GROUND_HEIGHT - BIRD_SIZE / 2;
        gameOver();
        return;
    }
    if (birdY < BIRD_SIZE / 2) {
        birdY = BIRD_SIZE / 2;
        birdVelocity = 0;
    }

    pipes.forEach(pipe => {
        pipe.x -= GAME_SPEED * timeFactor;
    });

    const birdX = 60;
    const birdRadius = BIRD_SIZE / 2 * 0.8;
    for (let pipe of pipes) {
        if (
            birdX + birdRadius > pipe.x &&
            birdX - birdRadius < pipe.x + PIPE_WIDTH
        ) {
            if (
                birdY - birdRadius < pipe.topHeight ||
                birdY + birdRadius > pipe.topHeight + PIPE_GAP
            ) {
                gameOver();
                return;
            }
        }
        if (pipe.x + PIPE_WIDTH < birdX - birdRadius && !pipe.passed) {
            score++;
            pipe.passed = true;
        }
    }

    if (pipes.length > 0 && pipes[0].x < -PIPE_WIDTH) {
        pipes.shift();
    }
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - PIPE_SPACING) {
        createPipe();
    }
}

// --- Main Loop and State Management ---
function gameLoop(currentTime) {
    if (lastTime === 0) lastTime = currentTime;
    const deltaTime = Math.min(currentTime - lastTime, MAX_DELTA_TIME);
    lastTime = currentTime;

    updateGame(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    pipes.forEach(drawPipe);
    drawGround();
    drawBird();
    drawScore();

    if (!isGameStarted && !isGameOver) {
        ctx.textAlign = "center";
        ctx.font = "bold 24px 'Comic Sans MS', cursive, Arial";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeText("Click or Press SPACE to Start", canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = "white";
        ctx.fillText("Click or Press SPACE to Start", canvas.width / 2, canvas.height / 2);
        ctx.textAlign = "left";
    }

    if (isGameOver) {
        ctx.textAlign = "center";
        ctx.font = "bold 40px 'Comic Sans MS', cursive, Arial";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 6;
        ctx.strokeText("GAME OVER!", canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillStyle = "red";
        ctx.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2 - 40);

        ctx.font = "20px 'Comic Sans MS', cursive, Arial";
        ctx.strokeText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = "white";
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);

        ctx.font = "18px 'Comic Sans MS', cursive, Arial";
        ctx.strokeText("Click to Restart", canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillStyle = "white";
        ctx.fillText("Click to Restart", canvas.width / 2, canvas.height / 2 + 40);

        ctx.textAlign = "left";
    }
}

function gameOver() {
    isGameOver = true;
}

function resetGame() {
    birdY = canvas.height / 2;
    birdVelocity = 0;
    score = 0;
    pipes = [];
    isGameOver = false;
    isGameStarted = false;
    bgX = 0;
    groundX = 0;
}

function handleInput() {
    if (isGameOver) {
        resetGame();
        return;
    }
    if (!isGameStarted) {
        isGameStarted = true;
    }
    birdVelocity = JUMP_STRENGTH;
}

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        handleInput();
    }
});

document.addEventListener("click", handleInput);
document.addEventListener("touchstart", (e) => {
    if (e.cancelable) e.preventDefault();
    handleInput();
}, { passive: false });

loadAssets().then(() => {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
});