#!/usr/bin/env python3
"""
extract_weapons.py — tiszta fegyver-sprite-ok kinyerese a generalt kepekbol
===========================================================================
Ket bajt old meg egyszerre:
  1) NEGY kepen belefestett SAKKTABLA-hatter van (nincs valodi alfa),
  2) KETTOBE (m9, soretes) FELIRAT van egetve ("M9 Pisztoly / Zombi Kronika").

MODSZER
  a) Hatter-maszk:
     - ha van valodi alfa -> alpha>25 a fegyver,
     - ha nincs -> RACS-TUDATOS tonus-becsles (mint tools/debg_grid.py): a
       sakktabla cellankent lapos, a cella VART tonusahoz hasonlitunk.
  b) A hattert CSAK A PEREMROL terjesztjuk (flood fill). Amit kivulrol nem
     lehet elerni, az a FEGYVER -- igy a szurke fem BELSEJE megmarad, ami a
     korabbi (tonus-alapu) probalkozast megbuktatta.
  c) A legnagyobb osszefuggo folt = a fegyver. Ez dobja el a FELIRATOT is,
     mert az kulon folt.
  d) Szoros kivagas + atlatszo hatter -> assets/sprites/weapons/clean/<id>.png

Hasznalat:  python tools/extract_weapons.py
"""
import os
import sys
from collections import deque

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("HIBA: Pillow es numpy kell.")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "sprites", "weapons")
OUT = os.path.join(SRC, "clean")

GRAY_TOL = 24
MATCH_TOL = 15
FLAT_STD = 3.0


def _transitions(line):
    t, st = [], 0
    for i in range(1, len(line)):
        if abs(int(line[i]) - int(line[st])) > 20:
            t.append(i); st = i
    return t


def grid_bg_mask(rgb):
    """Racs-tudatos hatter-maszk (a debg_grid.py logikaja, tomorebben)."""
    tx = _transitions(rgb[3, :, 0].astype(np.int16))
    ty = _transitions(rgb[:, 3, 0].astype(np.int16))
    if len(tx) < 3 or len(ty) < 3:
        return None
    cw = ((tx[-1] - tx[0]) / (len(tx) - 1) + (ty[-1] - ty[0]) / (len(ty) - 1)) / 2
    if cw < 4 or cw > 200:
        return None
    px, py = tx[0] % cw, ty[0] % cw
    h, w, _ = rgb.shape
    NC = int(np.ceil(w / cw)) + 2
    inset = max(1, int(cw * 0.25))
    med = np.zeros((NC, NC, 3), np.float32)
    std = np.full((NC, NC), 99.0, np.float32)
    for cy in range(NC):
        y0 = int(round(py + (cy - 1) * cw)) + inset; y1 = int(round(py + cy * cw)) - inset
        if y1 <= y0 or y1 <= 0 or y0 >= h: continue
        y0, y1 = max(0, y0), min(h, y1)
        for cx in range(NC):
            x0 = int(round(px + (cx - 1) * cw)) + inset; x1 = int(round(px + cx * cw)) - inset
            if x1 <= x0 or x1 <= 0 or x0 >= w: continue
            x0, x1 = max(0, x0), min(w, x1)
            blk = rgb[y0:y1, x0:x1].reshape(-1, 3).astype(np.float32)
            if blk.size == 0: continue
            med[cy, cx] = np.median(blk, axis=0); std[cy, cx] = blk.std(axis=0).max()
    yy, xx = np.mgrid[0:NC, 0:NC]
    par = (yy + xx) % 2
    grayish = (med.max(axis=2) - med.min(axis=2)) < GRAY_TOL
    flat = (std < FLAT_STD) & grayish
    maps = []
    for p in (0, 1):
        m = np.full((NC, NC, 3), np.nan, np.float32)
        sel = flat & (par == p); m[sel] = med[sel]
        for _ in range(NC):
            nan = np.isnan(m[:, :, 0])
            if not nan.any(): break
            acc = np.zeros_like(m); cnt = np.zeros((NC, NC), np.float32)
            for dy, dx in ((-2,0),(2,0),(0,-2),(0,2),(-1,-1),(1,1),(-1,1),(1,-1)):
                s = np.roll(np.roll(m, dy, axis=0), dx, axis=1)
                v = ~np.isnan(s[:, :, 0]); acc[v] += s[v]; cnt += v
            upd = nan & (cnt > 0)
            if not upd.any(): break
            m[upd] = acc[upd] / cnt[upd][:, None]
        maps.append(np.nan_to_num(m, nan=128.0))
    cyi = np.clip(np.floor((np.arange(h) - py) / cw).astype(int) + 1, 0, NC - 1)
    cxi = np.clip(np.floor((np.arange(w) - px) / cw).astype(int) + 1, 0, NC - 1)
    P = par[np.ix_(cyi, cxi)]
    pred = np.where(P[:, :, None] == 0, maps[0][np.ix_(cyi, cxi)], maps[1][np.ix_(cyi, cxi)])
    diff = np.abs(rgb.astype(np.float32) - pred).max(axis=2)
    gray = (rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)) < GRAY_TOL
    return (diff <= MATCH_TOL) & gray


def flood_border(mask):
    h, w = mask.shape
    r = np.zeros((h, w), bool); dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if mask[y, x] and not r[y, x]: r[y, x] = True; dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if mask[y, x] and not r[y, x]: r[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not r[ny, nx]:
                r[ny, nx] = True; dq.append((ny, nx))
    return r


def erode(m, n=1):
    """Zsugoritas: csak az a pixel marad, aminek MIND a 4 szomszedja is bent van."""
    for _ in range(n):
        e = m.copy()
        e[1:, :] &= m[:-1, :]; e[:-1, :] &= m[1:, :]
        e[:, 1:] &= m[:, :-1]; e[:, :-1] &= m[:, 1:]
        m = e
    return m


def dilate(m, n=2):
    for _ in range(n):
        d = m.copy()
        d[1:, :] |= m[:-1, :]; d[:-1, :] |= m[1:, :]
        d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
        m = d
    return m


def largest_component(fg):
    h, w = fg.shape
    seen = np.zeros_like(fg); best = None; bs = 0
    for y in range(h):
        row = fg[y]
        for x in range(w):
            if row[x] and not seen[y, x]:
                dq = deque([(y, x)]); seen[y, x] = True; pix = []
                while dq:
                    cy, cx = dq.popleft(); pix.append((cy, cx))
                    for ny, nx in ((cy-1,cx),(cy+1,cx),(cy,cx-1),(cy,cx+1)):
                        if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; dq.append((ny, nx))
                if len(pix) > bs: bs = len(pix); best = pix
    return best, bs


def process(name):
    p = os.path.join(SRC, name + ".png")
    a = np.array(Image.open(p).convert("RGBA"))
    rgb = a[:, :, :3]
    if a[:, :, 3].min() < 255:
        fg = a[:, :, 3] > 25                      # mar van valodi alfa
        mode = "alfa"
    else:
        bg = grid_bg_mask(rgb)
        if bg is None:
            return name, "NINCS RACS", None
        outside = flood_border(dilate(bg, 2)) & bg
        fg = ~outside                              # amit kivulrol nem ertunk el = fegyver
        # A kockas maradvanyok a fegyverhez KAPCSOLODNAK (ezert nem dobja el a
        # legnagyobb-folt logika), de VEKONYAK/szemcsesek. Morfologiai NYITAS:
        # erozio -> a vekony hidak elszakadnak -> legnagyobb folt = a tomor
        # fegyvertest -> dilatacio vissza (az eredeti maszkra vagva).
        core = erode(fg, 3)
        pix, _ = largest_component(core)
        if pix:
            keep = np.zeros_like(fg)
            keep[np.array([q[0] for q in pix]), np.array([q[1] for q in pix])] = True
            fg = dilate(keep, 4) & fg
        mode = "racs"
    pix, sz = largest_component(fg)
    if not pix:
        return name, "URES", None
    ys = np.array([q[0] for q in pix]); xs = np.array([q[1] for q in pix])
    out = np.zeros_like(a); out[ys, xs] = a[ys, xs]; out[ys, xs, 3] = 255
    crop = Image.fromarray(out, "RGBA").crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    os.makedirs(OUT, exist_ok=True)
    crop.save(os.path.join(OUT, name + ".png"), optimize=True)
    return name, mode, (crop.size, sz)


if __name__ == "__main__":
    for n in ["w1_m9", "w2_vipera", "w3_soretes", "w4_ak", "w5_langszoro", "w6_minigun", "w7_rpg", "w8_ion"]:
        nm, mode, info = process(n)
        print(f"  {nm:14s} [{mode:5s}] {info if info else ''}")
