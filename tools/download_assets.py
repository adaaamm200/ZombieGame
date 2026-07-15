#!/usr/bin/env python3
"""
download_assets.py — MINDEN vegleges asset letoltese a helyere
================================================================
Ezt a scriptet a projekt gyokerebol futtasd (ahol az assets/ mappa van).
Letolt minden joviahagyott Higgsfield generalast a megfelelo mappaba,
a megfelelo nevvel. A selejt/felulirt verziokat NEM tolti le.

FONTOS: a chat-sandboxbol nem elerhetok ezek az URL-ek, de a TE geped-
rol igen. Ezert ezt Claude Code-dal vagy sajat kezuleg futtasd.

Hasznalat:
    python download_assets.py
    python download_assets.py --dry-run     # csak kiirja, mit tenne
"""

import argparse
import os
import sys
import urllib.request

CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3F8P7uvSmv6Fphn63V6qs1xRmHX/"

# (fajl_a_CDN-en, cel_utvonal_a_projektben)
ASSETS = [
    # ---------- ZOMBIK (part-rig, mind hatter nelkuli / alfa OK) ----------
    ("hf_20260713_082139_4b0f0177-6c79-4578-b67b-393d7e438247.png",
     "assets/sprites/zombies/kobor/kobor_raw.png"),
    ("hf_20260713_152823_e109f645-0eff-4e69-92a9-93527ac1b1bc.png",
     "assets/sprites/zombies/runner/runner_raw.png"),
    ("hf_20260715_090243_3ed58cea-c35d-4311-bb0c-841e451e08d2.png",
     "assets/sprites/zombies/crawler/crawler_raw.png"),
    ("hf_20260713_154549_8b02ff6d-7a31-4522-8457-ca4ea5c0c5da.png",
     "assets/sprites/zombies/spitter/spitter_raw.png"),
    ("hf_20260713_154559_1500a0f8-1ffd-4b77-89bb-cf01cd2aca2e.png",
     "assets/sprites/zombies/bloater/bloater_raw.png"),
    ("hf_20260715_085654_d97a1fc8-1eec-48ba-b59c-6bb1aa335ae9.png",
     "assets/sprites/zombies/brute/brute_raw.png"),
    ("hf_20260715_085924_a335d282-a658-427d-b39b-ce46a36ee057.png",
     "assets/sprites/zombies/boss/boss_raw.png"),

    # ---------- KARAKTEREK (fegyver NELKUL, hogy barmelyik fegyver mehessen) ----------
    ("hf_20260715_085458_0e2ce232-5af7-46cf-bb2d-84f8465878b7.png",
     "assets/sprites/characters/farkas/farkas_raw.png"),
    ("hf_20260715_085507_f359aa6e-4860-40cc-bba3-887ef41cc610.png",
     "assets/sprites/characters/szellem/szellem_raw.png"),
    ("hf_20260715_085515_d3b06937-092b-4e3e-9e60-9f9596aaabeb.png",
     "assets/sprites/characters/angyal/angyal_raw.png"),
    ("hf_20260715_085523_42f0a1aa-5ba3-438d-840c-fe389eae69a7.png",
     "assets/sprites/characters/medve/medve_raw.png"),
    ("hf_20260715_085532_ef9bda6e-7d7b-443e-8853-3b18165adf4a.png",
     "assets/sprites/characters/szikra/szikra_raw.png"),

    # ---------- FEGYVEREK (const.js sorrend) ----------
    ("hf_20260713_155052_7e3ae7dc-cfab-4ac5-bec2-af2eae66fc33.png",
     "assets/sprites/weapons/w1_m9.png"),
    ("hf_20260713_155102_4a81e82e-f058-437d-a3b8-c93dbe3f4bf8.png",
     "assets/sprites/weapons/w2_vipera.png"),
    ("hf_20260713_155111_572a4cbf-58d4-4fcb-8c28-ef998f9ee90a.png",
     "assets/sprites/weapons/w3_soretes.png"),
    ("hf_20260713_155119_fce7ba08-69b4-455b-8d3e-0dffe796ff52.png",
     "assets/sprites/weapons/w4_ak.png"),
    ("hf_20260715_083639_9229b7d4-9d9e-4347-a153-d09b71056eb1.png",
     "assets/sprites/weapons/w5_langszoro.png"),
    ("hf_20260713_155134_b6b4147c-5502-4837-8979-9acab68f6672.png",
     "assets/sprites/weapons/w6_minigun.png"),
    ("hf_20260713_155151_34fdb1bb-ea6a-4256-b59a-793c3ce09903.png",
     "assets/sprites/weapons/w7_rpg.png"),
    ("hf_20260713_155158_76782504-3a54-413a-af87-78a635aa1369.png",
     "assets/sprites/weapons/w8_ion.png"),

    # ---------- VFX (univerzalis, minden entitas hasznalja) ----------
    ("hf_20260713_090930_9c35c3ed-ed2f-440f-934c-b12379cd667f.png",
     "assets/fx/blood_splatter_sheet.png"),
    ("hf_20260713_090936_bd77bd72-03b8-43d9-9465-51a7c611b5cb.png",
     "assets/fx/wound_stump.png"),
    ("hf_20260713_090942_0a594088-5410-49ae-88f8-6205ac52fb64.png",
     "assets/fx/impact_spark.png"),
    ("hf_20260715_085210_63c62fc3-cca2-41c2-b10a-9c2283999a96.png",
     "assets/fx/muzzle_flash.png"),
    ("hf_20260715_085216_fff54707-ec72-44f9-a1ec-890c5315a0d6.png",
     "assets/fx/flame.png"),
    ("hf_20260715_085222_2d88449b-091f-489c-9778-0dd54523724c.png",
     "assets/fx/explosion_sheet.png"),
    ("hf_20260715_085228_acfbdc9c-79f9-4935-941c-76957f0be91e.png",
     "assets/fx/rocket.png"),
    ("hf_20260715_085234_0b39d5ea-e198-432a-bd55-6792d3e2e727.png",
     "assets/fx/acid_spit.png"),

    # ---------- UI ----------
    ("hf_20260715_085240_2ea57d7f-83ec-4663-9079-c4f65cf95a7e.png",
     "assets/ui/coin.png"),
    ("hf_20260715_085245_99117b46-d76a-4c88-9392-6667e4ac5763.png",
     "assets/ui/grenade.png"),
]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="meglevo fajlok felulirasa")
    args = ap.parse_args()

    ok = skipped = failed = 0
    for remote, local in ASSETS:
        url = CDN + remote
        if os.path.exists(local) and not args.force:
            print(f"  [=] mar letezik: {local}")
            skipped += 1
            continue
        if args.dry_run:
            print(f"  [>] {local}")
            continue
        os.makedirs(os.path.dirname(local), exist_ok=True)
        try:
            urllib.request.urlretrieve(url, local)
            size = os.path.getsize(local)
            print(f"  [+] {local}  ({size // 1024} KB)")
            ok += 1
        except Exception as e:
            print(f"  [X] {local}  HIBA: {e}")
            failed += 1

    if not args.dry_run:
        print(f"\nLetoltve: {ok}   Kihagyva: {skipped}   Hiba: {failed}")
        if failed:
            print("\nHa 403/404 hibat kaptal: az URL-ek lejarhattak.")
            print("Ez esetben mentsd a kepeket kezzel a Higgsfield galeriabol.")
        else:
            print("\nKovetkezo: python tools/verify_assets.py")


if __name__ == "__main__":
    main()
