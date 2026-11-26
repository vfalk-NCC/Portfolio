// ==========================================================
// ALL TEXT OM VERKTYGEN – registret, projektkorten och case-sidorna.
// Status står i tools/data/status.js, bilder och video i tools/data/media.js.
// Kör sedan:  node tools/gen.js
//
// Regler (krav.md 8): inga företags-, kund- eller projektnamn, ingen byggtid
// för verktygen, inga påhittade siffror eller funktioner.
// ==========================================================

// Kategorier för filtret i registret, i visningsordning
const kategorier = {
  planering: 'Planering',
  modell: 'Modell',
  dokument: 'Dokument',
  data: 'Data',
};

// Case-sidornas fält under Teknik och Status visas BARA om de har ett värde:
//   teknik: { sprak, kors, data, externa, taggar }  -> SPRÅK / KÖRS / DATA LAGRAS / EXTERNA TJÄNSTER
//   status: { fungerar, aterstar }                   -> FUNGERAR I DAG / ÅTERSTÅR
// Fyll bara i det som är bekräftat. Tomt fält = raden syns inte.
// En funktion med  bild: false  visas som text utan knapp (ingen del i bilden).

// Ordningen här är ordningen i registret.
const verktyg = [
  {
    id: 'tidplan-i-modellen',
    namn: 'Tidplan i modellen',
    kategorier: ['planering', 'modell'],
    typ: 'SketchUp-tillägg',
    rad: 'Kopplar tidplanen från Powerproject och Primavera P6 till 3D-modellen och färgar den vecka för vecka.',
    case: {
      demo: 'flytta',
      lede: 'Ett tillägg till SketchUp som läser tidplanen från Powerproject eller Primavera P6 och färgar modellen vecka för vecka.',
      fakta: [
        ['Typ', 'SketchUp-tillägg'],
        ['Läser', 'Powerproject, Primavera P6'],
        ['Skriver', 'IFC med skyltar och etiketter, SWEREF 99'],
        ['Används', 'Varje vecka'],
      ],
      problem: [
        'Tidplanen och modellen lever i olika program. Den som ska visa läget på byggmötet får översätta aktiviteter och veckor till färger i modellen för hand.',
        'Läget ändras varje vecka, och då ska bilden göras om.',
      ],
      steg: [
        { t: 'Tidplanen in', p: 'Tidplanen läses från Powerproject eller Primavera P6.' },
        { t: 'Aktiviteter mot modellen', p: 'Aktiviteterna kopplas till delarna i 3D-modellen. Återkommande aktiviteter skapas i serie.' },
        { t: 'Välj vecka', p: 'Tidsreglaget sätter veckan. Varje del får sin statusfärg, med Gantt och tavla bredvid modellen.' },
        { t: 'Lägesbilden ut', p: 'Lägesbilder med skyltar i 3D går till byggmötet. Skyltar och etiketter exporteras som IFC i SWEREF 99 till Trimble Connect.' },
      ],
      funktioner: [
        { key: 'status', namn: 'Statusfärg per vecka', text: 'Varje del i modellen får färg efter sin status i tidplanen den valda veckan.' },
        { key: 'reglage', namn: 'Tidsreglage', text: 'Ett reglage flyttar mellan veckorna, så att läget före och efter nuläget går att visa.' },
        { key: 'gantt', namn: 'Gantt och tavla', text: 'Tidplanen visas som Gantt och som tavla direkt mot modellen.' },
        { key: 'montage', namn: 'Montageordning', text: 'Ordningen som delarna monteras i visas i modellen.' },
        { key: 'serie', namn: 'Aktiviteter i serie', text: 'Återkommande aktiviteter skapas i serie i stället för en och en.' },
        { key: 'skyltar', namn: 'Skyltar i 3D', text: 'Lägesbilder med skyltar i modellen, till byggmötet.' },
        { key: 'ifc', namn: 'IFC till Trimble Connect', text: 'Skyltar och etiketter exporteras som IFC i SWEREF 99 och öppnas i Trimble Connect.' },
      ],
      teknik: {
        sprak: '',
        kors: 'Som tillägg i SketchUp. Läser tidplaner från Powerproject och Primavera P6 och exporterar skyltar och etiketter som IFC i SWEREF 99.',
        data: '',
        externa: '',
        taggar: ['SketchUp', 'Powerproject', 'Primavera P6', 'IFC', 'SWEREF 99', 'Trimble Connect'],
      },
      status: { fungerar: '', aterstar: '' },
      nytta: [
        'Lägesbilden till byggmötet kommer ur tidplanen i stället för att färgas fram för hand.',
        'Avvikelser syns i modellen före byggmötet.',
      ],
    },
  },
  {
    id: 'trimble-connect',
    namn: 'Tillägg till Trimble Connect',
    kategorier: ['modell'],
    typ: 'Webbsidor · Workspace API',
    rad: 'Annoteringar, mängder, PDF-överlägg, geotaggade foton och Platsminnet direkt i modellvisaren.',
    kort: {
      problem: 'Ritningar, foton och öppna punkter ligger i mappar, inte på platsen i modellen där de hör hemma.',
      effekt: 'Egna tillägg mäter, märker upp och kopplar ritningar och foton till rätt plats i modellen.',
      taggar: ['Workspace API', 'Mängd med polygon och TIN', 'PDF-överlägg', 'SWEREF 99', 'Platsminnet'],
    },
    case: {
      demo: 'platsminne',
      lede: 'Egna verktyg direkt i modellvisaren i Trimble Connect: mät, märk upp och koppla ritningar och foton till rätt plats i modellen.',
      fakta: [
        ['Typ', 'Fristående webbsidor'],
        ['Kopplas via', 'Trimble Connect Workspace API'],
        ['Koordinater', 'SWEREF 99'],
      ],
      problem: [
        'Modellvisaren visar modellen, men ritningar, foton och öppna punkter ligger i mappar och listor, skilda från platsen de gäller.',
      ],
      steg: [
        { t: 'Modellen', p: 'Modellen öppnas som vanligt i Trimble Connect.' },
        { t: 'Tillägget', p: 'Varje tillägg är en fristående webbsida som kopplas till modellvisaren via Workspace API.' },
        { t: 'Arbetet på platsen', p: 'Mät en mängd, märk upp, lägg en ritning över modellen eller sätt ett foto på sin koordinat.' },
        { t: 'Kvar på platsen', p: 'Att göra-punkter, ritningar och foton kopplas till objekten i modellen.' },
      ],
      funktioner: [
        { key: 'annotering', namn: 'Annoteringar', text: 'Märk upp direkt i modellen.' },
        { key: 'mangd', namn: 'Mängdhanterare', text: 'Volym ur en polygon eller en TIN-yta.' },
        { key: 'pdf', namn: 'PDF-överlägg', text: 'En ritning läggs över modellen och kalibreras mot den.' },
        { key: 'foto', namn: 'Geotaggade platsfoton', text: 'Foton placeras i modellen efter sina koordinater i SWEREF 99.' },
        { key: 'etikett', namn: 'Egenskapsetiketter', text: 'Objektens egenskaper visas som etiketter i modellen.' },
        { key: 'platsminnet', namn: 'Platsminnet', text: 'En att göra-lista kopplad till objekt, ritningar och foton.' },
      ],
      teknik: {
        sprak: '',
        kors: 'Som fristående webbsidor, kopplade till modellvisaren i Trimble Connect via Workspace API.',
        data: '',
        externa: '',
        taggar: ['Trimble Connect', 'Workspace API', 'Webbsidor', 'SWEREF 99'],
      },
      status: { fungerar: '', aterstar: '' },
      nytta: [
        'Ritning, foto och öppen punkt hittas på platsen i modellen i stället för i en mapp.',
        'Mängder tas ur modellen där den redan är öppen.',
      ],
    },
  },
  {
    id: 'production-cockpit',
    namn: 'Production Cockpit',
    kategorier: ['planering'],
    rad: 'Tavla, heatmap och Gantt med beroenden, automatisk kaskad och AI-förslag på aktivitetsföljder.',
    kort: {
      problem: 'Flyttas en aktivitet för hand är det lätt att missa en efterföljare.',
      effekt: 'Efterföljarna flyttas automatiskt, och tavla, heatmap och Gantt visar samma plan.',
      taggar: ['Tavla', 'Heatmap', 'Gantt med beroenden', 'Kaskad', 'AI-förslag'],
    },
    case: {
      demo: 'kaskad',
      lede: 'Ett planeringsverktyg med tavla, heatmap och Gantt med beroenden, där en flyttad aktivitet flyttar sina efterföljare automatiskt.',
      fakta: [
        ['Typ', 'Planeringsverktyg'],
        ['Vyer', 'Tavla, heatmap, Gantt'],
        ['AI-del', 'Föreslår aktivitetsföljder'],
      ],
      problem: [
        'När en aktivitet flyttas i en plan med många beroenden ska efterföljarna flyttas med.',
        'För hand är det lätt att missa en koppling, och då ligger en aktivitet kvar på fel vecka.',
      ],
      steg: [
        { t: 'Aktiviteter och beroenden', p: 'Aktiviteterna läggs upp med sina beroenden.' },
        { t: 'Flytta', p: 'Flytta en aktivitet. Efterföljarna följer med automatiskt.' },
        { t: 'Samma plan, tre vyer', p: 'Tavla, heatmap och Gantt visar planen från tre håll.' },
        { t: 'Förslag', p: 'En AI-del föreslår i vilken följd aktiviteter kan läggas.' },
      ],
      funktioner: [
        { key: 'tavla', namn: 'Tavla', text: 'Planen som kort på en tavla, bredvid Gantt och heatmap.' },
        { key: 'heatmap', namn: 'Heatmap', text: 'En heatmap över planen.' },
        { key: 'gantt', namn: 'Gantt med beroenden', text: 'Tidplanen med beroenden mellan aktiviteterna.' },
        { key: 'kaskad', namn: 'Automatisk kaskad', text: 'En flyttad aktivitet flyttar sina efterföljare.' },
        { key: 'ai', namn: 'AI-förslag', text: 'Föreslår aktivitetsföljder. Den delen visas inte i demon på den här sidan.', bild: false },
      ],
      teknik: {
        sprak: '',
        kors: '',
        data: '',
        externa: '',   // t.ex. vilken AI-tjänst förslagen hämtas från
        taggar: [],
      },
      status: { fungerar: '', aterstar: '' },
      nytta: [
        'Kopplingarna i planen hålls ihop när något flyttas, så att ingen efterföljare blir kvar på fel vecka.',
      ],
    },
  },
  {
    id: 'binderbuilder',
    namn: 'BinderBuilder',
    kategorier: ['dokument'],
    typ: 'PDF',
    rad: 'Bygger PDF-ritningspärmar per område automatiskt ur ritningsleveranser.',
    kort: {
      problem: 'En ritningsleverans är cirka 240 PDF som ska sorteras per område.',
      effekt: 'Leveransen läses, sorteras och blir färdiga PDF-pärmar. Ett sorteringsjobb blir en körning.',
      taggar: ['Ritningsleveranser', 'Pärm per område', 'PDF'],
    },
    case: {
      demo: 'sortera',
      lede: 'Bygger PDF-ritningspärmar per område automatiskt ur en ritningsleverans.',
      fakta: [
        ['Indata', 'Ritningsleverans, cirka 240 PDF'],
        ['Utdata', 'En PDF-pärm per område'],
      ],
      problem: [
        'En ritningsleverans är cirka 240 PDF. Varje ritning ska till rätt område och samlas i en pärm.',
        'Görs det för hand är det ett sorteringsjobb per leverans.',
      ],
      steg: [
        { t: 'Leveransen in', p: 'Verktyget läser alla PDF i leveransen.' },
        { t: 'Sortering', p: 'Varje ritning sorteras till sitt område.' },
        { t: 'Pärmarna ut', p: 'En färdig PDF-pärm byggs per område.' },
      ],
      funktioner: [],
      teknik: {
        sprak: '',
        kors: 'Mot en ritningsleverans i taget, cirka 240 PDF per leverans.',
        data: '',
        externa: '',
        taggar: ['PDF'],
      },
      status: { fungerar: '', aterstar: '' },
      nytta: [
        'Ett sorteringsjobb för hand blir en körning.',
      ],
    },
  },
  {
    id: 'fore-efter',
    namn: 'Före/Efter',
    kategorier: ['dokument'],
    rad: 'Bildjämförelse med dragbar skiljelinje för framdrift, med export till en fristående visningsfil.',
    kort: {
      problem: 'Framdrift är svår att visa i ord.',
      effekt: 'Två bilder, en dragbar skiljelinje och en fristående fil som kan skickas vidare. Presenterad i projektet och väl mottagen.',
      taggar: ['Dragbar skiljelinje', 'Fristående visningsfil', 'Framdrift'],
    },
  },
  {
    id: '4d-planeringsappen',
    namn: '4D-planeringsappen',
    kategorier: ['planering'],
    typ: 'Webbapp',
    rad: 'Läser Powerproject-filer (.pp) direkt, med tavla, Gantt och beroenden.',
  },
  {
    id: 'produktionsplanering',
    namn: 'Produktionsplanering',
    kategorier: ['planering'],
    rad: 'Aktiviteter på skedesplaner per månad, uppdateras under mötet.',
  },
  {
    id: 'planeringskoll-4d',
    namn: 'Planeringskoll 4D',
    kategorier: ['planering', 'data'],
    rad: 'Automatiska rimlighetskontroller av tidplanen, till exempel orimliga varaktigheter.',
  },
  {
    id: 'punktmolnsvisare',
    namn: 'Punktmolnsvisare',
    kategorier: ['modell'],
    typ: 'Webbvisare',
    rad: 'Egna LAZ-punktmoln, testad med 1,4 GB, med koordinater, IFC-stöd och volymuttag.',
  },
  {
    id: 'ritningsregister',
    namn: 'Ritningsregister och 3D-redigerare',
    kategorier: ['dokument', 'modell'],
    typ: 'Windows · .NET 8',
    rad: 'Ritningsregister som Windows-app och egen 3D-redigerare för DWG, IFC och DXF.',
  },
  {
    id: 'sharepoint-spegel',
    namn: 'SharePoint-spegel',
    kategorier: ['data'],
    rad: 'Speglar en SharePoint-plats till lokal disk med ett klick, bara ändrade filer.',
  },
  {
    id: 'motesprotokoll',
    namn: 'Mötesprotokoll',
    kategorier: ['dokument'],
    typ: 'Lokalt',
    rad: 'Spelar in, transkriberar och skriver protokoll lokalt, utan molntjänster.',
  },
];

// Moment i kalkylen "Vad kostar handgreppen?" och vilket verktyg som tar dem.
// Värdet är startvärdet i timmar per vecka: ett exempel, inget mätresultat.
// kort: etikett på förvalsknappen
const moment = [
  { id: 'm-tidplan', verktyg: 'tidplan-i-modellen', kort: 'Tidplan', text: 'Färga modellen och ta fram lägesbilder till byggmötet', h: 1 },
  { id: 'm-tc', verktyg: 'trimble-connect', kort: 'Trimble Connect', text: 'Leta upp ritningar, foton och öppna punkter för en plats i modellen', h: 1 },
  { id: 'm-cockpit', verktyg: 'production-cockpit', kort: 'Cockpit', text: 'Flytta efterföljande aktiviteter för hand när planen ändras', h: 1 },
  { id: 'm-binder', verktyg: 'binderbuilder', kort: 'BinderBuilder', text: 'Sortera ritningsleveranser i pärmar per område', h: 1 },
  { id: 'm-spegel', verktyg: 'sharepoint-spegel', kort: 'SharePoint', text: 'Hämta ändrade filer från projektplatsen', h: 1 },
  { id: 'm-koll', verktyg: 'planeringskoll-4d', kort: 'Planeringskoll', text: 'Granska tidplanen efter orimliga varaktigheter', h: 1 },
];

// Case-sidornas ordning (styr "Nästa verktyg" och korten på startsidan)
const caseOrdning = ['tidplan-i-modellen', 'trimble-connect', 'production-cockpit', 'binderbuilder'];

module.exports = { kategorier, verktyg, moment, caseOrdning };
