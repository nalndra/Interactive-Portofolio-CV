// main.js
// Entry point: handles DOMContentLoaded, UI, and game loop
import { startMenuMusic, levelMusic, playStartMenuMusic, setVolume, toggleMute, dungeonMusic } from './js/audio.js';
import { Character } from './js/player.js';
import { NPC } from './js/npc.js';

window.addEventListener('DOMContentLoaded', () => {
  // === Canvas Setup ===
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // === UI Elements ===
  const introPage = document.getElementById('introPage');
  const startPage = document.getElementById('startPage');
  const playButton = document.getElementById('playButton');
  const settingsButton = document.getElementById('settingsButton');
  const creditsButton = document.getElementById('creditsButton');
  const settingsDiv = document.getElementById('settings');
  const creditsDiv = document.getElementById('credits');
  const volumeSlider = document.getElementById('volumeSlider');
  const musicToggleButton = document.getElementById('musicToggleButton');
  const musicLogo = document.getElementById('musicLogo');

  // === Game Constants & State ===
  const gravity = 0.5;
  const friction = 0.8;
  const keys = { w: false, a: false, d: false, e: false, f: false };
  let showInteractionMessage = false;
  let showTutorial = true;
  let tutorialTimer = null;
  let gameStarted = false;
  let currentLevel = 1;
  let canUseDoor = true;

  // === Door Class ===
  class Door {
    constructor({ x, y, width = 80, height = 96, targetRoom, label = '', imageSrc = 'assets/interactive/TavernDoors.png', spawnOffset = 10 }) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.targetRoom = targetRoom; // nama/indeks room tujuan
      this.label = label;
      this.image = new Image();
      this.image.src = imageSrc;
      this.spawnOffset = spawnOffset; // offset player saat keluar dari pintu ini
    }
    draw(ctx) {
      if (this.image.complete) ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      else { ctx.fillStyle = 'gray'; ctx.fillRect(this.x, this.y, this.width, this.height); }
      if (this.label) {
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.fillText(this.label, this.x + 5, this.y - 10);
      }
    }
    isPlayerNear(player) {
      const playerRight = player.x + player.width * player.scale;
      const playerBottom = player.y + player.height * player.scale;
      const doorRight = this.x + this.width;
      const doorBottom = this.y + this.height;
      return !(player.x > doorRight || playerRight < this.x || player.y > doorBottom || playerBottom < this.y);
    }
    getSpawnPosition(playerWidth, playerScale) {
      // Player spawn tepat di tengah depan pintu
      return {
        x: this.x + (this.width - playerWidth * playerScale) / 2,
        y: this.y + this.height - playerWidth * playerScale
      };
    }
  }

  // === Room/Level Data ===
  const rooms = [
    // Outside
    {
      name: 'outside',
      width: 640,
      doors: [new Door({ x: 640 - 120, y: 480 - 96, targetRoom: 1, label: 'Tavern', spawnOffset: 10 })],
      // NPC hanya ada jika belum masuk ke tavern
      npcs: [{ x: (0 + (640 - 120)) / 2 - 16, y: 480 - 64, sprite: 'assets/characters/myselfNPC/myself-idle.png', id: 'mainnpc' }],
      playerStart: { x: 0, y: 480 - 64 },
    },
    // Tavern
    {
      name: 'tavern',
      width: 1280,
      doors: [
        new Door({ x: 400, y: 480 - 96, targetRoom: 2, label: 'Owner Info', spawnOffset: 10 }),
        new Door({ x: 525, y: 480 - 96, targetRoom: 3, label: 'Skills', spawnOffset: 10 }),
        new Door({ x: 650, y: 480 - 96, targetRoom: 4, label: 'Experience', spawnOffset: 10 }),
        new Door({ x: 775, y: 480 - 96, targetRoom: 5, label: 'Certificate', spawnOffset: 10 }),
        new Door({ x: 1200, y: 480 - 96, targetRoom: 'soon', label: '???', spawnOffset: 10 }), // mentok kanan
        new Door({ x: 0, y: 480 - 96, targetRoom: 0, label: 'Exit', spawnOffset: 10 }) // Exit tetap di kiri
      ],
      npcs: [
        { x: 320, y: 480 - 64, sprite: 'assets/characters/myselfNPC/myself-idle.png', id: 'mainnpc' },
        // === NPC SAATCHI ===
        { x: 1050, y: 480 - 64, sprite: 'assets/characters/Saatchi/Saatchi-idle.png', id: 'saatchi', defaultDirection: 'right', direction: 'right' }
      ],
      playerStart: { x: 0 + 80 + 10, y: 480 - 64 },
    },
    // Room Info/Portfolio
    {
      name: 'info',
      width: 640,
      doors: [new Door({ x: 0, y: 480 - 96, targetRoom: 1, label: 'Back', spawnOffset: 10 })],
      npcs: [],
      playerStart: { x: 0 + 80 + 10, y: 480 - 64 },
    },
    // Room 3: Skills
    {
      name: 'skills',
      width: 1280, // lebih luas
      doors: [new Door({ x: 0, y: 480 - 96, targetRoom: 1, label: 'Back', spawnOffset: 10 })],
      npcs: [],
      playerStart: { x: 0 + 80 + 10, y: 480 - 64 },
      // Daftar sprite skills (rapi, grid horizontal, jarak 100px)
      skillSprites: [
        { src: 'assets/miscellaneous/Sprite-CSS.png', label: 'CSS', x: 200 },
        { src: 'assets/miscellaneous/Sprite-Firebase.png', label: 'Firebase', x: 320 },
        { src: 'assets/miscellaneous/Sprite-GO.png', label: 'Go', x: 440 },
        { src: 'assets/miscellaneous/Sprite-HTML.png', label: 'HTML', x: 560 },
        { src: 'assets/miscellaneous/Sprite-JS.png', label: 'JS', x: 680 },
        { src: 'assets/miscellaneous/Sprite-VSCode.png', label: 'VSCode', x: 800 },
        { src: 'assets/miscellaneous/Sprite-MySQL.png', label: 'MySQL', x: 920 },
        { src: 'assets/miscellaneous/Sprite-Flutter.png', label: 'Flutter', x: 1040 }
      ]
    },
    // Room 4: Experience
    {
      name: 'experience',
      width: 640,
      doors: [new Door({ x: 0, y: 480 - 96, targetRoom: 1, label: 'Back', spawnOffset: 10 })],
      npcs: [],
      playerStart: { x: 0 + 80 + 10, y: 480 - 64 },
    },
    // Room 5: Certificate
    {
      name: 'certificate',
      width: 640,
      doors: [new Door({ x: 0, y: 480 - 96, targetRoom: 1, label: 'Back', spawnOffset: 10 })],
      npcs: [],
      playerStart: { x: 0 + 80 + 10, y: 480 - 64 },
    },
  ];

  // === Camera State ===
  let cameraX = 0;

  // === Game Entities ===
  const player = new Character(
    rooms[0].playerStart.x,
    rooms[0].playerStart.y,
    32,
    32,
    'assets/characters/kid-myself/kidmyself-idle.png',
    'assets/characters/kid-myself/kidmyself-walk.png',
    21,
    10
  );
  let npcs = [];
  let currentRoom = 0;

  function playRoomMusic(roomIdx) {
    if (roomIdx === 1) { // Tavern
      if (!dungeonMusic.paused) return;
      levelMusic.pause();
      levelMusic.currentTime = 0;
      dungeonMusic.currentTime = 0;
      dungeonMusic.play();
    } else {
      if (!levelMusic.paused) return;
      dungeonMusic.pause();
      dungeonMusic.currentTime = 0;
      levelMusic.currentTime = 0;
      levelMusic.play();
    }
  }

  function loadRoom(idx, fromDoor = null, skipMusic = false) {
    currentRoom = idx;
    const room = rooms[idx];
    // NPC logic: hanya satu NPC, posisinya di luar jika belum pernah ke tavern, setelah itu hanya di dalam tavern
    if (typeof window._npcHasEnteredTavern === 'undefined') window._npcHasEnteredTavern = false;
    if (idx === 0) {
      // NPC di luar hanya jika belum pernah ke tavern
      rooms[0].npcs = window._npcHasEnteredTavern ? [] : [{ x: (0 + (640 - 120)) / 2 - 16, y: 480 - 64, sprite: 'assets/characters/myselfNPC/myself-idle.png', id: 'mainnpc' }];
    }
    if (idx === 1) {
      // Begitu masuk ke tavern, NPC hanya muncul di dalam
      window._npcHasEnteredTavern = true;
      rooms[1].npcs = [
        { x: 320, y: 480 - 64, sprite: 'assets/characters/myselfNPC/myself-idle.png', id: 'mainnpc' },
        { x: 1050, y: 480 - 64, sprite: 'assets/characters/Saatchi/Saatchi-idle.png', id: 'saatchi', defaultDirection: 'right', direction: 'right' }
      ];
    } else {
      // NPC di dalam hanya jika sudah pernah ke tavern
      rooms[1].npcs = window._npcHasEnteredTavern ? [
        { x: 320, y: 480 - 64, sprite: 'assets/characters/myselfNPC/myself-idle.png', id: 'mainnpc' },
        { x: 1050, y: 480 - 64, sprite: 'assets/characters/Saatchi/Saatchi-idle.png', id: 'saatchi', defaultDirection: 'right', direction: 'right' }
      ] : [];
    }
    const spawn = room.doors.find(d => fromDoor && d.targetRoom === fromDoor.originRoomIdx);
    if (spawn) {
      const pos = spawn.getSpawnPosition(player.width, player.scale);
      player.x = pos.x;
      player.y = pos.y;
    } else {
      player.x = room.playerStart.x;
      player.y = room.playerStart.y;
    }
    npcs = room.npcs.map(n => new NPC(n.x, n.y, 32, 32, n.sprite, 21, 10, 2, n.id, n.defaultDirection, n.direction));
    if (!skipMusic) playRoomMusic(idx); // Only play music if not skipped
  }

  // === UI Event Handlers ===
  function toggleDiv(div) {
    div.style.display = div.style.display === 'block' ? 'none' : 'block';
  }
  if (settingsButton && settingsDiv) settingsButton.addEventListener('click', () => toggleDiv(settingsDiv));
  if (creditsButton && creditsDiv) creditsButton.addEventListener('click', () => toggleDiv(creditsDiv));

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      setVolume(parseFloat(e.target.value));
    });
  }

  // === Intro Page Event ===
  function startFromIntro() {
    console.log('Intro page clicked/touched');
    introPage.style.display = 'none';
    startPage.style.display = 'flex';
    // Only play START music here
    if (typeof startMenuMusic !== 'undefined') {
      startMenuMusic.currentTime = 0;
      startMenuMusic.play();
    }
    if (typeof levelMusic !== 'undefined') {
      levelMusic.pause();
      levelMusic.currentTime = 0;
    }
    if (typeof dungeonMusic !== 'undefined') {
      dungeonMusic.pause();
      dungeonMusic.currentTime = 0;
    }
    window.removeEventListener('keydown', startFromIntro);
    introPage.removeEventListener('click', startFromIntro);
    introPage.removeEventListener('touchstart', startFromIntro);
  }
  introPage.addEventListener('click', startFromIntro);
  introPage.addEventListener('touchstart', startFromIntro);

  // === Keyboard Events ===
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 'd') keys.d = true;
    if (key === 'e') keys.e = true;
    if (key === 'f') keys.f = true;
    if (['w', 'a', 'd', 's'].includes(key) && showTutorial && tutorialTimer === null) {
      tutorialTimer = setTimeout(() => { showTutorial = false; tutorialTimer = null; }, 5000);
    }
  });
  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = false;
    if (key === 'a') keys.a = false;
    if (key === 'd') keys.d = false;
    if (key === 'e') keys.e = false;
    if (key === 'f') {
      keys.f = false;
      canUseDoor = true;
    }
  });

  // === E-Interact Sprite Animation Setup ===
  // Make sure these are initialized before gameLoop
  const eInteractImg = new Image();
  eInteractImg.src = 'assets/miscellaneous/E-Interact.png';
  const E_INTERACT_FRAME_WIDTH = 32;
  const E_INTERACT_FRAME_HEIGHT = 32;
  const E_INTERACT_TOTAL_FRAMES = 20;
  let eInteractFrame = 0;
  let eInteractAnimCounter = 0;
  const E_INTERACT_ANIM_SPEED = 6;

  // === Music Toggle ===
  function setupMusicToggle() {
    if (!musicToggleButton || !musicLogo) return;
    musicToggleButton.style.display = 'block';
    let isMuted = false;
    musicToggleButton.onclick = () => {
      isMuted = !isMuted;
      toggleMute(isMuted, musicLogo);
      if (typeof startMenuMusic !== 'undefined') startMenuMusic.muted = isMuted;
      if (typeof levelMusic !== 'undefined') levelMusic.muted = isMuted;
      if (typeof dungeonMusic !== 'undefined') dungeonMusic.muted = isMuted;
    };
  }

  // === Main Game Loop ===
  function gameLoop() {
    try {
      if (!gameStarted) return;
      // Camera follow logic (khusus room besar)
      const room = rooms[currentRoom];
      if (room.width > canvas.width) {
        cameraX = player.x + player.width * player.scale / 2 - canvas.width / 2;
        cameraX = Math.max(0, Math.min(cameraX, room.width - canvas.width));
      } else {
        cameraX = 0;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      player.update(keys, gravity, friction, { width: room.width, height: canvas.height });
      npcs.forEach(npc => npc.update(player, { width: room.width, height: canvas.height }));
      // Draw doors
      room.doors.forEach(door => door.drawWithCamera(ctx, cameraX));
      // Draw NPCs
      npcs.forEach(npc => {
        // HANYA myselfNPC (mainnpc) yang selalu lihat ke arah player
        if (npc.id === 'mainnpc') {
          npc.direction = player.x < npc.x ? 'left' : 'right';
        } else if (npc.id === 'saatchi' || npc.id === 'angel') {
          // saatchi & angel hanya lihat ke arah player saat interaksi
          if (npc.isPlayerClose(player) && keys.e) {
            npc.direction = player.x < npc.x ? 'left' : 'right';
          } else {
            npc.direction = npc.defaultDirection || 'right';
          }
        } else {
          // NPC lain hanya lihat ke arah player saat interaksi
          if (npc.isPlayerClose(player) && keys.e) {
            npc.direction = player.x < npc.x ? 'left' : 'right';
          } else {
            npc.direction = npc.defaultDirection || 'right';
          }
        }
        npc.drawWithCamera(ctx, cameraX);
      });
      // Draw player
      player.drawWithCamera(ctx, cameraX);

      // Door interaction
      room.doors.forEach(door => {
        if (door.isPlayerNear(player)) {
          ctx.fillStyle = 'black';
          ctx.font = '16px Arial';
          ctx.fillText('Press [F] to enter', door.x - cameraX + 5, door.y - 25);
          if (keys.f && canUseDoor) {
            canUseDoor = false;
            if (door.targetRoom === 'soon') {
              // Tampilkan pesan soon
              ctx.fillStyle = 'red';
              ctx.font = '32px Arial';
              ctx.fillText('SOON', canvas.width / 2 - 50, canvas.height / 2);
            } else {
              loadRoom(door.targetRoom, { originRoomIdx: currentRoom });
            }
          }
        }
      });
      // NPC interaction (only if ada NPC di room)
      npcs.forEach(npc => {
        if (npc.isPlayerClose(player) && !keys.e) {
          // Animasi E-Interact
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          if (eInteractImg.complete && eInteractImg.naturalWidth > 0) {
            ctx.drawImage(
              eInteractImg,
              eInteractFrame * E_INTERACT_FRAME_WIDTH, 0, E_INTERACT_FRAME_WIDTH, E_INTERACT_FRAME_HEIGHT,
              player.x - cameraX + player.width / 2 - 16, player.y - 40, 32, 32
            );
          }
          ctx.restore();
        }
        if (npc.isPlayerClose(player) && keys.e) {
          ctx.fillStyle = 'black';
          ctx.font = '20px Arial';
          ctx.fillText('Hello World!', npc.x - cameraX, npc.y - 10);
        }
      });
      // Update animasi E-Interact
      eInteractAnimCounter++;
      if (eInteractAnimCounter >= E_INTERACT_ANIM_SPEED) {
        eInteractFrame = (eInteractFrame + 1) % E_INTERACT_TOTAL_FRAMES;
        eInteractAnimCounter = 0;
      }
      if (showTutorial && currentRoom === 0) {
        ctx.fillStyle = 'black';
        ctx.font = '18px Arial';
        ctx.fillText('Tutorial: W=Jump, A=Left, D=Right, S=Down', 10, 50);
      }
      // Tambahkan render skillSprites di room skills (pakai cameraX)
      if (room.name === 'skills' && room.skillSprites) {
        room.skillSprites.forEach(skill => {
          const img = skillSpriteImages[skill.src];
          if (img) {
            ctx.drawImage(img, skill.x - cameraX, 160, 80, 80);
          }
          ctx.fillStyle = 'black';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(skill.label, skill.x - cameraX + 40, 260);
        });
      }
      ctx.textAlign = 'left';
      requestAnimationFrame(gameLoop);
    } catch (err) {
      console.error('Game loop error:', err);
    }
  }

  // Tambahkan drawWithCamera untuk Door, NPC, dan Player
  Door.prototype.drawWithCamera = function (ctx, cameraX) {
    if (this.image.complete) ctx.drawImage(this.image, this.x - cameraX, this.y, this.width, this.height);
    else { ctx.fillStyle = 'gray'; ctx.fillRect(this.x - cameraX, this.y, this.width, this.height); }
    if (this.label) {
      ctx.fillStyle = 'black';
      ctx.font = '14px Arial';
      ctx.fillText(this.label, this.x - cameraX + 5, this.y - 10);
    }
  };
  NPC.prototype.drawWithCamera = function (ctx, cameraX) {
    ctx.save();
    if (this.direction === 'left') {
      ctx.translate(this.x - cameraX + this.width * this.scale, this.y);
      ctx.scale(-1, 1);
      ctx.drawImage(this.sprite, this.frame * this.width, 0, this.width, this.height, 0, 0, this.width * this.scale, this.height * this.scale);
    } else {
      ctx.drawImage(this.sprite, this.frame * this.width, 0, this.width, this.height, this.x - cameraX, this.y, this.width * this.scale, this.height * this.scale);
    }
    ctx.restore();
  };
  Character.prototype.drawWithCamera = function (ctx, cameraX) {
    if (!this.currentSprite.complete) return;
    ctx.save();
    if (this.direction === 'left') {
      ctx.translate(this.x - cameraX + this.width * this.scale, this.y);
      ctx.scale(-1, 1);
      ctx.drawImage(this.currentSprite, this.frame * this.width, 0, this.width, this.height, 0, 0, this.width * this.scale, this.height * this.scale);
    } else {
      ctx.drawImage(this.currentSprite, this.frame * this.width, 0, this.width, this.height, this.x - cameraX, this.y, this.width * this.scale, this.height * this.scale);
    }
    ctx.restore();
  };

  // === Play Button Event ===
  if (playButton) {
    playButton.addEventListener('click', () => {
      console.log('Play button clicked');
      if (gameStarted) return;
      startPage.style.display = 'none';
      canvas.style.display = 'block';
      if (musicToggleButton) musicToggleButton.style.display = 'block';
      gameStarted = true;
      gameLoop();
      setupMusicToggle();
      // Stop START music, play EXPLORE or Dungeon depending on room
      if (typeof startMenuMusic !== 'undefined') {
        startMenuMusic.pause();
        startMenuMusic.currentTime = 0;
      }
      // Play correct music for the room (EXPLORE or Dungeon)
      playRoomMusic(currentRoom);
    });
  } else {
    // Fallback: auto-start game if Play button not found (debug only)
    console.warn('Play button not found, auto-starting game for debug');
    startPage.style.display = 'none';
    canvas.style.display = 'block';
    if (musicToggleButton) musicToggleButton.style.display = 'block';
    gameStarted = true;
    gameLoop();
    setupMusicToggle();
    startMenuMusic.pause();
    startMenuMusic.currentTime = 0;
    levelMusic.play();
  }

  // Ganti logic level di tombol F dan resetPositions dengan loadRoom(idx)
  // Panggil loadRoom(0) di awal game, SKIP music
  loadRoom(0, null, true);

  // === Skill Sprites Image Cache ===
  const skillSpriteImages = {};
  if (rooms) {
    const skillsRoom = rooms.find(r => r.name === 'skills');
    if (skillsRoom && skillsRoom.skillSprites) {
      skillsRoom.skillSprites.forEach(skill => {
        const img = new Image();
        img.src = skill.src;
        skillSpriteImages[skill.src] = img;
      });
    }
  }
});
