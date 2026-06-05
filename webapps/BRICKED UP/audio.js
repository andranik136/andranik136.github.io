/**
 * Brick Breaker Retro Audio Synthesizer
 * Uses Web Audio API to procedurally generate authentic 8-bit sound effects.
 */
class RetroAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.3; // Scaled master volume
  }

  // Lazy-initialize the Audio Context due to browser autoplay policies
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser", e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    this.resume();
    return this.enabled;
  }

  // Create standard retro oscillator node with adsr envelope
  createTone(freq, type, duration, endFreq = null, gainCurve = null) {
    if (!this.enabled) return null;
    this.resume();
    if (!this.ctx) return null;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type; // 'square', 'sawtooth', 'triangle', 'sine'
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Frequency slide (portamento)
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    }

    gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    if (gainCurve === 'decay') {
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    } else {
      gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    }

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);

    return { osc, gainNode };
  }

  // Sound 1: Bounce off silver border (Short crisp blip)
  playWallBounce() {
    this.createTone(240, 'triangle', 0.06, 320, 'linear');
  }

  // Sound 2: Bounce off paddle (Snappy retro pop)
  playPaddleBounce() {
    this.createTone(380, 'square', 0.08, 480, 'decay');
  }

  // Sound 3: Destroy colored brick (High-pitched ring)
  playBrickBreak() {
    this.createTone(650, 'triangle', 0.08, 900, 'decay');
  }

  // Sound 4: Hit metallic silver brick (Clang chime)
  playMetalClang() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.12;

    // Metallic sound uses two high frequencies close to each other
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(580, now);
    osc1.frequency.linearRampToValueAtTime(100, now + duration);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.linearRampToValueAtTime(200, now + duration);

    gainNode.gain.setValueAtTime(this.volume * 0.7, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  // Sound 5: Collect power-up capsule (Classic arpeggio chord)
  playPowerup() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6 (Arpeggio)
    const step = 0.05;

    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * step);

      gainNode.gain.setValueAtTime(0, now + index * step);
      gainNode.gain.linearRampToValueAtTime(this.volume, now + index * step + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * step + 0.15);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now + index * step);
      osc.stop(now + index * step + 0.16);
    });
  }

  // Sound 6: Fire laser beam (Steep downward slide)
  playLaser() {
    this.createTone(900, 'sawtooth', 0.12, 180, 'decay');
  }

  // Sound 7: Lose a life / Explosion (Deep filtered white noise simulator)
  playExplosion() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.5;

    // We simulate white noise using mathematical noise buffer
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Filter to make it sound muffled and low-pitched
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + duration);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.volume * 1.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noiseNode.start();
    noiseNode.stop(now + duration);

    // Add a deep synth rumble underneath
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(30, now + duration);

    oscGain.gain.setValueAtTime(this.volume * 0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + duration);
  }

  // Sound 8: Game Over jingle (Slow sad descending tones)
  playGameOver() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [329.63, 311.13, 293.66, 220.00]; // E4, D#4, D4, A3
    const durations = [0.2, 0.2, 0.2, 0.5];
    let timeAccumulator = 0;

    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + timeAccumulator);

      gainNode.gain.setValueAtTime(this.volume, now + timeAccumulator);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + timeAccumulator + durations[index]);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now + timeAccumulator);
      osc.stop(now + timeAccumulator + durations[index]);

      timeAccumulator += durations[index] - 0.02;
    });
  }

  // Sound 9: Victory jingle (Upbeat classic 8-bit fanfare)
  playVictory() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      523.25, 523.25, 523.25, 523.25, // C5 x4
      659.25, 587.33, 659.25, 783.99, // E5, D5, E5, G5
      880.00, 1046.50                  // A5, C6
    ];
    const steps = [0.08, 0.08, 0.08, 0.16, 0.12, 0.12, 0.12, 0.12, 0.16, 0.4];
    let timeAccumulator = 0;

    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + timeAccumulator);

      gainNode.gain.setValueAtTime(0, now + timeAccumulator);
      gainNode.gain.linearRampToValueAtTime(this.volume * 1.2, now + timeAccumulator + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + timeAccumulator + steps[index]);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now + timeAccumulator);
      osc.stop(now + timeAccumulator + steps[index]);

      timeAccumulator += steps[index];
    });
  }
}

// Export single instance globally
window.audio = new RetroAudio();
