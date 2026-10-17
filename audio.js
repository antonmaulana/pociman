/**
 * Procedural Web Audio Sound Generator for Pociman
 * Zero external audio files required.
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.currentBgm = null;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmNextTime = 0;
    this.selectedBgmTrack = 'spooky';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.currentBgm) {
      this.stopBgm();
    }
    return this.isMuted;
  }

  playHop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  playDoubleJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playTrip() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Slide whistle down
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playBonk() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Metallic Pan / Sandal Bonk
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(480, now);
    osc1.frequency.exponentialRampToValueAtTime(140, now + 0.18);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(260, now);
    osc2.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  }

  playWarning() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1100, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playStageUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [349.23, 440.00, 523.25, 698.46]; // F4, A4, C5, F5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + (idx * 0.06);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.18);
    });
  }

  playWin() {

    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C E G C E
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + (idx * 0.08);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });
  }

  playCaught() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [320, 290, 260, 210];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + (idx * 0.12);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.15);
    });
  }

  playBrawlBeatdown() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const hits = [
      { t: 0.05, f: 160, type: 'square' },
      { t: 0.22, f: 380, type: 'triangle' },
      { t: 0.45, f: 120, type: 'square' },
      { t: 0.68, f: 440, type: 'sawtooth' },
      { t: 0.92, f: 180, type: 'square' },
      { t: 1.15, f: 310, type: 'triangle' },
      { t: 1.40, f: 520, type: 'sawtooth' },
      { t: 1.65, f: 90, type: 'square' }
    ];

    hits.forEach(h => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + h.t;

      osc.type = h.type;
      osc.frequency.setValueAtTime(h.f, time);
      osc.frequency.exponentialRampToValueAtTime(h.f * 0.4, time + 0.12);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.14);
    });
  }

  playTaunt() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.linearRampToValueAtTime(780, now + 0.07);
    osc.frequency.setValueAtTime(540, now + 0.08);
    osc.frequency.linearRampToValueAtTime(820, now + 0.16);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  playGateSlam() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  playStageClear() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [392.00, 440.00, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + (idx * 0.08);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    });
  }

  playCatScreech() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.28);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15, time = null) {
    if (this.isMuted || !freq) return;
    this.init();
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  playDrumHit(type, time = null) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    if (type === 'kick' || type === 'dut') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'dut' ? 140 : 120, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.13);
    } else if (type === 'tak' || type === 'hat') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(type === 'tak' ? 680 : 1200, t);
      osc.frequency.exponentialRampToValueAtTime(type === 'tak' ? 180 : 600, t + 0.05);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.06);
    }
  }

  playBgmStep(step, time) {
    const bass = [110.00, 0, 220.00, 0, 110.00, 0, 196.00, 0, 110.00, 0, 220.00, 0, 164.81, 0, 196.00, 0];
    const mel = [440.00, 0, 523.25, 0, 659.25, 622.25, 587.33, 0, 523.25, 0, 440.00, 0, 392.00, 0, 440.00, 0];
    if (bass[step]) this.playTone(bass[step], 'sawtooth', 0.12, 0.16, time);
    if (mel[step]) this.playTone(mel[step], 'square', 0.10, 0.12, time);
    if (step % 4 === 0) this.playDrumHit('kick', time);
    if (step % 4 === 2) this.playDrumHit('hat', time);
    if (step === 4 || step === 12) this.playDrumHit('tak', time);
  }

  playBgm(trackId = 'spooky') {
    this.stopBgm();
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    this.currentBgm = trackId || 'spooky';
    this.bgmStep = 0;
    this.bgmNextTime = this.ctx.currentTime + 0.05;

    this.bgmTimer = setInterval(() => {
      this.tickBgm();
    }, 40);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentBgm = null;
  }

  tickBgm() {
    if (!this.ctx || this.isMuted || !this.currentBgm) return;
    const stepDuration = 0.12;
    while (this.bgmNextTime < this.ctx.currentTime + 0.16) {
      const s = this.bgmStep % 16;
      this.playBgmStep(s, this.bgmNextTime);
      this.bgmNextTime += stepDuration;
      this.bgmStep++;
    }
  }
}

window.soundManager = new SoundManager();
