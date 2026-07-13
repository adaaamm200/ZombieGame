/**
 * Zombi Kronika - Sprite Rig Engine
 * ----------------------------------
 * Ujrafelhasznalhato "cutout" (paper-doll) animacios motor side-scroller
 * karakterekhez/zombikhoz. Egy JSON config-ot es nehany kepdarabot (body,
 * frontArm, backArm, frontLeg, backLeg) tolt be, es a vegtagokat kulon
 * pivot-pont (vall, csipo) korul forgatja, hogy valodi lepo/tamado
 * mozgast adjon egyetlen AI-generalt allokepbol.
 *
 * Hasznalat:
 *   const rig = new SpriteRig(ctx, '/assets/sprites/zombies/kobor/');
 *   await rig.load('kobor_rig.json');
 *   rig.setState('walk');
 *   // a jatek loopban minden frame-ben:
 *   rig.update(dt);
 *   rig.draw(x, y, facing); // facing: 1 = jobbra, -1 = balra (tukrozes)
 */

class SpriteRig {
  constructor(ctx, basePath) {
    this.ctx = ctx;
    this.basePath = basePath.endsWith('/') ? basePath : basePath + '/';
    this.config = null;
    this.images = {};
    this.state = 'idle';
    this.stateStart = 0;
    this.time = 0;
    this.transforms = {};
    this.stageOffset = { x: 0, y: 0, rotation: 0 };
    this.oneShotDone = false;
  }

  async load(configFileName) {
    const res = await fetch(this.basePath + configFileName);
    this.config = await res.json();

    const partNames = Object.keys(this.config.parts);
    await Promise.all(
      partNames.map(async (name) => {
        const part = this.config.parts[name];
        const img = new Image();
        img.src = this.basePath + part.src;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        this.images[name] = img;
      })
    );

    for (const name of partNames) {
      this.transforms[name] = { angle: 0 };
    }

    return this.config;
  }

  setState(name) {
    if (!this.config.animations[name]) {
      console.warn('SpriteRig: ismeretlen animacio-allapot:', name);
      return;
    }
    this.state = name;
    this.stateStart = this.time;
    this.oneShotDone = false;
  }

  update(dt) {
    this.time += dt;
    const t = this.time - this.stateStart;
    const anim = this.config.animations[this.state];
    if (!anim) return;

    const hip = this.config.pivots.hip;
    const shoulder = this.config.pivots.shoulder;

    if (anim.type === 'bob') {
      const sway = Math.sin(t * anim.speed) * (anim.amplitude || 3);
      this.stageOffset = { x: 0, y: sway * 0.4, rotation: 0 };
      this._setLimb('frontArm', sway * 0.5);
      this._setLimb('backArm', -sway * 0.5);
      this._setLimb('frontLeg', 0);
      this._setLimb('backLeg', 0);
    } else if (anim.type === 'cutoutWalk') {
      const legA = Math.sin(t * anim.speed) * (anim.legAmplitudeDeg || 28);
      const armA = anim.armAmplitudeDeg || legA * 0.7;
      const bob = Math.abs(Math.sin(t * anim.speed)) * -(anim.bobAmplitude || 5);
      this.stageOffset = { x: 0, y: bob, rotation: 0 };
      this._setLimb('frontLeg', legA);
      this._setLimb('backLeg', -legA);
      this._setLimb('frontArm', -Math.sin(t * anim.speed) * armA);
      this._setLimb('backArm', Math.sin(t * anim.speed) * armA);
    } else if (anim.type === 'knockback') {
      const dur = anim.duration || 0.45;
      if (t < dur) {
        const progress = t / dur;
        const shake = Math.sin(progress * 40) * (anim.shakeAmplitude || 6) * (1 - progress);
        this.stageOffset = { x: shake, y: 0, rotation: 0 };
      } else if (!this.oneShotDone) {
        this.oneShotDone = true;
        this.setState(anim.next || 'idle');
      }
    } else if (anim.type === 'fall') {
      const dur = anim.duration || 0.8;
      if (t < dur) {
        const progress = Math.min(1, t / dur);
        const rot = progress * (anim.rotationDeg || 82);
        this.stageOffset = { x: 0, y: progress * 4, rotation: rot };
      }
    }
  }

  _setLimb(name, angleDeg) {
    if (this.transforms[name]) this.transforms[name].angle = angleDeg;
  }

  draw(x, y, facing = 1) {
    const ctx = this.ctx;
    const cfg = this.config;
    const hip = cfg.pivots.hip;
    const shoulder = cfg.pivots.shoulder;
    const anchor = cfg.anchor;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    ctx.translate(-anchor.x, -anchor.y);
    ctx.translate(this.stageOffset.x, this.stageOffset.y);
    if (this.stageOffset.rotation) {
      ctx.translate(hip.x, hip.y);
      ctx.rotate((this.stageOffset.rotation * Math.PI) / 180);
      ctx.translate(-hip.x, -hip.y);
    }

    const drawOrder = ['backLeg', 'backArm', 'body', 'frontLeg', 'frontArm'];
    for (const name of drawOrder) {
      const part = cfg.parts[name];
      const img = this.images[name];
      if (!part || !img) continue;

      const pivot = part.pivotRef === 'hip' ? hip : part.pivotRef === 'shoulder' ? shoulder : null;
      const angle = this.transforms[name] ? this.transforms[name].angle : 0;

      ctx.save();
      if (pivot && angle) {
        ctx.translate(pivot.x, pivot.y);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.translate(-pivot.x, -pivot.y);
      }
      ctx.drawImage(img, part.x, part.y, part.width, part.height);
      ctx.restore();
    }

    ctx.restore();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpriteRig;
}
