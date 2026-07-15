#!/usr/bin/env python3
"""
cut_parts.py — generikus part-vago (JSON hatarok alapjan)
==========================================================
A measure_rig.py altal kiirt <nev>_cuts.json hatarai szerint 5 reszre
vagja a raw kepet, es keszit egy SZINKODOLT ELONEZETET is, amivel egy
pillantassal ellenorizheto, hogy jo-e a vagas.

Minden part TELJES-VASZON (1024x1024) PNG, csak a sajat regioja latszik
-> tokeletes illeszkedes a rig-ben.

Hasznalat:
    python cut_parts.py --cuts runner_cuts.json --input runner_raw.png

Ha a vagas nem jo: nyisd meg a <nev>_cuts.json-t, allitsd at a szamokat
(head.y / hip_y / arm edge_x stb.), es futtasd ujra. Nem kell ujragenerani
a kepet!
"""

import argparse
import json
import os
import numpy as np
from PIL import Image

ALPHA_T = 40
COLORS = {
    "head": (255, 80, 80),
    "arm_front": (80, 200, 255),
    "torso": (80, 255, 120),
    "leg_back": (255, 220, 60),
    "leg_front": (200, 120, 255),
}
PRIORITY = ["head", "arm_front", "leg_back", "leg_front", "torso"]


def build_predicates(cuts):
    r = cuts["cut_rules"]
    preds = {}

    hc = r["head"]["y"]
    preds["head"] = lambda x, y: y < hc

    a = r["arm_front"]
    if a["side"] == "right":
        preds["arm_front"] = lambda x, y: (a["y0"] <= y <= a["y1"]) and (
            x > a["edge_x"] - (y - a["y0"]) * a["slope"])
    else:
        preds["arm_front"] = lambda x, y: (a["y0"] <= y <= a["y1"]) and (
            x < a["edge_x"] + (y - a["y0"]) * a["slope"])

    t = r["torso"]
    preds["torso"] = lambda x, y: t["y0"] <= y < t["y1"]

    lb = r["leg_back"]
    preds["leg_back"] = lambda x, y: (y >= lb["y"]) and (x < lb["x"])
    lf = r["leg_front"]
    preds["leg_front"] = lambda x, y: (y >= lf["y"]) and (x >= lf["x"])
    return preds


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--cuts", required=True, help="<nev>_cuts.json")
    ap.add_argument("--input", help="raw png (ha nem adod meg: <nev>_raw.png)")
    ap.add_argument("--out-dir", default=".")
    args = ap.parse_args()

    with open(args.cuts, encoding="utf-8") as f:
        cuts = json.load(f)
    name = cuts["name"]
    src = args.input or f"{name}_raw.png"
    if not os.path.exists(src):
        raise SystemExit(f"HIBA: {src} nem talalhato.")

    im = Image.open(src).convert("RGBA")
    arr = np.array(im)
    alpha = arr[:, :, 3]
    solid = alpha > ALPHA_T

    if alpha.min() == 255:
        print("!! FIGYELEM: nincs valodi atlatszosag -> a vagas hibas lesz.")
        print("   Futtass hatter-eltavolitast a kepen eloszor!")

    preds = build_predicates(cuts)
    parts = {n: np.zeros_like(arr) for n in preds}

    ys, xs = np.where(solid)
    for y, x in zip(ys.tolist(), xs.tolist()):
        for n in PRIORITY:
            if preds[n](x, y):
                parts[n][y, x] = arr[y, x]
                break

    os.makedirs(args.out_dir, exist_ok=True)
    counts = {}
    for n, data in parts.items():
        out = Image.fromarray(data, "RGBA")
        out.save(os.path.join(args.out_dir, f"{n}.png"), optimize=True)
        bbox = out.split()[-1].getbbox()
        px = int((data[:, :, 3] > ALPHA_T).sum())
        counts[n] = px
        print(f"  {n:10s} bbox={bbox} pixels={px}")

    # --- ELONEZET ---
    base = Image.new("RGBA", im.size, (18, 18, 24, 255))
    for n in ["head", "arm_front", "torso", "leg_back", "leg_front"]:
        d = parts[n]
        tint = np.zeros_like(d)
        c = COLORS[n]
        tint[:, :, 0] = c[0]
        tint[:, :, 1] = c[1]
        tint[:, :, 2] = c[2]
        tint[:, :, 3] = (d[:, :, 3] * 0.85).astype("uint8")
        base = Image.alpha_composite(base, Image.fromarray(tint, "RGBA"))
    pv = os.path.join(args.out_dir, f"{name}_preview.png")
    base.convert("RGB").resize((512, 512)).save(pv)

    print(f"\nELONEZET: {pv}")
    print("  piros=fej  kek=elulso kar  zold=torzs  sarga=hatso lab  lila=elulso lab")
    empty = [n for n, c in counts.items() if c < 500]
    if empty:
        print(f"\n!! URES/ICIPICI PART: {', '.join(empty)}")
        print("   Allitsd at a hatarokat a {}-ban es futtasd ujra.".format(os.path.basename(args.cuts)))
    else:
        print("\nOK — mind az 5 part tartalmaz pixelt. Ellenorizd az elonezetet vizualisan!")


if __name__ == "__main__":
    main()
