#!/usr/bin/env python3
"""
Zombi Kronika - VFX Sheet Slicer
-----------------------------------
Egy racs-elrendezesu VFX-lapot (pl. tobb verfroccsenes egy kepen) vag szet
egyedi, kulon hasznalhato darabokra, es legyart hozza egy manifest JSON-t,
amit a blood-fx.js be tud tolteni.

Hasznalat:
    python3 slice_vfx_sheet.py --input blood_splatter_sheet.png \
        --output-dir ../assets/fx --cols 3 --rows 2 --prefix splat

Ures (teljesen atlatszo) racscellak automatikusan kimaradnak, es minden
kivagott darab a tartalma korul szorosra van vagva (kis paddinggal), hogy
ne maradjon felesleges ures terulet korulotte.
"""

import argparse
import json
import os
from PIL import Image


def slice_sheet(input_path, output_dir, cols, rows, prefix, padding=4):
    os.makedirs(output_dir, exist_ok=True)
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    cell_w = w // cols
    cell_h = h // rows

    manifest = []
    idx = 1
    for r in range(rows):
        for c in range(cols):
            box = (c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h)
            cell = img.crop(box)
            alpha = cell.split()[-1]
            bbox = alpha.getbbox()
            if bbox is None:
                continue

            px0 = max(0, bbox[0] - padding)
            py0 = max(0, bbox[1] - padding)
            px1 = min(cell.width, bbox[2] + padding)
            py1 = min(cell.height, bbox[3] + padding)
            trimmed = cell.crop((px0, py0, px1, py1))

            fname = f"{prefix}_{idx:02d}.png"
            trimmed.save(os.path.join(output_dir, fname), optimize=True)
            manifest.append(fname)
            idx += 1

    manifest_path = os.path.join(output_dir, f"{prefix}_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({"files": manifest}, f, indent=2, ensure_ascii=False)

    print(f"Kesz: {len(manifest)} darab kivagva -> {manifest_path}")
    if len(manifest) == 0:
        print("FIGYELEM: egyetlen nem-ures cella sem talalhato. Ellenorizd a")
        print("--cols/--rows erteket, vagy hogy a kep tenyleg racsban van-e.")
    return manifest_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Forras VFX-lap PNG")
    parser.add_argument("--output-dir", required=True, help="Kimeneti mappa")
    parser.add_argument("--cols", type=int, default=3, help="Racs oszlopok szama")
    parser.add_argument("--rows", type=int, default=2, help="Racs sorok szama")
    parser.add_argument("--prefix", default="splat", help="Kimeneti fajlnev-elotag")
    parser.add_argument("--padding", type=int, default=4, help="Padding px a vagas korul")
    args = parser.parse_args()

    slice_sheet(
        args.input,
        args.output_dir,
        args.cols,
        args.rows,
        args.prefix,
        args.padding,
    )
