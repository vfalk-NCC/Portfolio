/*
  G. Vad kostar handgreppen? Besökaren sätter timmar, timkostnad, personer,
  projektlängd och arbetsveckor. Förval per verktyg, även via länk:
  /?verktyg=binderbuilder#kalkyl. Inga påhittade besparingar: bara besökarens tal.
*/
export function init(root) {
  const form = root.querySelector('#calc');
  if (!form) return;
  form.addEventListener('submit', (e) => e.preventDefault());
  const nf = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 });
  const kr = (n) => { const step = n < 10000 ? 100 : 1000; return nf0.format(Math.round(n / step) * step) + ' kr'; };
  const hours = Array.from(form.querySelectorAll('input[data-h]'));
  const rate = form.querySelector('#c-rate');
  const ppl = form.querySelector('#c-ppl');
  const mon = form.querySelector('#c-mon');
  const wk = form.querySelector('#c-wk');
  const chips = Array.from(root.querySelectorAll('[data-preset]'));
  const shares = Array.from(root.querySelectorAll('.sh'));
  const shareT = Array.from(root.querySelectorAll('[data-share]'));
  const out = { week: root.querySelector('#o-week'), year: root.querySelector('#o-year'), proj: root.querySelector('#o-proj'), mon: root.querySelector('#o-mon') };
  const sticky = Array.from(root.querySelectorAll('.js-proj'));
  const sumH = root.querySelector('#sum-h');
  const sumF = root.querySelector('#sum-f');
  const shareL = root.querySelector('.share-l');
  const bar = root.querySelector('.calc-sticky');
  const outEl = root.querySelector('#calc-out');
  const moments = root.querySelector('[data-moments]');
  // Mobil: momenten fälls ihop, resultatet står överst
  if (moments && window.matchMedia('(max-width: 899px)').matches) moments.open = false;
  // Den klistrade raden döljs när resultatpanelen syns, så att summan inte står två gånger
  if (bar && outEl && 'IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((e) => bar.classList.toggle('is-off', e.isIntersecting)), { threshold: 0.15 }).observe(outEl);
  }
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
      i.closest('.crow').classList.toggle('is-zero', v === 0);
    });
    show(rate, nf0.format(+rate.value) + ' kr', rate.value + ' kronor');
    show(ppl, ppl.value, ppl.value + (+ppl.value === 1 ? ' person' : ' personer'));
    show(mon, mon.value + ' mån', mon.value + ' månader');
    show(wk, wk.value + ' v', wk.value + ' veckor');
    const weeks = +wk.value;
    const week = h * +ppl.value;
    const year = week * weeks;
    const proj = kr(week * (+mon.value / 12) * weeks * +rate.value);
    // Andelar per verktyg
    hours.forEach((i, k) => {
      const v = +i.value;
      if (shares[k]) shares[k].style.setProperty('--v', h ? v / h : 0);
      if (shareT[k]) { shareT[k].textContent = (h ? Math.round((v / h) * 100) : 0) + ' %'; shareT[k].closest('li').classList.toggle('is-zero', v === 0); }
    });
    sticky.forEach((el) => { el.textContent = proj; });
    if (sumH) sumH.textContent = nf.format(h) + ' h';
    if (sumF) sumF.textContent = `${nf0.format(+rate.value)} kr/h · ${ppl.value} ${+ppl.value === 1 ? 'person' : 'personer'} · ${mon.value} mån · ${wk.value} v`;
    clearTimeout(t);
    t = setTimeout(() => {
      out.week.textContent = nf.format(week) + ' h';
      out.year.textContent = nf.format(year) + ' h · ' + kr(year * +rate.value);
      out.proj.textContent = proj;
      out.mon.textContent = mon.value;
    }, 250);
  }

  function preset(key) {
    chips.forEach((c) => c.setAttribute('aria-pressed', c.dataset.preset === key));
    hours.forEach((i) => {
      const tool = i.closest('.crow').dataset.tool;
      i.value = key === 'alla' || key === tool ? i.dataset.def : 0;
    });
    calc();
  }
  const showShares = () => { if (shareL) shareL.hidden = false; };
  chips.forEach((c) => c.addEventListener('click', () => { showShares(); preset(c.dataset.preset); }));
  form.addEventListener('input', () => {
    showShares();
    chips.forEach((c) => c.setAttribute('aria-pressed', false));
    calc();
  });

  const want = new URLSearchParams(location.search).get('verktyg');
  if (want && chips.some((c) => c.dataset.preset === want)) preset(want);
  else calc();
}
