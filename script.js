window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Audio objects for background music
  const startMenuMusic = new Audio('assets/musics/START  8-Bit Chiptune .mp3');
  startMenuMusic.loop = true;
  startMenuMusic.volume = 0.5;
  const levelMusic = new Audio('assets/musics/EXPLORE  8-Bit Chiptune .mp3');
  levelMusic.loop = true;
  levelMusic.volume = 0.5;

  // Play start menu music initially after user interaction (fallback)
  function playStartMenuMusic() {
    startMenuMusic.play().catch((error) => {
      console.log('Start menu music play prevented:', error);
    });
  }

  const introPage = document.getElementById('introPage');
  const startPage = document.getElementById('startPage');

  // Listen for any key press on intro page to start game
  function startFromIntro() {
    introPage.style.display = 'none';
    startPage.style.display = 'flex';
    playStartMenuMusic();
    window.removeEventListener('keydown', startFromIntro);
    introPage.removeEventListener('click', startFromIntro);
    introPage.removeEventListener('touchstart', startFromIntro);
  }

  // Removed keydown event listener to respond only to tap buttons on screen
  // window.addEventListener('keydown', startFromIntro);
  introPage.addEventListener('click', startFromIntro);
  introPage.addEventListener('touchstart', startFromIntro);

  // Gravity and friction constants
  const gravity = 0.5;
  const friction = 0.8;

  // Keys pressed state
  const keys = {
    w: false, a: false, d: false, e: false, f: false
  };

  // UI elements
  const playButton = document.getElementById('playButton');
  const settingsButton = document.getElementById('settingsButton');
  const creditsButton = document.getElementById('creditsButton');
  const settingsDiv = document.getElementById('settings');
  const creditsDiv = document.getElementById('credits');
  const backFromSettings = document.getElementById('backFromSettings');
  const backFromCredits = document.getElementById('backFromCredits');

  const volumeSlider = document.getElementById('volumeSlider');
  volumeSlider.addEventListener('input', (e) => {
    const volume = parseFloat(e.target.value);
    startMenuMusic.volume = volume;
    levelMusic.volume = volume;
  });

  // Character class representing player
  class Character {
    constructor(x, y, width, height, idleSrc, walkSrc, maxFrames = 21, frameRate = 10) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.scale = 3;

      this.idleSprite = new Image();
      this.idleSprite.src = idleSrc;

      this.walkSprite = new Image();
      this.walkSprite.src = walkSrc;

      this.jumpSprite = new Image();
      this.jumpSprite.src = 'assets/characters/kid-myself/kidmyself-jump.png';

      this.currentSprite = this.idleSprite;

      this.speed = 3;
      this.velocityX = 0;
      this.velocityY = 0;
      this.jumping = false;

      this.groundLevel = canvas.height - this.height * this.scale;

      this.maxFrames = maxFrames;
      this.frame = 0;
      this.frameCounter = 0;
      this.frameRate = frameRate;

      this.currentAnimation = 'idle'; // 'idle' or 'walk'
      this.direction = 'right'; // 'left' or 'right'
    }

    update() {
      // Horizontal movement
      if (keys.a) {
        this.velocityX = -this.speed;
        this.direction = 'left';
      } else if (keys.d) {
        this.velocityX = this.speed;
        this.direction = 'right';
      } else {
        this.velocityX *= friction;
      }

      // Jumping
      if (keys.w && !this.jumping) {
        this.velocityY = -12;
        this.jumping = true;
      }

      // Apply gravity
      this.velocityY += gravity;

      // Update position
      this.x += this.velocityX;
      this.y += this.velocityY;

      // Ground collision
      if (this.y > this.groundLevel) {
        this.y = this.groundLevel;
        this.velocityY = 0;
        this.jumping = false;
      }

      // Boundaries
      if (this.x < 0) this.x = 0;
      if (this.x + this.width * this.scale > canvas.width) this.x = canvas.width - this.width * this.scale;

      // Switch animation based on movement
      if (this.jumping) {
        this.currentAnimation = 'jump';
        this.currentSprite = this.jumpSprite;
        this.maxFrames = 21; // Assuming jump animation has 21 frames, adjust if different
        this.frameRate = 10; // Adjust frame rate if needed
      } else if (Math.abs(this.velocityX) > 0.1) {
        this.currentAnimation = 'walk';
        this.currentSprite = this.walkSprite;
        this.maxFrames = 21;
        this.frameRate = 10;
      } else {
        this.currentAnimation = 'idle';
        this.currentSprite = this.idleSprite;
        this.maxFrames = 21;
        this.frameRate = 10;
      }

      // Animate frames
      this.frameCounter++;
      if (this.frameCounter >= this.frameRate) {
        this.frame = (this.frame + 1) % this.maxFrames;
        this.frameCounter = 0;
      }
    }

    draw() {
      if (!this.currentSprite.complete) return;

      ctx.save();
      if (this.direction === 'left') {
        ctx.translate(this.x + this.width * this.scale, this.y);
        ctx.scale(-1, 1);
        ctx.drawImage(
          this.currentSprite,
          this.frame * this.width,
          0,
          this.width,
          this.height,
          0,
          0,
          this.width * this.scale,
          this.height * this.scale
        );
      } else {
        ctx.drawImage(
          this.currentSprite,
          this.frame * this.width,
          0,
          this.width,
          this.height,
          this.x,
          this.y,
          this.width * this.scale,
          this.height * this.scale
        );
      }
      ctx.restore();
    }
  }

  // NPC class
  class NPC {
    constructor(x, y, width, height, spriteSrc, maxFrames = 21, frameRate = 10, scale = 3) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.scale = scale;

      this.sprite = new Image();
      this.sprite.src = spriteSrc;

      this.direction = 'right';
      this.interactionDistance = 50;

      this.maxFrames = maxFrames;
      this.frame = 0;
      this.frameCounter = 0;
      this.frameRate = frameRate;

      this.groundLevel = canvas.height - this.height * this.scale;
    }

    update(player) {
      // Face player direction
      this.direction = player.x < this.x ? 'left' : 'right';

      // Animate frames
      this.frameCounter++;
      if (this.frameCounter >= this.frameRate) {
        this.frame = (this.frame + 1) % this.maxFrames;
        this.frameCounter = 0;
      }

      // Keep NPC on ground level
      this.y = this.groundLevel;
    }

    draw() {
      ctx.save();
      if (this.direction === 'left') {
        ctx.translate(this.x + this.width * this.scale, this.y);
        ctx.scale(-1, 1);
        ctx.drawImage(
          this.sprite,
          this.frame * this.width,
          0,
          this.width,
          this.height,
          0,
          0,
          this.width * this.scale,
          this.height * this.scale
        );
      } else {
        ctx.drawImage(
          this.sprite,
          this.frame * this.width,
          0,
          this.width,
          this.height,
          this.x,
          this.y,
          this.width * this.scale,
          this.height * this.scale
        );
      }
      ctx.restore();
    }

    isPlayerClose(player) {
      const dx = (this.x + this.width / 2) - (player.x + player.width / 2);
      const dy = (this.y + this.height / 2) - (player.y + player.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < this.interactionDistance;
    }
  }

  // Create player and NPC
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

  // Interaction message display
  let showInteractionMessage = false;

  // Tutorial message display
  let showTutorial = true;
  let tutorialTimer = null;

  // Game state
  let gameStarted = false;

  // Define red box at the end of tutorial level
  const redBox = {
    x: canvas.width - 100,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    color: 'red'
  };

  // Level state
  let currentLevel = 1;

  // Main game loop
  function gameLoop() {
    if (!gameStarted) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update entities
    player.update();
    npc.update(player);

    // Draw entities
    player.draw();
    if (npc.sprite.complete) {
      npc.draw();
    }

    // Draw red box if on tutorial level
    if (currentLevel === 1) {
      ctx.fillStyle = redBox.color;
      ctx.fillRect(redBox.x, redBox.y, redBox.width, redBox.height);
    }

    // Interaction check
    if (npc.isPlayerClose(player)) {
      showInteractionMessage = true;
    } else {
      showInteractionMessage = false;
    }

    // Show interaction prompt
    if (showInteractionMessage && !keys.e) {
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText('Press [E] to interact', player.x, player.y - 10);
    }

    if (showInteractionMessage && keys.e) {
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      // Draw text above NPC
      ctx.fillText('Hello World!', npc.x, npc.y - 10);
    }

    // Show "Press [F] to proceed" near red box when player is close
    if (currentLevel === 1) {
      const playerRight = player.x + player.width * player.scale;
      const playerBottom = player.y + player.height * player.scale;
      const redBoxRight = redBox.x + redBox.width;
      const redBoxBottom = redBox.y + redBox.height;

      const isNearRedBox = !(player.x > redBoxRight ||
        playerRight < redBox.x ||
        player.y > redBoxBottom ||
        playerBottom < redBox.y);

      if (isNearRedBox) {
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText('Press [F] to proceed', redBox.x, redBox.y - 10);
      }
    }

    // Check if player is overlapping red box and presses 'f' to go to next level
    if (currentLevel === 1 && keys.f) {
      const playerRight = player.x + player.width * player.scale;
      const playerBottom = player.y + player.height * player.scale;
      const redBoxRight = redBox.x + redBox.width;
      const redBoxBottom = redBox.y + redBox.height;

      const isOverlapping = !(player.x > redBoxRight ||
        playerRight < redBox.x ||
        player.y > redBoxBottom ||
        playerBottom < redBox.y);

      if (isOverlapping) {
        currentLevel++;
        // Reposition player for new level spawn
        switch (currentLevel) {
          case 2:
            player.x = 100;
            player.y = canvas.height - 64;
            break;
          case 3:
            player.x = 150;
            player.y = canvas.height - 64;
            break;
          // Add more cases for additional levels as needed
          default:
            player.x = 50;
            player.y = canvas.height - 64;
        }
        // Clear canvas and show new level message
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.fillText(`Welcome to Level ${currentLevel}!`, canvas.width / 2 - 100, canvas.height / 2);
        // Continue game loop
        gameStarted = true;
      }
    }

    // Show tutorial message
    if (showTutorial && currentLevel === 1) {
      ctx.fillStyle = 'black';
      ctx.font = '18px Arial';
      ctx.fillText('Tutorial: W=Jump, A=Left, D=Right, S=Down', 10, 50);
    }

    requestAnimationFrame(gameLoop);
  }

  settingsButton.addEventListener('click', () => {
    if (settingsDiv.style.display === 'block') {
      settingsDiv.style.display = 'none';
    } else {
      settingsDiv.style.display = 'block';
    }
  });

  creditsButton.addEventListener('click', () => {
    if (creditsDiv.style.display === 'block') {
      creditsDiv.style.display = 'none';
    } else {
      creditsDiv.style.display = 'block';
    }
  });

  // Key event listeners
  window.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 'a') keys.a = true;
    if (e.key === 'd') keys.d = true;
    if (e.key === 'e') keys.e = true;
    if (e.key === 'f') keys.f = true;

    // Start tutorial timer on movement input
    if (['w', 'a', 'd', 's'].includes(e.key) && showTutorial && tutorialTimer === null) {
      tutorialTimer = setTimeout(() => {
        showTutorial = false;
        tutorialTimer = null;
      }, 5000);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 'a') keys.a = false;
    if (e.key === 'd') keys.d = false;
    if (e.key === 'e') keys.e = false;
    if (e.key === 'f') keys.f = false;
  });

  // Play button event to switch music and show mute button
  playButton.addEventListener('click', () => {
    if (gameStarted) return; // Prevent multiple game loops
    startPage.style.display = 'none';
    canvas.style.display = 'block';
    gameStarted = true;
    gameLoop();

    // Show music toggle button when game starts
    const musicToggleButton = document.getElementById('musicToggleButton');
    const musicLogo = document.getElementById('musicLogo');
    musicToggleButton.style.display = 'block';

    // Initialize music as unmuted
    let isMuted = false;

    // Play level music
    startMenuMusic.pause();
    startMenuMusic.currentTime = 0;
    levelMusic.play();

    // Toggle mute/unmute on button click
    musicToggleButton.onclick = () => {
      isMuted = !isMuted;
      startMenuMusic.muted = isMuted;
      levelMusic.muted = isMuted;
      if (isMuted) {
        musicLogo.src = 'assets/miscellaneous/musiclogo-false.png';
        musicLogo.alt = 'Music Off';
      } else {
        musicLogo.src = 'assets/miscellaneous/musiclogo-true.png';
        musicLogo.alt = 'Music On';

      }
    };
  });
});
