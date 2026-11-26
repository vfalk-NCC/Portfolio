/*
  Demo D: Platsminnet. Välj ett objekt i modellen och se dess att göra-punkter,
  ritning och foto. Generiska data och egenritade bilder.
*/
export function init(root) {
  const btns = Array.from(root.querySelectorAll('.pm-btn'));
  const objs = Array.from(root.querySelectorAll('.pm-obj, .pm-pin'));
  const panels = Array.from(root.querySelectorAll('.pm-panel'));
  function select(id) {
    btns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.o === id));
    objs.forEach((o) => o.classList.toggle('is-on', o.dataset.o === id));
    panels.forEach((p) => { p.hidden = p.dataset.o !== id; });
  }
  btns.forEach((b) => b.addEventListener('click', () => select(b.dataset.o)));
  objs.forEach((o) => o.addEventListener('click', () => select(o.dataset.o)));
}
