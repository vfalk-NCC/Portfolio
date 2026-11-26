# Portfolio – produktionsplanering, VDC och egna digitala verktyg

Statisk webbplats för GitHub Pages (från `main`). Inget byggsteg på servern, inga ramverk, inga externa skript eller anrop. Generatorn i `tools/` körs lokalt med Node, och resultatet committas.

```
index.html                    GENERERAD startsida
verktyg/<id>/index.html       GENERERADE case-sidor (4 st)
404.html, sitemap.xml, robots.txt   GENERERADE
css/style.css                 Designsystemet (tokens, raster, ritningsram, demos, ljust/mörkt läge)
js/main.js                    Hero, Före/Efter, flikar, filter, funktioner, video, laddar demos
js/demo-*.js, js/kalkyl.js    Demo B–E och kalkylen (moduler, laddas när de syns)
js/gantt-drag.js              Gemensam styrning av Gantt-staplar (mus, touch, tangentbord)
fonts/                        Geist (variabel) och IBM Plex Mono, SIL OFL
media/                        Skärmbilder och video (tom tills vidare)
img/og.png, img/favicon.svg   Delningsbild och favicon

tools/config.js               NAMN, E-POST, LINKEDIN, ORT, ADRESS
tools/data/status.js          STATUS PER VERKTYG
tools/data/verktyg.js         ALL TEXT OM VERKTYGEN (register, kort, case-sidor, kalkylens moment)
tools/data/media.js           VILKEN BILD/VIDEO SOM VISAS VAR
tools/index.src.html          Startsidans löptext (hero, arbetssätt, erfarenhet, program, kontakt)
tools/gen.js                  Generatorn
tools/ritningar.js, demos.js  Egenritade illustrationer och demornas statiska läge
tools/og.js, tools/test.js    Delningsbild och röktest (kräver puppeteer)
```

Redigera aldrig de genererade filerna direkt. Efter varje ändring: `node tools/gen.js`.

## Byta status
Öppna `tools/data/status.js` och ändra värdet för verktyget till `'drift'`, `'utveckling'`, `'prototyp'` eller `'pagang'`. Kör `node tools/gen.js`. Märken, register, case-sidor och raden "12, varav 2 i drift" uppdateras.

## Lägga in skärmbilder eller video
1. Lägg filen i `media/` (PNG, JPEG eller WebP; video som MP4 utan ljud, 8–15 s, med en posterbild).
2. Öppna `tools/data/media.js`, hitta platsen (t.ex. `'binderbuilder/forhandsvisning'`) och byt `null` mot
   `{ fil: 'media/binder-01.webp', alt: 'Beskrivning av bilden' }`
   eller för video `{ fil: 'media/binder.mp4', poster: 'media/binder.jpg', alt: '...' }`.
3. Kör `node tools/gen.js`. Bredd och höjd läses ur filen; för AVIF anges `bredd` och `hojd`.

Så länge en plats är `null` visas den egenritade illustrationen eller demon, aldrig en tom ruta. Fylls `forhandsvisning` i flyttas demon till avsnittet "Prova själv" längre ned. Video spelas bara när den syns och aldrig vid minskad rörelse, och har en Spela/Pausa-knapp. Exportera bilder i 16:10, cirka 1600–2400 px breda. Generatorn varnar om en fil saknas.

## Namn, e-post, LinkedIn och domän
Allt står i `tools/config.js`. Ett tomt värde eller ett som börjar med `[` räknas som ej ifyllt: då visas bara "Victor", och raderna för e-post och LinkedIn utelämnas helt. Byt `url` när den egna domänen finns (lägg då också en fil `CNAME` med domännamnet i repots rot). Kör sedan `node tools/gen.js` och rita om delningsbilden:
`PUPPETEER_EXECUTABLE_PATH=/sökväg/till/chrome node tools/og.js`

## Texter
Verktygens texter (registerrad, projektkort, problem, steg, funktioner, teknik, status, nytta) står i `tools/data/verktyg.js`. Startsidans övriga text står i `tools/index.src.html`. Inga företags-, kund- eller projektnamn, ingen byggtid för verktygen och inga påhittade siffror.

## Testa
```
python3 -m http.server 8765
PUPPETEER_MODULE=/sökväg/puppeteer PUPPETEER_EXECUTABLE_PATH=/sökväg/chrome node tools/test.js
```
Validera HTML med W3C:s Nu-validator (`vnu.jar`). Allt innehåll syns utan JavaScript; demos visar då sitt slutläge.

## Öppen fråga
Adressen i `tools/config.js` är den nuvarande GitHub Pages-adressen, vars användarnamn innehåller arbetsgivarens namn. Byt innan sidan delas brett.
