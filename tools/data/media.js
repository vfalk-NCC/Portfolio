// ==========================================================
// SKÄRMBILDER OCH VIDEO – en rad per plats på sidan.
//
// Så lägger du in en bild:
//   1. Lägg filen i mappen media/ (t.ex. media/tidplan-gantt-01.webp).
//   2. Byt null mot ett objekt på den plats där bilden ska synas:
//        'tidplan-i-modellen/forhandsvisning': {
//          fil: 'media/tidplan-gantt-01.webp',
//          alt: 'Tillägget i SketchUp: modellen färgad per status vecka 18',
//        },
//   3. Kör  node tools/gen.js
//
// Video (mp4, utan ljud, 8–15 s) behöver en posterbild:
//        { fil: 'media/tidplan-reglage.mp4', poster: 'media/tidplan-reglage.jpg',
//          alt: 'Tidsreglaget dras från vecka 1 till 18 och modellen färgas' }
//
// Bredd och höjd läses ur PNG, JPEG och WebP automatiskt. För andra format
// (t.ex. AVIF) anges  bredd: 1600, hojd: 1000.
// Ange  kalla: 'demoprojekt'  (standard) eller  kalla: 'illustration'  för
// etiketten i ramens titelblock.
//
// Så länge en plats är null visas den egenritade illustrationen eller demon.
// Ingen tom ruta syns på sidan.
// ==========================================================
module.exports = {
  // ---------- Startsidan ----------
  // Flaggskeppet Tidplan i modellen, en per flik
  'start/flaggskepp-flytta': null,   // ersätter demon Flytta en aktivitet
  'start/flaggskepp-montage': null,
  'start/flaggskepp-lagesbild': null,
  // Projektkorten
  'start/kort-trimble-connect': null,
  'start/kort-production-cockpit': null,
  'start/kort-binderbuilder': null,

  // ---------- Case-sidor ----------
  // Förhandsvisningen överst. När den fylls i flyttas demon längre ned på sidan.
  'tidplan-i-modellen/forhandsvisning': null,
  'trimble-connect/forhandsvisning': null,
  'production-cockpit/forhandsvisning': null,
  'binderbuilder/forhandsvisning': null,

  // Bild per steg under "Så fungerar det" (valfritt)
  'tidplan-i-modellen/steg-1': null,
  'tidplan-i-modellen/steg-2': null,
  'tidplan-i-modellen/steg-3': null,
  'tidplan-i-modellen/steg-4': null,
  'trimble-connect/steg-1': null,
  'trimble-connect/steg-2': null,
  'trimble-connect/steg-3': null,
  'trimble-connect/steg-4': null,
  'production-cockpit/steg-1': null,
  'production-cockpit/steg-2': null,
  'production-cockpit/steg-3': null,
  'production-cockpit/steg-4': null,
  'binderbuilder/steg-1': null,
  'binderbuilder/steg-2': null,
  'binderbuilder/steg-3': null,

  // Funktioner (bilden byts när besökaren väljer funktion)
  'tidplan-i-modellen/funktion-status': null,
  'tidplan-i-modellen/funktion-reglage': null,
  'tidplan-i-modellen/funktion-gantt': null,
  'tidplan-i-modellen/funktion-montage': null,
  'tidplan-i-modellen/funktion-serie': null,
  'tidplan-i-modellen/funktion-skyltar': null,
  'tidplan-i-modellen/funktion-ifc': null,

  'trimble-connect/funktion-annotering': null,
  'trimble-connect/funktion-mangd': null,
  'trimble-connect/funktion-pdf': null,
  'trimble-connect/funktion-foto': null,
  'trimble-connect/funktion-etikett': null,
  'trimble-connect/funktion-platsminnet': null,

  'production-cockpit/funktion-tavla': null,
  'production-cockpit/funktion-heatmap': null,
  'production-cockpit/funktion-gantt': null,
  'production-cockpit/funktion-kaskad': null,


  // ---------- Verktygsregistret ----------
  // Miniatyr som visas när muspekaren står på raden (desktop). 16:10.
  'tidplan-i-modellen/miniatyr': null,
  'trimble-connect/miniatyr': null,
  'production-cockpit/miniatyr': null,
  'binderbuilder/miniatyr': null,
  '4d-planeringsappen/miniatyr': null,
  'punktmolnsvisare/miniatyr': null,
  'ritningsregister/miniatyr': null,
  'produktionsplanering/miniatyr': null,
  'planeringskoll-4d/miniatyr': null,
  'sharepoint-spegel/miniatyr': null,
  'fore-efter/miniatyr': null,
  'motesprotokoll/miniatyr': null,
};
