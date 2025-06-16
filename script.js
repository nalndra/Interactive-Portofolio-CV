window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Gravity and friction constants
  const gravity = 0.5;
  const friction = 0.8;

  // Keys pressed state
  const keys = {
    w: false, a: false, d: false, e: false
  };

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

      this.currentSprite = this.idleSprite;

      this.speed = 5;
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
      if (Math.abs(this.velocityX) > 0.1) {
        this.currentAnimation = 'walk';
        this.currentSprite = this.walkSprite;
      } else {
        this.currentAnimation = 'idle';
        this.currentSprite = this.idleSprite;
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
    10,
    2
  );
  const npc = new NPC(500, canvas.height - 64, 32, 32, 'assets/characters/myselfNPC/myself-idle.png', 21, 10, 3);

  // Interaction message display
  let showInteractionMessage = false;

  // Tutorial message display
  let showTutorial = true;
  let tutorialTimer = null;

  // Main game loop
  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update entities
    player.update();
    npc.update(player);

    // Draw entities
    player.draw();
    if (npc.sprite.complete) {
      npc.draw();
    }

    // Interaction check
    if (npc.isPlayerClose(player)) {
      showInteractionMessage = true;
    } else {
      showInteractionMessage = false;
    }

    // Show interaction prompt
    if (showInteractionMessage && !keys.e) {
      ctx.fillStyle = 'black';
      ctx.font = '16px Arial';
      ctx.fillText('Press [E] to interact', player.x, player.y - 10);
    }

    if (showInteractionMessage && keys.e) {
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      // Draw text above NPC
      ctx.fillText('memek', npc.x, npc.y - 10);
    }

    // Show tutorial message
    if (showTutorial) {
      ctx.fillStyle = 'black';
      ctx.font = '18px Arial';
      ctx.fillText('Tutorial: W=Jump, A=Left, D=Right, S=Down', 10, 50);
    }

    requestAnimationFrame(gameLoop);
  }

  // Key event listeners
  window.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 'a') keys.a = true;
    if (e.key === 'd') keys.d = true;
    if (e.key === 'e') keys.e = true;

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
  });

  // Start game loop
  gameLoop();
});
