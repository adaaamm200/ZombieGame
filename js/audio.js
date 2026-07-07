/* Szintetizált hangeffektek — WebAudio, külső fájlok nélkül */
window.ZD = window.ZD || {};

ZD.audio = (() => {
  let ctx = null;
  let master = null;
  const lastPlay = {};

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function muted() {
    return !ZD.save.data.sound;
  }

  /* zajbuffer cache */
  let noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    return src;
  }

  function env(gainNode, t0, peak, dur) {
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(peak, t0 + 0.008);
    g.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }

  function burst(peak, dur, filterFreq, type = 'lowpass') {
    const t0 = ctx.currentTime;
    const src = noise();
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;
    const g = ctx.createGain();
    env(g, t0, peak, dur);
    src.connect(f).connect(g).connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  function tone(freq0, freq1, dur, type, peak) {
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(freq1, 1), t0 + dur);
    const g = ctx.createGain();
    env(g, t0, peak, dur);
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  const FX = {
    shot()      { burst(0.35, 0.09, 1800); tone(320, 90, 0.06, 'square', 0.12); },
    rifle()     { burst(0.42, 0.12, 1300); tone(210, 60, 0.09, 'square', 0.18); },
    shotgun()   { burst(0.5, 0.2, 900); tone(140, 50, 0.14, 'square', 0.2); },
    uzi()       { burst(0.22, 0.06, 2200); },
    minigun()   { burst(0.25, 0.055, 2600); },
    flame()     { burst(0.10, 0.12, 700); },
    rocket()    { burst(0.3, 0.25, 500, 'bandpass'); },
    laser()     { tone(1400, 220, 0.13, 'sawtooth', 0.22); },
    boom()      { burst(0.55, 0.5, 220); tone(90, 34, 0.4, 'sine', 0.5); },
    hit()       { burst(0.2, 0.06, 500); },
    zdie()      { tone(150, 55, 0.4, 'sawtooth', 0.22); burst(0.15, 0.25, 300); },
    hurt()      { tone(220, 80, 0.18, 'square', 0.3); },
    coin()      { tone(950, 950, 0.05, 'sine', 0.2); setTimeout(() => ctx && tone(1420, 1420, 0.07, 'sine', 0.2), 55); },
    med()       { tone(520, 780, 0.16, 'sine', 0.25); },
    click()     { tone(600, 400, 0.05, 'square', 0.15); },
    buy()       { tone(500, 900, 0.12, 'sine', 0.25); },
    win()       { [440, 550, 660, 880].forEach((f, i) => setTimeout(() => ctx && tone(f, f, 0.12, 'square', 0.18), i * 110)); },
    lose()      { [330, 262, 208, 165].forEach((f, i) => setTimeout(() => ctx && tone(f, f, 0.16, 'sawtooth', 0.18), i * 150)); },
    spit()      { tone(700, 200, 0.14, 'sine', 0.14); },
    slam()      { burst(0.5, 0.35, 160); },
    roar()      { tone(130, 36, 0.8, 'sawtooth', 0.3); burst(0.35, 0.7, 240); tone(90, 40, 0.6, 'square', 0.14); },
    reload()    { tone(760, 760, 0.03, 'square', 0.14); setTimeout(() => ctx && tone(520, 520, 0.04, 'square', 0.16), 110); },
    upgrade()   { [420, 620, 940].forEach((f, i) => setTimeout(() => ctx && tone(f, f, 0.09, 'square', 0.16), i * 70)); },
  };

  const throttleMs = { uzi: 45, minigun: 40, flame: 70, hit: 50, shot: 60, rifle: 60, coin: 60 };

  function play(name) {
    if (muted()) return;
    if (!ensure()) return;
    const now = performance.now();
    const th = throttleMs[name] || 0;
    if (th && lastPlay[name] && now - lastPlay[name] < th) return;
    lastPlay[name] = now;
    try { FX[name] && FX[name](); } catch (e) { /* audio hiba nem állíthatja meg a játékot */ }
  }

  /* iOS: első érintésre fel kell ébreszteni */
  function unlock() { ensure(); }

  return { play, unlock };
})();
