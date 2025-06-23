// main.js
// Entry point: handles DOMContentLoaded, UI, and game loop
import { startMenuMusic, levelMusic, playStartMenuMusic, setVolume, toggleMute } from './js/audio.js';
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

  // === Red Box (Level Goal) ===
  const redBox = {
    x: canvas.width - 100,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    color: 'red'
  };

  // === Game Entities ===
  const player = new Character(
    50,
    canvas.height - 64,
    32,
    32,
    'assets/characters/kid-myself/kidmyself-idle.png',
    'assets/characters/kid-myself/kidmyself-walk.png',
    21,
    10
  );
  const npc = new NPC(500, canvas.height - 64, 32, 32, 'assets/characters/myselfNPC/myself-idle.png', 21, 10, 3);

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
    introPage.style.display = 'none';
    startPage.style.display = 'flex';
    playStartMenuMusic();
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
    if (key === 'f') keys.f = false;
  });

  // === Music Toggle ===
  function setupMusicToggle() {
    if (!musicToggleButton || !musicLogo) return;
    musicToggleButton.style.display = 'block';
    let isMuted = false;
    musicToggleButton.onclick = () => {
      isMuted = !isMuted;
      toggleMute(isMuted, musicLogo);
    };
  }

  // === Main Game Loop ===
  function gameLoop() {
    if (!gameStarted) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update(keys, gravity, friction, canvas);
    npc.update(player, canvas);
    player.draw(ctx);
    if (npc.sprite.complete) npc.draw(ctx);
    if (currentLevel === 1) {
      ctx.fillStyle = redBox.color;
      ctx.fillRect(redBox.x, redBox.y, redBox.width, redBox.height);
    }
    showInteractionMessage = npc.isPlayerClose(player);
    if (showInteractionMessage && !keys.e) {
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText('Press [E] to interact', player.x, player.y - 10);
    }
    if (showInteractionMessage && keys.e) {
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText('Hello World!', npc.x, npc.y - 10);
    }
    if (currentLevel === 1) {
      const playerRight = player.x + player.width * player.scale;
      const playerBottom = player.y + player.height * player.scale;
      const redBoxRight = redBox.x + redBox.width;
      const redBoxBottom = redBox.y + redBox.height;
      const isNearRedBox = !(player.x > redBoxRight || playerRight < redBox.x || player.y > redBoxBottom || playerBottom < redBox.y);
      if (isNearRedBox) {
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText('Press [F] to proceed', redBox.x, redBox.y - 10);
      }
    }
    if (currentLevel === 1 && keys.f) {
      const playerRight = player.x + player.width * player.scale;
      const playerBottom = player.y + player.height * player.scale;
      const redBoxRight = redBox.x + redBox.width;
      const redBoxBottom = redBox.y + redBox.height;
      const isOverlapping = !(player.x > redBoxRight || playerRight < redBox.x || player.y > redBoxBottom || playerBottom < redBox.y);
      if (isOverlapping) {
        currentLevel++;
        switch (currentLevel) {
          case 2: player.x = 100; player.y = canvas.height - 64; break;
          case 3: player.x = 150; player.y = canvas.height - 64; break;
          default: player.x = 50; player.y = canvas.height - 64;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.fillText(`Welcome to Level ${currentLevel}!`, canvas.width / 2 - 100, canvas.height / 2);
        gameStarted = true;
      }
    }
    if (showTutorial && currentLevel === 1) {
      ctx.fillStyle = 'black';
      ctx.font = '18px Arial';
      ctx.fillText('Tutorial: W=Jump, A=Left, D=Right, S=Down', 10, 50);
    }
    requestAnimationFrame(gameLoop);
  }

  // === Play Button Event ===
  if (playButton) {
    playButton.addEventListener('click', () => {
      if (gameStarted) return;
      startPage.style.display = 'none';
      canvas.style.display = 'block';
      gameStarted = true;
      gameLoop();
      setupMusicToggle();
      startMenuMusic.pause();
      startMenuMusic.currentTime = 0;
      levelMusic.play();
    });
  }
});
