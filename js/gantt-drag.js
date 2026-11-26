/*
  Gemensam styrning för Gantt-staplar i demo B och C.
  Gör en stapel till ett reglage: mus drar direkt, touch först när rörelsen
  är tydligt vågrät (lodrät svepning scrollar sidan), tangentbord med pilar.
*/
export function bindBar(bar, o) {
  // o: { track, weeks, min(), max(), get(), set(v), text(), name, onDrag(bool) }
  bar.setAttribute('role', 'slider');
  bar.tabIndex = 0;
  bar.setAttribute('aria-label', o.name);
  bar.setAttribute('aria-orientation', 'horizontal');
  const sync = () => {
    bar.setAttribute('aria-valuemin', o.min());
    bar.setAttribute('aria-valuemax', o.max());
    bar.setAttribute('aria-valuenow', o.get());
    bar.setAttribute('aria-valuetext', o.text());
  };
  sync();

  bar.addEventListener('keydown', (e) => {
    const v = o.get();
    let n = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = v + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = v - 1;
    else if (e.key === 'PageUp') n = v + 4;
    else if (e.key === 'PageDown') n = v - 4;
    else if (e.key === 'Home') n = o.min();
    else if (e.key === 'End') n = o.max();
    if (n === null) return;
    e.preventDefault();
    o.set(Math.max(o.min(), Math.min(o.max(), n)));
  });

  let id = null, sx = 0, sy = 0, v0 = 0, dragging = false;
  const px = () => o.track.getBoundingClientRect().width / o.weeks;
  const move = (x) => {
    const n = Math.max(o.min(), Math.min(o.max(), v0 + Math.round((x - sx) / px())));
    if (n !== o.get()) o.set(n);
  };
  const start = () => {
    dragging = true;
    try { bar.setPointerCapture(id); } catch (err) { /* ignoreras */ }
    if (o.onDrag) o.onDrag(true);
  };
  bar.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    id = e.pointerId; sx = e.clientX; sy = e.clientY; v0 = o.get();
    dragging = false;
    if (e.pointerType === 'mouse') { e.preventDefault(); bar.focus({ preventScroll: true }); start(); }
  });
  bar.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    if (!dragging) {
      const dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy);
      if (dy > 8 && dy > dx) { id = null; return; }
      if (dx > 8 && dx > dy) start(); else return;
    }
    move(e.clientX);
  });
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null;
    if (dragging && o.onDrag) o.onDrag(false);
    dragging = false;
  };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
  return { sync };
}
