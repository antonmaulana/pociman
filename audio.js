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
    this.selectedBgmTrack = (typeof localStorage !== 'undefined' && localStorage.getItem('pociman_bgm')) || 'koplo';
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
    [1080, 1170].forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 1.35, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.30);
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.30);
    });
  }

  playCatMeow() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(5.5, now);
    lfoGain.gain.setValueAtTime(22, now);
    lfo.connect(osc.frequency);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.linearRampToValueAtTime(740, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.48);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, now);
    filter.frequency.linearRampToValueAtTime(1550, now + 0.18);
    filter.frequency.exponentialRampToValueAtTime(420, now + 0.48);
    filter.Q.setValueAtTime(2.8, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.28);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.50);

    osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
    lfo.start(now); lfo.stop(now + 0.50);
    osc.start(now); osc.stop(now + 0.50);
  }

  playCatHiss() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.30);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.30);
    filter.Q.setValueAtTime(3.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);

    noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
    noise.start(now); noise.stop(now + 0.30);
  }

  playCatScratch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [0.00, 0.06, 0.12].forEach((dt, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = now + dt;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800 - idx * 200, st);
      osc.frequency.exponentialRampToValueAtTime(280, st + 0.05);
      gain.gain.setValueAtTime(0.32, st);
      gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.05);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(st); osc.stop(st + 0.05);
    });
  }

  playAyamPetok() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Rapid staccato impulse clucks (KOK - KOK - KOK)
    [0.00, 0.07, 0.14].forEach(dt => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const st = now + dt;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(820, st);
      osc.frequency.exponentialRampToValueAtTime(380, st + 0.05);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1450, st);
      filter.Q.setValueAtTime(3.0, st);
      gain.gain.setValueAtTime(0.30, st);
      gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.05);
      osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
      osc.start(st); osc.stop(st + 0.05);
    });

    // 2. High screaming squawk (PETOOOOKKK!)
    const sqOsc = this.ctx.createOscillator();
    const sqGain = this.ctx.createGain();
    const sqFilter = this.ctx.createBiquadFilter();
    const sqTime = now + 0.20;
    sqOsc.type = 'sawtooth';
    sqOsc.frequency.setValueAtTime(700, sqTime);
    sqOsc.frequency.linearRampToValueAtTime(1380, sqTime + 0.08);
    sqOsc.frequency.exponentialRampToValueAtTime(520, sqTime + 0.32);
    sqFilter.type = 'bandpass';
    sqFilter.frequency.setValueAtTime(1850, sqTime);
    sqFilter.Q.setValueAtTime(3.2, sqTime);
    sqGain.gain.setValueAtTime(0.01, sqTime);
    sqGain.gain.linearRampToValueAtTime(0.38, sqTime + 0.04);
    sqGain.gain.exponentialRampToValueAtTime(0.0001, sqTime + 0.32);
    sqOsc.connect(sqFilter); sqFilter.connect(sqGain); sqGain.connect(this.ctx.destination);
    sqOsc.start(sqTime); sqOsc.stop(sqTime + 0.32);
  }

  playAyamFlap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.05;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.045);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.045);
    }
  }

  playKuntiLaugh() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const giggles = [
      { t: 0.00, f: 1080, d: 0.07 },
      { t: 0.08, f: 1190, d: 0.07 },
      { t: 0.16, f: 1150, d: 0.07 },
      { t: 0.24, f: 1260, d: 0.08 },
      { t: 0.33, f: 1200, d: 0.09 },
      { t: 0.43, f: 1040, d: 0.32, glide: true }
    ];

    giggles.forEach(g => {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      const st = now + g.t;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(g.f, st);
      if (g.glide) {
        osc.frequency.exponentialRampToValueAtTime(680, st + g.d);
      } else {
        osc.frequency.linearRampToValueAtTime(g.f + 40, st + g.d * 0.4);
      }
      filter.type = 'peaking';
      filter.frequency.setValueAtTime(2600, st);
      filter.gain.setValueAtTime(9, st);
      gain.gain.setValueAtTime(0.01, st);
      gain.gain.linearRampToValueAtTime(0.28, st + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, st + g.d);
      osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
      osc.start(st); osc.stop(st + g.d);
    });
  }

  playKuntiRescue() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chimes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chimes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.07;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.20, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.35);
    });
    setTimeout(() => {
      this.playKuntiLaugh();
    }, 280);
  }

  playMarimbaNote(freq, dur = 0.12, gainVal = 0.16, time = null) {
    if (this.isMuted || !freq) return;
    this.init();
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);
    gain1.gain.setValueAtTime(gainVal, t);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc1.connect(gain1); gain1.connect(this.ctx.destination);
    osc1.start(t); osc1.stop(t + dur);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, t);
    gain2.gain.setValueAtTime(gainVal * 0.45, t);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.045, dur * 0.4));
    osc2.connect(gain2); gain2.connect(this.ctx.destination);
    osc2.start(t); osc2.stop(t + 0.05);
  }

  playKoploLead(freq, dur = 0.10, gainVal = 0.15, time = null) {
    if (this.isMuted || !freq) return;
    this.init();
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 0.94, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.02);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(3200, freq * 3.5), t);
    filter.Q.setValueAtTime(2.5, t);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(gainVal, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + dur);
  }

  playKoploBass(freq, dur = 0.12, gainVal = 0.20, time = null) {
    if (this.isMuted || !freq) return;
    this.init();
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, t);
    filter.frequency.exponentialRampToValueAtTime(140, t + dur);
    filter.Q.setValueAtTime(3.0, t);

    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + dur);
  }

  playKendangHit(type, t) {
    if (type === 'dut') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(48, t + 0.18);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.20);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.20);
    } else if (type === 'tak') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.045);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.05);
    } else if (type === 'tung') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.09);
      gain.gain.setValueAtTime(0.20, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.10);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.10);
    }
  }

  playTiptoeHit(type, t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    if (type === 'woodblock') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(980, t);
      osc.frequency.exponentialRampToValueAtTime(650, t + 0.04);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.045);
    } else if (type === 'hat') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1600, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.03);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.035);
    }
  }

  playDrumHit(type, time = null) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    if (type === 'dut' || type === 'tak' || type === 'tung') {
      this.playKendangHit(type, t);
    } else {
      this.playTiptoeHit(type, t);
    }
  }

  playBgmDrums(trackId, step, time) {
    if (trackId === 'gameplay' || trackId === 'koplo') {
      const s8 = step % 8;
      if (s8 === 0 || s8 === 6) this.playDrumHit('dut', time);
      if (s8 === 4 || s8 === 7) this.playDrumHit('tak', time);
      if (s8 === 2) this.playDrumHit('tung', time);
      if (step % 2 === 0) this.playDrumHit('hat', time);
    } else {
      const s8 = step % 8;
      if (s8 === 0 || s8 === 4) this.playDrumHit('woodblock', time);
      if (s8 === 2 || s8 === 6) this.playDrumHit('hat', time);
    }
  }

  playBgmStep(step, time) {
    const trackId = this.currentBgm || 'gameplay';
    const track = BGM_TRACKS[trackId] || BGM_TRACKS['gameplay'];
    const bassNote = track.bass[step % track.bass.length];
    const melNote = track.mel[step % track.mel.length];

    if (bassNote) {
      if (trackId === 'menu') {
        this.playMarimbaNote(midiToFreq(bassNote), track.stepDuration * 0.9, 0.20, time);
      } else {
        this.playKoploBass(midiToFreq(bassNote), track.stepDuration * 0.95, 0.22, time);
      }
    }
    if (melNote) {
      if (trackId === 'menu') {
        this.playMarimbaNote(midiToFreq(melNote), track.stepDuration * 0.85, 0.18, time);
      } else {
        this.playKoploLead(midiToFreq(melNote), track.stepDuration * 0.90, 0.16, time);
      }
    }
    this.playBgmDrums(trackId, step, time);
  }

  playBgm(trackId = 'gameplay') {
    const target = trackId || 'gameplay';
    if (this.currentBgm === target && this.bgmTimer) return;
    this.stopBgm();
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    this.currentBgm = target;
    this.bgmStep = 0;
    this.bgmNextTime = this.ctx.currentTime + 0.05;

    this.bgmTimer = setInterval(() => {
      this.tickBgm();
    }, 35);
  }

  playMenuBgm() {
    this.playBgm('menu');
  }

  playGameplayBgm() {
    this.playBgm('gameplay');
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
    const track = BGM_TRACKS[this.currentBgm] || BGM_TRACKS['gameplay'];
    const stepDuration = track.stepDuration || 0.106;

    if (this.bgmNextTime < this.ctx.currentTime - 0.25) {
      this.bgmNextTime = this.ctx.currentTime + 0.05;
    }

    while (this.bgmNextTime < this.ctx.currentTime + 0.16) {
      const s = this.bgmStep % 128;
      this.playBgmStep(s, this.bgmNextTime);
      this.bgmNextTime += stepDuration;
      this.bgmStep++;
    }
  }
}

function midiToFreq(m) {
  return m ? 440 * Math.pow(2, (m - 69) / 12) : 0;
}

const BGM_TRACKS = {
  menu: {
    name: 'Tiptoe Pocong Ronda (Menu)',
    stepDuration: 0.125,
    bassType: 'triangle',
    melType: 'sine',
    bass: [
      48,0,55,0, 48,0,55,0, 48,0,55,0, 48,0,55,0,
      48,0,55,0, 48,0,55,0, 48,0,55,0, 48,0,55,0,
      41,0,48,0, 41,0,48,0, 41,0,48,0, 41,0,48,0,
      43,0,50,0, 43,0,50,0, 43,0,50,0, 43,0,50,0,
      48,0,55,0, 48,0,55,0, 48,0,55,0, 48,0,55,0,
      45,0,52,0, 45,0,52,0, 41,0,48,0, 41,0,48,0,
      43,0,50,0, 43,0,50,0, 43,0,50,0, 43,0,50,0,
      48,0,52,0, 55,0,52,0, 48,0,55,0, 48,0,0,0
    ],
    mel: [
      72,0,71,72, 75,0,72,0, 71,0,68,0, 69,0,72,0,
      72,0,71,72, 75,0,72,0, 74,75,74,72, 69,0,72,0,
      74,0,73,74, 77,0,74,0, 72,0,69,0, 71,0,72,0,
      71,0,70,71, 74,0,71,0, 68,0,69,71, 72,71,69,0,
      72,0,71,72, 75,0,72,0, 76,0,74,0, 72,0,69,0,
      77,0,76,77, 81,0,77,0, 76,0,74,72, 74,0,76,0,
      74,0,73,74, 77,0,74,0, 71,0,74,0, 72,0,71,0,
      69,71,72,74, 75,74,72,71, 69,68,69,71, 72,0,0,0
    ]
  },
  gameplay: {
    name: 'Koplo Slapstick Pociman (Chase)',
    stepDuration: 0.106,
    bassType: 'sawtooth',
    melType: 'triangle',
    bass: [
      45,0,45,0, 40,0,45,0, 48,0,45,0, 40,0,45,0,
      45,0,45,0, 40,0,45,0, 48,0,45,0, 40,0,45,0,
      43,0,43,0, 38,0,43,0, 47,0,43,0, 38,0,43,0,
      40,0,40,0, 35,0,40,0, 44,0,40,0, 35,0,40,0,
      45,0,45,0, 40,0,45,0, 48,0,45,0, 40,0,45,0,
      41,0,41,0, 36,0,41,0, 45,0,41,0, 36,0,41,0,
      43,0,43,0, 38,0,43,0, 40,0,40,0, 35,0,40,0,
      40,0,40,0, 44,0,40,0, 35,0,40,0, 44,0,47,0
    ],
    mel: [
      69,0,72,0, 76,74,72,0, 69,0,72,74, 72,0,69,0,
      69,0,72,0, 76,74,72,0, 74,76,74,72, 69,0,72,0,
      74,0,77,0, 76,74,72,0, 71,0,72,74, 76,0,71,0,
      71,0,74,0, 72,71,69,0, 68,0,69,71, 72,71,69,0,
      76,0,79,0, 81,79,76,0, 77,0,76,74, 72,0,69,0,
      77,0,81,0, 79,77,76,0, 74,0,76,77, 76,0,72,0,
      74,0,77,0, 76,74,72,0, 71,0,74,0, 72,0,71,0,
      69,71,72,74, 76,74,72,71, 69,68,69,71, 72,74,76,0
    ]
  }
};
BGM_TRACKS.koplo = BGM_TRACKS.gameplay;
BGM_TRACKS.circus = BGM_TRACKS.menu;

window.BGM_TRACKS = BGM_TRACKS;
window.soundManager = new SoundManager();
