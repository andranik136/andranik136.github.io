/**
 * Spotted - Retro GBA Web Audio Synthesizer
 * Procedural chip-tune synthesizer and 16-bit sound effects.
 * Zero external audio files required - works 100% offline.
 */
class SpottedAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.sfxVolume = 0.3;
    this.musicVolume = 0.18;
    this.isMusicPlaying = false;
    this.currentTrack = null;
    this.bgmTimer = null;
    this.currentTheme = 'mystery'; // 'mystery' | 'interior' | 'night' | 'siren' | 'danger'
    this.beatIndex = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(sfx, music) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.musicVolume = Math.max(0, Math.min(1, music));
  }

  toggleSound() {
    this.enabled = !this.enabled;
    this.resume();
    if (!this.enabled && this.isMusicPlaying) {
      this.stopMusic();
    } else if (this.enabled && this.musicEnabled) {
      this.startMusic(this.currentTheme);
    }
    return this.enabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    this.resume();
    if (!this.musicEnabled) {
      this.stopMusic();
    } else if (this.enabled) {
      this.startMusic(this.currentTheme);
    }
    return this.musicEnabled;
  }

  createTone(freq, type = 'square', duration = 0.1, gainVal = 0.2, endFreq = null, gainType = 'linear') {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), now);

      if (endFreq !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
      }

      gain.gain.setValueAtTime(gainVal * this.sfxVolume, now);
      if (gainType === 'decay') {
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      } else {
        gain.gain.linearRampToValueAtTime(0, now + duration);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio node cleanup safeguard
    }
  }

  // --- Sound Effects ---

  playFootstep() {
    if (!this.enabled) return;
    this.resume();
    const pitches = [110, 125, 118];
    const p = pitches[Math.floor(Math.random() * pitches.length)];
    this.createTone(p, 'triangle', 0.04, 0.14, 60, 'decay');
  }

  playDoor() {
    if (!this.enabled) return;
    this.resume();
    setTimeout(() => this.createTone(261.6, 'sine', 0.08, 0.2), 0);
    setTimeout(() => this.createTone(329.6, 'sine', 0.08, 0.2), 80);
    setTimeout(() => this.createTone(392.0, 'sine', 0.12, 0.25), 160);
  }

  playTalk(voiceType = 'normal') {
    if (!this.enabled) return;
    this.resume();

    let freq = 340;
    let type = 'square';

    switch (voiceType) {
      case 'alien':
        freq = 620 + Math.random() * 250;
        type = 'sawtooth';
        break;
      case 'deep':
      case 'agent':
      case 'fbi':
        freq = 130 + Math.random() * 40;
        type = 'triangle';
        break;
      case 'lady':
      case 'high':
        freq = 460 + Math.random() * 90;
        type = 'sine';
        break;
      case 'quirky':
      case 'scientist':
        freq = 380 + Math.random() * 180;
        type = 'square';
        break;
      case 'cow':
        this.createTone(90, 'sawtooth', 0.15, 0.25, 75, 'linear');
        return;
      case 'typewriter':
        this.createTone(680 + Math.random() * 120, 'square', 0.02, 0.08, 300, 'decay');
        return;
      default:
        freq = 280 + Math.random() * 60;
        type = 'square';
    }

    this.createTone(freq, type, 0.035, 0.1, null, 'decay');
  }

  playSelect() {
    this.createTone(440, 'square', 0.05, 0.18, 880);
  }

  playCancel() {
    this.createTone(330, 'square', 0.06, 0.18, 165);
  }

  // Car Horn Honk
  playHonk() {
    if (!this.enabled) return;
    this.resume();
    // Two-tone retro car horn chord (F#4 + A#4)
    this.createTone(370, 'sawtooth', 0.18, 0.35);
    this.createTone(466, 'sawtooth', 0.18, 0.35);
    setTimeout(() => {
      this.createTone(370, 'sawtooth', 0.22, 0.38);
      this.createTone(466, 'sawtooth', 0.22, 0.38);
    }, 120);
  }

  // Car Bumping Player (comic bounce thud)
  playBump() {
    if (!this.enabled) return;
    this.resume();
    this.createTone(140, 'triangle', 0.15, 0.45, 45, 'decay');
    this.playNoiseClick(0.08, 0.3);
  }

  // Rude NPC dismissive grunt
  playGrunt() {
    if (!this.enabled) return;
    this.resume();
    this.createTone(160, 'sawtooth', 0.1, 0.25, 90, 'decay');
  }

  playItemGet() {
    if (!this.enabled) return;
    this.resume();
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.createTone(freq, 'triangle', 0.15, 0.25);
      }, idx * 75);
    });
  }

  playQuestAccepted() {
    if (!this.enabled) return;
    this.resume();
    const notes = [330, 392, 493.88, 587.33];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.createTone(freq, 'sine', 0.12, 0.22);
      }, idx * 70);
    });
  }

  playQuestComplete() {
    if (!this.enabled) return;
    this.resume();
    const melody = [
      { f: 523.25, d: 0.1 },  // C5
      { f: 659.25, d: 0.1 },  // E5
      { f: 783.99, d: 0.1 },  // G5
      { f: 1046.50, d: 0.3 }  // C6
    ];
    let delay = 0;
    melody.forEach(item => {
      setTimeout(() => {
        this.createTone(item.f, 'triangle', item.d, 0.28);
      }, delay);
      delay += 110;
    });
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.resume();
    const fanfare = [
      { f: 440, d: 0.08 },
      { f: 554, d: 0.08 },
      { f: 659, d: 0.08 },
      { f: 880, d: 0.2 },
      { f: 784, d: 0.1 },
      { f: 880, d: 0.35 }
    ];
    let delay = 0;
    fanfare.forEach(item => {
      setTimeout(() => {
        this.createTone(item.f, 'square', item.d, 0.22);
      }, delay);
      delay += 95;
    });
  }

  playEmfBeep(intensity = 0.5) {
    if (!this.enabled) return;
    const freq = 600 + (intensity * 1200);
    this.createTone(freq, 'sine', 0.04, 0.12 + (intensity * 0.15), freq + 100, 'decay');
  }

  playCameraShutter() {
    if (!this.enabled) return;
    this.resume();
    this.createTone(800, 'triangle', 0.03, 0.3, 100, 'decay');
    setTimeout(() => {
      this.createTone(150, 'sawtooth', 0.08, 0.15, 400, 'linear');
    }, 40);
  }

  playRummage() {
    if (!this.enabled) return;
    this.resume();
    this.createTone(120, 'triangle', 0.08, 0.15, 200, 'decay');
    setTimeout(() => this.createTone(160, 'sawtooth', 0.06, 0.12, 100, 'decay'), 60);
    setTimeout(() => this.createTone(240, 'triangle', 0.08, 0.15, 140, 'decay'), 120);
  }

  // Heavy blast / door kick down impact
  playImpact() {
    if (!this.enabled) return;
    this.resume();
    this.createTone(90, 'sawtooth', 0.3, 0.45, 30, 'decay');
    this.playNoiseClick(0.25, 0.4);
  }

  // Emergency Siren (Klaxon)
  playSiren() {
    if (!this.enabled) return;
    this.resume();
    this.createTone(780, 'sawtooth', 0.2, 0.25, 980, 'linear');
    setTimeout(() => {
      this.createTone(980, 'sawtooth', 0.2, 0.25, 780, 'linear');
    }, 200);
  }

  // --- Background Chip-Tune Music Engine ---

  startMusic(theme = 'mystery') {
    this.currentTheme = theme;
    if (!this.enabled || !this.musicEnabled) return;
    this.resume();
    if (this.isMusicPlaying) {
      this.stopMusic();
    }
    this.isMusicPlaying = true;
    this.beatIndex = 0;
    this.scheduleNextBeat();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  setTheme(theme) {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;
    if (this.isMusicPlaying) {
      this.startMusic(theme);
    }
  }

  scheduleNextBeat() {
    if (!this.isMusicPlaying || !this.enabled || !this.musicEnabled || !this.ctx) return;

    const tempo = this.currentTheme === 'interior' ? 135 : (this.currentTheme === 'danger' ? 150 : 105);
    const beatDuration = (60 / tempo) * 500;

    try {
      this.playSequencerStep(this.beatIndex, this.currentTheme);
    } catch (e) {
      // Audio node safeguard
    }

    this.beatIndex = (this.beatIndex + 1) % 32;
    this.bgmTimer = setTimeout(() => {
      this.scheduleNextBeat();
    }, beatDuration);
  }

  playSequencerStep(step, theme) {
    if (!this.ctx || this.ctx.state === 'suspended') return;

    if (theme === 'danger') {
      // Fast alarm bass + siren pulses
      if (step % 4 === 0) {
        this.createTone(110, 'sawtooth', 0.15, this.musicVolume * 0.9, 80, 'decay');
      }
      if (step % 8 === 0) {
        this.createTone(880, 'sine', 0.25, this.musicVolume * 0.7, 660, 'linear');
      }
      if (step % 2 === 1) {
        this.playNoiseClick(0.03, this.musicVolume * 0.4);
      }
      return;
    }

    // Theme 1: Spooky Mystery
    if (theme === 'mystery' || theme === 'night') {
      const bassNotes = [
        130.81, 0, 130.81, 155.56,
        146.83, 0, 116.54, 123.47,
        130.81, 0, 130.81, 174.61,
        164.81, 155.56, 146.83, 130.81
      ];
      const bassFreq = bassNotes[step % 16];
      if (bassFreq > 0) {
        this.playSynthNote(bassFreq, 'triangle', 0.22, this.musicVolume * 0.7);
      }

      const leadMelody = [
        523.25, 0, 622.25, 0, 587.33, 0, 493.88, 0,
        523.25, 622.25, 698.46, 0, 783.99, 0, 698.46, 622.25,
        523.25, 0, 783.99, 0, 739.99, 0, 622.25, 0,
        587.33, 0, 523.25, 0, 493.88, 0, 392.00, 0
      ];
      const leadFreq = leadMelody[step % 32];
      if (leadFreq > 0) {
        this.playSynthNote(leadFreq, 'sine', 0.35, this.musicVolume * 0.55, true);
      }

      if (step % 2 === 1) {
        this.playNoiseClick(0.015, this.musicVolume * 0.2);
      }
    } 
    // Theme 2: Quirky Interior
    else if (theme === 'interior') {
      const jazzBass = [
        130.81, 0, 164.81, 0, 196.00, 0, 220.00, 0,
        146.83, 0, 174.61, 0, 220.00, 0, 246.94, 0,
        196.00, 0, 246.94, 0, 293.66, 0, 246.94, 0,
        130.81, 164.81, 196.00, 246.94, 261.63, 0, 0, 0
      ];
      const bFreq = jazzBass[step % 32];
      if (bFreq > 0) {
        this.playSynthNote(bFreq, 'square', 0.16, this.musicVolume * 0.5);
      }

      const jazzLead = [
        523.25, 587.33, 659.25, 0, 783.99, 0, 659.25, 0,
        587.33, 0, 523.25, 659.25, 587.33, 0, 0, 0,
        659.25, 0, 783.99, 880.00, 987.77, 0, 880.00, 0,
        783.99, 659.25, 587.33, 523.25, 587.33, 0, 0, 0
      ];
      const lFreq = jazzLead[step % 32];
      if (lFreq > 0) {
        this.playSynthNote(lFreq, 'triangle', 0.2, this.musicVolume * 0.45);
      }

      if (step % 4 === 2) {
        this.playNoiseClick(0.02, this.musicVolume * 0.35);
      }
    }
  }

  playSynthNote(freq, type, duration, gainVal, vibrato = false) {
    if (!this.ctx || !this.enabled || !this.musicEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    if (vibrato) {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, now);
      lfoGain.gain.setValueAtTime(freq * 0.02, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + duration);
    }

    gain.gain.setValueAtTime(gainVal * this.musicVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  playNoiseClick(duration = 0.02, gainVal = 0.1) {
    if (!this.ctx || !this.enabled || !this.musicEnabled) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }
}

// Global audio singleton
window.spottedAudio = new SpottedAudio();
