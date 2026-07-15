#!/usr/bin/env python3
"""
rig_batch.py — mind az entitasra lefuttatja a measure_rig + cut_parts lancot,
es keszit EGY kontakt-lapot az osszes elonezetbol (gyors, egyben ranezos QA).

Hasznalat (projekt gyokerbol):
    python tools/rig_batch.py
    python tools/rig_batch.py --sheet-only     # csak a kontakt-lap ujraepitese
"""
import argparse
import os
import subprocess
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(ROOT, "tools")

# (csoport, nev, facing)  -- a facing elso tipp; a kontakt-lapon ellenorizzuk
ENTITIES = [
    # kobor: KEZZEL hangolt vagas (cut_parts.py a kobor mappaban) -> NE irjuk felul!
    ("zombies", "runner", "right"),
    ("zombies", "crawler", "right"),
    ("zombies", "spitter", "right"),
    ("zombies", "bloater", "right"),
    ("zombies", "brute", "right"),
    ("zombies", "boss", "right"),
    ("characters", "farkas", "right"),
    ("characters", "szellem", "right"),
    ("characters", "angyal", "right"),
    ("characters", "medve", "right"),
    ("characters", "szikra", "right"),
]


def run(grp, name, facing):
    d = os.path.join(ROOT, "assets", "sprites", grp, name)
    raw = os.path.join(d, f"{name}_raw.png")
    if not os.path.exists(raw):
        return f"{name}: nincs raw"
    out = os.path.join(d, "parts_rig")
    r1 = subprocess.run([sys.executable, os.path.join(TOOLS, "measure_rig.py"),
                         "--input", raw, "--name", name, "--facing", facing,
                         "--out-dir", d], capture_output=True, text=True)
    r2 = subprocess.run([sys.executable, os.path.join(TOOLS, "cut_parts.py"),
                         "--cuts", os.path.join(d, f"{name}_cuts.json"),
                         "--input", raw, "--out-dir", out], capture_output=True, text=True)
    warn = "BECSULT-CSIPO" if "Nem talaltam tiszta lab-rest" in r1.stdout else ""
    return f"{name}: ok {warn}" + (f" | HIBA: {r2.stderr.strip()[:60]}" if r2.returncode else "")


def sheet():
    cols, cell = 4, 260
    rows = (len(ENTITIES) + cols - 1) // cols
    sh = Image.new("RGB", (cols * cell, rows * (cell + 18)), (12, 12, 16))
    dr = ImageDraw.Draw(sh)
    for i, (grp, name, _f) in enumerate(ENTITIES):
        p = os.path.join(ROOT, "assets", "sprites", grp, name, "parts_rig", f"{name}_preview.png")
        cx, cy = (i % cols) * cell, (i // cols) * (cell + 18)
        if os.path.exists(p):
            im = Image.open(p).convert("RGB").resize((cell - 8, cell - 8))
            sh.paste(im, (cx + 4, cy + 16))
        dr.text((cx + 6, cy + 3), name, fill=(230, 230, 240))
    out = os.path.join(ROOT, "assets", "sprites", "_rig_contact_sheet.png")
    sh.save(out)
    print("Kontakt-lap:", out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet-only", action="store_true")
    a = ap.parse_args()
    if not a.sheet_only:
        for grp, name, facing in ENTITIES:
            print(" ", run(grp, name, facing))
    sheet()
