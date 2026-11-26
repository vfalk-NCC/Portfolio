/*
  Statisk HTML för demo B–E. Utan JavaScript visas detta som slutläge.
  js/demo-*.js tar över när demon syns. Alla data är generiska.
*/
'use strict';
const R = require('./ritningar');
const { f1, esc, iso, box, txt } = R;

/* ---------- B. Flytta en aktivitet ---------- */
function flytta() {
  const { svg, late } = R.hall('b-hall', {
    label: 'Generisk industrihall, färgad efter tidplanen vecka 18',
    desc: 'Delarna får statusfärg efter tidplanen. Flyttas en aktivitet i Gantten byter delarna status.',
  });
  const W = R.WEEKS, NOW = R.NOW;
  const c = { d: 0, o: 0, l: 0, p: 0 };
  const rows = R.ACTS.map((a) => {
    const st = R.rowState(a, NOW, !!late[a.id]);
    c[st]++;
    return `<li class="dg-row is-${st}" data-a="${a.id}" data-s="${a.s}" data-e="${a.e}" data-as="${a.as}" data-ae="${a.ae}" style="--s:${a.s};--e:${a.e};--as:${a.as};--ae:${a.ae}"><span class="dg-lab">${esc(a.name)}</span><span class="dg-track"><span class="dg-plan"></span><span class="dg-bar" data-name="${esc(a.name)}"><span class="dg-d" aria-hidden="true"></span></span></span></li>`;
  }).join('');
  const ticks = [1, 6, 12, 24].map((w) => `<span style="--t:${w}">V${String(w).padStart(2, '0')}</span>`).join('');
  return `<div class="demo dfl" data-demo="flytta" data-now="${NOW}" data-weeks="${W}">
  <div class="dfl-model">${svg}</div>
  <div class="dfl-side">
    <p class="dfl-read"><span class="dfl-wk">V ${NOW} · NU</span><span class="dfl-sum">${R.summary(c)}</span></p>
    <div class="dg" style="--w:${NOW};--weeks:${W}">
      <div class="dg-head" aria-hidden="true"><span class="dg-lab"></span><span class="dg-scale">${ticks}</span></div>
      <ol class="dg-rows">${rows}</ol>
      <span class="dg-now" aria-hidden="true"></span>
    </div>
    <div class="demo-ctrl js-only"><p class="demo-hint">Dra en stapel i sidled eller välj den och använd piltangenterna.</p><button type="button" class="btn-s" data-reset>Återställ</button></div>
  </div>
</div>`;
}

/* ---------- C. Kaskaden ---------- */
const KASKAD = {
  weeks: 22,
  acts: [
    { id: 'A', name: 'Schakt', s: 1, d: 2, pred: [] },
    { id: 'B', name: 'Grundläggning', s: 3, d: 3, pred: ['A'] },
    { id: 'C', name: 'Stomme', s: 6, d: 4, pred: ['B'] },
    { id: 'D', name: 'Tak', s: 10, d: 3, pred: ['C'] },
    { id: 'E', name: 'Fasad', s: 10, d: 4, pred: ['C'] },
    { id: 'F', name: 'Installationer el', s: 13, d: 4, pred: ['D'] },
    { id: 'G', name: 'Installationer VS', s: 13, d: 4, pred: ['D'] },
    { id: 'H', name: 'Invändigt', s: 14, d: 4, pred: ['E'] },
    { id: 'I', name: 'Slutbesiktning', s: 19, d: 1, pred: ['F', 'G', 'H'] },
  ],
};
function load(acts, weeks) {
  const n = Array(weeks + 1).fill(0);
  acts.forEach((a) => { for (let w = a.s; w < a.s + a.d; w++) if (w <= weeks) n[w]++; });
  return n;
}
function kaskad() {
  const { weeks, acts } = KASKAD;
  const rows = acts.map((a) => `<li class="kg-row" data-id="${a.id}" data-s="${a.s}" data-d="${a.d}" data-pred="${a.pred.join(',')}" style="--s:${a.s};--d:${a.d};--s0:${a.s}"><span class="kg-lab">${esc(a.name)}</span><span class="kg-track"><span class="kg-ghost"></span><span class="kg-bar" data-name="${esc(a.name)}"><span class="kg-d" aria-hidden="true"></span></span></span></li>`).join('');
  const n = load(acts, weeks);
  const hm = [];
  for (let w = 1; w <= weeks; w++) hm.push(`<span class="hm hm-${Math.min(4, n[w])}" title="V${w}: ${n[w]}">${n[w] || ''}</span>`);
  const ticks = [1, 6, 11, 16, 22].map((w) => `<span style="--t:${w}">V${String(w).padStart(2, '0')}</span>`).join('');
  const end = Math.max(...acts.map((a) => a.s + a.d - 1));
  return `<div class="demo dka" data-demo="kaskad" data-weeks="${weeks}">
  <p class="dka-read" aria-live="polite"><span class="dka-wk">Klart V ${end}</span><span class="dka-sum">Planen som den är lagd</span></p>
  <div class="kg" style="--weeks:${weeks}">
    <div class="kg-head" aria-hidden="true"><span class="kg-lab"></span><span class="kg-scale">${ticks}</span></div>
    <div class="kg-body">
      <ol class="kg-rows">${rows}</ol>
      <svg class="kg-deps" aria-hidden="true" focusable="false" preserveAspectRatio="none"></svg>
    </div>
    <div class="kg-hm"><span class="kg-lab">Aktiviteter per vecka</span><span class="kg-hmrow" role="img" aria-label="Aktiviteter per vecka, högst ${Math.max(...n)}">${hm.join('')}</span></div>
  </div>
  <div class="demo-ctrl js-only"><p class="demo-hint">Dra en stapel eller välj den och använd piltangenterna. Efterföljarna flyttas med.</p><button type="button" class="btn-s" data-reset>Återställ</button></div>
</div>`;
}

/* ---------- D. Platsminnet ---------- */
const OBJ = [
  { id: 'p1', name: 'Pelare B3', typ: 'Stålpelare', todo: [['Kontrollera ingjutningsgods', 1], ['Fotografera efter montage', 0]], rit: 'RIT-021', foto: 'pelare' },
  { id: 'p2', name: 'Vägg axel 1', typ: 'Väggelement', todo: [['Komplettera fogning', 0], ['Stäm av mot ritning', 0], ['Skyddstäck öppning', 1]], rit: 'RIT-034', foto: 'vagg' },
  { id: 'p3', name: 'Fundament F2', typ: 'Platsgjutet fundament', todo: [['Mät in bultgrupp', 1], ['Efterkontroll gjutning', 1]], rit: 'RIT-008', foto: 'fund' },
  { id: 'p4', name: 'Port P1', typ: 'Industriport', todo: [['Kontrollera fritt mått', 0]], rit: 'RIT-047', foto: 'port' },
];
function pmModel() {
  const I = iso(8.4, 180, 70);
  const { P, pts } = I;
  const o = [];
  o.push(`<polygon class="slab" points="${pts([[-4, -4, 0], [40, -4, 0], [40, 28, 0], [-4, 28, 0]])}"/>`);
  // axlar
  for (let x = 0; x <= 36; x += 12) { const a = P(x, -8, 0), b = P(x, 31, 0); o.push(`<line class="ax" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"/>`); }
  // objekt
  const obj = {
    p3: box(I, 22, 16, 6, 6, 1.6, 'f-0'),
    p1: box(I, 24, 18, 2, 2, 14, 'f-0', 1.6),
    p2: box(I, 0, 0, 1.4, 24, 11, 'f-0'),
    p4: box(I, 8, 0, 9, 1, 8, 'f-0'),
  };
  // övriga, ej klickbara
  o.push(`<g class="pm-bg">${box(I, 12, 18, 2, 2, 14, 'f-0', 0)}${box(I, 36, 18, 2, 2, 14, 'f-0', 0)}${box(I, 1.4, 0, 6.6, 1, 11, 'f-0')}${box(I, 17, 0, 19, 1, 11, 'f-0')}</g>`);
  ['p2', 'p4', 'p3', 'p1'].forEach((k) => {
    const ob = OBJ.find((x) => x.id === k);
    o.push(`<g class="pm-obj${k === 'p1' ? ' is-on' : ''}" data-o="${k}"><title>${esc(ob.name)}</title>${obj[k]}</g>`);
  });
  // nålar
  const pinAt = { p1: [25, 19, 16], p2: [0.7, 12, 11], p3: [25, 21, 1.6], p4: [12.5, 0.5, 8] };
  Object.entries(pinAt).forEach(([k, p]) => {
    const [x, y] = P(...p);
    const ob = OBJ.find((v) => v.id === k);
    const open = ob.todo.filter((t) => !t[1]).length;
    o.push(`<g class="pm-pin${k === 'p1' ? ' is-on' : ''}" data-o="${k}"><path d="M${f1(x)} ${f1(y)} c-2.4 -7 -9.6 -12 -9.6 -19 a9.6 9.6 0 0 1 19.2 0 c0 7 -7.2 12 -9.6 19 z"/><text x="${f1(x)}" y="${f1(y - 15.5)}">${open}</text></g>`);
  });
  return `<svg class="ill pm-svg" viewBox="0 0 560 400" role="img" aria-label="Generisk modell med fyra objekt som har att göra-punkter"><title>Modell med fyra objekt</title>${o.join('')}</svg>`;
}
function photo(kind) {
  // Egenritat "foto" i samma linjestil som modellen: ram med passmärken och objektet i perspektiv
  const o = ['<rect class="ph-bg" x="0.5" y="0.5" width="159" height="99" rx="2"/>', '<path class="ph-m" d="M6 14 V6 H14 M146 6 H154 V14 M154 86 V94 H146 M14 94 H6 V86"/>', '<path class="ph-g" d="M0 72 L160 64"/>'];
  if (kind === 'pelare') o.push('<path class="ph-o" d="M74 70 V18 L84 15 V68 Z M84 15 L89 17 V69 L84 68"/><path class="ph-l" d="M60 74 L98 70 L108 73 L70 78 Z"/>');
  if (kind === 'vagg') o.push('<path class="ph-o" d="M22 74 V32 L130 22 V66 Z"/><path class="ph-l" d="M58 71 V29 M94 68 V26"/>');
  if (kind === 'fund') o.push('<path class="ph-o" d="M44 74 L110 70 L124 76 L58 81 Z M44 74 V66 L110 62 V70 M110 62 L124 68 V76"/><path class="ph-l" d="M74 67 V56 M84 66 V55 M94 66 V55"/>');
  if (kind === 'port') o.push('<path class="ph-o" d="M40 72 V24 L118 18 V66 Z"/><path class="ph-l" d="M40 36 L118 30 M40 48 L118 42 M40 60 L118 54"/>');
  return `<svg class="pm-photo" viewBox="0 0 160 100" aria-hidden="true" focusable="false">${o.join('')}</svg><p class="pm-cap">Foto · geotaggat · SWEREF 99</p>`;
}
function sheet(nr) {
  return `<svg class="pm-sheet" viewBox="0 0 140 100" aria-hidden="true" focusable="false"><rect class="sh-b" x="1" y="1" width="138" height="98"/><rect class="sh-l" x="6" y="6" width="128" height="88"/><line class="sh-l" x1="20" y1="30" x2="90" y2="30"/><line class="sh-l" x1="20" y1="30" x2="20" y2="74"/><line class="sh-l" x1="90" y1="30" x2="90" y2="74"/><line class="sh-l" x1="20" y1="74" x2="90" y2="74"/><rect class="sh-t" x="96" y="72" width="38" height="22"/><text class="sh-n" x="100" y="86">${esc(nr)}</text></svg>`;
}
function pmPanel(ob, on) {
  const todo = ob.todo.map(([t, done]) => `<li class="${done ? 'is-done' : ''}"><span class="pm-ck" aria-hidden="true"></span>${esc(t)}<span class="vh">${done ? ' (klar)' : ' (öppen)'}</span></li>`).join('');
  return `<div class="pm-panel" data-o="${ob.id}"${on ? '' : ' hidden'}>
  <p class="pm-k">Objekt</p><p class="pm-name">${esc(ob.name)} <span>${esc(ob.typ)}</span></p>
  <p class="pm-k">Att göra</p><ul class="pm-todo">${todo}</ul>
  <div class="pm-media"><figure><p class="pm-k">Ritning</p>${sheet(ob.rit)}</figure><figure><p class="pm-k">Foto</p>${photo(ob.foto)}</figure></div>
</div>`;
}
function platsminne() {
  const list = OBJ.map((ob, i) => `<li><button type="button" class="pm-btn" data-o="${ob.id}" aria-pressed="${i === 0}">${esc(ob.name)}<span>${ob.todo.filter((t) => !t[1]).length} öppna</span></button></li>`).join('');
  return `<div class="demo dpm" data-demo="platsminne">
  <div class="dpm-model">${pmModel()}<ul class="pm-list js-only" aria-label="Välj objekt">${list}</ul></div>
  <div class="dpm-side" aria-live="polite">${OBJ.map((ob, i) => pmPanel(ob, i === 0)).join('')}</div>
  <p class="demo-hint js-only">Välj ett objekt i modellen eller i listan.</p>
</div>`;
}

/* ---------- E. Sortera leveransen ---------- */
// Område per fil: fast fördelning i demon. Verktygets egen regel visas inte.
const AREAS = ['A', 'B', 'C'];
const FILES = Array.from({ length: 24 }, (_, i) => ({ nr: 'RIT-' + String(i + 1).padStart(3, '0'), area: AREAS[[0, 1, 2, 1, 0, 2, 2, 0, 1, 0, 1, 2, 1, 0, 2, 0, 1, 2, 2, 1, 0, 1, 2, 0][i]] }));
function sortera() {
  const file = (f, i) => `<li class="so-f" data-i="${i}" data-area="${f.area}"><i>RIT-</i><span>${f.nr.slice(4)}</span><i>.pdf</i></li>`;
  const binders = AREAS.map((a) => {
    const fs = FILES.map((f, i) => [f, i]).filter(([f]) => f.area === a);
    return `<div class="so-b" data-area="${a}"><p class="so-bh"><span class="so-sp" aria-hidden="true"></span>Pärm · Område ${a}<b class="so-n">${fs.length}</b></p><ol class="so-files">${fs.map(([f, i]) => file(f, i)).join('')}</ol></div>`;
  }).join('');
  return `<div class="demo dso is-sorted" data-demo="sortera">
  <div class="so-heap"><p class="so-k">Leverans <b class="so-left">0</b> <span>filer kvar</span></p><ol class="so-files so-pile"></ol></div>
  <div class="so-binders">${binders}</div>
  <div class="demo-ctrl js-only"><p class="so-read" aria-live="polite">24 filer i leveransen.</p><button type="button" class="btn-s btn-run" data-run>Kör</button><button type="button" class="btn-s" data-reset>Återställ</button></div>
</div>`;
}

module.exports = { flytta, kaskad, platsminne, sortera, KASKAD, load };
