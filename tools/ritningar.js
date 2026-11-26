/*
  Egenritade SVG-illustrationer. Alla färger sätts med klasser i css/style.css
  (tokens), så att ritningarna följer ljust och mörkt läge och de mörka scenerna.
  Inga projektdata: generisk hall, generiska aktiviteter.
*/
'use strict';

const f1 = (n) => (Math.round(n * 10) / 10).toString();
const C = Math.cos(Math.PI / 6);
function iso(S, ox = 0, oy = 0) {
  const P = (x, y, z) => [(x - y) * C * S + ox, (x + y) * 0.5 * S - z * S + oy];
  const pts = (arr) => arr.map((p) => P(...p).map(f1).join(',')).join(' ');
  return { P, pts };
}
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------------- Tidplan för hallen (hero och demo B) ---------------- */
const WEEKS = 24;
const NOW = 18;
const ACTS = [
  { id: 1, name: 'Grundläggning', s: 1, e: 4 },
  { id: 2, name: 'Pelare', s: 4, e: 8 },
  { id: 3, name: 'Balkar', s: 6, e: 10 },
  { id: 4, name: 'Takstolar', s: 9, e: 13 },
  { id: 5, name: 'Takplåt', s: 12, e: 16 },
  { id: 6, name: 'Väggar', s: 13, e: 18, as: 15, ae: 22 },
  { id: 7, name: 'Portar och aggregat', s: 20, e: 23 },
];
ACTS.forEach((a) => { if (!a.as) a.as = a.s; if (!a.ae) a.ae = a.e; });

// Statuslogiken läses ur js/plan-state.js, samma fil som sidans skript använder
const PS = (() => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'plan-state.js'), 'utf8').replace(/^export /gm, '');
  return new Function(src + '\nreturn { elState, rowState, summary };')();
})();
const elState = (a, pw, aw, w) => PS.elState(pw, aw, a.ae, w);
const rowState = PS.rowState;

/* Hallen. id = prefix för id-attribut så att den kan finnas flera gånger. */
function hall(id = 'bldg', opts = {}) {
  const I = iso(5.4);
  const rec = [];
  const P = (x, y, z) => { const r = I.P(x, y, z); rec.push(r); return r; };
  const pts = (arr) => arr.map((p) => P(...p).map(f1).join(',')).join(' ');
  const L = 48, W = 24, H = 12, R = 15;
  const ln = (p, q, k) => { const [x1, y1] = P(...p); const [x2, y2] = P(...q); return `<line class="${k}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/>`; };
  const pg = (arr, k) => `<polygon${k ? ` class="${k}"` : ''} points="${pts(arr)}"/>`;
  const pl = (arr, k) => `<polyline class="${k}" points="${pts(arr)}"/>`;
  const by = {};
  const add = (a, shape) => (by[a] = by[a] || []).push(shape);

  for (let i = 0; i < 4; i++) add(1, pg([[12 * i, 0, 0], [12 * i + 12, 0, 0], [12 * i + 12, W, 0], [12 * i, W, 0]], 'k-slab'));
  for (let i = 3; i >= 0; i--) add(6, pg([[12 * i, 0, 0], [12 * i + 12, 0, 0], [12 * i + 12, 0, H], [12 * i, 0, H]], 'k-wall'));
  add(6, pg([[0, 0, 0], [0, 12, 0], [0, 12, R], [0, 0, H]], 'k-wall'));
  add(6, pg([[0, 12, 0], [0, W, 0], [0, W, H], [0, 12, R]], 'k-wall'));
  [1, 3].forEach((i) => {
    const x0 = 12 * i + 3;
    add(7, `<g class="k-door">${pg([[x0, 0, 0], [x0 + 6, 0, 0], [x0 + 6, 0, 6.5], [x0, 0, 6.5]])}${[1.6, 3.2, 4.8].map((z) => ln([x0, 0, z], [x0 + 6, 0, z], 'k-in')).join('')}</g>`);
  });
  for (let x = 0; x <= L; x += 12) for (const y of [0, 12, 24]) add(2, ln([x, y, 0], [x, y, y === 12 ? R : H], 'k-col'));
  for (let i = 0; i < 4; i++) for (const y of [0, 24, 12]) add(3, ln([12 * i, y, y === 12 ? R : H], [12 * i + 12, y, y === 12 ? R : H], 'k-beam'));
  for (let x = 0; x <= L; x += 12) add(4, pl([[x, 0, H], [x, 12, R], [x, W, H]], 'k-raft'));
  for (let i = 0; i < 4; i++) {
    add(5, pg([[12 * i, 0, H], [12 * i + 12, 0, H], [12 * i + 12, 12, R], [12 * i, 12, R]], 'k-roof'));
    add(5, pg([[12 * i, 12, R], [12 * i + 12, 12, R], [12 * i + 12, W, H], [12 * i, W, H]], 'k-roof'));
  }
  const unit = (x0, y0) => {
    const zr = (y) => R - (y - 12) * (3 / 12);
    const z0 = zr(y0 + 4) + 0.2, z1 = z0 + 2.2, w = 5, d = 3.5;
    return `<g class="k-unit">${pg([[x0, y0 + d, z0], [x0 + w, y0 + d, z0], [x0 + w, y0 + d, z1], [x0, y0 + d, z1]])}${pg([[x0 + w, y0, z0], [x0 + w, y0 + d, z0], [x0 + w, y0 + d, z1], [x0 + w, y0, z1]])}${pg([[x0, y0, z1], [x0 + w, y0, z1], [x0 + w, y0 + d, z1], [x0, y0 + d, z1]])}</g>`;
  };
  add(7, unit(9, 14));
  add(7, unit(31, 14));

  const tagged = {};
  const late = {};
  for (const a of ACTS) {
    const list = by[a.id];
    const ps = a.e - a.s + 1, as = a.ae - a.as + 1;
    tagged[a.id] = list.map((shape, i) => {
      const pw = a.s + Math.floor((i * ps) / list.length);
      const aw = a.as + Math.floor((i * as) / list.length);
      const st = elState(a, pw, aw, NOW);
      if (st === 'l') late[a.id] = true;
      return shape.replace(/^<(\w+) class="([^"]*)"/, (m, tag, k) => `<${tag} class="el ${st} ${k}" data-a="${a.id}" data-pw="${pw}" data-w="${aw}"`);
    });
  }
  const t7 = tagged[7];
  const seq = [...tagged[1], ...tagged[6], t7[0], t7[1], ...tagged[2], ...tagged[3], ...tagged[4], ...tagged[5], t7[2], t7[3]];

  const grid = [];
  for (let x = 0; x <= L; x += 12) grid.push(ln([x, -5, 0], [x, W + 7, 0], 'ax'));
  for (const y of [0, 12, 24]) grid.push(ln([-5, y, 0], [L + 7, y, 0], 'ax'));
  const bub = [];
  for (let i = 0; i < 5; i++) { const [x, y] = P(12 * i, W + 10, 0); bub.push(`<circle class="bub" cx="${f1(x)}" cy="${f1(y)}" r="7.5"/><text class="bt" x="${f1(x)}" y="${f1(y + 3.2)}">${i + 1}</text>`); }
  ['A', 'B', 'C'].forEach((ch, i) => { const [x, y] = P(L + 10, 12 * i, 0); bub.push(`<circle class="bub" cx="${f1(x)}" cy="${f1(y)}" r="7.5"/><text class="bt" x="${f1(x)}" y="${f1(y + 3.2)}">${ch}</text>`); });
  const d1 = P(0, W + 16, 0), d2 = P(L, W + 16, 0);
  const dim = `<g class="dim"><line x1="${f1(d1[0])}" y1="${f1(d1[1])}" x2="${f1(d2[0])}" y2="${f1(d2[1])}"/>${[d1, d2].map((d) => `<line x1="${f1(d[0] - 3)}" y1="${f1(d[1] + 3)}" x2="${f1(d[0] + 3)}" y2="${f1(d[1] - 3)}"/>`).join('')}</g>`;

  const xs = rec.map((r) => r[0]), ys = rec.map((r) => r[1]);
  const minX = Math.floor(Math.min(...xs)) - 12, maxX = Math.ceil(Math.max(...xs)) + 12;
  const minY = Math.floor(Math.min(...ys)) - 10, maxY = Math.ceil(Math.max(...ys)) + 12;
  const label = opts.label || 'Axonometrisk ritning av en generisk industrihall';
  const desc = opts.desc || `Hallens delar får statusfärg efter tidplanens vecka: planerad, pågår, klar eller försenad. I vecka ${NOW} ligger väggarna efter plan.`;
  const svg = `<svg class="bldg" id="${id}" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" role="img" aria-labelledby="${id}-t ${id}-d">
<title id="${id}-t">${label}</title>
<desc id="${id}-d">${desc}</desc>
<g class="grid" aria-hidden="true">${grid.join('')}</g>
<g class="parts">${seq.join('\n')}</g>
<g aria-hidden="true">${bub.join('')}${dim}</g>
</svg>`;
  return { svg, late };
}

const summary = PS.summary;

function gantt(late) {
  const ticks = [1, 4, 8, 12, 16, 20, 24].map((w) => `<span${[4, 12, 20].includes(w) ? ' class="t-minor"' : ''} style="--t:${w}">V${String(w).padStart(2, '0')}</span>`).join('');
  const c = { d: 0, o: 0, l: 0, p: 0 };
  const rows = ACTS.map((a) => {
    const st = rowState(a, NOW, !!late[a.id]);
    c[st]++;
    const dw = Math.max(0, Math.min(NOW - a.as + 1, a.ae - a.as + 1));
    const tail = a.ae > a.e ? '<span class="g-late"></span>' : '';
    const hasLate = a.ae > a.e && NOW > a.e ? ' has-late' : '';
    return `<li class="g-row is-${st}${hasLate}" data-s="${a.s}" data-e="${a.e}" data-as="${a.as}" data-ae="${a.ae}" style="--s:${a.s};--e:${a.e};--as:${a.as};--ae:${a.ae};--dw:${dw}"><span class="g-lab">${a.name}</span><span class="g-track"><span class="g-plan"></span><span class="g-prog"></span>${tail}</span></li>`;
  }).join('\n');
  return { ticks, rows, counts: c, valuetext: `Vecka ${NOW} av ${WEEKS}, nuläge: ${summary(c)}` };
}

/* ---------------- Före/Efter (fasad i två byggfaser) ---------------- */
function elevation(phase) {
  const gy = 300, x0 = 60, bay = 104, n = 5, eave = 132, ridge = 112;
  const xs = Array.from({ length: n + 1 }, (_, i) => x0 + i * bay);
  const o = [];
  o.push(`<line class="gnd" x1="20" y1="${gy}" x2="620" y2="${gy}"/>`);
  for (let x = 24; x < 620; x += 14) o.push(`<line class="hatch" x1="${x}" y1="${gy + 2}" x2="${x - 8}" y2="${gy + 10}"/>`);
  xs.forEach((x, i) => { o.push(`<line class="ax" x1="${x}" y1="${gy + 8}" x2="${x}" y2="${gy + 26}"/><circle class="bub" cx="${x}" cy="${gy + 36}" r="9"/><text class="bt" x="${x}" y="${gy + 40}">${i + 1}</text>`); });
  if (phase === 'early') {
    xs.forEach((x) => o.push(`<rect class="st-d" x="${x - 9}" y="${gy - 4}" width="18" height="8"/>`));
    o.push(`<polyline class="st-p" points="${x0},${gy} ${x0},${eave} ${xs[n]},${eave} ${xs[n]},${gy}"/>`);
    xs.slice(2).forEach((x) => o.push(`<line class="st-p" x1="${x}" y1="${gy}" x2="${x}" y2="${eave}"/>`));
    xs.slice(0, 3).forEach((x) => o.push(`<line class="st-o col" x1="${x}" y1="${gy - 4}" x2="${x}" y2="${eave}"/>`));
    o.push(`<line class="st-o beam" x1="${xs[0]}" y1="${eave}" x2="${xs[1]}" y2="${eave}"/>`);
    const cx = 470, cy = gy - 4;
    o.push(`<g class="eq"><rect x="${cx - 46}" y="${cy - 16}" width="92" height="16" rx="3"/><circle cx="${cx - 34}" cy="${cy - 2}" r="5"/><circle cx="${cx + 34}" cy="${cy - 2}" r="5"/><circle cx="${cx}" cy="${cy - 2}" r="5"/><rect x="${cx - 20}" y="${cy - 36}" width="40" height="20"/><line x1="${cx - 8}" y1="${cy - 30}" x2="${xs[3] - 6}" y2="62"/><line x1="${cx + 6}" y1="${cy - 30}" x2="${xs[3] - 6}" y2="62"/><line x1="${xs[3] - 6}" y1="62" x2="${xs[3] - 6}" y2="170"/><rect x="${xs[3] - 10}" y="170" width="8" height="8"/><line class="load" x1="${xs[3] - 2}" y1="186" x2="${xs[3] - 2}" y2="268"/></g>`);
    o.push(`<g class="eq">${[0, 1, 2].map((k) => `<rect x="${xs[1] + 26}" y="${gy - 8 - k * 7}" width="54" height="6"/>`).join('')}</g>`);
    o.push(`<g class="tag"><rect x="20" y="20" width="122" height="28" rx="2"/><text x="32" y="39">FÖRE · V 06</text></g>`);
  } else {
    o.push(`<polygon class="st-d roofband" points="${x0 - 6},${eave} ${x0 + 30},${ridge} ${xs[n] - 30},${ridge} ${xs[n] + 6},${eave}"/>`);
    o.push(`<rect class="st-d" x="${x0}" y="${eave}" width="${n * bay}" height="${gy - eave}"/>`);
    for (let x = x0 + 13; x < xs[n]; x += 13) o.push(`<line class="rib" x1="${x}" y1="${eave + 4}" x2="${x}" y2="${gy}"/>`);
    o.push(`<rect class="win" x="${x0 + 8}" y="${eave + 14}" width="${n * bay - 16}" height="16"/>`);
    [1, 3].forEach((i) => { const x = xs[i] + 22; o.push(`<g class="door"><rect x="${x}" y="${gy - 96}" width="60" height="96"/>${[1, 2, 3, 4, 5].map((k) => `<line x1="${x}" y1="${gy - 96 + k * 16}" x2="${x + 60}" y2="${gy - 96 + k * 16}"/>`).join('')}</g>`); });
    o.push(`<rect class="st-d" x="${xs[4] + 30}" y="${gy - 60}" width="26" height="60"/>`);
    o.push(`<rect class="st-d" x="${xs[1] + 10}" y="${ridge - 18}" width="50" height="18"/><rect class="st-d" x="${xs[3] + 10}" y="${ridge - 18}" width="50" height="18"/>`);
    o.push(`<g class="tag"><rect x="490" y="20" width="130" height="28" rx="2"/><text x="502" y="39">EFTER · V 22</text></g>`);
  }
  return `<svg viewBox="0 0 640 360" aria-hidden="true" focusable="false">${o.join('')}</svg>`;
}

/* ---------------- Gemensamma byggstenar ---------------- */
// Låda i isometri, klass k styr fyllning (f-d, f-o, f-l, f-p, f-0)
function box(I, x0, y0, w, d, h, k, z0 = 0) {
  const { pts } = I;
  return `<g class="${k}"><polygon points="${pts([[x0, y0 + d, z0], [x0 + w, y0 + d, z0], [x0 + w, y0 + d, z0 + h], [x0, y0 + d, z0 + h]])}"/><polygon points="${pts([[x0 + w, y0, z0], [x0 + w, y0 + d, z0], [x0 + w, y0 + d, z0 + h], [x0 + w, y0, z0 + h]])}"/><polygon points="${pts([[x0, y0, z0 + h], [x0 + w, y0, z0 + h], [x0 + w, y0 + d, z0 + h], [x0, y0 + d, z0 + h]])}"/></g>`;
}
const svgWrap = (vb, body, cls = '') => `<svg class="ill${cls ? ' ' + cls : ''}" viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;
const txt = (x, y, s, k = 't') => `<text class="${k}" x="${f1(x)}" y="${f1(y)}">${esc(s)}</text>`;

/* ---------------- Flaggskeppet: tre bilder ---------------- */
// 2. Montageordning: stomme med numrerade lyft
function flagMontage() {
  const I = iso(8.2, 250, 150);
  const { P } = I;
  const o = [];
  const L = 48, W = 18, H = 12;
  o.push(`<polygon class="slab" points="${I.pts([[-2, -2, 0], [L + 2, -2, 0], [L + 2, W + 2, 0], [-2, W + 2, 0]])}"/>`);
  const cols = [];
  for (let x = 0; x <= L; x += 12) for (const y of [0, W]) cols.push([x, y]);
  // Ordning: axel för axel
  cols.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const done = 6;
  const seg = (p, q, k) => { const [x1, y1] = P(...p), [x2, y2] = P(...q); return `<line class="${k}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/>`; };
  cols.forEach(([x, y], i) => {
    const k = i < done ? 'm-d' : i === done ? 'm-o' : 'm-p';
    o.push(seg([x, y, 0], [x, y, H], 'col ' + k));
  });
  for (let x = 0; x < L; x += 12) for (const y of [0, W]) {
    const i = cols.findIndex((c) => c[0] === x + 12 && c[1] === y);
    o.push(seg([x, y, H], [x + 12, y, H], 'beam ' + (i < done ? 'm-d' : 'm-p')));
  }
  for (let x = 0; x <= L; x += 12) {
    const i = cols.findIndex((c) => c[0] === x && c[1] === W);
    o.push(seg([x, 0, H], [x, W, H], 'beam ' + (i < done ? 'm-d' : 'm-p')));
  }
  // Ordningsnummer och sekvenslinje
  const path = [];
  cols.forEach(([x, y], i) => {
    const [bx, by] = P(x, y, H + 4.2);
    path.push(`${f1(bx)} ${f1(by)}`);
  });
  o.push(`<path class="seq" d="M${path.join(' L')}"/>`);
  cols.forEach(([x, y], i) => {
    const [bx, by] = P(x, y, H + 4.2);
    const k = i < done ? 'n-d' : i === done ? 'n-o' : 'n-p';
    o.push(`<g class="${k}"><circle cx="${f1(bx)}" cy="${f1(by)}" r="11"/><text x="${f1(bx)}" y="${f1(by + 4)}">${i + 1}</text></g>`);
  });
  o.push(txt(60, 440, 'MONTAGEORDNING · 7 AV 10', 't'));
  const lg = [['n-d', 'Monterad'], ['n-o', 'Nästa'], ['n-p', 'Kvar']];
  lg.forEach(([k, l], i) => o.push(`<g class="${k}"><circle cx="${65 + i * 118}" cy="461" r="6"/></g>${txt(78 + i * 118, 465, l.toUpperCase(), 't')}`));
  return svgWrap('0 0 800 500', o.join(''));
}

// 3. Lägesbild med skyltar i 3D, exporterad som IFC till Trimble Connect
function flagLagesbild() {
  const I = iso(8, 160, 170);
  const { P } = I;
  const o = [];
  o.push(`<polygon class="slab" points="${I.pts([[-3, -3, 0], [39, -3, 0], [39, 15, 0], [-3, 15, 0]])}"/>`);
  ['f-d', 'f-d', 'f-o', 'f-l', 'f-l', 'f-p'].forEach((k, i) => o.push(box(I, i * 6, 0, 6, 12, 10, k)));
  const sign = (p, lab, sub, k) => {
    const [x, y] = P(...p);
    const w = 150;
    return `<g class="sign ${k}"><line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x)}" y2="${f1(y - 56)}"/><rect x="${f1(x - 8)}" y="${f1(y - 96)}" width="${w}" height="42" rx="2"/><rect class="sign-k" x="${f1(x - 8)}" y="${f1(y - 96)}" width="5" height="42"/>${txt(x + 6, y - 79, lab, 't t-ink')}${txt(x + 6, y - 63, sub, 't')}<circle class="sign-p" cx="${f1(x)}" cy="${f1(y)}" r="3"/></g>`;
  };
  o.push(sign([3, 6, 10], 'GRUNDLÄGGNING', 'KLAR', 'sg-d'));
  o.push(sign([21, 6, 10], 'VÄGGAR', 'FÖRSENAD 3 V', 'sg-l'));
  // export
  const ex = 520, ey = 200;
  o.push(`<path class="flow" d="M430 ${ey + 40} H${ex - 8}"/><path class="arrowh" d="M${ex - 16} ${ey + 34} L${ex - 6} ${ey + 40} L${ex - 16} ${ey + 46}"/>`);
  o.push(`<g class="chip"><rect x="${ex}" y="${ey}" width="220" height="80" rx="6"/></g>`);
  o.push(txt(ex + 18, ey + 30, 'IFC', 't t-ink') + txt(ex + 18, ey + 52, 'SKYLTAR OCH ETIKETTER', 't') + txt(ex + 18, ey + 68, 'SWEREF 99', 't'));
  o.push(`<path class="flow" d="M${ex + 110} ${ey + 80} V${ey + 128}"/><path class="arrowh" d="M${ex + 104} ${ey + 120} L${ex + 110} ${ey + 130} L${ex + 116} ${ey + 120}"/>`);
  o.push(`<g class="chip chip-b"><rect x="${ex}" y="${ey + 134}" width="220" height="56" rx="6"/></g>`);
  o.push(txt(ex + 18, ey + 167, 'TRIMBLE CONNECT', 't t-ink'));
  o.push(txt(60, 440, 'LÄGESBILD · SKYLTAR I 3D', 't'));
  return svgWrap('0 0 800 500', o.join(''));
}

/* ---------------- Projektkort ---------------- */
function cardTC() {
  const I = iso(6.2, 250, 70);
  const { P, pts } = I;
  const o = [];
  const d = (arr) => 'M' + arr.map((p) => P(...p).map(f1).join(' ')).join(' L') + ' Z';
  o.push(`<polygon class="slab" points="${pts([[0, 0, 0], [44, 0, 0], [44, 30, 0], [0, 30, 0]])}"/>`);
  o.push(`<g data-f="pdf"><polygon class="sheet" points="${pts([[3, 3, 0], [31, 3, 0], [31, 25, 0], [3, 25, 0]])}"/>`);
  for (let k = 1; k < 5; k++) { const a = P(6, 3 + k * 4, 0), b = P(22, 3 + k * 4, 0); o.push(`<line class="sheet-l" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"/>`); }
  o.push(`<polygon class="sheet-l" points="${pts([[23, 19, 0], [31, 19, 0], [31, 25, 0], [23, 25, 0]])}"/>`);
  [[3, 25], [31, 25]].forEach(([x, y]) => { const [a, b] = P(x, y, 0); o.push(`<g class="calx"><circle cx="${f1(a)}" cy="${f1(b)}" r="6"/><line x1="${f1(a - 11)}" y1="${f1(b)}" x2="${f1(a + 11)}" y2="${f1(b)}"/><line x1="${f1(a)}" y1="${f1(b - 11)}" x2="${f1(a)}" y2="${f1(b + 11)}"/></g>`); });
  o.push('</g>');
  const poly = [[10, 17, 0], [26, 16, 0], [40, 21, 0], [32, 28, 0], [12, 27, 0]];
  o.push(`<g data-f="mangd"><path class="qty" d="${d(poly)}"/>`);
  poly.forEach((p) => { const [x, y] = P(...p); o.push(`<rect class="vtx" x="${f1(x - 3)}" y="${f1(y - 3)}" width="6" height="6"/>`); });
  o.push('</g>');
  o.push(`<g data-f="etikett">${box(I, 6, 5, 14, 8, 6, 'f-0')}${box(I, 26, 5, 10, 7, 3.5, 'f-0')}`);
  const [ex, ey] = P(20, 5, 6);
  o.push(`<line class="ln2" x1="${f1(ex)}" y1="${f1(ey)}" x2="${f1(ex + 40)}" y2="${f1(ey - 34)}"/><g class="chip"><rect x="${f1(ex + 40)}" y="${f1(ey - 50)}" width="110" height="30" rx="3"/></g>${txt(ex + 50, ey - 31, 'BETONG C30/37', 't t-ink')}</g>`);
  const pin = (p, k) => { const [x, y] = P(...p); return `<path class="pin ${k}" d="M${f1(x)} ${f1(y)} c-2.4 -7 -9.6 -12 -9.6 -19 a9.6 9.6 0 0 1 19.2 0 c0 7 -7.2 12 -9.6 19 z"/><circle class="pin-c" cx="${f1(x)}" cy="${f1(y - 19)}" r="3"/>`; };
  o.push(`<g data-f="foto">${pin([13, 9, 6], 'pin-o')}${pin([20, 23, 0], 'pin-d')}</g>`);
  o.push(`<g data-f="platsminnet">${pin([31, 8.5, 3.5], 'pin-l')}</g>`);
  // annotering: molnmarkering
  const [ax, ay] = P(40, 8, 0);
  o.push(`<g data-f="annotering"><ellipse class="cloud" cx="${f1(ax)}" cy="${f1(ay)}" rx="34" ry="18"/><path class="cloud" d="M${f1(ax + 30)} ${f1(ay - 12)} l28 -26"/></g>`);
  // länk
  o.push(txt(40, 290, 'SWEREF 99 · PDF · FOTO · MÄNGD', 't'));
  return svgWrap('0 0 640 320', o.join(''));
}

function cardCockpit() {
  const o = [];
  // Tavla: tre kolumner med kort
  const cols = [['PLANERAD', 3, 'k-p'], ['PÅGÅR', 2, 'k-o'], ['KLAR', 3, 'k-d']];
  o.push('<g data-f="tavla">');
  cols.forEach(([t, n, k], c) => {
    const x = 40 + c * 92;
    o.push(txt(x, 46, t, 't'));
    for (let i = 0; i < n; i++) o.push(`<g class="card ${k}"><rect x="${x}" y="${58 + i * 46}" width="80" height="36" rx="3"/><rect class="card-k" x="${x}" y="${58 + i * 46}" width="4" height="36"/><line class="sheet-l" x1="${x + 12}" y1="${72 + i * 46}" x2="${x + 62}" y2="${72 + i * 46}"/><line class="sheet-l" x1="${x + 12}" y1="${82 + i * 46}" x2="${x + 44}" y2="${82 + i * 46}"/></g>`);
  });
  o.push('</g>');
  // Gantt med beroenden + kaskad
  const gx = 350, gy = 56, u = 22;
  const bars = [[0, 3], [3, 3], [6, 4], [6, 3], [10, 2]];
  o.push('<g data-f="gantt">');
  for (let i = 0; i <= 11; i++) o.push(`<line class="gl" x1="${gx + i * u}" y1="${gy - 10}" x2="${gx + i * u}" y2="${gy + 5 * 30}"/>`);
  bars.forEach(([s, l], i) => o.push(`<rect class="${i < 2 ? 'b-d' : i === 2 ? 'b-o' : 'b-p'}" x="${gx + s * u}" y="${gy + i * 30}" width="${l * u - 2}" height="12" rx="1.5"/>`));
  const dep = (a, b) => { const [s1, l1] = bars[a], [s2] = bars[b]; const x1 = gx + (s1 + l1) * u - 2, y1 = gy + a * 30 + 6, x2 = gx + s2 * u, y2 = gy + b * 30 + 6; return `<path class="dep" d="M${x1} ${y1} h6 V${y2} H${x2 - 2}"/>`; };
  o.push(dep(0, 1) + dep(1, 2) + dep(1, 3) + dep(2, 4));
  o.push('</g>');
  o.push(`<g data-f="kaskad"><rect class="ghost" x="${gx + 6 * u}" y="${gy + 2 * 30}" width="${4 * u - 2}" height="12" rx="1.5"/><path class="kask" d="M${gx + 6 * u + 4} ${gy + 2 * 30 - 6} h${2 * u - 8}"/><path class="arrowh acc-s" d="M${gx + 8 * u - 10} ${gy + 2 * 30 - 10} l6 4 l-6 4"/></g>`);
  // Heatmap
  o.push('<g data-f="heatmap">');
  const lv = [0, 1, 2, 2, 3, 3, 4, 3, 2, 2, 1, 1, 2, 3, 2, 1];
  lv.forEach((v, i) => o.push(`<rect class="hm hm-${v}" x="${40 + i * 35}" y="258" width="31" height="24" rx="2"/>`));
  o.push('</g>');
  return svgWrap('0 0 640 320', o.join(''));
}

function cardBinder() {
  const o = [];
  o.push('<g data-f="lasa">');
  for (let i = 7; i >= 0; i--) {
    const x = 50 + i * 6, y = 52 + i * 7;
    o.push(`<g class="paper"><rect x="${x}" y="${y}" width="104" height="140" rx="1"/><rect class="tb" x="${x + 64}" y="${y + 114}" width="34" height="20"/><line x1="${x + 12}" y1="${y + 22}" x2="${x + 70}" y2="${y + 22}"/><line x1="${x + 12}" y1="${y + 36}" x2="${x + 52}" y2="${y + 36}"/></g>`);
  }
  o.push(txt(50, 280, 'CA 240 PDF', 't'));
  o.push('</g>');
  const fromX = 236, fromY = 160;
  const tgt = [[400, 88], [400, 160], [400, 232]];
  o.push('<g data-f="sortera">');
  tgt.forEach(([x, y]) => o.push(`<path class="flow" d="M${fromX} ${fromY} C ${fromX + 70} ${fromY}, ${x - 80} ${y}, ${x - 8} ${y}"/><path class="arrowh" d="M${x - 16} ${y - 5} L${x - 6} ${y} L${x - 16} ${y + 5}"/>`));
  o.push(`<circle class="node" cx="${fromX}" cy="${fromY}" r="6"/></g>`);
  o.push('<g data-f="parm">');
  ['A', 'B', 'C'].forEach((lab, i) => {
    const [x, y] = tgt[i];
    const bx = x + 2, by = y - 26;
    o.push(`<g class="binder"><rect x="${bx}" y="${by}" width="170" height="52" rx="3"/><rect class="spine" x="${bx}" y="${by}" width="18" height="52" rx="2"/><circle cx="${bx + 9}" cy="${by + 26}" r="3.6"/>${txt(bx + 32, by + 22, 'OMRÅDE ' + lab, 't t-ink')}<line class="sheet-l" x1="${bx + 32}" y1="${by + 36}" x2="${bx + 140}" y2="${by + 36}"/></g>`);
  });
  o.push(txt(402, 296, 'PÄRM PER OMRÅDE', 't'));
  o.push('</g>');
  return svgWrap('0 0 640 320', o.join(''));
}

/* Case-bild för Tidplan i modellen: alla funktioner i en ritning, grupperade per funktion */
function caseTidplan() {
  const I = iso(7.2, 150, 150);
  const { P } = I;
  const o = [];
  o.push(`<polygon class="slab" points="${I.pts([[-3, -3, 0], [39, -3, 0], [39, 15, 0], [-3, 15, 0]])}"/>`);
  o.push('<g data-f="status">');
  ['f-d', 'f-d', 'f-o', 'f-l', 'f-p', 'f-p'].forEach((k, i) => o.push(box(I, i * 6, 0, 6, 12, 10, k)));
  o.push('</g>');
  o.push('<g data-f="montage">');
  [0, 1, 2, 3, 4, 5].forEach((i) => { const [x, y] = P(i * 6 + 3, 12, 0); o.push(`<g class="${i < 2 ? 'n-d' : i === 2 ? 'n-o' : 'n-p'}"><circle cx="${f1(x)}" cy="${f1(y + 16)}" r="9"/><text x="${f1(x)}" y="${f1(y + 20)}">${i + 1}</text></g>`); });
  o.push('</g>');
  const [sx, sy] = P(21, 6, 10);
  o.push(`<g data-f="skyltar"><g class="sign sg-l"><line x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(sx)}" y2="${f1(sy - 44)}"/><rect x="${f1(sx - 6)}" y="${f1(sy - 80)}" width="128" height="36" rx="2"/><rect class="sign-k" x="${f1(sx - 6)}" y="${f1(sy - 80)}" width="5" height="36"/>${txt(sx + 6, sy - 65, 'VÄGGAR', 't t-ink')}${txt(sx + 6, sy - 51, 'FÖRSENAD', 't')}<circle class="sign-p" cx="${f1(sx)}" cy="${f1(sy)}" r="3"/></g></g>`);
  // Gantt
  const gx = 470, gy = 64, rw = 270, rh = 26;
  o.push('<g data-f="gantt">');
  o.push(txt(gx, gy - 22, 'GANTT', 't'));
  for (let i = 0; i <= 12; i++) o.push(`<line class="gl" x1="${f1(gx + i * rw / 12)}" y1="${gy - 10}" x2="${f1(gx + i * rw / 12)}" y2="${gy + 6 * rh}"/>`);
  const bars = [[0, .22, 'b-d'], [.14, .38, 'b-d'], [.3, .58, 'b-o'], [.42, .7, 'b-l'], [.6, .84, 'b-p'], [.76, 1, 'b-p']];
  bars.forEach(([a, b, k], i) => o.push(`<rect class="${k}" x="${f1(gx + a * rw)}" y="${gy + i * rh}" width="${f1((b - a) * rw)}" height="11" rx="1.5"/>`));
  // tavla
  ['f-d', 'f-o', 'f-l', 'f-p'].forEach((k, i) => o.push(`<g class="card ${k.replace('f-', 'k-')}"><rect x="${gx + i * 68}" y="302" width="60" height="34" rx="3"/><rect class="card-k" x="${gx + i * 68}" y="302" width="4" height="34"/></g>`));
  o.push(txt(gx, 292, 'TAVLA', 't'));
  o.push('</g>');
  o.push(`<g data-f="serie"><path class="bracket" d="M${gx - 10} ${gy + 4 * rh - 2} h-6 v${2 * rh} h6"/>${txt(gx - 82, gy + 5 * rh + 2, 'SERIE', 't t-acc')}</g>`);
  const nx = gx + .55 * rw;
  o.push(`<g data-f="reglage"><line class="now" x1="${f1(nx)}" y1="${gy - 22}" x2="${f1(nx)}" y2="${gy + 6 * rh}"/>${txt(nx + 6, gy - 12, 'V 18', 't t-acc')}<line class="ln" x1="${gx}" y1="${gy + 6 * rh + 22}" x2="${gx + rw}" y2="${gy + 6 * rh + 22}"/><rect class="accf" x="${f1(nx - 7)}" y="${gy + 6 * rh + 15}" width="14" height="14" rx="2"/></g>`);
  o.push(`<g data-f="ifc"><g class="chip"><rect x="40" y="372" width="262" height="44" rx="4"/></g>${txt(56, 399, 'IFC · SWEREF 99 → TRIMBLE CONNECT', 't t-ink')}</g>`);
  return svgWrap('0 0 800 440', o.join(''));
}

function favicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#111418"/><path d="M18 17 L32 47 L46 17" fill="none" stroke="#F6F5F1" stroke-width="6" stroke-linejoin="miter"/><path d="M8 8 H18 M8 8 V18" stroke="#FF6A33" stroke-width="4"/><path d="M56 56 H46 M56 56 V46" stroke="#FF6A33" stroke-width="4"/></svg>`;
}

module.exports = {
  WEEKS, NOW, ACTS, elState, rowState, summary, hall, gantt, elevation,
  flagMontage, flagLagesbild, cardTC, cardCockpit, cardBinder, caseTidplan, favicon,
  iso, box, f1, esc, txt, svgWrap,
};
