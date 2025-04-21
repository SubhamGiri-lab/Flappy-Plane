// Game variables
const gameContainer = document.getElementById('game-container');
const plane = document.getElementById('plane');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

let gameWidth = gameContainer.offsetWidth;
let gameHeight = gameContainer.offsetHeight;
let planeX = 100;
let planeY = gameHeight / 2;
let planeVelocity = 0;
let gravity = 0.4;
let jumpForce = -8;
let maxVelocity = 10;
let rotation = 0;
let buildings = [];
let clouds = [];
let score = 0;
let gameRunning = false;
let animationId;
let lastFrameTime = 0;
let buildingSpeed = 3;
let isJumping = false;

// Initialize plane position
plane.style.left = planeX + 'px';
plane.style.top = planeY + 'px';

// Add high score variables
let highScore = localStorage.getItem('flappyPlaneHighScore') || 0;
const highScoreElement = document.getElementById('high-score');
const finalHighscoreElement = document.getElementById('final-highscore');
const startHighscoreElement = document.getElementById('start-highscore');

// Initialize high score display
highScoreElement.textContent = `High Score: ${highScore}`;
finalHighscoreElement.textContent = highScore;
startHighscoreElement.textContent = highScore;

// Modify gameOver function to update high score
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Update high score if needed
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyPlaneHighScore', highScore);
        highScoreElement.textContent = `High Score: ${highScore}`;
    }
    
    finalScoreElement.textContent = score;
    finalHighscoreElement.textContent = highScore;
    gameOverScreen.style.display = 'flex';
}

// Modify resetGame function to update start screen high score
function resetGame() {
    // ... (keep existing resetGame code) ...
    
    // Update high score displays
    startHighscoreElement.textContent = highScore;
    highScoreElement.textContent = `High Score: ${highScore}`;
    
    // ... (rest of existing resetGame code) ...
}

// Update startGame function to refresh high score display
function startGame() {
    startScreen.style.display = 'none';
    // Refresh high score display in case it changed
    highScore = localStorage.getItem('flappyPlaneHighScore') || 0;
    highScoreElement.textContent = `High Score: ${highScore}`;
    resetGame();
}
// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameRunning) {
            if (!isJumping) {
                planeVelocity = jumpForce;
                isJumping = true;
                setTimeout(() => isJumping = false, 100);
            }
        } else if (gameOverScreen.style.display === 'flex') {
            resetGame();
        }
    }
});

gameContainer.addEventListener('click', () => {
    if (gameRunning) {
        if (!isJumping) {
            planeVelocity = jumpForce;
            isJumping = true;
            setTimeout(() => isJumping = false, 100);
        }
    } else if (gameOverScreen.style.display === 'flex') {
        resetGame();
    }
});

restartBtn.addEventListener('click', resetGame);
startBtn.addEventListener('click', startGame);

// Create explosion effect
function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = (x - 30) + 'px';
    explosion.style.top = (y - 30) + 'px';
    gameContainer.appendChild(explosion);
    
    // Animate explosion
    let opacity = 1;
    let size = 60;
    const explodeInterval = setInterval(() => {
        opacity -= 0.05;
        size += 2;
        explosion.style.opacity = opacity;
        explosion.style.width = size + 'px';
        explosion.style.height = size + 'px';
        explosion.style.left = (x - size/2) + 'px';
        explosion.style.top = (y - size/2) + 'px';
        
        if (opacity <= 0) {
            clearInterval(explodeInterval);
            gameContainer.removeChild(explosion);
        }
    }, 16);
}

// Create clouds
function createClouds() {
    for (let i = 0; i < 5; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        const size = Math.random() * 50 + 30;
        const x = Math.random() * gameWidth;
        const y = Math.random() * gameHeight;
        const opacity = Math.random() * 0.5 + 0.3;
        
        cloud.style.width = size + 'px';
        cloud.style.height = size / 1.5 + 'px';
        cloud.style.left = x + 'px';
        cloud.style.top = y + 'px';
        cloud.style.opacity = opacity;
        
        gameContainer.appendChild(cloud);
        clouds.push({
            element: cloud,
            x: x,
            speed: Math.random() * 0.5 + 0.2
        });
    }
}

// Create buildings with windows and doors
function createBuilding() {
    const minGapHeight = 150;
    const maxGapHeight = 200;
    const gapHeight = Math.random() * (maxGapHeight - minGapHeight) + minGapHeight;
    const minGapPosition = 80;
    const maxGapPosition = gameHeight - gapHeight - 80;
    const gapPosition = Math.random() * (maxGapPosition - minGapPosition) + minGapPosition;
    
    // Top building
    const topBuilding = document.createElement('div');
    topBuilding.className = 'building';
    topBuilding.style.left = gameWidth + 'px';
    topBuilding.style.top = '0px';
    topBuilding.style.height = gapPosition + 'px';
    gameContainer.appendChild(topBuilding);
    
    // Gap
    const gap = document.createElement('div');
    gap.className = 'gap';
    gap.style.left = gameWidth + 'px';
    gap.style.top = gapPosition + 'px';
    gap.style.height = gapHeight + 'px';
    gameContainer.appendChild(gap);
    
    // Bottom building
    const bottomBuilding = document.createElement('div');
    bottomBuilding.className = 'building';
    bottomBuilding.style.left = gameWidth + 'px';
    bottomBuilding.style.top = (gapPosition + gapHeight) + 'px';
    bottomBuilding.style.height = (gameHeight - gapPosition - gapHeight) + 'px';
    gameContainer.appendChild(bottomBuilding);
    
    buildings.push({
        top: topBuilding,
        gap: gap,
        bottom: bottomBuilding,
        x: gameWidth,
        passed: false
    });
}

// Update game state
function update(timestamp) {
    if (!gameRunning) return;
    
    // Calculate delta time for smooth animation
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    const timeCorrection = deltaTime / (1000/60); // Normalize to 60fps
    
    // Update plane physics
    planeVelocity += gravity * timeCorrection;
    
    // Limit velocity
    if (planeVelocity > maxVelocity) planeVelocity = maxVelocity;
    if (planeVelocity < -maxVelocity * 1.5) planeVelocity = -maxVelocity * 1.5;
    
    planeY += planeVelocity * timeCorrection;
    
    // Apply rotation based on velocity (more realistic)
    rotation = Math.min(Math.max(planeVelocity * 5, -30), 90);
    plane.style.transform = `rotate(${rotation}deg)`;
    
    plane.style.top = planeY + 'px';
    
    // Check boundaries
    if (planeY < -10) {
        planeY = -10;
        planeVelocity = 0;
    }
    
    if (planeY > gameHeight - 30) {
        createExplosion(planeX + 30, planeY + 30);
        gameOver();
        return;
    }
    
    // Update buildings
    for (let i = buildings.length - 1; i >= 0; i--) {
        const building = buildings[i];
        building.x -= buildingSpeed * timeCorrection;
        
        building.top.style.left = building.x + 'px';
        building.gap.style.left = building.x + 'px';
        building.bottom.style.left = building.x + 'px';
        
        // Check if plane passed the building
        if (!building.passed && building.x + 80 < planeX) {
            building.passed = true;
            score++;
            scoreElement.textContent = score;
            
            // Slightly increase speed every 5 points
            if (score % 5 === 0) {
                buildingSpeed += 0.2;
            }
        }
        
        // Improved collision detection
        const planeRight = planeX + 60;
        const planeBottom = planeY + 60;
        const buildingRight = building.x + 80;
        
        if (planeRight > building.x && planeX < buildingRight) {
            const buildingTopHeight = parseInt(building.top.style.height);
            const gapTop = parseInt(building.gap.style.top);
            const gapBottom = gapTop + parseInt(building.gap.style.height);
            
            if (planeY < buildingTopHeight || planeBottom > gapBottom) {
                createExplosion(planeX + 30, planeY + 30);
                gameOver();
                return;
            }
        }
        
        // Remove buildings that are off screen
        if (building.x < -80) {
            gameContainer.removeChild(building.top);
            gameContainer.removeChild(building.gap);
            gameContainer.removeChild(building.bottom);
            buildings.splice(i, 1);
        }
    }
    
    // Update clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
        const cloud = clouds[i];
        cloud.x -= cloud.speed * timeCorrection;
        cloud.element.style.left = cloud.x + 'px';
        
        if (cloud.x < -50) {
            gameContainer.removeChild(cloud.element);
            clouds.splice(i, 1);
            
            // Create new cloud
            if (Math.random() < 0.3) {
                createClouds();
            }
        }
    }
    
    // Add new buildings
    if (buildings.length === 0 || buildings[buildings.length - 1].x < gameWidth - 250) {
        createBuilding();
    }
    
    animationId = requestAnimationFrame(update);
}

// Game over
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'flex';
}

// Reset game
function resetGame() {
    // Clear buildings and clouds
    buildings.forEach(building => {
        gameContainer.removeChild(building.top);
        gameContainer.removeChild(building.gap);
        gameContainer.removeChild(building.bottom);
    });
    
    clouds.forEach(cloud => {
        gameContainer.removeChild(cloud.element);
    });
    
    buildings = [];
    clouds = [];
    
    // Reset plane
    planeY = gameHeight / 2;
    planeVelocity = 0;
    rotation = 0;
    plane.style.top = planeY + 'px';
    plane.style.transform = 'rotate(0deg)';
    
    // Reset score and speed
    score = 0;
    buildingSpeed = 3;
    scoreElement.textContent = score;
    
    gameOverScreen.style.display = 'none';
    
    // Start game
    createClouds();
    createBuilding();
    gameRunning = true;
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(update);
}

// Start game
function startGame() {
    startScreen.style.display = 'none';
    resetGame();
}

// Initial cloud creation
createClouds();