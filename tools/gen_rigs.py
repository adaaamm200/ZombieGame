#!/usr/bin/env python3
"""
gen_rigs.py — RIGS bejegyzesek generalasa a js/part_rig.js-hez
==============================================================
A measure_rig.py altal kiirt <nev>_cuts.json-okbol elkesziti a motor
SZEREP-ALAPU (role) RIGS bejegyzeseit.

A motor belso szerepei:  head, torso, armF, legB, legF
Igy mindegy, hogy a part-fajlok neve leg_left/leg_right (kezzel vagott Kobor)
vagy leg_back/leg_front (generikus vago) — a rig maga mondja meg, melyik
fajl melyik szerep.

Hasznalat:  python tools/gen_rigs.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (jatekbeli enemy-type, csoport, asset-nev, render-magassag)
# A magassag a js/const.js ZOMBIES def.h-jahoz igazodik (lasd enemy_sprites CFG).
ENTS = [
    ("runner",  "zombies", "runner",  44),
    ("spitter", "zombies", "spitter", 48),
    ("bloater", "zombies", "bloater", 54),
    ("brute",   "zombies", "brute",   62),
    ("boss",    "zombies", "boss",    86),
]


def entry(type_, grp, name, height):
    p = os.path.join(ROOT, "assets", "sprites", grp, name, f"{name}_cuts.json")
    with open(p, encoding="utf-8") as f:
        c = json.load(f)
    r, m = c["rig"], c["measured"]
    a, pv, ce = r["anchor"], r["pivots"], r["cent"]
    return f"""    {type_}: {{
      base: 'assets/sprites/{grp}/{name}/parts_rig/',
      files: {{ head:'head', torso:'torso', armF:'arm_front', legB:'leg_back', legF:'leg_front' }},
      anchor: {{ x:{a['x']}, y:{a['y']} }},
      contentH: {r['contentH']},
      height: {height},
      pivots: {{
        neck:     {{ x:{pv['neck']['x']}, y:{pv['neck']['y']} }},
        shoulder: {{ x:{pv['shoulder']['x']}, y:{pv['shoulder']['y']} }},
        hipB:     {{ x:{pv['hipB']['x']}, y:{pv['hipB']['y']} }},
        hipF:     {{ x:{pv['hipF']['x']}, y:{pv['hipF']['y']} }},
      }},
      cent: {{
        head:  {{ x:{ce['head']['x']}, y:{ce['head']['y']} }},
        torso: {{ x:{ce['torso']['x']}, y:{ce['torso']['y']} }},
        armF:  {{ x:{ce['arm_front']['x']}, y:{ce['arm_front']['y']} }},
        legB:  {{ x:{ce['leg_back']['x']}, y:{ce['leg_back']['y']} }},
        legF:  {{ x:{ce['leg_front']['x']}, y:{ce['leg_front']['y']} }},
      }},
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      tune: {{ legSwing: 10, armSwing: 5, cadence: 2.0 }},
      _img: {{}}, _mask: {{}}, _ok: false, _left: 0,
    }},"""


if __name__ == "__main__":
    for t, g, n, h in ENTS:
        print(entry(t, g, n, h))
