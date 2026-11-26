/*
  Demo C: Kaskaden. Flytta en aktivitet – efterföljarna flyttas automatiskt
  (slut till start) och raden "Aktiviteter per vecka" räknas om. Generiska data.
  AI-delen i verktyget simuleras inte här.
*/
import { bindBar } from './gantt-drag.js';

const NS = 'http://www.w3.org/2000/svg';

export function init(root) {
  const W = +root.dataset.weeks;
  const rows = Array.from(root.querySelectorAll('.kg-row'));
  const acts = rows.map((row, i) => ({
    i, row, id: row.dataset.id, name: row.querySelector('.kg-bar').dataset.name,
    bar: row.querySelector('.kg-bar'), d: row.querySelector('.kg-d'),
    base: +row.dataset.s, dur: +row.dataset.d, pred: row.dataset.pred ? row.dataset.pred.split(',') : [],
    want: +row.dataset.s, s: +row.dataset.s,
  }));
  const byId = Object.fromEntries(acts.map((a) => [a.id, a]));
  const svg = root.querySelector('.kg-deps');
  const cells = Array.from(root.querySelectorAll('.kg-hmrow .hm'));
  const wk = root.querySelector('.dka-wk');
  const sum = root.querySelector('.dka-sum');
  const baseEnd = Math.max(...acts.map((a) => a.base + a.dur - 1));
  let src = null;
  const ctl = [];

  // Tidigaste start enligt föregångarna (listan är i beroendeordning)
  const earliest = (a, starts) => a.pred.reduce((m, p) => Math.max(m, starts[p] + byId[p].dur), 1);
  function schedule(wants) {
    const s = {};
    acts.forEach((a) => { s[a.id] = Math.max(wants[a.id], earliest(a, s)); });
    return s;
  }
  const wantsNow = () => Object.fromEntries(acts.map((a) => [a.id, a.want]));

  svg.setAttribute('viewBox', `0 0 1000 ${acts.length * 100}`);
  const paths = [];
  acts.forEach((a) => a.pred.forEach((p) => {
    const path = document.createElementNS(NS, 'path');
    svg.appendChild(path);
    paths.push({ path, from: byId[p], to: a });
  }));

  function render() {
    const s = schedule(wantsNow());
    acts.forEach((a) => {
      a.s = s[a.id];
      a.row.style.setProperty('--s', a.s);
      const delta = a.s - a.base;
      const own = a.want !== a.base; // flyttad av besökaren
      a.row.classList.toggle('is-moved', delta !== 0 && !own);
      a.row.classList.toggle('is-src', own && delta !== 0);
      a.d.textContent = delta ? (delta > 0 ? '+' : '−') + Math.abs(delta) + ' v' : '';
    });
    paths.forEach(({ path, from, to }) => {
      const x1 = ((from.s + from.dur - 1) / W) * 1000, y1 = from.i * 100 + 50;
      const x2 = ((to.s - 1) / W) * 1000, y2 = to.i * 100 + 50;
      const xm = Math.min(x1 + 10, x2 - 4);
      path.setAttribute('d', `M${x1.toFixed(1)} ${y1} H${xm.toFixed(1)} V${y2} H${(x2 - 2).toFixed(1)}`);
    });
    const n = Array(W + 1).fill(0);
    acts.forEach((a) => { for (let w = a.s; w < a.s + a.dur && w <= W; w++) n[w]++; });
    cells.forEach((c, k) => {
      const v = n[k + 1];
      c.className = 'hm hm-' + Math.min(4, v);
      c.textContent = v || '';
      c.title = 'V' + (k + 1) + ': ' + v;
    });
    const end = Math.max(...acts.map((a) => a.s + a.dur - 1));
    wk.textContent = 'Klart V ' + end + (end !== baseEnd ? ' (plan V ' + baseEnd + ')' : '');
    const moved = acts.filter((a) => a.s !== a.base);
    if (!moved.length) sum.textContent = 'Planen som den är lagd';
    else if (src && src.s !== src.base) {
      const d = src.s - src.base;
      const others = moved.length - 1;
      sum.textContent = `${src.name} ${d > 0 ? '+' : '−'}${Math.abs(d)} v · ${others === 0 ? 'inga andra flyttade' : others === 1 ? '1 till flyttad' : others + ' till flyttade'}`;
    } else sum.textContent = `${moved.length} ${moved.length === 1 ? 'aktivitet flyttad' : 'aktiviteter flyttade'}`;
    ctl.forEach((k) => k.sync());
  }

  // Varje aktivitet behåller sin egen önskade start (want). Schemat räknas fram
  // ur alla önskemål, så flera flyttar i rad ger samma resultat som i verktyget.
  const fits = (wants) => { const s = schedule(wants); return acts.every((x) => s[x.id] + x.dur - 1 <= W); };
  const maxFor = (a) => {
    const w = wantsNow();
    for (let v = W - a.dur + 1; v >= 1; v--) { w[a.id] = v; if (fits(w)) return Math.max(v, a.s); }
    return a.s;
  };
  const minFor = (a) => earliest(a, schedule(wantsNow()));
  const weeks = (n) => n + (n === 1 ? ' vecka' : ' veckor');
  acts.forEach((a) => {
    ctl.push(bindBar(a.bar, {
      track: a.row.querySelector('.kg-track'), weeks: W, name: a.name + ', start',
      min: () => minFor(a),
      max: () => maxFor(a),
      get: () => a.s,
      set: (v) => {
        a.want = Math.max(minFor(a), Math.min(maxFor(a), v));
        src = a;
        render();
      },
      text: () => {
        const d = a.s - a.base;
        const span = a.dur === 1 ? `vecka ${a.s}` : `vecka ${a.s} till ${a.s + a.dur - 1}`;
        return `${a.name}: ${span}${d ? (d > 0 ? ', ' + weeks(d) + ' senare än planen' : ', ' + weeks(-d) + ' tidigare än planen') : ''}`;
      },
      onDrag: (on) => root.classList.toggle('dragging', on),
    }));
  });
  const reset = root.querySelector('[data-reset]');
  if (reset) reset.addEventListener('click', () => { acts.forEach((a) => { a.want = a.base; }); src = null; render(); });
  render();
}
