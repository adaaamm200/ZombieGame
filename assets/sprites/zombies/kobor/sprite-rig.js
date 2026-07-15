/**
 * Zombi Kronika - Sprite Rig Engine (v1.1)
 * --------------------------------------------
 * Ujrafelhasznalhato "cutout" (paper-doll) animacios motor side-scroller
 * karakterekhez/zombikhoz. Egy JSON config-ot es nehany kepdarabot (body,
 * frontLeg, backLeg - opcionalisan frontArm/backArm) tolt be, es a
 * vegtagokat kulon pivot-pont (vall, csipo) korul forgatja.
 *
 * Uj a v1.1-ben: a "dismember" halal-tipus, ami a felsotestet (body resz)
 * fizikailag levalasztja a csipotol - gravitacio, forgas, pattanas -,
 * mikozben a labak osszecsuklanak. Esemeny-hook (onEvent) segitsegevel
 * a blood-fx.js modul tud reagalni (ver-robbanas, seb, kepernyorazas)
 * pontosan a megfelelo pillanatban, vilag-koordinatakkal.
 *
 * Hasznalat:
 *   const rig = new SpriteRig(ctx, '/assets/sprites/zombies/kobor/', {
 *     onEvent: (name, payload) => bloodFxHandler(name, payload)
 *   });
 *   await rig.load('kobor_rig.json');
 *   rig.setState('walk');
 *   rig.update(dt);
 *   rig.draw(x, y, facing);
 */

class SpriteRig {
  constructor(ctx, basePath, options = {}) {
    this.ctx = ctx;
    this.basePath = basePath.endsWith('/') ? basePath : basePath + '/';
    this.onEvent = options.onEvent || function () {};
    this.config = null;
    this.images = {};
    this.state = 'idle';
    this.stateStart = 0;
    this.time = 0;
    this.transforms = {};
    this.stageOffset = { x: 0, y: 0, rotation: 0 };
    this.oneShotDone = false;
    this.deathPhysics = null;
    this._deathEventFired = false;
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
    if (this.state === 'death' && name !== 'idle') return;
    this.state = name;
    this.stateStart = this.time;
    this.oneShotDone = false;
    this.deathPhysics = null;
    this._deathEventFired = false;
    if (name === 'hurt') {
      this.onEvent('hurtStart', {});
    }
  }

  update(dt) {
    this.time += dt;
    const t = this.time - this.stateStart;
    const anim = this.config.animations[this.state];
    if (!anim) return;

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
    } else if (anim.type === 'lurch') {
      // Merev "zombi-vonszolas" (korabban jovahagyott A-opcio, visszaallitva a
      // v1.1 motorba). Az egesz test egyben ring/dol a csipo korul + bob + enyhe
      // oldalmozgas; a labakat NEM forgatja szet -> nincs duplazodo/szellemkep
      // lab (a leg.png a teljes alsotest, nem izolalt egy-lab).
      const speed = anim.speed || 3;
      const rock = Math.sin(t * speed) * (anim.rockDeg || 4);
      const bob = Math.abs(Math.sin(t * speed)) * -(anim.bobAmplitude || 4);
      const sway = Math.sin(t * speed) * (anim.swayX || 2);
      this.stageOffset = { x: sway, y: bob, rotation: rock };
      this._setLimb('frontLeg', 0);
      this._setLimb('backLeg', 0);
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
    } else if (anim.type === 'dismember') {
      this._updateDismember(t, dt, anim);
    }
  }

  _updateDismember(t, dt, anim) {
    if (!this.deathPhysics) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      this.deathPhysics = {
        x: 0,
        y: 0,
        rot: 0,
        vx: (anim.flingSpeedMin || 40) * dir + Math.random() * (anim.flingSpeedRange || 30) * dir,
        vy: -(anim.popUp || 90),
        vrot: ((anim.spinSpeedMin || 110) + Math.random() * (anim.spinSpeedRange || 90)) * dir,
        bounces: 0,
        settled: false,
        groundY: anim.groundY != null ? anim.groundY : 46,
      };
    }

    const dp = this.deathPhysics;
    const gravity = anim.gravity || 320;

    if (!this._deathEventFired) {
      this._deathEventFired = true;
      this._pendingDeathEvent = true;
    }

    if (!dp.settled) {
      dp.vy += gravity * dt;
      dp.x += dp.vx * dt;
      dp.y += dp.vy * dt;
      dp.rot += dp.vrot * dt;
      if (dp.y > dp.groundY) {
        if (dp.bounces < (anim.maxBounces != null ? anim.maxBounces : 2)) {
          dp.y = dp.groundY;
          dp.vy *= -(anim.bounceDamping || 0.32);
          dp.vx *= 0.55;
          dp.vrot *= 0.4;
          dp.bounces++;
          this._pendingBounceEvent = true;
        } else {
          dp.y = dp.groundY;
          dp.vy = 0;
          dp.vx = 0;
          dp.vrot = 0;
          dp.settled = true;
          this._pendingSettleEvent = true;
        }
      }
    }

    const legDur = anim.legCollapseDuration || 0.45;
    const legProgress = Math.min(1, t / legDur);
    this._setLimb('frontLeg', -(anim.frontLegCollapseDeg || 70) * legProgress);
    this._setLimb('backLeg', (anim.backLegCollapseDeg || 45) * legProgress);
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
    const anim = cfg.animations[this.state];
    const isDismember = anim && anim.type === 'dismember';

    const worldHipX = x + facing * (hip.x - anchor.x);
    const worldHipY = y + (hip.y - anchor.y);

    if (isDismember && this._pendingDeathEvent) {
      this._pendingDeathEvent = false;
      this.onEvent('deathStart', { x: worldHipX, y: worldHipY });
    }
    if (isDismember && this._pendingBounceEvent) {
      this._pendingBounceEvent = false;
      const dp = this.deathPhysics;
      this.onEvent('deathBounce', { x: worldHipX + facing * dp.x, y: worldHipY + dp.y });
    }
    if (isDismember && this._pendingSettleEvent) {
      this._pendingSettleEvent = false;
      const dp = this.deathPhysics;
      this.onEvent('deathSettle', { x: worldHipX + facing * dp.x, y: worldHipY + dp.y });
    }

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

    const lowerOrder = ['backLeg', 'frontLeg'];
    for (const name of lowerOrder) {
      this._drawPart(ctx, name, hip, shoulder);
    }

    ctx.save();
    if (isDismember && this.deathPhysics) {
      const dp = this.deathPhysics;
      ctx.translate(dp.x, dp.y);
      ctx.translate(hip.x, hip.y);
      ctx.rotate((dp.rot * Math.PI) / 180);
      ctx.translate(-hip.x, -hip.y);
    }
    const upperOrder = ['backArm', 'body', 'frontArm'];
    for (const name of upperOrder) {
      this._drawPart(ctx, name, hip, shoulder);
    }
    ctx.restore();

    ctx.restore();
  }

  _drawPart(ctx, name, hip, shoulder) {
    const part = this.config.parts[name];
    const img = this.images[name];
    if (!part || !img) return;

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
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpriteRig;
}
