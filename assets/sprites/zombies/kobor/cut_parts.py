#!/usr/bin/env python3
"""
Zombi Kronika - Kobor part-vago (rig-hez), v2 - kulon karral
-------------------------------------------------------------
A jovahagyott, tiszta atlatszoju kobor_raw.png-t 5 kulon testreszre vagja:
fej, torzs, elolso kar (kulon leng + leszakad), bal lab, jobb lab.

A kar egy kis RESsel el van tartva a torzstol (nem fedi), ezert tisztan
kivaghato es mogotte nem marad lyuk. Minden part TELJES-vaszon (1024x1024)
PNG, csak a sajat regioja lathato -> tokeletes illeszkedes.
"""
from PIL import Image
import os

SRC = "kobor_raw.png"
OUT = "parts_rig"

HEAD_B  = 238
TORSO_T = 222
TORSO_B = 658
LEG_T   = 606
SPLIT   = 497

# A kar a jobb oldali, elore logo tomeg. A valaszto-vonal lefele kicsit jobbra
# tolodik (a kar kifele lendul). y ~400..648 kozott, x >= arm_split(y).
def arm_split(y):
    return 546 + (y - 400) * 0.16
def is_arm(x, y):
    return 400 <= y <= 648 and x >= arm_split(y)

def make(pred, name):
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    cnt = 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 0 and pred(x, y):
                op[x, y] = px[x, y]
                cnt += 1
    os.makedirs(OUT, exist_ok=True)
    out.save(os.path.join(OUT, name + ".png"), optimize=True)
    bb = out.split()[-1].getbbox()
    print(f"{name:10} pixels={cnt:7d}  bbox={bb}")

make(lambda x, y: y < HEAD_B,                                        "head")
make(is_arm,                                                        "arm_front")
make(lambda x, y: TORSO_T <= y < TORSO_B and not is_arm(x, y),      "torso")
make(lambda x, y: y >= LEG_T and x <  SPLIT,                        "leg_left")
make(lambda x, y: y >= LEG_T and x >= SPLIT and not is_arm(x, y),   "leg_right")
print("Kesz -> parts_rig/")
