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
  const hudEl = document.getElementById('hud');
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
  const tabGuideBtn = document.getElementById('tabGuideBtn');
  const tabCreditsBtn = document.getElementById('tabCreditsBtn');
  const guideTabContent = document.getElementById('guideTabContent');
  const creditsTabContent = document.getElementById('creditsTabContent');

  const nextStageBtn = document.getElementById('nextStageBtn');
  const replayStageBtn = document.getElementById('replayStageBtn');
  const resetStage1Btn = document.getElementById('resetStage1Btn');
  const winPlayAgainBtn = document.getElementById('winPlayAgainBtn');
  const skipCutsceneBtn = document.getElementById('skipCutsceneBtn');
  const endingVideoContainer = document.getElementById('endingVideoContainer');
  const endingVideo = document.getElementById('endingVideo');
  const startResetStageBtn = document.getElementById('startResetStageBtn');
  const startWallOfHonorBtn = document.getElementById('startWallOfHonorBtn');
  const wallOfHonorModal = document.getElementById('wallOfHonorModal');
  const honorListContainer = document.getElementById('honorListContainer');
  const refreshHonorBtn = document.getElementById('refreshHonorBtn');
  const closeHonorBtn = document.getElementById('closeHonorBtn');
  const honorPlayerName = document.getElementById('honorPlayerName');
  const submitHonorBtn = document.getElementById('submitHonorBtn');
  const honorFeedback = document.getElementById('honorFeedback');
  const viewHonorBtn = document.getElementById('viewHonorBtn');
  const shareWaBtn = document.getElementById('shareWaBtn');
  const downloadCertBtn = document.getElementById('downloadCertBtn');
  const replayEndingBtn = document.getElementById('replayEndingBtn');
  const restartBtn = document.getElementById('restartBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const soundBtn = document.getElementById('soundBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const startFullscreenBtn = document.getElementById('startFullscreenBtn');

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
  const TOTAL_STAGES = 10;

  // --- Game State ---
  const STATE = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    VICTORY: 3,
    GAMEOVER: 4,
    STAGECLEAR: 5,
    BUSTED: 6,
    ENDING_CUTSCENE: 7
  };
  let gameState = STATE.MENU;

  const bustedCutscene = {
    timer: 0,
    duration: 2.3,
    dustPuffs: [],
    comicPops: []
  };

  const endingCutscene = {
    timer: 0,
    duration: 9.6
  };

  let lastTime = 0;
  let gameSpeed = 340;
  let distance = 0;
  let stage = 1;
  let stageBannerTimer = 0;
  let stageTimer = 35;
  let stageTotalTime = 35;
  let escapeGap = 50; // 0% (caught) to 100% (escaped!)
  let bumpCount = 0;
  let totalBumps = 0;
  let dodgedThrows = 0;

  let highestStage = 1;
  try {
    highestStage = parseInt(localStorage.getItem('pociman_highest_stage') || '1', 10);
    if (isNaN(highestStage) || highestStage < 1) highestStage = 1;
  } catch (e) {
    highestStage = 1;
  }

  function getStageDuration(stg) {
    return 60;
  }

  function getSkyColors(stg) {
    if (stg <= 3) return ['#090d16', '#1e293b'];
    if (stg <= 6) return ['#110924', '#2e1065'];
    if (stg <= 8) return ['#1b0826', '#4a044e'];
    return ['#140727', '#7f1d1d'];
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

  // Mob cycle & Power-up State
  let mobRunCycle = 0;

  const KUNTI_RESCUE_LINES = [
    "Sini Mas Poci, ku gendong terbang dulu biar gak digebukin warga! Hihihi~",
    "Pegang pundakku erat-erat ya Mas, jangan liat ke bawah! 👻✨",
    "Warga kampung emosi amat, untung Mbak Kunti dateng tepat waktu! 💅",
    "Awas sendal emak di bawah, kita naik ke langit dulu! Hihihi~ ☁️",
    "Mbak Kunti seksi konsumsi siap antar sampai depan TPU! ☕"
  ];

  const kuntiPowerup = {
    itemActive: false,
    itemX: -999,
    itemY: GROUND_Y - 95,
    itemBob: 0,
    active: false,
    timer: 0,
    duration: 4.5,
    spawnedThisStage: 0,
    maxSpawnsPerStage: 2,
    checkTimer: 5.0,
    dialogTimer: 0,
    dialogText: "Sini Mas Poci, ku gendong terbang dulu biar gak digebukin warga! Hihihi~",

    reset() {
      this.itemActive = false;
      this.itemX = -999;
      this.itemY = GROUND_Y - 95;
      this.itemBob = 0;
      this.active = false;
      this.timer = 0;
      this.spawnedThisStage = 0;
      this.checkTimer = 5.0 + Math.random() * 3.0;
      this.dialogTimer = 0;
    }
  };

  // Expanded Indonesian Villager Shouts (36 entries)
  const VILLAGER_SHOUTS = [
    "TANGKEEEP, JANGAN KASIH KENDOR!",
    "HOI BALIKIN AYAM GUA!",
    "POCIMAN NGEPET KAH ITU?!",
    "HANSIP, KEPUNG DARI KANAN-KIRI!",
    "AWAS KENA JEMURAN TETANGGA, MAK!",
    "TIUP PELUITNYA PAK HANSIP, PRIIIT!",
    "LEMPAR PAKE SENDAL JEPIT, EMAK!",
    "BERHENTI LU POCI, SARUNG LU MAU COPOT!",
    "PAK RT NAFASNYA UDAH SENIN-KAMIS NIH!",
    "WADUH POCONGNYA MINUM EXTRA JOSS!",
    "JANGAN LARI KE KEBUN PISANG, HOI!",
    "SAYANGNYA GUA LUPA BAWA TALI RAFIA!",
    "EMA-AKK, SENDAL SWALLOW KESAYANGAN MELAYANG!",
    "POCONG ZAMAN NOW LINCAH AMAT!",
    "CEPATAN, KEBURU MASUK GAPURA TPU!",
    "BOCIL MINGGIR DULU, BIAR HANSIP MAJU!",
    "AWAS KECOA TERBANG KENA MUKA!",
    "LEMPAR PANCI GOSONG KELUARGA, MAK!",
    "GELAP BANGET, SENTERNYA MATI LAMPU!",
    "KITA KEPUNG SAMPE BEDUK SUBUH!",
    "POCONG APA KELINCI SIH, LONCAT MULU!",
    "WOI POCONG, TUNGGUIN SIKIT DONG!",
    "KETAWA LU YA, KETANGKAP GUA IKET DI TIANG!",
    "LARI TERUSS SAMPE TALI KAFANNYA PUTUS!",
    "SERBBUUU! JANGAN KASIH AMPUN!",
    "DASTER GUA KETARIK PAGAR NIH!",
    "HANSIP KRAM KAKI, TUNGGUIN WOI!",
    "TIMPUK PAKE GAYUNG MERAH, MAK!",
    "POCI, MINYAK GORENG GUA JANGAN DIEMBAT!",
    "JANGAN SAMPE LOLOS KE GERBANG KUBURAN!",
    "SAPU LIDI TERBANGKAN SEKARANG!",
    "AWAS KUCING OREN KAGET, CABUT COK!",
    "POCONGNYA PAKE SEPATU RODA KAH?!",
    "HOI POCONG, BAYAR KAS RONDA DULU!",
    "TANGKAP BUAT KONTEN TIKTOK KITA!",
    "SENDAL GUA COPOT SEBELAH, WOI!"
  ];

  // Expanded Pociman Dodge Taunts (32 entries)
  const DODGE_TAUNTS = [
    "WLEEE! 😝",
    "GAK KENA WLEEE! 😜",
    "MELESET BOS! 🤪",
    "KASIAN DEH LUU! 😛",
    "KEJARR DONG KALAU BISA! 💨",
    "LEMPAR LAGI SINI, KURANG LURUS! 😆",
    "HUHUHU KASIAN DEH WARGA! 👻",
    "LONCATAN KELAS DUNIA! 🤸‍♂️",
    "SENDAL BUTUT KOK DILEMPAR! 🩴",
    "GAK KENA, COBA LAGI BESOK! 🤣",
    "KAFAN SAYA ANTI-PELURU BOS! 🛡️",
    "LARINYA LELET KAYA SIPUT! 🐌",
    "BYE-BYE WARGA KAMPUNG! 🏃‍♂️",
    "CIYE YANG LEMPARANNYA NYASAR! 🤭",
    "POCI DILAWAN, YA JELAS MENANG! ✨",
    "KURANG CEPET NGEJARNYA PAK HANSIP! 👮‍♂️",
    "EMAAK SAPUNYA PATAH TUH! 🧹",
    "LONCAT INDAH 10 POIN DARI JURI! 🥇",
    "SINI GUA AJARIN PARKOUR! 🕺",
    "GAK AKAN KETANGKAP MALAM INI! 🚀",
    "WLEEE, NAFASNYA UDAH NGOS-NGOSAN! 😝",
    "LEMPAR BATU SEMBUNYI TANGAN! 🪨",
    "POCIMAN TERLALU CEPAT UNTUK KALIAN! ⚡",
    "AYO SEMANGATTT, DIKIT LAGI KAGA KENA! 😆",
    "KASIAN DEH GAK DAPET POCONG! 😛",
    "GERAKAN AKROBATIK SI POCONG MANIS! 💅",
    "PANCI GOSONGNYA SAYANG BANGET TUH! 🍳",
    "KEJAR TERUS SAMPAI ENCOK YA PAK RT! 👴",
    "SAYA POCONG, BUKAN TARGET DART! 🎯",
    "LONCAT KANGGURU MODE ON! 🦘",
    "TIMPUK ANGIN KOK BANGGA! 💨",
    "MAKASIH HADIAH SENDALNYA YA! 🩴"
  ];

  // Expanded Pociman Short Throw Taunts (20 entries)
  const SHORT_THROW_TAUNTS = [
    "GAK NYAMPEEE! 🤣",
    "TENAGA LOYO NIH YEE! 😆",
    "KURANG MAKAN APA BOS?! 😜",
    "KENDOR BANGET LEMPARNYA! 🤪",
    "NYAMPE KAGA, CAPEK IYA! 😝",
    "SARAPAN DULU SANA PAK RT! 🥣",
    "LEMPARAN JARAK DEKAT AJA GAGAL! 😆",
    "OTOT KAWAT TAPI LEMPAR 2 METER! 🏋️‍♂️",
    "JAUH BANGET MELESETNYA! 😂",
    "SENDALNYA JATUH KE TANAH TUH! 🩴",
    "MINUM SUSU DULU BIAR KUAT! 🥛",
    "ANGINNYA KEBERATAN YA BOS?! 💨",
    "LEMPARANNYA CUMA SAMPAI DEPAN KAKI! 🤣",
    "LEMES BANGET KAYA BELUM GAJIAN! 💸",
    "LEMASS TANGANNYA, KEBANYAKAN RONDA! 😴",
    "LEMPARNYA PAKE NIAT DONG! 🤭",
    "ITU NGELEMPAR APA NGEJATUHIN BARANG?! 🤣",
    "JARAK SATU JENGKAL AJA GAK SAMPE! 🤏",
    "BELI BALSEM DULU SANA, ENCOK TUH! 🧴",
    "TANGANNYA LICIN KENA MINYAK GORENG! 🍳"
  ];

  function createShuffleBag(items) {
    let bag = [];
    let lastItem = null;
    return function getNext() {
      if (bag.length === 0) {
        bag = [...items];
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        if (bag.length > 1 && bag[bag.length - 1] === lastItem) {
          const swap = Math.floor(Math.random() * (bag.length - 1));
          [bag[bag.length - 1], bag[swap]] = [bag[swap], bag[bag.length - 1]];
        }
      }
      lastItem = bag.pop();
      return lastItem;
    };
  }

  const getNextVillagerShout = createShuffleBag(VILLAGER_SHOUTS);
  const getNextDodgeTaunt = createShuffleBag(DODGE_TAUNTS);
  const getNextShortTaunt = createShuffleBag(SHORT_THROW_TAUNTS);

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

  function drawPocimanRosettes(ctx, p) {
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
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7d7062';
    ctx.fillRect(-5, -38, 10, 3.5);
    ctx.strokeRect(-5, -38, 10, 3.5);

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
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7d7062';
    ctx.fillRect(-4, 42, 8, 3);
    ctx.strokeRect(-4, 42, 8, 3);
  }

  function drawPocimanKnotsAndRopes(ctx, p) {
    ctx.strokeStyle = '#3e352d';
    ctx.fillStyle = '#7d7062';
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.roundRect(-8, -4, 16, 4.5, 2);
    ctx.fill(); ctx.stroke();

    ctx.strokeStyle = '#998a7c'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-5, -6); ctx.lineTo(-4, -4);
    ctx.moveTo(0, -7); ctx.lineTo(0, -4);
    ctx.moveTo(5, -6); ctx.lineTo(4, -4);
    ctx.moveTo(-4, 0); ctx.lineTo(-5, 3);
    ctx.moveTo(4, 0); ctx.lineTo(5, 3);
    ctx.stroke();

    ctx.strokeStyle = '#3e352d'; ctx.fillStyle = '#7d7062'; ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-8, 17, 16, 4.5, 2);
    ctx.fill(); ctx.stroke();

    drawPocimanRosettes(ctx, p);
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
    if (kuntiPowerup.active) {
      drawFaceKuntiJoy(ctx, p, faceY);
    } else if (p.hitTimer > 0) {
      drawFaceHit(ctx, p, faceY);
    } else if (p.tauntTimer > 0) {
      drawFaceTaunt(ctx, p, faceY);
    } else {
      drawFacePanic(ctx, p, faceY);
    }
  }

  function drawFaceKuntiJoy(ctx, p, faceY) {
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(-7, faceY - 2, 5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.arc(7, faceY - 2, 5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.beginPath();
    ctx.arc(-11, faceY + 5, 4, 0, Math.PI * 2);
    ctx.arc(11, faceY + 5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, faceY + 4, 5, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
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

  function drawCrawlTailRuffle(ctx, stretch, tailWiggle) {
    ctx.beginPath();
    ctx.moveTo(-42 + stretch * 0.5, 30);
    ctx.lineTo(-50, 24 + tailWiggle);
    ctx.lineTo(-46, 30);
    ctx.lineTo(-52, 36 + tailWiggle);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  function drawCrawlKnots(ctx, headX, tailWiggle) {
    ctx.beginPath();
    ctx.moveTo(headX + 16, 26);
    ctx.lineTo(headX + 26, 20 + tailWiggle);
    ctx.lineTo(headX + 22, 28);
    ctx.lineTo(headX + 27, 34 + tailWiggle);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  function drawPocimanCrawlingUlat(ctx, p) {
    const cycle = p.animTime * 14;
    const hump = Math.abs(Math.sin(cycle)) * 14;
    const stretch = Math.cos(cycle) * 6;
    const tailWiggle = Math.sin(cycle * 1.5) * 6;

    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.4;
    ctx.fillStyle = '#dfd7ce';

    ctx.beginPath();
    ctx.ellipse(-26 + stretch * 0.5, 30, 16, 10, 0.1, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    drawCrawlTailRuffle(ctx, stretch, tailWiggle);

    ctx.beginPath();
    ctx.ellipse(-6, 26 - hump, 17, 13, 0.3 * Math.sin(cycle), 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    const headX = 18 - stretch * 0.5;
    ctx.beginPath();
    ctx.ellipse(headX, 30, 18, 14, -0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    drawCrawlKnots(ctx, headX, tailWiggle);
    drawCrawlFace(ctx, p, headX, 30);

    if (Math.random() < 0.35) createDust(p.x - 20, GROUND_Y);
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
    const wargaMinX = -75;
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
    if (currentStage >= 6) {
      drawCrowdSilhouette(ctx, currentStage);
    }

    // Main Foreground Characters (Humanized & Running Mob with Hansip front & center)
    drawHansip(ctx, 45, 0, mobRunCycle);
    drawPemuda(ctx, 90, 0, mobRunCycle + 1.2);
    drawPakRT(ctx, 0, 0, mobRunCycle + 2.4);
    drawEmak(ctx, -50, 0, mobRunCycle + 3.6);

    if (currentStage >= 8) {
      drawBocilSarung(ctx, -95, 0, mobRunCycle + 4.8);
    }

    ctx.restore();

    // Comic speech bubble in absolute coordinates (never clipped on left edge)
    if (shoutTimer > 0 && currentShout) {
      drawSpeechBubble(ctx, wargaX + 75, GROUND_Y - 145, currentShout);
    }
  }

  function drawCrowdSilhouette(ctx, stg) {
    const crowdCount = Math.min(8, Math.floor((stg - 5) / 2.4));
    if (crowdCount <= 0) return;
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

  function drawRunningHumanLegs(ctx, runPhase, trouserColor, shoeColor, isSandal = false) {
    const swingL = Math.sin(runPhase) * 0.55;
    const swingR = Math.sin(runPhase + Math.PI) * 0.55;

    // Back leg (Right)
    ctx.save();
    ctx.translate(4, -22);
    ctx.rotate(swingR);
    ctx.fillStyle = trouserColor;
    ctx.fillRect(-3, 0, 6, 16); ctx.strokeRect(-3, 0, 6, 16);
    ctx.fillStyle = shoeColor;
    if (isSandal) {
      ctx.fillRect(-4, 16, 9, 3); ctx.strokeRect(-4, 16, 9, 3);
      ctx.fillStyle = '#fed7aa'; ctx.fillRect(-3, 13, 6, 4);
    } else {
      ctx.fillRect(-4, 15, 9, 7); ctx.strokeRect(-4, 15, 9, 7);
    }
    ctx.restore();

    // Front leg (Left)
    ctx.save();
    ctx.translate(-4, -22);
    ctx.rotate(swingL);
    ctx.fillStyle = trouserColor;
    ctx.fillRect(-3, 0, 6, 16); ctx.strokeRect(-3, 0, 6, 16);
    ctx.fillStyle = shoeColor;
    if (isSandal) {
      ctx.fillRect(-4, 16, 9, 3); ctx.strokeRect(-4, 16, 9, 3);
      ctx.fillStyle = '#fed7aa'; ctx.fillRect(-3, 13, 6, 4);
    } else {
      ctx.fillRect(-4, 15, 9, 7); ctx.strokeRect(-4, 15, 9, 7);
    }
    ctx.restore();
  }

  function drawHansipHead(ctx) {
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath(); ctx.arc(0, -64, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#14532d';
    ctx.beginPath(); ctx.roundRect(-10, -77, 21, 9, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, -70, 14, 3);
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(0, -74, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-4, -64, 4.5, 0, Math.PI * 2); ctx.arc(4, -64, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(-3, -64, 1.8, 0, Math.PI * 2); ctx.arc(5, -64, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.arc(0, -56, 3, 0, Math.PI); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#facc15'; ctx.fillRect(2, -58, 6, 3);
  }

  function drawHansip(ctx, x, y, runPhase) {
    const bob = Math.abs(Math.sin(runPhase * 2)) * 3.5;
    ctx.save();
    ctx.translate(x, y - bob);
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2.2;

    drawRunningHumanLegs(ctx, runPhase, '#14532d', '#0f172a', false);

    ctx.fillStyle = '#166534';
    ctx.beginPath(); ctx.roundRect(-11, -52, 24, 28, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-12, -36, 26, 4.5); ctx.strokeRect(-12, -36, 26, 4.5);
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(-5, -45, 2.5, 0, Math.PI * 2); ctx.fill();

    drawHansipHead(ctx);

    const armSwing = Math.sin(runPhase + Math.PI) * 0.45;
    ctx.save();
    ctx.translate(6, -46); ctx.rotate(armSwing);
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, -24); ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  function drawPemudaHead(ctx) {
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath(); ctx.arc(1, -78, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#dc2626'; ctx.fillRect(-10, -84, 22, 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-10, -80, 22, 3);
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.moveTo(-9, -84); ctx.lineTo(-12, -94); ctx.lineTo(-4, -88);
    ctx.lineTo(1, -96);  ctx.lineTo(6, -88);  ctx.lineTo(12, -92);
    ctx.lineTo(9, -82);  ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-3, -77, 4.5, 0, Math.PI * 2); ctx.arc(5, -77, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(-2, -77, 1.8, 0, Math.PI * 2); ctx.arc(6, -77, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.arc(2, -70, 3.5, 0, Math.PI); ctx.fill(); ctx.stroke();
  }

  function drawPemudaTorch(ctx, runPhase) {
    const torchArm = Math.sin(runPhase) * 0.4;
    ctx.save();
    ctx.translate(6, -60); ctx.rotate(torchArm);
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, -30); ctx.stroke();
    const flk = Math.sin(performance.now() / 80) * 3;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath(); ctx.moveTo(14, -30); ctx.lineTo(22, -30); ctx.lineTo(18 + flk, -52); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(18, -34, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPemuda(ctx, x, y, runPhase) {
    const bob = Math.abs(Math.sin(runPhase * 2)) * 3.5;
    ctx.save();
    ctx.translate(x, y - bob);
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.2;

    drawRunningHumanLegs(ctx, runPhase, '#fed7aa', '#0f172a', true);
    ctx.fillStyle = '#15803d';
    ctx.beginPath(); ctx.roundRect(-12, -48, 25, 26, 4); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.roundRect(-10, -70, 22, 24, 6); ctx.fill(); ctx.stroke();

    drawPemudaHead(ctx);
    drawPemudaTorch(ctx, runPhase);

    ctx.restore();
  }

  function drawPakRTHead(ctx) {
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath(); ctx.arc(0, -66, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath(); ctx.roundRect(-12, -81, 24, 11, 3); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-5, -67, 5, 0, Math.PI * 2); ctx.arc(5, -67, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(-4, -67, 2, 0, Math.PI * 2); ctx.arc(6, -67, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#262626';
    ctx.beginPath(); ctx.ellipse(0, -60, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.arc(0, -56, 3, 0, Math.PI); ctx.fill(); ctx.stroke();
  }

  function drawPakRT(ctx, x, y, runPhase) {
    const bob = Math.abs(Math.sin(runPhase * 2)) * 3;
    ctx.save();
    ctx.translate(x, y - bob);
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.2;

    drawRunningHumanLegs(ctx, runPhase, '#1e293b', '#78350f', true);

    ctx.fillStyle = '#92400e';
    ctx.beginPath(); ctx.ellipse(0, -42, 16, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(-5, -42, 2, 0, Math.PI * 2); ctx.arc(4, -38, 2, 0, Math.PI * 2); ctx.fill();

    drawPakRTHead(ctx);

    const armSwing = Math.sin(runPhase + Math.PI) * 0.35;
    ctx.save();
    ctx.translate(-8, -46); ctx.rotate(armSwing);
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-16, -14); ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.roundRect(-22, -14, 14, 16, 3); ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  function drawEmakHead(ctx) {
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath(); ctx.arc(0, -66, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.roundRect(-12, -78, 6, 6, 2); ctx.roundRect(-2, -80, 6, 6, 2); ctx.roundRect(8, -78, 6, 6, 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-5, -67, 4.5, 0, Math.PI * 2); ctx.arc(5, -67, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(-4, -67, 1.8, 0, Math.PI * 2); ctx.arc(6, -67, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.arc(0, -58, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  function drawEmak(ctx, x, y, runPhase) {
    const bob = Math.abs(Math.sin(runPhase * 2)) * 3.5;
    ctx.save();
    ctx.translate(x, y - bob);
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2.2;

    drawRunningHumanLegs(ctx, runPhase, '#fed7aa', '#38bdf8', true);

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-10, -54); ctx.lineTo(10, -54);
    ctx.lineTo(17, -14);  ctx.lineTo(-17, -14);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.arc(-5, -34, 2.5, 0, Math.PI * 2); ctx.arc(6, -26, 2.5, 0, Math.PI * 2); ctx.fill();

    drawEmakHead(ctx);

    const broomSwing = Math.sin(runPhase + Math.PI) * 0.6;
    ctx.save();
    ctx.translate(8, -48); ctx.rotate(broomSwing);
    ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, -32); ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(18, -46, 8, 16); ctx.strokeRect(18, -46, 8, 16);
    ctx.restore();

    ctx.restore();
  }

  function drawBocilSarung(ctx, x, y, runPhase) {
    const bob = Math.abs(Math.sin(runPhase * 3)) * 3;
    ctx.save();
    ctx.translate(x, y - bob);
    ctx.strokeStyle = '#3e352d';
    ctx.lineWidth = 2;

    // Running little legs
    drawRunningHumanLegs(ctx, runPhase * 1.4, '#fed7aa', '#0f172a', true);

    // Blue ninja sarung
    ctx.fillStyle = '#0284c7';
    ctx.beginPath(); ctx.ellipse(0, -30, 11, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Head with sarung mask
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath(); ctx.arc(0, -52, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-7, -60, 14, 5); ctx.strokeRect(-7, -60, 14, 5);

    // Big excited eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-3, -52, 3.5, 0, Math.PI * 2); ctx.arc(3, -52, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e352d';
    ctx.beginPath(); ctx.arc(-2, -52, 1.5, 0, Math.PI * 2); ctx.arc(4, -52, 1.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }


  function drawSpeechBubble(ctx, x, y, text) {
    if (!text) return;
    ctx.save();
    ctx.font = 'bold 13px sans-serif';
    const textW = ctx.measureText(text).width;
    const pad = 10;
    const bw = textW + pad * 2;
    const bh = 26;
    const bx = Math.max(12, Math.min(V_WIDTH - bw - 12, x - pad));

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(bx, y - 16, bw, bh, 6);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bx + 18, y + 10);
    ctx.lineTo(bx + 8, y + 18);
    ctx.lineTo(bx + 28, y + 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.fillText(text, bx + pad, y + 2);
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
    { type: 'sapu', name: 'Sapu Ijuk', w: 40, h: 14, color: '#ca8a04' },
    { type: 'celana_dalam', name: 'Celana Dalam Pink', w: 28, h: 20, color: '#f472b6' },
    { type: 'bh_merah', name: 'BH Renda Emak', w: 34, h: 18, color: '#e11d48' },
    { type: 'ember', name: 'Ember Seng', w: 32, h: 28, color: '#94a3b8' },
    { type: 'botol', name: 'Botol Kecap', w: 22, h: 32, color: '#1e293b' },
    { type: 'kucing_terbang', name: 'Kucing Terbang', w: 34, h: 22, color: '#ea580c' }
  ];

  function spawnThrownItem(wargaX) {
    const itemDef = THROW_TYPES[Math.floor(Math.random() * THROW_TYPES.length)];
    const startX = Math.max(20, wargaX + 70);
    const startY = GROUND_Y - 80;
    const dx = player.x - startX;

    let vx, vy, rotSpeed;
    const isPowerLob = Math.random() < Math.min(0.32, 0.08 + (stage - 1) * 0.012);
    const isShortThrow = !isPowerLob && Math.random() < 0.25;

    if (isPowerLob) {
      vy = -370 - Math.random() * 90;
      const t = 1.15 + Math.random() * 0.25;
      vx = (dx + 80 + Math.random() * 70) / t;
      rotSpeed = 12 + Math.random() * 12;
    } else if (isShortThrow) {
      vy = -160 - Math.random() * 60;
      const t = Math.max(0.8, dx / 380);
      vx = (dx - 90 - Math.random() * 40) / t;
      rotSpeed = 6 + Math.random() * 8;
    } else {
      vy = -200 - Math.random() * 100;
      const t = Math.max(0.88, dx / (370 + stage * 1.8));
      vx = dx / t + (Math.random() - 0.5) * 35;
      rotSpeed = 8 + Math.random() * 10;
    }

    if (itemDef.type === 'kucing_terbang' && window.soundManager && window.soundManager.playCatMeow) {
      window.soundManager.playCatMeow();
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

  function getStageObstaclePool(stg) {
    return OBSTACLE_TYPES;
  }

  function spawnObstacle() {
    const lastObs = obstacles[obstacles.length - 1];
    const minGap = stage === 1 ? 260 : Math.max(180, 240 - stage * 5);
    if (lastObs && lastObs.x > V_WIDTH - minGap) return;
    const pool = getStageObstaclePool(stage);
    const obsDef = pool[Math.floor(Math.random() * pool.length)];
    const isCat = obsDef.type === 'kucing';
    const catRoll = Math.random();
    const catState = isCat
      ? (catRoll < 0.55 ? 'walking_left' : (catRoll < 0.80 ? 'idle' : 'walking_right'))
      : 'idle';

    obstacles.push({
      x: V_WIDTH + 30,
      y: GROUND_Y - obsDef.yOffset,
      w: obsDef.w,
      h: obsDef.h,
      type: obsDef.type,
      name: obsDef.name,
      color: obsDef.color,
      state: catState,
      facing: catState === 'walking_right' ? 1 : -1,
      spooked: false,
      meowed: false,
      hit: false,
      scratched: false,
      revengeDodged: false,
      closeReacted: false,
      aiTimer: 1.5 + Math.random() * 1.5,
      furiousTimer: 0,
      runSpeed: 0,
      walkSpeed: 38,
      animTime: 0
    });
  }

  function spawnLandedCat(landX) {
    if (landX < -50 || landX > V_WIDTH + 150) return;
    const catDef = OBSTACLE_TYPES.find(o => o.type === 'kucing') || { w: 38, h: 24, yOffset: 24, color: '#f97316', name: 'Kucing Oren' };
    const zoomLeft = Math.random() < 0.65;
    obstacles.push({
      x: landX,
      y: GROUND_Y - catDef.yOffset,
      w: catDef.w,
      h: catDef.h,
      type: 'kucing',
      name: 'Kucing Oren',
      color: catDef.color,
      state: zoomLeft ? 'sprint_left' : 'sprint_right',
      facing: zoomLeft ? -1 : 1,
      spooked: false,
      meowed: true,
      hit: false,
      scratched: false,
      revengeDodged: false,
      closeReacted: true,
      aiTimer: 2.0,
      furiousTimer: 0,
      runSpeed: 0,
      walkSpeed: 42,
      animTime: 0
    });
    if (window.soundManager && window.soundManager.playCatMeow) {
      window.soundManager.playCatMeow();
    }
    createDust(landX, GROUND_Y);
    addComicText("MENDARAT SELAMAT! 🐾💨", landX, GROUND_Y - 25, '#fb923c');
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
    const clampedX = Math.max(20, Math.min(V_WIDTH - 180, x));
    comicTexts.push({ text, x: clampedX, y, alpha: 1, vy: -55, color });
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
    if (skipCutsceneBtn) skipCutsceneBtn.classList.add('hidden');
    if (hudEl) hudEl.classList.add('hidden');
    if (endingVideoContainer) endingVideoContainer.classList.add('hidden');
    if (endingVideo) { endingVideo.pause(); }
    if (wallOfHonorModal) wallOfHonorModal.classList.add('hidden');
  }

  function showStageBanner(text) {
    stageBannerTextEl.textContent = text;
    stageBannerEl.classList.remove('hidden');
    stageBannerTimer = 2.4;
  }

  function getStageKuntiQuota(stg) {
    if (stg < 2) return 0;
    const appears = Math.random() < 0.55;
    if (!appears) return 0;
    return Math.random() < 0.30 ? 2 : 1;
  }

  function resetStageState() {
    escapeGap = 50;
    bumpCount = 0;
    dodgedThrows = 0;
    cemeteryGate.active = false;
    cemeteryGate.entered = false;
    cemeteryGate.x = -999;
    player.reset();
    kuntiPowerup.reset();
    kuntiPowerup.maxSpawnsPerStage = getStageKuntiQuota(stage);
    obstacles = [];
    thrownItems = [];
    particles = [];
    comicTexts = [];
    warningActive = false;
    shoutTimer = 0;
    currentShout = "";
  }

  function startStage(targetStage) {
    stage = Math.max(1, Math.min(TOTAL_STAGES, targetStage));
    stageTotalTime = getStageDuration(stage);
    stageTimer = stageTotalTime;
    throwTimer = stage === 1 ? 3.6 : Math.max(2.0, 3.8 - (stage - 1) * 0.18);
    obstacleTimer = Math.max(1.2, 2.2 - (stage - 1) * 0.09);

    resetStageState();

    initVillageScenery();
    updateHUD();
    hideAllModals();
    if (hudEl) hudEl.classList.remove('hidden');
    updateTouchHelper();

    gameState = STATE.PLAYING;
    lastTime = performance.now();

    if (stage === 1) {
      distance = 0;
      totalBumps = 0;
    }

    showStageBanner(`⭐ STAGE ${stage}: MENUJU GERBANG TPU!`);
    window.soundManager.playStageUp();
    window.soundManager.playBgm();
  }

  function updateSpeedAndDistance(dt) {
    const progress = 1 - (stageTimer / stageTotalTime);
    const rushBonus = progress > 0.75 ? 16 : (progress > 0.35 ? 8 : 0);
    const baseSpeed = 330 + (stage - 1) * 14.5 + rushBonus;
    let currentSpeed = baseSpeed;
    if (player.tripTimer > 0) currentSpeed = baseSpeed * 0.5;
    else if (player.slowTimer > 0) currentSpeed = baseSpeed * 0.6;
    gameSpeed = currentSpeed;
    distance += (currentSpeed * dt) / 10;
  }

  function updateCemeteryGate(dt) {
    stageTimer = Math.max(0, stageTimer - dt);
    if (stageTimer <= 5.5 && !cemeteryGate.active) {
      cemeteryGate.active = true;
      cemeteryGate.x = V_WIDTH + 80;
      cemeteryGate.entered = false;
    }
    if (cemeteryGate.active) {
      cemeteryGate.x -= gameSpeed * dt;
      if (player.x >= cemeteryGate.x - 25 && !cemeteryGate.entered) {
        cemeteryGate.entered = true;
        window.soundManager.playGateSlam();
        setTimeout(() => {
          if (stage >= TOTAL_STAGES) startEndingCutscene();
          else triggerStageClear();
        }, 350);
      }
    }
    if (stageBannerTimer > 0) {
      stageBannerTimer -= dt;
      if (stageBannerTimer <= 0) stageBannerEl.classList.add('hidden');
    }
  }

  function updateEscapeGap(dt) {
    if (player.tripTimer > 0) {
      const tripDrain = (13 + stage * 0.72) * dt;
      escapeGap = Math.max(0, escapeGap - tripDrain);
    } else if (player.slowTimer > 0) {
      const slowDrain = (9 + stage * 0.52) * dt;
      escapeGap = Math.max(0, escapeGap - slowDrain);
    } else {
      const catchupBonus = escapeGap < 30 ? 1.8 * dt : 0;
      escapeGap = Math.min(100, escapeGap + (3.8 * dt) + catchupBonus);
    }
    if (escapeGap <= 0) {
      triggerBustedSequence();
      return true;
    }
    return false;
  }

  function updateShoutTimer(dt) {
    shoutTimer -= dt;
    if (shoutTimer <= 0 && escapeGap < 75) {
      currentShout = getNextVillagerShout();
      shoutTimer = Math.max(1.8, 3.8 - stage * 0.04);
    }
  }

  function updateKuntiFlight(dt) {
    player.isGrounded = false;
    player.vy = 0;
    const targetY = GROUND_Y - 170 + Math.sin(player.animTime * 3.5) * 8;
    player.y += (targetY - player.y) * Math.min(1, dt * 7);
    player.tripTimer = 0;
    player.slowTimer = 0;
    player.hitTimer = 0;
    if (Math.random() < 0.35) {
      createKuntiSparkles(player.x - 10 + Math.random() * 40, player.y + 40, 1);
    }
  }

  // --- Main Update Loop ---
  function update(dt) {
    if (gameState !== STATE.PLAYING) return;
    updateSpeedAndDistance(dt);
    updateCemeteryGate(dt);
    if (updateEscapeGap(dt)) return;

    const wargaX = getWargaX();
    mobRunCycle = (mobRunCycle + dt * 13) % (Math.PI * 2);
    updateShoutTimer(dt);

    player.update(dt);
    if (kuntiPowerup.active) updateKuntiFlight(dt);

    updatePowerupMechanics(dt);
    updateThrownMechanics(dt, wargaX);
    updateObstacleMechanics(dt);
    updateParticlesAndScenery(dt);
    updateHUD();
  }

  function triggerPocimanTaunt(isShort = false) {
    if (player.tripTimer > 0 || player.hitTimer > 0) return;
    if (isShort && player.tauntTimer > 0.4) return;
    player.tauntTimer = 1.6;
    player.tauntText = isShort ? getNextShortTaunt() : getNextDodgeTaunt();
    player.tauntIsShort = isShort;
    const bonus = isShort ? 1.2 : 1.8;
    escapeGap = Math.min(100, escapeGap + bonus);
    if (window.soundManager && window.soundManager.playTaunt) {
      window.soundManager.playTaunt();
    }
  }

  function createKuntiSparkles(x, y, count = 2) {
    const colors = ['#c084fc', '#e879f9', '#38bdf8', '#fef08a'];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: -50 - Math.random() * 40,
        vy: (Math.random() - 0.5) * 60,
        radius: 2 + Math.random() * 3,
        alpha: 0.95,
        life: 0.45,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function activateKuntiPowerup() {
    kuntiPowerup.itemActive = false;
    kuntiPowerup.active = true;
    kuntiPowerup.timer = kuntiPowerup.duration;
    kuntiPowerup.dialogTimer = 3.6;
    kuntiPowerup.dialogText = KUNTI_RESCUE_LINES[Math.floor(Math.random() * KUNTI_RESCUE_LINES.length)];

    player.tripTimer = 0;
    player.slowTimer = 0;
    player.hitTimer = 0;
    player.tauntTimer = 0;
    escapeGap = Math.min(100, escapeGap + 25);

    if (window.soundManager && window.soundManager.playKuntiRescue) {
      window.soundManager.playKuntiRescue();
    }
    addComicText("DITOLONG MBAK KUNTI! 👻💖", player.x, player.y - 40, '#d8b4fe');
    createKuntiSparkles(player.x, player.y, 14);
  }

  function deactivateKuntiPowerup() {
    kuntiPowerup.active = false;
    addComicText("DAH MAS POCI, HATI-HATI! 👋", player.x, player.y - 35, '#c084fc');
    createKuntiSparkles(player.x, player.y, 12);
    player.vy = 60;
  }

  function trySporadicKuntiSpawn(dt) {
    if (kuntiPowerup.maxSpawnsPerStage <= 0) return;
    if (kuntiPowerup.spawnedThisStage >= kuntiPowerup.maxSpawnsPerStage) return;
    if (kuntiPowerup.spawnedThisStage >= 2) return;

    const progress = 1 - (stageTimer / stageTotalTime);
    kuntiPowerup.checkTimer -= dt;
    if (kuntiPowerup.checkTimer > 0) return;
    kuntiPowerup.checkTimer = 5.5 + Math.random() * 3.5;

    const canRoll = progress > 0.20 && progress < 0.80 &&
      !kuntiPowerup.itemActive && !kuntiPowerup.active;

    if (!canRoll) return;
    const rollChance = escapeGap < 35 ? 0.45 : 0.22;
    if (Math.random() < rollChance) {
      kuntiPowerup.itemActive = true;
      kuntiPowerup.itemX = V_WIDTH + 50;
      kuntiPowerup.itemY = GROUND_Y - 95;
      kuntiPowerup.spawnedThisStage++;
      kuntiPowerup.checkTimer = 16.0 + Math.random() * 6.0;
      addComicText("✨ MBAK KUNTI MUNCUL! ✨", V_WIDTH - 150, GROUND_Y - 130, '#c084fc');
    }
  }

  function updatePowerupMechanics(dt) {
    trySporadicKuntiSpawn(dt);

    if (kuntiPowerup.itemActive) {
      kuntiPowerup.itemX -= gameSpeed * dt;
      kuntiPowerup.itemBob += dt * 4;
      kuntiPowerup.itemY = GROUND_Y - 95 + Math.sin(kuntiPowerup.itemBob) * 14;

      const pBox = { x: kuntiPowerup.itemX - 16, y: kuntiPowerup.itemY - 16, w: 32, h: 32 };
      if (checkRectOverlap(player, pBox)) activateKuntiPowerup();
      if (kuntiPowerup.itemX < -60) kuntiPowerup.itemActive = false;
    }

    if (kuntiPowerup.active) {
      kuntiPowerup.timer -= dt;
      if (kuntiPowerup.dialogTimer > 0) kuntiPowerup.dialogTimer -= dt;
      if (kuntiPowerup.timer <= 0) deactivateKuntiPowerup();
    }
  }

  function triggerBarrageThrows(wargaX) {
    spawnThrownItem(wargaX);
    const progress = 1 - (stageTimer / stageTotalTime);
    const phaseBoost = progress > 0.40 ? 0.12 : 0;
    const doubleChance = stage >= 2 ? Math.min(0.72, 0.18 + (stage - 2) * 0.065 + phaseBoost) : 0;
    if (Math.random() < doubleChance) {
      setTimeout(() => { if (gameState === STATE.PLAYING) spawnThrownItem(wargaX); }, 380);
    }
    const tripleChance = stage >= 4 ? Math.min(0.48, 0.10 + (stage - 4) * 0.06 + phaseBoost) : 0;
    if (Math.random() < tripleChance) {
      setTimeout(() => { if (gameState === STATE.PLAYING) spawnThrownItem(wargaX); }, 760);
    }
  }

  function getItemHitMessage(item) {
    if (!item) return "POYONGAN! -40% SPEED! 🤕";
    if (item.type === 'celana_dalam') return "KECELUP CD PINK! 🩲😵";
    if (item.type === 'bh_merah') return "KETAMPAR BH RENDA! 👙😳";
    if (item.type === 'ember') return "KEMBALIKAN EMBERKU! 🪣💥";
    if (item.type === 'sapu') return "DISAPU BERSIH! 🧹💢";
    if (item.type === 'botol') return "PECAH KECAP! 🍾🤕";
    if (item.type === 'kucing_terbang') return "DICAKAR KUCING TERBANG! 🙀⚡";
    return "POYONGAN! -40% SPEED! 🤕";
  }

  function handleItemHit(index) {
    const item = thrownItems[index];
    bumpCount++;
    totalBumps++;
    player.bumpLevel = Math.min(3, player.bumpLevel + 1);
    player.hitTimer = 0.8;
    player.slowTimer = 1.0;
    player.tauntTimer = 0;
    player.invulnerableTime = 1.5;

    const penalty = Math.min(16, 7 + stage * 0.8);
    escapeGap = Math.max(0, escapeGap - penalty);

    window.soundManager.playBonk();
    const hitMsg = getItemHitMessage(item);
    if (item && item.type === 'kucing_terbang') {
      spawnLandedCat(player.x - 20);
    }
    addComicText(hitMsg, player.x, player.y - 25, '#ef4444');

    thrownItems.splice(index, 1);
    updateHUD();
  }

  function updateThrowTimer(dt, wargaX) {
    throwTimer -= dt;
    if (throwTimer <= 0.85 && !warningActive) {
      warningActive = true;
      throwWarningEl.classList.remove('hidden');
      window.soundManager.playWarning();
    }

    if (throwTimer <= 0) {
      triggerBarrageThrows(wargaX);
      warningActive = false;
      throwWarningEl.classList.add('hidden');
      const progress = 1 - (stageTimer / stageTotalTime);
      const phaseSpeedup = progress > 0.70 ? 0.45 : (progress > 0.35 ? 0.25 : 0);
      const baseCooldown = stage === 1 ? 3.9 : Math.max(1.7, 3.8 - (stage - 1) * 0.23 - phaseSpeedup);
      throwTimer = Math.max(1.4, baseCooldown + Math.random() * 0.35);
    }
  }

  function updateThrownMechanics(dt, wargaX) {
    updateThrowTimer(dt, wargaX);

    for (let i = thrownItems.length - 1; i >= 0; i--) {
      const item = thrownItems[i];
      item.x += item.vx * dt;
      item.vy += GRAVITY * 0.7 * dt;
      item.y += item.vy * dt;
      item.rot += item.rotSpeed * dt;

      if (!kuntiPowerup.active && player.invulnerableTime <= 0 && checkRectOverlap(player, item)) {
        handleItemHit(i);
        continue;
      }

      if (!item.passed && item.x > player.x + 20) {
        item.passed = true;
        dodgedThrows++;
        escapeGap = Math.min(100, escapeGap + 1.2);
        triggerPocimanTaunt(false);
      }

      if (item.y > GROUND_Y - 10) {
        createDust(item.x, GROUND_Y);
        if (item.type === 'kucing_terbang') {
          spawnLandedCat(item.x);
        }
        if (!item.passed && item.x < player.x - 30) triggerPocimanTaunt(true);
        thrownItems.splice(i, 1);
        continue;
      }

    }
  }

  function handleObstacleHit(obs) {
    player.tripTimer = 0.8;
    player.slowTimer = 0;
    player.tauntTimer = 0;
    player.invulnerableTime = 1.4;

    const penalty = Math.min(18, 10 + stage * 0.75);
    escapeGap = Math.max(0, escapeGap - penalty);

    if (obs.type === 'kucing') {
      obs.hit = true;
      obs.state = 'furious_prep';
      obs.furiousTimer = 0.65;
      if (window.soundManager && window.soundManager.playCatHiss) {
        window.soundManager.playCatHiss();
      } else if (window.soundManager && window.soundManager.playCatScreech) {
        window.soundManager.playCatScreech();
      }
      addComicText("BULU BERDIRI! KUCING NGAMUK! 😾⚡", obs.x, obs.y - 25, '#f97316');
      createDust(obs.x + 8, GROUND_Y);
    } else {
      window.soundManager.playTrip();
      addComicText("GUBRAK! MERAYAP ULAT! 🐛", player.x, player.y - 25, '#f59e0b');
    }

    createDust(player.x, GROUND_Y);
    updateHUD();
  }

  function handleCatCloseReaction(obs) {
    obs.closeReacted = true;
    const r = Math.random();
    if (r < 0.25) {
      obs.state = 'idle';
      obs.facing = -1;
      addComicText("NGAMBEK NGE-REM! 😼", obs.x, obs.y - 20, '#fb923c');
    } else if (r < 0.50) {
      obs.state = 'walking_right';
      obs.facing = 1;
      addComicText("BALIK KANAN JALAN! 🐾", obs.x, obs.y - 20, '#38bdf8');
    } else if (r < 0.72) {
      obs.state = 'sprint_right';
      obs.facing = 1;
      addComicText("BALIK KANAN LARI! 💨", obs.x, obs.y - 20, '#facc15');
    } else {
      obs.state = 'sprint_left';
      obs.facing = -1;
      addComicText("LARI NABRAK! 🙀⚡", obs.x, obs.y - 20, '#ef4444');
    }
  }

  function updateCatAI(obs, dt) {
    if (obs.scratched || obs.revengeDodged) return;
    if (obs.state === 'furious_prep') {
      obs.furiousTimer -= dt;
      if (obs.furiousTimer <= 0) {
        obs.state = 'furious_charge';
        if (window.soundManager && window.soundManager.playCatScreech) {
          window.soundManager.playCatScreech();
        }
        addComicText("SERANG BALIK! 😾💨", obs.x, obs.y - 22, '#ef4444');
      }
      return;
    }
    if (obs.state === 'furious_charge') return;

    const dist = obs.x - player.x;
    if (!obs.closeReacted && dist > 25 && dist < 105) {
      handleCatCloseReaction(obs);
      return;
    }

    if (obs.x > player.x + 85) {
      obs.aiTimer -= dt;
      if (obs.aiTimer <= 0) {
        const roll = Math.random();
        if (roll < 0.40) { obs.state = 'walking_left'; obs.facing = -1; }
        else if (roll < 0.65) { obs.state = 'walking_right'; obs.facing = 1; }
        else if (roll < 0.85) { obs.state = 'idle'; obs.facing = -1; }
        else {
          obs.state = 'sprint_left'; obs.facing = -1;
          addComicText("ZOOMIES! 🐾💨", obs.x, obs.y - 18, '#fb923c');
        }
        obs.aiTimer = 1.4 + Math.random() * 1.8;
      }
    }
  }

  function updateCatMechanics(obs, dt) {
    if (!obs.meowed && obs.x <= V_WIDTH - 15) {
      obs.meowed = true;
      if (window.soundManager && window.soundManager.playCatMeow) {
        window.soundManager.playCatMeow();
      }
      addComicText("Meoong~ 🐾", obs.x, obs.y - 18, '#fb923c');
    }
    updateCatAI(obs, dt);
    const isRunning = obs.state === 'furious_charge' || obs.state === 'sprint_left' || obs.state === 'sprint_right';
    if (isRunning && Math.random() < 0.35) {
      createDust(obs.x + 4, GROUND_Y);
    }
  }

  function getCatVelocity(obs) {
    if (obs.state === 'furious_prep') return -gameSpeed;
    if (obs.state === 'furious_charge') {
      if (player.x + 10 < obs.x) { obs.facing = -1; return -gameSpeed - 260; }
      obs.facing = 1; return 280;
    }
    if (obs.state === 'walking_left') return -gameSpeed - obs.walkSpeed;
    if (obs.state === 'walking_right') return -gameSpeed + obs.walkSpeed;
    if (obs.state === 'sprint_left') return -gameSpeed - 200;
    if (obs.state === 'sprint_right') return 220;
    return -gameSpeed;
  }

  function handleCatFuriousAttack(obs) {
    obs.scratched = true;
    obs.state = obs.x >= player.x ? 'sprint_right' : 'sprint_left';
    obs.facing = obs.state === 'sprint_right' ? 1 : -1;
    player.slowTimer = 0.8;
    player.invulnerableTime = 1.4;
    escapeGap = Math.max(0, escapeGap - 8);
    if (window.soundManager && window.soundManager.playCatScratch) {
      window.soundManager.playCatScratch();
    }
    addComicText("CRET! DICAKAR KUCING! 🙀🩸", player.x + 10, player.y - 30, '#ef4444');
    addComicText("KABUURR! 🐾💨", obs.x, obs.y - 18, '#fb923c');
    createDust(player.x, GROUND_Y);
    updateHUD();
  }

  function handleObstaclePassed(obs) {
    obs.passed = true;
    escapeGap = Math.min(100, escapeGap + 0.6);
    if (obs.type !== 'kucing') return;
    if (obs.state === 'furious_charge' && !obs.scratched && !obs.revengeDodged) {
      obs.revengeDodged = true;
      obs.state = 'sprint_left';
      obs.facing = -1;
      addComicText("HUP! LOLOS CAKARAN! 🐾💨", player.x + 10, player.y - 30, '#38bdf8');
      escapeGap = Math.min(100, escapeGap + 1.2);
    } else if (!obs.hit) {
      addComicText("HUP! LOMPAT KUCING! 🐾", player.x + 10, player.y - 28, '#38bdf8');
    }
  }

  function updateObstacleMechanics(dt) {
    obstacleTimer -= dt;
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = Math.max(1.1, 2.0 - (stage - 1) * 0.08 + Math.random() * 0.35);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.animTime = (obs.animTime || 0) + dt;
      if (obs.type === 'kucing') updateCatMechanics(obs, dt);

      const vx = obs.type === 'kucing' ? getCatVelocity(obs) : -gameSpeed;
      obs.x += vx * dt;

      if (obs.type === 'kucing' && obs.state === 'furious_charge' && !obs.scratched) {
        if (!kuntiPowerup.active && player.invulnerableTime <= 0 && checkRectOverlap(player, obs)) {
          handleCatFuriousAttack(obs);
        }
      } else if (!obs.hit && !obs.scratched && !kuntiPowerup.active && player.invulnerableTime <= 0 && player.tripTimer <= 0 && checkRectOverlap(player, obs)) {
        handleObstacleHit(obs);
      }

      if (!obs.passed && obs.x < player.x - 20) {
        handleObstaclePassed(obs);
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
    if (hudEl) hudEl.classList.add('hidden');
    if (stage >= highestStage && stage < TOTAL_STAGES) {
      highestStage = stage + 1;
      try { localStorage.setItem('pociman_highest_stage', highestStage); } catch (e) {}
      updateStartScreenUI();
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

  function startEndingCutscene() {
    window.soundManager.stopBgm();
    gameState = STATE.ENDING_CUTSCENE;
    hideAllModals();
    if (skipCutsceneBtn) skipCutsceneBtn.classList.remove('hidden');
    if (endingVideoContainer) endingVideoContainer.classList.remove('hidden');

    if (endingVideo) {
      endingVideo.currentTime = 0;
      endingVideo.onended = () => showVictoryScreen();
      endingVideo.onerror = () => showVictoryScreen();
      const p = endingVideo.play();
      if (p && p.catch) {
        p.catch(() => {
          endingVideo.muted = true;
          endingVideo.play().catch(() => showVictoryScreen());
        });
      }
    } else {
      showVictoryScreen();
    }
  }

  function updateEndingCutscene(dt) {
    // Video player handles animation
  }

  function showVictoryScreen() {
    gameState = STATE.VICTORY;
    if (hudEl) hudEl.classList.add('hidden');
    if (skipCutsceneBtn) skipCutsceneBtn.classList.add('hidden');
    if (endingVideoContainer) endingVideoContainer.classList.add('hidden');
    if (endingVideo) endingVideo.pause();

    if (stage >= highestStage) {
      highestStage = TOTAL_STAGES;
      try { localStorage.setItem('pociman_highest_stage', highestStage); } catch (e) {}
      updateStartScreenUI();
    }

    winDistanceEl.textContent = `${Math.floor(distance)}m`;
    winStageEl.textContent = `${TOTAL_STAGES}/${TOTAL_STAGES} TAMAT! 👑`;
    winBumpsEl.textContent = totalBumps;
    winRankEl.textContent = totalBumps === 0 ? "Pociman Sakti Tanpa Cacat 👑" : (totalBumps <= 12 ? "Pociman Lincah ⚡" : "Pociman Benjol Tangguh 🤕");

    victoryScreen.classList.remove('hidden');
    throwWarningEl.classList.add('hidden');
    stageBannerEl.classList.add('hidden');

    if (honorFeedback) honorFeedback.classList.add('hidden');
    if (submitHonorBtn) {
      submitHonorBtn.disabled = false;
      submitHonorBtn.textContent = 'KIRIM NAMA 🏆';
    }
    if (window.soundManager && window.soundManager.playWin) {
      window.soundManager.playWin();
    }
  }

  function triggerVictory() {
    startEndingCutscene();
  }

  function triggerBustedSequence() {
    window.soundManager.stopBgm();
    gameState = STATE.BUSTED;
    if (hudEl) hudEl.classList.add('hidden');
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
    if (hudEl) hudEl.classList.add('hidden');
    finalStageEl.textContent = `Stage ${stage} / ${TOTAL_STAGES}`;
    finalDistanceEl.textContent = `${Math.floor(distance)}m`;
    finalBumpsEl.textContent = totalBumps;

    const reasons = [
      `Pociman tertangkap di Stage ${stage}! Sekarang diajak bikin TikTok bareng Pak RT... 📱`,
      "Kehabisan napas dan digendong Hansip ke pos ronda balai desa! 👮‍♂️",
      "Tersandung daster emak-emak dan diinterogasi sambil disodorin gayung merah! 🪣",
      "Kena timbukan panci gosong tepat di jidat hingga benjol tiga tingkat! 🍳🤕",
      "Kafan Pociman nyangkut di pagar bambu, pasrah digerebek warga ronda! 🎋",
      "Dikejar kucing oren kampung sampai nyungsep di selokan depan TPU! 🐱💨",
      "Tali pocong atas lepas, warga malah antre minta nomor undian kupon! 🎫",
      "Nafas ngos-ngosan, diajak ngopi tubruk & makan pisang goreng sama warga! ☕"
    ];
    deathReasonEl.textContent = reasons[Math.floor(Math.random() * reasons.length)];

    gameOverScreen.classList.remove('hidden');
    throwWarningEl.classList.add('hidden');
    stageBannerEl.classList.add('hidden');
    window.soundManager.playCaught();
  }

  // --- Render Loop & Helpers ---
  function drawSkyAndHouses(ctx) {
    const colors = getSkyColors(stage);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, colors[0]);
    skyGrad.addColorStop(1, colors[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.arc(V_WIDTH - 120, 80, 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#090d16';
    ctx.beginPath(); ctx.arc(V_WIDTH - 106, 74, 28, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }

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
  }

  function drawEnvironment(ctx) {
    drawSkyAndHouses(ctx);

    for (const t of bananaTrees) {
      ctx.save();
      ctx.translate(t.x, GROUND_Y);
      ctx.strokeStyle = '#064e3b'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, -t.h); ctx.stroke();
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.ellipse(-24, -t.h + 8, 34, 12, -0.4, 0, Math.PI * 2);
      ctx.ellipse(24, -t.h + 6, 34, 12, 0.4, 0, Math.PI * 2);
      ctx.ellipse(0, -t.h - 10, 28, 10, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const ff of fireflies) {
      ctx.fillStyle = `rgba(163, 230, 53, ${0.4 + Math.sin(ff.phase) * 0.4})`;
      ctx.beginPath(); ctx.arc(ff.x, ff.y, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, GROUND_Y, V_WIDTH, V_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, GROUND_Y, V_WIDTH, 8);
  }

  function drawEntities(ctx) {
    const wargaX = gameState === STATE.BUSTED ? (player.x - 70) : getWargaX();
    drawVillagersMob(ctx, wargaX, stage);

    if (cemeteryGate.active) drawCemeteryGate(ctx, cemeteryGate);
    if (kuntiPowerup.itemActive) drawKuntiPickup(ctx, kuntiPowerup.itemX, kuntiPowerup.itemY, kuntiPowerup.itemBob);

    for (const obs of obstacles) drawObstacle(ctx, obs);
    for (const item of thrownItems) drawThrownItem(ctx, item);

    if (gameState === STATE.BUSTED) {
      drawBustedCutscene(ctx);
    } else {
      player.draw(ctx);
      if (kuntiPowerup.active) drawKuntilanakRescue(ctx, player);
    }

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

  function draw() {
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);
    if (gameState === STATE.ENDING_CUTSCENE) {
      return;
    }
    drawEnvironment(ctx);
    drawEntities(ctx);
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
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(V_WIDTH / 2 - 145, 62, 290, 26, 13);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("Sentuh Layar / Spasi untuk Lewati ⏭️", V_WIDTH / 2, 75);
    ctx.restore();
  }

  function drawEndingCutscene(ctx) {
    const t = endingCutscene.timer;
    if (t < 4.8) {
      drawEndingAct1(ctx, t);
    } else {
      drawEndingAct2(ctx, t - 4.8);
    }
    drawCutsceneOverlay(ctx, t);
  }

  function drawCutsceneOverlay(ctx, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(20, 16, 280, 28, 6);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    const actLabel = t < 4.8 ? 'BABAK 1: GERBANG TPU TERTUTUP 🔒' : 'BABAK 2: KOS-KOSAN LIANG LAHAT ☕';
    ctx.fillText(actLabel, 30, 35);

    const progress = Math.min(1, t / endingCutscene.duration);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(0, V_HEIGHT - 6, V_WIDTH, 6);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, V_HEIGHT - 6, V_WIDTH * progress, 6);
    ctx.restore();
  }

  function drawEndingAct1(ctx, t) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.arc(V_WIDTH - 100, 80, 36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, GROUND_Y, V_WIDTH, V_HEIGHT - GROUND_Y);

    drawNisan(ctx, 620, GROUND_Y);
    drawNisan(ctx, 740, GROUND_Y);
    drawNisan(ctx, 860, GROUND_Y);

    ctx.save();
    ctx.translate(500, GROUND_Y);
    drawStonePillar(ctx, -20);
    drawStonePillar(ctx, 20);
    drawIronGateDoor(ctx, true);
    ctx.fillStyle = '#334155'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-45, -145, 90, 26, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('GERBANG TPU', 0, -128);
    ctx.restore();

    const pociX = 660 + Math.sin(t * 3) * 10;
    drawCutscenePociman(ctx, pociX, GROUND_Y - 80, t);
    drawSpeechBubble(ctx, pociX - 20, GROUND_Y - 95, "DADAH WARGA! KETEMU TAHUN DEPAN! 👋😝");

    drawAct1Villagers(ctx, t);
  }

  function drawAct1Villagers(ctx, t) {
    ctx.save();
    ctx.translate(220, GROUND_Y - 45);
    ctx.fillStyle = '#b45309'; ctx.fillRect(-10, 0, 20, 45);
    ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(0, -10, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-14, -22, 28, 10);
    ctx.restore();
    drawSpeechBubble(ctx, 220, GROUND_Y - 75, "ENCOK GUA KAMBUH! 👴💦");

    ctx.save();
    ctx.translate(330, GROUND_Y - 35);
    ctx.fillStyle = '#15803d'; ctx.fillRect(-12, 0, 24, 35);
    ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(0, -8, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(0, -15, 12, Math.PI, 0); ctx.fill();
    ctx.restore();
    drawSpeechBubble(ctx, 330, GROUND_Y - 60, "KUNCI GERBANG KETINGGALAN! 🔑😭");

    ctx.save();
    ctx.translate(430, GROUND_Y - 40);
    ctx.fillStyle = '#db2777'; ctx.fillRect(-11, 0, 22, 40);
    ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(0, -10, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(0, -18, 9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    drawSpeechBubble(ctx, 430, GROUND_Y - 80, "PANCI GUA GOSONG MAK! 🍳😩");
  }

  function drawCutscenePociman(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-16, 0, 32, 70, [14, 14, 10, 10]);
    ctx.fill(); ctx.stroke();

    ctx.beginPath(); ctx.arc(0, -5, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(-6, 20, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, 20, 3.5, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 27, 5, 0, Math.PI); ctx.stroke();

    const wave = Math.sin(t * 8) * 0.4;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(14, 25); ctx.lineTo(26, 12 + wave * 10); ctx.stroke();
    ctx.restore();
  }

  function drawEndingAct2(ctx, t) {
    ctx.fillStyle = '#1c110a';
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
    ctx.fillStyle = '#2e190e';
    ctx.fillRect(0, 0, V_WIDTH, 45);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, V_WIDTH, 10);

    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.5;
    ctx.fillRect(60, 60, 320, 36);
    ctx.strokeRect(60, 60, 320, 36);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪦 KOS-KOSAN LIANG LAHAT #01 (VIP)', 220, 83);

    const sway = Math.sin(t * 2.5) * 6;
    ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(480, 0); ctx.lineTo(480 + sway, 110); ctx.stroke();

    const glow = ctx.createRadialGradient(480 + sway, 125, 4, 480 + sway, 125, 90);
    glow.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
    glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(480 + sway, 125, 90, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(470 + sway, 110, 20, 24);

    drawAct2Characters(ctx, t);
  }

  function drawAct2Characters(ctx, t) {
    ctx.fillStyle = '#b45309'; ctx.fillRect(180, 380, 280, 24);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(200, 360, 240, 20);

    ctx.save();
    ctx.translate(260, 345);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(0, -18, 90, 28, [12, 12, 8, 8]); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-4, -4, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0f172a'; ctx.fillRect(14, -14, 24, 7);
    ctx.fillStyle = '#b45309'; ctx.fillRect(80, -22, 16, 22);
    ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(88, -26); ctx.lineTo(94, -32); ctx.stroke();
    ctx.restore();

    const kuntiFloat = Math.sin(t * 3) * 8;
    ctx.save();
    ctx.translate(620, 290 + kuntiFloat);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-24, 85); ctx.lineTo(24, 85); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0f172a'; ctx.fillRect(-14, -20, 28, 65);
    ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(0, -6, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#78350f'; ctx.fillRect(-45, 20, 42, 6);
    ctx.fillStyle = '#eab308'; ctx.fillRect(-38, 14, 28, 6);
    ctx.restore();

    drawSpeechBubble(ctx, 160, 260, "Alhamdulillah, bobo nyenyak tanpa digebuk warga! 😴✨");
    drawSpeechBubble(ctx, 480, 210, "Monggo Mas Poci, es teh manis & pisang goreng angetnya~ ☕🍌");
  }

  function downloadCertificatePng() {
    const certCanvas = document.createElement('canvas');
    certCanvas.width = 960;
    certCanvas.height = 600;
    const cctx = certCanvas.getContext('2d');
    renderCertificateCanvas(cctx, 960, 600);
    const link = document.createElement('a');
    link.download = 'sertifikat-bebas-warga-pociman.png';
    link.href = certCanvas.toDataURL('image/png');
    link.click();
    showToast('📜 Piagam berhasil diunduh ke galeri!');
  }

  function renderCertificateCanvas(ctx, w, h) {
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e293b');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 26, w - 52, h - 52);

    ctx.fillStyle = '#facc15';
    const corners = [[32, 32], [w - 32, 32], [32, h - 32], [w - 32, h - 32]];
    corners.forEach(([cx, cy]) => {
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    });

    drawCertTexts(ctx, w, h);
  }

  function drawCertTexts(ctx, w, h) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('PEMERINTAH ALAM GAIB • KELURAHAN TPU KRAMAT JATI', w / 2, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px sans-serif';
    ctx.fillText('SURAT KETERANGAN BEBAS KEJARAN WARGA', w / 2, 115);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Nomor: 001/SKBW-TPU/STAGE10/2026', w / 2, 142);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '16px sans-serif';
    ctx.fillText('Diberikan dengan penuh hormat kepada:', w / 2, 185);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 32px sans-serif';
    ctx.fillText('POCIMAN JAWARA', w / 2, 230);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px sans-serif';
    ctx.fillText('Atas kelincahan spektakuler menamatkan seluruh 10 Stage tanpa ampun,', w / 2, 275);
    ctx.fillText('berhasil lolos dari kejaran Hansip, amukan daster emak-emak, dan timbukan sandal jepit!', w / 2, 302);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(140, 335, w - 280, 75, 8); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#facc15'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Jarak: ${Math.floor(distance)}m   •   Total Benjol: ${totalBumps}x   •   Gelar: ${winRankEl ? winRankEl.textContent : 'Pociman Sakti'}`, w / 2, 378);

    drawCertSignatures(ctx, w, h);
  }

  function drawCertSignatures(ctx, w, h) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8'; ctx.font = '13px sans-serif';
    ctx.fillText('Mengetahui & Menyetujui:', w / 2, 450);

    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Anton Maulana & Tim', 250, 520);
    ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif';
    ctx.fillText('Kawan Kita Solusindo', 250, 540);

    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(w / 2, 515, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#dc2626'; ctx.font = 'bold 10px sans-serif';
    ctx.fillText('LULUS RESMI', w / 2, 512);
    ctx.fillText('TPU GAIB', w / 2, 524);

    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Mbak Kuntilanak, S.Pd', w - 250, 520);
    ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif';
    ctx.fillText('Seksi Konsumsi & Evakuasi Udara', w - 250, 540);
  }

  function shareToWhatsApp() {
    const distText = Math.floor(distance) + 'm';
    const rankText = winRankEl ? winRankEl.textContent : 'Pociman Sakti ⚡';
    const msg = `👑 ALHAMDULILLAH GUE BERHASIL NAMATIN GAME POCIMAN (10/10 STAGE)! 🏆\n\n` +
      `Lolos dari kepungan warga kampung, kejaran hansip, dan timbukan daster emak!\n` +
      `📊 Jarak Lolos: ${distText}\n` +
      `🤕 Total Benjol: ${totalBumps}x\n` +
      `🎖️ Gelar: ${rankText}\n\n` +
      `Cobain gamenya di sini, berani tamatin ga? 👇\n` +
      `https://pociman.kawankitasolusindo.co.id/`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  function drawCatHead(ctx, hx, hy, isAngry) {
    ctx.fillStyle = isAngry ? '#ea580c' : '#f97316';
    ctx.beginPath(); ctx.arc(hx, hy, 8.5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = isAngry ? '#b91c1c' : '#ea580c';
    ctx.beginPath();
    if (isAngry) {
      ctx.moveTo(hx - 7, hy - 4); ctx.lineTo(hx - 14, hy - 8); ctx.lineTo(hx - 2, hy - 7);
      ctx.moveTo(hx, hy - 7); ctx.lineTo(hx + 8, hy - 14); ctx.lineTo(hx + 7, hy - 4);
    } else {
      ctx.moveTo(hx - 6, hy - 6); ctx.lineTo(hx - 2, hy - 14); ctx.lineTo(hx + 2, hy - 6);
      ctx.moveTo(hx + 1, hy - 6); ctx.lineTo(hx + 6, hy - 13); ctx.lineTo(hx + 8, hy - 5);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(hx + 4, hy + 3, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isAngry ? '#ef4444' : '#facc15';
    ctx.beginPath(); ctx.arc(hx + 3, hy - 1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(hx + 3.5, hy - 2.5, 1.2, 3);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(hx + 6.5, hy + 2, 2, 1.5);

    if (isAngry) {
      ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx + 1, hy - 5); ctx.lineTo(hx + 6, hy - 3);
      ctx.stroke();
    }
  }

  function drawCatBody(ctx, obs, isAngry, isRunning, legPhase, tailWiggle, anim) {
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(6 + legPhase, obs.h - 6, 5, 6);
    ctx.fillRect(obs.w - 12 - legPhase, obs.h - 6, 5, 6);

    ctx.fillStyle = isAngry ? '#ea580c' : '#f97316';
    ctx.beginPath();
    ctx.ellipse(obs.w * 0.45, obs.h * 0.55, obs.w * 0.38, obs.h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isAngry) {
      ctx.fillStyle = '#c2410c';
      for (let s = 0; s < 5; s++) {
        const sx = obs.w * 0.20 + s * (obs.w * 0.12);
        ctx.beginPath();
        ctx.moveTo(sx - 3, obs.h * 0.28);
        ctx.lineTo(sx, obs.h * 0.05 + (s % 2) * 4);
        ctx.lineTo(sx + 3, obs.h * 0.28);
        ctx.fill();
      }
    }

    ctx.strokeStyle = '#c2410c'; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(obs.w * 0.35, obs.h * 0.3); ctx.lineTo(obs.w * 0.35, obs.h * 0.6);
    ctx.moveTo(obs.w * 0.50, obs.h * 0.28); ctx.lineTo(obs.w * 0.50, obs.h * 0.58);
    ctx.stroke();

    ctx.strokeStyle = isAngry ? '#b91c1c' : '#ea580c';
    ctx.lineWidth = isAngry ? 3.5 : 3;
    ctx.beginPath();
    if (isAngry) {
      const rageVibe = Math.sin(anim * 40) * 3;
      ctx.moveTo(6, obs.h * 0.5);
      ctx.lineTo(5 + rageVibe, -12);
      ctx.lineTo(7 + rageVibe, -15);
    } else if (isRunning) {
      ctx.moveTo(6, obs.h * 0.5);
      ctx.quadraticCurveTo(-4, obs.h * 0.1, -2 + tailWiggle, -6);
    } else {
      ctx.moveTo(6, obs.h * 0.5);
      ctx.quadraticCurveTo(-2, obs.h * 0.8, -4 + tailWiggle, obs.h * 0.4);
    }
    ctx.stroke();
  }

  function drawCatObstacle(ctx, obs) {
    const isAngry = obs.state === 'furious_prep' || obs.state === 'furious_charge';
    const isRunning = obs.state === 'furious_charge' || obs.state === 'sprint_left' || obs.state === 'sprint_right';
    const isWalking = obs.state === 'walking_left' || obs.state === 'walking_right';
    const anim = obs.animTime || 0;
    const legPhase = isRunning ? Math.sin(anim * 26) * 5 : (isWalking ? Math.sin(anim * 10) * 3 : 0);
    const tailWiggle = isRunning ? Math.sin(anim * 22) * 7 : Math.sin(anim * 6) * 3;

    ctx.save();
    if (obs.facing === -1) {
      ctx.translate(obs.w, 0);
      ctx.scale(-1, 1);
    }

    drawCatBody(ctx, obs, isAngry, isRunning, legPhase, tailWiggle, anim);
    drawCatHead(ctx, obs.w * 0.75, obs.h * 0.4, isAngry);
    ctx.restore();
  }

  function drawKuntiPickup(ctx, x, y, bob) {
    ctx.save();
    ctx.translate(x, y);

    const rad = 28 + Math.sin(bob * 2) * 5;
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, rad);
    aura.addColorStop(0, 'rgba(216, 180, 254, 0.7)');
    aura.addColorStop(0.6, 'rgba(192, 132, 252, 0.35)');
    aura.addColorStop(1, 'rgba(192, 132, 252, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(-rad, -rad, rad * 2, rad * 2);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 + bob * 0.5;
      const px = Math.cos(angle) * 11;
      const py = Math.sin(angle) * 11;
      ctx.beginPath();
      ctx.ellipse(px, py, 7, 4.5, angle, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#f5d0fe';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Mbak Kunti", 0, -18);

    ctx.restore();
  }

  function drawKuntilanakRescue(ctx, p) {
    const kx = p.x - 12;
    const ky = p.y - 36;
    const anim = p.animTime || 0;
    const floatWiggle = Math.sin(anim * 4) * 4;

    ctx.save();
    ctx.translate(kx, ky + floatWiggle);

    const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, 65);
    aura.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
    aura.addColorStop(1, 'rgba(192, 132, 252, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(-65, -65, 130, 130);

    drawKuntiDress(ctx, anim);
    drawKuntiHeadAndHair(ctx, anim);

    ctx.restore();

    if (kuntiPowerup.dialogTimer > 0) {
      drawSpeechBubble(ctx, p.x + 20, p.y - 75, kuntiPowerup.dialogText);
    }
  }

  function drawKuntiDress(ctx, anim) {
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.8;
    ctx.fillStyle = '#f8fafc';

    ctx.beginPath();
    ctx.moveTo(-10, -20);
    ctx.lineTo(10, -20);
    const wave1 = Math.sin(anim * 5) * 5;
    const wave2 = Math.cos(anim * 6) * 6;
    ctx.quadraticCurveTo(24 + wave1, 20, 20 + wave1, 52);
    ctx.lineTo(-20 + wave2, 52);
    ctx.quadraticCurveTo(-24 + wave2, 20, -10, -20);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fed7aa';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(6, -6, 26, 7, 3);
    ctx.fill(); ctx.stroke();
  }

  function drawKuntiHeadAndHair(ctx, anim) {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const hairSway = Math.sin(anim * 4) * 6;
    ctx.moveTo(-6, -34);
    ctx.quadraticCurveTo(-28 + hairSway, -10, -24 + hairSway, 38);
    ctx.lineTo(-8, 20);
    ctx.lineTo(0, -20);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -32, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-4, -32, 3.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.arc(4, -32, 3.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.beginPath(); ctx.arc(-7, -26, 2.5, 0, Math.PI * 2); ctx.arc(7, -26, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.ellipse(0, -24, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
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

  function drawThrownApparel(ctx, type, w, h) {
    if (type === 'celana_dalam') {
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(w / 2, -h / 2);
      ctx.lineTo(w * 0.25, h / 2);
      ctx.lineTo(-w * 0.25, h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fbcfe8'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(-2, -1, 2, 0, Math.PI * 2); ctx.arc(2, -1, 2, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'bh_merah') {
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(-w * 0.24, 0, h * 0.44, 0, Math.PI * 2);
      ctx.arc(w * 0.24, 0, h * 0.44, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fda4af'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-w * 0.44, -h * 0.35); ctx.lineTo(-w * 0.24, 0); ctx.lineTo(0, -2); ctx.lineTo(w * 0.24, 0); ctx.lineTo(w * 0.44, -h * 0.35);
      ctx.stroke();
    }
  }

  function drawThrownUtensil(ctx, type, w, h, color) {
    if (type === 'sandal') {
      ctx.fillStyle = color; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 4); ctx.fill(); ctx.stroke();
    } else if (type === 'gayung') {
      ctx.fillStyle = color;
      ctx.fillRect(-w / 2, -h / 2, w * 0.65, h);
      ctx.fillRect(w * 0.15, -h * 0.2, w * 0.45, 4);
    } else if (type === 'panci') {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, h / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillRect(h / 2, -2, 10, 4);
    } else if (type === 'sapu') {
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke();
      ctx.fillStyle = '#eab308'; ctx.fillRect(w * 0.1, -4, w * 0.4, 8);
    } else if (type === 'ember') {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(-w * 0.45, -h * 0.45); ctx.lineTo(w * 0.45, -h * 0.45);
      ctx.lineTo(w * 0.32, h * 0.45); ctx.lineTo(-w * 0.32, h * 0.45); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -h * 0.45, w * 0.32, Math.PI, 0); ctx.stroke();
    } else if (type === 'botol') {
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-w * 0.3, -h * 0.1, w * 0.6, h * 0.55);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-w * 0.12, -h * 0.45, w * 0.24, h * 0.35);
      ctx.fillStyle = '#dc2626'; ctx.fillRect(-w * 0.15, -h * 0.5, w * 0.3, 3);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(-w * 0.22, 0, w * 0.44, h * 0.25);
    }
  }

  function drawFlyingCat(ctx, w, h) {
    ctx.fillStyle = '#ea580c';
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -8); ctx.lineTo(13, -15); ctx.lineTo(15, -6);
    ctx.moveTo(2, -9); ctx.lineTo(6, -16); ctx.lineTo(8, -7); ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-14, -8, 6, 4); ctx.fillRect(10, -8, 6, 4);
    ctx.fillRect(-14, 4, 6, 4); ctx.fillRect(10, 4, 6, 4);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(7, -2, 3, 0, Math.PI * 2); ctx.arc(12, -2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(7, -2, 1.2, 0, Math.PI * 2); ctx.arc(12, -2, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-22, -8, -18, -14); ctx.stroke();
  }

  function drawThrownItem(ctx, item) {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rot);
    if (item.type === 'kucing_terbang') {
      drawFlyingCat(ctx, item.w, item.h);
    } else if (item.type === 'celana_dalam' || item.type === 'bh_merah') {
      drawThrownApparel(ctx, item.type, item.w, item.h);
    } else {
      drawThrownUtensil(ctx, item.type, item.w, item.h, item.color);
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
    } else if (gameState === STATE.ENDING_CUTSCENE) {
      updateEndingCutscene(dt);
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
    if (gameState === STATE.ENDING_CUTSCENE) {
      showVictoryScreen();
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
    if ((gameState !== STATE.PLAYING && gameState !== STATE.BUSTED && gameState !== STATE.ENDING_CUTSCENE) || e.target.closest('button') || e.target.closest('.modal-card')) return;
    e.preventDefault();
    window.soundManager.init();
    handleJumpAction();
  });

  function fitGameToScreen() {
    if (!gameContainer) return;
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    const vp = window.visualViewport;
    const screenW = isFull ? window.innerWidth : (vp ? vp.width : window.innerWidth);
    const screenH = isFull ? window.innerHeight : (vp ? vp.height : window.innerHeight);

    const availW = Math.max(280, screenW - (isFull ? 0 : 4));
    const availH = Math.max(160, screenH - (isFull ? 0 : 4));
    const targetRatio = 16 / 9;

    let w = availW;
    let h = w / targetRatio;
    if (h > availH) {
      h = availH;
      w = h * targetRatio;
    }
    if (!isFull && w > 960) {
      w = 960;
      h = 540;
    }
    gameContainer.style.width = Math.floor(w) + 'px';
    gameContainer.style.height = Math.floor(h) + 'px';
    gameContainer.style.marginLeft = 'auto';
    gameContainer.style.marginRight = 'auto';
  }

  function bindBtn(el, handler) {
    if (!el) return;
    let last = 0;
    const run = (e) => {
      const now = Date.now();
      if (now - last < 250) return;
      last = now;
      if (window.soundManager && window.soundManager.init) {
        window.soundManager.init();
      }
      handler(e);
    };
    el.addEventListener('click', run);
    el.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') {
        run(e);
      }
    });
  }

  const mobileToastEl = document.getElementById('mobileToast');
  let toastTimer = null;
  function showToast(msg) {
    if (!mobileToastEl) return;
    mobileToastEl.textContent = msg;
    mobileToastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      mobileToastEl.classList.add('hidden');
    }, 3200);
  }

  const touchHelperEl = document.getElementById('touchHelper');
  let touchHelperTimer = null;
  function updateTouchHelper() {
    if (!touchHelperEl) return;
    const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    if (isTouch) {
      touchHelperEl.classList.remove('hidden');
      clearTimeout(touchHelperTimer);
      touchHelperTimer = setTimeout(() => {
        touchHelperEl.classList.add('hidden');
      }, 5000);
    } else {
      touchHelperEl.classList.add('hidden');
    }
  }

  const isFsSupported = !!(
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen ||
    (gameContainer && (gameContainer.requestFullscreen || gameContainer.webkitRequestFullscreen))
  );

  async function toggleFullscreen() {
    if (!isFsSupported) {
      showToast('📱 Layar otomatis menyesuaikan ke ukuran HP!');
      return;
    }
    try {
      const doc = document;
      const fsEl = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
      if (!fsEl) {
        const root = document.documentElement;
        if (root.requestFullscreen) {
          await root.requestFullscreen({ navigationUI: 'hide' }).catch(() => root.requestFullscreen());
        } else if (root.webkitRequestFullscreen) {
          await root.webkitRequestFullscreen();
        } else if (gameContainer.requestFullscreen) {
          await gameContainer.requestFullscreen();
        } else if (gameContainer.webkitRequestFullscreen) {
          await gameContainer.webkitRequestFullscreen();
        }
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
        showToast('⛶ Layar Penuh Aktif');
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
        showToast('✖ Mode Layar Biasa');
      }
    } catch (e) {
      console.warn('Fullscreen toggle:', e);
    }
    setTimeout(fitGameToScreen, 150);
  }

  function handleStartResetStage() {
    if (highestStage <= 1) {
      showToast('Progress kamu sudah di Stage 1');
      return;
    }
    highestStage = 1;
    try { localStorage.setItem('pociman_highest_stage', 1); } catch (e) {}
    updateStartScreenUI();
    showToast('🔄 Progress stage berhasil direset ke Stage 1!');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  function renderWallOfHonor(list) {
    if (!honorListContainer) return;
    if (!Array.isArray(list) || list.length === 0) {
      honorListContainer.innerHTML = '<div class="honor-empty">Belum ada jawara. Jadilah yang pertama! 🏆</div>';
      return;
    }
    let html = '';
    list.slice(0, 50).forEach((entry, idx) => {
      const rankNum = idx + 1;
      const medal = rankNum === 1 ? '🥇' : (rankNum === 2 ? '🥈' : (rankNum === 3 ? '🥉' : `#${rankNum}`));
      html += `
        <div class="honor-item">
          <div class="honor-rank-badge">${medal}</div>
          <div class="honor-item-main">
            <div class="honor-item-name">${escapeHtml(entry.name)}</div>
            <div class="honor-item-title">${escapeHtml(entry.rank)}</div>
          </div>
          <div class="honor-item-stats">
            <div>Benjol: <strong>${entry.bumps || 0}x</strong></div>
            <div class="honor-item-date">${escapeHtml(entry.date || '')}</div>
          </div>
        </div>`;
    });
    honorListContainer.innerHTML = html;
  }

  async function fetchWallOfHonor() {
    if (!honorListContainer) return;
    honorListContainer.innerHTML = '<div class="honor-loading">Memuat daftar jawara... ⏳</div>';
    try {
      const res = await fetch('/api/honor');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      try { localStorage.setItem('pociman_cached_honor', JSON.stringify(data)); } catch (e) {}
      renderWallOfHonor(data);
    } catch (err) {
      let cached = [];
      try {
        const c = localStorage.getItem('pociman_cached_honor');
        if (c) cached = JSON.parse(c);
      } catch (e) {}
      renderWallOfHonor(cached);
    }
  }

  function showHonorFeedback(msg, type) {
    if (!honorFeedback) return;
    honorFeedback.textContent = msg;
    honorFeedback.className = 'honor-feedback ' + type;
    honorFeedback.classList.remove('hidden');
  }

  function saveHonorLocally(payload) {
    try {
      let cached = [];
      const c = localStorage.getItem('pociman_cached_honor');
      if (c) cached = JSON.parse(c);
      const now = new Date();
      payload.date = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' +
        String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      cached.unshift(payload);
      localStorage.setItem('pociman_cached_honor', JSON.stringify(cached));
      renderWallOfHonor(cached);
    } catch (e) {}
  }

  async function submitWallOfHonor() {
    if (!honorPlayerName || !submitHonorBtn) return;
    const name = honorPlayerName.value.trim();
    if (!name || name.length < 2) {
      showHonorFeedback('Ketik nama minimal 2 karakter!', 'error');
      return;
    }
    submitHonorBtn.disabled = true;
    submitHonorBtn.textContent = 'MENGIRIM... ⏳';

    const payload = {
      name: name,
      bumps: totalBumps,
      distance: Math.floor(distance),
      rank: winRankEl ? winRankEl.textContent : 'Pociman Sakti ⚡'
    };

    try {
      const res = await fetch('/api/honor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success) {
        showHonorFeedback('Selamat! Namamu berhasil masuk Wall of Honor! 🏆', 'success');
        submitHonorBtn.textContent = 'TERDAFTAR ✓';
        if (data.list) renderWallOfHonor(data.list);
        setTimeout(openWallOfHonorModal, 1100);
      } else {
        throw new Error(data.error || 'Gagal menyimpan');
      }
    } catch (err) {
      saveHonorLocally(payload);
      showHonorFeedback('Tersimpan di Wall of Honor lokal! 🏆', 'success');
      submitHonorBtn.textContent = 'TERDAFTAR LOKAL ✓';
      setTimeout(openWallOfHonorModal, 1100);
    }
  }

  function openWallOfHonorModal() {
    if (!wallOfHonorModal) return;
    wallOfHonorModal.classList.remove('hidden');
    fetchWallOfHonor();
  }

  bindBtn(startBtn, () => startStage(highestStage));
  bindBtn(startFullscreenBtn, toggleFullscreen);
  bindBtn(fullscreenBtn, toggleFullscreen);
  bindBtn(startResetStageBtn, handleStartResetStage);
  bindBtn(startWallOfHonorBtn, openWallOfHonorModal);
  bindBtn(viewHonorBtn, openWallOfHonorModal);
  bindBtn(closeHonorBtn, () => wallOfHonorModal.classList.add('hidden'));
  bindBtn(refreshHonorBtn, fetchWallOfHonor);
  bindBtn(submitHonorBtn, submitWallOfHonor);
  function openGuideModal() {
    switchGuideTab('guide');
    creditsScreen.classList.remove('hidden');
  }

  function switchGuideTab(tab) {
    if (!tabGuideBtn || !tabCreditsBtn || !guideTabContent || !creditsTabContent) return;
    const isGuide = tab === 'guide';
    tabGuideBtn.classList.toggle('active', isGuide);
    tabCreditsBtn.classList.toggle('active', !isGuide);
    guideTabContent.classList.toggle('hidden', !isGuide);
    creditsTabContent.classList.toggle('hidden', isGuide);
  }

  bindBtn(creditsBtn, openGuideModal);
  bindBtn(closeCreditsBtn, () => creditsScreen.classList.add('hidden'));
  bindBtn(tabGuideBtn, () => switchGuideTab('guide'));
  bindBtn(tabCreditsBtn, () => switchGuideTab('credits'));

  bindBtn(nextStageBtn, () => startStage(Math.min(TOTAL_STAGES, stage + 1)));
  bindBtn(replayStageBtn, () => startStage(stage));
  bindBtn(restartBtn, () => startStage(stage));
  bindBtn(resetStage1Btn, () => startStage(1));
  bindBtn(winPlayAgainBtn, () => startStage(1));
  bindBtn(skipCutsceneBtn, showVictoryScreen);
  bindBtn(shareWaBtn, shareToWhatsApp);
  bindBtn(downloadCertBtn, downloadCertificatePng);
  bindBtn(replayEndingBtn, startEndingCutscene);
  bindBtn(resumeBtn, togglePause);
  bindBtn(pauseBtn, togglePause);

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

  bindBtn(soundBtn, () => {
    const isMuted = window.soundManager.toggleMute();
    soundBtn.textContent = isMuted ? '🔇' : '🔊';
  });

  function updateFullscreenUI() {
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    if (fullscreenBtn) fullscreenBtn.textContent = isFull ? '✖' : '⛶';
    if (startFullscreenBtn) startFullscreenBtn.textContent = isFull ? '✖ Layar Biasa' : '⛶ Layar Penuh';
  }

  document.addEventListener('fullscreenchange', () => {
    updateFullscreenUI();
    fitGameToScreen();
  });
  document.addEventListener('webkitfullscreenchange', () => {
    updateFullscreenUI();
    fitGameToScreen();
  });

  window.addEventListener('resize', fitGameToScreen);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitGameToScreen);
    window.visualViewport.addEventListener('scroll', fitGameToScreen);
  }
  window.addEventListener('orientationchange', () => {
    setTimeout(fitGameToScreen, 150);
  });

  const musicOptionBtns = document.querySelectorAll('.music-option-btn');
  function initMusicSelector() {
    const activeTrack = (window.soundManager && window.soundManager.selectedBgmTrack) || 'koplo';
    musicOptionBtns.forEach(btn => {
      const track = btn.dataset.track;
      btn.classList.toggle('active', track === activeTrack);
      bindBtn(btn, () => {
        musicOptionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.soundManager) {
          window.soundManager.setBgmTrack(track);
          window.soundManager.playBgm(track);
        }
      });
    });
  }

  function updateStartScreenUI() {
    if (!startBtn) return;
    if (highestStage > 1 && highestStage <= TOTAL_STAGES) {
      startBtn.textContent = `LANJUTKAN (STAGE ${highestStage}) 🏃💨`;
      if (startResetStageBtn) startResetStageBtn.style.display = 'inline-flex';
    } else {
      startBtn.textContent = 'KABUR SEKARANG! 🏃💨';
      if (startResetStageBtn) startResetStageBtn.style.display = 'none';
    }
  }

  // Init
  if (!isFsSupported) {
    if (startFullscreenBtn) startFullscreenBtn.textContent = '📱 Layar Otomatis Pas';
    if (fullscreenBtn) fullscreenBtn.style.display = 'none';
  }
  initMusicSelector();
  initVillageScenery();
  updateStartScreenUI();
  fitGameToScreen();
  updateHUD();
  requestAnimationFrame(gameLoop);

})();
