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

export { Character, NPC };
