# Zombi Krónika UI Handoff Pack

Ez nem csak koncepció: ez egy átadható implementációs csomag Claude-nak / fejlesztőnek.

## Mit tartalmaz?

- `visual_references/` — a legenerált vizuális referencia képek, külön fájlban.
- `screen_specs/` — képernyőnkénti implementációs specifikáció.
- `data/` — fegyverek, shop itemek, upgrade-ek, missionök, UI tokenek JSON-ben.
- `styles/` — induló CSS a teljes képernyős, safe-area kompatibilis, prémium UI-hoz.
- `implementation/` — komponens szerződések és Claude master prompt.
- `asset_prompts/` — külön asset-generálási promptok ikonokhoz/gombokhoz/fegyverekhez.

## Legfontosabb javítások

1. A főmenü ne legyen összenyomva.
2. A build/personal-use felirat **fixen legalul** legyen, ne egy kártya közepén.
3. Dynamic Island / safe-area kompatibilis teljes képernyős layout.
4. A bal oldali kampány navigációból ki kell venni a ronda kör/alátét háttereket.
5. A `SHOP` és `FIGHT BOSS` gombok legyenek új, prémium, nagy CTA elemek.
6. Fegyverképek, Shop, Lab upgrade rendszer és Armory adatszerkezet készen átadható.

## Használat Claude-ban

Másold be Claude-nak az `implementation/CLAUDE_MASTER_PROMPT.md` tartalmát, majd add oda neki ezt a csomagot.  
A fejlesztőnek a `screen_specs` + `data` + `styles` fájlokból kell dolgoznia.

## Referenciaképek

- `main_menu_reference.png`
- `pause_menu_reference.png`
- `mission_briefing_reference.png`
- `armory_shop_reference.png`
- `campaign_map_reference.png`
- `lab_upgrades_reference.png`
- `weapon_asset_sheet_reference.png`
