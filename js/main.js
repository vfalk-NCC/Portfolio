/*
  Interaktion för portfolion. Allt innehåll syns utan det här skriptet;
  det lägger till rörelse och styrning. Demos (B–E) och kalkylen laddas
  som egna moduler först när de närmar sig skärmen.
*/
(function () {
  'use strict';

  const root = document.documentElement;
  const SELF = document.currentScript && document.currentScript.src;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = () => mq.matches;
  const endIntro = () => root.classList.remove('intro');
  const hasIO = 'IntersectionObserver' in window;

  /* ---------- Toppmeny: yta vid scroll, aktiv sektion ---------- */
  function initTop() {
    const top = document.querySelector('.top');
    if (!top) return;
    const onScroll = () => top.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    if (root.dataset.page !== 'start' || !hasIO) return;
    const links = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
    const map = new Map();
    links.forEach((a) => { const s = document.getElementById(a.getAttribute('href').slice(1)); if (s) map.set(s, a); });
    // Sektionerna mellan "verktyg" och "arbetssatt" räknas till Verktyg
    const groups = [['verktyg', 'register', 'samband', 'kalkyl'], ['arbetssatt'], ['erfarenhet', 'program'], ['kontakt']];
    const owner = {};
    groups.forEach((g) => g.forEach((id) => { owner[id] = g[0]; }));
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) visible.add(e.target.id); else visible.delete(e.target.id); });
      let cur = null;
      document.querySelectorAll('main > section[id]').forEach((s) => { if (visible.has(s.id) && !cur) cur = s.id; });
      const key = cur && owner[cur];
      links.forEach((a) => {
        const on = key && a.getAttribute('href') === '#' + key;
        a.classList.toggle('is-on', !!on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach((s) => io.observe(s));
  }

  /* ---------- Hero: tidplanen styr modellen ---------- */
  function initPlan() {
    const plan = document.getElementById('plan');
    if (!plan || !SELF) { endIntro(); return; }
    // Statuslogiken delas med demo B och generatorn (js/plan-state.js)
    import(new URL('plan-state.js', SELF).href).then((PS) => runPlan(plan, PS)).catch(() => endIntro());
  }
  function runPlan(plan, PS) {
    const range = document.getElementById('wk-range');
    if (!range) { endIntro(); return; }
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
    function setWeek(w) {
      plan.style.setProperty('--w', w);
      wkEl.textContent = 'V ' + String(w).padStart(2, '0');
      tagEl.textContent = w === NOW ? '· NU' : w > NOW ? '· PROGNOS' : '';
      const late = {};
      els.forEach((el) => {
        const a = acts[+el.dataset.a];
        const st = PS.elState(+el.dataset.pw, +el.dataset.w, a.ae, w);
        if (st === 'l') late[el.dataset.a] = true;
        if (!el.classList.contains(st)) { el.classList.remove('p', 'o', 'd', 'l'); el.classList.add(st); }
      });
      const c = { d: 0, o: 0, l: 0, p: 0 };
      Object.keys(acts).forEach((k) => {
        const a = acts[k];
        const st = PS.rowState(a, w, !!late[k]);
        c[st]++;
        a.row.classList.remove('is-p', 'is-o', 'is-d', 'is-l');
        a.row.classList.add('is-' + st);
        a.row.classList.toggle('has-late', w > a.e && a.ae > a.e);
        a.row.style.setProperty('--dw', Math.max(0, Math.min(w - a.as + 1, a.ae - a.as + 1)));
      });
      Object.keys(c).forEach((k) => { if (counts[k]) counts[k].textContent = c[k]; });
      const when = w === NOW ? ', nuläge' : w > NOW ? ', prognos' : '';
      range.setAttribute('aria-valuetext', 'Vecka ' + w + ' av ' + max + when + ': ' + PS.summary(c));
    }
    let timer = null;
    let taken = false;
    function stop() { taken = true; if (timer) { clearInterval(timer); timer = null; } }
    range.addEventListener('input', () => { stop(); setWeek(+range.value); });
    ['pointerdown', 'keydown'].forEach((ev) => range.addEventListener(ev, stop));
    // Utskrift mitt i uppspelningen: visa nuläget
    window.addEventListener('beforeprint', () => { if (timer) { stop(); range.value = NOW; setWeek(NOW); } });
    range.addEventListener('pointerdown', () => plan.classList.add('dragging'));
    window.addEventListener('pointerup', () => plan.classList.remove('dragging'));

    if (reduce() || !hasIO) { setWeek(+range.value); endIntro(); return; }
    plan.classList.add('notrans');
    range.value = 1;
    setWeek(1);
    endIntro();
    requestAnimationFrame(() => requestAnimationFrame(() => plan.classList.remove('notrans')));
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
        if (dx > 8 && dx > dy) { dragging = true; try { ba.setPointerCapture(id); } catch (err) { /* ignoreras */ } } else return;
      }
      fromX(e.clientX);
    });
    ba.addEventListener('pointerup', (e) => {
      if (e.pointerId !== id) return;
      if (!dragging && e.pointerType !== 'mouse') fromX(e.clientX);
      id = null; dragging = false;
    });
    ba.addEventListener('pointercancel', (e) => { if (e.pointerId === id) { id = null; dragging = false; } });
    set(+range.value);
  }

  /* ---------- Flikar i flaggskeppet ---------- */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach((box) => {
      const tabs = Array.from(box.querySelectorAll('[role="tab"]'));
      const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
      function select(i, focus) {
        tabs.forEach((t, k) => {
          const on = k === i;
          t.setAttribute('aria-selected', on);
          t.tabIndex = on ? 0 : -1;
          if (on) panels[k].removeAttribute('data-off'); else panels[k].setAttribute('data-off', '');
          panels[k].toggleAttribute('inert', !on);
        });
        if (focus) tabs[i].focus();
        playVisible(panels[i]);
      }
      tabs.forEach((t, i) => {
        t.addEventListener('click', () => select(i, false));
        t.addEventListener('keydown', (e) => {
          let n = null;
          if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
          else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === 'Home') n = 0;
          else if (e.key === 'End') n = tabs.length - 1;
          if (n !== null) { e.preventDefault(); select(n, true); }
        });
      });
      select(Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')), false);
    });
  }

  /* ---------- Registerfilter ---------- */
  function initFilter() {
    const chips = Array.from(document.querySelectorAll('[data-filter]'));
    if (!chips.length) return;
    const rows = Array.from(document.querySelectorAll('.reg tbody tr'));
    const live = document.getElementById('filter-live');
    // Mobil: registret fälls ihop efter fem rader
    const reg = document.querySelector('.reg');
    const more = document.querySelector('[data-reg-more]');
    const expand = () => { reg.classList.remove('is-collapsed'); if (more) { more.setAttribute('aria-expanded', 'true'); more.parentNode.hidden = true; } };
    if (reg && more) {
      reg.classList.add('is-collapsed');
      more.addEventListener('click', () => { expand(); const r = rows[5]; if (r) { const a = r.querySelector('a'); (a || r).setAttribute('tabindex', a ? '0' : '-1'); (a || r).focus({ preventScroll: false }); } });
    }
    chips.forEach((c) => c.addEventListener('click', () => {
      const k = c.dataset.filter;
      if (reg && more) expand();
      chips.forEach((x) => x.setAttribute('aria-pressed', x === c));
      let n = 0;
      rows.forEach((r) => {
        const on = k === 'alla' || r.dataset.cat.split(' ').includes(k);
        r.hidden = !on;
        if (on) n++;
      });
      if (live) live.textContent = n + (n === 1 ? ' verktyg visas' : ' verktyg visas');
    }));
  }

  /* ---------- Funktioner på case-sidor ---------- */
  function initFeatures() {
    const box = document.querySelector('[data-fn]');
    if (!box) return;
    const btns = Array.from(box.querySelectorAll('.fn-b'));
    const art = box.querySelector('[data-art]');
    const svg = art && art.querySelector('svg');
    const media = Array.from(box.querySelectorAll('.fn-m'));
    const title = box.querySelector('.frame-ti');
    const mode = box.querySelector('.frame-mo');
    const groups = svg ? Array.from(svg.querySelectorAll('[data-f]')) : [];
    function select(btn) {
      const k = btn ? btn.dataset.f : null;
      btns.forEach((b) => b.setAttribute('aria-pressed', b === btn));
      const m = media.find((x) => x.dataset.f === k);
      media.forEach((x) => { x.hidden = x !== m; });
      if (art) art.hidden = !!m;
      if (m) playVisible(m);
      if (svg) {
        const hits = groups.filter((g) => g.dataset.f === k);
        svg.classList.toggle('has-hl', hits.length > 0);
        groups.forEach((g) => g.classList.toggle('is-hl', hits.includes(g)));
      }
      if (title) title.textContent = btn ? btn.querySelector('.fn-n').textContent : 'Funktioner';
      if (mode) mode.textContent = btn ? btn.dataset.mode : 'Illustration';
    }
    btns.forEach((b) => b.addEventListener('click', () => select(b.getAttribute('aria-pressed') === 'true' ? null : b)));
    if (btns[0]) select(btns[0]);
  }

  /* ---------- Video: spelas när den syns, aldrig vid minskad rörelse ---------- */
  const vids = [];
  function playVisible(scope) {
    if (reduce()) return;
    scope.querySelectorAll('video.m-vid').forEach((v) => { const r = v.getBoundingClientRect(); if (r.width && r.bottom > 0 && r.top < innerHeight) v.play().catch(() => {}); });
  }
  function initVideo() {
    document.querySelectorAll('video.m-vid').forEach((v) => {
      vids.push(v);
      v.removeAttribute('controls');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-s vid-btn';
      const sync = () => { b.textContent = v.paused ? 'Spela' : 'Pausa'; b.setAttribute('aria-label', (v.paused ? 'Spela ' : 'Pausa ') + (v.getAttribute('aria-label') || 'video')); };
      b.addEventListener('click', () => { if (v.paused) v.play().catch(() => {}); else v.pause(); });
      v.addEventListener('play', sync); v.addEventListener('pause', sync);
      sync();
      v.parentNode.insertBefore(b, v.nextSibling);
    });
    if (!vids.length || reduce() || !hasIO) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting && !e.target.dataset.paused) e.target.play().catch(() => {});
      else if (!e.isIntersecting) e.target.pause();
    }), { threshold: 0.4 });
    vids.forEach((v) => { io.observe(v); v.addEventListener('pause', () => { if (v.getBoundingClientRect().top < innerHeight && v.getBoundingClientRect().bottom > 0) v.dataset.paused = '1'; }); v.addEventListener('play', () => { delete v.dataset.paused; }); });
  }

  /* ---------- Demos och kalkyl: laddas när de närmar sig ---------- */
  function initLazy() {
    const items = Array.from(document.querySelectorAll('[data-demo]')).map((el) => [el, 'demo-' + el.dataset.demo + '.js']);
    const calc = document.getElementById('calc-root');
    if (calc) items.push([calc, 'kalkyl.js']);
    if (!items.length || !SELF) return;
    let retry = 0;
    const load = (el, file) => {
      if (el.dataset.loaded) return;
      el.dataset.loaded = '1';
      import(new URL(file, SELF).href).then((m) => m.init(el, { reduce: reduce() })).catch((err) => {
        el.dataset.loaded = '';
        console.warn('Demo kunde inte laddas', err);
        if (retry < 2) { retry++; setTimeout(() => load(el, file), 1500); }
      });
    };
    if (!hasIO) { items.forEach(([el, f]) => load(el, f)); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const it = items.find(([el]) => el === e.target);
      if (it) load(it[0], it[1]);
    }), { rootMargin: '400px 0px' });
    items.forEach(([el]) => io.observe(el));
    // Länk med förval (?verktyg=...#kalkyl): ladda direkt
    if (calc && /[?&]verktyg=/.test(location.search)) load(calc, 'kalkyl.js');
  }

  /* ---------- Inflygning ---------- */
  function initReveal() {
    if (reduce() || !hasIO) return;
    const items = Array.from(document.querySelectorAll('.reveal'));
    const below = items.filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    below.forEach((el) => el.classList.add('pre'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.remove('pre'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    below.forEach((el) => io.observe(el));
    window.addEventListener('beforeprint', () => items.forEach((el) => el.classList.remove('pre')));
  }

  function init() {
    initReveal();
    initTop();
    initPlan();
    initBeforeAfter();
    initTabs();
    initFilter();
    initFeatures();
    initVideo();
    initLazy();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
