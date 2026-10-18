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
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(1280, now + 0.07);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.28);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  playCatMeow() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(410, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.42);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.42);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  playCatHiss() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.32);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.32);
    filter.Q.setValueAtTime(3.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.26, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.32);
  }

  playCatScratch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.16);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playAyamPetok() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const clucks = [
      { t: 0.00, f1: 680, f2: 440, d: 0.06 },
      { t: 0.07, f1: 720, f2: 460, d: 0.06 },
      { t: 0.14, f1: 780, f2: 480, d: 0.07 }
    ];
    clucks.forEach(c => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = now + c.t;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(c.f1, st);
      osc.frequency.exponentialRampToValueAtTime(c.f2, st + c.d);
      gain.gain.setValueAtTime(0.28, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + c.d);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(st); osc.stop(st + c.d);
    });

    const screamOsc = this.ctx.createOscillator();
    const screamGain = this.ctx.createGain();
    const screamTime = now + 0.22;
    screamOsc.type = 'sawtooth';
    screamOsc.frequency.setValueAtTime(850, screamTime);
    screamOsc.frequency.linearRampToValueAtTime(1450, screamTime + 0.09);
    screamOsc.frequency.exponentialRampToValueAtTime(560, screamTime + 0.28);
    screamGain.gain.setValueAtTime(0.01, screamTime);
    screamGain.gain.linearRampToValueAtTime(0.35, screamTime + 0.04);
    screamGain.gain.exponentialRampToValueAtTime(0.001, screamTime + 0.28);
    screamOsc.connect(screamGain); screamGain.connect(this.ctx.destination);
    screamOsc.start(screamTime); screamOsc.stop(screamTime + 0.28);
  }

  playAyamFlap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.06;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.05);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  playKuntiLaugh() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chuckles = [
      { t: 0.00, f: 880, d: 0.08 },
      { t: 0.08, f: 940, d: 0.08 },
      { t: 0.16, f: 920, d: 0.08 },
      { t: 0.24, f: 960, d: 0.09 },
      { t: 0.33, f: 910, d: 0.09 },
      { t: 0.42, f: 840, d: 0.12 }
    ];
    chuckles.forEach(c => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const st = now + c.t;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f + 60, st);
      osc.frequency.exponentialRampToValueAtTime(c.f - 40, st + c.d);

      filter.type = 'peaking';
      filter.frequency.setValueAtTime(2800, st);
      filter.gain.setValueAtTime(8, st);

      gain.gain.setValueAtTime(0.01, st);
      gain.gain.linearRampToValueAtTime(0.24, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, st + c.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + c.d);
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
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });

    setTimeout(() => {
      this.playKuntiLaugh();
    }, 280);
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

  playBgmDrums(trackId, step, time) {
    if (trackId === 'gameplay' || trackId === 'koplo') {
      const s8 = step % 8;
      if (s8 === 0 || s8 === 6) this.playDrumHit('dut', time);
      if (s8 === 4 || s8 === 7) this.playDrumHit('tak', time);
      if (step % 2 === 0) this.playDrumHit('hat', time);
    } else {
      const s8 = step % 8;
      if (s8 === 0) this.playDrumHit('kick', time);
      if (s8 === 4) this.playDrumHit('tak', time);
      if (s8 === 2 || s8 === 6) this.playDrumHit('hat', time);
    }
  }

  playBgmStep(step, time) {
    const trackId = this.currentBgm || 'gameplay';
    const track = BGM_TRACKS[trackId] || BGM_TRACKS['gameplay'];
    const bassNote = track.bass[step % track.bass.length];
    const melNote = track.mel[step % track.mel.length];

    if (bassNote) {
      this.playTone(midiToFreq(bassNote), track.bassType, track.stepDuration * 0.9, 0.18, time);
    }
    if (melNote) {
      this.playTone(midiToFreq(melNote), track.melType, track.stepDuration * 0.85, 0.14, time);
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
    const stepDuration = track.stepDuration || 0.108;
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
