#!/usr/bin/env python3
"""
debg_grid.py — racs-tudatos sakktabla-hatter eltavolitas (v2)
=============================================================
A v1 (debg_checkerboard.py) TONUS alapjan dolgozott: a kep szelerol vett ket
szurke arnyalathoz hasonlitott. Ket helyen bukott:
  1) SZURKE FEM alany (AK, minigun, medve pancelja): a tonusa egybeesik a
     sakktablaeval -> a kitoltes ATTERJEDT rajta, kilyukasztotta.
  2) FESTETT ARNYEK a hatteren (bloater, boss): ott a kocka tonusa helyileg
     sotetebb -> nem egyezett a szeli tonussal -> BENNMARADT.

Ez a v2 a sakktabla SZERKEZETEBOL indul ki, nem a konkret szinbol:
  - a hatter szabalyos RACS, es cellankent TOKELETESEN egyenletes (lapos),
  - az alany TEXTURALT (arnyalatok, elek) -> a cellai nem laposak,
  - a lapos cellakbol HELYILEG tanuljuk meg a ket tonust (paritas szerint),
    igy a festett arnyek is kovetheto,
  - egy pixel csak akkor hatter, ha a SAJAT cellaja VART tonusahoz illik.

Ettol a szurke fem tulel: egy tomor szurke felulet csak minden MASODIK cellaban
egyezne a varttal, igy a kitoltes nem tud folytonosan atterjedni rajta.

Hasznalat (projekt gyokerbol):
    python tools/debg_grid.py                 # minden alfa nelkuli asset
    python tools/debg_grid.py --only assets/sprites/weapons/w4_ak.png
    python tools/debg_grid.py --force         # akkor is, ha mar van alfa
"""

import argparse
import os
import sys
from collections import deque

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("HIBA: Pillow es numpy kell.  ->  pip install Pillow numpy")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from debg_checkerboard import TARGETS

FLAT_STD = 2.5     # ennel egyenletesebb cella = biztos hatter
GRAY_TOL = 24      # max-min csatorna-elteres ennel kisebb = kozel-szurke
MATCH_TOL = 14     # a pixel ennyire terhet el a cellaja VART tonusatol


def _transitions(line):
    """Tonus-valtasok pozicioi egy (hatter) sorban/oszlopban."""
    t, st = [], 0
    for i in range(1, len(line)):
        if abs(int(line[i]) - int(line[st])) > 20:
            t.append(i)
            st = i
    return t


def detect_grid(rgb):
    """(cell_w, phase_x, phase_y) — a racs PONTOS cellamerete es fazisa.

    FONTOS: a cellameretet a TENYLEGES tonus-atmenetekbol szamoljuk (az elso
    es utolso atmenet tavolsaga / a kozok szama), nem egy tippelt cellaszambol.
    Korabban 48/96-ra kenyszeritettem -> a valodi ~50-es racsnal a celláim
    halmozodoan elcsusztak, mindket tonust tartalmaztak (szoras ~24 a ~0
    helyett), ezert nem tuntek "laposnak".
    """
    tx = _transitions(rgb[3, :, 0].astype(np.int16))
    ty = _transitions(rgb[:, 3, 0].astype(np.int16))
    if len(tx) < 3 or len(ty) < 3:
        return None, 0.0, 0.0
    cwx = (tx[-1] - tx[0]) / (len(tx) - 1)
    cwy = (ty[-1] - ty[0]) / (len(ty) - 1)
    cw = (cwx + cwy) / 2.0
    if cw < 4 or cw > 200:
        return None, 0.0, 0.0
    return cw, tx[0] % cw, ty[0] % cw


def cell_index(n, cw, phase):
    """Pixel -> cella-index vektor (a fazist figyelembe veve)."""
    return np.floor((np.arange(n) - phase) / cw).astype(int) + 1


def grid_n(w, cw):
    return int(np.ceil(w / cw)) + 2


def cell_stats(rgb, cw, px, py):
    """Cellankent: median szin + szorasa (a cella BELSEJEBOL, a kevert hatarok
    nelkul). A racs a detektalt FAZISHOZ es CELLAMERETHEZ igazodik."""
    h, w, _ = rgb.shape
    NC = grid_n(w, cw)
    med = np.zeros((NC, NC, 3), np.float32)
    std = np.full((NC, NC), 99.0, np.float32)
    inset = max(1, int(cw * 0.22))
    for cy in range(NC):
        y0 = int(round(py + (cy - 1) * cw)) + inset
        y1 = int(round(py + cy * cw)) - inset
        if y1 <= y0 or y1 <= 0 or y0 >= h:
            continue
        y0, y1 = max(0, y0), min(h, y1)
        for cx in range(NC):
            x0 = int(round(px + (cx - 1) * cw)) + inset
            x1 = int(round(px + cx * cw)) - inset
            if x1 <= x0 or x1 <= 0 or x0 >= w:
                continue
            x0, x1 = max(0, x0), min(w, x1)
            blk = rgb[y0:y1, x0:x1].reshape(-1, 3).astype(np.float32)
            if blk.size == 0:
                continue
            med[cy, cx] = np.median(blk, axis=0)
            std[cy, cx] = blk.std(axis=0).max()
    return med, std


def tone_maps(med, std, NC):
    """Paritasonkent (sakktabla-szinezes) HELYI tonus-terkep a lapos cellakbol.
    A nem-lapos (alany) cellak ertekeit a szomszedokbol toltjuk ki -> igy a
    festett arnyek gradiense is kovetheto."""
    nc = NC
    yy, xx = np.mgrid[0:nc, 0:nc]
    par = (yy + xx) % 2
    grayish = (med.max(axis=2) - med.min(axis=2)) < GRAY_TOL
    flat = (std < FLAT_STD) & grayish

    maps = []
    for p in (0, 1):
        m = np.full((nc, nc, 3), np.nan, np.float32)
        sel = flat & (par == p)
        m[sel] = med[sel]
        # hianyzo cellak kitoltese szomszed-atlaggal (par kor eleg)
        for _ in range(nc):
            nan = np.isnan(m[:, :, 0])
            if not nan.any():
                break
            acc = np.zeros_like(m)
            cnt = np.zeros((nc, nc), np.float32)
            for dy, dx in ((-2, 0), (2, 0), (0, -2), (0, 2), (-1, -1), (1, 1), (-1, 1), (1, -1)):
                s = np.roll(np.roll(m, dy, axis=0), dx, axis=1)
                v = ~np.isnan(s[:, :, 0])
                acc[v] += s[v]
                cnt += v
            upd = nan & (cnt > 0)
            if not upd.any():
                break
            m[upd] = acc[upd] / cnt[upd][:, None]
        maps.append(np.nan_to_num(m, nan=128.0))
    return maps, par


def predicted(rgb, maps, par, cw, px, py):
    """Minden pixelre: mi LENNE ott a hatter szine (a cellaja paritasa szerint)."""
    h, w, _ = rgb.shape
    NC = grid_n(w, cw)
    cy = np.clip(cell_index(h, cw, py), 0, NC - 1)
    cx = np.clip(cell_index(w, cw, px), 0, NC - 1)
    P = par[np.ix_(cy, cx)]
    M0 = maps[0][np.ix_(cy, cx)]
    M1 = maps[1][np.ix_(cy, cx)]
    return np.where(P[:, :, None] == 0, M0, M1)


def dilate(mask, rounds=2):
    m = mask.copy()
    for _ in range(rounds):
        d = m.copy()
        d[1:, :] |= m[:-1, :]; d[:-1, :] |= m[1:, :]
        d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
        m = d
    return m


def flood_from_border(mask):
    h, w = mask.shape
    r = np.zeros((h, w), bool)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if mask[y, x] and not r[y, x]:
                r[y, x] = True; dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if mask[y, x] and not r[y, x]:
                r[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not r[ny, nx]:
                r[ny, nx] = True; dq.append((ny, nx))
    return r


def process(path, force=False, dry=False):
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):
        return "MISSING", 0.0
    im = Image.open(full).convert("RGBA")
    arr = np.array(im)
    if arr[:, :, 3].min() < 255 and not force:
        return "HAS_ALPHA", 0.0
    rgb = arr[:, :, :3]

    cw, px, py = detect_grid(rgb)
    if not cw:
        return "NO_GRID", 0.0

    med, std = cell_stats(rgb, cw, px, py)
    maps, par = tone_maps(med, std, grid_n(rgb.shape[1], cw))
    pred = predicted(rgb, maps, par, cw, px, py)

    diff = np.abs(rgb.astype(np.float32) - pred).max(axis=2)
    grayish = (rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)) < GRAY_TOL
    bg = (diff <= MATCH_TOL) & grayish

    reached = flood_from_border(dilate(bg, 2))
    transparent = reached & bg

    # halo: az elek menten maradt kevert szegely (szelesebb tures, csak a mar
    # atlatszo teruletek szomszedjaiban)
    wide = (diff <= MATCH_TOL * 2.2) & grayish
    for _ in range(2):
        nb = np.zeros_like(transparent)
        nb[1:, :] |= transparent[:-1, :]; nb[:-1, :] |= transparent[1:, :]
        nb[:, 1:] |= transparent[:, :-1]; nb[:, :-1] |= transparent[:, 1:]
        add = nb & wide & (~transparent)
        if not add.any():
            break
        transparent |= add

    pct = 100.0 * transparent.mean()
    if not dry:
        arr[:, :, 3] = np.where(transparent, 0, 255).astype(np.uint8)
        Image.fromarray(arr, "RGBA").save(full, optimize=True)
    return f"DONE(cw={cw:.1f})", pct


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--only", action="append")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    for p in (a.only if a.only else TARGETS):
        st, pct = process(p, a.force, a.dry_run)
        nm = os.path.basename(p)
        if st.startswith("DONE"):
            print(f"  [+] {nm:28s} {st:14s} atlatszo: {pct:5.1f}%")
        else:
            print(f"  [=] {nm:28s} {st}")


if __name__ == "__main__":
    main()
