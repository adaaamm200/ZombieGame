/* ZombieChronicles — prémium inline SVG ikonkészlet (emoji helyett).
   ZD.icon(name, extraClass) → SVG string. currentColor öröklődik.
   Cél: vastag, jól olvasható, sötét háttéren is látszó, játékba illő ikonok
   (nem vékony fehér utility-ikonok). A CSS glow/shadow/badge réteget ad hozzá. */
window.ZD = window.ZD || {};

ZD.icon = (() => {
  /* vastagabb kontúr = markánsabb, játékos hatás */
  const V = 'viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"';
  const Vf = 'viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" stroke="none"';
  /* kettős rétegű ikonokhoz: telt alap + finom kontúr */

  const P = {
    /* ---- nav / general ---- */
    back: `<svg ${V}><path d="M13.5 5l-7 7 7 7"/><path d="M7 12h11" opacity=".55"/></svg>`,
    play: `<svg ${Vf}><path d="M7 4.5v15a1 1 0 001.5.87l12-7.5a1 1 0 000-1.74l-12-7.5A1 1 0 007 4.5z"/></svg>`,
    chevron: `<svg ${V}><path d="M9 5.5l6.5 6.5L9 18.5"/></svg>`,
    gear: `<svg ${Vf}><path d="M12 8.2A3.8 3.8 0 1012 15.8 3.8 3.8 0 0012 8.2zm0 2.2a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2z"/><path d="M10.6 1.8h2.8l.5 2.6c.5.17.98.4 1.42.68l2.4-1.1 2 2-1.1 2.4c.28.44.5.92.68 1.42l2.6.5v2.8l-2.6.5c-.17.5-.4.98-.68 1.42l1.1 2.4-2 2-2.4-1.1c-.44.28-.92.5-1.42.68l-.5 2.6h-2.8l-.5-2.6c-.5-.17-.98-.4-1.42-.68l-2.4 1.1-2-2 1.1-2.4c-.28-.44-.5-.92-.68-1.42l-2.6-.5v-2.8l2.6-.5c.17-.5.4-.98.68-1.42l-1.1-2.4 2-2 2.4 1.1c.44-.28.92-.5 1.42-.68z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
    settings: `<svg ${Vf}><path d="M12 8.2A3.8 3.8 0 1012 15.8 3.8 3.8 0 0012 8.2zm0 2.2a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2z"/><path d="M10.6 1.8h2.8l.5 2.6c.5.17.98.4 1.42.68l2.4-1.1 2 2-1.1 2.4c.28.44.5.92.68 1.42l2.6.5v2.8l-2.6.5c-.17.5-.4.98-.68 1.42l1.1 2.4-2 2-2.4-1.1c-.44.28-.92.5-1.42.68l-.5 2.6h-2.8l-.5-2.6c-.5-.17-.98-.4-1.42-.68l-2.4 1.1-2-2 1.1-2.4c-.28-.44-.5-.92-.68-1.42l-2.6-.5v-2.8l2.6-.5c.17-.5.4-.98.68-1.42l-1.1-2.4 2-2 2.4 1.1c.44-.28.92-.5 1.42-.68z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
    plus: `<svg ${V}><path d="M12 5v14M5 12h14"/></svg>`,
    close: `<svg ${V}><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>`,
    globe: `<svg ${V}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.7 2.5 2.7 15.5 0 18M12 3c-2.7 2.5-2.7 15.5 0 18"/></svg>`,

    /* ---- currency / meta ---- */
    coin: `<svg ${Vf}><circle cx="12" cy="12" r="9.4" fill="currentColor"/><circle cx="12" cy="12" r="9.4" fill="none" stroke="rgba(120,80,0,.55)" stroke-width="1.4"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/><path d="M13.6 9.1a3.3 3.3 0 100 5.8" fill="none" stroke="rgba(70,46,0,.85)" stroke-width="2" stroke-linecap="round"/><path d="M9 12h3.6" stroke="rgba(70,46,0,.85)" stroke-width="1.9" stroke-linecap="round"/></svg>`,
    save: `<svg ${V}><path d="M5 4.2h10.2L19 8v11.8H5z"/><path d="M8.2 4.2v4.4h6V4.4M8.2 19.8v-5.4h7.6v5.4"/></svg>`,
    file: `<svg ${V}><path d="M6.5 3h6.5l4.5 4.5V21H6.5z"/><path d="M13 3v4.8h4.5"/></svg>`,

    /* ---- mission markerek / állapotok ---- */
    check: `<svg ${V} stroke-width="2.8"><path d="M4.5 12.5l4.8 4.8L19.5 6.5"/></svg>`,
    lock: `<svg ${Vf}><rect x="4.8" y="10.2" width="14.4" height="10.4" rx="2.2"/><path d="M7.6 10.2V7.8a4.4 4.4 0 018.8 0v2.4" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><circle cx="12" cy="15" r="1.7" fill="rgba(0,0,0,.55)"/></svg>`,
    skull: `<svg ${Vf}><path d="M12 2.4C6.7 2.4 3 6 3 10.7c0 2.7 1.3 4.6 2.9 5.8v2.5c0 1 .8 1.8 1.8 1.8h.9v-2.3h1.6v2.3h3.6v-2.3h1.6v2.3h.9c1 0 1.8-.8 1.8-1.8v-2.5c1.6-1.2 2.9-3.1 2.9-5.8C21 6 17.3 2.4 12 2.4z"/><circle cx="8.4" cy="11" r="2.1" fill="#0a0a0a"/><circle cx="15.6" cy="11" r="2.1" fill="#0a0a0a"/><path d="M12 13.6l-1.3 2.4h2.6z" fill="#0a0a0a"/></svg>`,
    crate: `<svg ${V}><path d="M3.5 8L12 4l8.5 4v8L12 20l-8.5-4z"/><path d="M3.5 8l8.5 4 8.5-4M12 12v8" stroke-width="2"/><path d="M8 6v6.8M16 6v6.8" opacity=".6" stroke-width="1.7"/></svg>`,
    warning: `<svg ${Vf}><path d="M12 3.2a1.5 1.5 0 011.3.76l8.5 14.7A1.5 1.5 0 0120.5 21H3.5a1.5 1.5 0 01-1.3-2.3l8.5-14.7A1.5 1.5 0 0112 3.2z"/><path d="M12 9v5" stroke="#1a0f00" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.35" fill="#1a0f00"/></svg>`,

    /* ---- nav item glyphs ---- */
    campaign: `<svg ${V}><path d="M5 4v16M5 5l8 3-8 3" fill="currentColor" fill-opacity=".22"/><path d="M5 5l8 3-3 2.2 5 1.8-9 3" fill="currentColor" fill-opacity=".85" stroke-width="1.4"/></svg>`,
    scavenge: `<svg ${V}><path d="M3.5 8L12 4l8.5 4v8L12 20l-8.5-4z"/><path d="M3.5 8l8.5 4 8.5-4M12 12v8" stroke-width="2"/></svg>`,
    /* pisztoly-sziluett: külön tömör elemekből (cső+szán, markolat, elsütőbillentyű-kengyel)
       — 30px-en is egyértelmű, az előző „egybefolyó" fegyverforma helyett */
    armory: `<svg ${Vf}><rect x="2.6" y="6.8" width="18.8" height="4.4" rx=".9"/><path d="M5.1 11.2h4.6l-1.8 8.6a.95.95 0 01-.93.74H4.05a.95.95 0 01-.93-1.14z"/><path d="M10 11.2h4.8a.85.85 0 01.83 1.05l-.3 1.25A2.5 2.5 0 0112.9 15.4h-2.2z" opacity=".8"/><rect x="19.4" y="8.2" width="2.6" height="1.6" rx=".5" fill="rgba(0,0,0,.45)"/></svg>`,
    lab: `<svg ${V}><path d="M9.5 3h5M10.4 3v6.2L5.7 17.6A2 2 0 007.5 20.6h9a2 2 0 001.8-3L13.6 9.2V3"/><path d="M8 14.4h8" stroke-width="2"/><circle cx="11" cy="16.3" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="17.4" r=".8" fill="currentColor" stroke="none"/></svg>`,

    /* ---- in-game vezérlők / HUD ---- */
    fire: `<svg ${Vf}><path d="M12 2.2c1.9 3.3.5 5.3-.9 6.9-1.5 1.7-3 3.4-3 6A5.1 5.1 0 0012 21a5.1 5.1 0 004-8.2c-.7-1-1.5-1.8-1.5-3 0-1 .5-2 .5-2s-2.2.7-3 2.5c-.6-1.7.4-5.1 0-8.1z"/><path d="M12 21a2.6 2.6 0 002.6-2.6c0-1.5-1.3-2.3-1.3-3.7 0 0-1.1.5-1.5 1.6-.3-.8-.9-1.3-.9-1.3s-1.5 1.4-1.5 3.4A2.6 2.6 0 0012 21z" fill="#1a0a00" fill-opacity=".28"/></svg>`,
    grenade: `<svg ${Vf}><path d="M11.8 7.8a6.4 6.4 0 106.4 6.4 6.4 6.4 0 00-6.4-6.4z"/><path d="M8.6 8.4l-1.4-1.4 1.6-1.6 1.4 1.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 5.4h3.4l1.6 1.6M14.8 4.6l2.4-2 1.6 1.7-2.2 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="11.8" cy="14.2" r="2.4" fill="rgba(255,255,255,.25)" stroke="none"/></svg>`,
    swap: `<svg ${V}><path d="M4 8.5h13l-3.2-3.2M20 15.5H7l3.2 3.2" stroke-width="2.4"/></svg>`,
    pause: `<svg ${Vf}><rect x="6" y="4.5" width="4" height="15" rx="1.4"/><rect x="14" y="4.5" width="4" height="15" rx="1.4"/></svg>`,
    heart: `<svg ${Vf}><path d="M12 20.8l-1.6-1.4C5.2 14.8 2.5 12.3 2.5 9 2.5 6.5 4.5 4.6 7 4.6c1.7 0 3.3 1 4.1 2.5h1.8C13.7 5.6 15.3 4.6 17 4.6c2.5 0 4.5 1.9 4.5 4.4 0 3.3-2.7 5.8-7.9 10.4z"/><path d="M9 8.5a2.6 2.6 0 012.4 1.6" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    medkit: `<svg ${Vf}><rect x="2.5" y="6.5" width="19" height="13" rx="2.4"/><path d="M8 6.5V5a1.6 1.6 0 011.6-1.6h4.8A1.6 1.6 0 0116 5v1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9.5v7M8.5 13h7" stroke="#0e1a0c" stroke-width="2.4" stroke-linecap="round"/></svg>`,
    ammo: `<svg ${Vf}><path d="M8.5 3.6h3l1 2.2v3.4l1.1 1.2v8.4a1.4 1.4 0 01-1.4 1.4H7.8a1.4 1.4 0 01-1.4-1.4v-8.4l1.1-1.2V5.8z"/><path d="M8 11.6h4" stroke="rgba(0,0,0,.4)" stroke-width="1.4"/><path d="M9 6.4h1.8" stroke="rgba(255,255,255,.4)" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    reload: `<svg ${V}><path d="M20 5.5v4.6h-4.6" stroke-width="2.4"/><path d="M19.4 10a7.6 7.6 0 10.3 5" fill="none" stroke-width="2.4"/></svg>`,
    boss: `<svg ${Vf}><path d="M12 2.2C6.5 2.2 2.6 6 2.6 10.9c0 2.8 1.4 4.8 3 6v2.6c0 1 .85 1.9 1.9 1.9h1v-2.4h1.7v2.4h3.6v-2.4h1.7v2.4h1c1.05 0 1.9-.85 1.9-1.9v-2.6c1.6-1.2 3-3.2 3-6C21.4 6 17.5 2.2 12 2.2z"/><circle cx="8.2" cy="11.2" r="2.3" fill="#ff2a2a"/><circle cx="15.8" cy="11.2" r="2.3" fill="#ff2a2a"/><circle cx="8.2" cy="11.2" r=".9" fill="#3a0000"/><circle cx="15.8" cy="11.2" r=".9" fill="#3a0000"/><path d="M12 14l-1.4 2.6h2.8z" fill="#3a0000"/></svg>`,
    objective: `<svg ${V}><circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><path d="M12 1.6v2.6M12 19.8v2.6M1.6 12h2.6M19.8 12h2.6" stroke-width="2"/></svg>`,

    /* ---- LABOR-FEJLESZTÉSEK ----
       Tömör sziluett + sötét belső részlet: 36-52px-en is azonnal felismerhető.
       (A korábbi procedurális canvas-pixelikonok helyett.) */
    regen: `<svg ${Vf}><path d="M12 4.4a7.6 7.6 0 017.2 5.2h-2.6A5.3 5.3 0 1012 17.3v2.3A7.6 7.6 0 1112 4.4z"/><path d="M17.6 2.2l2.2 5.4-5.6.7z"/><path d="M11 10h2v2h2v2h-2v2h-2v-2H9v-2h2z" stroke="rgba(0,0,0,.6)" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
    dmg: `<svg ${Vf}><path d="M3.6 9.6h4V14.4h-4a1 1 0 01-1-1v-2.8a1 1 0 011-1z"/><rect x="8.2" y="8.7" width="2.9" height="6.6" rx=".6"/><path d="M11.9 8.7h2.8l6.5 3.3-6.5 3.3h-2.8z"/><path d="M4.6 11.2v1.6" stroke="rgba(0,0,0,.45)" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    crit: `<svg ${Vf}><path d="M12 1.6l2.1 6.6 6.7-2.2-4 5.9 4 5.9-6.7-2.2L12 22.4l-2.1-6.8-6.7 2.2 4-5.9-4-5.9 6.7 2.2z"/><circle cx="12" cy="12" r="2.9" fill="rgba(0,0,0,.5)"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>`,
    speed: `<svg ${Vf}><path d="M13.4 3.8l7.8 8.2-7.8 8.2-2.9-2.6 5.4-5.6-5.4-5.6z"/><path d="M6.6 3.8l7.8 8.2-7.8 8.2-2.9-2.6 5.4-5.6-5.4-5.6z" opacity=".55"/></svg>`,
    luck: `<svg ${Vf}><path d="M12.4 13.2c.1 3 .9 5.4 2.7 7.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="8.7" cy="8.7" r="3.5" stroke="rgba(0,0,0,.62)" stroke-width="1.3"/><circle cx="15.3" cy="8.7" r="3.5" stroke="rgba(0,0,0,.62)" stroke-width="1.3"/><circle cx="8.7" cy="15.3" r="3.5" stroke="rgba(0,0,0,.62)" stroke-width="1.3"/><circle cx="15.3" cy="15.3" r="3.5" stroke="rgba(0,0,0,.62)" stroke-width="1.3"/></svg>`,
  };

  return function icon(name, cls) {
    let svg = P[name] || P.warning;
    if (cls) svg = svg.replace('<svg ', `<svg class="${cls}" `);
    return svg;
  };
})();
