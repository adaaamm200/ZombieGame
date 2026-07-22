# Betűkészletek

Mind **SIL Open Font License 1.1** alatt áll — szabadon használható kereskedelmi
célra is, a licencszöveg mellékelésével. A licencfájlok itt vannak: `OFL-*.txt`.

| fájl-előtag | család | szerep |
|---|---|---|
| `oswald-*` | Oswald | katonai condensed — **jelenlegi alapértelmezés** |
| `rajdhani-*` | Rajdhani | taktikai sci-fi variáns |
| `blackops-*` | Black Ops One | poszter/stencil variáns (csak címekhez) |
| `barlowcond-*` | Barlow Condensed | a poszter-variáns folyó szövege |

## Miért van minden fontból két fájl

A `-latin` fájl az alapbetűket tartalmazza, a `-latin-ext` **csak** a kiterjesztett
latin jeleket — köztük a magyar **ő** és **ű** betűt. A kettő `unicode-range`-dzsel
van szétválasztva a [`css/fonts.css`](../../css/fonts.css)-ben, pontosan úgy, ahogy a
forrás adja. **Egyiket sem szabad elhagyni**: csak `-latin` esetén eltűnnek az
ékezetek, csak `-latin-ext` esetén az összes alapbetű.

## Zero-dependency

Ezek sima fájlok a repóban, `@font-face`-szel bekötve. Nincs CDN-hívás, nincs
csomagkezelő, nincs build lépés — a projekt szabályai sértetlenek.

## Variáns váltása

Alapértelmezés a `:root`-ban (`--font-ui` / `--font-display`). Próbához a
`body.f-oswald` / `.f-rajdhani` / `.f-poster` osztályok cserélik; QA-ból a
hash negyedik mezőjével, pl. `index.html#armory@@@f-rajdhani`.
