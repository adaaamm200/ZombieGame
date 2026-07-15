#!/usr/bin/env python3
"""
clean_islands.py — a de-checkerboard utan maradt szurke "szellem-szigetek" takaritasa
======================================================================================
A generator neha LAGY ARNYEKOT/vignettat fest a kockas hatterre. Ott a kocka
tonusai helyileg sotetebbek, ezert a debg_checkerboard.py (ami a kep SZELEROL
vett ket tonushoz hasonlit) nem tavolitja el oket -> minden elsotetult kockabol
egy kis TOMOR sziget marad a kesz kep korul.

Ez a script ezeket takaritja: az atlatszova tett hatter kozott maradt, KICSI es
KOZEL-SZURKE osszefuggo foltokat teszi atlatszova.

BIZTONSAG (ezert nem eszi meg a tartalmat):
  - a NAGY osszefuggo folt (maga a karakter/fegyver) mindig marad,
  - a SZINES kis reszletek (szikra, vercsepp, izzas) MARADNAK -- csak a
    kozel-szurke szemet megy,
  - a sheet-eket (tobb kulon elem egy kepen) a meret-kuszob vedi.

Hasznalat:
    python tools/clean_islands.py --report          # csak felmeres, nem ir
    python tools/clean_islands.py                   # takaritas
    python tools/clean_islands.py --only assets/... # egy fajl
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
from debg_checkerboard import TARGETS  # ugyanaz az asset-lista

MIN_ISLAND = 1500   # ennel kisebb osszefuggo folt gyanus (px)
GRAY_TOL = 26       # max(R,G,B)-min(R,G,B) ennel kisebb = kozel-szurke -> szemet

# A valodi tartalom mindig hoz szin-valtozatossagot (szurkeseg ~18-33), a
# bennmaradt sakktabla-folt viszont TISZTA semleges szurke (~1.5). Ezert a
# tiszta szurke szigetek MERETTOL FUGGETLENUL mennek (egy plafonig, hogy egy
# esetleges nagy, legitim szurke elemet ne nyirjunk ki).
PURE_GRAY_SPREAD = 8
PURE_GRAY_MAX = 25000


def components(opaque):
    """Osszefuggo tomor foltok (4-szomszedsag). -> lista (meret, [indexek])"""
    h, w = opaque.shape
    seen = np.zeros_like(opaque)
    out = []
    for y in range(h):
        row = opaque[y]
        for x in range(w):
            if row[x] and not seen[y, x]:
                dq = deque([(y, x)])
                seen[y, x] = True
                pix = []
                while dq:
                    cy, cx = dq.popleft()
                    pix.append((cy, cx))
                    for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                        if 0 <= ny < h and 0 <= nx < w and opaque[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            dq.append((ny, nx))
                out.append(pix)
    return out


def process(path, report_only=False):
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):
        return None
    a = np.array(Image.open(full).convert("RGBA"))
    opaque = a[:, :, 3] > 0
    if not opaque.any():
        return None
    comps = components(opaque)
    comps.sort(key=len, reverse=True)
    total = int(opaque.sum())
    main = len(comps[0]) if comps else 0

    removed = 0
    kept_color = 0
    for pix in comps[1:]:
        ys = np.array([p[0] for p in pix]); xs = np.array([p[1] for p in pix])
        rgb = a[ys, xs, :3].astype(np.int16)
        spread = (rgb.max(axis=1) - rgb.min(axis=1)).mean()

        pure_gray = spread < PURE_GRAY_SPREAD and len(pix) <= PURE_GRAY_MAX
        small_grayish = len(pix) < MIN_ISLAND and spread < GRAY_TOL
        if not (pure_gray or small_grayish):
            if len(pix) < MIN_ISLAND:
                kept_color += len(pix)      # szines aprosag -> MARAD
            continue                        # nagy/szines folt -> valodi tartalom
        removed += len(pix)
        if not report_only:
            a[ys, xs, 3] = 0

    if not report_only and removed:
        Image.fromarray(a, "RGBA").save(full, optimize=True)
    return {
        "name": os.path.basename(path), "total": total, "main": main,
        "islands": len(comps) - 1, "removed": removed, "kept_color": kept_color,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--report", action="store_true", help="csak felmeres")
    ap.add_argument("--only", action="append")
    args = ap.parse_args()

    paths = args.only if args.only else TARGETS
    for p in paths:
        r = process(p, args.report)
        if not r:
            continue
        mainpct = 100.0 * r["main"] / max(1, r["total"])
        flag = "  <-- SOK SZEMET" if r["removed"] > r["main"] * 0.15 else ""
        act = "talalt" if args.report else "torolve"
        print(f"  {r['name']:26s} fo-alak={mainpct:5.1f}%  sziget={r['islands']:5d}  "
              f"szurke-szemet {act}={r['removed']:7d}px  szines-megtartva={r['kept_color']:6d}px{flag}")


if __name__ == "__main__":
    main()
