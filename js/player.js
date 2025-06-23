// player.js
// Contains the Character (player) class

export class Character {
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
    this.groundLevel = 720 - this.height * this.scale; // Default canvas height
    this.maxFrames = maxFrames;
    this.frame = 0;
    this.frameCounter = 0;
    this.frameRate = frameRate;
    this.currentAnimation = 'idle';
    this.direction = 'right';
  }
  update(keys, gravity, friction, canvas) {
    if (keys.a) { this.velocityX = -this.speed; this.direction = 'left'; }
    else if (keys.d) { this.velocityX = this.speed; this.direction = 'right'; }
    else { this.velocityX *= friction; }
    if (keys.w && !this.jumping) { this.velocityY = -12; this.jumping = true; }
    this.velocityY += gravity;
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.groundLevel = canvas.height - this.height * this.scale;
    if (this.y > this.groundLevel) { this.y = this.groundLevel; this.velocityY = 0; this.jumping = false; }
    if (this.x < 0) this.x = 0;
    if (this.x + this.width * this.scale > canvas.width) this.x = canvas.width - this.width * this.scale;
    if (this.jumping) { this.setAnimation('jump', this.jumpSprite); }
    else if (Math.abs(this.velocityX) > 0.1) { this.setAnimation('walk', this.walkSprite); }
    else { this.setAnimation('idle', this.idleSprite); }
    this.frameCounter++;
    if (this.frameCounter >= this.frameRate) { this.frame = (this.frame + 1) % this.maxFrames; this.frameCounter = 0; }
  }
  setAnimation(anim, sprite) {
    this.currentAnimation = anim;
    this.currentSprite = sprite;
    this.maxFrames = 21;
    this.frameRate = 10;
  }
  draw(ctx) {
    if (!this.currentSprite.complete) return;
    ctx.save();
    if (this.direction === 'left') {
      ctx.translate(this.x + this.width * this.scale, this.y);
      ctx.scale(-1, 1);
      ctx.drawImage(this.currentSprite, this.frame * this.width, 0, this.width, this.height, 0, 0, this.width * this.scale, this.height * this.scale);
    } else {
      ctx.drawImage(this.currentSprite, this.frame * this.width, 0, this.width, this.height, this.x, this.y, this.width * this.scale, this.height * this.scale);
    }
    ctx.restore();
  }
}
