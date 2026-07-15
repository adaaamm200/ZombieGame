#!/usr/bin/env python3
"""
bump_version.py — cache-busting verzio lepetese (sw.js + index.html EGYUTT)
===========================================================================
MIERT KELL:
A "nem frissul a jatek" ket kulon cache-bol jott:
  1) a service worker cache-e  -> ezt a sw.js VERSION bumpja uriti,
  2) a BONGESZO HTTP-cache-e   -> ezt a VERSION nem erinti! A <script src="js/const.js">
     query nelkul megy, a szerver (python http.server / GitHub Pages) pedig nem kuld
     szigoru Cache-Control-t, ezert a bongeszo heurisztikusan cache-eli a regi JS-t.
     Meg a service worker torlese utan is a REGI const.js jott -> ez bizonyitotta.

MEGOLDAS: minden helyi js/css hivatkozas kap egy ?v=<verzio> query-t az index.html-ben,
es ez EGYUTT lepked a sw.js VERSION-jevel. Uj URL = biztos friss letoltes.

Hasznalat:
    python tools/bump_version.py           # kovetkezo verzio (v51 -> v52)
    python tools/bump_version.py --set 60  # konkret verzio
    python tools/bump_version.py --show    # csak kiirja a jelenlegit
"""
import argparse
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SW = os.path.join(ROOT, "sw.js")
IDX = os.path.join(ROOT, "index.html")

SW_RE = re.compile(r"const VERSION = 'zk-v(\d+)';")
# helyi js/css hivatkozasok (mar meglevo ?v=... query-vel vagy anelkul)
ASSET_RE = re.compile(r'((?:src|href)=")((?:js|css)/[^"?]+)(\?v=\d+)?(")')


def current():
    s = open(SW, encoding="utf-8").read()
    m = SW_RE.search(s)
    if not m:
        raise SystemExit("HIBA: nem talalom a VERSION-t a sw.js-ben.")
    return int(m.group(1))


def apply(v):
    s = open(SW, encoding="utf-8").read()
    s = SW_RE.sub(f"const VERSION = 'zk-v{v}';", s, count=1)
    open(SW, "w", encoding="utf-8").write(s)

    h = open(IDX, encoding="utf-8").read()
    h, n = ASSET_RE.subn(lambda m: f"{m.group(1)}{m.group(2)}?v={v}{m.group(4)}", h)
    open(IDX, "w", encoding="utf-8").write(h)
    return n


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--set", type=int)
    ap.add_argument("--show", action="store_true")
    a = ap.parse_args()

    cur = current()
    if a.show:
        print(f"jelenlegi verzio: zk-v{cur}")
        raise SystemExit
    v = a.set if a.set else cur + 1
    n = apply(v)
    print(f"Verzio: zk-v{cur} -> zk-v{v}")
    print(f"  sw.js VERSION frissitve")
    print(f"  index.html: {n} js/css hivatkozas kapott ?v={v} query-t")
    print("\nFONTOS: minden deploy elott futtasd le, kulonben a bongeszo a regi JS-t adja.")
