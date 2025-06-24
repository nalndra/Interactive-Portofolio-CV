// npc.js
// Contains the NPC class

export class NPC {
  constructor(x, y, width, height, spriteSrc, maxFrames = 21, frameRate = 10, scale = 2) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.scale = scale; // now 2 for smaller canvas
    this.sprite = new Image();
    this.sprite.src = spriteSrc;
    this.direction = 'right';
    this.interactionDistance = 40; // smaller for smaller canvas
    this.maxFrames = maxFrames;
    this.frame = 0;
    this.frameCounter = 0;
    this.frameRate = frameRate;
    this.groundLevel = 480 - this.height * this.scale; // Default canvas height
  }
  update(player, canvas) {
    this.direction = player.x < this.x ? 'left' : 'right';
    this.frameCounter++;
    if (this.frameCounter >= this.frameRate) { this.frame = (this.frame + 1) % this.maxFrames; this.frameCounter = 0; }
    this.groundLevel = canvas.height - this.height * this.scale;
    this.y = this.groundLevel;
  }
  draw(ctx) {
    ctx.save();
    if (this.direction === 'left') {
      ctx.translate(this.x + this.width * this.scale, this.y);
      ctx.scale(-1, 1);
      ctx.drawImage(this.sprite, this.frame * this.width, 0, this.width, this.height, 0, 0, this.width * this.scale, this.height * this.scale);
    } else {
      ctx.drawImage(this.sprite, this.frame * this.width, 0, this.width, this.height, this.x, this.y, this.width * this.scale, this.height * this.scale);
    }
    ctx.restore();
  }
  isPlayerClose(player) {
    const dx = (this.x + this.width / 2) - (player.x + player.width / 2);
    const dy = (this.y + this.height / 2) - (player.y + player.height / 2);
    return Math.sqrt(dx * dx + dy * dy) < this.interactionDistance;
  }
}
