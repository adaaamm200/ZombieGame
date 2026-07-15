#!/usr/bin/env python3
"""
debg_checkerboard.py — a belefestett "atlatszo" sakktabla-hatter eltavolitasa
=============================================================================
A Higgsfield-generalasok a "transparent" hattert TOMOR, ketszinu szurke
sakktablakent rajzoljak bele (alfa=255 mindenhol). Ez a script visszaadja a
VALODI atlatszosagot -- halozat es kredit nelkul.

MODSZER (ezert nem bantja a tartalmat):
  1) A ket hatter-tonust a kep SZELEROL olvassa ki (ott biztosan hatter van).
  2) Csak azokat a pixeleket teszi atlatszova, amik
       (a) illenek valamelyik hatter-tonushoz ES kozel-szurkek, ES
       (b) a kep SZELEROL osszefuggoen elerhetok (flood-fill).
  -> A kep KOZEPEN levo szurke tartalom (femszurke fegyver, szurkes zombi-bor)
     erintetlen marad, mert oda a kitoltes nem terjed at.
  3) Vegul egy ovatos halo-tisztitas: az elek menten maradt, sakktablaval
     kevert szurke szegely-pixeleket is levagja.

Hasznalat (a projekt gyokerebol):
    python tools/debg_checkerboard.py              # minden alfa nelkuli asset
    python tools/debg_checkerboard.py --dry-run
    python tools/debg_checkerboard.py --only assets/fx/flame.png
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

TARGETS = [
    "assets/sprites/zombies/kobor/kobor_raw.png",
    "assets/sprites/zombies/runner/runner_raw.png",
    "assets/sprites/zombies/crawler/crawler_raw.png",
    "assets/sprites/zombies/spitter/spitter_raw.png",
    "assets/sprites/zombies/bloater/bloater_raw.png",
    "assets/sprites/zombies/brute/brute_raw.png",
    "assets/sprites/zombies/boss/boss_raw.png",
    "assets/sprites/characters/farkas/farkas_raw.png",
    "assets/sprites/characters/szellem/szellem_raw.png",
    "assets/sprites/characters/angyal/angyal_raw.png",
    "assets/sprites/characters/medve/medve_raw.png",
    "assets/sprites/characters/szikra/szikra_raw.png",
    "assets/sprites/weapons/w1_m9.png",
    "assets/sprites/weapons/w2_vipera.png",
    "assets/sprites/weapons/w3_soretes.png",
    "assets/sprites/weapons/w4_ak.png",
    "assets/sprites/weapons/w5_langszoro.png",
    "assets/sprites/weapons/w6_minigun.png",
    "assets/sprites/weapons/w7_rpg.png",
    "assets/sprites/weapons/w8_ion.png",
    "assets/fx/blood_splatter_sheet.png",
    "assets/fx/wound_stump.png",
    "assets/fx/impact_spark.png",
    "assets/fx/muzzle_flash.png",
    "assets/fx/flame.png",
    "assets/fx/explosion_sheet.png",
    "assets/fx/rocket.png",
    "assets/fx/acid_spit.png",
    "assets/ui/coin.png",
    "assets/ui/grenade.png",
]

TONE_TOL = 16      # +/- ennyi elterest tur el a hatter-tonushoz kepest
TONE_SEP = 25      # a ket hatter-tonusnak legalabb ennyire kell kulonboznie
GRAY_TOL = 22      # max(R,G,B)-min(R,G,B) ennel kisebb = "kozel-szurke"
HALO_TOL = 34      # a halo-tisztitas szelesebb turese


def border_tones(rgb):
    """A sakktabla KET, EGYMASTOL TAVOLI tonusa a kep szelso gyurujebol.

    FONTOS: nem eleg a ket leggyakoribb szint venni -- a ±1 zaj miatt azok
    gyakran UGYANANNAK a tonusnak a ket arnyalata (pl. 37 es 38), es ilyenkor
    a masik (vilagos) tonus kimarad -> a kitoltes nem tud atjutni rajta.
    Ezert: a leggyakoribb = A, majd a leggyakoribb olyan szin, ami A-tol
    erdemben (>TONE_SEP) eltér = B.
    """
    ring = np.concatenate([
        rgb[0, :, :], rgb[-1, :, :], rgb[:, 0, :], rgb[:, -1, :]
    ], axis=0)
    cols, counts = np.unique(ring.reshape(-1, 3), axis=0, return_counts=True)
    order = np.argsort(-counts)
    a = cols[order[0]]
    b = a
    for i in order[1:]:
        if np.abs(cols[i].astype(np.int16) - a.astype(np.int16)).max() > TONE_SEP:
            b = cols[i]
            break
    return [a, b]


def dilate(mask, rounds=2):
    """Vekony (1-2px) hatarok athidalasa, hogy a kitoltes at tudjon jutni."""
    m = mask.copy()
    for _ in range(rounds):
        d = m.copy()
        d[1:, :] |= m[:-1, :]
        d[:-1, :] |= m[1:, :]
        d[:, 1:] |= m[:, :-1]
        d[:, :-1] |= m[:, 1:]
        m = d
    return m


def bg_like(rgb, tones, tol):
    grayish = (rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)) < GRAY_TOL
    m = np.zeros(rgb.shape[:2], dtype=bool)
    for t in tones:
        d = np.abs(rgb.astype(np.int16) - t.astype(np.int16)).max(axis=2)
        m |= (d <= tol)
    return m & grayish


def flood_from_border(mask):
    """A szelekrol osszefuggoen elerheto mask-pixelek (4-szomszedsag, BFS)."""
    h, w = mask.shape
    reached = np.zeros((h, w), dtype=bool)
    dq = deque()
    for x in range(w):
        if mask[0, x]:      reached[0, x] = True;      dq.append((0, x))
        if mask[h - 1, x]:  reached[h - 1, x] = True;  dq.append((h - 1, x))
    for y in range(h):
        if mask[y, 0]:      reached[y, 0] = True;      dq.append((y, 0))
        if mask[y, w - 1]:  reached[y, w - 1] = True;  dq.append((y, w - 1))
    while dq:
        y, x = dq.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not reached[ny, nx]:
                reached[ny, nx] = True
                dq.append((ny, nx))
    return reached


def clean_halo(rgb, transparent, tones, rounds=2):
    """Az elek menten maradt, sakktablaval kevert szurke szegely levagasa."""
    wide = bg_like(rgb, tones, HALO_TOL)
    for _ in range(rounds):
        nb = np.zeros_like(transparent)
        nb[1:, :] |= transparent[:-1, :]
        nb[:-1, :] |= transparent[1:, :]
        nb[:, 1:] |= transparent[:, :-1]
        nb[:, :-1] |= transparent[:, 1:]
        add = nb & wide & (~transparent)
        if not add.any():
            break
        transparent |= add
    return transparent


def process(path, dry=False):
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):
        return "MISSING", 0.0
    im = Image.open(full).convert("RGBA")
    arr = np.array(im)
    if arr[:, :, 3].min() < 255:
        return "HAS_ALPHA", 0.0            # mar tiszta -> nem nyulunk hozza

    rgb = arr[:, :, :3]
    tones = border_tones(rgb)
    mask = bg_like(rgb, tones, TONE_TOL)
    # A kitoltes egy ATHIDALT maszkon fut (hogy a kockak kozti 1-2px kevert
    # hatarokon at tudjon jutni), de VEGUL csak azok a pixelek lesznek
    # atlatszoak, amik tenylegesen illenek valamelyik hatter-tonushoz.
    reached = flood_from_border(dilate(mask, 2))
    transparent = reached & mask
    transparent = clean_halo(rgb, transparent, tones)

    pct = 100.0 * transparent.sum() / transparent.size
    if pct < 2:
        return "NO_BG_FOUND", pct          # gyanus: nem talalt hattert
    if not dry:
        arr[:, :, 3] = np.where(transparent, 0, 255).astype(np.uint8)
        Image.fromarray(arr, "RGBA").save(full, optimize=True)
    return "DONE", pct


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", action="append", help="csak ezt a fajlt (tobbszor is megadhato)")
    args = ap.parse_args()

    paths = args.only if args.only else TARGETS
    done = skipped = problem = 0
    for p in paths:
        status, pct = process(p, args.dry_run)
        nm = os.path.basename(p)
        if status == "DONE":
            done += 1
            print(f"  [+] {nm:28s} hatter eltavolitva: {pct:5.1f}% atlatszo")
        elif status == "HAS_ALPHA":
            skipped += 1
            print(f"  [=] {nm:28s} mar van valodi alfa -> kihagyva")
        elif status == "MISSING":
            print(f"  [ ?] {nm:28s} hianyzik")
        else:
            problem += 1
            print(f"  [!] {nm:28s} NEM talalt hatteret ({pct:.1f}%) -> kezi ellenorzes kell")

    print(f"\nKesz: {done}   Kihagyva: {skipped}   Gyanus: {problem}")
    if not args.dry_run and done:
        print("Ellenorzes:  py tools/verify_assets.py")
        print("FONTOS: nezd meg SZEMMEL is par kepet - a szam nem latja a minoseget!")


if __name__ == "__main__":
    main()
