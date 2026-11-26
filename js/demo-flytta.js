/*
  Demo B: Flytta en aktivitet. Modellen styrs av tidplanen: när en stapel
  flyttas byter delarna status i den låsta nulägesveckan. Generiska data.
*/
import { bindBar } from './gantt-drag.js';

import { elState, rowState, summary } from './plan-state.js';

const N = (n, one, many) => n + ' ' + (n === 1 ? one : many);
const WORD = { d: 'klar', o: 'pågår', l: 'försenad', p: 'planerad' };

export function init(root) {
  const NOW = +root.dataset.now;
  const W = +root.dataset.weeks;
  const els = Array.from(root.querySelectorAll('.el'));
  const sum = root.querySelector('.dfl-sum');
  const acts = Array.from(root.querySelectorAll('.dg-row')).map((row) => ({
    id: row.dataset.a, row, bar: row.querySelector('.dg-bar'), d: row.querySelector('.dg-d'),
    name: row.querySelector('.dg-bar').dataset.name,
    s: +row.dataset.s, e: +row.dataset.e, as: +row.dataset.as, ae: +row.dataset.ae, off: 0, st: 'p',
  }));
  const byId = Object.fromEntries(acts.map((a) => [a.id, a]));
  const ctl = [];
  let liveT = null;
  const live = document.createElement('p');
  live.className = 'vh';
  live.setAttribute('aria-live', 'polite');
  root.appendChild(live);

  function render() {
    const late = {};
    els.forEach((el) => {
      const a = byId[el.dataset.a];
      const pw = +el.dataset.pw, aw = +el.dataset.w + a.off, ae = a.ae + a.off;
      const st = elState(pw, aw, ae, NOW);
      if (st === 'l') late[a.id] = true;
      if (!el.classList.contains(st)) { el.classList.remove('p', 'o', 'd', 'l'); el.classList.add(st); }
    });
    const c = { d: 0, o: 0, l: 0, p: 0 };
    let lateParts = 0;
    els.forEach((el) => { if (el.classList.contains('l')) lateParts++; });
    acts.forEach((a) => {
      const as = a.as + a.off, ae = a.ae + a.off;
      const st = rowState({ s: a.s, e: a.e, as, ae }, NOW, !!late[a.id]);
      a.st = st;
      c[st]++;
      a.row.classList.remove('is-p', 'is-o', 'is-d', 'is-l');
      a.row.classList.add('is-' + st);
      a.row.classList.toggle('is-moved', a.off !== 0);
      a.row.style.setProperty('--as', as);
      a.row.style.setProperty('--ae', ae);
      a.d.textContent = a.off ? (a.off > 0 ? '+' : '−') + Math.abs(a.off) + ' v' : '';
    });
    const tail = lateParts ? ' · ' + N(lateParts, 'del försenad', 'delar försenade') + ' i modellen' : ' · inga delar försenade';
    sum.textContent = summary(c) + tail;
    // Uppläsning först när besökaren stannat, inte för varje vecka under drag
    clearTimeout(liveT);
    liveT = setTimeout(() => { live.textContent = sum.textContent; }, 500);
    ctl.forEach((k) => k.sync());
  }

  acts.forEach((a) => {
    const minOff = 1 - a.as, maxOff = W - a.ae;
    ctl.push(bindBar(a.bar, {
      track: a.row.querySelector('.dg-track'), weeks: W, name: a.name + ', faktisk tid',
      min: () => a.as + minOff, max: () => a.as + maxOff,
      get: () => a.as + a.off,
      set: (v) => { a.off = v - a.as; render(); },
      text: () => `${a.name}: vecka ${a.as + a.off} till ${a.ae + a.off}, ${WORD[a.st]} i vecka ${NOW}`,
      onDrag: (on) => root.classList.toggle('dragging', on),
    }));
  });
  const reset = root.querySelector('[data-reset]');
  if (reset) reset.addEventListener('click', () => { acts.forEach((a) => { a.off = 0; }); render(); });
  render();
}
