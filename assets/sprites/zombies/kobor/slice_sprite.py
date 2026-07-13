#!/usr/bin/env python3
"""
Zombi Kronika - Sprite Slicer (gyors prototipus valtozat)
-----------------------------------------------------------
Egyetlen, allo, oldalnezeti AI-generalt karakterkepbol (pl. a joviahagyott
Kobor etalon) elovagja a "torzs" es a "lab" reszt egy csipo-vonal menten,
es elokesziti oket a sprite-rig.js motorhoz.

FONTOS - oszinte korlat: ez NEM valodi anatomiai szegmentalas. A csipo
felett mindent (fej, torzs, karok) egyben "body"-kent kezel - a karok
ebben a gyors valtozatban NEM lengenek kulon. A lab reszt egyszer vagja
ki, es UGYANAZT hasznalja both front es back leg-kent (ez elterjedt,
elfogadott trukk kis/kozepes meretu sprite-oknal - jatek kozben alig
eszreveheto).

Ha valodi kar-lengetes is kell, azt celszerubb kulon AI-generalassal
megoldani (lasd a fo dokumentacio 14.2 pontjat - "Opcio A"), nem ebbol
a scriptbol.

Hasznalat:
    python3 slice_sprite.py --input kobor.png --hip-y 300 \
        --output-dir ./kobor_parts --hip-x 100 --shoulder-x 100 --shoulder-y 120

A --hip-y erteket vizualisan kell megbecsulni (hol van a csipo a kepen,
pixelben, felulrol szamolva). Ha nem biztos benne, forduljon
Claude-hoz egy screenshot-tal, es megbecsuljuk egyutt.
"""

import argparse
import json
import os
from PIL import Image


def slice_sprite(input_path, output_dir, hip_y, hip_x, shoulder_x, shoulder_y):
    os.makedirs(output_dir, exist_ok=True)
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size

    if hip_y <= 0 or hip_y >= h:
        raise ValueError(f"hip_y ({hip_y}) kivul esik a kep magassagan (0-{h})")

    body = img.crop((0, 0, w, hip_y))
    leg = img.crop((0, hip_y, w, h))

    body_path = os.path.join(output_dir, "body.png")
    leg_path = os.path.join(output_dir, "leg.png")
    body.save(body_path, optimize=True)
    leg.save(leg_path, optimize=True)

    config = {
        "id": os.path.splitext(os.path.basename(input_path))[0],
        "anchor": {"x": w / 2, "y": h},
        "pivots": {
            "hip": {"x": hip_x, "y": hip_y},
            "shoulder": {"x": shoulder_x, "y": shoulder_y},
        },
        "parts": {
            "body": {
                "src": "body.png",
                "x": 0,
                "y": 0,
                "width": w,
                "height": hip_y,
                "pivotRef": None,
            },
            "frontLeg": {
                "src": "leg.png",
                "x": 0,
                "y": hip_y,
                "width": w,
                "height": h - hip_y,
                "pivotRef": "hip",
            },
            "backLeg": {
                "src": "leg.png",
                "x": 0,
                "y": hip_y,
                "width": w,
                "height": h - hip_y,
                "pivotRef": "hip",
            },
        },
        "animations": {
            "idle": {"type": "bob", "amplitude": 3, "speed": 1.6},
            # Alapertelmezes: "lurch" (merev zombi-vonszolas). A regi "cutoutWalk"
            # ket, egymassal ellentetesen forgatott teljes-alsotest kivagast rajzolt,
            # ami setanal duplazodo/szellemkep labat okozott (a leg.png nem izolalt
            # egy-lab, hanem a teljes alsotest). A lurch az egesz testet egyben
            # ringatja -> nincs duplazodas.
            "walk": {
                "type": "lurch",
                "speed": 3.2,
                "rockDeg": 4,
                "bobAmplitude": 5,
                "swayX": 3,
            },
            "hurt": {
                "type": "knockback",
                "duration": 0.45,
                "shakeAmplitude": 6,
                "next": "idle",
            },
            "death": {"type": "fall", "duration": 0.8, "rotationDeg": 82},
        },
    }

    config_path = os.path.join(output_dir, f"{config['id']}_rig.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    print(f"Kesz. Fajlok: {body_path}, {leg_path}, {config_path}")
    print("FIGYELEM: a kar egyelore a body reszhez van rogzitve (nem leng).")
    print("Ha kar-animaciot is akarsz, generalj kulon kar-asset-et (14.2 pont).")
    return config_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Forras PNG (pl. kobor.png)")
    parser.add_argument("--output-dir", required=True, help="Kimeneti mappa")
    parser.add_argument("--hip-y", type=int, required=True, help="Csipo Y koordinata pixelben")
    parser.add_argument("--hip-x", type=int, required=True, help="Csipo X koordinata pixelben")
    parser.add_argument("--shoulder-x", type=int, required=True, help="Vall X koordinata pixelben")
    parser.add_argument("--shoulder-y", type=int, required=True, help="Vall Y koordinata pixelben")
    args = parser.parse_args()

    slice_sprite(
        args.input,
        args.output_dir,
        args.hip_y,
        args.hip_x,
        args.shoulder_x,
        args.shoulder_y,
    )
