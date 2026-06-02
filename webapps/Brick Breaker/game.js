/**
 * Brick Breaker (Arkanoid Clone) Game Engine
 * Highly polished retro canvas breakout game with pixel-art sprites,
 * advanced physics, lasers, multiple powerups, particles, and floating enemies.
 */

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State constants
const STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  VICTORY: 'VICTORY'
};

// Global Config & Constants
const BORDER_WIDTH = 18;
const HATCH_Y = BORDER_WIDTH;
const BRICK_COLS = 13;
const BRICK_HEIGHT = 18;
const BALL_SPEED_INIT = 4.5;
const BALL_SPEED_MAX = 8;

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

// Core Game Variables
let gameState = STATES.MENU;
let gameMode = 'classic'; // 'classic' or 'random'
let score = 0;
let highscore = parseInt(localStorage.getItem('brick_breaker_hiscore')) || 50000;
let lives = 3;
let currentLevel = 1;
let totalLevels = 3;

// Objects
let paddle = null;
let balls = [];
let bricks = [];
let capsules = [];
let lasers = [];
let enemies = [];
let particles = [];
let spawnHatches = [];
let bgPattern = null;

// Animation & Loops
let lastTime = 0;
let enemySpawnTimer = 0;
let bgScrollOffset = 0;
let isMuted = false;

// DOM Elements
const scoreVal = document.getElementById('score');
const highscoreVal = document.getElementById('highscore');
const livesDisplay = document.getElementById('lives-display');
const uiOverlay = document.getElementById('ui-overlay');
const startMenu = document.getElementById('start-menu');
const pauseMenu = document.getElementById('pause-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const victoryMenu = document.getElementById('victory-menu');
const finalScoreSpan = document.getElementById('final-score');
const victoryScoreSpan = document.getElementById('victory-score');
const btnSound = document.getElementById('btn-sound');
const btnFullscreen = document.getElementById('btn-fullscreen');
const soundOnIcon = document.getElementById('sound-on-icon');
const soundOffIcon = document.getElementById('sound-off-icon');

// Hatch lights DOM indicators
const hatchLights = document.querySelectorAll('.hatch-light');

// Initial High Score Render
highscoreVal.textContent = String(highscore).padStart(8, '0');

// Input state
const keys = {};
let mouseX = canvas.width / 2;

// --- Initialize Background Texture Pattern ---
function initBackgroundPattern() {
  const size = 32;
  const pCanvas = document.createElement('canvas');
  pCanvas.width = size;
  pCanvas.height = size;
  const pCtx = pCanvas.getContext('2d');

  // Draw isometric-like diamond tile pattern
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

  // Dark shading borders
  pCtx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  pCtx.lineWidth = 1;
  pCtx.beginPath();
  pCtx.moveTo(0, size / 2);
  pCtx.lineTo(size / 2, size);
  pCtx.lineTo(size, size / 2);
  pCtx.stroke();

  // Light highlights
  pCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  pCtx.beginPath();
  pCtx.moveTo(0, size / 2);
  pCtx.lineTo(size / 2, 0);
  pCtx.lineTo(size, size / 2);
  pCtx.stroke();

  bgPattern = ctx.createPattern(pCanvas, 'repeat');
}

// --- Spawning Hatches Setup ---
function initSpawnHatches() {
  spawnHatches = [
    { x: BORDER_WIDTH + 80, y: HATCH_Y, width: 36, height: 12, openState: 0 },
    { x: canvas.width / 2 - 18, y: HATCH_Y, width: 36, height: 12, openState: 0 },
    { x: canvas.width - BORDER_WIDTH - 80 - 36, y: HATCH_Y, width: 36, height: 12, openState: 0 }
  ];
}

// --- Paddle Class ---
class Paddle {
  constructor() {
    this.width = 90;
    this.height = 18;
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - 35;
    this.speed = 8;
    
    // States
    this.targetWidth = 90;
    this.laserActive = false;
    this.catchActive = false;
    this.caughtBalls = []; // Balls currently stuck to paddle
    
    // Visual anims
    this.laserFlash = 0;
  }

  update(dt) {
    // Width animation interpolation
    if (this.width !== this.targetWidth) {
      const diff = this.targetWidth - this.width;
      if (Math.abs(diff) < 1) {
        this.width = this.targetWidth;
      } else {
        this.width += diff * 0.15;
      }
    }

    // Keyboard inputs
    if (keys['ArrowLeft'] || keys['KeyA']) {
      this.x -= this.speed;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      this.x += this.speed;
    }

    // Mouse control takes priority
    if (mouseX !== undefined) {
      this.x = mouseX - this.width / 2;
    }

    // Clamp paddle to inside borders
    const leftLimit = BORDER_WIDTH + 4;
    const rightLimit = canvas.width - BORDER_WIDTH - this.width - 4;
    if (this.x < leftLimit) this.x = leftLimit;
    if (this.x > rightLimit) this.x = rightLimit;

    // Laser flashing cooldown
    if (this.laserFlash > 0) this.laserFlash -= dt;

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

    // Red capsule ends or Silver body depending on Laser powerup
    const capColors = this.laserActive ? COLORS.PADDLE_RED : COLORS.PADDLE_RED;
    const bodyColors = this.laserActive ? COLORS.PADDLE_RED : COLORS.PADDLE_METAL;

    // Left Cap (Red rounded dome)
    ctx.fillStyle = capColors[1];
    ctx.beginPath();
    ctx.arc(x + rCap, y + h / 2, rCap, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
    
    // Left Cap shine
    ctx.fillStyle = capColors[0];
    ctx.beginPath();
    ctx.arc(x + rCap + 2, y + h / 2 - 2, rCap - 4, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();

    // Right Cap (Red rounded dome)
    ctx.fillStyle = capColors[1];
    ctx.beginPath();
    ctx.arc(x + w - rCap, y + h / 2, rCap, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fill();

    // Right Cap shine
    ctx.fillStyle = capColors[0];
    ctx.beginPath();
    ctx.arc(x + w - rCap - 2, y + h / 2 - 2, rCap - 4, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fill();

    // Center metallic barrel
    ctx.fillStyle = bodyColors[2];
    ctx.fillRect(x + rCap, y, w - rCap * 2, h);

    // Shiny highlights (horizontal lines)
    ctx.fillStyle = bodyColors[1];
    ctx.fillRect(x + rCap, y + 2, w - rCap * 2, 3);
    ctx.fillStyle = bodyColors[0];
    ctx.fillRect(x + rCap, y + 5, w - rCap * 2, 2);

    ctx.fillStyle = bodyColors[3];
    ctx.fillRect(x + rCap, y + h - 4, w - rCap * 2, 3);

    // Laser nozzles visual indicators (if Laser active)
    if (this.laserActive) {
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(x + rCap + 5, y - 2, 4, 3);
      ctx.fillRect(x + w - rCap - 9, y - 2, 4, 3);
      
      // Laser core glow
      if (this.laserFlash > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + rCap + 3, y - 4, 8, 4);
        ctx.fillRect(x + w - rCap - 11, y - 4, 8, 4);
      }
    }

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

  shoot() {
    if (!this.laserActive || lasers.length >= 6) return;
    
    // Spawn two lasers from left and right side of paddle
    const rCap = 10;
    const laserLeftX = this.x + rCap + 7;
    const laserRightX = this.x + this.width - rCap - 11;
    const laserY = this.y - 6;

    lasers.push(new Laser(laserLeftX, laserY));
    lasers.push(new Laser(laserRightX, laserY));

    this.laserFlash = 0.08; // Flash animation duration
    window.audio.playLaser();
  }

  catchBall(ball, force = false) {
    if (!this.catchActive && !force) return false;
    
    // Check if this ball is already caught
    if (this.caughtBalls.some(cb => cb.ball === ball)) return true;

    // Calculate stick offset
    const offset = ball.x - this.x;
    this.caughtBalls.push({ ball, offset });
    ball.isStuck = true;
    return true;
  }

  releaseBalls() {
    if (this.caughtBalls.length === 0) return;
    
    this.caughtBalls.forEach(cb => {
      cb.ball.isStuck = false;
      
      // Steer ball angle relative to release point
      const relativeHit = cb.offset / this.width;
      const angle = (relativeHit - 0.5) * 1.2; // Angle sweep
      cb.ball.dx = cb.ball.speed * Math.sin(angle);
      cb.ball.dy = -cb.ball.speed * Math.cos(angle);
      if (Math.abs(cb.ball.dy) < 1.5) cb.ball.dy = -1.5; // Prevent too flat horizontal bounces
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
    this.speed = BALL_SPEED_INIT;
    this.dx = dx;
    this.dy = dy;
    this.isStuck = false;
  }

  update(dt) {
    if (this.isStuck) return;

    // Apply movement
    this.x += this.dx;
    this.y += this.dy;

    // Wall reflections
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
    const rx = Math.round(this.x);
    const ry = Math.round(this.y);
    const r = Math.round(this.radius);

    ctx.save();
    
    // Draw ball shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(rx + 3, ry + 3, r, 0, Math.PI * 2);
    ctx.fill();

    // Retro shaded pixel ball
    ctx.fillStyle = COLORS.BALL_SHADE[1];
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();

    // 3D Highlight dot
    ctx.fillStyle = COLORS.BALL_SHADE[0];
    ctx.beginPath();
    ctx.arc(rx - 2, ry - 2, r - 4, 0, Math.PI * 2);
    ctx.fill();

    // Outer outline
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
    this.x = BORDER_WIDTH + 6 + col * 58;
    this.y = BORDER_WIDTH + 55 + row * BRICK_HEIGHT;
    this.width = 57;
    this.height = BRICK_HEIGHT - 1;
    this.health = type === 'silver' ? 2 : 1;
    this.isCracked = false;
    this.flashFrame = 0; // Visual damage flash
  }

  damage() {
    this.health--;
    this.flashFrame = 5; // Flashes white for 5 game cycles
    
    if (this.health <= 0) {
      score += this.type === 'silver' ? 200 : 100;
      updateScoreHUD();
      window.audio.playBrickBreak();
      
      // Spawn colored particles
      const colors = COLORS.BRICKS[this.type.toUpperCase()];
      createBrickParticles(this.x + this.width/2, this.y + this.height/2, colors[0], colors[1]);
      
      // Roll chance for powerup (15% drop rate, bombs do not drop powerups to avoid overlaps)
      if (this.type !== 'bomb' && Math.random() < 0.15) {
        spawnCapsule(this.x + this.width / 2, this.y + this.height / 2);
      }
      return true; // Destroyed
    } else {
      // Silver brick cracked state
      this.isCracked = true;
      score += 50;
      updateScoreHUD();
      window.audio.playMetalClang();
      return false; // Damaged but not destroyed
    }
  }

  draw() {
    const rx = Math.round(this.x);
    const ry = Math.round(this.y);
    const rw = Math.round(this.width);
    const rh = Math.round(this.height);

    ctx.save();

    // Damage White Flash Overlay
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

    // Special Bomb Drawing
    if (this.type === 'bomb') {
      // Neon warning orange base
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(rx, ry, rw, rh);

      // Warning hazard stripes (black diagonal lines)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let offset = -rh; offset < rw; offset += 16) {
        ctx.moveTo(rx + offset, ry);
        ctx.lineTo(rx + offset + rh, ry + rh);
      }
      ctx.stroke();

      // Pulsing bright red/orange neon frame glow
      const pulse = Math.abs(Math.sin(performance.now() / 150));
      ctx.strokeStyle = `rgba(255, 0, 0, ${0.4 + pulse * 0.6})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);

      // Black outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, rw, rh);
      
      ctx.restore();
      return;
    }

    // Determine colors base
    const colors = COLORS.BRICKS[this.type.toUpperCase()];

    // Base body fill (midtone)
    ctx.fillStyle = colors[1];
    ctx.fillRect(rx, ry, rw, rh);

    // Bevel highlights (top and left borders)
    ctx.fillStyle = colors[0];
    ctx.fillRect(rx, ry, rw, 2); // Top highlights
    ctx.fillRect(rx, ry, 2, rh); // Left highlights

    // Bevel shadows (bottom and right borders)
    ctx.fillStyle = colors[2];
    ctx.fillRect(rx, ry + rh - 2, rw, 2); // Bottom shadow
    ctx.fillRect(rx + rw - 2, ry, 2, rh); // Right shadow

    ctx.fillStyle = colors[3];
    ctx.fillRect(rx, ry + rh - 1, rw, 1);
    ctx.fillRect(rx + rw - 1, ry, 1, rh);

    // Silver metallic extra luster reflection stripe
    if (this.type === 'silver') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(rx + 8, ry + 2, 4, rh - 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(rx + 12, ry + 2, 2, rh - 4);
    }

    // Crack lines on damaged silver bricks
    if (this.isCracked && this.type === 'silver') {
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Drawn pixelated crack lines
      ctx.moveTo(rx + 10, ry + 3);
      ctx.lineTo(rx + 18, ry + 9);
      ctx.lineTo(rx + 15, ry + 14);
      
      ctx.moveTo(rx + rw - 12, ry + rh - 3);
      ctx.lineTo(rx + rw - 16, ry + 8);
      ctx.lineTo(rx + rw - 24, ry + 11);
      ctx.stroke();
    }

    // Draw solid black outline around entire brick
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, rw, rh);

    ctx.restore();
  }
}

// --- Power-up Capsule Class ---
const CAPSULE_TYPES = {
  S: { letter: 'S', color: '#ff8800', desc: 'Slow Ball' },     // Orange
  E: { letter: 'E', color: '#0055ff', desc: 'Expand Paddle' }, // Blue
  C: { letter: 'C', color: '#00cc00', desc: 'Catch Ball' },    // Green
  L: { letter: 'L', color: '#cc0000', desc: 'Laser Paddle' },  // Red
  D: { letter: 'D', color: '#00ffff', desc: 'Divide Balls' },  // Cyan
  P: { letter: 'P', color: '#ff00ff', desc: 'Player Extra' },  // Magenta
  B: { letter: 'B', color: '#a0a0a0', desc: 'Break Exit' }     // Silver/Gray
};

class Capsule {
  constructor(x, y, typeKey) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 12;
    this.typeKey = typeKey;
    this.speed = 2.0;
    this.rotVal = 0; // Rotational cycle animations
  }

  update(dt) {
    this.y += this.speed;
    this.rotVal += 0.15; // Speed of spin
  }

  draw() {
    const rx = Math.round(this.x);
    const ry = Math.round(this.y);
    const capInfo = CAPSULE_TYPES[this.typeKey];

    ctx.save();
    
    // Draw rotation compressing/spinning effect
    const spinWidth = this.width * Math.abs(Math.sin(this.rotVal));
    const leftOffset = (this.width - spinWidth) / 2;

    // Draw Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(rx - this.width / 2 + 3, ry - this.height / 2 + 3, this.width, this.height);

    // Pill body drawing
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx - spinWidth / 2, ry - this.height / 2, spinWidth, this.height);

    // Draw color band in middle
    ctx.fillStyle = capInfo.color;
    ctx.fillRect(rx - spinWidth / 4, ry - this.height / 2, spinWidth / 2, this.height);

    // Pill round outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx - spinWidth / 2, ry - this.height / 2, spinWidth, this.height);

    // Draw Letter inside (only when capsule is front-facing)
    if (Math.abs(Math.sin(this.rotVal)) > 0.4) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(capInfo.letter, rx, ry + 1);
    }

    ctx.restore();
  }
}

// --- Laser Class ---
class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 14;
    this.speed = 7;
  }

  update() {
    this.y -= this.speed;
  }

  draw() {
    ctx.save();
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Core white light
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);

    ctx.strokeStyle = '#9b0000';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
}

// --- Floating Enemy Class ---
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.speedY = 0.8;
    this.baseX = x;
    this.angle = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() * 0.05 + 0.02) * (Math.random() < 0.5 ? 1 : -1);
    this.spinAnim = 0;
    
    // Flying path amplitude
    this.amp = 40 + Math.random() * 30;
  }

  update() {
    this.angle += 0.02;
    this.spinAnim += this.rotSpeed;

    // Sine wave flight down
    this.y += this.speedY;
    this.x = this.baseX + Math.sin(this.angle) * this.amp;

    // Bounce off border limits
    const leftLimit = BORDER_WIDTH + this.radius;
    const rightLimit = canvas.width - BORDER_WIDTH - this.radius;
    if (this.x < leftLimit) {
      this.x = leftLimit;
      this.baseX = leftLimit - Math.sin(this.angle) * this.amp;
    }
    if (this.x > rightLimit) {
      this.x = rightLimit;
      this.baseX = rightLimit - Math.sin(this.angle) * this.amp;
    }
  }

  draw() {
    const rx = Math.round(this.x);
    const ry = Math.round(this.y);
    const r = this.radius;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(rx + 4, ry + 4, r, 0, Math.PI * 2);
    ctx.fill();

    // Floating metallic dome shape (silver-blue geometric shell)
    ctx.fillStyle = '#2166e0';
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner 3D lines that spin
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rx, ry, r - 3, 0, Math.PI * 2);
    ctx.stroke();

    // Draw geometric spinning spokes
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const spAngle = this.spinAnim + (i * Math.PI / 2);
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(spAngle) * r, ry + Math.sin(spAngle) * r);
    }
    ctx.stroke();

    // Core light bead
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(rx, ry, r - 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.stroke();

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
    this.vy += 0.12; // Gravity effect
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

// --- Setup Randomized Symmetrical Levels ---
function loadLevel(levelNum) {
  bricks = [];
  capsules = [];
  lasers = [];
  enemies = [];
  particles = [];
  
  if (paddle) {
    paddle.laserActive = false;
    paddle.catchActive = false;
    paddle.targetWidth = 90;
    paddle.caughtBalls = [];
  }

  // Brick type pool
  const types = ['red', 'yellow', 'blue', 'magenta', 'green'];
  const halfCols = Math.ceil(BRICK_COLS / 2); // 7 columns for symmetry mirror
  const rowCount = 5 + Math.floor(Math.random() * 3); // 5 to 7 rows of blocks

  const grid = [];
  for (let r = 0; r < rowCount; r++) {
    grid.push(Array(BRICK_COLS).fill(null));
  }

  // Select a visual layout style procedurally (every load generates unique balanced shapes)
  const layoutStyle = Math.floor(Math.random() * 3);

  if (layoutStyle === 0) {
    // Style 0: Symmetrical Pillars / Towers
    for (let r = 0; r < rowCount; r++) {
      const color = r === 0 ? 'silver' : types[Math.floor(Math.random() * types.length)];
      for (let c = 0; c < halfCols; c++) {
        // 75% active fill chance for towers
        if (Math.random() < 0.75) {
          grid[r][c] = color;
          grid[r][BRICK_COLS - 1 - c] = color; // Mirror
        }
      }
    }
  } else if (layoutStyle === 1) {
    // Style 1: Symmetrical Step Pyramid
    for (let r = 0; r < rowCount; r++) {
      const color = r === 0 ? 'silver' : types[Math.floor(Math.random() * types.length)];
      const step = r; // tapers downwards
      for (let c = step; c < halfCols; c++) {
        grid[r][c] = color;
        grid[r][BRICK_COLS - 1 - c] = color; // Mirror
      }
    }
  } else {
    // Style 2: Chess Checkered Diamond
    for (let r = 0; r < rowCount; r++) {
      const color = r === 0 ? 'silver' : types[Math.floor(Math.random() * types.length)];
      for (let c = 0; c < halfCols; c++) {
        if ((r + c) % 2 === 0) {
          grid[r][c] = color;
          grid[r][BRICK_COLS - 1 - c] = color; // Mirror
        }
      }
    }
  }

  // --- Seed Bomb Bricks ---
  // Assemble a list of all active non-empty block coordinates
  const activeCoords = [];
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      if (grid[r][c] !== null) {
        activeCoords.push({ r, c });
      }
    }
  }

  // Seed approximately 10% of bricks as explosive bombs (min 3, max 8)
  const bombCount = Math.max(3, Math.min(8, Math.floor(activeCoords.length * 0.1)));
  for (let i = 0; i < bombCount; i++) {
    if (activeCoords.length === 0) break;
    const randIdx = Math.floor(Math.random() * activeCoords.length);
    const coord = activeCoords.splice(randIdx, 1)[0];
    
    // Assign explosive type
    grid[coord.r][coord.c] = 'bomb';
  }

  // Instantiate Brick objects
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
    const vy = Math.sin(angle) * speed - 1.5; // Upward burst bias
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
  // Sparking circular ring fire burst
  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.0 + Math.random() * 6.5;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const color = Math.random() < 0.4 ? '#ff5500' : (Math.random() < 0.7 ? '#ffcc00' : '#ff2200');
    // Larger pixel size
    particles.push(new Particle(x, y, color, vx, vy, 4 + Math.floor(Math.random() * 3), 1.2));
  }
}

// --- Trigger Bomb Explosion (3x3 grid blast radius) ---
function triggerBombExplosion(bomb) {
  window.audio.playExplosion();
  createExplosionParticles(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2);

  // Scan for adjacent bricks within row and column differences <= 1.2
  for (let i = bricks.length - 1; i >= 0; i--) {
    const b = bricks[i];
    if (b === bomb) continue;

    const colDiff = Math.abs(b.col - bomb.col);
    const rowDiff = Math.abs(b.row - bomb.row);

    if (colDiff <= 1.2 && rowDiff <= 1.2) {
      if (b.type === 'bomb') {
        // Staggered chain reaction delay (120ms) looks incredibly cool and visual!
        setTimeout(() => {
          // Verify bomb brick is still active in the array before detonating
          const idx = bricks.indexOf(b);
          if (idx !== -1) {
            bricks.splice(idx, 1);
            triggerBombExplosion(b);
            checkLevelComplete();
          }
        }, 120);
      } else {
        // Damage adjacent brick (silver brick takes damage, colored brick is destroyed)
        const destroyed = b.damage();
        if (destroyed) {
          bricks.splice(i, 1);
        }
      }
    }
  }

  checkLevelComplete();
}

// --- Spawn Capsules ---
function spawnCapsule(x, y) {
  const keys = Object.keys(CAPSULE_TYPES);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  capsules.push(new Capsule(x, y, randomKey));
}

// --- Spawn Floating Enemies ---
function spawnEnemy() {
  if (enemies.length >= 3) return;
  
  // Pick a random spawner hatch
  const hatchIdx = Math.floor(Math.random() * spawnHatches.length);
  const hatch = spawnHatches[hatchIdx];

  // Open animation triggers indicator light flashing
  hatch.openState = 30; // 30 game frame cycles open
  
  // Trigger spawner visual light blink red/green
  hatchLights[hatchIdx].classList.remove('active');
  hatchLights[hatchIdx].classList.add('green');

  setTimeout(() => {
    hatchLights[hatchIdx].classList.remove('green');
    hatchLights[hatchIdx].classList.add('active');
  }, 1000);

  const newEnemy = new Enemy(hatch.x + hatch.width / 2, hatch.y + 12);
  enemies.push(newEnemy);
}

// --- Render Metallic Pipes Border ---
function drawFrameBorders() {
  ctx.save();

  // LEFT Border Pipe
  drawPipeSegment(0, 0, BORDER_WIDTH, canvas.height, 'vertical');
  // RIGHT Border Pipe
  drawPipeSegment(canvas.width - BORDER_WIDTH, 0, BORDER_WIDTH, canvas.height, 'vertical');
  // TOP Border Pipe
  drawPipeSegment(BORDER_WIDTH, 0, canvas.width - BORDER_WIDTH * 2, BORDER_WIDTH, 'horizontal');

  // Decorative clamps at the corners
  drawPipeClamp(0, 0); // Top Left
  drawPipeClamp(canvas.width - BORDER_WIDTH, 0); // Top Right

  // Mid joint clamps on vertical walls
  const jointYCount = 3;
  for (let i = 1; i <= jointYCount; i++) {
    const yVal = (canvas.height / (jointYCount + 1)) * i;
    drawPipeClamp(0, yVal);
    drawPipeClamp(canvas.width - BORDER_WIDTH, yVal);
  }

  // Draw spawn hatches
  spawnHatches.forEach(h => {
    // Dark opening
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(h.x, h.y, h.width, h.height - 2);

    // Draw hatch gates (if openState is active, draw sliding apart gates)
    ctx.fillStyle = COLORS.HATCH_BLUE[1];
    ctx.fillRect(h.x, h.y, h.width, 3); // top lip

    if (h.openState > 0) {
      h.openState--;
      // Semi open doors
      ctx.fillStyle = COLORS.HATCH_BLUE[2];
      ctx.fillRect(h.x, h.y + 3, h.width * 0.25, 7);
      ctx.fillRect(h.x + h.width * 0.75, h.y + 3, h.width * 0.25, 7);
    } else {
      // Closed doors
      ctx.fillStyle = COLORS.HATCH_BLUE[0];
      ctx.fillRect(h.x + 2, h.y + 3, h.width - 4, 7);

      // Light hatch shine
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(h.x + 4, h.y + 4, h.width - 8, 1.5);
    }

    // Outer Hatch Bevel outlines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(h.x, h.y, h.width, h.height);
  });

  ctx.restore();
}

function drawPipeSegment(x, y, w, h, dir) {
  // Shading colors
  const sh = COLORS.BORDER_METAL;
  
  if (dir === 'vertical') {
    // Base pipe
    ctx.fillStyle = sh[2];
    ctx.fillRect(x, y, w, h);

    // Light shininess lines
    ctx.fillStyle = sh[1];
    ctx.fillRect(x + 2, y, w - 4, h);
    ctx.fillStyle = sh[0];
    ctx.fillRect(x + 4, y, 4, h);

    ctx.fillStyle = sh[3];
    ctx.fillRect(x + w - 4, y, 3, h);

    // Horizontal dark separation score ridges
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    const ridgeDist = 24;
    for (let rY = ridgeDist; rY < h; rY += ridgeDist) {
      ctx.fillRect(x + 1, y + rY, w - 2, 2);
    }

    // Outlines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  } else {
    // Horizontal Pipe
    ctx.fillStyle = sh[2];
    ctx.fillRect(x, y, w, h);

    // Light shininess
    ctx.fillStyle = sh[1];
    ctx.fillRect(x, y + 2, w, h - 4);
    ctx.fillStyle = sh[0];
    ctx.fillRect(x, y + 4, w, 4);

    ctx.fillStyle = sh[3];
    ctx.fillRect(x, y + h - 4, w, 3);

    // Vertical ridges
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
  
  // Drawn copper bracket sleeve over pipe
  ctx.fillStyle = cl[1];
  ctx.fillRect(x - 2, y + 1, BORDER_WIDTH + 4, 12);

  // shine
  ctx.fillStyle = cl[0];
  ctx.fillRect(x, y + 3, BORDER_WIDTH, 3);

  // shadow
  ctx.fillStyle = cl[2];
  ctx.fillRect(x - 2, y + 9, BORDER_WIDTH + 4, 4);

  // outlines
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
    if (currentLevel < totalLevels) {
      currentLevel++;
      window.audio.playVictory();
      loadLevel(currentLevel);
      resetBallPaddle();
    } else {
      gameState = STATES.VICTORY;
      window.audio.playVictory();
      victoryScoreSpan.textContent = String(score).padStart(8, '0');
      showOverlay(victoryMenu);
      
      // Update High score
      if (score > highscore) {
        highscore = score;
        localStorage.setItem('brick_breaker_hiscore', highscore);
        highscoreVal.textContent = String(highscore).padStart(8, '0');
      }
    }
  }
}

// --- Reset Ball / Paddle Position ---
function resetBallPaddle() {
  paddle = new Paddle();
  // Perfect centered starting position sitting on top of the paddle
  balls = [new Ball(paddle.x + paddle.width / 2, paddle.y - 7)];
  
  // Force catch ball on starts regardless of catch powerup activation
  paddle.catchBall(balls[0], true);
}

// --- Game Logic Update Loop ---
function update(dt) {
  if (gameState !== STATES.PLAYING) return;

  // Background slow scroll
  bgScrollOffset = (bgScrollOffset + 0.25) % 32;

  // Update Paddle
  paddle.update(dt);

  // Update Lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    laser.update();

    if (laser.y < BORDER_WIDTH) {
      lasers.splice(i, 1);
      continue;
    }

    let laserHit = false;
    for (let j = bricks.length - 1; j >= 0; j--) {
      const b = bricks[j];
      if (
        laser.x >= b.x && laser.x <= b.x + b.width &&
        laser.y >= b.y && laser.y <= b.y + b.height
      ) {
        laserHit = true;
        createImpactParticles(laser.x, laser.y, '#ffffff');
        
        const destroyed = b.damage();
        if (destroyed) {
          bricks.splice(j, 1);
          if (b.type === 'bomb') {
            triggerBombExplosion(b);
          } else {
            checkLevelComplete();
          }
        }
        break;
      }
    }

    if (laserHit) {
      lasers.splice(i, 1);
    }
  }

  // Update Balls & Physics
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    ball.update(dt);

    if (ball.isStuck) continue;

    // Gutter Out check
    if (ball.y - ball.radius > canvas.height) {
      balls.splice(i, 1);
      
      if (balls.length === 0) {
        loseLife();
      }
      continue;
    }

    // Ball-to-Paddle collision
    const colPaddle = intersectCircleRect(ball, paddle);
    if (colPaddle.collided && ball.dy > 0) {
      const caught = paddle.catchBall(ball);
      
      if (!caught) {
        const hitX = ball.x - paddle.x;
        const relativeHit = Math.max(0, Math.min(1.0, hitX / paddle.width));
        
        const maxAngle = 65 * Math.PI / 180;
        const bounceAngle = (relativeHit - 0.5) * 2 * maxAngle;

        ball.dx = ball.speed * Math.sin(bounceAngle);
        ball.dy = -ball.speed * Math.cos(bounceAngle);
        
        if (Math.abs(ball.dy) < 1.5) ball.dy = -1.5;
        ball.y = paddle.y - ball.radius; // Pushout

        window.audio.playPaddleBounce();
        createImpactParticles(ball.x, ball.y + ball.radius, '#ffffff');
      }
      continue;
    }

    // Ball-to-Brick collision
    for (let j = bricks.length - 1; j >= 0; j--) {
      const brick = bricks[j];
      const col = intersectCircleRect(ball, brick);

      if (col.collided) {
        // Pushout
        ball.x += col.normalX * col.penetration;
        ball.y += col.normalY * col.penetration;

        // Velocity reflection
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

    // Ball-to-Enemy Collision
    for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
      const enemy = enemies[eIdx];
      const dx = ball.x - enemy.x;
      const dy = ball.y - enemy.y;
      const distSq = dx * dx + dy * dy;
      const minDist = ball.radius + enemy.radius;

      if (distSq < minDist * minDist) {
        enemies.splice(eIdx, 1);
        score += 150;
        updateScoreHUD();
        window.audio.playBrickBreak();
        
        createBrickParticles(enemy.x, enemy.y, '#2166e0', '#00ffff');
        
        ball.dy = -ball.dy;
        ball.dx += (Math.random() - 0.5) * 1.5;
        break;
      }
    }
  }

  // Update Powerup Capsules
  for (let i = capsules.length - 1; i >= 0; i--) {
    const cap = capsules[i];
    cap.update(dt);

    if (cap.y > canvas.height + 10) {
      capsules.splice(i, 1);
      continue;
    }

    if (
      cap.x >= paddle.x && cap.x <= paddle.x + paddle.width &&
      cap.y >= paddle.y && cap.y <= paddle.y + paddle.height
    ) {
      applyPowerup(cap.typeKey);
      capsules.splice(i, 1);
      continue;
    }
  }

  // Update Floating Enemies
  enemySpawnTimer += dt;
  if (enemySpawnTimer > 12.0) {
    enemySpawnTimer = 0;
    if (Math.random() < 0.7) {
      spawnEnemy();
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.update();

    if (
      enemy.x >= paddle.x - 4 && enemy.x <= paddle.x + paddle.width + 4 &&
      enemy.y >= paddle.y - 8 && enemy.y <= paddle.y + paddle.height + 4
    ) {
      enemies.splice(i, 1);
      loseLife();
      continue;
    }

    if (enemy.y > canvas.height + 20) {
      enemies.splice(i, 1);
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

// --- Apply Power-up Capsule ---
function applyPowerup(key) {
  window.audio.playPowerup();
  
  switch(key) {
    case 'S': // SLOW BALLS
      balls.forEach(b => {
        b.speed = Math.max(BALL_SPEED_INIT * 0.75, b.speed - 1.0);
        const angle = Math.atan2(b.dx, -b.dy);
        b.dx = b.speed * Math.sin(angle);
        b.dy = -b.speed * Math.cos(angle);
      });
      break;

    case 'E': // EXPAND PADDLE
      paddle.laserActive = false;
      paddle.targetWidth = 140;
      break;

    case 'C': // CATCH BALL
      paddle.catchActive = true;
      break;

    case 'L': // LASER PADDLE
      paddle.targetWidth = 90;
      paddle.laserActive = true;
      paddle.catchActive = false;
      break;

    case 'D': // MULTIPLY / DIVIDE BALLS
      if (balls.length > 0) {
        const baseBall = balls[0];
        const b1 = new Ball(baseBall.x, baseBall.y);
        const b2 = new Ball(baseBall.x, baseBall.y);

        b1.speed = baseBall.speed;
        b2.speed = baseBall.speed;

        b1.dx = baseBall.dx * 0.7 - baseBall.dy * 0.5;
        b1.dy = baseBall.dy * 0.7 + baseBall.dx * 0.5;

        b2.dx = baseBall.dx * 0.7 + baseBall.dy * 0.5;
        b2.dy = baseBall.dy * 0.7 - baseBall.dx * 0.5;

        balls.push(b1);
        balls.push(b2);
      }
      break;

    case 'P': // EXTRA LIFE PLAYER
      if (lives < 5) {
        lives++;
        updateLivesHUD();
      }
      break;

    case 'B': // EXIT PORTAL BREAK
      window.audio.playVictory();
      if (currentLevel < totalLevels) {
        currentLevel++;
        loadLevel(currentLevel);
        resetBallPaddle();
      } else {
        gameState = STATES.VICTORY;
        victoryScoreSpan.textContent = String(score).padStart(8, '0');
        showOverlay(victoryMenu);
      }
      break;
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
      localStorage.setItem('brick_breaker_hiscore', highscore);
      highscoreVal.textContent = String(highscore).padStart(8, '0');
    }
  } else {
    resetBallPaddle();
  }
}

// --- Render / Draw Game Loop ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw Checked Blue Retro Background Pattern
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

  // 2. Draw Bricks
  bricks.forEach(b => b.draw());

  // 3. Draw Powerup Capsules
  capsules.forEach(c => c.draw());

  // 4. Draw Lasers
  lasers.forEach(l => l.draw());

  // 5. Draw Floating Enemies
  enemies.forEach(e => e.draw());

  // 6. Draw Particles
  particles.forEach(p => p.draw());

  // 7. Draw Paddle
  paddle.draw();

  // 8. Draw Balls
  balls.forEach(b => b.draw());

  // 9. Draw Pipes / Hatch Frame borders
  drawFrameBorders();
}

// --- Standard Score and UI HUD sync ---
function updateScoreHUD() {
  scoreVal.textContent = String(score).padStart(8, '0');
}

function updateLivesHUD() {
  livesDisplay.innerHTML = '';
  for (let i = 0; i < lives; i++) {
    const lifeDiv = document.createElement('div');
    lifeDiv.className = 'life-paddle';
    livesDisplay.appendChild(lifeDiv);
  }
}

// --- Main Menu Overlay Handlers ---
function showOverlay(menuToShow) {
  uiOverlay.classList.remove('hidden');
  startMenu.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  gameOverMenu.classList.add('hidden');
  victoryMenu.classList.add('hidden');

  menuToShow.classList.remove('hidden');
}

function hideOverlay() {
  uiOverlay.classList.add('hidden');
}

// --- Reset / Init New Game ---
function startNewGame(mode) {
  score = 0;
  lives = 3;
  currentLevel = 1;
  gameMode = mode;
  gameState = STATES.PLAYING;

  window.audio.resume();

  updateScoreHUD();
  updateLivesHUD();
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
      } else if (paddle.laserActive) {
        paddle.shoot();
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

// Touch controls for mobile compatibility
canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    handleMouseMove(e.touches[0].clientX);
  }
}, { passive: true });

// Mobile Virtual Trackbar moves paddle
const mobileTrack = document.getElementById('mobile-trackbar');
mobileTrack.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    handleMouseMove(e.touches[0].clientX);
  }
}, { passive: true });

// Launch Ball or Shoot Lasers on Left Click / Tap
window.addEventListener('mousedown', (e) => {
  if (e.target.closest('button') || e.target.closest('header') || e.target.closest('footer')) return;

  if (gameState === STATES.PLAYING) {
    if (paddle.caughtBalls.length > 0) {
      paddle.releaseBalls();
    } else if (paddle.laserActive) {
      paddle.shoot();
    }
  }
});

canvas.addEventListener('touchstart', (e) => {
  if (gameState === STATES.PLAYING) {
    if (paddle.caughtBalls.length > 0) {
      paddle.releaseBalls();
    } else if (paddle.laserActive) {
      paddle.shoot();
    }
  }
}, { passive: true });

// Button Click Event Hooks
document.getElementById('btn-classic').addEventListener('click', () => startNewGame('classic'));
document.getElementById('btn-random').addEventListener('click', () => startNewGame('random'));
document.getElementById('btn-resume').addEventListener('click', () => {
  gameState = STATES.PLAYING;
  window.audio.resume();
  hideOverlay();
});
document.getElementById('btn-retry').addEventListener('click', () => startNewGame(gameMode));
document.getElementById('btn-victory-retry').addEventListener('click', () => startNewGame(gameMode));

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
initBackgroundPattern();
initSpawnHatches();
resetBallPaddle();
showOverlay(startMenu);

// Start gameLoop
requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(gameLoop);
});
