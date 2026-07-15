#!/usr/bin/env python3
"""
cut_parts.py — Runner (Iramodó)
Az egy állóképet (runner_raw.png) maszkol 5 részre a kimért határok
alapján. Minden part TELJES-VÁSZON (1024x1024) PNG, csak a saját régiója
látszik -> tökéletes illeszkedés a rig-ben (ahogy a Kóbornál).

Hasznalat:
    python cut_parts.py            # runner_raw.png -> head/torso/arm_front/leg_back/leg_front .png
"""

import os
from PIL import Image
import numpy as np

SRC = "runner_raw.png"
OUT_DIR = "."
ALPHA_THRESHOLD = 40

# A runner_raw.png tartalom-elemzeseből kimert hatarok (BALRA nezo futo poz):
CUT_RULES = {
    "head":      lambda x, y: y < 210,
    "arm_front": lambda x, y: (350 <= y <= 495) and (x < 430 - (y - 350) * 0.30),
    "torso":     lambda x, y: (195 <= y < 600),
    "leg_back":  lambda x, y: (y >= 575) and (x < 502),
    "leg_front": lambda x, y: (y >= 575) and (x >= 502),
}

# Rajzolasi/prioritasi sorrend: ha egy pixel tobb szabalyra is illik,
# az elobb szereplo nyer (kar > lab > torso a felso testnel).
PRIORITY = ["head", "arm_front", "leg_back", "leg_front", "torso"]


def main():
    if not os.path.exists(SRC):
        print(f"HIBA: {SRC} nem talalhato ebben a mappaban.")
        return

    im = Image.open(SRC).convert("RGBA")
    arr = np.array(im)
    alpha = arr[:, :, 3]
    h, w = alpha.shape
    solid = alpha > ALPHA_THRESHOLD

    # minden parthoz egy ures (atlatszo) 1024x1024 vaszon
    parts = {name: np.zeros_like(arr) for name in CUT_RULES}

    ys, xs = np.where(solid)
    for y, x in zip(ys.tolist(), xs.tolist()):
        for name in PRIORITY:
            if name in CUT_RULES and CUT_RULES[name](x, y):
                parts[name][y, x] = arr[y, x]
                break

    for name, pdata in parts.items():
        out = Image.fromarray(pdata, "RGBA")
        path = os.path.join(OUT_DIR, f"{name}.png")
        out.save(path, optimize=True)
        bbox = out.split()[-1].getbbox()
        print(f"{name}.png  bbox={bbox}")

    print("\nKesz. 5 part kivagva. Ellenorizd vizualisan a rig-demo.html-ben.")


if __name__ == "__main__":
    main()
