/**
 * Zombi Kronika - Integracios pelda
 * ------------------------------------
 * Ez NEM egy futtathato onallo fajl, hanem minta arra, hogyan illeszd be
 * a SpriteRig motort a mar meglevo game loop-odba (Claude Code-os
 * projektbe masolva, a sajat entitas/game-state kezelesedhez igazitva).
 */

class Entity {
  constructor(ctx, rigBasePath, rigConfigFile, worldX, worldY) {
    this.rig = new SpriteRig(ctx, rigBasePath);
    this.rigConfigFile = rigConfigFile;
    this.x = worldX;
    this.y = worldY;
    this.facing = 1; // 1 = jobbra, -1 = balra
    this.hp = 100;
    this.state = 'idle';
    this.ready = false;
  }

  async init() {
    await this.rig.load(this.rigConfigFile);
    this.rig.setState('idle');
    this.ready = true;
  }

  moveTowards(targetX, dt, speed = 60) {
    if (!this.ready || this.state === 'death') return;
    const dx = targetX - this.x;
    this.facing = dx >= 0 ? 1 : -1;
    if (Math.abs(dx) > 2) {
      this.x += Math.sign(dx) * speed * dt;
      this._setState('walk');
    } else {
      this._setState('idle');
    }
  }

  takeDamage(amount) {
    if (!this.ready || this.state === 'death') return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this._setState('death');
    } else {
      this._setState('hurt');
    }
  }

  _setState(name) {
    if (this.state === 'death') return;
    if (this.state === name) return;
    this.state = name;
    this.rig.setState(name);
  }

  update(dt) {
    if (!this.ready) return;
    this.rig.update(dt);
  }

  draw() {
    if (!this.ready) return;
    this.rig.draw(this.x, this.y, this.facing);
  }
}

/*
 * Peldahasznalat a fo game loop-ban:
 *
 * const player = new Entity(ctx, '/assets/sprites/characters/farkas/', 'farkas_rig.json', 100, 260);
 * const kobor = new Entity(ctx, '/assets/sprites/zombies/kobor/', 'kobor_rig.json', 300, 260);
 * await Promise.all([player.init(), kobor.init()]);
 *
 * function gameLoop(now) {
 *   const dt = (now - lastTime) / 1000;
 *   lastTime = now;
 *   ctx.clearRect(0, 0, canvas.width, canvas.height);
 *
 *   kobor.moveTowards(player.x, dt);          // zombi a jatekos fele mozog
 *   if (playerAttackedThisFrame) kobor.takeDamage(25);
 *
 *   player.update(dt);
 *   kobor.update(dt);
 *   player.draw();
 *   kobor.draw();
 *
 *   requestAnimationFrame(gameLoop);
 * }
 *
 * Igy ugyanaz az Entity osztaly hasznalhato mind az 5 karakterre es
 * mind a 8 zombi tipusra - csak a rig config (JSON) es a kepek maganak
 * az entitasnak felelnek meg, a mozgas/animacio-logika kozos.
 */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Entity;
}
