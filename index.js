// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Game elements
const gameContainer = document.getElementById('game-container');
const plane = document.getElementById('plane');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const finalHighscoreElement = document.getElementById('final-highscore');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const startHighscoreElement = document.getElementById('start-highscore');
const startBtn = document.getElementById('start-btn');
const tapHint = document.getElementById('tap-hint');

// Game settings
let gameWidth, gameHeight;
const planeWidth = 40;
const planeHeight = 30;

// Game variables
let planeX = 100;
let planeY = 0;
let planeVelocity = 0;
let gravity = 0.4;
let jumpForce = -8;
let maxVelocity = 10;
let rotation = 0;
let buildings = [];
let clouds = [];
let score = 0;
let highScore = localStorage.getItem('flappyPlaneHighScore') || 0;
let gameRunning = false;
let animationId;
let lastFrameTime = 0;
let buildingSpeed = 3;
let buildingSpawnRate = 220;
let minGapHeight = 200;
let jumpCooldown = false;

// Initialize game elements
function initGame() {
    gameWidth = gameContainer.offsetWidth;
    gameHeight = gameContainer.offsetHeight;
    planeY = gameHeight / 2;
    
    plane.style.width = planeWidth + 'px';
    plane.style.height = planeHeight + 'px';
    plane.style.left = planeX + 'px';
    plane.style.top = planeY + 'px';
    
    highScoreElement.textContent = `High Score: ${highScore}`;
    finalHighscoreElement.textContent = highScore;
    startHighscoreElement.textContent = highScore;
    
    if (isMobile) {
        tapHint.style.display = 'block';
    }
}

// Event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleJump();
        }
    });
    
    // Touch controls
    gameContainer.addEventListener('touchstart', handleTouch, { passive: false });
    gameContainer.addEventListener('click', handleJump);
    
    // Button controls
    restartBtn.addEventListener('click', resetGame);
    startBtn.addEventListener('click', startGame);
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
}

// Touch handler
function handleTouch(e) {
    e.preventDefault();
    handleJump();
}

// Resize handler
function handleResize() {
    if (!gameRunning) {
        gameWidth = gameContainer.offsetWidth;
        gameHeight = gameContainer.offsetHeight;
        planeY = gameHeight / 2;
        plane.style.top = planeY + 'px';
    }
}

// Jump mechanics
function handleJump() {
    if (!gameRunning) {
        if (gameOverScreen.style.display === 'flex') resetGame();
        return;
    }
    
    if (!jumpCooldown) {
        planeVelocity = jumpForce;
        jumpCooldown = true;
        setTimeout(() => jumpCooldown = false, 100);
        
        // Hide tap hint after first jump
        if (isMobile && tapHint.style.display === 'block') {
            tapHint.style.display = 'none';
        }
    }
}

// Create explosion effect
function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = (x - 30) + 'px';
    explosion.style.top = (y - 30) + 'px';
    gameContainer.appendChild(explosion);
    
    setTimeout(() => {
        gameContainer.removeChild(explosion);
    }, 500);
}

// Create clouds with realistic appearance
function createClouds() {
    const cloudCount = isMobile ? 6 : 10; // Fewer clouds on mobile for performance
    
    for (let i = 0; i < cloudCount; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        // Random cloud size and position
        const sizeBase = Math.random() * 60 + 40;
        const width = sizeBase * (Math.random() * 0.5 + 0.8);
        const height = sizeBase * 0.6;
        const x = Math.random() * gameWidth;
        const y = Math.random() * gameHeight * 0.7; // Keep clouds in upper part of screen
        const opacity = Math.random() * 0.3 + 0.4;
        const speed = Math.random() * 0.2 + 0.1;
        const scale = Math.random() * 0.5 + 0.8;
        
        // Create cloud with multiple parts for realistic look
        cloud.style.width = `${width}px`;
        cloud.style.height = `${height}px`;
        cloud.style.left = `${x}px`;
        cloud.style.top = `${y}px`;
        cloud.style.opacity = opacity;
        cloud.style.transform = `scale(${scale})`;
        cloud.style.animationDuration = `${Math.random() * 40 + 40}s`;
        
        // Add cloud parts
        cloud.innerHTML = `
            <div style="position:absolute; width:60%; height:80%; background:white; border-radius:50%; top:-30%; left:-10%; filter:blur(6px);"></div>
            <div style="position:absolute; width:50%; height:70%; background:white; border-radius:50%; top:20%; right:-15%; filter:blur(5px);"></div>
        `;
        
        gameContainer.appendChild(cloud);
        clouds.push({
            element: cloud,
            x: x,
            y: y,
            speed: speed,
            scale: scale,
            baseY: y
        });
    }
}

// Update clouds with realistic movement
function updateClouds(timeCorrection) {
    const now = Date.now();
    
    for (let i = clouds.length - 1; i >= 0; i--) {
        const cloud = clouds[i];
        
        // Horizontal movement
        cloud.x -= cloud.speed * timeCorrection;
        
        // Subtle vertical floating
        const floatOffset = Math.sin(now * 0.001 + i * 100) * 10;
        
        // Update position
        cloud.element.style.left = `${cloud.x}px`;
        cloud.element.style.top = `${cloud.baseY + floatOffset}px`;
        
        // Reset position when off screen
        if (cloud.x < -cloud.element.offsetWidth) {
            cloud.x = gameWidth + Math.random() * 100;
            cloud.baseY = Math.random() * gameHeight * 0.7;
        }
    }
}

// Create buildings
function createBuilding() {
    const gapHeight = Math.random() * (gameHeight - minGapHeight - 160) + minGapHeight;
    const gapPosition = Math.random() * (gameHeight - gapHeight - 100) + 50;
    
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
    
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    const timeCorrection = deltaTime / (1000/60);
    
    // Update plane physics
    planeVelocity += gravity * timeCorrection;
    planeVelocity = Math.min(Math.max(planeVelocity, -maxVelocity * 1.5), maxVelocity);
    
    planeY += planeVelocity * timeCorrection;
    
    // Apply rotation with easing
    const targetRotation = Math.min(Math.max(planeVelocity * 6, -25), 90);
    rotation += (targetRotation - rotation) * 0.2;
    plane.style.transform = `rotate(${rotation}deg)`;
    plane.style.top = planeY + 'px';
    
    // Check boundaries
    if (planeY < 0) {
        planeY = 0;
        planeVelocity = 0;
    }
    
    if (planeY > gameHeight - planeHeight) {
        createExplosion(planeX + planeWidth/2, planeY + planeHeight/2);
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
        
        // Score points
        if (!building.passed && building.x + 70 < planeX) {
            building.passed = true;
            score++;
            scoreElement.textContent = score;
            
            // Increase difficulty
            if (score % 5 === 0) {
                buildingSpeed += 0.15;
                minGapHeight = Math.max(160, minGapHeight - 3);
            }
        }
        
        // Precise collision detection
        const planeRight = planeX + planeWidth;
        const planeBottom = planeY + planeHeight;
        const buildingRight = building.x + 70;
        
        if (planeRight > building.x && planeX < buildingRight) {
            const buildingTopHeight = parseInt(building.top.style.height);
            const gapTop = parseInt(building.gap.style.top);
            const gapBottom = gapTop + parseInt(building.gap.style.height);
            
            // Calculate actual collision points
            const planeTop = planeY;
            const planeCenterX = planeX + planeWidth/2;
            const planeCenterY = planeY + planeHeight/2;
            
            // Check if plane enters building area
            const inTopBuilding = planeBottom > 0 && planeTop < buildingTopHeight;
            const inBottomBuilding = planeBottom > gapBottom && planeTop < gameHeight;
            
            if (inTopBuilding || inBottomBuilding) {
                // More precise check with center point
                const centerInTop = planeCenterY < buildingTopHeight;
                const centerInBottom = planeCenterY > gapBottom;
                
                if ((inTopBuilding && centerInTop) || (inBottomBuilding && centerInBottom)) {
                    createExplosion(planeCenterX, planeCenterY);
                    gameOver();
                    return;
                }
            }
        }
        
        // Remove off-screen buildings
        if (building.x < -70) {
            gameContainer.removeChild(building.top);
            gameContainer.removeChild(building.gap);
            gameContainer.removeChild(building.bottom);
            buildings.splice(i, 1);
        }
    }
    
    // Update clouds with the new function
    updateClouds(timeCorrection);
    
    // Add new buildings
    if (buildings.length === 0 || buildings[buildings.length - 1].x < gameWidth - buildingSpawnRate) {
        createBuilding();
    }
    
    animationId = requestAnimationFrame(update);
}

// Game over
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyPlaneHighScore', highScore);
        highScoreElement.textContent = `High Score: ${highScore}`;
    }
    
    finalScoreElement.textContent = score;
    finalHighscoreElement.textContent = highScore;
    gameOverScreen.style.display = 'flex';
}

// Reset game
function resetGame() {
    // Clear existing elements
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
    
    // Reset game state
    planeY = gameHeight / 2;
    planeVelocity = 0;
    rotation = 0;
    plane.style.top = planeY + 'px';
    plane.style.transform = 'rotate(0deg)';
    
    score = 0;
    buildingSpeed = 3;
    minGapHeight = 200;
    scoreElement.textContent = score;
    
    gameOverScreen.style.display = 'none';
    
    // Start new game
    createClouds();
    createBuilding();
    gameRunning = true;
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(update);
}

// Start game
function startGame() {
    startScreen.style.display = 'none';
    highScore = localStorage.getItem('flappyPlaneHighScore') || 0;
    highScoreElement.textContent = `High Score: ${highScore}`;
    resetGame();
}

// Initialize game
initGame();
setupEventListeners();
createClouds();

// Prevent touch scrolling
document.addEventListener('touchmove', function(e) {
    if (gameRunning) {
        e.preventDefault();
    }
}, { passive: false });

// Prevent context menu on long press
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});
