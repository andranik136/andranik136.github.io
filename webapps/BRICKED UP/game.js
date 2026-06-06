/**
 * BRICKED UP - Retro Breakout Game Engine
 * Streamlined, optimized infinite stage breakout engine featuring:
 * - Responsive screen scaling: Dynamic Landscape (Desktop) / Portrait (Mobile iPhone) layouts.
 * - Dynamic aspect ratio: Computes height dynamically to match mobile viewport ratios edge-to-edge.
 * - Bottom-half touch drag: Bottom half of screen maps to smooth finger tracking.
 * - Procedural symmetrical level layouts with seeded bomb bricks.
 * - Progressive difficulty scaling (ball speed increases 10% per level).
 * - Ball light trail: A glowing cyan comet-like path trailing the ball.
 * - Persistent high score starting at 0 (LocalStorage saved).
 * - Retro sound effects synthesizer (Web Audio API).
 * - Colored particle explosions on brick breaks.
 */

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Detect Mobile Device / Portrait Viewport
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 (window.innerWidth < 600) || 
                 (window.innerWidth < window.innerHeight && window.innerWidth < 768);

// Global Config & Constants (initialized dynamically in initDimensions)
let BORDER_WIDTH = 18;
let BRICK_COLS = 13;
let BRICK_HEIGHT = 18;
let HATCH_Y = 18;
const BALL_SPEED_INIT = 4.5;
const BALL_SPEED_MAX = 9.0; // Prevent tunneling through walls at extreme speeds

// Colors
const COLORS = {
  BORDER_METAL: ['#9ba0af', '#7d8291', '#545864', '#3c3f49'], // light to dark grays
  BORDER_CLAMP: ['#db803c', '#b75b1c', '#79390c'], // orange/copper clamps
  BACKGROUND_DARK: '#00003a',
  BACKGROUND_LIGHT: '#000077',
  PADDLE_METAL: ['#dbdfeb', '#b8bdcd', '#8e94a5', '#575d6d'],
  PADDLE_RED: ['#ff4f4f', '#d61a1a', '#850000'],
  BALL_SHADE: ['#ffffff', '#dbdfeb', '#8e94a5'],
  HATCH_BLUE: ['#00d4ff', '#007ca8', '#004766'],
  BRICKS: {
    SILVER: ['#e1e5f0', '#b0b5c4', '#797e8d', '#424550'],
    RED: ['#ff5353', '#db1b1b', '#9b0505', '#550000'],
    YELLOW: ['#ffff4f', '#dede00', '#9c9c00', '#555500'],
    BLUE: ['#5c9aff', '#2166e0', '#0a3a99', '#001a55'],
    MAGENTA: ['#ff5eff', '#d91dd9', '#990a99', '#550055'],
    GREEN: ['#4fff4f', '#19db19', '#059705', '#004a00'],
    BOMB: ['#ffaa00', '#ff6600', '#cc3300', '#000000']
  }
};

// Game States
const STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER'
};

// Core Game Variables
let gameState = STATES.MENU;
let score = 0;
let highscore = parseInt(localStorage.getItem('bricked_up_hiscore')) || 0;
let lives = 3;
let currentLevel = 1;
let currentBallSpeed = BALL_SPEED_INIT;

// Objects
let paddle = null;
let balls = [];
let bricks = [];
let particles = [];
let spawnHatches = [];
let bgPattern = null;

// Animation & Loops
let lastTime = 0;
let bgScrollOffset = 0;

// DOM Elements
const scoreVal = document.getElementById('score');
const highscoreVal = document.getElementById('highscore');
const livesDisplay = document.getElementById('lives-display');
const uiOverlay = document.getElementById('ui-overlay');
const startMenu = document.getElementById('start-menu');
const pauseMenu = document.getElementById('pause-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const finalScoreSpan = document.getElementById('final-score');
const btnSound = document.getElementById('btn-sound');
const btnFullscreen = document.getElementById('btn-fullscreen');
const soundOnIcon = document.getElementById('sound-on-icon');
const soundOffIcon = document.getElementById('sound-off-icon');
const levelDisplay = document.getElementById('level-display');

// Hatch lights DOM indicators
const hatchLights = document.querySelectorAll('.hatch-light');

// Initial score renders
scoreVal.textContent = '00000000';
highscoreVal.textContent = String(highscore).padStart(8, '0');

// Input state
const keys = {};
let mouseX = canvas.width / 2;
let isDraggingPaddle = false; // Mobile bottom-half touch drag flag

// --- Initialize Layout Sizing dynamically ---
function initDimensions() {
  if (isMobile) {
    // iPhone portrait coordinates: dynamic height scales to fill available space between HUD and footer
    canvas.width = 450;
    const availableWidth = window.innerWidth - 16; // 8px padding on both sides of game-container
    const availableHeight = window.innerHeight - 112; // vertical space taken by header, footer, and margins/paddings
    const windowRatio = Math.max(1.0, availableHeight / availableWidth);
    canvas.height = Math.round(450 * windowRatio);
    BORDER_WIDTH = 14;
    BRICK_COLS = 8;
  } else {
    // Desktop landscape view coordinates
    canvas.width = 800;
    canvas.height = 480;
    BORDER_WIDTH = 18;
    BRICK_COLS = 13;
  }
  HATCH_Y = BORDER_WIDTH;
}

// --- Initialize Background Texture Pattern ---
function initBackgroundPattern() {
  const size = 32;
  const pCanvas = document.createElement('canvas');
  pCanvas.width = size;
  pCanvas.height = size;
  const pCtx = pCanvas.getContext('2d');

  pCtx.fillStyle = COLORS.BACKGROUND_DARK;
  pCtx.fillRect(0, 0, size, size);

  pCtx.fillStyle = COLORS.BACKGROUND_LIGHT;
  pCtx.beginPath();
  pCtx.moveTo(size / 2, 0);
  pCtx.lineTo(size, size / 2);
  pCtx.lineTo(size / 2, size);
  pCtx.lineTo(0, size / 2);
  pCtx.closePath();
  pCtx.fill();

  pCtx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  pCtx.lineWidth = 1;
  pCtx.beginPath();
  pCtx.moveTo(0, size / 2);
  pCtx.lineTo(size / 2, size);
  pCtx.lineTo(size, size / 2);
  pCtx.stroke();

  pCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  pCtx.beginPath();
  pCtx.moveTo(0, size / 2);
  pCtx.lineTo(size / 2, 0);
  pCtx.lineTo(size, size / 2);
  pCtx.stroke();

  bgPattern = ctx.createPattern(pCanvas, 'repeat');
}

// --- Spawning Hatches Setup (Responsive position counts) ---
function initSpawnHatches() {
  if (isMobile) {
    // Two hatches spaced symmetrically on portrait layout
    spawnHatches = [
      { x: BORDER_WIDTH + 40, y: HATCH_Y, width: 36, height: 12, openState: 0 },
      { x: canvas.width - BORDER_WIDTH - 40 - 36, y: HATCH_Y, width: 36, height: 12, openState: 0 }
    ];
  } else {
    // Three hatches on landscape layouts
    spawnHatches = [
      { x: BORDER_WIDTH + 80, y: HATCH_Y, width: 36, height: 12, openState: 0 },
      { x: canvas.width / 2 - 18, y: HATCH_Y, width: 36, height: 12, openState: 0 },
      { x: canvas.width - BORDER_WIDTH - 80 - 36, y: HATCH_Y, width: 36, height: 12, openState: 0 }
    ];
  }
}

// --- Paddle Class ---
class Paddle {
  constructor() {
    this.width = isMobile ? 65 : 90; // Proportional width
    this.height = 18;
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - (isMobile ? 45 : 35); // Buffered touch drag limit
    this.speed = 8;
    this.caughtBalls = []; // Used solely for holding the starting ball
  }

  update(dt) {
    // Keyboard inputs
    if (keys['ArrowLeft'] || keys['KeyA']) {
      this.x -= this.speed;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      this.x += this.speed;
    }

    // Mouse/Touch control
    if (mouseX !== undefined) {
      this.x = mouseX - this.width / 2;
    }

    // Clamp paddle inside borders
    const leftLimit = BORDER_WIDTH + 4;
    const rightLimit = canvas.width - BORDER_WIDTH - this.width - 4;
    if (this.x < leftLimit) this.x = leftLimit;
    if (this.x > rightLimit) this.x = rightLimit;

    // Update position of caught balls to move with paddle
    this.caughtBalls.forEach(cb => {
      cb.ball.x = this.x + cb.offset;
      cb.ball.y = this.y - cb.ball.radius;
    });
  }

  draw() {
    // 3D Pixel art paddle drawing
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = Math.round(this.width);
    const h = Math.round(this.height);
    const rCap = 10; // Red cap radius

    ctx.save();
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + 4, y + 4, w, h);

    const capColors = COLORS.PADDLE_RED;
    const bodyColors = COLORS.PADDLE_METAL;

    // Left Cap
    ctx.fillStyle = capColors[1];
    ctx.beginPath();
    ctx.arc(x + rCap, y + h / 2, rCap, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
    
    ctx.fillStyle = capColors[0];
    ctx.beginPath();
    ctx.arc(x + rCap + 2, y + h / 2 - 2, rCap - 4, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();

    // Right Cap
    ctx.fillStyle = capColors[1];
    ctx.beginPath();
    ctx.arc(x + w - rCap, y + h / 2, rCap, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fill();

    ctx.fillStyle = capColors[0];
    ctx.beginPath();
    ctx.arc(x + w - rCap - 2, y + h / 2 - 2, rCap - 4, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fill();

    // Center metallic barrel
    ctx.fillStyle = bodyColors[2];
    ctx.fillRect(x + rCap, y, w - rCap * 2, h);

    ctx.fillStyle = bodyColors[1];
    ctx.fillRect(x + rCap, y + 2, w - rCap * 2, 3);
    ctx.fillStyle = bodyColors[0];
    ctx.fillRect(x + rCap, y + 5, w - rCap * 2, 2);

    ctx.fillStyle = bodyColors[3];
    ctx.fillRect(x + rCap, y + h - 4, w - rCap * 2, 3);

    // Outer dark outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + rCap, y + h / 2, rCap, Math.PI * 0.5, Math.PI * 1.5);
    ctx.lineTo(x + w - rCap, y);
    ctx.arc(x + w - rCap, y + h / 2, rCap, Math.PI * 1.5, Math.PI * 0.5);
    ctx.lineTo(x + rCap, y + h);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  catchBall(ball) {
    if (this.caughtBalls.some(cb => cb.ball === ball)) return;
    const offset = ball.x - this.x;
    this.caughtBalls.push({ ball, offset });
    ball.isStuck = true;
  }

  releaseBalls() {
    if (this.caughtBalls.length === 0) return;
    
    this.caughtBalls.forEach(cb => {
      cb.ball.isStuck = false;
      
      const relativeHit = cb.offset / this.width;
      const angle = (relativeHit - 0.5) * 1.2;
      cb.ball.dx = cb.ball.speed * Math.sin(angle);
      cb.ball.dy = -cb.ball.speed * Math.cos(angle);
      if (Math.abs(cb.ball.dy) < 1.5) cb.ball.dy = -1.5;
    });
    this.caughtBalls = [];
    window.audio.playPaddleBounce();
  }
}

// --- Ball Class ---
class Ball {
  constructor(x, y, dx = 0, dy = 0) {
    this.x = x;
    this.y = y;
    this.radius = 7;
    this.speed = currentBallSpeed;
    this.dx = dx;
    this.dy = dy;
    this.isStuck = false;
    
    this.trail = [];
    this.maxTrailLength = 10;
  }

  update(dt) {
    if (this.isStuck) {
      this.trail = [];
      return;
    }

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    this.x += this.dx;
    this.y += this.dy;

    const leftBorder = BORDER_WIDTH + this.radius;
    const rightBorder = canvas.width - BORDER_WIDTH - this.radius;
    const topBorder = BORDER_WIDTH + this.radius;

    // Left Border
    if (this.x <= leftBorder) {
      this.x = leftBorder;
      this.dx = Math.abs(this.dx);
      window.audio.playWallBounce();
      createImpactParticles(this.x - this.radius, this.y, '#ffffff');
    }
    // Right Border
    else if (this.x >= rightBorder) {
      this.x = rightBorder;
      this.dx = -Math.abs(this.dx);
      window.audio.playWallBounce();
      createImpactParticles(this.x + this.radius, this.y, '#ffffff');
    }

    // Top Border
    if (this.y <= topBorder) {
      this.y = topBorder;
      this.dy = Math.abs(this.dy);
      window.audio.playWallBounce();
      createImpactParticles(this.x, this.y - this.radius, '#ffffff');
    }
  }

  draw() {
    ctx.save();
    
    // Draw trail
    if (!this.isStuck && this.trail.length > 0) {
      this.trail.forEach((pos, index) => {
        const ratio = (index + 1) / this.trail.length;
        const opacity = ratio * 0.35;
        const size = this.radius * (0.3 + ratio * 0.7);
        
        ctx.fillStyle = `rgba(0, 212, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(Math.round(pos.x), Math.round(pos.y), size, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const rx = Math.round(this.x);
    const ry = Math.round(this.y);
    const r = Math.round(this.radius);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(rx + 3, ry + 3, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.BALL_SHADE[1];
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.BALL_SHADE[0];
    ctx.beginPath();
    ctx.arc(rx - 2, ry - 2, r - 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

// --- Brick Class ---
class Brick {
  constructor(col, row, type) {
    this.col = col;
    this.row = row;
    this.type = type; // 'silver', 'red', 'yellow', 'blue', 'magenta', 'green', 'bomb'
    
    const activeWidth = canvas.width - (BORDER_WIDTH * 2) - 12;
    this.width = Math.floor(activeWidth / BRICK_COLS);
    
    this.x = BORDER_WIDTH + 6 + col * this.width;
    this.y = BORDER_WIDTH + 55 + row * BRICK_HEIGHT;
    this.height = BRICK_HEIGHT - 1;
    this.health = type === 'silver' ? 2 : 1;
    this.isCracked = false;
    this.flashFrame = 0;
  }

  damage() {
    this.health--;
    this.flashFrame = 5;
    
    if (this.health <= 0) {
      score += this.type === 'silver' ? 200 : 100;
      updateScoreHUD();
      window.audio.playBrickBreak();
      
      const colors = COLORS.BRICKS[this.type.toUpperCase()];
      createBrickParticles(this.x + this.width/2, this.y + this.height/2, colors[0], colors[1]);
      return true;
    } else {
      this.isCracked = true;
      score += 50;
      updateScoreHUD();
      window.audio.playMetalClang();
      return false;
    }
  }

  draw() {
    const rx = Math.round(this.x);
    const ry = Math.round(this.y);
    const rw = Math.round(this.width);
    const rh = Math.round(this.height);

    ctx.save();

    if (this.flashFrame > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, rw, rh);
      this.flashFrame--;
      ctx.restore();
      return;
    }

    if (this.type === 'bomb') {
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(rx, ry, rw, rh);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let offset = -rh; offset < rw; offset += 16) {
        ctx.moveTo(rx + offset, ry);
        ctx.lineTo(rx + offset + rh, ry + rh);
      }
      ctx.stroke();

      const pulse = Math.abs(Math.sin(performance.now() / 150));
      ctx.strokeStyle = `rgba(255, 0, 0, ${0.4 + pulse * 0.6})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, rw, rh);
      
      ctx.restore();
      return;
    }

    const colors = COLORS.BRICKS[this.type.toUpperCase()];

    ctx.fillStyle = colors[1];
    ctx.fillRect(rx, ry, rw, rh);

    ctx.fillStyle = colors[0];
    ctx.fillRect(rx, ry, rw, 2);
    ctx.fillRect(rx, ry, 2, rh);

    ctx.fillStyle = colors[2];
    ctx.fillRect(rx, ry + rh - 2, rw, 2);
    ctx.fillRect(rx + rw - 2, ry, 2, rh);

    ctx.fillStyle = colors[3];
    ctx.fillRect(rx, ry + rh - 1, rw, 1);
    ctx.fillRect(rx + rw - 1, ry, 1, rh);

    if (this.type === 'silver') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(rx + 8, ry + 2, 4, rh - 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(rx + 12, ry + 2, 2, rh - 4);
    }

    if (this.isCracked && this.type === 'silver') {
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx + 10, ry + 3);
      ctx.lineTo(rx + 18, ry + 9);
      ctx.lineTo(rx + 15, ry + 14);
      
      ctx.moveTo(rx + rw - 12, ry + rh - 3);
      ctx.lineTo(rx + rw - 16, ry + 8);
      ctx.lineTo(rx + rw - 24, ry + 11);
      ctx.stroke();
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, rw, rh);

    ctx.restore();
  }
}

// --- Particle Class ---
class Particle {
  constructor(x, y, color, vx, vy, size = 3, life = 1.0) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.life = life;
    this.alpha = 1.0;
  }

  update(dt) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.12;
    this.life -= 0.03;
    this.alpha = Math.max(0, this.life);
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
    ctx.restore();
  }
}

// --- Setup Symmetrical Level (Dynamic boundaries and column scales) ---
function loadLevel(levelNum) {
  bricks = [];
  particles = [];
  
  if (paddle) {
    paddle.caughtBalls = [];
  }

  const types = ['red', 'yellow', 'blue', 'magenta', 'green'];
  const halfCols = Math.ceil(BRICK_COLS / 2);
  const rowCount = isMobile ? (7 + Math.floor(Math.random() * 3)) : (5 + Math.floor(Math.random() * 3));

  const grid = [];
  for (let r = 0; r < rowCount; r++) {
    grid.push(Array(BRICK_COLS).fill(null));
  }

  const layoutStyle = Math.floor(Math.random() * 3);

  if (layoutStyle === 0) {
    // Pillars
    for (let r = 0; r < rowCount; r++) {
      const color = r === 0 ? 'silver' : types[Math.floor(Math.random() * types.length)];
      for (let c = 0; c < halfCols; c++) {
        if (Math.random() < 0.75) {
          grid[r][c] = color;
          grid[r][BRICK_COLS - 1 - c] = color;
        }
      }
    }
  } else if (layoutStyle === 1) {
    // Pyramid
    for (let r = 0; r < rowCount; r++) {
      const color = r === 0 ? 'silver' : types[Math.floor(Math.random() * types.length)];
      const step = Math.min(halfCols - 1, r);
      for (let c = step; c < halfCols; c++) {
        grid[r][c] = color;
        grid[r][BRICK_COLS - 1 - c] = color;
      }
    }
  } else {
    // Checkerboard
    for (let r = 0; r < rowCount; r++) {
      const color = r === 0 ? 'silver' : types[Math.floor(Math.random() * types.length)];
      for (let c = 0; c < halfCols; c++) {
        if ((r + c) % 2 === 0) {
          grid[r][c] = color;
          grid[r][BRICK_COLS - 1 - c] = color;
        }
      }
    }
  }

  // Seed Bomb Bricks
  const activeCoords = [];
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      if (grid[r][c] !== null) {
        activeCoords.push({ r, c });
      }
    }
  }

  const bombCount = Math.max(3, Math.min(8, Math.floor(activeCoords.length * 0.1)));
  for (let i = 0; i < bombCount; i++) {
    if (activeCoords.length === 0) break;
    const randIdx = Math.floor(Math.random() * activeCoords.length);
    const coord = activeCoords.splice(randIdx, 1)[0];
    grid[coord.r][coord.c] = 'bomb';
  }

  // Instantiate bricks
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const type = grid[r][c];
      if (type) {
        bricks.push(new Brick(c, r, type));
      }
    }
  }
}

// --- Particle Spawning ---
function createBrickParticles(x, y, color1, color2) {
  for (let i = 0; i < 12; i++) {
    const color = Math.random() < 0.5 ? color1 : color2;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.0 + Math.random() * 3.0;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 1.5;
    particles.push(new Particle(x, y, color, vx, vy, 3 + Math.floor(Math.random()*3)));
  }
}

function createImpactParticles(x, y, color) {
  for (let i = 0; i < 4; i++) {
    const vx = (Math.random() - 0.5) * 2;
    const vy = (Math.random() - 0.5) * 2;
    particles.push(new Particle(x, y, color, vx, vy, 2, 0.5));
  }
}

function createExplosionParticles(x, y) {
  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.0 + Math.random() * 6.5;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const color = Math.random() < 0.4 ? '#ff5500' : (Math.random() < 0.7 ? '#ffcc00' : '#ff2200');
    particles.push(new Particle(x, y, color, vx, vy, 4 + Math.floor(Math.random() * 3), 1.2));
  }
}

// --- Trigger Bomb Explosion ---
function triggerBombExplosion(bomb) {
  window.audio.playExplosion();
  createExplosionParticles(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2);

  for (let i = bricks.length - 1; i >= 0; i--) {
    const b = bricks[i];
    if (b === bomb) continue;

    const colDiff = Math.abs(b.col - bomb.col);
    const rowDiff = Math.abs(b.row - bomb.row);

    if (colDiff <= 1.2 && rowDiff <= 1.2) {
      if (b.type === 'bomb') {
        setTimeout(() => {
          const idx = bricks.indexOf(b);
          if (idx !== -1) {
            bricks.splice(idx, 1);
            triggerBombExplosion(b);
            checkLevelComplete();
          }
        }, 120);
      } else {
        const destroyed = b.damage();
        if (destroyed) {
          bricks.splice(i, 1);
        }
      }
    }
  }

  checkLevelComplete();
}

// --- Render Metallic Pipes Border (Adapts to dimensions) ---
function drawFrameBorders() {
  ctx.save();

  // LEFT
  drawPipeSegment(0, 0, BORDER_WIDTH, canvas.height, 'vertical');
  // RIGHT
  drawPipeSegment(canvas.width - BORDER_WIDTH, 0, BORDER_WIDTH, canvas.height, 'vertical');
  // TOP
  drawPipeSegment(BORDER_WIDTH, 0, canvas.width - BORDER_WIDTH * 2, BORDER_WIDTH, 'horizontal');

  // Corners
  drawPipeClamp(0, 0);
  drawPipeClamp(canvas.width - BORDER_WIDTH, 0);

  // Scaled vertical clamp decorations
  const jointYCount = isMobile ? 5 : 3;
  for (let i = 1; i <= jointYCount; i++) {
    const yVal = (canvas.height / (jointYCount + 1)) * i;
    drawPipeClamp(0, yVal);
    drawPipeClamp(canvas.width - BORDER_WIDTH, yVal);
  }

  // Draw spawn hatches
  spawnHatches.forEach(h => {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(h.x, h.y, h.width, h.height - 2);

    ctx.fillStyle = COLORS.HATCH_BLUE[1];
    ctx.fillRect(h.x, h.y, h.width, 3);

    // Closed doors (static background detail)
    ctx.fillStyle = COLORS.HATCH_BLUE[0];
    ctx.fillRect(h.x + 2, h.y + 3, h.width - 4, 7);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(h.x + 4, h.y + 4, h.width - 8, 1.5);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(h.x, h.y, h.width, h.height);
  });

  ctx.restore();
}

function drawPipeSegment(x, y, w, h, dir) {
  const sh = COLORS.BORDER_METAL;
  
  if (dir === 'vertical') {
    ctx.fillStyle = sh[2];
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = sh[1];
    ctx.fillRect(x + 2, y, w - 4, h);
    ctx.fillStyle = sh[0];
    ctx.fillRect(x + 4, y, 4, h);

    ctx.fillStyle = sh[3];
    ctx.fillRect(x + w - 4, y, 3, h);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    const ridgeDist = 24;
    for (let rY = ridgeDist; rY < h; rY += ridgeDist) {
      ctx.fillRect(x + 1, y + rY, w - 2, 2);
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  } else {
    ctx.fillStyle = sh[2];
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = sh[1];
    ctx.fillRect(x, y + 2, w, h - 4);
    ctx.fillStyle = sh[0];
    ctx.fillRect(x, y + 4, w, 4);

    ctx.fillStyle = sh[3];
    ctx.fillRect(x, y + h - 4, w, 3);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    const ridgeDist = 24;
    for (let rX = x + ridgeDist; rX < x + w; rX += ridgeDist) {
      ctx.fillRect(rX, y + 1, 2, h - 2);
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
}

function drawPipeClamp(x, y) {
  const cl = COLORS.BORDER_CLAMP;
  ctx.fillStyle = cl[1];
  ctx.fillRect(x - 2, y + 1, BORDER_WIDTH + 4, 12);

  ctx.fillStyle = cl[0];
  ctx.fillRect(x, y + 3, BORDER_WIDTH, 3);

  ctx.fillStyle = cl[2];
  ctx.fillRect(x - 2, y + 9, BORDER_WIDTH + 4, 4);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - 2, y + 1, BORDER_WIDTH + 4, 12);
}

// --- Core Physics Engine Collision Helpers ---
function intersectCircleRect(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  const distX = circle.x - closestX;
  const distY = circle.y - closestY;
  const distSq = (distX * distX) + (distY * distY);

  if (distSq < circle.radius * circle.radius) {
    const dist = Math.sqrt(distSq);
    let normalX = 0;
    let normalY = -1;

    if (dist > 0.001) {
      normalX = distX / dist;
      normalY = distY / dist;
    }

    return {
      collided: true,
      closestX,
      closestY,
      normalX,
      normalY,
      penetration: circle.radius - dist
    };
  }

  return { collided: false };
}

// --- Check Level Complete ---
function checkLevelComplete() {
  if (bricks.length === 0) {
    currentLevel++;
    currentBallSpeed = Math.min(BALL_SPEED_MAX, BALL_SPEED_INIT * Math.pow(1.10, currentLevel - 1));

    window.audio.playVictory();
    updateLevelHUD();
    loadLevel(currentLevel);
    resetBallPaddle();
  }
}

// --- Reset Ball / Paddle Position ---
function resetBallPaddle() {
  paddle = new Paddle();
  balls = [new Ball(paddle.x + paddle.width / 2, paddle.y - 7)];
  paddle.catchBall(balls[0]);
}

// --- Game Logic Update Loop ---
function update(dt) {
  if (gameState !== STATES.PLAYING) return;

  bgScrollOffset = (bgScrollOffset + 0.25) % 32;
  paddle.update(dt);

  // Update Balls & Physics
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    ball.update(dt);

    if (ball.isStuck) continue;

    // Gutter Out
    if (ball.y - ball.radius > canvas.height) {
      balls.splice(i, 1);
      if (balls.length === 0) {
        loseLife();
      }
      continue;
    }

    // Ball-to-Paddle
    const colPaddle = intersectCircleRect(ball, paddle);
    if (colPaddle.collided && ball.dy > 0) {
      const hitX = ball.x - paddle.x;
      const relativeHit = Math.max(0, Math.min(1.0, hitX / paddle.width));
      
      const maxAngle = 65 * Math.PI / 180;
      const bounceAngle = (relativeHit - 0.5) * 2 * maxAngle;

      ball.dx = ball.speed * Math.sin(bounceAngle);
      ball.dy = -ball.speed * Math.cos(bounceAngle);
      
      if (Math.abs(ball.dy) < 1.5) ball.dy = -1.5;
      ball.y = paddle.y - ball.radius;

      window.audio.playPaddleBounce();
      createImpactParticles(ball.x, ball.y + ball.radius, '#ffffff');
      continue;
    }

    // Ball-to-Brick
    for (let j = bricks.length - 1; j >= 0; j--) {
      const brick = bricks[j];
      const col = intersectCircleRect(ball, brick);

      if (col.collided) {
        ball.x += col.normalX * col.penetration;
        ball.y += col.normalY * col.penetration;

        if (Math.abs(col.normalX) > Math.abs(col.normalY)) {
          ball.dx = col.normalX * Math.abs(ball.dx);
        } else {
          ball.dy = col.normalY * Math.abs(ball.dy);
        }

        const destroyed = brick.damage();
        if (destroyed) {
          bricks.splice(j, 1);
          if (brick.type === 'bomb') {
            triggerBombExplosion(brick);
          } else {
            checkLevelComplete();
          }
        }
        break;
      }
    }
  }

  // Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update(dt);
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// --- Player Gutter Death ---
function loseLife() {
  window.audio.playExplosion();
  createBrickParticles(paddle.x + paddle.width/2, paddle.y + paddle.height/2, '#ff3b30', '#ffffff');

  lives--;
  updateLivesHUD();

  if (lives <= 0) {
    gameState = STATES.GAMEOVER;
    window.audio.playGameOver();
    finalScoreSpan.textContent = String(score).padStart(8, '0');
    showOverlay(gameOverMenu);

    if (score > highscore) {
      highscore = score;
      localStorage.setItem('bricked_up_hiscore', highscore);
      highscoreVal.textContent = String(highscore).padStart(8, '0');
    }
  } else {
    resetBallPaddle();
  }
}

// --- Render / Draw Game Loop ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (bgPattern) {
    ctx.save();
    ctx.translate(bgScrollOffset, bgScrollOffset);
    ctx.fillStyle = bgPattern;
    ctx.fillRect(-32, -32, canvas.width + 64, canvas.height + 64);
    ctx.restore();
  } else {
    ctx.fillStyle = COLORS.BACKGROUND_DARK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  bricks.forEach(b => b.draw());
  particles.forEach(p => p.draw());
  paddle.draw();
  balls.forEach(b => b.draw());
  drawFrameBorders();
}

// --- Score and UI HUD sync ---
function updateScoreHUD() {
  scoreVal.textContent = String(score).padStart(8, '0');
  
  if (score > highscore) {
    highscore = score;
    highscoreVal.textContent = String(highscore).padStart(8, '0');
  }
}

// Draw red lives indicators on controls bar
function updateLivesHUD() {
  livesDisplay.innerHTML = '';
  for (let i = 0; i < lives; i++) {
    const lifeDiv = document.createElement('div');
    lifeDiv.className = 'life-paddle';
    livesDisplay.appendChild(lifeDiv);
  }
}

function updateLevelHUD() {
  if (levelDisplay) {
    levelDisplay.textContent = `LEVEL ${currentLevel}`;
  }
}

// --- Main Menu Overlay Handlers ---
function showOverlay(menuToShow) {
  uiOverlay.classList.remove('hidden');
  startMenu.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  gameOverMenu.classList.add('hidden');

  menuToShow.classList.remove('hidden');
}

function hideOverlay() {
  uiOverlay.classList.add('hidden');
}

// --- Reset / Init New Game ---
function startNewGame() {
  score = 0;
  lives = 3;
  currentLevel = 1;
  currentBallSpeed = BALL_SPEED_INIT;
  gameState = STATES.PLAYING;

  window.audio.resume();

  updateScoreHUD();
  updateLivesHUD();
  updateLevelHUD();
  initSpawnHatches();
  loadLevel(currentLevel);
  resetBallPaddle();
  hideOverlay();

  lastTime = performance.now();
}

// --- Main animation Frame Game Loop ---
function gameLoop(time) {
  let dt = (time - lastTime) / 1000;
  if (dt > 0.1) dt = 0.1; 
  lastTime = time;

  if (gameState === STATES.PLAYING) {
    update(dt);
    draw();
  }

  requestAnimationFrame(gameLoop);
}

// --- Event Listeners and Setup Hooks ---

// Keyboard key tracking
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (gameState === STATES.PLAYING) {
      gameState = STATES.PAUSED;
      window.audio.playWallBounce();
      showOverlay(pauseMenu);
    } else if (gameState === STATES.PAUSED) {
      gameState = STATES.PLAYING;
      window.audio.resume();
      hideOverlay();
    }
  }

  if (e.code === 'Space') {
    e.preventDefault();
    if (gameState === STATES.PLAYING) {
      if (paddle.caughtBalls.length > 0) {
        paddle.releaseBalls();
      }
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Capture Mouse coordinates relative to canvas bounds
function handleMouseMove(clientX) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  mouseX = (clientX - rect.left) * scaleX;
}

window.addEventListener('mousemove', (e) => {
  handleMouseMove(e.clientX);
});

// Touch controls for mobile portrait compatibility (Bottom-half drag area)
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length > 0) {
    const rect = canvas.getBoundingClientRect();
    const relativeY = e.touches[0].clientY - rect.top;
    
    // Drag/touch is strictly initiated in the bottom half of the screen
    if (relativeY > rect.height / 2) {
      isDraggingPaddle = true;
      handleMouseMove(e.touches[0].clientX);
      
      // Tap launch if ball is stuck
      if (gameState === STATES.PLAYING) {
        if (paddle.caughtBalls.length > 0) {
          paddle.releaseBalls();
        }
      }
    }
  }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (isDraggingPaddle && e.touches.length > 0) {
    handleMouseMove(e.touches[0].clientX);
  }
}, { passive: true });

canvas.addEventListener('touchend', () => {
  isDraggingPaddle = false;
});

// Launch Ball on mouse mousedown (desktop clicks)
window.addEventListener('mousedown', (e) => {
  if (e.target.closest('button') || e.target.closest('header') || e.target.closest('footer')) return;

  if (gameState === STATES.PLAYING) {
    if (paddle.caughtBalls.length > 0) {
      paddle.releaseBalls();
    }
  }
});

// Button Click Event Hooks
document.getElementById('btn-classic').addEventListener('click', startNewGame);
document.getElementById('btn-resume').addEventListener('click', () => {
  gameState = STATES.PLAYING;
  window.audio.resume();
  hideOverlay();
});
document.getElementById('btn-retry').addEventListener('click', startNewGame);

// Sound Toggle
btnSound.addEventListener('click', () => {
  const active = window.audio.toggle();
  if (active) {
    soundOnIcon.classList.remove('hidden');
    soundOffIcon.classList.add('hidden');
    btnSound.querySelector('.btn-text').textContent = 'SOUND: ON';
  } else {
    soundOnIcon.classList.add('hidden');
    soundOffIcon.classList.remove('hidden');
    btnSound.querySelector('.btn-text').textContent = 'SOUND: OFF';
  }
});

// Fullscreen Toggle
btnFullscreen.addEventListener('click', () => {
  const container = document.querySelector('.game-container');
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => {
      console.error(`Error enabling fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
});

// Start Setup on Page Load
initDimensions();
initBackgroundPattern();
initSpawnHatches();
resetBallPaddle();
showOverlay(startMenu);

// Start gameLoop
requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(gameLoop);
});
