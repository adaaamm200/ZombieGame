Feladat: A Zombi Krónika játék UI-jának véglegesítése a mellékelt handoff pack alapján.

Dolgozz úgy, mintha egy senior game UI/UX fejlesztő és frontend/game integrátor lennél. NE újratervezd nulláról, hanem az itt kapott specifikációkat és referencia képeket implementáld következetesen.

Elsődleges célok:
1. A főmenü legyen teljes képernyős, modern telefonokon is helyes safe-area kezeléssel.
2. A „For personal use only. | build v29” felirat soha többé ne a scrollozható főmenü közepén jelenjen meg. Fixen a viewport legalján legyen.
3. A menükártyák legyenek nagyok, prémiumok, tapintható gombként működjenek.
4. A kampány térkép bal oldali gombjainál töröld a ronda kör/halo alátéteket. Helyettük legyen téglalap/plaquette jellegű, fémes, prémium oldalsó navigáció.
5. A jobb felső SHOP gomb és a FIGHT BOSS gomb legyen új, erős, prémium CTA.
6. Az Armory, Shop, Mission Briefing, Pause és Lab képernyők egységes komponensrendszerből épüljenek.
7. A UI legyen implementáció-stabil: ne fix pixelre széthulló layout, hanem clamp(), safe-area, responsive skálázás, min/max méretek.
8. Ne ronts el meglévő működést: a képernyőváltások, játékindítás, fegyverválasztás, coin költés, upgrade adatok működjenek tovább.

Használd ezeket a fájlokat:
- README.md
- 01_GLOBAL_UI_RULES.md
- screen_specs/*.md
- data/*.json
- styles/zombi_kronika_ui_starter.css
- implementation/COMPONENT_CONTRACTS.json
- visual_references/*.png

Elvárt munka:
- Először térképezd fel a jelenlegi projekt struktúráját.
- Készíts rövid tervet, hogy melyik fájlt módosítod.
- Implementáld lépésenként.
- Minden módosítás után futtasd/leírd a releváns ellenőrzést.
- A végén adj checklistet: főmenü, footer, kampány gombok, shop gomb, boss gomb, armory, lab, pause, mission modal.
