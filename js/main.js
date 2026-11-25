/*
  Interaktion för portfolion. Namn, e-post, LinkedIn och adress byts i
  tools/config.js och skrivs in i index.html av tools/gen.js.
  Allt innehåll syns utan det här skriptet; det lägger bara till rörelse.
*/
(function () {
  'use strict';

  const root = document.documentElement;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = () => mq.matches;
  const endIntro = () => root.classList.remove('intro');

  /* ---------- Hero: tidplanen styr modellen ---------- */
  function initPlan() {
    const plan = document.getElementById('plan');
    const range = document.getElementById('wk-range');
    if (!plan || !range) { endIntro(); return; }
    const NOW = +plan.dataset.now || +range.max;
    const max = +range.max;
    const wkEl = document.getElementById('wk');
    const tagEl = document.getElementById('wk-tag');
    const els = Array.from(plan.querySelectorAll('.el'));
    const acts = {};
    plan.querySelectorAll('.g-row').forEach((r, i) => {
      acts[i + 1] = { row: r, s: +r.dataset.s, e: +r.dataset.e, as: +r.dataset.as, ae: +r.dataset.ae };
    });
    const counts = {};
    plan.querySelectorAll('[data-c]').forEach((b) => { counts[b.dataset.c] = b; });

    const N = (n, one, many) => n + ' ' + (n === 1 ? one : many);
    function summary(c) {
      const p = [];
      if (c.d) p.push(N(c.d, 'klar', 'klara'));
      if (c.o) p.push(N(c.o, 'pågår', 'pågår'));
      if (c.l) p.push(N(c.l, 'försenad', 'försenade'));
      if (c.p) p.push(N(c.p, 'planerad', 'planerade'));
      return p.join(', ');
    }

    function setWeek(w) {
      plan.style.setProperty('--w', w);
      wkEl.textContent = 'V ' + String(w).padStart(2, '0');
      tagEl.textContent = w === NOW ? '· NU' : w > NOW ? '· PROGNOS' : '';
      const late = {};
      els.forEach((el) => {
        const a = acts[+el.dataset.a];
        const pw = +el.dataset.pw, aw = +el.dataset.w;
        let st;
        if (aw <= w) st = w > a.ae ? 'd' : 'o';
        else if (pw <= w) st = 'l';
        else st = 'p';
        if (st === 'l') late[el.dataset.a] = true;
        if (!el.classList.contains(st)) {
          el.classList.remove('p', 'o', 'd', 'l');
          el.classList.add(st);
        }
      });
      const c = { d: 0, o: 0, l: 0, p: 0 };
      Object.keys(acts).forEach((k) => {
        const a = acts[k];
        let st;
        if (w > a.ae) st = 'd';
        else if (late[k] || (w >= a.s && w < a.as) || w > a.e) st = 'l';
        else if (w >= a.as) st = 'o';
        else st = 'p';
        c[st]++;
        a.row.classList.remove('is-p', 'is-o', 'is-d', 'is-l');
        a.row.classList.add('is-' + st);
        a.row.classList.toggle('has-late', w > a.e && a.ae > a.e);
        a.row.style.setProperty('--dw', Math.max(0, Math.min(w - a.as + 1, a.ae - a.as + 1)));
      });
      Object.keys(c).forEach((k) => { if (counts[k]) counts[k].textContent = c[k]; });
      const when = w === NOW ? ', nuläge' : w > NOW ? ', prognos' : '';
      range.setAttribute('aria-valuetext', 'Vecka ' + w + ' av ' + max + when + ': ' + summary(c));
    }

    let timer = null;
    let taken = false;
    function stop() { taken = true; if (timer) { clearInterval(timer); timer = null; } }
    range.addEventListener('input', () => { stop(); setWeek(+range.value); });
    ['pointerdown', 'keydown'].forEach((ev) => range.addEventListener(ev, stop));
    range.addEventListener('pointerdown', () => plan.classList.add('dragging'));
    window.addEventListener('pointerup', () => plan.classList.remove('dragging'));

    if (reduce() || !('IntersectionObserver' in window)) { setWeek(+range.value); endIntro(); return; }

    // Startläge vecka 1 utan övergångar, sedan visas ritningen
    plan.classList.add('notrans');
    range.value = 1;
    setWeek(1);
    endIntro();
    requestAnimationFrame(() => requestAnimationFrame(() => plan.classList.remove('notrans')));

    // Spela vecka 1 till nuläget en gång, när figuren syns
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      if (taken) return;
      let w = 1;
      setTimeout(() => {
        if (taken) return;
        timer = setInterval(() => {
          if (taken) return;
          w += 1;
          range.value = w;
          setWeek(w);
          if (w >= NOW) { clearInterval(timer); timer = null; }
        }, 280);
      }, 500);
    }, { threshold: 0.25 });
    io.observe(plan);
  }

  /* ---------- Före/Efter ---------- */
  function initBeforeAfter() {
    const ba = document.getElementById('ba');
    const range = document.getElementById('ba-range');
    if (!ba || !range) return;
    function set(v) {
      v = Math.max(0, Math.min(100, Math.round(v)));
      range.value = v;
      ba.style.setProperty('--pos', v + '%');
      const txt = v <= 0 ? 'Bara efter, vecka 22' : v >= 100 ? 'Bara före, vecka 6' : v + ' procent före, ' + (100 - v) + ' procent efter';
      range.setAttribute('aria-valuetext', txt);
    }
    range.addEventListener('input', () => set(+range.value));

    // Pekare: mus direkt, touch först när rörelsen är tydligt vågrät
    let id = null, sx = 0, sy = 0, dragging = false;
    const fromX = (x) => { const r = ba.getBoundingClientRect(); set(((x - r.left) / r.width) * 100); };
    ba.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY;
      dragging = e.pointerType === 'mouse';
      if (dragging) {
        try { ba.setPointerCapture(id); } catch (err) { /* ignoreras */ }
        fromX(e.clientX);
        e.preventDefault();
        range.focus({ preventScroll: true });
      }
    });
    ba.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      if (!dragging) {
        const dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy);
        if (dy > 8 && dy > dx) { id = null; return; }
        if (dx > 8 && dx > dy) { dragging = true; try { ba.setPointerCapture(id); } catch (err) { /* ignoreras */ } }
        else return;
      }
      fromX(e.clientX);
    });
    ba.addEventListener('pointerup', (e) => {
      if (e.pointerId !== id) return;
      if (!dragging && e.pointerType !== 'mouse') fromX(e.clientX); // kort tryck
      id = null; dragging = false;
    });
    ba.addEventListener('pointercancel', (e) => { if (e.pointerId === id) { id = null; dragging = false; } });
    set(+range.value);
  }

  /* ---------- Vad kostar handgreppen? ---------- */
  function initCalc() {
    const form = document.getElementById('calc');
    if (!form) return;
    form.addEventListener('submit', (e) => e.preventDefault());
    const WEEKS_PER_YEAR = 45;
    const nf = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });
    const kr = (n) => {
      const step = n < 10000 ? 100 : 1000;
      return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(n / step) * step) + ' kr';
    };
    const hours = Array.from(form.querySelectorAll('input[data-h]'));
    const rate = document.getElementById('c-rate');
    const ppl = document.getElementById('c-ppl');
    const mon = document.getElementById('c-mon');
    const show = (input, text, spoken) => {
      const v = input.parentNode.querySelector('.cval');
      if (v) v.textContent = text;
      input.setAttribute('aria-valuetext', spoken);
    };
    let t = null;

    function calc() {
      let h = 0;
      hours.forEach((i) => {
        const v = +i.value; h += v;
        show(i, nf.format(v) + ' h', nf.format(v) + (v === 1 ? ' timme' : ' timmar'));
      });
      show(rate, nf.format(+rate.value) + ' kr', rate.value + ' kronor');
      show(ppl, ppl.value, ppl.value + (+ppl.value === 1 ? ' person' : ' personer'));
      show(mon, mon.value + ' mån', mon.value + ' månader');
      const week = h * +ppl.value;
      const year = week * WEEKS_PER_YEAR;
      const proj = kr(week * (+mon.value / 12) * WEEKS_PER_YEAR * +rate.value);
      // Den synliga stickyraden direkt, live-regionen efter en kort paus
      form.querySelectorAll('.calc-sticky .js-proj').forEach((el) => { el.textContent = proj; });
      clearTimeout(t);
      t = setTimeout(() => {
        document.getElementById('o-week').textContent = nf.format(week) + ' h';
        document.getElementById('o-year').textContent = nf.format(year) + ' h · ' + kr(year * +rate.value);
        document.getElementById('o-proj').textContent = proj;
        document.getElementById('o-mon').textContent = mon.value;
      }, 350);
    }
    form.addEventListener('input', calc);
    calc();
  }

  /* ---------- Inflygning och linjer som ritas fram ---------- */
  function initReveal() {
    if (reduce() || !('IntersectionObserver' in window)) return; // allt syns redan
    const items = Array.from(document.querySelectorAll('.reveal'));
    const below = items.filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    below.forEach((el) => el.classList.add('pre'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.remove('pre'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    below.forEach((el) => io.observe(el));
    window.addEventListener('beforeprint', () => items.forEach((el) => el.classList.remove('pre')));
  }

  function init() {
    initReveal();
    initPlan();
    initBeforeAfter();
    initCalc();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
