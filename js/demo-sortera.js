/*
  Demo E: Sortera leveransen. 24 generiska ritningar sorteras till pärmar per
  område med en körning. Utan JavaScript visas slutläget (sorterat).
*/
export function init(root, opts) {
  const reduce = opts && opts.reduce;
  const pile = root.querySelector('.so-pile');
  const files = Array.from(root.querySelectorAll('.so-f')).sort((a, b) => a.dataset.i - b.dataset.i);
  const binders = Object.fromEntries(Array.from(root.querySelectorAll('.so-b')).map((b) => [b.dataset.area, { el: b, list: b.querySelector('.so-files'), n: b.querySelector('.so-n') }]));
  const left = root.querySelector('.so-left');
  const read = root.querySelector('.so-read');
  const run = root.querySelector('[data-run]');
  const reset = root.querySelector('[data-reset]');
  let busy = false;

  // FLIP: mät, ändra, spela upp från gamla läget
  function flip(mutate) {
    const first = new Map(files.map((f) => [f, f.getBoundingClientRect()]));
    mutate();
    if (reduce) return;
    files.forEach((f) => {
      const a = first.get(f), b = f.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) return;
      f.style.transition = 'none';
      f.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    // eslint-disable-next-line no-unused-expressions
    root.offsetWidth;
    files.forEach((f) => {
      if (!f.style.transform) return;
      f.style.transition = 'transform 420ms cubic-bezier(.16, 1, .3, 1)';
      f.style.transform = '';
    });
  }
  function counts() {
    let inPile = 0;
    files.forEach((f) => { if (f.parentNode === pile) inPile++; });
    left.textContent = inPile;
    Object.values(binders).forEach((b) => {
      const n = b.list.children.length;
      b.n.textContent = n;
      b.el.classList.toggle('is-full', n > 0 && inPile === 0);
    });
    return inPile;
  }
  function toPile() {
    files.forEach((f) => pile.appendChild(f));
    root.classList.remove('is-sorted');
    counts();
  }

  toPile();
  read.textContent = 'Leveransen: 24 filer att öppna, läsa och flytta för hand.';

  run.addEventListener('click', () => {
    if (busy || counts() === 0) return;
    busy = true; run.setAttribute('aria-disabled', 'true'); // fokus stannar kvar på knappen
    const order = files.slice().reverse(); // sist först: högen behåller sina lägen
    let k = 0;
    const step = () => {
      const f = order[k++];
      flip(() => { binders[f.dataset.area].list.prepend(f); });
      const rest = counts();
      if (rest > 0) setTimeout(step, reduce ? 0 : 45);
      else {
        root.classList.add('is-sorted');
        counts();
        read.textContent = '24 filer i 3 pärmar. En körning.';
        busy = false;
      }
    };
    step();
  });
  reset.addEventListener('click', () => {
    if (busy) return;
    flip(toPile);
    run.removeAttribute('aria-disabled');
    read.textContent = 'Leveransen: 24 filer att öppna, läsa och flytta för hand.';
  });
}
