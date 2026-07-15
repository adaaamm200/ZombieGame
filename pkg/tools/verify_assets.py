#!/usr/bin/env python3
"""
verify_assets.py — QA ellenorzes minden bedobott kepre
=======================================================
Vegigmegy a vart asset-listan, es minden meglevo kepre lefuttatja a
PART_RIG_PIPELINE.md QA-ellenorzeset (van-e VALODI atlatszosag), plusz
jelzi, mi hianyzik meg.

Hasznalat (a csomag gyokerebol):
    python tools/verify_assets.py
"""

import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("HIBA: Pillow nincs telepitve.  ->  pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXPECTED = {
    "Zombik (part-rig, valodi alfa KELL)": [
        "assets/sprites/zombies/kobor/kobor_raw.png",
        "assets/sprites/zombies/runner/runner_raw.png",
        "assets/sprites/zombies/crawler/crawler_raw.png",
        "assets/sprites/zombies/spitter/spitter_raw.png",
        "assets/sprites/zombies/bloater/bloater_raw.png",
        "assets/sprites/zombies/brute/brute_raw.png",
        "assets/sprites/zombies/boss/boss_raw.png",
    ],
    "Karakterek (part-rig, valodi alfa KELL)": [
        "assets/sprites/characters/farkas/farkas_raw.png",
        "assets/sprites/characters/szellem/szellem_raw.png",
        "assets/sprites/characters/angyal/angyal_raw.png",
        "assets/sprites/characters/medve/medve_raw.png",
        "assets/sprites/characters/szikra/szikra_raw.png",
    ],
    "Fegyverek (egyben, nem vagando)": [
        "assets/sprites/weapons/w1_m9.png",
        "assets/sprites/weapons/w2_vipera.png",
        "assets/sprites/weapons/w3_soretes.png",
        "assets/sprites/weapons/w4_ak.png",
        "assets/sprites/weapons/w5_langszoro.png",
        "assets/sprites/weapons/w6_minigun.png",
        "assets/sprites/weapons/w7_rpg.png",
        "assets/sprites/weapons/w8_ion.png",
    ],
    "VFX (univerzalis)": [
        "assets/fx/blood_splatter_sheet.png",
        "assets/fx/wound_stump.png",
        "assets/fx/impact_spark.png",
        "assets/fx/muzzle_flash.png",
        "assets/fx/flame.png",
        "assets/fx/explosion_sheet.png",
        "assets/fx/rocket.png",
        "assets/fx/acid_spit.png",
    ],
    "UI": [
        "assets/ui/coin.png",
        "assets/ui/grenade.png",
    ],
}

NEEDS_ALPHA = ("zombies", "characters")


def check(path):
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):
        return "MISSING", None
    try:
        im = Image.open(full).convert("RGBA")
    except Exception as e:
        return "ERROR", str(e)
    a = im.split()[-1]
    lo, hi = a.getextrema()
    has_alpha = lo < 255
    return ("OK" if has_alpha else "NO_ALPHA"), im.size


def main():
    total = ok = missing = noalpha = 0
    for group, paths in EXPECTED.items():
        print(f"\n=== {group} ===")
        for p in paths:
            total += 1
            status, info = check(p)
            nm = os.path.basename(p)
            if status == "MISSING":
                missing += 1
                print(f"  [ ? ] {nm:28s} hianyzik")
            elif status == "ERROR":
                print(f"  [ X ] {nm:28s} olvasasi hiba: {info}")
            elif status == "NO_ALPHA":
                noalpha += 1
                critical = any(k in p for k in NEEDS_ALPHA)
                flag = "!! KRITIKUS" if critical else "(fx/ui: lehet ok)"
                print(f"  [ ! ] {nm:28s} {info}  NINCS valodi alfa  {flag}")
            else:
                ok += 1
                print(f"  [ + ] {nm:28s} {info}  alfa OK")

    print("\n" + "=" * 52)
    print(f"  Osszesen: {total}   Rendben: {ok}   Hianyzik: {missing}   Alfa-gond: {noalpha}")
    if noalpha:
        print("\n  Az 'alfa-gond' jeloltekre (kulonosen zombies/characters)")
        print("  futtass hatter-eltavolitast, kulonben a part-vagas hibas lesz!")
    if missing == 0 and noalpha == 0:
        print("\n  Minden asset kesz. Johet a measure_rig.py + cut_parts.py.")


if __name__ == "__main__":
    main()
