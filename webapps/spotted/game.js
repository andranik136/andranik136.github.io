/**
 * Spotted - Main Game Controller and Engine
 * Protagonist: Cole Welps
 * Features:
 * - Full browser viewport canvas rendering
 * - Dedicated Start / Title Screen with Save/Load/Settings
 * - Cinematic Newspaper Prologue Cutscene
 * - Area 51 Infiltration & Dramatic FBI Takedown Climax ("BUSTED" Game Over)
 */

class SpottedGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    // Viewport scaling
    this.scale = 2.0; // zoom factor for chunky retro pixel art
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.handleResize();

    // Game Mode: 'title' | 'prologue' | 'world' | 'interior' | 'busted'
    this.gameState = 'title';
    this.mode = 'world';
    this.currentInterior = null;

    // Player State (Cole Welps)
    this.player = {
      x: 8.0,
      y: 15.0,
      savedWorldX: 8.0,
      savedWorldY: 15.0,
      dir: 'down',
      isMoving: false,
      isSprinting: false,
      speed: 4.2,
      sprintMultiplier: 1.6,
      animFrame: 0,
      animTimer: 0,
      wearFoil: false,
      bumpInvulnerableTimer: 0
    };

    // Traffic Cars & Particles
    this.cars = [];
    this.carSpawnTimer = 0;
    this.particles = [];

    // Camera
    this.camera = { x: 0, y: 0, shake: 0 };

    // Day/Night Cycle (0 to 1)
    this.timeOfDay = 0.72; // Spooky night!
    this.timeSpeed = 0.0015;

    // Input States
    this.keys = {};
    this.touchDir = { x: 0, y: 0 };
    this.interactiveTarget = null;

    // Dialogue State
    this.dialogue = {
      active: false,
      speaker: '',
      type: 'normal',
      voice: 'normal',
      lines: [],
      lineIdx: 0,
      displayedText: '',
      charIdx: 0,
      charTimer: 0,
      isTyping: false
    };

    // Screen Transition (Iris / Fade)
    this.transition = { active: false, alpha: 0, direction: 'in', callback: null };
    this.flashAlpha = 0;
    this.strobeColor = null;

    // Newspaper Prologue State
    this.prologue = {
      step: 0,
      textProgress: 0,
      timer: 0,
      pages: [
        {
          headline: "BIZARRE LIGHTS & LEVITATING CATTLE OVER OAKHAVEN!",
          subhead: "Government Claims 'Weather Balloon Experiment' — Residents Suspect Area 51 Sub-Bunker",
          body: [
            "My name is Cole Welps. Three days ago, I was an underpaid filing clerk living off lukewarm coffee.",
            "Then I saw this front-page headline in The Oakhaven Inquirer.",
            "Everyone else laughed it off as a hoax. But I've studied the declassified 1960s records for years.",
            "The coordinates, the harmonic frequencies... it's all converging on this sleepy town.",
            "Rumors say a hidden high-security installation is disguised right beneath Oakhaven.",
            "If I can track down a government insider and get Level-5 clearance, I will finally see the truth.",
            "I packed two cardboard boxes, spent my last savings on a midnight bus, and rented a cheap room in Sector [0, 0].",
            "Tonight, I see a live extraterrestrial... or lose my mind trying."
          ]
        }
      ]
    };

    // FBI Climax State
    this.climax = {
      active: false,
      step: 0,
      timer: 0,
      sirenActive: false,
      agentsSpotted: []
    };

    // Settings
    this.settings = {
      bgmVol: 0.5,
      sfxVol: 0.7,
      scanlines: true,
      textSpeed: 0.025
    };

    // Notifications queue
    this.notifications = [];
    this.lastTime = performance.now();

    // Event Listeners
    window.addEventListener('resize', () => this.handleResize());
    this.initInput();
    this.bindUiEvents();
    this.loadSettings();

    // Check if continuing or title
    this.checkAutoSaveAvailability();

    // Start Main Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  handleResize() {
    this.width = Math.max(320, window.innerWidth || (document.documentElement ? document.documentElement.clientWidth : 0) || 800);
    this.height = Math.max(240, window.innerHeight || (document.documentElement ? document.documentElement.clientHeight : 0) || 600);
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Dynamic pixel zoom scaling based on screen size
    if (this.width > 1200) {
      this.scale = 2.4;
    } else if (this.width > 700) {
      this.scale = 2.0;
    } else {
      this.scale = 1.6;
    }
  }

  // --- Input Initialization ---
  initInput() {
    window.addEventListener('keydown', (e) => {
      if (window.spottedAudio) window.spottedAudio.resume();

      const k = e.key.toLowerCase();
      this.keys[k] = true;
      this.keys[e.key] = true;
      if (e.code) {
        this.keys[e.code] = true;
        this.keys[e.code.toLowerCase()] = true;
      }

      // Prevent page scrolling on standard game controls
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(k)) {
        if (this.gameState === 'world' || this.gameState === 'interior' || this.gameState === 'prologue') {
          e.preventDefault();
        }
      }

      // Title Screen Key Handling
      if (this.gameState === 'title') {
        if (e.key === ' ' || e.key === 'Enter') {
          this.startNewGame();
        }
        return;
      }

      // Prologue Cutscene Key Handling (Space/Enter/E to advance, S or Escape to skip)
      if (this.gameState === 'prologue') {
        if (k === 's' || e.key === 'Escape') {
          const page = this.prologue.pages[0];
          this.prologue.step = page.body.length - 1;
          this.advancePrologue();
          e.preventDefault();
          return;
        }
        if (e.key === ' ' || e.key === 'Enter' || k === 'e') {
          this.advancePrologue();
          e.preventDefault();
        }
        return;
      }

      // Busted / Game Over Screen Key Handling
      if (this.gameState === 'busted') {
        if (e.key === ' ' || e.key === 'Enter') {
          this.returnToTitle();
        }
        return;
      }

      // Dialogue advancement
      if (this.dialogue.active) {
        if (e.key === ' ' || e.key === 'Enter' || k === 'e' || k === 'z') {
          this.advanceDialogue();
          e.preventDefault();
        }
        return;
      }

      // Interaction
      if (k === 'e' || e.key === ' ' || e.key === 'Enter' || k === 'z') {
        this.triggerInteraction();
        e.preventDefault();
      }

      // Evidence Board & Inventory
      if (k === 'tab' || k === 'i' || k === 'x') {
        this.toggleCorkboard();
        e.preventDefault();
      }

      // Polaroid Camera Snapshot
      if (k === 'c') {
        this.snapPhoto();
      }

      // Tin Foil Fedora
      if (k === 'f') {
        this.toggleFoilHat();
      }

      // Escape Menu / Settings
      if (e.key === 'Escape' || k === 'escape') {
        this.toggleSettingsModal();
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
      this.keys[e.key] = false;
      if (e.code) {
        this.keys[e.code] = false;
        this.keys[e.code.toLowerCase()] = false;
      }
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.touchDir = { x: 0, y: 0 };
    });

    // Tap or click on canvas advances prologue and dialogue
    this.canvas.addEventListener('pointerdown', () => {
      if (window.spottedAudio) window.spottedAudio.resume();

      if (this.gameState === 'prologue') {
        this.advancePrologue();
      } else if (this.dialogue.active) {
        this.advanceDialogue();
      }
    });

    this.initTouchControls();
  }

  initTouchControls() {
    const dpad = document.getElementById('touch-dpad');
    if (!dpad) return;

    const handleDpad = (e) => {
      const touch = e.touches[0];
      const rect = dpad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = touch.clientX - cx;
      const dy = touch.clientY - cy;

      const dist = Math.hypot(dx, dy);
      if (dist > 10) {
        const angle = Math.atan2(dy, dx);
        this.touchDir.x = Math.cos(angle);
        this.touchDir.y = Math.sin(angle);
      } else {
        this.touchDir.x = 0;
        this.touchDir.y = 0;
      }
    };

    dpad.addEventListener('touchstart', (e) => {
      if (window.spottedAudio) window.spottedAudio.resume();
      handleDpad(e);
      e.preventDefault();
    });
    dpad.addEventListener('touchmove', (e) => {
      handleDpad(e);
      e.preventDefault();
    });
    dpad.addEventListener('touchend', (e) => {
      this.touchDir.x = 0;
      this.touchDir.y = 0;
      e.preventDefault();
    });

    const btnA = document.getElementById('btn-touch-a');
    const btnB = document.getElementById('btn-touch-b');
    if (btnA) {
      btnA.addEventListener('touchstart', (e) => {
        if (window.spottedAudio) window.spottedAudio.resume();
        if (this.gameState === 'title') {
          this.startNewGame();
        } else if (this.gameState === 'prologue') {
          this.advancePrologue();
        } else if (this.gameState === 'busted') {
          this.returnToTitle();
        } else if (this.dialogue.active) {
          this.advanceDialogue();
        } else {
          this.triggerInteraction();
        }
        e.preventDefault();
      });
    }
    if (btnB) {
      btnB.addEventListener('touchstart', (e) => {
        this.player.isSprinting = true;
        e.preventDefault();
      });
      btnB.addEventListener('touchend', (e) => {
        this.player.isSprinting = false;
        e.preventDefault();
      });
    }
  }

  bindUiEvents() {
    // Start Screen Buttons
    const btnNewGame = document.getElementById('btn-start-new');
    const btnContinue = document.getElementById('btn-start-continue');
    const btnOpenSaveLoad = document.getElementById('btn-start-saveload');
    const btnOpenSettings = document.getElementById('btn-start-settings');

    if (btnNewGame) btnNewGame.addEventListener('click', () => this.startNewGame());
    if (btnContinue) btnContinue.addEventListener('click', () => this.continueGame());
    if (btnOpenSaveLoad) btnOpenSaveLoad.addEventListener('click', () => this.toggleSaveLoadModal(true));
    if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => this.toggleSettingsModal(true));

    // In-Game Top HUD Buttons
    const btnSound = document.getElementById('btn-toggle-sound');
    const btnMusic = document.getElementById('btn-toggle-music');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const on = window.spottedAudio.toggleSound();
        btnSound.textContent = on ? '🔊 SFX' : '🔇 SFX';
        btnSound.classList.toggle('active', on);
      });
    }
    if (btnMusic) {
      btnMusic.addEventListener('click', () => {
        const on = window.spottedAudio.toggleMusic();
        btnMusic.textContent = on ? '🎵 BGM' : '🔇 BGM';
        btnMusic.classList.toggle('active', on);
      });
    }

    const btnBoard = document.getElementById('btn-open-corkboard');
    if (btnBoard) btnBoard.addEventListener('click', () => this.toggleCorkboard());

    const btnCloseBoard = document.getElementById('btn-close-corkboard');
    if (btnCloseBoard) btnCloseBoard.addEventListener('click', () => this.toggleCorkboard(false));

    const btnSnap = document.getElementById('btn-snap-photo');
    if (btnSnap) btnSnap.addEventListener('click', () => this.snapPhoto());

    const btnHudSave = document.getElementById('btn-hud-save');
    if (btnHudSave) btnHudSave.addEventListener('click', () => this.toggleSaveLoadModal(true));

    // Save/Load Modal buttons
    document.querySelectorAll('.slot-save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = e.target.dataset.slot;
        this.saveToSlot(slot);
      });
    });
    document.querySelectorAll('.slot-load-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = e.target.dataset.slot;
        this.loadFromSlot(slot);
      });
    });

    const btnCloseSave = document.getElementById('btn-close-saveload');
    if (btnCloseSave) btnCloseSave.addEventListener('click', () => this.toggleSaveLoadModal(false));

    // Export/Import JSON
    const btnExport = document.getElementById('btn-export-save');
    const btnImport = document.getElementById('btn-import-save');
    const importFile = document.getElementById('import-save-file');

    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const data = localStorage.getItem('spotted_save_1') || localStorage.getItem('spotted_save');
        if (!data) {
          alert("No save data found yet!");
          return;
        }
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `spotted_save_welps_${Date.now()}.json`;
        a.click();
      });
    }
    if (btnImport && importFile) {
      btnImport.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            JSON.parse(event.target.result); // test parse
            localStorage.setItem('spotted_save', event.target.result);
            alert("Save file imported successfully! Resuming investigation...");
            this.continueGame();
          } catch (err) {
            alert("Invalid save file!");
          }
        };
        reader.readAsText(file);
      });
    }

    // Settings Modal
    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => this.toggleSettingsModal(false));

    const sliderBgm = document.getElementById('setting-bgm');
    const sliderSfx = document.getElementById('setting-sfx');
    const toggleScanlines = document.getElementById('setting-scanlines');

    if (sliderBgm) {
      sliderBgm.addEventListener('input', (e) => {
        this.settings.bgmVol = parseFloat(e.target.value);
        window.spottedAudio.setVolume(this.settings.sfxVol, this.settings.bgmVol);
        this.saveSettings();
      });
    }
    if (sliderSfx) {
      sliderSfx.addEventListener('input', (e) => {
        this.settings.sfxVol = parseFloat(e.target.value);
        window.spottedAudio.setVolume(this.settings.sfxVol, this.settings.bgmVol);
        this.saveSettings();
      });
    }
    if (toggleScanlines) {
      toggleScanlines.addEventListener('change', (e) => {
        this.settings.scanlines = e.target.checked;
        const scanlinesDiv = document.querySelector('.scanlines');
        if (scanlinesDiv) scanlinesDiv.style.display = this.settings.scanlines ? 'block' : 'none';
        this.saveSettings();
      });
    }

    // Busted Screen buttons
    const btnRestartBusted = document.getElementById('btn-busted-restart');
    const btnLoadBusted = document.getElementById('btn-busted-load');
    if (btnRestartBusted) btnRestartBusted.addEventListener('click', () => this.returnToTitle());
    if (btnLoadBusted) btnLoadBusted.addEventListener('click', () => {
      document.getElementById('busted-screen-modal').classList.add('hidden');
      this.continueGame();
    });
  }

  checkAutoSaveAvailability() {
    const raw = localStorage.getItem('spotted_save') || localStorage.getItem('spotted_save_1');
    const btnContinue = document.getElementById('btn-start-continue');
    if (btnContinue) {
      btnContinue.disabled = !raw;
      btnContinue.classList.toggle('disabled', !raw);
    }
  }

  // --- Title Screen & Game Launchers ---
  startNewGame() {
    if (window.spottedAudio) {
      window.spottedAudio.playSelect();
      window.spottedAudio.startMusic('mystery');
    }
    document.getElementById('start-screen-overlay').classList.add('hidden');
    this.gameState = 'prologue';
    this.prologue.step = 0;
    this.prologue.textProgress = 0;
  }

  continueGame() {
    this.loadSave();
    this.resolveStuckPlayer();
    this.camera.x = this.player.x * 32 - (this.width / (2 * this.scale));
    this.camera.y = this.player.y * 32 - (this.height / (2 * this.scale));
    if (window.spottedAudio) {
      window.spottedAudio.playSelect();
      window.spottedAudio.startMusic(this.isNight() ? 'night' : 'mystery');
    }
    document.getElementById('start-screen-overlay').classList.add('hidden');
    document.getElementById('saveload-modal').classList.add('hidden');
    this.gameState = 'world';
    document.querySelector('.game-hud').classList.remove('hidden');
    document.querySelector('.quest-tracker-card').classList.remove('hidden');
  }

  advancePrologue() {
    const page = this.prologue.pages[0];
    if (this.prologue.step < page.body.length - 1) {
      this.prologue.step++;
      if (window.spottedAudio) window.spottedAudio.playTalk('typewriter');
    } else {
      // Arrived in Oakhaven!
      this.gameState = 'world';
      this.player.x = 8.0;
      this.player.y = 15.0;
      this.resolveStuckPlayer();
      this.camera.x = this.player.x * 32 - (this.width / (2 * this.scale));
      this.camera.y = this.player.y * 32 - (this.height / (2 * this.scale));
      document.querySelector('.game-hud').classList.remove('hidden');
      document.querySelector('.quest-tracker-card').classList.remove('hidden');
      this.showNotification("Cole Welps arrived at Oakhaven Sector [0, 0]!");
      if (window.spottedAudio) window.spottedAudio.playQuestAccepted();
    }
  }

  returnToTitle() {
    document.getElementById('busted-screen-modal').classList.add('hidden');
    document.getElementById('start-screen-overlay').classList.remove('hidden');
    document.querySelector('.game-hud').classList.add('hidden');
    document.querySelector('.quest-tracker-card').classList.add('hidden');
    this.gameState = 'title';
    this.climax.active = false;
    this.strobeColor = null;
    this.checkAutoSaveAvailability();
  }

  // --- Main Loop ---
  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  // --- Logic Updates ---
  update(dt) {
    if (this.gameState === 'title') {
      return;
    }

    if (this.gameState === 'prologue') {
      return;
    }

    if (this.gameState === 'busted') {
      return;
    }

    // Main Gameplay State: 'world' | 'interior'
    this.timeOfDay = (this.timeOfDay + this.timeSpeed * dt) % 1.0;
    this.updateTimeHud();

    // Invulnerability & Camera Shake Decay
    if (this.player.bumpInvulnerableTimer > 0) {
      this.player.bumpInvulnerableTimer = Math.max(0, this.player.bumpInvulnerableTimer - dt);
    }
    if (this.camera.shake > 0) {
      this.camera.shake = Math.max(0, this.camera.shake - dt * 2.5);
    }

    // Particles Simulation
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.timer -= dt;
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      if (p.timer <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Traffic Cars Simulation (Exterior roads only)
    if (this.mode === 'world') {
      this.updateTraffic(dt);
      this.checkCarCollisions();
    }

    // FBI Climax Sequence In Area 51
    if (this.climax.active) {
      this.updateClimaxSequence(dt);
      return;
    }

    // Screen Transition
    if (this.transition.active) {
      if (this.transition.direction === 'in') {
        this.transition.alpha += dt * 3.5;
        if (this.transition.alpha >= 1) {
          this.transition.alpha = 1;
          if (this.transition.callback) {
            this.transition.callback();
            this.transition.callback = null;
          }
          this.transition.direction = 'out';
        }
      } else {
        this.transition.alpha -= dt * 3.5;
        if (this.transition.alpha <= 0) {
          this.transition.alpha = 0;
          this.transition.active = false;
        }
      }
      return;
    }

    // Camera Flash Decay
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
    }

    // Dialogue Typewriter
    if (this.dialogue.active && this.dialogue.isTyping) {
      this.dialogue.charTimer += dt;
      if (this.dialogue.charTimer >= this.settings.textSpeed) {
        this.dialogue.charTimer = 0;
        const currentLine = this.dialogue.lines[this.dialogue.lineIdx];
        if (this.dialogue.charIdx < currentLine.length) {
          this.dialogue.charIdx++;
          this.dialogue.displayedText = currentLine.substring(0, this.dialogue.charIdx);
          if (this.dialogue.charIdx % 2 === 0 && window.spottedAudio) {
            window.spottedAudio.playTalk(this.dialogue.voice);
          }
        } else {
          this.dialogue.isTyping = false;
        }
      }
      return;
    }

    this.updatePlayerMovement(dt);
    this.updateInteractiveTarget();

    // Camera Lerp
    const T = 32 * this.scale;
    const targetCamX = this.player.x * 32 - (this.width / (2 * this.scale));
    const targetCamY = this.player.y * 32 - (this.height / (2 * this.scale));
    this.camera.x += (targetCamX - this.camera.x) * 10 * dt;
    this.camera.y += (targetCamY - this.camera.y) * 10 * dt;

    this.updateEmfProximity();

    // Periodic Autosave (Quietly every 30 seconds)
    if (!this.saveTimer) this.saveTimer = 0;
    this.saveTimer += dt;
    if (this.saveTimer >= 30) {
      this.saveTimer = 0;
      this.autoSaveQuietly();
    }
  }

  // --- Traffic Simulation (Cars coming and going) ---
  updateTraffic(dt) {
    this.carSpawnTimer += dt;

    // Spawn a new car every ~2.0 seconds if car count < 8
    if (this.carSpawnTimer >= 2.0 && this.cars.length < 8) {
      this.carSpawnTimer = 0;
      this.spawnCarNearPlayer();
    }

    // Update car positions and honk warnings
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      car.x += car.vx * dt;
      car.y += car.vy * dt;

      if (car.honkCooldown > 0) {
        car.honkCooldown -= dt;
      }

      // Check if player is standing directly in front of this car on the road!
      const distToPlayer = Math.hypot(this.player.x - car.x, this.player.y - car.y);
      if (distToPlayer < 5.0 && (!car.honkCooldown || car.honkCooldown <= 0)) {
        let headingTowards = false;
        if (car.dir === 'right' && this.player.x > car.x && Math.abs(this.player.y - car.y) < 1.0) headingTowards = true;
        if (car.dir === 'left' && this.player.x < car.x && Math.abs(this.player.y - car.y) < 1.0) headingTowards = true;
        if (car.dir === 'down' && this.player.y > car.y && Math.abs(this.player.x - car.x) < 1.0) headingTowards = true;
        if (car.dir === 'up' && this.player.y < car.y && Math.abs(this.player.x - car.x) < 1.0) headingTowards = true;

        if (headingTowards) {
          if (window.spottedAudio) window.spottedAudio.playHonk();
          car.honkCooldown = 4.0;
        }
      }

      // Despawn car if it has driven far out of player's sector range
      if (distToPlayer > 42) {
        this.cars.splice(i, 1);
      }
    }
  }

  spawnCarNearPlayer() {
    const pChunkX = Math.floor(this.player.x / 24);
    const pChunkY = Math.floor(this.player.y / 24);

    const isHorizontal = Math.random() < 0.5;
    const colors = ['red', 'blue', 'yellow', 'black'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    let startX = 0;
    let startY = 0;
    let vx = 0;
    let vy = 0;
    let dir = 'right';

    if (isHorizontal) {
      const cy = pChunkY + Math.floor(Math.random() * 3) - 1;
      const useUpperRoad = Math.random() < 0.5;
      const roadBaseY = cy * 24 + (useUpperRoad ? 0 : 20);

      const goEast = Math.random() < 0.5;
      if (useUpperRoad) {
        // Upper road: curb parking sits on row 3; moving cars use rows 0.5 and 1.8
        if (goEast) {
          dir = 'right';
          startY = roadBaseY + 1.8;
          startX = this.player.x - 22 - Math.random() * 6;
          vx = 5.2 + Math.random() * 2.2;
          vy = 0;
        } else {
          dir = 'left';
          startY = roadBaseY + 0.5;
          startX = this.player.x + 22 + Math.random() * 6;
          vx = -(5.2 + Math.random() * 2.2);
          vy = 0;
        }
      } else {
        // Lower road: curb parking sits on row 20; moving cars use rows 21.4 and 22.5
        if (goEast) {
          dir = 'right';
          startY = roadBaseY + 2.5;
          startX = this.player.x - 22 - Math.random() * 6;
          vx = 5.2 + Math.random() * 2.2;
          vy = 0;
        } else {
          dir = 'left';
          startY = roadBaseY + 1.4;
          startX = this.player.x + 22 + Math.random() * 6;
          vx = -(5.2 + Math.random() * 2.2);
          vy = 0;
        }
      }
    } else {
      const cx = pChunkX + Math.floor(Math.random() * 3) - 1;
      const useLeftRoad = Math.random() < 0.5;
      const roadBaseX = cx * 24 + (useLeftRoad ? 0 : 20);

      const goSouth = Math.random() < 0.5;
      if (useLeftRoad) {
        // Left road: curb parking sits on col 3; moving cars use cols 0.5 and 1.8
        if (goSouth) {
          dir = 'down';
          startX = roadBaseX + 1.8;
          startY = this.player.y - 18 - Math.random() * 6;
          vx = 0;
          vy = 5.2 + Math.random() * 2.2;
        } else {
          dir = 'up';
          startX = roadBaseX + 0.5;
          startY = this.player.y + 18 + Math.random() * 6;
          vx = 0;
          vy = -(5.2 + Math.random() * 2.2);
        }
      } else {
        // Right road: curb parking sits on col 20; moving cars use cols 21.4 and 22.5
        if (goSouth) {
          dir = 'down';
          startX = roadBaseX + 2.5;
          startY = this.player.y - 18 - Math.random() * 6;
          vx = 0;
          vy = 5.2 + Math.random() * 2.2;
        } else {
          dir = 'up';
          startX = roadBaseX + 1.4;
          startY = this.player.y + 18 + Math.random() * 6;
          vx = 0;
          vy = -(5.2 + Math.random() * 2.2);
        }
      }
    }

    // Avoid spawning directly on top of an existing car
    for (const car of this.cars) {
      if (Math.hypot(car.x - startX, car.y - startY) < 6.0) {
        return;
      }
    }

    this.cars.push({
      x: startX,
      y: startY,
      vx: vx,
      vy: vy,
      dir: dir,
      color: color,
      honkCooldown: 0
    });
  }

  // --- Car Collision & Comic Bump (No HP, just bumps Cole out of the road) ---
  checkCarCollisions() {
    if (this.player.bumpInvulnerableTimer > 0) return;

    const px = this.player.x + 0.5;
    const py = this.player.y + 0.6;

    for (const car of this.cars) {
      const isH = (car.dir === 'left' || car.dir === 'right');
      const halfW = isH ? 0.75 : 0.44;
      const halfH = isH ? 0.44 : 0.75;

      const dx = Math.abs(px - car.x);
      const dy = Math.abs(py - car.y);

      // Overlap with car's bounding box
      if (dx < (halfW + 0.35) && dy < (halfH + 0.35)) {
        if (window.spottedAudio) {
          window.spottedAudio.playHonk();
          window.spottedAudio.playBump();
        }

        this.camera.shake = 0.6;
        this.player.bumpInvulnerableTimer = 1.3;

        // Knock Cole in car travel direction + snap onto nearest sidewalk curb
        if (isH) {
          this.player.x += (car.vx > 0 ? 1.8 : -1.8);
          const modY = ((this.player.y % 24) + 24) % 24;
          if (modY < 4) {
            this.player.y = Math.floor(this.player.y / 24) * 24 + 4.2;
          } else if (modY >= 20) {
            this.player.y = Math.floor(this.player.y / 24) * 24 + 19.6;
          }
          this.player.dir = (car.vx > 0 ? 'right' : 'left');
        } else {
          this.player.y += (car.vy > 0 ? 1.8 : -1.8);
          const modX = ((this.player.x % 24) + 24) % 24;
          if (modX < 4) {
            this.player.x = Math.floor(this.player.x / 24) * 24 + 4.2;
          } else if (modX >= 20) {
            this.player.x = Math.floor(this.player.x / 24) * 24 + 19.6;
          }
          this.player.dir = (car.vy > 0 ? 'down' : 'up');
        }

        // Spawn comic dust clouds
        for (let k = 0; k < 3; k++) {
          this.particles.push({
            type: 'dust',
            x: this.player.x + (Math.random() - 0.5) * 0.6,
            y: this.player.y + (Math.random() - 0.5) * 0.6,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.4,
            timer: 0.65,
            maxTimer: 0.65,
            scale: 0.8 + Math.random() * 0.4
          });
        }

        // Display humorous driver road rage shout
        const driverShouts = [
          "🚗 *HONK HONK!* 'HEY! I'M DRIVIN' HERE! GET ON THE SIDEWALK!'",
          "🚗 *SCREEECH!* 'Watch the trenchcoat, pal! Asphalt ain't a walking trail!'",
          "🚗 *HONK!* 'Yield to oncoming traffic, fedora boy!'",
          "🚗 *HONK HONK!* 'Go jaywalk in Roswell! This is a 35 MPH street!'",
          "🚗 *BEEP!* 'Did you buy that magnifying glass instead of eyeglasses?!'",
          "🚗 *HONK!* 'Alien conspiracy or not, you just dented my bumper!'"
        ];
        const shout = driverShouts[Math.floor(Math.random() * driverShouts.length)];
        this.showNotification(shout);

        break;
      }
    }
  }

  // --- FBI Climax: Live Alien Encounter & Takedown ---
  triggerAlienBustedClimax() {
    this.climax.active = true;
    this.climax.step = 1;
    this.climax.timer = 0;
    if (window.spottedAudio) {
      window.spottedAudio.playItemGet();
      window.spottedAudio.setTheme('danger');
    }
  }

  updateClimaxSequence(dt) {
    this.climax.timer += dt;

    // Step 1: Cole stares at the live alien in awe (3 seconds)
    if (this.climax.step === 1) {
      if (this.climax.timer > 2.5) {
        this.climax.step = 2;
        this.climax.timer = 0;
        if (window.spottedAudio) {
          window.spottedAudio.playSiren();
          window.spottedAudio.playImpact();
        }
        this.showNotification("⚠️ RED ALERT! SECURITY BREACH DETECTED!");
      }
    }
    // Step 2: Emergency Klaxons & Police Strobes (3 seconds)
    else if (this.climax.step === 2) {
      // Alternate red and blue strobe lights
      this.strobeColor = (Math.floor(this.climax.timer * 8) % 2 === 0) ? 'rgba(239, 68, 68, 0.45)' : 'rgba(59, 130, 246, 0.45)';

      if (this.climax.timer > 3.0) {
        this.climax.step = 3;
        this.climax.timer = 0;
        // 4 Federal Agents kick down the doors
        if (window.spottedAudio) window.spottedAudio.playImpact();
        this.startDialogue({
          speaker: "FBI Special Agent",
          type: "fbi_agent",
          voice: "agent",
          lines: [
            "FBI! FREEZE! DROP THE MAGNIFYING GLASS AND PUT YOUR HANDS WHERE WE CAN SEE THEM!",
            "Cole Welps! You've poked your nose where it doesn't belong! You've seen too much!",
            "Tackle him! Confiscate his camera! Wipe his memory with the neuralizer!"
          ]
        });
      }
    }
    // Step 3: Dialogue finishes -> FLASHBANG TAKEDOWN!
    else if (this.climax.step === 3) {
      this.strobeColor = (Math.floor(this.climax.timer * 8) % 2 === 0) ? 'rgba(239, 68, 68, 0.45)' : 'rgba(59, 130, 246, 0.45)';

      if (!this.dialogue.active) {
        this.climax.step = 4;
        this.climax.timer = 0;
        this.flashAlpha = 1.0;
        if (window.spottedAudio) {
          window.spottedAudio.playImpact();
          window.spottedAudio.stopMusic();
        }
      }
    }
    // Step 4: Show the BUSTED Game Over Screen!
    else if (this.climax.step === 4) {
      if (this.climax.timer > 1.2) {
        this.gameState = 'busted';
        this.climax.active = false;
        this.strobeColor = null;
        document.getElementById('busted-screen-modal').classList.remove('hidden');
        document.querySelector('.game-hud').classList.add('hidden');
        document.querySelector('.quest-tracker-card').classList.add('hidden');

        // Update Busted Screen Stats
        const statXp = document.getElementById('stat-xp');
        const statLevel = document.getElementById('stat-level');
        const statEvidence = document.getElementById('stat-evidence');
        if (statXp) statXp.textContent = `${window.spottedQuests.xp} XP`;
        if (statLevel) statLevel.textContent = `Level ${window.spottedQuests.level} (${window.spottedQuests.title})`;
        if (statEvidence) statEvidence.textContent = `${window.spottedQuests.evidenceBoard.length} Classified Clues`;
      }
    }
  }

  // --- Player Physics & Collision ---
  resolveStuckPlayer() {
    if (!this.checkCollision(this.player.x, this.player.y)) return;
    const offsets = [
      [0, 0.4], [0, -0.4], [-0.4, 0], [0.4, 0],
      [0, 0.8], [0, -0.8], [-0.8, 0], [0.8, 0],
      [-0.8, 0.8], [0.8, 0.8], [-0.8, -0.8], [0.8, -0.8],
      [0, 1.4], [0, -1.4], [-1.4, 0], [1.4, 0]
    ];
    for (const [ox, oy] of offsets) {
      if (!this.checkCollision(this.player.x + ox, this.player.y + oy)) {
        this.player.x += ox;
        this.player.y += oy;
        return;
      }
    }
  }

  updatePlayerMovement(dt) {
    if (this.dialogue.active) return;

    // Safety unstuck: If player is ever inside a solid obstacle, gently nudge to safety
    if (this.checkCollision(this.player.x, this.player.y)) {
      this.resolveStuckPlayer();
    }

    let moveX = 0;
    let moveY = 0;

    const left = this.keys['arrowleft'] || this.keys['a'] || this.keys['keya'] || this.keys['ArrowLeft'];
    const right = this.keys['arrowright'] || this.keys['d'] || this.keys['keyd'] || this.keys['ArrowRight'];
    const up = this.keys['arrowup'] || this.keys['w'] || this.keys['keyw'] || this.keys['ArrowUp'];
    const down = this.keys['arrowdown'] || this.keys['s'] || this.keys['keys'] || this.keys['ArrowDown'];

    if (left) moveX -= 1;
    if (right) moveX += 1;
    if (up) moveY -= 1;
    if (down) moveY += 1;

    if (this.touchDir.x !== 0 || this.touchDir.y !== 0) {
      moveX += this.touchDir.x;
      moveY += this.touchDir.y;
    }

    const isSprint = this.keys['shift'] || this.keys['shiftleft'] || this.keys['shiftright'] || this.player.isSprinting;
    const currentSpeed = this.player.speed * (isSprint ? this.player.sprintMultiplier : 1.0);

    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX /= len;
      moveY /= len;

      if (Math.abs(moveX) > Math.abs(moveY)) {
        this.player.dir = moveX > 0 ? 'right' : 'left';
      } else {
        this.player.dir = moveY > 0 ? 'down' : 'up';
      }

      const dx = moveX * currentSpeed * dt;
      const dy = moveY * currentSpeed * dt;

      if (!this.checkCollision(this.player.x + dx, this.player.y)) {
        this.player.x += dx;
      }
      if (!this.checkCollision(this.player.x, this.player.y + dy)) {
        this.player.y += dy;
      }

      this.player.isMoving = true;
      this.player.animTimer += dt * (isSprint ? 12 : 8);
      if (this.player.animTimer >= 1) {
        this.player.animTimer = 0;
        this.player.animFrame = (this.player.animFrame + 1) % 4;

        if (this.player.animFrame === 1 || this.player.animFrame === 3) {
          if (window.spottedAudio) window.spottedAudio.playFootstep();
        }
      }
    } else {
      this.player.isMoving = false;
      this.player.animFrame = 0;
      this.player.animTimer = 0;
    }
  }

  checkCollision(x, y) {
    // Top-down RPG collision: applies strictly to character feet / lower body
    const paddingX = 0.22;
    const top = y + 0.52;
    const bottom = y + 0.92;
    const left = x - paddingX + 0.5;
    const right = x + paddingX + 0.5;

    const corners = [
      { cx: left, cy: top },
      { cx: right, cy: top },
      { cx: left, cy: bottom },
      { cx: right, cy: bottom }
    ];

    if (this.mode === 'interior') {
      const room = this.currentInterior;
      for (const p of corners) {
        const tx = Math.floor(p.cx);
        const ty = Math.floor(p.cy);
        if (tx < 0 || tx >= room.width || ty < 0 || ty >= room.height) return true;
        if (room.solid[ty] && room.solid[ty][tx]) return true;
      }
      return false;
    } else {
      for (const p of corners) {
        const tx = Math.floor(p.cx);
        const ty = Math.floor(p.cy);
        const { cx, cy } = window.spottedWorld.getChunkCoords(tx, ty);
        const chunk = window.spottedWorld.getChunk(cx, cy);

        const S = window.spottedWorld.chunkSize;
        const lx = ((tx % S) + S) % S;
        const ly = ((ty % S) + S) % S;

        if (chunk.solid[ly] && chunk.solid[ly][lx]) {
          return true;
        }
      }
      return false;
    }
  }

  // --- Interaction Scanning ---
  updateInteractiveTarget() {
    this.interactiveTarget = null;
    const reach = 1.1;

    let frontX = this.player.x + 0.5;
    let frontY = this.player.y + 0.7;
    if (this.player.dir === 'up') frontY -= reach;
    else if (this.player.dir === 'down') frontY += reach;
    else if (this.player.dir === 'left') frontX -= reach;
    else if (this.player.dir === 'right') frontX += reach;

    if (this.mode === 'interior') {
      const room = this.currentInterior;
      for (const npc of room.npcs) {
        const dist = Math.hypot(this.player.x + 0.5 - (npc.tx + 0.5), this.player.y + 0.5 - (npc.ty + 0.5));
        if (dist < 1.4) {
          this.interactiveTarget = { type: 'talk', target: npc, prompt: `Talk to ${npc.name}` };
          return;
        }
      }
      for (const item of room.interactables) {
        const dist = Math.hypot(frontX - (item.tx + 0.5), frontY - (item.ty + 0.5));
        if (dist < 1.3) {
          this.interactiveTarget = { type: item.type, target: item, prompt: item.prompt };
          return;
        }
      }
    } else {
      const { cx, cy } = window.spottedWorld.getChunkCoords(Math.floor(this.player.x), Math.floor(this.player.y));
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const chunk = window.spottedWorld.getChunk(cx + ox, cy + oy);
          for (const npc of chunk.npcs) {
            const dist = Math.hypot(this.player.x + 0.5 - (npc.tx + 0.5), this.player.y + 0.5 - (npc.ty + 0.5));
            if (dist < 1.4) {
              this.interactiveTarget = { type: 'talk', target: npc, prompt: `Talk to ${npc.name}` };
              return;
            }
          }
          for (const item of chunk.interactables) {
            const dist = Math.hypot(frontX - (item.tx + 0.5), frontY - (item.ty + 0.5));
            if (dist < 1.3) {
              this.interactiveTarget = { type: item.type, target: item, prompt: item.prompt };
              return;
            }
          }
        }
      }
    }
  }

  triggerInteraction() {
    if (!this.interactiveTarget) return;
    const { type, target } = this.interactiveTarget;

    if (type === 'door' && target.building) {
      if (target.building.type === 'area51' && !window.spottedQuests.hasItem('keycard')) {
        this.startDialogue(window.spottedQuests.getDialogue('door_locked_area51'));
        return;
      }
      this.enterBuilding(target.building);
      return;
    }

    if (type === 'exit_door') {
      this.exitBuilding();
      return;
    }

    const dialogueKey = window.spottedQuests.handleInteraction(type, target);
    if (dialogueKey) {
      const diagData = window.spottedQuests.getDialogue(dialogueKey, target);
      this.startDialogue(diagData);
      return;
    }

    if (type === 'talk') {
      // NPC turns to face Cole Welps (authentic Pokémon interaction)
      const dx = this.player.x - target.tx;
      const dy = this.player.y - target.ty;
      if (Math.abs(dx) > Math.abs(dy)) {
        target.dir = dx > 0 ? 'right' : 'left';
      } else {
        target.dir = dy > 0 ? 'down' : 'up';
      }

      if (target.isRude) {
        if (window.spottedAudio) window.spottedAudio.playGrunt();
        this.particles.push({
          type: 'angry',
          x: target.tx + 0.35,
          y: target.ty - 0.6,
          vx: 0,
          vy: -0.5,
          timer: 1.4,
          maxTimer: 1.4
        });
      }
      const diagData = window.spottedQuests.getDialogue(target.dialogueKey, target);
      this.startDialogue(diagData);
      return;
    }

    if (type === 'trash_can') {
      if (window.spottedAudio) window.spottedAudio.playRummage();
      const lootRoll = Math.random();
      if (lootRoll < 0.4) {
        window.spottedQuests.addXp(20, "Scrap Salvage");
        this.showNotification("Found a scrap of aluminum foil & +20 XP!");
      } else {
        window.spottedQuests.addXp(10, "Rummaged Bin");
        this.showNotification("Just crumpled burger wrappers... +10 XP!");
      }
      return;
    }

    if (type === 'vending_machine') {
      if (window.spottedAudio) window.spottedAudio.playItemGet();
      window.spottedQuests.addXp(15, "Slime-Cola Refreshed");
      this.showNotification("🥤 *CLUNK!* Purchased an ice-cold Slime-Cola! (+15 XP & sprint refreshed!)");
      return;
    }

    if (type === 'jukebox') {
      if (window.spottedAudio) {
        window.spottedAudio.playItemGet();
        window.spottedAudio.startMusic('interior');
      }
      this.showNotification("Jukebox plays cosmic frequencies!");
      return;
    }

    if (type === 'newspaper') {
      const headlines = [
        "MAYOR DENIES WEATHER BALLOON INVASION: 'THEY ARE SIMPLY WEATHER-CONSCIOUS BALLOONS!'",
        "COW RECITING FRENCH POETRY IN LAWN REPORTED BY TOURISTS",
        "TIN FOIL SALES SURGE 4,000% IN OAKHAVEN SECTORS",
        "SUSPICIOUS MAN IN TRENCHCOAT ASKS TOO MANY QUESTIONS IN SECTOR [1, 1]"
      ];
      const hl = headlines[Math.floor(Math.random() * headlines.length)];
      this.startDialogue({
        speaker: "The Oakhaven Inquirer",
        type: "newspaper",
        voice: "normal",
        lines: [hl]
      });
      return;
    }

    if (type === 'car') {
      if (window.spottedAudio) window.spottedAudio.playNoiseClick();
      const desc = target.carDesc || "A parked vehicle along the Oakhaven curb.";
      this.startDialogue({
        speaker: "Vehicle Inspection",
        type: "player",
        voice: "normal",
        lines: [
          desc,
          "You jot down the license plate and tire tread pattern in your investigator notebook. (+10 XP)"
        ]
      });
      window.spottedQuests.addXp(10, "Car Inspected");
      return;
    }

    if (type === 'arcade') {
      if (window.spottedAudio) {
        window.spottedAudio.playSynthNote(523, 0.08);
        setTimeout(() => window.spottedAudio && window.spottedAudio.playSynthNote(659, 0.08), 80);
        setTimeout(() => window.spottedAudio && window.spottedAudio.playSynthNote(784, 0.14), 160);
      }
      window.spottedQuests.addXp(15, "Arcade Champion");
      this.showNotification("👾 *PEW PEW!* New High Score on 'Alien Invaders 1984'! (+15 XP)");
      return;
    }

    if (type === 'water_cooler') {
      if (window.spottedAudio) window.spottedAudio.playItemGet();
      window.spottedQuests.addXp(10, "Hydrated");
      this.showNotification("💧 *Glug glug...* Crisp, chilled water! Sprint refreshed! (+10 XP)");
      return;
    }

    if (type === 'tv') {
      if (window.spottedAudio) window.spottedAudio.playNoiseClick();
      this.startDialogue({
        speaker: "CRT Television",
        type: "player",
        voice: "normal",
        lines: [
          "White noise hisses across the screen. Hidden beneath the fuzz, an ethereal synthesizer chord loops repeatedly.",
          "Could this be the frequency broadcast Mrs. Gable was warning everyone about?"
        ]
      });
      return;
    }

    if (type === 'bookshelf') {
      if (window.spottedAudio) window.spottedAudio.playSelect();
      const titles = [
        "'101 Uses for Weather Balloons in Disguise' by Dr. I. N. Denial",
        "'Crop Circles: Geometry of the Cosmos or Pranksters with Planks?'",
        "'They Walk Among Us (And They Work in Municipal HR)'",
        "'Tin Foil Millinery: Fashion Meets Microwave Defense'",
        "'The Bermuda Triangle of Oakhaven: Why Keys Always Vanish'"
      ];
      const picked = titles[Math.floor(Math.random() * titles.length)];
      window.spottedQuests.addXp(10, "Paranormal Research");
      this.startDialogue({
        speaker: "Bookshelf Collection",
        type: "player",
        voice: "normal",
        lines: [
          `You browse the collection and find: ${picked}.`,
          "You skim a chapter and jot down notes in your dossier. (+10 XP)"
        ]
      });
      return;
    }

    if (type === 'filing_cabinet') {
      if (window.spottedAudio) window.spottedAudio.playRummage();
      this.startDialogue({
        speaker: "Government Filing Cabinet",
        type: "player",
        voice: "normal",
        lines: [
          "Drawers filled with requisitions for 0.7mm mechanical pencils, cafeteria lunch schedules, and blacked-out memos."
        ]
      });
      return;
    }

    if (type === 'alien_pod') {
      this.triggerAlienBustedClimax();
      return;
    }
  }

  // --- Door Transitions ---
  enterBuilding(building) {
    if (this.transition.active) return;
    if (window.spottedAudio) {
      window.spottedAudio.playDoor();
      window.spottedAudio.setTheme(building.type === 'area51' ? 'danger' : 'interior');
    }

    this.transition.active = true;
    this.transition.direction = 'in';
    this.transition.callback = () => {
      this.player.savedWorldX = this.player.x;
      this.player.savedWorldY = this.player.y;
      this.mode = 'interior';
      this.currentInterior = window.spottedWorld.getInterior(building);
      this.player.x = this.currentInterior.spawnX;
      this.player.y = this.currentInterior.spawnY;
      this.player.dir = 'up';
      this.showNotification(`Entered: ${building.name}`);
    };
  }

  exitBuilding() {
    if (this.transition.active) return;
    if (window.spottedAudio) {
      window.spottedAudio.playDoor();
      window.spottedAudio.setTheme(this.isNight() ? 'night' : 'mystery');
    }

    this.transition.active = true;
    this.transition.direction = 'in';
    this.transition.callback = () => {
      this.mode = 'world';
      this.currentInterior = null;
      this.player.x = this.player.savedWorldX;
      this.player.y = this.player.savedWorldY + 0.6;
      this.player.dir = 'down';
    };
  }

  // --- Dialogue Engine ---
  startDialogue(data) {
    this.dialogue.active = true;
    this.dialogue.speaker = data.speaker;
    this.dialogue.type = data.type || 'normal';
    this.dialogue.voice = data.voice || 'normal';
    this.dialogue.lines = data.lines || [];
    this.dialogue.lineIdx = 0;
    this.dialogue.charIdx = 0;
    this.dialogue.charTimer = 0;
    this.dialogue.displayedText = '';
    this.dialogue.isTyping = true;
  }

  advanceDialogue() {
    if (!this.dialogue.active) return;

    if (this.dialogue.isTyping) {
      this.dialogue.isTyping = false;
      this.dialogue.displayedText = this.dialogue.lines[this.dialogue.lineIdx];
      this.dialogue.charIdx = this.dialogue.displayedText.length;
      return;
    }

    if (this.dialogue.lineIdx < this.dialogue.lines.length - 1) {
      this.dialogue.lineIdx++;
      this.dialogue.charIdx = 0;
      this.dialogue.displayedText = '';
      this.dialogue.isTyping = true;
      if (window.spottedAudio) window.spottedAudio.playSelect();
    } else {
      this.dialogue.active = false;
      if (window.spottedAudio) window.spottedAudio.playCancel();
    }
  }

  snapPhoto() {
    if (!window.spottedQuests.hasItem('camera')) {
      this.showNotification("Find the Polaroid Camera in Case #2!");
      return;
    }

    this.flashAlpha = 1.0;
    if (window.spottedAudio) window.spottedAudio.playCameraShutter();

    const { cx, cy } = window.spottedWorld.getChunkCoords(Math.floor(this.player.x), Math.floor(this.player.y));
    window.spottedQuests.addXp(50, "Investigation Photo");
    this.showNotification("Snapshot logged to Evidence Corkboard!");

    window.spottedQuests.addEvidence({
      id: `photo_snap_${Date.now()}`,
      title: `Surveillance Snapshot [Sector ${cx}, ${cy}]`,
      type: 'photo',
      desc: `High-contrast snapshot taken at coordinate (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}). An anomalous light artifact appears in the upper quadrant!`,
      date: "October 20, 2026",
      x: 80 + Math.random() * 260,
      y: 90 + Math.random() * 160,
      connectedTo: []
    });
  }

  toggleFoilHat() {
    if (!window.spottedQuests.hasItem('tinfoil')) {
      this.showNotification("Acquire the Tin Foil Fedora in Case #3!");
      return;
    }
    this.player.wearFoil = !this.player.wearFoil;
    if (window.spottedAudio) window.spottedAudio.playItemGet();
    this.showNotification(this.player.wearFoil ? "Equipped Tin Foil Fedora! (Telepathy blocked)" : "Unequipped Tin Foil Fedora.");
  }

  updateEmfProximity() {
    if (!window.spottedQuests.hasItem('emf')) return;

    const { cx, cy } = window.spottedWorld.getChunkCoords(Math.floor(this.player.x), Math.floor(this.player.y));
    let minDist = 999;

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const chunk = window.spottedWorld.getChunk(cx + ox, cy + oy);
        for (const item of chunk.interactables) {
          if (item.type === 'anomaly') {
            const dist = Math.hypot(this.player.x - item.tx, this.player.y - item.ty);
            if (dist < minDist) minDist = dist;
          }
        }
      }
    }

    const emfDial = document.getElementById('emf-meter-needle');
    const emfLed = document.getElementById('emf-meter-led');
    if (minDist < 12) {
      const intensity = Math.max(0, 1 - (minDist / 12));
      if (emfDial) emfDial.style.transform = `rotate(${-45 + intensity * 90}deg)`;
      if (emfLed) emfLed.style.backgroundColor = intensity > 0.6 ? '#ef4444' : '#22c55e';

      if (!this.emfTimer) this.emfTimer = 0;
      this.emfTimer += 0.016;
      const interval = Math.max(0.15, 1.2 - intensity * 1.0);
      if (this.emfTimer >= interval) {
        this.emfTimer = 0;
        if (window.spottedAudio) window.spottedAudio.playEmfBeep(intensity);
      }
    } else {
      if (emfDial) emfDial.style.transform = `rotate(-45deg)`;
      if (emfLed) emfLed.style.backgroundColor = '#4b5563';
    }
  }

  isNight() {
    return (this.timeOfDay > 0.65 || this.timeOfDay < 0.15);
  }

  // --- RENDERING PIPELINE (Full Viewport) ---
  render() {
    const ctx = this.ctx;

    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.gameState === 'title') {
      // Background animation behind HTML overlay
      this.renderTitleBackground(ctx);
      ctx.restore();
      return;
    }

    if (this.gameState === 'prologue') {
      this.renderPrologueScreen(ctx);
      ctx.restore();
      return;
    }

    if (this.gameState === 'busted') {
      // Red/blue siren ambient behind modal
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
      return;
    }

    // Main Gameplay: Apply Scale & Camera Translation
    ctx.scale(this.scale, this.scale);

    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.camera.shake > 0) {
      shakeOffsetX = (Math.random() - 0.5) * this.camera.shake * 14;
      shakeOffsetY = (Math.random() - 0.5) * this.camera.shake * 14;
    }
    ctx.translate(-Math.round(this.camera.x + shakeOffsetX), -Math.round(this.camera.y + shakeOffsetY));

    const T = 32;

    if (this.mode === 'interior') {
      this.renderInterior(ctx, T);
    } else {
      this.renderWorld(ctx, T);
      this.renderCars(ctx, T);
    }

    this.renderPlayer(ctx, T);
    this.renderParticles(ctx, T);

    ctx.restore();

    // Night/Dusk Lighting Overlay
    this.renderLighting(ctx);

    // Emergency Strobe Flash (Area 51 Climax)
    if (this.strobeColor) {
      ctx.fillStyle = this.strobeColor;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Floating Interaction Prompts
    this.renderInteractiveBubble(ctx);

    // Dialogue Box
    if (this.dialogue.active) {
      this.renderDialogueBox(ctx);
    }

    // Screen Transition (Fade)
    if (this.transition.active && this.transition.alpha > 0) {
      ctx.fillStyle = `rgba(10, 15, 26, ${this.transition.alpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Camera Snapshot Flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    this.renderNotifications(ctx);
  }

  renderTitleBackground(ctx) {
    // Starry night sky with distant glowing saucer
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, this.width, this.height);

    const now = performance.now() * 0.001;
    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 12345) % this.width;
      const sy = (i * 67890) % (this.height * 0.6);
      const twinkle = Math.sin(now + i) * 0.5 + 0.5;
      ctx.fillRect(sx, sy, twinkle > 0.5 ? 2 : 1, twinkle > 0.5 ? 2 : 1);
    }

    // Flying saucer beam
    const ufoX = this.width / 2 + Math.sin(now * 0.8) * 100;
    const ufoY = 140 + Math.cos(now * 0.6) * 20;

    // Beam
    ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
    ctx.beginPath();
    ctx.moveTo(ufoX - 20, ufoY + 10);
    ctx.lineTo(ufoX + 20, ufoY + 10);
    ctx.lineTo(ufoX + 160, this.height);
    ctx.lineTo(ufoX - 160, this.height);
    ctx.closePath();
    ctx.fill();

    // Saucer
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(ufoX, ufoY - 8, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.ellipse(ufoX, ufoY, 55, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cinematic Newspaper Prologue Cutscene
  renderPrologueScreen(ctx) {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, this.width, this.height);

    // Center vintage newspaper frame
    const pWidth = Math.min(680, this.width - 40);
    const pHeight = Math.min(540, this.height - 60);
    const pX = (this.width - pWidth) / 2;
    const pY = (this.height - pHeight) / 2;

    // Newspaper paper background (creamy aged newsprint)
    ctx.fillStyle = '#fefce8';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(pX, pY, pWidth, pHeight, 12);
    ctx.fill();
    ctx.stroke();

    // Header: The Oakhaven Inquirer
    ctx.fillStyle = '#1c1917';
    ctx.font = '700 24px "VT323", serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE OAKHAVEN INQUIRER', pX + pWidth / 2, pY + 36);

    ctx.font = '10px "Outfit", sans-serif';
    ctx.fillStyle = '#78716c';
    ctx.fillText('VOL. XLIV NO. 104 • OCTOBER 20, 2026 • LATE NIGHT SPECIAL EDITION', pX + pWidth / 2, pY + 54);

    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pX + 20, pY + 62);
    ctx.lineTo(pX + pWidth - 20, pY + 62);
    ctx.stroke();

    // Headline
    const page = this.prologue.pages[0];
    ctx.fillStyle = '#991b1b';
    ctx.font = '900 18px "Outfit", sans-serif';
    ctx.fillText(page.headline, pX + pWidth / 2, pY + 88);

    ctx.fillStyle = '#44403c';
    ctx.font = 'italic 12px "Outfit", sans-serif';
    ctx.fillText(page.subhead, pX + pWidth / 2, pY + 110);

    ctx.beginPath();
    ctx.moveTo(pX + 30, pY + 120);
    ctx.lineTo(pX + pWidth - 30, pY + 120);
    ctx.stroke();

    // Monologue Paragraphs
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1c1917';
    ctx.font = '13px "Outfit", sans-serif';

    let textY = pY + 150;
    for (let i = 0; i <= this.prologue.step; i++) {
      const line = page.body[i];
      this.renderWrappedText(ctx, line, pX + 40, textY, pWidth - 80, 20);
      textY += 42;
    }

    // Bottom Prompt
    const bob = Math.sin(performance.now() * 0.006) * 4;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0284c7';
    ctx.font = '10px "Press Start 2P", monospace';
    const isDone = (this.prologue.step === page.body.length - 1);
    const promptText = isDone ? "▶ [ENTER / SPACE / CLICK] ARRIVE IN OAKHAVEN" : "▼ [ENTER / SPACE / CLICK] NEXT (PRESS 'S' TO SKIP)";
    ctx.fillText(promptText, pX + pWidth / 2, pY + pHeight - 25 + bob);
  }

  renderWorld(ctx, T) {
    const viewW = this.width / this.scale;
    const viewH = this.height / this.scale;

    const minChunkX = Math.floor(this.camera.x / (T * window.spottedWorld.chunkSize));
    const maxChunkX = Math.floor((this.camera.x + viewW) / (T * window.spottedWorld.chunkSize));
    const minChunkY = Math.floor(this.camera.y / (T * window.spottedWorld.chunkSize));
    const maxChunkY = Math.floor((this.camera.y + viewH) / (T * window.spottedWorld.chunkSize));

    for (let cy = minChunkY; cy <= maxChunkY; cy++) {
      for (let cx = minChunkX; cx <= maxChunkX; cx++) {
        const chunk = window.spottedWorld.getChunk(cx, cy);
        const S = window.spottedWorld.chunkSize;
        const worldStartX = cx * S * T;
        const worldStartY = cy * S * T;

        for (let y = 0; y < S; y++) {
          for (let x = 0; x < S; x++) {
            const tileKey = chunk.tiles[y][x];
            const sprite = window.spottedSprites.get(tileKey);
            if (sprite) {
              ctx.drawImage(sprite, worldStartX + x * T, worldStartY + y * T);
            }
          }
        }

        for (const npc of chunk.npcs) {
          const spriteKey = `npc_${npc.type}_${npc.dir || 'down'}`;
          const npcSprite = window.spottedSprites.get(spriteKey) || window.spottedSprites.get(`npc_${npc.type}`);
          if (npcSprite) {
            ctx.drawImage(npcSprite, npc.tx * T, npc.ty * T);
          }
        }
      }
    }
  }

  renderInterior(ctx, T) {
    const room = this.currentInterior;
    if (!room) return;

    ctx.fillStyle = '#090b10';
    ctx.fillRect(-200, -200, (room.width + 15) * T, (room.height + 15) * T);

    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        const tileKey = room.tiles[y][x];
        const sprite = window.spottedSprites.get(tileKey);
        if (sprite) {
          ctx.drawImage(sprite, x * T, y * T);
        }
      }
    }

    for (const npc of room.npcs) {
      const spriteKey = `npc_${npc.type}_${npc.dir || 'down'}`;
      const npcSprite = window.spottedSprites.get(spriteKey) || window.spottedSprites.get(`npc_${npc.type}`);
      if (npcSprite) {
        ctx.drawImage(npcSprite, npc.tx * T, npc.ty * T);
      }
    }
  }

  renderCars(ctx, T) {
    for (const car of this.cars) {
      const isH = (car.dir === 'left' || car.dir === 'right');
      const spriteKey = `car_${car.dir}_${car.color}`;
      const sprite = window.spottedSprites.get(spriteKey);

      if (!sprite) continue;

      const cx = car.x * T;
      const cy = car.y * T;

      // Soft road shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      if (isH) {
        ctx.ellipse(cx, cy + 8, 22, 6, 0, 0, Math.PI * 2);
      } else {
        ctx.ellipse(cx, cy + 6, 12, 18, 0, 0, Math.PI * 2);
      }
      ctx.fill();

      // Draw car centered
      const drawX = Math.round(isH ? (cx - 24) : (cx - 14));
      const drawY = Math.round(isH ? (cy - 14) : (cy - 24));
      ctx.drawImage(sprite, drawX, drawY);
    }
  }

  renderParticles(ctx, T) {
    for (const p of this.particles) {
      const lifeRatio = p.timer / p.maxTimer;

      if (p.type === 'dust') {
        const sprite = window.spottedSprites.get('dust_puff');
        if (sprite) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, lifeRatio);
          const size = 32 * (p.scale || 1.0);
          ctx.drawImage(sprite, Math.round(p.x * T - size / 2), Math.round(p.y * T - size / 2), size, size);
          ctx.restore();
        }
      } else if (p.type === 'angry') {
        const sprite = window.spottedSprites.get('icon_angry');
        if (sprite) {
          ctx.save();
          ctx.globalAlpha = Math.min(1.0, lifeRatio * 1.5);
          const bob = Math.sin(performance.now() * 0.015) * 2;
          ctx.drawImage(sprite, Math.round(p.x * T - 10), Math.round((p.y * T - 10) + bob), 20, 20);
          ctx.restore();
        }
      }
    }
  }

  renderPlayer(ctx, T) {
    const px = Math.round(this.player.x * T);
    const py = Math.round(this.player.y * T);

    // Invulnerability flicker after car bump
    if (this.player.bumpInvulnerableTimer > 0) {
      if (Math.floor(performance.now() * 0.015) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 28, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const frames = window.spottedSprites.cache[`player_${this.player.dir}`];
    if (frames && frames[this.player.animFrame]) {
      ctx.drawImage(frames[this.player.animFrame], px, py);
    }

    if (this.player.wearFoil) {
      const foilSprite = window.spottedSprites.get('icon_tinfoil');
      if (foilSprite) {
        ctx.drawImage(foilSprite, px + 4, py - 4, 24, 24);
      }
    }

    ctx.globalAlpha = 1.0;
  }

  renderLighting(ctx) {
    if (this.width <= 0 || this.height <= 0) return;

    let darkness = 0;
    if (this.timeOfDay > 0.5 && this.timeOfDay < 0.7) {
      darkness = ((this.timeOfDay - 0.5) / 0.2) * 0.75;
    } else if (this.timeOfDay >= 0.7 || this.timeOfDay <= 0.1) {
      darkness = 0.78;
    } else if (this.timeOfDay > 0.1 && this.timeOfDay < 0.25) {
      darkness = 0.78 * (1 - (this.timeOfDay - 0.1) / 0.15);
    }

    if (darkness <= 0.05) return;

    if (!this.lightCanvas) {
      this.lightCanvas = document.createElement('canvas');
    }
    const canvasW = Math.max(1, Math.round(this.width));
    const canvasH = Math.max(1, Math.round(this.height));
    if (this.lightCanvas.width !== canvasW || this.lightCanvas.height !== canvasH) {
      this.lightCanvas.width = canvasW;
      this.lightCanvas.height = canvasH;
      this.lightCtx = this.lightCanvas.getContext('2d');
    }

    const lCtx = this.lightCtx;
    lCtx.clearRect(0, 0, this.width, this.height);
    lCtx.fillStyle = `rgba(8, 12, 28, ${darkness})`;
    lCtx.fillRect(0, 0, this.width, this.height);

    lCtx.globalCompositeOperation = 'destination-out';

    // Player personal light
    const pScreenX = Math.round((this.player.x * 32 - this.camera.x) * this.scale + 16 * this.scale);
    const pScreenY = Math.round((this.player.y * 32 - this.camera.y) * this.scale + 16 * this.scale);
    const pRadius = 80 * this.scale;

    const pGrad = lCtx.createRadialGradient(pScreenX, pScreenY, 8 * this.scale, pScreenX, pScreenY, pRadius);
    pGrad.addColorStop(0, 'rgba(0,0,0,1)');
    pGrad.addColorStop(0.5, 'rgba(0,0,0,0.6)');
    pGrad.addColorStop(1, 'rgba(0,0,0,0)');
    lCtx.fillStyle = pGrad;
    lCtx.beginPath();
    lCtx.arc(pScreenX, pScreenY, pRadius, 0, Math.PI * 2);
    lCtx.fill();

    // Street Lamps
    if (this.mode === 'world') {
      const minX = Math.floor(this.camera.x / 32) - 1;
      const maxX = Math.ceil((this.camera.x + this.width / this.scale) / 32) + 1;
      const minY = Math.floor(this.camera.y / 32) - 1;
      const maxY = Math.ceil((this.camera.y + this.height / this.scale) / 32) + 1;

      for (let ty = minY; ty <= maxY; ty++) {
        for (let tx = minX; tx <= maxX; tx++) {
          const { cx, cy } = window.spottedWorld.getChunkCoords(tx, ty);
          const chunk = window.spottedWorld.getChunk(cx, cy);
          const S = window.spottedWorld.chunkSize;
          const lx = ((tx % S) + S) % S;
          const ly = ((ty % S) + S) % S;

          if (chunk.tiles[ly] && chunk.tiles[ly][lx] === 'street_lamp') {
            const lxScreen = Math.round((tx * 32 - this.camera.x) * this.scale + 16 * this.scale);
            const lyScreen = Math.round((ty * 32 - this.camera.y) * this.scale + 12 * this.scale);
            const lRadius = 90 * this.scale;

            const lGrad = lCtx.createRadialGradient(lxScreen, lyScreen, 10 * this.scale, lxScreen, lyScreen, lRadius);
            lGrad.addColorStop(0, 'rgba(0,0,0,1)');
            lGrad.addColorStop(0.6, 'rgba(0,0,0,0.5)');
            lGrad.addColorStop(1, 'rgba(0,0,0,0)');
            lCtx.fillStyle = lGrad;
            lCtx.beginPath();
            lCtx.arc(lxScreen, lyScreen, lRadius, 0, Math.PI * 2);
            lCtx.fill();
          }
        }
      }

      // Car Headlights
      for (const car of this.cars) {
        const cScreenX = Math.round((car.x * 32 - this.camera.x) * this.scale);
        const cScreenY = Math.round((car.y * 32 - this.camera.y) * this.scale);
        const beamDist = 110 * this.scale;
        const beamSpread = 32 * this.scale;

        let startX = cScreenX;
        let startY = cScreenY;
        let endX = cScreenX;
        let endY = cScreenY;

        if (car.dir === 'right') {
          startX += 18 * this.scale;
          endX = startX + beamDist;
        } else if (car.dir === 'left') {
          startX -= 18 * this.scale;
          endX = startX - beamDist;
        } else if (car.dir === 'down') {
          startY += 18 * this.scale;
          endY = startY + beamDist;
        } else if (car.dir === 'up') {
          startY -= 18 * this.scale;
          endY = startY - beamDist;
        }

        const headGrad = lCtx.createRadialGradient(startX, startY, 10 * this.scale, endX, endY, beamDist);
        headGrad.addColorStop(0, 'rgba(0,0,0,0.95)');
        headGrad.addColorStop(0.5, 'rgba(0,0,0,0.6)');
        headGrad.addColorStop(1, 'rgba(0,0,0,0)');
        lCtx.fillStyle = headGrad;

        lCtx.beginPath();
        if (car.dir === 'right') {
          lCtx.moveTo(startX, startY - 8 * this.scale);
          lCtx.lineTo(endX, endY - beamSpread);
          lCtx.lineTo(endX, endY + beamSpread);
          lCtx.lineTo(startX, startY + 8 * this.scale);
        } else if (car.dir === 'left') {
          lCtx.moveTo(startX, startY - 8 * this.scale);
          lCtx.lineTo(endX, endY - beamSpread);
          lCtx.lineTo(endX, endY + beamSpread);
          lCtx.lineTo(startX, startY + 8 * this.scale);
        } else if (car.dir === 'down') {
          lCtx.moveTo(startX - 8 * this.scale, startY);
          lCtx.lineTo(endX - beamSpread, endY);
          lCtx.lineTo(endX + beamSpread, endY);
          lCtx.lineTo(startX + 8 * this.scale, startY);
        } else if (car.dir === 'up') {
          lCtx.moveTo(startX - 8 * this.scale, startY);
          lCtx.lineTo(endX - beamSpread, endY);
          lCtx.lineTo(endX + beamSpread, endY);
          lCtx.lineTo(startX + 8 * this.scale, startY);
        }
        lCtx.closePath();
        lCtx.fill();
      }
    }

    lCtx.globalCompositeOperation = 'source-over';
    if (this.lightCanvas && this.lightCanvas.width > 0 && this.lightCanvas.height > 0) {
      ctx.drawImage(this.lightCanvas, 0, 0);
    }
  }

  renderInteractiveBubble(ctx) {
    if (!this.interactiveTarget || this.dialogue.active) return;

    let targetX = 0;
    let targetY = 0;
    const { target } = this.interactiveTarget;
    if (target.tx !== undefined && target.ty !== undefined) {
      targetX = (target.tx * 32 - this.camera.x + 16) * this.scale;
      targetY = (target.ty * 32 - this.camera.y - 12) * this.scale;
    } else if (target.building) {
      targetX = (target.building.doorX * 32 - this.camera.x + 16) * this.scale;
      targetY = (target.building.doorY * 32 - this.camera.y - 12) * this.scale;
    }

    const text = `[E] ${this.interactiveTarget.prompt}`;
    ctx.font = '11px "Press Start 2P", monospace';
    const textWidth = ctx.measureText(text).width;
    const pad = 8;
    const bob = Math.sin(performance.now() * 0.006) * 4;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(targetX - textWidth / 2 - pad, targetY + bob - 18, textWidth + pad * 2, 26, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.fillText(text, targetX - textWidth / 2, targetY + bob);
  }

  renderDialogueBox(ctx) {
    const boxW = Math.min(840, this.width - 40);
    const boxH = 110;
    const boxX = (this.width - boxW) / 2;
    const boxY = this.height - boxH - 24;

    // Rounded dialog box with glassmorphism glow
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    // Portrait Frame
    const portX = boxX + 16;
    const portY = boxY + 16;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(portX, portY, 76, 76, 8);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.stroke();

    const portSprite = window.spottedSprites.get(`npc_${this.dialogue.type}`) || window.spottedSprites.cache['player_down'][0];
    if (portSprite) {
      ctx.drawImage(portSprite, portX + 6, portY + 6, 64, 64);
    }

    // Name Badge
    ctx.fillStyle = '#facc15';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(this.dialogue.speaker, boxX + 106, boxY + 28);

    // Dialogue text
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "Press Start 2P", monospace';
    const textStartX = boxX + 106;
    const textStartY = boxY + 50;
    const maxWidth = boxW - 130;
    const lineHeight = 18;

    this.renderWrappedText(ctx, this.dialogue.displayedText, textStartX, textStartY, maxWidth, lineHeight);

    if (!this.dialogue.isTyping) {
      const bounce = Math.sin(performance.now() * 0.008) * 4;
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('▼ [E / SPACE]', boxX + boxW - 140, boxY + boxH - 16 + bounce);
    }
  }

  renderWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  showNotification(text) {
    this.notifications.push({ text, time: 3.5, alpha: 1.0 });
  }

  renderNotifications(ctx) {
    if (this.notifications.length === 0) return;
    let notifY = 64;

    for (let i = this.notifications.length - 1; i >= 0; i--) {
      const n = this.notifications[i];
      n.time -= 0.016;
      if (n.time <= 0) {
        this.notifications.splice(i, 1);
        continue;
      }
      if (n.time < 0.5) n.alpha = n.time / 0.5;

      ctx.font = '10px "Press Start 2P", monospace';
      const w = ctx.measureText(n.text).width + 24;

      ctx.fillStyle = `rgba(15, 23, 42, ${0.94 * n.alpha})`;
      ctx.strokeStyle = `rgba(56, 189, 248, ${n.alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(this.width / 2 - w / 2, notifY, w, 28, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, ${n.alpha})`;
      ctx.textAlign = 'left';
      ctx.fillText(n.text, this.width / 2 - w / 2 + 12, notifY + 18);

      notifY += 36;
    }
  }

  updateTimeHud() {
    const hours = Math.floor(this.timeOfDay * 24);
    const mins = Math.floor((this.timeOfDay * 24 * 60) % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const timeStr = `${displayHours}:${mins < 10 ? '0' + mins : mins} ${ampm}`;

    const clockElem = document.getElementById('hud-time');
    if (clockElem) clockElem.textContent = timeStr;

    const { cx, cy } = window.spottedWorld.getChunkCoords(Math.floor(this.player.x), Math.floor(this.player.y));
    const sectorElem = document.getElementById('hud-sector');
    if (sectorElem) sectorElem.textContent = `Sector [${cx}, ${cy}]`;

    const questTitleElem = document.getElementById('hud-quest-title');
    const questDescElem = document.getElementById('hud-quest-desc');
    if (window.spottedQuests && window.spottedQuests.activeQuest) {
      if (questTitleElem) questTitleElem.textContent = window.spottedQuests.activeQuest.title;
      if (questDescElem) questDescElem.textContent = window.spottedQuests.activeQuest.targetDesc;
    }

    const levelElem = document.getElementById('hud-level');
    const xpBar = document.getElementById('hud-xp-progress');
    const titleElem = document.getElementById('hud-title');
    if (window.spottedQuests) {
      if (levelElem) levelElem.textContent = `LVL ${window.spottedQuests.level}`;
      if (titleElem) titleElem.textContent = `${window.spottedQuests.playerName} (${window.spottedQuests.title})`;
      if (xpBar) {
        const pct = Math.min(100, Math.round((window.spottedQuests.xp / window.spottedQuests.xpNeeded) * 100));
        xpBar.style.width = `${pct}%`;
      }
    }
  }

  toggleCorkboard(forceState = null) {
    const modal = document.getElementById('corkboard-modal');
    if (!modal) return;
    const isOpen = (forceState !== null) ? forceState : modal.classList.contains('hidden');

    if (isOpen) {
      modal.classList.remove('hidden');
      this.renderCorkboardUi();
      if (window.spottedAudio) window.spottedAudio.playSelect();
    } else {
      modal.classList.add('hidden');
      if (window.spottedAudio) window.spottedAudio.playCancel();
    }
  }

  renderCorkboardUi() {
    const board = document.getElementById('corkboard-surface');
    const svgLines = document.getElementById('corkboard-strings');
    if (!board) return;

    board.querySelectorAll('.cork-item').forEach(el => el.remove());
    if (svgLines) svgLines.innerHTML = '';

    const clues = window.spottedQuests.evidenceBoard;
    const clueElements = new Map();

    clues.forEach((clue) => {
      const item = document.createElement('div');
      item.className = 'cork-item polaroid-card';
      item.style.left = `${clue.x}px`;
      item.style.top = `${clue.y}px`;

      item.innerHTML = `
        <div class="pushpin"></div>
        <div class="polaroid-photo">
          <div class="polaroid-glyph">${clue.type === 'photo' ? '📷' : (clue.type === 'document' ? '📄' : '🔍')}</div>
        </div>
        <div class="polaroid-label">${clue.title}</div>
        <div class="polaroid-desc">${clue.desc}</div>
      `;

      board.appendChild(item);
      clueElements.set(clue.id, { x: clue.x + 80, y: clue.y + 40 });
    });

    if (svgLines) {
      clues.forEach(clue => {
        if (clue.connectedTo && clue.connectedTo.length > 0) {
          const from = clueElements.get(clue.id);
          clue.connectedTo.forEach(targetId => {
            const to = clueElements.get(targetId);
            if (from && to) {
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line.setAttribute('x1', from.x);
              line.setAttribute('y1', from.y);
              line.setAttribute('x2', to.x);
              line.setAttribute('y2', to.y);
              line.setAttribute('stroke', '#dc2626');
              line.setAttribute('stroke-width', '2.5');
              line.setAttribute('stroke-dasharray', '4,2');
              svgLines.appendChild(line);
            }
          });
        }
      });
    }

    const invTray = document.getElementById('inventory-list');
    if (invTray) {
      invTray.innerHTML = '';
      window.spottedQuests.inventory.forEach(inv => {
        const div = document.createElement('div');
        div.className = 'inventory-slot';
        div.innerHTML = `
          <div class="inv-name">${inv.name}</div>
          <div class="inv-desc">${inv.desc}</div>
        `;
        invTray.appendChild(div);
      });
    }
  }

  showLevelUpModal(lvl, title) {
    this.showNotification(`🎉 LEVEL UP! Cole reached Level ${lvl}: ${title}!`);
  }

  // --- Save / Load Modals ---
  toggleSaveLoadModal(open = true) {
    const modal = document.getElementById('saveload-modal');
    if (!modal) return;
    if (open) {
      modal.classList.remove('hidden');
      this.refreshSlotDisplay();
      if (window.spottedAudio) window.spottedAudio.playSelect();
    } else {
      modal.classList.add('hidden');
      if (window.spottedAudio) window.spottedAudio.playCancel();
    }
  }

  toggleSettingsModal(open = null) {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    const shouldOpen = (open !== null) ? open : modal.classList.contains('hidden');
    if (shouldOpen) {
      modal.classList.remove('hidden');
      if (window.spottedAudio) window.spottedAudio.playSelect();
    } else {
      modal.classList.add('hidden');
      if (window.spottedAudio) window.spottedAudio.playCancel();
    }
  }

  refreshSlotDisplay() {
    for (let slot = 1; slot <= 3; slot++) {
      const dataStr = localStorage.getItem(`spotted_save_${slot}`);
      const infoEl = document.getElementById(`slot-${slot}-info`);
      const loadBtn = document.querySelector(`.slot-load-btn[data-slot="${slot}"]`);

      if (dataStr && infoEl) {
        const data = JSON.parse(dataStr);
        const dateStr = new Date(data.timestamp || Date.now()).toLocaleDateString() + ' ' + new Date(data.timestamp || Date.now()).toLocaleTimeString();
        infoEl.innerHTML = `<strong>Cole Welps</strong> - LVL ${data.level || 1} • Case #${data.mainStoryStep || 1}<br><span class="save-time">${dateStr}</span>`;
        if (loadBtn) {
          loadBtn.disabled = false;
          loadBtn.classList.remove('disabled');
        }
      } else if (infoEl) {
        infoEl.innerHTML = `<span class="empty-slot">Empty Save Slot</span>`;
        if (loadBtn) {
          loadBtn.disabled = true;
          loadBtn.classList.add('disabled');
        }
      }
    }
  }

  autoSaveQuietly() {
    if (this.gameState !== 'world' && this.gameState !== 'interior') return;
    if (this.dialogue.active || this.climax.active) return;
    this.saveToSlot(1, true);
  }

  saveToSlot(slot, isQuiet = false) {
    const saveData = {
      timestamp: Date.now(),
      level: window.spottedQuests.level,
      xp: window.spottedQuests.xp,
      mainStoryStep: window.spottedQuests.mainStoryStep,
      inventory: window.spottedQuests.inventory,
      evidenceBoard: window.spottedQuests.evidenceBoard,
      playerX: this.player.x,
      playerY: this.player.y,
      mode: this.mode,
      timeOfDay: this.timeOfDay
    };
    try {
      localStorage.setItem(`spotted_save_${slot}`, JSON.stringify(saveData));
      localStorage.setItem('spotted_save', JSON.stringify(saveData));
      this.refreshSlotDisplay();
      if (!isQuiet) {
        this.showNotification(`Saved to Slot ${slot}!`);
        if (window.spottedAudio) window.spottedAudio.playItemGet();
      }
    } catch (e) {
      if (!isQuiet) alert("Storage quota exceeded!");
    }
  }

  loadFromSlot(slot) {
    const raw = localStorage.getItem(`spotted_save_${slot}`);
    if (!raw) return;
    this.applySaveJson(raw);
    this.toggleSaveLoadModal(false);
    this.continueGame();
  }

  saveGame(isQuiet = false) {
    this.saveToSlot(1, isQuiet);
  }

  loadSave() {
    const raw = localStorage.getItem('spotted_save_1') || localStorage.getItem('spotted_save');
    if (!raw) return;
    this.applySaveJson(raw);
  }

  applySaveJson(raw) {
    try {
      const data = JSON.parse(raw);
      if (data.level) window.spottedQuests.level = data.level;
      if (data.xp !== undefined) window.spottedQuests.xp = data.xp;
      window.spottedQuests.xpNeeded = window.spottedQuests.getXpForLevel(window.spottedQuests.level);
      window.spottedQuests.updateTitle();
      if (data.mainStoryStep) {
        window.spottedQuests.mainStoryStep = data.mainStoryStep;
        window.spottedQuests.startCaseFile(data.mainStoryStep);
      }
      if (data.inventory) window.spottedQuests.inventory = data.inventory;
      if (data.evidenceBoard) window.spottedQuests.evidenceBoard = data.evidenceBoard;
      if (data.playerX !== undefined) this.player.x = data.playerX;
      if (data.playerY !== undefined) this.player.y = data.playerY;
      if (data.timeOfDay !== undefined) this.timeOfDay = data.timeOfDay;
    } catch (e) {
      console.warn("Could not parse save", e);
    }
  }

  saveSettings() {
    localStorage.setItem('spotted_settings', JSON.stringify(this.settings));
  }

  loadSettings() {
    const raw = localStorage.getItem('spotted_settings');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.bgmVol !== undefined) this.settings.bgmVol = data.bgmVol;
      if (data.sfxVol !== undefined) this.settings.sfxVol = data.sfxVol;
      if (data.scanlines !== undefined) this.settings.scanlines = data.scanlines;
      window.spottedAudio.setVolume(this.settings.sfxVol, this.settings.bgmVol);
    } catch (e) {}
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.spottedGame = new SpottedGame();
});
