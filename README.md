# Portfolio – produktionsplanering, VDC och egna digitala verktyg

Statisk webbplats för GitHub Pages (från `main`). Sidan själv har inget byggsteg, inga ramverk, inga externa skript och inga externa anrop. Typsnitten (IBM Plex, SIL OFL) ligger i `fonts/`.

```
index.html          GENERERAD – redigera inte direkt
css/style.css       Formspråket "Levande lägesplan" (12-kolumnsraster, statusfärger)
js/main.js          Hero-uppspelning, Före/Efter-reglaget, kalkylen, inflygning
fonts/              IBM Plex Sans 400/600 och Mono 400/500, latin
img/favicon.svg     Favicon (skrivs av generatorn)
img/og.png          Delningsbild 1200 × 630
tools/config.js     NAMN, E-POST, LINKEDIN OCH ADRESS – det enda stället att byta
tools/index.src.html  Mall för all text på sidan
tools/gen.js        Ritar SVG och Gantt, skriver index.html
tools/og.js         Ritar om img/og.png (kräver puppeteer)
tools/test.js       Röktest och skärmbilder (kräver puppeteer)
.nojekyll           Behålls
```

Utan JavaScript syns allt innehåll, och heron visar nuläget vecka 18.

## Ändra text, namn eller adress

1. Ändra text i `tools/index.src.html`. Ändra namn, e-post, LinkedIn eller adressen i `tools/config.js`.
   Värden som börjar med `[` visas som diskreta platshållare.
2. Kör `node tools/gen.js`. Det skriver `index.html` (title, Open Graph, rubrik, kontaktlänkar) och favicon.
3. Om namnet ändrats: rita om delningsbilden med
   `PUPPETEER_EXECUTABLE_PATH=/sökväg/till/chrome node tools/og.js`.
4. Testa gärna: `node tools/test.js [utmapp]`. Validera HTML med W3C:s Nu-validator.

Hallens tidplan (moment, planerade och faktiska veckor, nuläge) står i `ACTS` och `NOW` överst i `tools/gen.js` och styr både ritningen och Gantten.

## Öppen fråga

Adressen i `tools/config.js` är den nuvarande GitHub Pages-adressen. Byt den när den egna domänen finns.
