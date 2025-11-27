// Game configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 1000;
canvas.height = 700;

// Game state
const game = {
    playerScore: 0,
    aiScore: 0,
    isServing: true,
    ballInPlay: false
};

// Table dimensions (3D perspective)
const table = {
    width: 800,
    height: 500,
    x: 100,
    y: 150,
    color: '#ff8c42',
    lineColor: '#ffffff',
    netColor: '#333333'
};

// Ball object
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    z: 0,
    radius: 8,
    speedX: 0,
    speedY: 0,
    speedZ: 0,
    gravity: 0.3,
    bounce: 0.85,
    spin: 0,
    color: '#ffffff',
    shadow: true
};

// Player paddle (red)
const playerPaddle = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    z: 0,
    radius: 40,
    color: '#e74c3c',
    handleColor: '#8b4513',
    handleLength: 60
};

// AI paddle (purple)
const aiPaddle = {
    x: canvas.width / 2,
    y: 200,
    z: 0,
    radius: 35,
    color: '#9b59b6',
    handleColor: '#8b4513',
    handleLength: 50,
    speed: 4,
    reactionDelay: 0
};

// Mouse position
const mouse = {
    x: canvas.width / 2,
    y: canvas.height - 100
};

// Audio Context for sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Sound effect functions using Web Audio API
function playSound(frequency, duration, type = 'sine', volume = 0.3) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playBounceSound() {
    playSound(200, 0.1, 'square', 0.2);
}

function playPaddleHitSound() {
    playSound(400, 0.15, 'sine', 0.25);
    setTimeout(() => playSound(350, 0.1, 'sine', 0.15), 20);
}

function playScoreSound() {
    playSound(523.25, 0.2, 'triangle', 0.3);
    setTimeout(() => playSound(659.25, 0.2, 'triangle', 0.3), 150);
    setTimeout(() => playSound(783.99, 0.3, 'triangle', 0.3), 300);
}

function playServeSound() {
    playSound(300, 0.1, 'sine', 0.2);
}

// Mouse movement event
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    // Update player paddle position (with constraints)
    playerPaddle.x = Math.max(table.x + 50, Math.min(table.x + table.width - 50, mouse.x));
    playerPaddle.y = Math.max(canvas.height - 150, Math.min(canvas.height - 80, mouse.y));
});

// Click to serve
canvas.addEventListener('click', () => {
    if (game.isServing) {
        serveBall();
    }
});

// Serve the ball
function serveBall() {
    game.isServing = false;
    game.ballInPlay = true;

    ball.x = playerPaddle.x;
    ball.y = playerPaddle.y - 30;
    ball.z = 20;

    // Realistic serve velocity (3-4 px/frame horizontal, 2-3 px/frame vertical)
    const angle = (Math.random() - 0.5) * 0.3;
    ball.speedX = 3 + Math.random();  // 3-4 px/frame
    ball.speedY = -(2 + Math.random()); // -2 to -3 px/frame
    ball.speedZ = 1.5;

    playServeSound();
}

// Draw the ping pong table with perspective
function drawTable() {
    ctx.save();

    // Table shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(table.x - 10, table.y - 10, table.width + 20, table.height + 20);

    // Main table surface (orange)
    ctx.fillStyle = table.color;
    ctx.fillRect(table.x, table.y, table.width, table.height);

    // Table border
    ctx.strokeStyle = '#d67d3e';
    ctx.lineWidth = 8;
    ctx.strokeRect(table.x, table.y, table.width, table.height);

    // Center line
    ctx.strokeStyle = table.lineColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(table.x, table.y + table.height / 2);
    ctx.lineTo(table.x + table.width, table.y + table.height / 2);
    ctx.stroke();

    // Side lines
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(table.x + 50, table.y);
    ctx.lineTo(table.x + 50, table.y + table.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(table.x + table.width - 50, table.y);
    ctx.lineTo(table.x + table.width - 50, table.y + table.height);
    ctx.stroke();

    // Net
    ctx.fillStyle = table.netColor;
    const netHeight = 30;
    const netY = table.y + table.height / 2 - netHeight / 2;
    ctx.fillRect(table.x, netY, table.width, netHeight);

    // Net mesh pattern
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    for (let i = 0; i < table.width; i += 10) {
        ctx.beginPath();
        ctx.moveTo(table.x + i, netY);
        ctx.lineTo(table.x + i, netY + netHeight);
        ctx.stroke();
    }
    for (let i = 0; i < netHeight; i += 10) {
        ctx.beginPath();
        ctx.moveTo(table.x, netY + i);
        ctx.lineTo(table.x + table.width, netY + i);
        ctx.stroke();
    }

    ctx.restore();
}

// Draw paddle
function drawPaddle(paddle, isPlayer = false) {
    ctx.save();

    // Handle
    ctx.strokeStyle = paddle.handleColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (isPlayer) {
        ctx.moveTo(paddle.x, paddle.y);
        ctx.lineTo(paddle.x, paddle.y + paddle.handleLength);
    } else {
        ctx.moveTo(paddle.x, paddle.y);
        ctx.lineTo(paddle.x, paddle.y - paddle.handleLength);
    }
    ctx.stroke();

    // Paddle shadow
    const shadowOffset = 5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(paddle.x + shadowOffset, paddle.y + shadowOffset, paddle.radius, 0, Math.PI * 2);
    ctx.fill();

    // Paddle face
    ctx.fillStyle = paddle.color;
    ctx.beginPath();
    ctx.arc(paddle.x, paddle.y, paddle.radius, 0, Math.PI * 2);
    ctx.fill();

    // Paddle outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Paddle highlight
    const gradient = ctx.createRadialGradient(
        paddle.x - paddle.radius / 3,
        paddle.y - paddle.radius / 3,
        0,
        paddle.x,
        paddle.y,
        paddle.radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(paddle.x, paddle.y, paddle.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Draw ball
function drawBall() {
    ctx.save();

    // Ball shadow on table
    if (ball.z < 50) {
        const shadowSize = ball.radius * (1 + ball.z / 100);
        const shadowOpacity = Math.max(0, 0.4 - ball.z / 100);
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, shadowSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Ball with z-offset
    const visualY = ball.y - ball.z;
    const ballSize = ball.radius * (1 + ball.z / 200);

    // Ball glow
    const glow = ctx.createRadialGradient(ball.x, visualY, 0, ball.x, visualY, ballSize * 2);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ball.x, visualY, ballSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Ball
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, visualY, ballSize, 0, Math.PI * 2);
    ctx.fill();

    // Ball highlight
    const highlight = ctx.createRadialGradient(
        ball.x - ballSize / 3,
        visualY - ballSize / 3,
        0,
        ball.x,
        visualY,
        ballSize
    );
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    highlight.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(ball.x, visualY, ballSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Update ball physics
function updateBall() {
    if (!game.ballInPlay) return;

    // Apply gravity
    ball.speedZ -= ball.gravity;

    // Update position
    ball.x += ball.speedX;
    ball.y += ball.speedY;
    ball.z += ball.speedZ;

    // Apply air resistance (mild damping for lighter, more natural feel)
    ball.speedX *= 0.995;
    ball.speedY *= 0.995;

    // Table collision (bounce)
    if (ball.z <= 0 && ball.speedZ < 0) {
        ball.z = 0;
        ball.speedZ *= -ball.bounce;
        ball.speedX *= 0.98;
        ball.speedY *= 0.98;

        if (Math.abs(ball.speedZ) > 0.5) {
            playBounceSound();
        }

        // Check if ball landed on table
        if (ball.x < table.x || ball.x > table.x + table.width ||
            ball.y < table.y || ball.y > table.y + table.height) {
            // Ball missed table
            if (ball.y > canvas.height / 2) {
                // Player missed
                scorePoint('ai');
            } else {
                // AI missed
                scorePoint('player');
            }
        }
    }

    // Side walls (keep ball in bounds)
    if (ball.x < table.x + ball.radius || ball.x > table.x + table.width - ball.radius) {
        ball.speedX *= -0.8;
        ball.x = Math.max(table.x + ball.radius, Math.min(table.x + table.width - ball.radius, ball.x));
    }

    // Check paddle collisions
    checkPaddleCollision(playerPaddle, true);
    checkPaddleCollision(aiPaddle, false);

    // Ball went off screen
    if (ball.y < 0 || ball.y > canvas.height) {
        if (ball.y < 0) {
            scorePoint('player');
        } else {
            scorePoint('ai');
        }
    }
}

// Check collision with paddle
function checkPaddleCollision(paddle, isPlayer) {
    const dist = Math.sqrt((ball.x - paddle.x) ** 2 + (ball.y - paddle.y) ** 2);

    if (dist < ball.radius + paddle.radius && ball.z < 30) {
        // Collision detected
        const hitPlayer = isPlayer && ball.speedY > 0;
        const hitAI = !isPlayer && ball.speedY < 0;

        if (hitPlayer || hitAI) {
            // Calculate bounce angle based on hit position (more gentle)
            const hitAngle = (ball.x - paddle.x) / paddle.radius;

            // Set more realistic paddle hit velocities
            ball.speedX = hitAngle * 3;  // Reduced from 6 to 3
            ball.speedY *= -1;  // Simple reversal, no multiplication
            ball.speedZ = 2 + Math.abs(hitAngle);  // Reduced upward bounce

            // Add minimal randomness for natural variation
            ball.speedX += (Math.random() - 0.5) * 0.5;
            ball.speedY += (Math.random() - 0.5) * 0.3;

            // Slight acceleration after long rallies (5% increase)
            const speedMultiplier = 1.05;
            ball.speedX *= speedMultiplier;
            ball.speedY *= speedMultiplier;

            // Cap velocity at 8 px/frame in any direction
            const maxSpeed = 8;
            if (Math.abs(ball.speedX) > maxSpeed) {
                ball.speedX = Math.sign(ball.speedX) * maxSpeed;
            }
            if (Math.abs(ball.speedY) > maxSpeed) {
                ball.speedY = Math.sign(ball.speedY) * maxSpeed;
            }

            playPaddleHitSound();

            // Move ball away from paddle to prevent double hit
            if (isPlayer) {
                ball.y = paddle.y - paddle.radius - ball.radius;
            } else {
                ball.y = paddle.y + paddle.radius + ball.radius;
            }
        }
    }
}

// Update AI paddle
function updateAI() {
    if (!game.ballInPlay) {
        // Return to center when not playing
        aiPaddle.x += (canvas.width / 2 - aiPaddle.x) * 0.1;
        return;
    }

    // AI tracks ball with some delay and imperfection
    const targetX = ball.x + ball.speedX * 10;
    const diff = targetX - aiPaddle.x;

    if (Math.abs(diff) > 5) {
        aiPaddle.x += Math.sign(diff) * Math.min(aiPaddle.speed, Math.abs(diff) * 0.15);
    }

    // Keep AI paddle on table
    aiPaddle.x = Math.max(table.x + 50, Math.min(table.x + table.width - 50, aiPaddle.x));
}

// Score a point
function scorePoint(scorer) {
    if (scorer === 'player') {
        game.playerScore++;
        document.getElementById('player-score').textContent = game.playerScore;
    } else {
        game.aiScore++;
        document.getElementById('ai-score').textContent = game.aiScore;
    }

    playScoreSound();
    resetBall();
}

// Reset ball for next serve
function resetBall() {
    game.isServing = true;
    game.ballInPlay = false;

    ball.x = canvas.width / 2;
    ball.y = canvas.height - 100;
    ball.z = 0;
    ball.speedX = 0;
    ball.speedY = 0;
    ball.speedZ = 0;
}

// Draw background
function drawBackground() {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple fence pattern in background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 150);
        ctx.stroke();
    }

    // Horizontal fence line
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(canvas.width, 100);
    ctx.stroke();
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw everything
    drawBackground();
    drawTable();

    if (game.ballInPlay) {
        updateBall();
        updateAI();
    }

    // Draw game elements
    drawPaddle(aiPaddle, false);
    drawBall();
    drawPaddle(playerPaddle, true);

    // Serving indicator
    if (game.isServing) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click to Serve', canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(gameLoop);
}

// Initialize game
function init() {
    resetBall();
    gameLoop();
}

// Start the game
init();
