/**
 * Zombi Kronika - Integracios pelda (v1.1, blood-fx-szel)
 * ------------------------------------------------------------
 * Ez NEM egy futtathato onallo fajl, hanem minta arra, hogyan illeszd be
 * a SpriteRig + BloodFX motort a mar meglevo game loop-odba.
 */

class Entity {
  constructor(ctx, rigBasePath, rigConfigFile, bloodFx, worldX, worldY) {
    this.bloodFx = bloodFx;
    this.rig = new SpriteRig(ctx, rigBasePath, {
      onEvent: (name, payload) => this._handleRigEvent(name, payload),
    });
    this.rigConfigFile = rigConfigFile;
    this.x = worldX;
    this.y = worldY;
    this.facing = 1;
    this.hp = 100;
    this.state = 'idle';
    this.ready = false;
  }

  async init() {
    await this.rig.load(this.rigConfigFile);
    this.rig.setState('idle');
    this.ready = true;
  }

  _handleRigEvent(name, payload) {
    if (!this.bloodFx) return;
    if (name === 'hurtStart') {
      this.bloodFx.spawnBurst(this.x, this.y - 60, 10, 80);
      this.bloodFx.spawnImpactSpark(this.x, this.y - 60);
      this.bloodFx.shake(5, 0.25);
      this.bloodFx.flash(0.6);
    } else if (name === 'deathStart') {
      this.bloodFx.spawnBurst(payload.x, payload.y, 26, 140);
      this.bloodFx.addWound(payload.x, payload.y, this.facing > 0 ? 0 : 180);
      this.bloodFx.shake(9, 0.4);
      this.bloodFx.flash(1);
    } else if (name === 'deathBounce') {
      this.bloodFx.spawnBurst(payload.x, payload.y, 6, 50);
    } else if (name === 'deathSettle') {
      this.bloodFx.addDecal(payload.x, payload.y);
    }
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
 * const bloodFx = new BloodFX(ctx, '/assets/fx/');
 * await bloodFx.load();
 *
 * const player = new Entity(ctx, '/assets/sprites/characters/farkas/', 'farkas_rig.json', bloodFx, 100, 260);
 * const kobor = new Entity(ctx, '/assets/sprites/zombies/kobor/', 'kobor_rig.json', bloodFx, 300, 260);
 * await Promise.all([player.init(), kobor.init()]);
 *
 * function gameLoop(now) {
 *   const dt = (now - lastTime) / 1000;
 *   lastTime = now;
 *
 *   kobor.moveTowards(player.x, dt);
 *   if (playerAttackedThisFrame) kobor.takeDamage(25);
 *
 *   player.update(dt);
 *   kobor.update(dt);
 *   bloodFx.update(dt);
 *
 *   const shakeOffset = bloodFx.getShakeOffset();
 *   ctx.clearRect(0, 0, canvas.width, canvas.height);
 *   ctx.save();
 *   ctx.translate(shakeOffset.x, shakeOffset.y);
 *
 *   player.draw();
 *   kobor.draw();
 *   bloodFx.draw();   // a ver/sebek/szikrak MINDIG a karakterek UTAN rajzolodnak
 *
 *   ctx.restore();
 *
 *   requestAnimationFrame(gameLoop);
 * }
 *
 * Ugyanez az Entity + BloodFX par hasznalhato mind az 5 karakterre es
 * mind a 8 zombi tipusra - egyetlen kozos ver/seb/kepernyorazas
 * rendszer, csak a rig config (JSON) es a kepek maganak az entitasnak
 * felelnek meg.
 */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Entity;
}
