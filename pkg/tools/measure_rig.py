#!/usr/bin/env python3
"""
measure_rig.py — automata anatomia-mero
========================================
Egy hatter nelkuli, oldalnezeti karakter/zombi kepbol (1024x1024, valodi alfa)
KIMERI a vagasi hatarokat es a rig-config kezdoerteket, majd kiirja:
  - <nev>_cuts.json   (a cut_parts.py ehhez igazodik)
  - <nev>_rig.txt     (a RIGS bejegyzes, masolhato a js/part_rig.js-be)

NEM talalgat: a valodi alfa-tartalom elemzesebol dolgozik (sziluett-szelesseg
profil, szukuletek keresese, res-detektalas a labak kozott).

Az eredmenyt MINDIG ellenorizd vizualisan (a cut_parts.py preview kepevel),
mert a poz/testalkat egyedi lehet — a script egy JO KIINDULOPONTOT ad, nem
tokeletes vegeredmenyt.

Hasznalat:
    python measure_rig.py --input runner_raw.png --name runner
    python measure_rig.py --input brute_raw.png --name brute --facing left
"""

import argparse
import json
import os
import numpy as np
from PIL import Image

ALPHA_T = 40


def rows_profile(mask):
    """Soronkent: (min_x, max_x, szelesseg, pixelszam)"""
    h, w = mask.shape
    prof = {}
    for y in range(h):
        xs = np.where(mask[y])[0]
        if len(xs):
            prof[y] = (int(xs.min()), int(xs.max()), int(xs.max() - xs.min()), len(xs))
    return prof


def find_gaps(mask, y, min_gap=15):
    """Egy sorban a vizszintes resek (pl. ket lab kozott)"""
    xs = np.where(mask[y])[0]
    if len(xs) == 0:
        return []
    gaps = []
    prev = xs[0]
    for x in xs[1:]:
        if x - prev > min_gap:
            gaps.append((int(prev), int(x)))
        prev = x
    return gaps


def measure(path, name, facing):
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    alpha = arr[:, :, 3]
    h, w = alpha.shape
    mask = alpha > ALPHA_T

    if alpha.min() == 255:
        print("!! FIGYELEM: NINCS valodi atlatszosag (alfa mindenhol 255).")
        print("   A kep hatterrel egyben van -> a vagas HASZNALHATATLAN lesz.")
        print("   Futtass rajta hatter-eltavolitast eloszor!\n")

    prof = rows_profile(mask)
    if not prof:
        raise SystemExit("Ures kep (nincs tartalom).")

    ys = sorted(prof.keys())
    top, bottom = ys[0], ys[-1]
    content_h = bottom - top

    # --- NYAK: a fej alatti legszukebb pont a felso 30%-ban ---
    head_zone = [y for y in ys if y < top + content_h * 0.32]
    neck_y = None
    if len(head_zone) > 10:
        # keressuk a legkisebb szelessegu sort, majd az ez utani elso jelentos szelesedest
        widths = [(y, prof[y][2]) for y in head_zone]
        # az elso 15%-ot (fej teteje) kihagyjuk
        skip = int(len(widths) * 0.25)
        cand = widths[skip:]
        if cand:
            neck_y = min(cand, key=lambda t: t[1])[0]
    if neck_y is None:
        neck_y = top + int(content_h * 0.20)

    # a fej-vagas a nyak alatt par px-el (hogy a nyak a fejjel maradjon)
    head_cut = neck_y + 8

    # --- CSIPO: ALULROL FELFELE keressuk, ahol a ket lab osszeer ---
    # (Felulrol lefele hibas volt: a kar-torzs rest hitte lab-resnek.)
    # A labak lent szetvalnak; felfele haladva valahol osszeernek -> az a csipo.
    def has_leg_gap(y):
        gaps = find_gaps(mask, y, min_gap=12)
        if not gaps:
            return False
        # csak a "kozponti" reseket fogadjuk el (a sziluett kozepso 60%-aban),
        # igy a szelso kar-res nem zavar be
        x0, x1 = prof[y][0], prof[y][1]
        span = x1 - x0
        if span <= 0:
            return False
        for g in gaps:
            mid = (g[0] + g[1]) / 2
            rel = (mid - x0) / span
            if 0.20 <= rel <= 0.80:
                return True
        return False

    hip_y = None
    floor_limit = top + int(content_h * 0.35)  # a csipo biztosan nem lehet feljebb
    no_gap_run = 0
    for y in range(bottom - 5, floor_limit, -1):
        if y not in prof:
            continue
        if has_leg_gap(y):
            no_gap_run = 0
        else:
            no_gap_run += 1
            if no_gap_run >= 12:      # 12 egymast koveto sor res nelkul = osszeertek
                hip_y = y + no_gap_run
                break
    if hip_y is None:
        hip_y = top + int(content_h * 0.58)
        print("!! Nem talaltam tiszta lab-rest -> becsult csipo. Ellenorizd vizualisan!")

    # --- CSIPO X: a res kozepe a csipo-vonalon ---
    gaps_at_hip = find_gaps(mask, min(hip_y + 10, bottom), 12)
    if gaps_at_hip:
        g = max(gaps_at_hip, key=lambda t: t[1] - t[0])
        hip_x = (g[0] + g[1]) // 2
    else:
        hip_x = (prof[hip_y][0] + prof[hip_y][1]) // 2

    # --- VALL: a fej-vagas alatt, a torzs felso reszen ---
    # (A "legszelesebb sor" hibas volt: a kinyujtott karokat talalta meg.)
    # Anatomiai aranyt hasznalunk: a vall a fej alatt ~16%-nyira van.
    shoulder_y = head_cut + int(content_h * 0.16)
    shoulder_y = min(shoulder_y, hip_y - 60)  # ne csuszhasson a csipo ala

    # --- ANCHOR: talp ---
    anchor_x = hip_x
    anchor_y = bottom

    # --- FEJ centroid ---
    def centroid_region(y0, y1, xfilt=None):
        pts = []
        for y in range(max(y0, top), min(y1, bottom + 1)):
            xs = np.where(mask[y])[0]
            if xfilt is not None:
                xs = np.array([x for x in xs if xfilt(x, y)])
            for x in xs:
                pts.append((x, y))
        if not pts:
            return None
        a = np.array(pts)
        return int(a[:, 0].mean()), int(a[:, 1].mean())

    c_head = centroid_region(top, head_cut) or (hip_x, top + 40)
    c_torso = centroid_region(head_cut, hip_y) or (hip_x, (head_cut + hip_y) // 2)
    c_legL = centroid_region(hip_y, bottom, lambda x, y: x < hip_x) or (hip_x - 60, (hip_y + bottom) // 2)
    c_legR = centroid_region(hip_y, bottom, lambda x, y: x >= hip_x) or (hip_x + 60, (hip_y + bottom) // 2)

    # kar sav becsles (a vall es a csipo kozott)
    arm_y0 = shoulder_y + 10
    arm_y1 = hip_y - 20
    if arm_y1 <= arm_y0 + 20:            # biztonsag: sose legyen ures/forditott sav
        arm_y1 = min(arm_y0 + 120, bottom - 10)
    rows_in = [y for y in range(arm_y0, arm_y1) if y in prof]
    if not rows_in:
        arm_y0 = head_cut + 20
        arm_y1 = min(arm_y0 + 120, bottom - 10)
        rows_in = [y for y in range(arm_y0, arm_y1) if y in prof]
    if facing == "right":
        # jobbra nezo: az elulso kar a jobb oldalon lóg
        arm_edge_x = int(np.percentile([prof[y][1] for y in rows_in], 75))
        arm_rule = f"(x > {arm_edge_x} - (y - {arm_y0}) * 0.20)"
        c_arm = centroid_region(arm_y0, arm_y1, lambda x, y: x > arm_edge_x - (y - arm_y0) * 0.20)
    else:
        arm_edge_x = int(np.percentile([prof[y][0] for y in rows_in], 25))
        arm_rule = f"(x < {arm_edge_x} + (y - {arm_y0}) * 0.20)"
        c_arm = centroid_region(arm_y0, arm_y1, lambda x, y: x < arm_edge_x + (y - arm_y0) * 0.20)
    c_arm = c_arm or (arm_edge_x, (arm_y0 + arm_y1) // 2)

    cuts = {
        "name": name,
        "facing": facing,
        "image_size": [w, h],
        "measured": {
            "head_top_y": top,
            "feet_bottom_y": bottom,
            "neck_y": neck_y,
            "head_cut_y": head_cut,
            "shoulder_y": shoulder_y,
            "hip_y": hip_y,
            "hip_x": hip_x,
            "content_h": content_h,
        },
        "cut_rules": {
            "head": {"type": "above", "y": head_cut},
            "arm_front": {"type": "diagonal", "y0": arm_y0, "y1": arm_y1,
                          "edge_x": arm_edge_x, "slope": 0.20, "side": facing},
            "torso": {"type": "band", "y0": head_cut - 15, "y1": hip_y + 25},
            "leg_back": {"type": "below_side", "y": hip_y, "x": hip_x, "side": "left"},
            "leg_front": {"type": "below_side", "y": hip_y, "x": hip_x, "side": "right"},
        },
        "rig": {
            "anchor": {"x": anchor_x, "y": anchor_y},
            "contentH": content_h,
            "pivots": {
                "neck": {"x": c_head[0], "y": head_cut},
                "shoulder": {"x": c_arm[0], "y": shoulder_y},
                "hipB": {"x": hip_x - 35, "y": hip_y + 8},
                "hipF": {"x": hip_x + 35, "y": hip_y + 8},
            },
            "cent": {
                "head": {"x": c_head[0], "y": c_head[1]},
                "torso": {"x": c_torso[0], "y": c_torso[1]},
                "arm_front": {"x": c_arm[0], "y": c_arm[1]},
                "leg_back": {"x": c_legL[0], "y": c_legL[1]},
                "leg_front": {"x": c_legR[0], "y": c_legR[1]},
            },
            "order": ["leg_back", "torso", "head", "leg_front", "arm_front"],
        },
    }
    return cuts


def write_outputs(cuts, out_dir):
    name = cuts["name"]
    os.makedirs(out_dir, exist_ok=True)
    jp = os.path.join(out_dir, f"{name}_cuts.json")
    with open(jp, "w", encoding="utf-8") as f:
        json.dump(cuts, f, indent=2, ensure_ascii=False)

    r = cuts["rig"]
    js = f"""  {name}: {{
    src: 'assets/sprites/zombies/{name}/',
    parts: ['head','torso','arm_front','leg_back','leg_front'],
    anchor:   {{ x:{r['anchor']['x']}, y:{r['anchor']['y']} }},
    contentH: {r['contentH']},
    height:   46,
    pivots: {{
      neck:     {{ x:{r['pivots']['neck']['x']}, y:{r['pivots']['neck']['y']} }},
      shoulder: {{ x:{r['pivots']['shoulder']['x']}, y:{r['pivots']['shoulder']['y']} }},
      hipB:     {{ x:{r['pivots']['hipB']['x']}, y:{r['pivots']['hipB']['y']} }},
      hipF:     {{ x:{r['pivots']['hipF']['x']}, y:{r['pivots']['hipF']['y']} }},
    }},
    cent: {{
      head:      {{ x:{r['cent']['head']['x']}, y:{r['cent']['head']['y']} }},
      torso:     {{ x:{r['cent']['torso']['x']}, y:{r['cent']['torso']['y']} }},
      arm_front: {{ x:{r['cent']['arm_front']['x']}, y:{r['cent']['arm_front']['y']} }},
      leg_back:  {{ x:{r['cent']['leg_back']['x']}, y:{r['cent']['leg_back']['y']} }},
      leg_front: {{ x:{r['cent']['leg_front']['x']}, y:{r['cent']['leg_front']['y']} }},
    }},
    order: ['leg_back','torso','head','leg_front','arm_front'],
    legSwing: 10, armSwing: 5, cadence: 2.0,
  }},
"""
    tp = os.path.join(out_dir, f"{name}_rig.txt")
    with open(tp, "w", encoding="utf-8") as f:
        f.write(js)
    return jp, tp


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--facing", default="right", choices=["right", "left"])
    ap.add_argument("--out-dir", default=".")
    a = ap.parse_args()

    cuts = measure(a.input, a.name, a.facing)
    m = cuts["measured"]
    print(f"=== {a.name} kimerve ===")
    print(f"  fej teto y   : {m['head_top_y']}")
    print(f"  nyak y       : {m['neck_y']}  -> fej-vagas: {m['head_cut_y']}")
    print(f"  vall y       : {m['shoulder_y']}")
    print(f"  csipo        : x={m['hip_x']} y={m['hip_y']}")
    print(f"  talp y       : {m['feet_bottom_y']}")
    print(f"  contentH     : {m['content_h']}")
    jp, tp = write_outputs(cuts, a.out_dir)
    print(f"\nKiirva: {jp}\n        {tp}")
    print("\nKovetkezo: python cut_parts.py --cuts " + os.path.basename(jp))
