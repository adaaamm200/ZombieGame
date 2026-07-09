# Main Menu implementációs specifikáció

Referencia: `visual_references/main_menu_reference.png`

## Cél

A főmenü legyen a játék prémium belépő képernyője. Nagy, erős, képileg gazdag kártyákkal:

1. Continue
2. Campaign
3. Scavenge
4. Armory
5. Lab

## Kötelező javítás

A `For personal use only. | build v29` feliratot ki kell venni minden scrollozható menükártyából.  
Külön `FixedLegalFooter` komponens legyen, amely fixen a viewport alján áll.

## Layout

- `ScreenShell`
- háttér: cinematic quarantine street
- top HUD: profil, level, XP, coin, mail, settings
- content: scrollozható card stack
- bottom dock: Events, Daily Reward, Store
- legal footer: fixen legalul

## MenuCard adatmodell

```json
{
  "id": "campaign",
  "title": "Campaign",
  "subtitle": "Day-by-day missions",
  "accent": "red",
  "icon": "skull_campaign",
  "background": "card_campaign_bg",
  "route": "campaign"
}
```

## Kártyák

- Continue: zöld, play ikon, subtitle: `Last mission: Day 1`
- Campaign: piros, skull ikon, subtitle: `Day-by-day missions`
- Scavenge: lila, crate ikon, subtitle: `Farm mode for personal use. Free mode · coin farm`
- Armory: arany, ammo ikon, subtitle: `Weapons & ammo`
- Lab: kék, flask ikon, subtitle: `Upgrades & research`

## Elfogadási kritérium

- A kártyák legalább 100–150 px magasak mobilon.
- Nincs átfedő build szöveg.
- Footer legalul fix.
- Top HUD nem takarja ki a Dynamic Island területet.
- Scroll csak a kártyákat érinti, HUD/footer nem mozog.
