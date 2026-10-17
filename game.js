/**
 * Pociman: Kabur dari Warga Kampung
 * Hilarious 2D Indonesian Village Pursuit Game with Stage 1-100 Progression
 */

(function () {
  'use strict';

  // --- Canvas & Context ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // --- UI Elements ---
  const stageValEl = document.getElementById('stageVal');
  const stageTimeValEl = document.getElementById('stageTimeVal');
  const stageBannerEl = document.getElementById('stageBanner');
  const stageBannerTextEl = document.getElementById('stageBannerText');
  const bumpCountEl = document.getElementById('bumpCount');
  const distanceValEl = document.getElementById('distanceVal');
  const tpuBarEl = document.getElementById('tpuBar');
  const tpuPinEl = document.getElementById('tpuPin');
  const escapeBarEl = document.getElementById('escapeBar');
  const dangerPinEl = document.getElementById('dangerPin');
  const dangerLabelEl = document.getElementById('dangerLabel');
  const throwWarningEl = document.getElementById('throwWarning');

  const startScreen = document.getElementById('startScreen');
  const stageClearScreen = document.getElementById('stageClearScreen');
  const victoryScreen = document.getElementById('victoryScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const pauseScreen = document.getElementById('pauseScreen');
  const creditsScreen = document.getElementById('creditsScreen');

  const startBtn = document.getElementById('startBtn');
  const creditsBtn = document.getElementById('creditsBtn');
  const closeCreditsBtn = document.getElementById('closeCreditsBtn');

  const nextStageBtn = document.getElementById('nextStageBtn');
  const replayStageBtn = document.getElementById('replayStageBtn');
  const resetStage1Btn = document.getElementById('resetStage1Btn');
  const winPlayAgainBtn = document.getElementById('winPlayAgainBtn');
  const restartBtn = document.getElementById('restartBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const soundBtn = document.getElementById('soundBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const lockLandscapeBtn = document.getElementById('lockLandscapeBtn');

  const stageClearTitleEl = document.getElementById('stageClearTitle');
  const stageClearTimeEl = document.getElementById('stageClearTime');
  const stageClearBumpsEl = document.getElementById('stageClearBumps');
  const stageClearDodgesEl = document.getElementById('stageClearDodges');

  const winDistanceEl = document.getElementById('winDistance');
  const winStageEl = document.getElementById('winStage');
  const winBumpsEl = document.getElementById('winBumps');
  const winRankEl = document.getElementById('winRank');
  const finalStageEl = document.getElementById('finalStage');
  const finalDistanceEl = document.getElementById('finalDistance');
  const finalBumpsEl = document.getElementById('finalBumps');
  const deathReasonEl = document.getElementById('deathReason');

  // --- Constants ---
  const V_WIDTH = 960;
  const V_HEIGHT = 540;
  const GROUND_Y = 440;
  const GRAVITY = 1580;
  const JUMP_FORCE = -630;
  const DOUBLE_JUMP_FORCE = -540;
  const TOTAL_STAGES = 25;

  // --- Game State ---
  const STATE = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    VICTORY: 3,
    GAMEOVER: 4,
    STAGECLEAR: 5,
    BUSTED: 6
  };
  let gameState = STATE.MENU;

  const bustedCutscene = {
    timer: 0,
    duration: 2.3,
    dustPuffs: [],
    comicPops: []
  };

  let lastTime = 0;
  let gameSpeed = 340;
  let distance = 0;
  let stage = 1;
  let stageBannerTimer = 0;
  let stageTimer = 45;
  let stageTotalTime = 45;
  let escapeGap = 50; // 0% (caught) to 100% (escaped!)
  let bumpCount = 0;
  let dodgedThrows = 0;

  let highestStage = 1;
  try {
    highestStage = parseInt(localStorage.getItem('pociman_highest_stage') || '1', 10);
    if (isNaN(highestStage) || highestStage < 1) highestStage = 1;
  } catch (e) {
    highestStage = 1;
  }

  function getStageDuration(stg) {
    return stg <= 5 ? 45 : 60;
  }

  // Cemetery Finish Gate (TPU)
  const cemeteryGate = {
    x: -999,
    active: false,
    entered: false
  };

  // Timers
  let throwTimer = 3.5;
  let warningActive = false;
  let obstacleTimer = 2.0;

  // Villager shouts
  const VILLAGER_SHOUTS = [
    "TANGKEEEP!",
    "HOI BALIKIN AYAM GUA!",
    "JANGAN KASIH LOLOS!",
    "POCIMAN NGEPET KAH ITU?!",
    "AMPUN PAK RT CEPET BANGET!",
    "HANSIP, KEPUNG DARI KANAN!",
    "AWAS KENA JEMURAN, MAK!"
  ];
  let currentShout = "";
  let shoutTimer = 0;

  // Scenery arrays
  let stars = [];
  let houses = [];
  let bananaTrees = [];
  let fireflies = [];
  let obstacles = [];
  let thrownItems = [];
  let particles = [];
  let comicTexts = [];

  // --- Pociman Player ---
  const PLAYER_X = 550;

  const player = {
    x: PLAYER_X,
    y: GROUND_Y - 96,
    w: 48,
    h: 96,
    vy: 0,
    isGrounded: true,
    canDoubleJump: false,
    hopTime: 0,
    animTime: 0,

    tripTimer: 0,
    hitTimer: 0,
    slowTimer: 0,
    bumpLevel: 0,
    invulnerableTime: 0,
    spinAngle: 0,
    tauntTimer: 0,
    tauntText: '',
    tauntIsShort: false,

    reset() {
      this.x = PLAYER_X;
      this.y = GROUND_Y - 96;
      this.vy = 0;
      this.isGrounded = true;
      this.canDoubleJump = false;
      this.hopTime = 0;
      this.animTime = 0;
      this.tripTimer = 0;
      this.hitTimer = 0;
      this.slowTimer = 0;
      this.bumpLevel = 0;
      this.invulnerableTime = 0;
      this.spinAngle = 0;
      this.tauntTimer = 0;
      this.tauntText = '';
      this.tauntIsShort = false;
    },

    jump() {
      if (this.tripTimer > 0) return;

      if (this.isGrounded) {
        this.vy = JUMP_FORCE;
        this.isGrounded = false;
        this.canDoubleJump = true;
        window.soundManager.playHop();
        createDust(this.x + 24, GROUND_Y);
      } else if (this.canDoubleJump) {
        this.vy = DOUBLE_JUMP_FORCE;
        this.canDoubleJump = false;
        this.spinAngle = Math.PI * 2;
        window.soundManager.playDoubleJump();
        createWindBurst(this.x + 24, this.y + 60);
      }
    },

    update(dt) {
      this.animTime += dt * 8;
      this.hopTime += dt * 9;

      if (this.invulnerableTime > 0) this.invulnerableTime -= dt;
      if (this.tripTimer > 0) this.tripTimer -= dt;
      if (this.hitTimer > 0) this.hitTimer -= dt;
      if (this.slowTimer > 0) this.slowTimer -= dt;
      if (this.tauntTimer > 0) this.tauntTimer -= dt;

      if (this.spinAngle > 0) {
        this.spinAngle = Math.max(0, this.spinAngle - dt * 16);
      }

      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;

      if (this.y >= GROUND_Y - this.h) {
        this.y = GROUND_Y - this.h;
        this.vy = 0;
        this.isGrounded = true;
        this.canDoubleJump = false;
        this.spinAngle = 0;
      }
    },

    draw(ctx) {
      if (this.invulnerableTime > 0 && Math.floor(this.invulnerableTime * 14) % 2 === 0) {
        return;
      }

      ctx.save();
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

      if (this.tripTimer > 0) {
        drawPocimanCrawlingUlat(ctx, this);
        ctx.restore();
        return;
      }

      if (this.spinAngle > 0) {
        ctx.rotate(this.spinAngle);
      } else if (this.tauntTimer > 0) {
        ctx.rotate(0.06);
      } else if (this.slowTimer > 0) {
        ctx.rotate(Math.sin(this.animTime * 12) * 0.14);
      } else if (this.isGrounded) {
        ctx.rotate(Math.sin(this.hopTime) * 0.08);
      }

      drawPocimanHopping(ctx, this);
      ctx.restore();

      if (this.tauntTimer > 0 && this.tauntText) {
        const bubbleX = this.x + this.w / 2;
        const bubbleY = GROUND_Y - 118;
        drawTauntSpeechBubble(ctx, bubbleX, bubbleY, this.tauntText, this.tauntIsShort);
      }
    }
  };

  // --- Visuals: Vector Cartoon 3-Sack Pociman (From Image Reference) ---
  function drawPocimanHopping(ctx, p) {
    const squash = p.isGrounded ? Math.sin(p.hopTime) * 3 : 0;

    drawPocimanThreeSacks(ctx, p, squash);
    drawPocimanKnotsAndRopes(ctx, p);
    drawPocimanDiamondFace(ctx, p);
    drawPocimanEyesAndMouth(ctx, p);

    if (p.bumpLevel > 0) {
      drawPocimanBumps(ctx, p);
    }
  }

  function drawPocimanThreeSacks(ctx, p, squash) {
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.4;

    // 1. Lower Sack (Tapering teardrop pouch)
    ctx.fillStyle = '#dfd7ce';
    ctx.beginPath();
    ctx.moveTo(-16, 17);
    ctx.bezierCurveTo(-19, 27, -8, 38 + squash, 0, 42 + squash);
    ctx.bezierCurveTo(8, 38 + squash, 19, 27, 16, 17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Middle Sack (Dumpling Torso Pouch)
    ctx.fillStyle = '#dfd7ce';
    ctx.beginPath();
    ctx.ellipse(0, 8, 19, 13 + squash * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. Top Sack (Bulbous Head Sphere)
    ctx.fillStyle = '#dfd7ce';
    ctx.beginPath();
    ctx.arc(0, -20, 18.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Subtle curved fabric shadow & highlight accents
    ctx.strokeStyle = '#c5baa8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(8, -18, 15, 0.2, Math.PI * 0.6);
    ctx.arc(10, 8, 14, 0.2, Math.PI * 0.6);
    ctx.stroke();
  }

  function drawPocimanKnotsAndRopes(ctx, p) {
    ctx.strokeStyle = '#3e352d';
    ctx.fillStyle = '#7d7062'; // Rope color
    ctx.lineWidth = 2.2;

    // A. Neck Rope Tie & bunching wrinkles
    ctx.beginPath();
    ctx.roundRect(-8, -4, 16, 4.5, 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#998a7c';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-5, -6); ctx.lineTo(-4, -4);
    ctx.moveTo(0, -7); ctx.lineTo(0, -4);
    ctx.moveTo(5, -6); ctx.lineTo(4, -4);
    ctx.moveTo(-4, 0); ctx.lineTo(-5, 3);
    ctx.moveTo(4, 0); ctx.lineTo(5, 3);
    ctx.stroke();

    // B. Waist Rope Tie
    ctx.strokeStyle = '#3e352d';
    ctx.fillStyle = '#7d7062';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-8, 17, 16, 4.5, 2);
    ctx.fill();
    ctx.stroke();

    // C. Top Crown Knot (Star-like Fabric Rosette)
    const wiggle = Math.sin(p.animTime * 2) * 4;
    ctx.fillStyle = '#dfd7ce';
    ctx.beginPath();
    ctx.moveTo(-6, -37);
    ctx.lineTo(-10 + wiggle, -45);
    ctx.lineTo(-4 + wiggle, -42);
    ctx.lineTo(0 + wiggle, -49);
    ctx.lineTo(4 + wiggle, -42);
    ctx.lineTo(10 + wiggle, -45);
    ctx.lineTo(6, -37);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7d7062';
    ctx.fillRect(-5, -38, 10, 3.5);
    ctx.strokeRect(-5, -38, 10, 3.5);

    // D. Bottom Tail Star Ruffle (Flared Star Fabric)
    const tailWiggle = p.tauntTimer > 0 ? Math.sin(p.animTime * 20) * 8 : 0;
    ctx.fillStyle = '#dfd7ce';
    ctx.beginPath();
    ctx.moveTo(0, 42);
    ctx.lineTo(-8 + tailWiggle, 52);
    ctx.lineTo(-3 + tailWiggle, 48);
    ctx.lineTo(0 + tailWiggle, 55);
    ctx.lineTo(3 + tailWiggle, 48);
    ctx.lineTo(8 + tailWiggle, 52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7d7062';
    ctx.fillRect(-4, 42, 8, 3);
    ctx.strokeRect(-4, 42, 8, 3);
  }

  function drawPocimanDiamondFace(ctx, p) {
    // Slate Blue-Grey Diamond Face Cutout from reference image
    ctx.fillStyle = '#758392';
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.moveTo(0, -34);  // Top peak
    ctx.lineTo(12, -20); // Right corner
    ctx.lineTo(0, -7);   // Bottom point
    ctx.lineTo(-12, -20);// Left corner
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function drawPocimanEyesAndMouth(ctx, p) {
    const faceY = -20;
    if (p.hitTimer > 0) {
      drawFaceHit(ctx, p, faceY);
    } else if (p.tauntTimer > 0) {
      drawFaceTaunt(ctx, p, faceY);
    } else {
      drawFacePanic(ctx, p, faceY);
    }
  }

  function drawFaceHit(ctx, p, faceY) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(-7, faceY, 9.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(7, faceY, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-10, faceY - 3); ctx.lineTo(-4, faceY + 3);
    ctx.moveTo(-4, faceY - 3); ctx.lineTo(-10, faceY + 3);
    ctx.stroke();

    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(7, faceY, 2, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-7, -9);
    ctx.quadraticCurveTo(-2, -14, 0, -8);
    ctx.quadraticCurveTo(3, -5, 7, -10);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -9, 4, 4.5);
    ctx.strokeRect(-2, -9, 4, 4.5);
  }

  function drawFaceTaunt(ctx, p, faceY) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(-7, faceY, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(-11, faceY, 2.6, 0, Math.PI * 2); ctx.fill();

    ctx.beginPath(); ctx.arc(7, faceY, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(3, faceY - 2); ctx.lineTo(8, faceY + 2); ctx.lineTo(12, faceY - 2);
    ctx.stroke();

    ctx.fillStyle = '#7f1d1d';
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -11, 7.5, 0.1, Math.PI - 0.1);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    const tongueWobble = Math.sin(p.animTime * 20) * 1.8;
    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(-4, -6 + tongueWobble, 6, 4.5, -0.35, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }

  function drawFacePanic(ctx, p, faceY) {
    const isExtreme = escapeGap < 40 || warningActive;
    const jitter = Math.sin(p.animTime * 24) * (isExtreme ? 2 : 1.1);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(-7, faceY, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(7, faceY, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#3e352d';
    const pupilR = isExtreme ? 1.8 : 2.5;
    ctx.beginPath();
    ctx.arc(-8 + jitter, faceY, pupilR, 0, Math.PI * 2);
    ctx.arc(6 + jitter, faceY, pupilR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7f1d1d';
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2;
    const mouthH = isExtreme ? 10 : 7;
    ctx.beginPath();
    ctx.roundRect(-5.5, -14, 11, mouthH, [2, 2, 5, 5]);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#f472b6';
    ctx.beginPath(); ctx.arc(0, -14 + mouthH - 2, 3, 0, Math.PI); ctx.fill();

    drawPocimanPanicSweat(ctx, p, isExtreme);
  }

  function drawPocimanPanicSweat(ctx, p, isExtreme) {
    const count = isExtreme ? 3 : 2;
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;

    for (let i = 0; i < count; i++) {
      const cycle = (p.animTime * 6 + i * 2.2) % 4;
      const sx = -14 - cycle * 5;
      const sy = -28 + (i * 8) - cycle * 3;
      const r = Math.max(1, 3.2 - cycle * 0.6);

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
  }

  function drawPocimanBumps(ctx, p) {
    const pulse = Math.sin(p.animTime * 6) * 1.8;
    const bumpX = -10;
    const bumpY = -48;

    // Bump 1: Red throbbing lump
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(bumpX, bumpY, 8 + pulse, 7 + pulse, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bump 2: Ice pack + bandaid
    if (p.bumpLevel >= 2) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(bumpX - 2, bumpY - 10, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(bumpX - 8, bumpY - 12, 12, 4);
    }

    // Bump 3: Tower tier + circling stars
    if (p.bumpLevel >= 3) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.ellipse(bumpX - 1, bumpY - 18, 6, 5, 0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      const birdAngle = p.animTime * 3.5;
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('⭐', bumpX + Math.cos(birdAngle) * 16, bumpY - 22 + Math.sin(birdAngle) * 6);
      ctx.fillText('💫', bumpX + Math.cos(birdAngle + Math.PI) * 16, bumpY - 22 + Math.sin(birdAngle + Math.PI) * 6);
    }
  }

  function drawPocimanCrawlingUlat(ctx, p) {
    const cycle = p.animTime * 14;
    const hump = Math.abs(Math.sin(cycle)) * 14;
    const stretch = Math.cos(cycle) * 6;

    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.4;

    // 1. Lower Sack (Tail on ground pushing forward)
    ctx.fillStyle = '#dfd7ce';
    ctx.beginPath();
    ctx.ellipse(-26 + stretch * 0.5, 30, 16, 10, 0.1, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Bottom Tail Star Ruffle wiggling
    const tailWiggle = Math.sin(cycle * 1.5) * 6;
    ctx.beginPath();
    ctx.moveTo(-42 + stretch * 0.5, 30);
    ctx.lineTo(-50, 24 + tailWiggle);
    ctx.lineTo(-46, 30);
    ctx.lineTo(-52, 36 + tailWiggle);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // 2. Middle Sack (High Arched Torso Hump)
    ctx.beginPath();
    ctx.ellipse(-6, 26 - hump, 17, 13, 0.3 * Math.sin(cycle), 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // 3. Head Sack (Pulling forward on ground)
    const headX = 18 - stretch * 0.5;
    ctx.beginPath();
    ctx.ellipse(headX, 30, 18, 14, -0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Crown knot on head wiggling
    ctx.beginPath();
    ctx.moveTo(headX + 16, 26);
    ctx.lineTo(headX + 26, 20 + tailWiggle);
    ctx.lineTo(headX + 22, 28);
    ctx.lineTo(headX + 27, 34 + tailWiggle);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    drawCrawlFace(ctx, p, headX, 30);

    if (Math.random() < 0.35) {
      createDust(p.x - 20, GROUND_Y);
    }
  }

  function drawCrawlFace(ctx, p, hx, hy) {
    ctx.fillStyle = '#758392';
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx, hy - 11); ctx.lineTo(hx + 10, hy); ctx.lineTo(hx, hy + 9); ctx.lineTo(hx - 10, hy);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(hx - 5, hy - 2, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx + 5, hy - 2, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(hx - 8, hy - 2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + 2, hy - 2, 2.2, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(hx - 2, hy + 8, 5.5, 3.2, 0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(hx - 14, hy - 8, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  function drawTauntSpeechBubble(ctx, x, y, text, isShort = false) {
    if (!text) return;
    ctx.save();
    ctx.font = 'bold 14px sans-serif';
    const textW = ctx.measureText(text).width;
    const bw = textW + 24;
    const bh = 28;
    const bx = Math.min(V_WIDTH - bw - 10, Math.max(10, x - bw / 2));
    const by = y - bh;

    ctx.fillStyle = isShort ? '#dcfce7' : '#fef08a';
    ctx.strokeStyle = isShort ? '#15803d' : '#854d0e';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 6, by + bh);
    ctx.lineTo(x, by + bh + 8);
    ctx.lineTo(x + 6, by + bh);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isShort ? '#14532d' : '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + bw / 2, by + bh / 2);
    ctx.restore();
  }


  function getWargaX() {
    const wargaMinX = -170;
    const wargaMaxX = player.x - 90;
    const gapRatio = (100 - escapeGap) / 100;
    return wargaMinX + gapRatio * (wargaMaxX - wargaMinX);
  }

  // --- Visuals: 2D Semi-Realistic Villagers (Warga Mob) ---
  function drawVillagersMob(ctx, wargaX, currentStage) {
    if (wargaX < -220) return;

    ctx.save();
    ctx.translate(wargaX, GROUND_Y);

    // Warm radial torchlight illumination
    const glowRad = 190 + Math.min(60, currentStage);
    const torchGlow = ctx.createRadialGradient(80, -70, 25, 80, -70, glowRad);
    torchGlow.addColorStop(0, 'rgba(251, 146, 60, 0.45)');
    torchGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = torchGlow;
    ctx.fillRect(-80, -220, 360, 270);

    // Background crowd layer for high stages
    if (currentStage >= 25) {
      drawCrowdSilhouette(ctx, currentStage);
    }

    // Main Foreground Characters
    drawPemuda(ctx, 45, 0);
    drawPakRT(ctx, 0, 0);
    drawEmak(ctx, -45, 0);

    if (currentStage >= 10) {
      drawHansip(ctx, -90, 0);
    }
    if (currentStage >= 40) {
      drawBocilSarung(ctx, 90, 0);
    }

    // Comic speech bubble
    if (shoutTimer > 0 && currentShout) {
      drawSpeechBubble(ctx, 55, -145, currentShout);
    }

    ctx.restore();
  }

  function drawCrowdSilhouette(ctx, stg) {
    const crowdCount = Math.min(8, Math.floor(stg / 15));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    for (let i = 0; i < crowdCount; i++) {
      const cx = -120 - (i * 24);
      ctx.beginPath();
      ctx.arc(cx, -70, 9, 0, Math.PI * 2);
      ctx.fillRect(cx - 7, -61, 14, 30);
      ctx.fill();
      // Distant torch
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx + 8, -82, 4, 18);
      ctx.beginPath();
      ctx.arc(cx + 10, -84, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    }
  }

  function drawPemuda(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.2;

    // Legs & Green Plaid Sarung
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-7, -24, 6, 24); ctx.strokeRect(-7, -24, 6, 24);
    ctx.fillRect(4, -24, 6, 24); ctx.strokeRect(4, -24, 6, 24);
    ctx.fillStyle = '#15803d';
    ctx.beginPath(); ctx.roundRect(-12, -48, 25, 26, 4); ctx.fill(); ctx.stroke();

    // Kaos Singlet & Round Chibi Torso
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.roundRect(-10, -70, 22, 24, 6); ctx.fill(); ctx.stroke();

    // Chibi Head & Spiky Hair
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath(); ctx.arc(1, -78, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.moveTo(-9, -82); ctx.lineTo(-12, -92); ctx.lineTo(-4, -86);
    ctx.lineTo(1, -94);  ctx.lineTo(6, -86);  ctx.lineTo(12, -90);
    ctx.lineTo(9, -80);  ctx.closePath(); ctx.fill(); ctx.stroke();

    // Googly Eyes & Shouting Mouth
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-3, -78, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(5, -78, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(-2, -78, 1.8, 0, Math.PI * 2); ctx.arc(6, -78, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.arc(2, -71, 3.5, 0, Math.PI); ctx.fill(); ctx.stroke();

    // Bamboo Torch & Cartoon Flame
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(6, -60); ctx.lineTo(26, -90); ctx.stroke();
    const flk = Math.sin(performance.now() / 80) * 3;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(22, -90); ctx.lineTo(30, -90); ctx.lineTo(26 + flk, -114);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(26, -94, 5.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function drawPakRT(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.2;

    // Dark trousers
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-8, -24, 7, 24); ctx.strokeRect(-8, -24, 7, 24);
    ctx.fillRect(3, -24, 7, 24);  ctx.strokeRect(3, -24, 7, 24);

    // Round Dumpling Belly in Brown Batik
    ctx.fillStyle = '#92400e';
    ctx.beginPath(); ctx.ellipse(0, -42, 16, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Head with Big Black Peci
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath(); ctx.arc(0, -66, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath(); ctx.roundRect(-12, -81, 24, 11, 3); ctx.fill(); ctx.stroke();

    // Big Googly Eyes with Angry Brows
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-5, -67, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(5, -67, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(-4, -67, 2, 0, Math.PI * 2); ctx.arc(6, -67, 2, 0, Math.PI * 2); ctx.fill();

    // Fluffy Mustache & Open Mouth
    ctx.fillStyle = '#262626';
    ctx.beginPath(); ctx.ellipse(0, -60, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.arc(0, -56, 3, 0, Math.PI); ctx.fill(); ctx.stroke();

    // Petromak Lantern
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -46); ctx.lineTo(-24, -60); ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.roundRect(-30, -60, 14, 16, 3); ctx.fill(); ctx.stroke();

    ctx.restore();
  }

  function drawEmak(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.2;

    // Floral Orange Daster (A-Line)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-10, -54); ctx.lineTo(10, -54);
    ctx.lineTo(17, -10);  ctx.lineTo(-17, -10);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // Yellow flower dots
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(-5, -32, 2.5, 0, Math.PI * 2); ctx.arc(6, -24, 2.5, 0, Math.PI * 2); ctx.fill();

    // Head with Pink Hair Rollers
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath(); ctx.arc(0, -66, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.roundRect(-12, -78, 6, 6, 2); ctx.roundRect(-2, -80, 6, 6, 2); ctx.roundRect(8, -78, 6, 6, 2);
    ctx.fill(); ctx.stroke();

    // Screaming Mouth & Googly Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-5, -67, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(5, -67, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(-4, -67, 1.8, 0, Math.PI * 2); ctx.arc(6, -67, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.arc(0, -58, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Raising Sapu Lidi
    ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(8, -48); ctx.lineTo(26, -80); ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(24, -94, 8, 16); ctx.strokeRect(24, -94, 8, 16);

    ctx.restore();
  }

  function drawHansip(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.2;

    // Green trousers
    ctx.fillStyle = '#14532d';
    ctx.fillRect(-7, -24, 6, 24); ctx.strokeRect(-7, -24, 6, 24);
    ctx.fillRect(3, -24, 6, 24);  ctx.strokeRect(3, -24, 6, 24);

    // Green Shirt with White Belt
    ctx.fillStyle = '#166534';
    ctx.beginPath(); ctx.roundRect(-11, -52, 24, 28, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-12, -36, 26, 4.5); ctx.strokeRect(-12, -36, 26, 4.5);

    // Head with Green Peaked Cap
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath(); ctx.arc(0, -64, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#14532d';
    ctx.beginPath(); ctx.roundRect(-10, -76, 20, 8, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(0, -73, 2.5, 0, Math.PI * 2); ctx.fill();

    // Googly Eyes & Shouting Mouth
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-4, -64, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, -64, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(-3, -64, 1.8, 0, Math.PI * 2); ctx.arc(5, -64, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.arc(0, -56, 3, 0, Math.PI); ctx.fill(); ctx.stroke();

    // Wooden Baton
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(6, -46); ctx.lineTo(20, -72); ctx.stroke();

    ctx.restore();
  }

  function drawBocilSarung(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2;

    // Little boy wrapped in blue ninja sarung
    ctx.fillStyle = '#0284c7';
    ctx.beginPath(); ctx.ellipse(0, -28, 11, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath(); ctx.arc(0, -50, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-7, -58, 14, 5); ctx.strokeRect(-7, -58, 14, 5);

    // Big excited eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-3, -50, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(3, -50, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(-2, -50, 1.5, 0, Math.PI * 2); ctx.arc(4, -50, 1.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }


  function drawSpeechBubble(ctx, x, y, text) {
    ctx.save();
    ctx.font = 'bold 12px sans-serif';
    const textW = ctx.measureText(text).width;
    const pad = 8;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - pad, y - 16, textW + pad * 2, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 10, y + 8);
    ctx.lineTo(x, y + 16);
    ctx.lineTo(x + 18, y + 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // --- Scenery: Night Village ---
  function initVillageScenery() {
    stars = [];
    houses = [];
    bananaTrees = [];
    fireflies = [];

    for (let i = 0; i < 45; i++) {
      stars.push({
        x: Math.random() * V_WIDTH,
        y: Math.random() * (GROUND_Y - 120),
        r: 1 + Math.random() * 2
      });
    }

    let hx = 20;
    while (hx < V_WIDTH + 300) {
      const hw = 90 + Math.random() * 80;
      const hh = 110 + Math.random() * 60;
      houses.push({ x: hx, w: hw, h: hh, hasLamp: Math.random() > 0.4 });
      hx += hw + 40 + Math.random() * 50;
    }

    let tx = 50;
    while (tx < V_WIDTH + 200) {
      bananaTrees.push({ x: tx, h: 90 + Math.random() * 50 });
      tx += 110 + Math.random() * 120;
    }

    for (let i = 0; i < 15; i++) {
      fireflies.push({
        x: Math.random() * V_WIDTH,
        y: 180 + Math.random() * (GROUND_Y - 200),
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 20,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // --- Spawning Timers & Definitions ---
  const THROW_TYPES = [
    { type: 'sandal', name: 'Sandal Jepit', w: 30, h: 14, color: '#16a34a' },
    { type: 'gayung', name: 'Gayung Merah', w: 32, h: 22, color: '#f43f5e' },
    { type: 'panci', name: 'Panci Gosong', w: 36, h: 22, color: '#334155' },
    { type: 'sapu', name: 'Sapu Lidi', w: 40, h: 14, color: '#ca8a04' }
  ];

  function spawnThrownItem(wargaX) {
    const itemDef = THROW_TYPES[Math.floor(Math.random() * THROW_TYPES.length)];
    const startX = Math.max(20, wargaX + 70);
    const startY = GROUND_Y - 80;
    const dx = player.x - startX;

    let vx, vy, rotSpeed;
    const isPowerLob = Math.random() < Math.min(0.40, 0.10 + (stage - 1) * 0.015);
    const isShortThrow = !isPowerLob && Math.random() < 0.22;

    if (isPowerLob) {
      vy = -380 - Math.random() * 120;
      const t = 1.05 + Math.random() * 0.25;
      vx = (dx + 90 + Math.random() * 90) / t;
      rotSpeed = 14 + Math.random() * 14;
    } else if (isShortThrow) {
      vy = -160 - Math.random() * 70;
      const t = Math.max(0.75, dx / 400);
      vx = (dx - 90 - Math.random() * 50) / t;
      rotSpeed = 6 + Math.random() * 8;
    } else {
      vy = -210 - Math.random() * 130;
      const t = Math.max(0.8, dx / (380 + stage * 2));
      vx = dx / t + (Math.random() - 0.5) * 40;
      rotSpeed = 8 + Math.random() * 12;
    }

    thrownItems.push({
      x: startX, y: startY, vx, vy,
      w: itemDef.w, h: itemDef.h,
      type: itemDef.type, name: itemDef.name, color: itemDef.color,
      rot: 0, rotSpeed, passed: false
    });
  }

  const OBSTACLE_TYPES = [
    { type: 'batu', name: 'Batu Kali', w: 34, h: 24, yOffset: 24, color: '#475569' },
    { type: 'pagar', name: 'Pagar Bambu', w: 42, h: 48, yOffset: 48, color: '#ca8a04' },
    { type: 'kubangan', name: 'Kubangan Lumpur', w: 54, h: 18, yOffset: 16, color: '#78350f' },
    { type: 'ayam', name: 'Ayam Kaget', w: 32, h: 28, yOffset: 28, color: '#ea580c' },
    { type: 'kucing', name: 'Kucing Oren', w: 38, h: 24, yOffset: 24, color: '#f97316' }
  ];

  function spawnObstacle() {
    const lastObs = obstacles[obstacles.length - 1];
    if (lastObs && lastObs.x > V_WIDTH - 85) return;
    const obsDef = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    obstacles.push({
      x: V_WIDTH + 30,
      y: GROUND_Y - obsDef.yOffset,
      w: obsDef.w,
      h: obsDef.h,
      type: obsDef.type,
      name: obsDef.name,
      color: obsDef.color,
      state: 'idle',
      spooked: false,
      runSpeed: 0,
      animTime: 0
    });
  }

  function createDust(x, y) {
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: x,
        y: y - 4,
        vx: -60 - Math.random() * 50,
        vy: -15 - Math.random() * 25,
        radius: 3 + Math.random() * 4,
        alpha: 0.8,
        life: 0.35,
        color: '#64748b'
      });
    }
  }

  function createWindBurst(x, y) {
    for (let i = 0; i < 7; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 80,
        vy: 20 + Math.random() * 30,
        radius: 3 + Math.random() * 3,
        alpha: 0.9,
        life: 0.3,
        color: '#f8fafc'
      });
    }
  }

  function addComicText(text, x, y, color = '#facc15') {
    comicTexts.push({ text, x, y, alpha: 1, vy: -55, color });
  }

  // --- Start & Stage Management ---
  function hideAllModals() {
    startScreen.classList.add('hidden');
    creditsScreen.classList.add('hidden');
    stageClearScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    throwWarningEl.classList.add('hidden');
    stageBannerEl.classList.add('hidden');
  }

  function showStageBanner(text) {
    stageBannerTextEl.textContent = text;
    stageBannerEl.classList.remove('hidden');
    stageBannerTimer = 2.4;
  }

  function startStage(targetStage) {
    stage = Math.max(1, Math.min(TOTAL_STAGES, targetStage));
    stageTotalTime = getStageDuration(stage);
    stageTimer = stageTotalTime;
    escapeGap = 50;
    bumpCount = 0;
    dodgedThrows = 0;
    cemeteryGate.active = false;
    cemeteryGate.entered = false;
    cemeteryGate.x = -999;

    player.reset();
    obstacles = [];
    thrownItems = [];
    particles = [];
    comicTexts = [];
    warningActive = false;
    shoutTimer = 0;
    currentShout = "";

    initVillageScenery();
    updateHUD();
    hideAllModals();

    gameState = STATE.PLAYING;
    lastTime = performance.now();

    showStageBanner(`⭐ STAGE ${stage}: MENUJU GERBANG TPU!`);
    window.soundManager.playStageUp();
    window.soundManager.playBgm('spooky');
  }

  // --- Main Update Loop ---
  function update(dt) {
    if (gameState !== STATE.PLAYING) return;

    // Speed calculation with slow penalties
    const baseSpeed = 330 + (stage - 1) * 7;
    let currentSpeed = baseSpeed;
    if (player.tripTimer > 0) {
      currentSpeed = baseSpeed * 0.5;
    } else if (player.slowTimer > 0) {
      currentSpeed = baseSpeed * 0.6;
    }
    gameSpeed = currentSpeed;
    distance += (currentSpeed * dt) / 10;

    // Stage countdown & Cemetery gate trigger
    stageTimer = Math.max(0, stageTimer - dt);
    if (stageTimer <= 4.2 && !cemeteryGate.active) {
      cemeteryGate.active = true;
      cemeteryGate.x = V_WIDTH + 80;
      cemeteryGate.entered = false;
    }

    if (cemeteryGate.active) {
      cemeteryGate.x -= currentSpeed * dt;
      if (player.x >= cemeteryGate.x - 25 && !cemeteryGate.entered) {
        cemeteryGate.entered = true;
        window.soundManager.playGateSlam();
        setTimeout(() => {
          if (stage >= TOTAL_STAGES) triggerVictory();
          else triggerStageClear();
        }, 350);
      }
    }

    if (stageBannerTimer > 0) {
      stageBannerTimer -= dt;
      if (stageBannerTimer <= 0) stageBannerEl.classList.add('hidden');
    }

    // Warga distance gap dynamics
    if (player.tripTimer > 0) {
      escapeGap = Math.max(0, escapeGap - (26 + stage * 0.4) * dt);
    } else if (player.slowTimer > 0) {
      escapeGap = Math.max(0, escapeGap - (18 + stage * 0.3) * dt);
    } else {
      escapeGap = Math.min(100, escapeGap + 4.5 * dt);
    }

    if (escapeGap <= 0) {
      triggerBustedSequence();
      return;
    }

    const wargaX = getWargaX();
    shoutTimer -= dt;
    if (shoutTimer <= 0 && escapeGap < 75) {
      currentShout = VILLAGER_SHOUTS[Math.floor(Math.random() * VILLAGER_SHOUTS.length)];
      shoutTimer = Math.max(1.5, 3.5 - stage * 0.02);
    }

    player.update(dt);
    updateThrownMechanics(dt, wargaX);
    updateObstacleMechanics(dt);
    updateParticlesAndScenery(dt);
    updateHUD();
  }

  const DODGE_TAUNTS = [
    "WLEEE! 😝", "GAK KENA WLEEE! 😜", "MELESET BOS! 🤪",
    "KASIAN DEH LUU! 😛", "KEJARR DONG! 💨", "LEMPAR LAGI SINI! 😆"
  ];
  const SHORT_THROW_TAUNTS = [
    "GAK NYAMPEEE! 🤣", "TENAGA LOYO NIH YEE! 😆", "KURANG MAKAN APA BOS?! 😜",
    "KENDOR BANGET LEMPARNYA! 🤪", "NYAMPE KAGA, CAPEK IYA! 😝"
  ];

  function triggerPocimanTaunt(isShort = false) {
    if (player.tripTimer > 0 || player.hitTimer > 0) return;
    if (isShort && player.tauntTimer > 0.4) return;
    player.tauntTimer = 1.6;
    const list = isShort ? SHORT_THROW_TAUNTS : DODGE_TAUNTS;
    const shout = list[Math.floor(Math.random() * list.length)];
    player.tauntText = shout;
    player.tauntIsShort = isShort;
    if (window.soundManager && window.soundManager.playTaunt) {
      window.soundManager.playTaunt();
    }
  }

  function triggerBarrageThrows(wargaX) {
    spawnThrownItem(wargaX);
    const doubleChance = Math.min(0.75, 0.20 + (stage - 1) * 0.035);
    if (Math.random() < doubleChance) {
      setTimeout(() => { if (gameState === STATE.PLAYING) spawnThrownItem(wargaX); }, 260);
    }
    const tripleChance = Math.min(0.60, (stage - 8) * 0.04);
    if (stage >= 10 && Math.random() < tripleChance) {
      setTimeout(() => { if (gameState === STATE.PLAYING) spawnThrownItem(wargaX); }, 520);
    }
    if (stage >= 18 && Math.random() < 0.40) {
      setTimeout(() => { if (gameState === STATE.PLAYING) spawnThrownItem(wargaX); }, 780);
    }
  }

  function handleItemHit(index) {
    bumpCount++;
    player.bumpLevel = Math.min(3, player.bumpLevel + 1);
    player.hitTimer = 0.9;
    player.slowTimer = 1.2;
    player.tauntTimer = 0;
    player.invulnerableTime = 1.3;

    const penalty = Math.min(24, 15 + stage * 0.3);
    escapeGap = Math.max(0, escapeGap - penalty);

    window.soundManager.playBonk();
    addComicText("POYONGAN! -40% SPEED! 🤕", player.x, player.y - 25, '#ef4444');

    thrownItems.splice(index, 1);
    updateHUD();
  }

  function updateThrownMechanics(dt, wargaX) {
    throwTimer -= dt;
    if (throwTimer <= 0.8 && !warningActive) {
      warningActive = true;
      throwWarningEl.classList.remove('hidden');
      window.soundManager.playWarning();
    }

    if (throwTimer <= 0) {
      triggerBarrageThrows(wargaX);
      warningActive = false;
      throwWarningEl.classList.add('hidden');
      throwTimer = Math.max(1.1, 3.6 - (stage - 1) * 0.09 + Math.random() * 0.5);
    }

    for (let i = thrownItems.length - 1; i >= 0; i--) {
      const item = thrownItems[i];
      item.x += item.vx * dt;
      item.vy += GRAVITY * 0.7 * dt;
      item.y += item.vy * dt;
      item.rot += item.rotSpeed * dt;

      if (player.invulnerableTime <= 0 && checkRectOverlap(player, item)) {
        handleItemHit(i);
        continue;
      }

      if (!item.passed && item.x > player.x + 20) {
        item.passed = true;
        dodgedThrows++;
        triggerPocimanTaunt(false);
      }

      if (item.y > GROUND_Y - 10) {
        createDust(item.x, GROUND_Y);
        if (!item.passed && item.x < player.x - 30) {
          triggerPocimanTaunt(true);
        }
        thrownItems.splice(i, 1);
        continue;
      }

      if (item.x > V_WIDTH + 80) thrownItems.splice(i, 1);
    }
  }

  function handleObstacleHit(obs) {
    player.tripTimer = 1.0;
    player.slowTimer = 0;
    player.tauntTimer = 0;
    player.invulnerableTime = 1.5;

    const penalty = Math.min(28, 18 + stage * 0.35);
    escapeGap = Math.max(0, escapeGap - penalty);

    if (obs.type === 'kucing') {
      if (window.soundManager && window.soundManager.playCatScreech) window.soundManager.playCatScreech();
      addComicText("DICAKAR OREN! 😼💥", player.x, player.y - 25, '#f97316');
    } else {
      window.soundManager.playTrip();
      addComicText("GUBRAK! MERAYAP ULAT! 🐛", player.x, player.y - 25, '#f59e0b');
    }

    createDust(player.x, GROUND_Y);
    updateHUD();
  }

  function updateObstacleMechanics(dt) {
    obstacleTimer -= dt;
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = Math.max(0.9, 1.85 - (stage * 0.025) + Math.random() * 0.65);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.animTime = (obs.animTime || 0) + dt;

      if (obs.type === 'kucing' && !obs.spooked && obs.x - (player.x + player.w) < 210) {
        obs.spooked = true;
        obs.state = 'running';
        obs.runSpeed = 230 + Math.random() * 40;
        addComicText("MEONG! 🙀", obs.x, obs.y - 18, '#fbbf24');
        if (window.soundManager && window.soundManager.playCatScreech) window.soundManager.playCatScreech();
      }

      if (obs.type === 'kucing' && obs.state === 'running' && Math.random() < 0.25) {
        createDust(obs.x + 4, GROUND_Y);
      }

      const vx = (obs.type === 'kucing' && obs.state === 'running') ? (obs.runSpeed - gameSpeed) : -gameSpeed;
      obs.x += vx * dt;

      if (player.invulnerableTime <= 0 && player.tripTimer <= 0 && checkRectOverlap(player, obs)) {
        handleObstacleHit(obs);
      }

      if (obs.x < -80 || obs.x > V_WIDTH + 200) obstacles.splice(i, 1);
    }
  }

  function updateParticlesAndScenery(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += (pt.vx - gameSpeed * 0.3) * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      pt.alpha = Math.max(0, pt.life * 2);
      if (pt.life <= 0) particles.splice(i, 1);
    }

    for (let i = comicTexts.length - 1; i >= 0; i--) {
      const ct = comicTexts[i];
      ct.y += ct.vy * dt;
      ct.alpha -= dt * 1.1;
      if (ct.alpha <= 0) comicTexts.splice(i, 1);
    }

    for (const h of houses) h.x -= gameSpeed * 0.3 * dt;
    if (houses.length > 0 && houses[0].x + houses[0].w < -40) {
      const rem = houses.shift();
      const lastH = houses[houses.length - 1];
      rem.x = lastH.x + lastH.w + 40 + Math.random() * 50;
      houses.push(rem);
    }

    for (const t of bananaTrees) t.x -= gameSpeed * 0.5 * dt;
    if (bananaTrees.length > 0 && bananaTrees[0].x < -60) {
      const remT = bananaTrees.shift();
      const lastT = bananaTrees[bananaTrees.length - 1];
      remT.x = lastT.x + 120 + Math.random() * 100;
      bananaTrees.push(remT);
    }

    for (const ff of fireflies) {
      ff.x += (ff.vx - gameSpeed * 0.1) * dt;
      ff.y += ff.vy * dt;
      ff.phase += dt * 3;
      if (ff.x < -20) ff.x = V_WIDTH + 20;
    }
  }

  function checkRectOverlap(r1, r2) {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  function updateHUD() {
    stageValEl.textContent = stage;
    bumpCountEl.textContent = bumpCount;
    if (distanceValEl) distanceValEl.textContent = `${Math.floor(distance)}m`;

    const remainingSec = Math.max(0, Math.ceil(stageTimer));
    stageTimeValEl.textContent = `${remainingSec}s`;

    // 1. TPU Progress (0% at start -> 100% when entering TPU = LOLOS)
    const tpuPct = Math.min(100, Math.max(0, ((stageTotalTime - stageTimer) / stageTotalTime) * 100));
    if (tpuBarEl) tpuBarEl.style.width = tpuPct + '%';
    if (tpuPinEl) tpuPinEl.style.left = tpuPct + '%';

    // 2. Warga Chase Proximity (0% = TERTANGKAP, 100% = AMAN)
    const clampedGap = Math.max(0, Math.min(100, escapeGap));
    escapeBarEl.style.width = clampedGap + '%';
    if (dangerPinEl) dangerPinEl.style.left = clampedGap + '%';

    if (dangerLabelEl) {
      if (clampedGap < 25) {
        dangerLabelEl.textContent = "🔥 KRITIS TERTANGKAP!";
        dangerLabelEl.style.color = "#f43f5e";
      } else if (clampedGap < 50) {
        dangerLabelEl.textContent = "⚠️ WARGA MENDEKAT!";
        dangerLabelEl.style.color = "#fbbf24";
      } else {
        dangerLabelEl.textContent = "🔥 TERTANGKAP";
        dangerLabelEl.style.color = "#ef4444";
      }
    }
  }

  function triggerStageClear() {
    window.soundManager.stopBgm();
    gameState = STATE.STAGECLEAR;
    if (stage >= highestStage && stage < TOTAL_STAGES) {
      highestStage = stage + 1;
      try { localStorage.setItem('pociman_highest_stage', highestStage); } catch (e) {}
    }

    stageClearTitleEl.textContent = `STAGE ${stage} SELESAI!`;
    stageClearTimeEl.textContent = `${Math.round(stageTotalTime - stageTimer)}s`;
    stageClearBumpsEl.textContent = bumpCount;
    stageClearDodgesEl.textContent = dodgedThrows;

    stageClearScreen.classList.remove('hidden');
    throwWarningEl.classList.add('hidden');
    stageBannerEl.classList.add('hidden');
    window.soundManager.playStageClear();
  }

  function triggerVictory() {
    window.soundManager.stopBgm();
    gameState = STATE.VICTORY;
    if (stage >= highestStage) {
      highestStage = TOTAL_STAGES;
      try { localStorage.setItem('pociman_highest_stage', highestStage); } catch (e) {}
    }

    winDistanceEl.textContent = `${Math.floor(distance)}m`;
    winStageEl.textContent = `${TOTAL_STAGES}/${TOTAL_STAGES} TAMAT! 👑`;
    winBumpsEl.textContent = bumpCount;
    winRankEl.textContent = bumpCount === 0 ? "Pociman Sakti Tanpa Cacat 👑" : (bumpCount <= 3 ? "Pociman Lincah ⚡" : "Pociman Benjol Tangguh 🤕");

    victoryScreen.classList.remove('hidden');
    throwWarningEl.classList.add('hidden');
    stageBannerEl.classList.add('hidden');
    window.soundManager.playWin();
  }

  function triggerBustedSequence() {
    window.soundManager.stopBgm();
    gameState = STATE.BUSTED;
    bustedCutscene.timer = 0;
    bustedCutscene.dustPuffs = [];
    bustedCutscene.comicPops = [
      { t: 0.12, text: "KAPOK! 💥", color: '#ef4444' },
      { t: 0.50, text: "BAM! 👊", color: '#f59e0b' },
      { t: 0.90, text: "AMPUN KANG! 😭", color: '#38bdf8' },
      { t: 1.30, text: "POW! 💥", color: '#fbbf24' },
      { t: 1.65, text: "🏳️ MENYERAH!", color: '#ffffff' }
    ];
    throwWarningEl.classList.add('hidden');
    stageBannerEl.classList.add('hidden');
    if (window.soundManager && window.soundManager.playBrawlBeatdown) {
      window.soundManager.playBrawlBeatdown();
    }
  }

  function updateBustedCutscene(dt) {
    bustedCutscene.timer += dt;
    if (Math.random() < 0.65) {
      bustedCutscene.dustPuffs.push({
        x: player.x + (Math.random() - 0.5) * 80,
        y: GROUND_Y - 35 + (Math.random() - 0.5) * 50,
        r: 16 + Math.random() * 20,
        alpha: 0.9,
        color: Math.random() < 0.5 ? '#cbd5e1' : '#94a3b8'
      });
    }

    for (let i = bustedCutscene.dustPuffs.length - 1; i >= 0; i--) {
      const p = bustedCutscene.dustPuffs[i];
      p.r += 32 * dt;
      p.alpha -= 1.2 * dt;
      if (p.alpha <= 0) bustedCutscene.dustPuffs.splice(i, 1);
    }

    bustedCutscene.comicPops.forEach(cp => {
      if (!cp.shown && bustedCutscene.timer >= cp.t) {
        cp.shown = true;
        addComicText(cp.text, player.x - 30 + Math.random() * 60, GROUND_Y - 75 - Math.random() * 30, cp.color);
      }
    });

    for (let i = comicTexts.length - 1; i >= 0; i--) {
      const ct = comicTexts[i];
      ct.y += ct.vy * dt;
      ct.alpha -= dt * 0.9;
      if (ct.alpha <= 0) comicTexts.splice(i, 1);
    }

    if (bustedCutscene.timer >= bustedCutscene.duration) {
      triggerGameOver();
    }
  }

  function triggerGameOver() {
    window.soundManager.stopBgm();
    gameState = STATE.GAMEOVER;
    finalStageEl.textContent = `Stage ${stage} / ${TOTAL_STAGES}`;
    finalDistanceEl.textContent = `${Math.floor(distance)}m`;
    finalBumpsEl.textContent = bumpCount;

    const reasons = [
      `Pociman tertangkap rombongan warga di Stage ${stage}! Sekarang diajak selfie Pak RT...`,
      "Kehabisan napas dan digendong Hansip ke kantor balai desa!",
      "Tersandung sarung sendiri dan dikerubuti emak-emak dasteran!",
      "Kena lempar sandal jepit tepat di jidat hingga pingsan!"
    ];
    deathReasonEl.textContent = reasons[Math.floor(Math.random() * reasons.length)];

    gameOverScreen.classList.remove('hidden');
    throwWarningEl.classList.add('hidden');
    stageBannerEl.classList.add('hidden');
    window.soundManager.playCaught();
  }

  // --- Render Loop ---
  function draw() {
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

    // 1. Night Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#090d16');
    skyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // 2. Crescent Moon & Stars
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.arc(V_WIDTH - 120, 80, 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#090d16';
    ctx.beginPath(); ctx.arc(V_WIDTH - 106, 74, 28, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }

    // 3. Houses Parallax
    for (const h of houses) {
      ctx.fillStyle = '#111827';
      ctx.fillRect(h.x, GROUND_Y - h.h, h.w, h.h);
      ctx.beginPath();
      ctx.moveTo(h.x - 10, GROUND_Y - h.h);
      ctx.lineTo(h.x + h.w / 2, GROUND_Y - h.h - 32);
      ctx.lineTo(h.x + h.w + 10, GROUND_Y - h.h);
      ctx.closePath(); ctx.fill();

      if (h.hasLamp) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.5)';
        ctx.fillRect(h.x + h.w * 0.3, GROUND_Y - h.h + 20, 16, 18);
      }
    }

    // 4. Banana Trees
    for (const t of bananaTrees) {
      ctx.save();
      ctx.translate(t.x, GROUND_Y);
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, -t.h); ctx.stroke();
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.ellipse(-24, -t.h + 8, 34, 12, -0.4, 0, Math.PI * 2);
      ctx.ellipse(24, -t.h + 6, 34, 12, 0.4, 0, Math.PI * 2);
      ctx.ellipse(0, -t.h - 10, 28, 10, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. Fireflies
    for (const ff of fireflies) {
      ctx.fillStyle = `rgba(163, 230, 53, ${0.4 + Math.sin(ff.phase) * 0.4})`;
      ctx.beginPath(); ctx.arc(ff.x, ff.y, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    // 6. Ground Dirt Path
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, GROUND_Y, V_WIDTH, V_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, GROUND_Y, V_WIDTH, 8);

    // 7. Villagers Mob Chase (Scales with stage)
    const wargaX = gameState === STATE.BUSTED ? (player.x - 70) : getWargaX();
    drawVillagersMob(ctx, wargaX, stage);

    // 7.5. Finish Cemetery Gate (TPU)
    if (cemeteryGate.active) {
      drawCemeteryGate(ctx, cemeteryGate);
    }

    // 8. Front Obstacles
    for (const obs of obstacles) {
      drawObstacle(ctx, obs);
    }

    // 9. Thrown Items
    for (const item of thrownItems) {
      drawThrownItem(ctx, item);
    }

    // 10. Player (Pociman) or Busted Brawl Cutscene
    if (gameState === STATE.BUSTED) {
      drawBustedCutscene(ctx);
    } else {
      player.draw(ctx);
    }

    // 11. Particles & Comic Texts
    for (const pt of particles) {
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    for (const ct of comicTexts) {
      ctx.save();
      ctx.globalAlpha = ct.alpha;
      ctx.fillStyle = ct.color;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(ct.text, ct.x, ct.y);
      ctx.restore();
    }
  }

  function drawBrawlCloud(ctx, cx, cy) {
    for (const p of bustedCutscene.dustPuffs) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const t = bustedCutscene.timer;
    const sparkAngle = t * 18;
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = sparkAngle + (i * Math.PI) / 2;
      const dist = 32 + Math.sin(t * 22 + i) * 14;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, 5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }

    if (t >= 0.75) {
      const flagWiggle = Math.sin(t * 24) * 8;
      ctx.strokeStyle = '#78716c'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 20); ctx.lineTo(cx - 10, cy - 62); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#3e352d'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 62);
      ctx.lineTo(cx + 18 + flagWiggle, cy - 54);
      ctx.lineTo(cx - 10, cy - 46);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  }

  function drawKnockedOutPociman(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy + 18);
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(-42, -10, 84, 20, 10);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#7d7062';
    ctx.fillRect(-16, -11, 6, 22);
    ctx.fillRect(16, -11, 6, 22);

    const hx = 22, hy = 0;
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(hx - 5, hy - 4); ctx.lineTo(hx - 1, hy);
    ctx.moveTo(hx - 1, hy - 4); ctx.lineTo(hx - 5, hy);
    ctx.moveTo(hx + 3, hy - 4); ctx.lineTo(hx + 7, hy);
    ctx.moveTo(hx + 7, hy - 4); ctx.lineTo(hx + 3, hy);
    ctx.stroke();

    const starAngle = performance.now() * 0.005;
    ctx.font = '14px sans-serif';
    ctx.fillText("💫", hx + Math.cos(starAngle) * 14, hy - 18 + Math.sin(starAngle) * 6);
    ctx.fillText("💫", hx + Math.cos(starAngle + Math.PI) * 14, hy - 18 + Math.sin(starAngle + Math.PI) * 6);
    ctx.restore();
  }

  function drawBustedCutscene(ctx) {
    const cx = player.x + player.w / 2;
    const cy = GROUND_Y - 35;
    const t = bustedCutscene.timer;

    if (t < 1.75) {
      drawBrawlCloud(ctx, cx, cy);
      const sandalY = cy - 45 - Math.sin(t * 7) * 25;
      const sandalX = cx + Math.cos(t * 9) * 45;
      ctx.save();
      ctx.translate(sandalX, sandalY);
      ctx.rotate(t * 12);
      ctx.fillStyle = '#16a34a'; ctx.fillRect(-12, -6, 24, 12);
      ctx.restore();
    } else {
      drawKnockedOutPociman(ctx, cx, cy);
    }

    ctx.save();
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText("Sentuh / Tekan Spasi untuk Lewati ⏭️", V_WIDTH / 2, 35);
    ctx.restore();
  }

  function drawCatHead(ctx, hx, hy) {
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.arc(hx, hy, 8.5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(hx - 6, hy - 6); ctx.lineTo(hx - 2, hy - 14); ctx.lineTo(hx + 2, hy - 6);
    ctx.moveTo(hx + 1, hy - 6); ctx.lineTo(hx + 6, hy - 13); ctx.lineTo(hx + 8, hy - 5);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(hx + 4, hy + 3, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(hx + 3, hy - 1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(hx + 3.5, hy - 2.5, 1.2, 3);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(hx + 6.5, hy + 2, 2, 1.5);
  }

  function drawCatBody(ctx, obs, isRunning, legPhase, tailWiggle) {
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(6 + legPhase, obs.h - 6, 5, 6);
    ctx.fillRect(obs.w - 12 - legPhase, obs.h - 6, 5, 6);

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(obs.w * 0.45, obs.h * 0.55, obs.w * 0.38, obs.h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#c2410c'; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(obs.w * 0.35, obs.h * 0.3); ctx.lineTo(obs.w * 0.35, obs.h * 0.6);
    ctx.moveTo(obs.w * 0.50, obs.h * 0.28); ctx.lineTo(obs.w * 0.50, obs.h * 0.58);
    ctx.stroke();

    ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 3;
    ctx.beginPath();
    if (isRunning) {
      ctx.moveTo(6, obs.h * 0.5);
      ctx.quadraticCurveTo(-4, obs.h * 0.1, -2 + tailWiggle, -6);
    } else {
      ctx.moveTo(6, obs.h * 0.5);
      ctx.quadraticCurveTo(-2, obs.h * 0.8, -4 + tailWiggle, obs.h * 0.4);
    }
    ctx.stroke();
  }

  function drawCatObstacle(ctx, obs) {
    const isRunning = obs.state === 'running';
    const anim = obs.animTime || 0;
    const legPhase = isRunning ? Math.sin(anim * 26) * 5 : 0;
    const tailWiggle = isRunning ? Math.sin(anim * 22) * 7 : Math.sin(anim * 4) * 2;

    ctx.save();
    if (!isRunning) {
      ctx.translate(obs.w, 0);
      ctx.scale(-1, 1);
    }

    drawCatBody(ctx, obs, isRunning, legPhase, tailWiggle);
    drawCatHead(ctx, obs.w * 0.75, obs.h * 0.4);
    ctx.restore();
  }

  function drawObstacle(ctx, obs) {
    ctx.save();
    ctx.translate(obs.x, obs.y);

    if (obs.type === 'kucing') {
      drawCatObstacle(ctx, obs);
    } else if (obs.type === 'batu') {
      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.moveTo(0, obs.h); ctx.lineTo(obs.w * 0.3, 2);
      ctx.lineTo(obs.w * 0.7, 5); ctx.lineTo(obs.w, obs.h);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke();
    } else if (obs.type === 'pagar') {
      ctx.strokeStyle = obs.color; ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.lineTo(6, obs.h);
      ctx.moveTo(20, 0); ctx.lineTo(20, obs.h);
      ctx.moveTo(34, 0); ctx.lineTo(34, obs.h);
      ctx.moveTo(0, obs.h * 0.35); ctx.lineTo(obs.w, obs.h * 0.35);
      ctx.moveTo(0, obs.h * 0.75); ctx.lineTo(obs.w, obs.h * 0.75);
      ctx.stroke();
    } else if (obs.type === 'kubangan') {
      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.ellipse(obs.w / 2, obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (obs.type === 'ayam') {
      ctx.fillStyle = obs.color;
      ctx.beginPath(); ctx.arc(obs.w / 2, obs.h / 2, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(obs.w / 2 + 8, obs.h / 2 - 6, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.fillRect(obs.w / 2 + 6, obs.h / 2 - 14, 5, 5);
      ctx.fillStyle = '#facc15'; ctx.fillRect(obs.w / 2 + 13, obs.h / 2 - 6, 4, 3);
    }
    ctx.restore();
  }

  function drawThrownItem(ctx, item) {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rot);

    if (item.type === 'sandal') {
      ctx.fillStyle = item.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(-item.w / 2, -item.h / 2, item.w, item.h, 4);
      ctx.fill(); ctx.stroke();
    } else if (item.type === 'gayung') {
      ctx.fillStyle = item.color;
      ctx.fillRect(-item.w / 2, -item.h / 2, item.w * 0.65, item.h);
      ctx.fillRect(item.w * 0.15, -item.h * 0.2, item.w * 0.45, 4);
    } else if (item.type === 'panci') {
      ctx.fillStyle = item.color;
      ctx.beginPath(); ctx.arc(0, 0, item.h / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillRect(item.h / 2, -2, 10, 4);
    } else if (item.type === 'sapu') {
      ctx.strokeStyle = item.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-item.w / 2, 0); ctx.lineTo(item.w / 2, 0); ctx.stroke();
      ctx.fillStyle = '#eab308'; ctx.fillRect(item.w * 0.1, -4, item.w * 0.4, 8);
    }
    ctx.restore();
  }

  // --- Visuals: Finish Cemetery Gate (TPU) ---
  function drawCemeteryGate(ctx, gate) {
    if (!gate.active || gate.x < -180 || gate.x > V_WIDTH + 180) return;

    ctx.save();
    ctx.translate(gate.x, GROUND_Y);

    // Fog along ground
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.beginPath();
    ctx.ellipse(30, 4, 120, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    drawNisan(ctx, 45, 0);
    drawNisan(ctx, 95, 0);
    drawStonePillar(ctx, -55);
    drawStonePillar(ctx, 55);

    // Stone Archway & TPU Text
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-65, -145, 130, 32, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TPU KAMPUNG SERAM', 0, -125);

    drawIronGateDoor(ctx, gate.entered);
    ctx.restore();
  }

  function drawStonePillar(ctx, px) {
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.fillRect(px - 14, -135, 28, 135);
    ctx.strokeRect(px - 14, -135, 28, 135);

    ctx.fillStyle = '#15803d';
    ctx.fillRect(px - 12, -45, 10, 16);
    ctx.fillRect(px + 2, -90, 8, 12);
  }

  function drawNisan(ctx, nx, ny) {
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(nx, ny - 38, 22, 38, [11, 11, 0, 0]);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('R.I.P', nx + 11, ny - 18);
  }

  function drawIronGateDoor(ctx, isClosed) {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    const doorX = isClosed ? 0 : 35;
    for (let i = -40; i <= 40; i += 16) {
      ctx.beginPath();
      ctx.moveTo(doorX + i, -110);
      ctx.lineTo(doorX + i, 0);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(doorX - 44, -75); ctx.lineTo(doorX + 44, -75);
    ctx.moveTo(doorX - 44, -30); ctx.lineTo(doorX + 44, -30);
    ctx.stroke();
  }

  // --- Animation Loop ---
  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (gameState === STATE.PLAYING) {
      update(dt);
    } else if (gameState === STATE.BUSTED) {
      updateBustedCutscene(dt);
    }
    draw();

    requestAnimationFrame(gameLoop);
  }

  // --- Input Handlers ---
  function handleJumpAction() {
    if (gameState === STATE.BUSTED) {
      triggerGameOver();
      return;
    }
    if (gameState === STATE.PLAYING) {
      player.jump();
    } else if (gameState === STATE.MENU || gameState === STATE.GAMEOVER) {
      startStage(stage);
    } else if (gameState === STATE.STAGECLEAR) {
      startStage(Math.min(TOTAL_STAGES, stage + 1));
    } else if (gameState === STATE.VICTORY) {
      startStage(1);
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      handleJumpAction();
    } else if (e.code === 'KeyP') {
      togglePause();
    }
  });

  const gameContainer = document.getElementById('game-container');
  gameContainer.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || e.target.closest('.modal-card')) return;
    e.preventDefault();
    window.soundManager.init();
    handleJumpAction();
  });

  startBtn.addEventListener('click', () => { window.soundManager.init(); startStage(highestStage); });
  creditsBtn.addEventListener('click', () => { window.soundManager.init(); creditsScreen.classList.remove('hidden'); });
  closeCreditsBtn.addEventListener('click', () => { creditsScreen.classList.add('hidden'); });

  nextStageBtn.addEventListener('click', () => { window.soundManager.init(); startStage(Math.min(TOTAL_STAGES, stage + 1)); });
  replayStageBtn.addEventListener('click', () => { window.soundManager.init(); startStage(stage); });
  restartBtn.addEventListener('click', () => { window.soundManager.init(); startStage(stage); });
  resetStage1Btn.addEventListener('click', () => { window.soundManager.init(); startStage(1); });
  winPlayAgainBtn.addEventListener('click', () => { window.soundManager.init(); startStage(1); });
  resumeBtn.addEventListener('click', () => { togglePause(); });
  pauseBtn.addEventListener('click', () => { togglePause(); });

  function togglePause() {
    if (gameState === STATE.PLAYING) {
      gameState = STATE.PAUSED;
      pauseScreen.classList.remove('hidden');
    } else if (gameState === STATE.PAUSED) {
      gameState = STATE.PLAYING;
      pauseScreen.classList.add('hidden');
      lastTime = performance.now();
    }
  }

  soundBtn.addEventListener('click', () => {
    const isMuted = window.soundManager.toggleMute();
    soundBtn.textContent = isMuted ? '🔇' : '🔊';
  });

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        }
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (e) {}
  }

  if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
  if (lockLandscapeBtn) {
    lockLandscapeBtn.addEventListener('click', () => {
      window.soundManager.init();
      toggleFullscreen();
    });
  }

  document.addEventListener('fullscreenchange', () => {
    if (fullscreenBtn) {
      fullscreenBtn.textContent = document.fullscreenElement ? '✖' : '⛶';
    }
  });

  // Init
  initVillageScenery();
  updateHUD();
  requestAnimationFrame(gameLoop);

})();
