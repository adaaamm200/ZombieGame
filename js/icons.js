/* ZombieChronicles — egységes inline SVG ikonok (emoji helyett).
   ZD.icon(name, extraClass) → SVG string. currentColor öröklődik. */
window.ZD = window.ZD || {};

ZD.icon = (() => {
  const V = 'viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  const Vf = 'viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" stroke="none"';

  const P = {
    /* nav / general */
    back: `<svg ${V}><path d="M14 6l-6 6 6 6"/></svg>`,
    play: `<svg ${Vf}><path d="M8 5v14l11-7z"/></svg>`,
    chevron: `<svg ${V}><path d="M9 6l6 6-6 6"/></svg>`,
    gear: `<svg ${V}><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.4 7.2l2 1.2M17.6 15.6l2 1.2M4.4 16.8l2-1.2M17.6 8.4l2-1.2"/></svg>`,
    settings: `<svg ${V}><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.4 7.2l2 1.2M17.6 15.6l2 1.2M4.4 16.8l2-1.2M17.6 8.4l2-1.2"/></svg>`,
    plus: `<svg ${V}><path d="M12 5v14M5 12h14"/></svg>`,
    close: `<svg ${V}><path d="M6 6l12 12M18 6L6 18"/></svg>`,
    globe: `<svg ${V}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.4 2.6 15.6 0 18M12 3c-2.6 2.4-2.6 15.6 0 18"/></svg>`,
    /* currency / meta */
    coin: `<svg ${Vf}><circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.4"/><path d="M9.4 9.2a3.4 3.4 0 100 5.6" fill="none" stroke="rgba(60,40,0,.75)" stroke-width="1.8" stroke-linecap="round"/><path d="M8.2 12h3.4" stroke="rgba(60,40,0,.75)" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    save: `<svg ${V}><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/></svg>`,
    file: `<svg ${V}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg>`,
    /* mission markers */
    check: `<svg ${V}><path d="M5 12.5l4.5 4.5L19 6.5"/></svg>`,
    lock: `<svg ${V}><rect x="5.5" y="10.5" width="13" height="9.5" rx="1.6"/><path d="M8.2 10.5V8a3.8 3.8 0 017.6 0v2.5"/></svg>`,
    skull: `<svg ${Vf}><path d="M12 2.6C7 2.6 3.4 6 3.4 10.6c0 2.6 1.2 4.4 2.8 5.6v2.4c0 .9.7 1.6 1.6 1.6h.9v-2.2h1.5v2.2h3.6v-2.2h1.5v2.2h.9c.9 0 1.6-.7 1.6-1.6v-2.4c1.6-1.2 2.8-3 2.8-5.6C20.6 6 17 2.6 12 2.6z"/><circle cx="8.6" cy="11" r="1.9" fill="#0a0a0a"/><circle cx="15.4" cy="11" r="1.9" fill="#0a0a0a"/><path d="M12 13.5l-1.1 2.2h2.2z" fill="#0a0a0a"/></svg>`,
    crate: `<svg ${V}><path d="M4 8.5L12 5l8 3.5v7L12 19l-8-3.5z"/><path d="M4 8.5l8 3.5 8-3.5M12 12v7M8 6.7v6.9M16 6.7v6.9"/></svg>`,
    warning: `<svg ${V}><path d="M12 4L2.7 20h18.6z"/><path d="M12 10v4.5M12 17.4v.2"/></svg>`,
    /* nav item glyphs */
    campaign: `<svg ${V}><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.4"/><path d="M12 2.4v3M12 18.6v3M2.4 12h3M18.6 12h3"/></svg>`,
    scavenge: `<svg ${V}><path d="M4 8.5L12 5l8 3.5v7L12 19l-8-3.5z"/><path d="M4 8.5l8 3.5 8-3.5M12 12v7"/></svg>`,
    armory: `<svg ${V}><path d="M3 9h13l3 2v2h-2l-2 3h-3l-1-3H6l-1 2H3z"/><path d="M8 13v3"/></svg>`,
    lab: `<svg ${V}><path d="M10 3h4M10.5 3v6L6 18a2 2 0 001.8 3h8.4A2 2 0 0018 18l-4.5-9V3"/><path d="M8.4 14h7.2"/></svg>`,
    /* in-game controls */
    fire: `<svg ${Vf}><path d="M12 2.4c1.6 3 .3 4.8-.9 6.2-1.3 1.5-2.7 3-2.7 5.4A4.6 4.6 0 0012 18.6a4.6 4.6 0 003.6-7.4c-.6-.9-1.3-1.6-1.3-2.7 0-.9.4-1.7.4-1.7s-2 .6-2.7 2.2c-.5-1.5.4-4.6 0-6.6z"/></svg>`,
    grenade: `<svg ${V}><circle cx="12" cy="14" r="6"/><path d="M9.5 8.5l1.5-1.5h2l1.5 1.5M14.5 6.5l2-2 1.5 1.5-2 2M12 5.5V7"/></svg>`,
    swap: `<svg ${V}><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>`,
    pause: `<svg ${Vf}><rect x="6.5" y="5" width="3.5" height="14" rx="1"/><rect x="14" y="5" width="3.5" height="14" rx="1"/></svg>`,
    heart: `<svg ${Vf}><path d="M12 20.5l-1.5-1.3C5.4 14.7 2.8 12.3 2.8 9.2 2.8 6.8 4.7 5 7 5c1.6 0 3.1.9 3.9 2.3H13C13.9 5.9 15.4 5 17 5c2.3 0 4.2 1.8 4.2 4.2 0 3.1-2.6 5.5-7.7 10z"/></svg>`,
  };

  return function icon(name, cls) {
    let svg = P[name] || P.warning;
    if (cls) svg = svg.replace('<svg ', `<svg class="${cls}" `);
    return svg;
  };
})();
