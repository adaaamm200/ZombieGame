/* Bemenet: virtuális joystick + gombok (érintés) és billentyűzet (asztali teszt) */
window.ZD = window.ZD || {};

ZD.input = (() => {
  const state = {
    axis: 0,          // -1..1 vízszintes
    fire: false,      // nyomva tartva
    grenade: false,   // él-trigger (game.js nullázza)
    swap: false,      // él-trigger
    pause: false,     // él-trigger
  };

  /* ---------- billentyűzet ---------- */
  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys[e.code] = true;
    if (e.code === 'KeyG') state.grenade = true;
    if (e.code === 'KeyQ' || e.code === 'KeyE') state.swap = true;
    if (e.code === 'KeyP' || e.code === 'Escape') state.pause = true;
    ZD.audio.unlock();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  function keyAxis() {
    let a = 0;
    if (keys.ArrowLeft || keys.KeyA) a -= 1;
    if (keys.ArrowRight || keys.KeyD) a += 1;
    return a;
  }
  function keyFire() {
    return !!(keys.Space || keys.KeyJ);
  }

  /* ---------- virtuális joystick ---------- */
  let joyTouch = null;
  let joyOrigin = { x: 0, y: 0 };
  let touchAxis = 0;
  const RADIUS = 36;

  function setup() {
    const zone = document.getElementById('joyzone');
    const base = document.getElementById('joybase');
    const knob = document.getElementById('joyknob');

    function moveKnob(dx) {
      const cl = Math.max(-RADIUS, Math.min(RADIUS, dx));
      knob.style.transform = `translate(calc(-50% + ${cl}px), -50%)`;
      touchAxis = Math.abs(cl) < 6 ? 0 : cl / RADIUS;
    }

    zone.addEventListener('pointerdown', (e) => {
      ZD.audio.unlock();
      joyTouch = e.pointerId;
      joyOrigin = { x: e.clientX, y: e.clientY };
      base.style.display = 'block';
      base.style.left = `${e.clientX - 46}px`;
      base.style.top = `${e.clientY - 46}px`;
      moveKnob(0);
      zone.setPointerCapture(e.pointerId);
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== joyTouch) return;
      moveKnob(e.clientX - joyOrigin.x);
    });
    function joyEnd(e) {
      if (e.pointerId !== joyTouch) return;
      joyTouch = null;
      touchAxis = 0;
      base.style.display = 'none';
    }
    zone.addEventListener('pointerup', joyEnd);
    zone.addEventListener('pointercancel', joyEnd);

    /* gombok */
    let touchFire = false;
    const bind = (id, down, up) => {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); ZD.audio.unlock(); down(); });
      if (up) {
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('pointerleave', up);
      }
    };
    bind('btn-fire', () => { touchFire = true; }, () => { touchFire = false; });
    bind('btn-gren', () => { state.grenade = true; });
    bind('btn-swap', () => { state.swap = true; });
    bind('btn-pause', () => { state.pause = true; });

    state._touchFire = () => touchFire;
  }

  function update() {
    const ka = keyAxis();
    state.axis = ka !== 0 ? ka : touchAxis;
    state.fire = keyFire() || (state._touchFire ? state._touchFire() : false);
  }

  return { state, setup, update };
})();
