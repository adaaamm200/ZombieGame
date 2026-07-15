/**
 * Zombi Kronika - Blood FX modul
 * ----------------------------------
 * Veresztetes VFX-eket kezel: veresricske-robbanas, allando ver-tocsa
 * decal-ok, sebzes-jelolesek, becsapodas-szikra, kepernyorazas es
 * talalat-villanas. Univerzalis - egyszer betoltod, minden entitas
 * (jatekos + osszes zombi tipus) ugyanazt hasznalhatja.
 *
 * Hasznalat:
 *   const fx = new BloodFX(ctx, '/assets/fx/');
 *   await fx.load();
 *   // hit esemenynel:
 *   fx.spawnBurst(worldX, worldY);
 *   fx.spawnImpactSpark(worldX, worldY);
 *   fx.shake(6);
 *   fx.flash();
 *   // halalnal (a csipo-vagas pontjan):
 *   fx.spawnBurst(hipX, hipY, 26, 140);
 *   fx.addWound(hipX, hipY, angleDeg);
 *   fx.shake(9, 0.4);
 *
 *   // minden frame-ben:
 *   fx.update(dt);
 *   // a rig(ek) kirajzolasa UTAN:
 *   fx.draw();
 *   // kepernyorazashoz a canvas draw elejen:
 *   const s = fx.getShakeOffset();
 *   ctx.save(); ctx.translate(s.x, s.y); ... rajzolj mindent ...; ctx.restore();
 */

class BloodFX {
  constructor(ctx, basePath) {
    this.ctx = ctx;
    this.basePath = basePath.endsWith('/') ? basePath : basePath + '/';
    this.splatters = [];
    this.wound = null;
    this.spark = null;
    this.particles = [];
    this.decals = [];
    this.sparks = [];
    this.shakeMag = 0;
    this.shakeTime = 0;
    this.flashAlpha = 0;
  }

  async _loadImage(src) {
    const img = new Image();
    img.src = src;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    return img;
  }

  async load() {
    try {
      const manifestRes = await fetch(this.basePath + 'splat_manifest.json');
      const manifest = await manifestRes.json();
      this.splatters = await Promise.all(
        manifest.files.map((f) => this._loadImage(this.basePath + f))
      );
    } catch (err) {
      console.warn('BloodFX: nem talalhato splat_manifest.json - futtasd a slice_vfx_sheet.py-t. Reszecskek nem fognak megjelenni.', err);
    }

    try {
      this.wound = await this._loadImage(this.basePath + 'wound_stump.png');
    } catch (err) {
      console.warn('BloodFX: wound_stump.png nem talalhato.', err);
    }

    try {
      this.spark = await this._loadImage(this.basePath + 'impact_spark.png');
    } catch (err) {
      console.warn('BloodFX: impact_spark.png nem talalhato.', err);
    }
  }

  _randomSplatter() {
    if (this.splatters.length === 0) return null;
    return this.splatters[Math.floor(Math.random() * this.splatters.length)];
  }

  spawnBurst(x, y, count = 14, spread = 100) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * spread;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.5 + Math.random() * 0.4,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 360,
        scale: 0.12 + Math.random() * 0.2,
        img: this._randomSplatter(),
      });
    }
  }

  spawnImpactSpark(x, y) {
    this.sparks.push({
      x, y,
      life: 0.25,
      maxLife: 0.25,
      rot: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.2,
    });
  }

  addDecal(x, y) {
    this.decals.push({
      x, y,
      rot: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      flip: Math.random() < 0.5,
      alpha: 0.9,
      img: this._randomSplatter(),
      isWound: false,
    });
    if (this.decals.length > 12) this.decals.shift();
  }

  addWound(x, y, angleDeg = 0) {
    this.decals.push({
      x, y,
      rot: angleDeg,
      scale: 0.6,
      flip: false,
      alpha: 1,
      img: this.wound,
      isWound: true,
    });
  }

  shake(magnitude, duration = 0.3) {
    this.shakeMag = magnitude;
    this.shakeTime = duration;
  }

  flash(amount = 1) {
    this.flashAlpha = amount;
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      this.sparks[i].life -= dt;
      if (this.sparks[i].life <= 0) this.sparks.splice(i, 1);
    }
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) this.shakeMag = 0;
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha -= dt * 5;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }
  }

  getShakeOffset() {
    if (!this.shakeMag) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * 2 * this.shakeMag,
      y: (Math.random() - 0.5) * 2 * this.shakeMag,
    };
  }

  _drawSprite(img, x, y, rot, scale, flip, alpha) {
    if (!img) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    if (flip) ctx.scale(-1, 1);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;

    for (const d of this.decals) {
      this._drawSprite(d.img, d.x, d.y, d.rot, d.scale, d.flip, d.alpha);
    }

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      this._drawSprite(p.img, p.x, p.y, p.rot, p.scale, false, alpha);
    }

    for (const s of this.sparks) {
      const alpha = Math.max(0, s.life / s.maxLife);
      this._drawSprite(this.spark, s.x, s.y, s.rot, s.scale, false, alpha);
    }

    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha * 0.3;
      ctx.fillStyle = '#c81414';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BloodFX;
}
