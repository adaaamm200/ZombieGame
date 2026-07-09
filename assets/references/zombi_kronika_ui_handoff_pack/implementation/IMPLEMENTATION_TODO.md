# Implementációs TODO

## 1. Alap shell

- Hozz létre vagy módosíts egy `ScreenShell` / `GameScreen` wrapper komponenst.
- Állítsd be a teljes viewportot: `100dvw`, `100dvh`, `overflow:hidden`.
- Add hozzá a safe-area padding változókat.

## 2. Footer bug fix

- Keresd meg, hol van jelenleg a `For personal use only` / `build v29` renderelve.
- Vedd ki a scrollozható főmenüből.
- Hozz létre `FixedLegalFooter` komponenst.
- Minden főmenü jellegű képernyőn ezt használd.

## 3. MainMenu

- Cseréld le a sima gombokat `PremiumMenuCard` komponensre.
- A menu adatokat tedd tömbbe.
- Szín/accent alapján generálódjon a style.

## 4. CampaignMap

- Cseréld le a bal oldali nav elemeket `SideNavPlaque` komponensre.
- Töröld a kör/halo alátéteket.
- Cseréld a shop gombot `PremiumButton gold compact` variánsra.
- Cseréld a boss gombot `PremiumButton red boss` variánsra.

## 5. Armory

- Használd a `data/weapons.json` adatot.
- WeaponCard grid.
- Equipped state.
- Select/Buy logika.

## 6. Shop

- Használd a `data/shop_items.json` adatot.
- Coin ellenőrzés.
- Visszajelzés vásárlás után.

## 7. Lab

- Használd a `data/upgrades.json` adatot.
- Upgrade cost ellenőrzés.
- Level növelés.
- Max level disabled.

## 8. Mission briefing

- Selected mission + selected weapon alapján rendereld.
- Start csak valid mission/loadout esetén aktív.
