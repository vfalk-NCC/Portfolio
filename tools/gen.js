#!/usr/bin/env node
/*
  Generator för index.html.  Kör:  node tools/gen.js
  - Läser tools/config.js (namn, e-post, LinkedIn, adress) och tools/index.src.html.
  - Ritar alla inline-SVG (hero, Före/Efter, verktygsillustrationer) och mini-Gantten.
  - Skriver ../index.html och ../img/favicon.svg.
  Redigera alltid index.src.html, aldrig index.html direkt.

  ACTS nedan styr både hallen och Gantten: s/e = planerad start/slut, as/ae = utfall.
  NOW är veckan som visas utan JavaScript och där uppspelningen stannar.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const config = require('./config');

const ROOT = path.join(__dirname, '..');
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const C = Math.cos(Math.PI / 6);
function iso(S, ox = 0, oy = 0) {
  const P = (x, y, z) => [(x - y) * C * S + ox, (x + y) * 0.5 * S - z * S + oy];
  const pts = (arr) => arr.map((p) => P(...p).map(f1).join(',')).join(' ');
  return { P, pts };
}
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isSet = (v) => typeof v === 'string' && v.trim() !== '' && v.trim()[0] !== '[';

/* ---------------- Tidplan ---------------- */
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

// Samma logik som i js/main.js
function elState(a, pw, aw, w) {
  if (aw <= w) return w > a.ae ? 'd' : 'o';
  if (pw <= w) return 'l';
  return 'p';
}
function rowState(a, w, anyLate) {
  if (w > a.ae) return 'd';
  if (anyLate || (w >= a.s && w < a.as) || w > a.e) return 'l';
  if (w >= a.as) return 'o';
  return 'p';
}

/* ---------------- Hero: generisk industrihall ---------------- */
function heroSvg() {
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
  // Väggar i montageordning: bakre långsidan först, sedan gaveln (som syns bäst och blir försenad)
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

  // Planerad och faktisk montagevecka per del
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
  const svg = `<svg class="bldg" id="bldg" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" role="img" aria-labelledby="bldg-t bldg-d">
<title id="bldg-t">Axonometrisk ritning av en generisk industrihall</title>
<desc id="bldg-d">Hallens delar får statusfärg efter tidplanens vecka: planerad, pågår, klar eller försenad. I vecka ${NOW} ligger väggarna efter plan.</desc>
<g class="grid" aria-hidden="true">${grid.join('')}</g>
<g class="parts">${seq.join('\n')}</g>
<g aria-hidden="true">${bub.join('')}${dim}</g>
</svg>`;
  return { svg, late };
}

const N = (n, one, many) => n + ' ' + (n === 1 ? one : many);
function summary(c) {
  const parts = [];
  if (c.d) parts.push(N(c.d, 'klar', 'klara'));
  if (c.o) parts.push(N(c.o, 'pågår', 'pågår'));
  if (c.l) parts.push(N(c.l, 'försenad', 'försenade'));
  if (c.p) parts.push(N(c.p, 'planerad', 'planerade'));
  return parts.join(', ');
}

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

/* ---------------- Verktygsillustrationer ---------------- */
function artKoppling() {
  const { P, pts } = iso(5.2, 92, 92);
  const st = ['d', 'd', 'o', 'p', 'p'];
  const box = (x0, y0, w, d, h, k) => `<g class="b-${k}"><polygon points="${pts([[x0, y0 + d, 0], [x0 + w, y0 + d, 0], [x0 + w, y0 + d, h], [x0, y0 + d, h]])}"/><polygon points="${pts([[x0 + w, y0, 0], [x0 + w, y0 + d, 0], [x0 + w, y0 + d, h], [x0 + w, y0, h]])}"/><polygon points="${pts([[x0, y0, h], [x0 + w, y0, h], [x0 + w, y0 + d, h], [x0, y0 + d, h]])}"/></g>`;
  const parts = st.map((k, i) => box(i * 6, 0, 6, 12, 9, k));
  const slab = `<polygon class="ln-fill" points="${pts([[-3, -3, 0], [33, -3, 0], [33, 15, 0], [-3, 15, 0]])}"/>`;
  const gx = 236, gy = 56, rw = 136, rh = 22;
  const g = [];
  g.push(`<path class="ln" pathLength="1" d="M${gx} ${gy - 14} H${gx + rw}"/>`);
  const bars = [[0, 0.28, 'd'], [0.18, 0.46, 'd'], [0.36, 0.7, 'o'], [0.6, 0.86, 'p'], [0.78, 1, 'p']];
  bars.forEach(([a, b, k], i) => g.push(`<rect class="g-${k}" x="${f1(gx + a * rw)}" y="${gy + i * rh}" width="${f1((b - a) * rw)}" height="10"/>`));
  const nx = gx + 0.55 * rw;
  g.push(`<line class="now" x1="${f1(nx)}" y1="${gy - 22}" x2="${f1(nx)}" y2="${gy + 5 * rh}"/><text class="mono" x="${f1(nx + 5)}" y="${gy - 20}">V 14</text>`);
  const [lx, ly] = P(15, 6, 9);
  const link = `<path class="link ln" pathLength="1" d="M${gx - 4} ${gy + 2 * rh + 5} C ${gx - 40} ${gy + 2 * rh + 5}, ${f1(lx + 30)} ${f1(ly)}, ${f1(lx)} ${f1(ly)}"/><circle class="node" cx="${f1(lx)}" cy="${f1(ly)}" r="3.5"/>`;
  return `<svg viewBox="0 0 400 240" aria-hidden="true" focusable="false"><g>${slab}${parts.join('')}</g>${link}${g.join('')}<text class="mono s" x="24" y="222">POWERPROJECT · P6 · MODELL</text></svg>`;
}

function artTC() {
  const { P, pts } = iso(4.3, 176, 52);
  const d = (arr) => 'M' + arr.map((p) => P(...p).map(f1).join(' ')).join(' L') + ' Z';
  const o = [];
  o.push(`<polygon class="ln-fill" points="${pts([[0, 0, 0], [44, 0, 0], [44, 30, 0], [0, 30, 0]])}"/>`);
  o.push(`<polygon class="sheet" points="${pts([[3, 3, 0], [31, 3, 0], [31, 25, 0], [3, 25, 0]])}"/>`);
  for (let k = 1; k < 5; k++) { const a = P(6, 3 + k * 4, 0), b = P(22, 3 + k * 4, 0); o.push(`<line class="sheet-l" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"/>`); }
  o.push(`<polygon class="sheet-l" points="${pts([[23, 19, 0], [31, 19, 0], [31, 25, 0], [23, 25, 0]])}"/>`);
  [[3, 25], [31, 25]].forEach(([x, y]) => { const [a, b] = P(x, y, 0); o.push(`<g class="calx"><circle cx="${f1(a)}" cy="${f1(b)}" r="5"/><line x1="${f1(a - 9)}" y1="${f1(b)}" x2="${f1(a + 9)}" y2="${f1(b)}"/><line x1="${f1(a)}" y1="${f1(b - 9)}" x2="${f1(a)}" y2="${f1(b + 9)}"/></g>`); });
  const poly = [[10, 17, 0], [26, 16, 0], [40, 21, 0], [32, 28, 0], [12, 27, 0]];
  o.push(`<path class="qty ln" pathLength="1" d="${d(poly)}"/>`);
  poly.forEach((p) => { const [x, y] = P(...p); o.push(`<rect class="vtx" x="${f1(x - 2.5)}" y="${f1(y - 2.5)}" width="5" height="5"/>`); });
  const box = (x0, y0, w, dd, h) => `<g class="b-m"><polygon points="${pts([[x0, y0 + dd, 0], [x0 + w, y0 + dd, 0], [x0 + w, y0 + dd, h], [x0, y0 + dd, h]])}"/><polygon points="${pts([[x0 + w, y0, 0], [x0 + w, y0 + dd, 0], [x0 + w, y0 + dd, h], [x0 + w, y0, h]])}"/><polygon points="${pts([[x0, y0, h], [x0 + w, y0, h], [x0 + w, y0 + dd, h], [x0, y0 + dd, h]])}"/></g>`;
  o.push(box(6, 5, 14, 8, 6));
  o.push(box(26, 5, 10, 7, 3.5));
  const pin = (p, k) => { const [x, y] = P(...p); return `<path class="pin pin-${k}" d="M${f1(x)} ${f1(y)} c-2 -6 -8 -10 -8 -16 a8 8 0 0 1 16 0 c0 6 -6 10 -8 16 z"/><circle class="pin-c" cx="${f1(x)}" cy="${f1(y - 16)}" r="2.6"/>`; };
  o.push(pin([13, 9, 6], 'o'), pin([31, 8.5, 3.5], 'l'), pin([20, 23, 0], 'd'));
  return `<svg viewBox="0 0 400 240" aria-hidden="true" focusable="false">${o.join('')}<text class="mono s" x="24" y="228">SWEREF 99 · PDF · FOTO · MÄNGD</text></svg>`;
}

function favicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#F5F3EE"/><rect x="7" y="7" width="50" height="50" fill="none" stroke="#16191D" stroke-width="4"/><path d="M19 18 L32 47 L45 18" fill="none" stroke="#16191D" stroke-width="6" stroke-linejoin="miter"/><path d="M3 3 H15 M3 3 V15" stroke="#E8551E" stroke-width="5"/></svg>`;
}
function elevation(phase) {
  const gy = 300, x0 = 60, bay = 104, n = 5, eave = 132, ridge = 112;
  const xs = Array.from({ length: n + 1 }, (_, i) => x0 + i * bay);
  const o = [];
  // Mark
  o.push(`<line class="gnd" x1="20" y1="${gy}" x2="620" y2="${gy}"/>`);
  for (let x = 24; x < 620; x += 14) o.push(`<line class="hatch" x1="${x}" y1="${gy + 2}" x2="${x - 8}" y2="${gy + 10}"/>`);
  // Axlar
  xs.forEach((x, i) => { o.push(`<line class="ax" x1="${x}" y1="${gy + 8}" x2="${x}" y2="${gy + 26}"/><circle class="bub" cx="${x}" cy="${gy + 36}" r="9"/><text class="bt" x="${x}" y="${gy + 40}">${i + 1}</text>`); });
  if (phase === 'early') {
    // Plintar klara
    xs.forEach((x) => o.push(`<rect class="st-d" x="${x - 9}" y="${gy - 4}" width="18" height="8"/>`));
    // Planerad stomme
    o.push(`<polyline class="st-p" points="${x0},${gy} ${x0},${eave} ${xs[n]},${eave} ${xs[n]},${gy}"/>`);
    xs.slice(2).forEach((x) => o.push(`<line class="st-p" x1="${x}" y1="${gy}" x2="${x}" y2="${eave}"/>`));
    // Resta pelare och en balk
    xs.slice(0, 3).forEach((x) => o.push(`<line class="st-o col" x1="${x}" y1="${gy - 4}" x2="${x}" y2="${eave}"/>`));
    o.push(`<line class="st-o beam" x1="${xs[0]}" y1="${eave}" x2="${xs[1]}" y2="${eave}"/>`);
    // Mobilkran
    const cx = 470, cy = gy - 4;
    o.push(`<g class="eq"><rect x="${cx - 46}" y="${cy - 16}" width="92" height="16" rx="3"/><circle cx="${cx - 34}" cy="${cy - 2}" r="5"/><circle cx="${cx + 34}" cy="${cy - 2}" r="5"/><circle cx="${cx}" cy="${cy - 2}" r="5"/><rect x="${cx - 20}" y="${cy - 36}" width="40" height="20"/><line x1="${cx - 8}" y1="${cy - 30}" x2="${xs[3] - 6}" y2="62"/><line x1="${cx + 6}" y1="${cy - 30}" x2="${xs[3] - 6}" y2="62"/><line x1="${xs[3] - 6}" y1="62" x2="${xs[3] - 6}" y2="170"/><rect x="${xs[3] - 10}" y="170" width="8" height="8"/><line class="load" x1="${xs[3] - 2}" y1="186" x2="${xs[3] - 2}" y2="268"/></g>`);
    // Upplag
    o.push(`<g class="eq">${[0, 1, 2].map((k) => `<rect x="${xs[1] + 26}" y="${gy - 8 - k * 7}" width="54" height="6"/>`).join('')}</g>`);
    o.push(`<g class="tag"><rect x="20" y="20" width="122" height="28"/><text x="32" y="39">FÖRE · V 06</text></g>`);
  } else {
    // Färdig fasad
    o.push(`<polygon class="st-d roofband" points="${x0 - 6},${eave} ${x0 + 30},${ridge} ${xs[n] - 30},${ridge} ${xs[n] + 6},${eave}"/>`);
    o.push(`<rect class="st-d" x="${x0}" y="${eave}" width="${n * bay}" height="${gy - eave}"/>`);
    for (let x = x0 + 13; x < xs[n]; x += 13) o.push(`<line class="rib" x1="${x}" y1="${eave + 4}" x2="${x}" y2="${gy}"/>`);
    // Fönsterband
    o.push(`<rect class="win" x="${x0 + 8}" y="${eave + 14}" width="${n * bay - 16}" height="16"/>`);
    // Portar
    [1, 3].forEach((i) => { const x = xs[i] + 22; o.push(`<g class="door"><rect x="${x}" y="${gy - 96}" width="60" height="96"/>${[1, 2, 3, 4, 5].map((k) => `<line x1="${x}" y1="${gy - 96 + k * 16}" x2="${x + 60}" y2="${gy - 96 + k * 16}"/>`).join('')}</g>`); });
    o.push(`<rect class="st-d" x="${xs[4] + 30}" y="${gy - 60}" width="26" height="60"/>`);
    // Aggregat på tak
    o.push(`<rect class="st-d" x="${xs[1] + 10}" y="${ridge - 18}" width="50" height="18"/><rect class="st-d" x="${xs[3] + 10}" y="${ridge - 18}" width="50" height="18"/>`);
    o.push(`<g class="tag"><rect x="490" y="20" width="130" height="28"/><text x="502" y="39">EFTER · V 22</text></g>`);
  }
  return `<svg viewBox="0 0 640 360" aria-hidden="true" focusable="false">${o.join('')}</svg>`;
}

function artBinder() {
  const o = [];
  // Hög med ark
  for (let i = 7; i >= 0; i--) {
    const x = 28 + i * 5, y = 44 + i * 6;
    o.push(`<g class="paper"><rect x="${x}" y="${y}" width="88" height="118"/><rect class="tb" x="${x + 54}" y="${y + 96}" width="30" height="18"/><line x1="${x + 10}" y1="${y + 18}" x2="${x + 60}" y2="${y + 18}"/><line x1="${x + 10}" y1="${y + 30}" x2="${x + 44}" y2="${y + 30}"/></g>`);
  }
  o.push(`<text class="mono s" x="28" y="214">CA 240 PDF</text>`);
  // Sortering
  const fromX = 150, fromY = 128;
  const tgt = [[262, 74], [262, 128], [262, 182]];
  tgt.forEach(([x, y]) => o.push(`<path class="link ln" pathLength="1" d="M${fromX} ${fromY} C ${fromX + 50} ${fromY}, ${x - 60} ${y}, ${x - 6} ${y}"/><path class="arrow" d="M${x - 12} ${y - 4} L${x - 4} ${y} L${x - 12} ${y + 4}"/>`));
  o.push(`<circle class="node" cx="${fromX}" cy="${fromY}" r="5"/>`);
  // Pärmar
  const labs = ['A', 'B', 'C'];
  const kk = ['d', 'd', 'o'];
  tgt.forEach(([x, y], i) => {
    const bx = x + 2, by = y - 22;
    o.push(`<g class="binder"><rect x="${bx}" y="${by}" width="112" height="44"/><rect class="spine sp-${kk[i]}" x="${bx}" y="${by}" width="16" height="44"/><circle cx="${bx + 8}" cy="${by + 22}" r="3.2"/><text class="mono" x="${bx + 26}" y="${by + 19}">OMRÅDE ${labs[i]}</text><line x1="${bx + 26}" y1="${by + 30}" x2="${bx + 96}" y2="${by + 30}"/></g>`);
  });
  return `<svg viewBox="0 0 400 240" aria-hidden="true" focusable="false">${o.join('')}<text class="mono s" x="264" y="226">PÄRM PER OMRÅDE</text></svg>`;
}


/* ---------------- Sätt ihop ---------------- */
function build() {
  const { person, url } = config;
  const hero = heroSvg();
  const g = gantt(hero.late);
  const nameText = isSet(person.efternamn) ? person.efternamn : '[EFTERNAMN]';
  const nameHtml = isSet(person.efternamn) ? esc(person.efternamn) : '<span class="ph">[EFTERNAMN]</span>';
  const epost = isSet(person.epost)
    ? `<a class="c-v" href="mailto:${esc(person.epost)}">${esc(person.epost)}</a>`
    : '<span class="c-v"><span class="ph">[E-POST]</span></span>';
  const li = isSet(person.linkedin) && /^https:\/\//.test(person.linkedin)
    ? `<a class="c-v" href="${esc(person.linkedin)}">${esc(person.linkedin.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`
    : '<span class="c-v"><span class="ph">[LINKEDIN]</span></span>';
  const rep = {
    URL: esc(url),
    NAME_TEXT: esc(nameText),
    NAME: nameHtml,
    EPOST: epost,
    LINKEDIN: li,
    YEAR: String(new Date().getFullYear()),
    NOW: String(NOW),
    NOW2: String(NOW).padStart(2, '0'),
    WEEKS: String(WEEKS),
    HERO: hero.svg,
    GANTT_TICKS: g.ticks,
    GANTT_ROWS: g.rows,
    C_D: String(g.counts.d), C_O: String(g.counts.o), C_L: String(g.counts.l), C_P: String(g.counts.p),
    VALUETEXT: g.valuetext,
    FORE: elevation('early'),
    EFTER: elevation('late'),
    ART_KOPPLING: artKoppling(),
    ART_TC: artTC(),
    ART_BINDER: artBinder(),
  };
  let src = fs.readFileSync(path.join(__dirname, 'index.src.html'), 'utf8');
  src = src.replace(/\{\{(\w+)\}\}/g, (m, k) => { if (!(k in rep)) throw new Error('Okänd platshållare ' + k); return rep[k]; });
  fs.writeFileSync(path.join(ROOT, 'index.html'), src);
  fs.writeFileSync(path.join(ROOT, 'img', 'favicon.svg'), favicon());
  fs.writeFileSync(path.join(__dirname, 'og-hero.svg'), hero.svg);
  console.log('Skrev index.html (' + src.length + ' tecken)');
}

module.exports = { ACTS, NOW, heroSvg };
if (require.main === module) build();
