/*
  Statuslogik för tidplan mot modell. EN källa för heron (js/main.js),
  demo B (js/demo-flytta.js) och generatorn (tools/ritningar.js läser filen).
  d = klar, o = pågår, l = försenad, p = planerad.
*/
// En del i modellen: pw = planerad vecka, aw = faktisk vecka, ae = aktivitetens faktiska slut
export function elState(pw, aw, ae, w) {
  if (aw <= w) return w > ae ? 'd' : 'o';
  if (pw <= w) return 'l';
  return 'p';
}
// En aktivitet: s/e = planerad start/slut, as/ae = faktisk, anyLate = någon del försenad
export function rowState(a, w, anyLate) {
  if (w > a.ae) return 'd';
  if (anyLate || (w >= a.s && w < a.as) || w > a.e) return 'l';
  if (w >= a.as) return 'o';
  return 'p';
}
const N = (n, one, many) => n + ' ' + (n === 1 ? one : many);
export function summary(c) {
  const p = [];
  if (c.d) p.push(N(c.d, 'klar', 'klara'));
  if (c.o) p.push(N(c.o, 'pågår', 'pågår'));
  if (c.l) p.push(N(c.l, 'försenad', 'försenade'));
  if (c.p) p.push(N(c.p, 'planerad', 'planerade'));
  return p.join(', ');
}
