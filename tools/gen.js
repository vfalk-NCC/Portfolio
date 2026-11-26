#!/usr/bin/env node
/*
  Generator för hela webbplatsen.  Kör:  node tools/gen.js
  Läser:
    tools/config.js          namn, e-post, LinkedIn, ort, adress
    tools/data/status.js     status per verktyg
    tools/data/verktyg.js    all text om verktygen och case-sidorna
    tools/data/media.js      skärmbilder och video per plats
    tools/index.src.html     startsidans löptext (hero, arbetssätt, erfarenhet ...)
  Skriver:
    index.html, verktyg/<id>/index.html, 404.html, sitemap.xml, robots.txt, img/favicon.svg
  Redigera aldrig de genererade filerna direkt.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const config = require('./config');
const STATUS = require('./data/status');
const MEDIA = require('./data/media');
const { kategorier, verktyg, moment, caseOrdning } = require('./data/verktyg');
const R = require('./ritningar');
const D = require('./demos');

const ROOT = path.join(__dirname, '..');
const esc = R.esc;
const isSet = (v) => typeof v === 'string' && v.trim() !== '' && v.trim()[0] !== '[';
const warn = (m) => console.warn('VARNING: ' + m);
const byId = Object.fromEntries(verktyg.map((v) => [v.id, v]));

/* ---------------- Status ---------------- */
const STATUSAR = {
  drift: { t: 'I drift', k: 'done' },
  utveckling: { t: 'Under utveckling', k: 'active' },
  prototyp: { t: 'Prototyp', k: 'planned' },
  pagang: { t: 'På gång', k: 'soon' },
};
function statusOf(id) {
  const s = STATUS[id];
  if (!STATUSAR[s]) throw new Error(`Okänd eller saknad status för "${id}" i tools/data/status.js: ${s}`);
  return STATUSAR[s];
}
const badge = (id) => { const s = statusOf(id); return `<span class="st st-${s.k}"><i aria-hidden="true"></i>${s.t}</span>`; };
verktyg.forEach((v) => statusOf(v.id));

/* ---------------- Personuppgifter ---------------- */
const P = config.person;
const fullName = P.fornamn + (isSet(P.efternamn) ? ' ' + P.efternamn : '');
const epostSet = isSet(P.epost) && /@/.test(P.epost);
const liSet = isSet(P.linkedin) && /^https:\/\//.test(P.linkedin);
const hasContact = epostSet || liSet; // styr menyvalet Kontakt och kontaktdelen
const URL = config.url.endsWith('/') ? config.url : config.url + '/';
const URL_PATH = new globalThis.URL(URL).pathname;

/* ---------------- Media ---------------- */
function dims(file) {
  const b = fs.readFileSync(file);
  if (b.slice(1, 4).toString() === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] === 0xFF && b[1] === 0xD8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xFF) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xC0 && m <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') {
    const t = b.slice(12, 16).toString();
    if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3FFF, b.readUInt16LE(28) & 0x3FFF];
    if (t === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3FFF), 1 + ((n >> 14) & 0x3FFF)]; }
  }
  return null;
}
const usedSlots = new Set();
// Returnerar { html, mode } eller null om platsen är tom
function media(slot, base, opts = {}) {
  usedSlots.add(slot);
  if (!(slot in MEDIA)) warn(`platsen "${slot}" saknas i tools/data/media.js (visas som illustration)`);
  const m = MEDIA[slot];
  if (!m) return null;
  const abs = path.join(ROOT, m.fil || '');
  if (!m.fil || !fs.existsSync(abs)) { warn(`${slot}: filen ${m.fil} finns inte, illustrationen visas`); return null; }
  if (!m.alt) warn(`${slot}: alt-text saknas`);
  const isVid = /\.(mp4|webm)$/i.test(m.fil);
  let w = m.bredd, h = m.hojd;
  const dimSrc = isVid ? m.poster && path.join(ROOT, m.poster) : abs;
  if ((!w || !h) && dimSrc && fs.existsSync(dimSrc)) { const d = dims(dimSrc); if (d) [w, h] = d; }
  if (!w || !h) { warn(`${slot}: ange bredd och hojd i media.js`); w = 1600; h = 1000; }
  const src = base + m.fil;
  const loading = opts.eager ? 'eager' : 'lazy';
  let html;
  if (isVid) {
    if (!m.poster) warn(`${slot}: video utan poster`);
    html = `<video class="m-vid" width="${w}" height="${h}"${m.poster ? ` poster="${base + m.poster}"` : ''} muted playsinline loop preload="none" controls aria-label="${esc(m.alt || '')}"><source src="${src}" type="video/${/webm$/i.test(m.fil) ? 'webm' : 'mp4'}"></video>`;
  } else {
    html = `<img class="m-img" src="${src}" alt="${esc(m.alt || '')}" width="${w}" height="${h}" loading="${loading}" decoding="async">`;
  }
  const mode = m.kalla === 'illustration' ? 'Illustration' : isVid ? 'Skärminspelning · demoprojekt' : 'Skärmbild · demoprojekt';
  return { html, mode, ratio: `${w} / ${h}` };
}

/* ---------------- Komponenter ---------------- */
// Ritningsram: titelblock med tre celler, passmärken, nät inuti
function frame({ fig, title, mode, body, cls = '', caption = '', attrs = '', bodyCls = '' }) {
  return `<figure class="frame ${cls}"${attrs}>
  <div class="frame-tb" aria-hidden="true"><span>Fig. ${fig}</span><span class="frame-ti">${esc(title)}</span><span class="frame-mo">${esc(mode)}</span></div>
  <div class="frame-body ${bodyCls}">${body}</div>${caption ? `\n  <figcaption>${caption}</figcaption>` : ''}
</figure>`;
}
const tags = (list, label = 'Teknik och funktioner') => `<ul class="tags" aria-label="${label}">${list.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
const arrow = '<span class="arr" aria-hidden="true">→</span>';

function head({ base, title, desc, canonical, ogImageAlt, jsonld }) {
  return `<!DOCTYPE html>
<!-- Genererad av tools/gen.js. Redigera tools/ och kör: node tools/gen.js -->
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#F6F5F1" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0C0E11" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:locale" content="sv_SE">
<meta property="og:site_name" content="${esc(fullName)}">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${URL}img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(ogImageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${base}fonts/geist-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}css/style.css">
<script>(function(d){d.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&d.dataset.page==='start'){d.classList.add('intro');setTimeout(function(){d.classList.remove('intro');},3000);}})(document.documentElement);</script>
<script src="${base}js/main.js" defer></script>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>`;
}

function header(base, home) {
  const h = home ? '' : base;
  return `<a class="skip" href="#innehall">Hoppa till innehåll</a>
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="${home ? '#top' : base}"${home ? '' : ` aria-label="${esc(fullName)}, till startsidan"`}>
      <svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M18 17 L32 47 L46 17" fill="none" stroke="currentColor" stroke-width="6"/><path class="bm-c" d="M6 6 H18 M6 6 V18 M58 58 H46 M58 58 V46" stroke-width="4"/></svg>
      <span class="brand-t">${esc(fullName)}</span>
    </a>
    <nav aria-label="Huvudmeny">
      <ul class="nav">
        <li><a href="${h}#verktyg"${home ? '' : ' aria-current="true"'}>Verktyg</a></li>
        <li><a href="${h}#arbetssatt">Arbetssätt</a></li>
        <li><a href="${h}#erfarenhet">Erfarenhet</a></li>
${hasContact ? `        <li><a href="${h}#kontakt">Kontakt</a></li>
` : ''}      </ul>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="foot">
  <div class="wrap foot-in">
    <p>Verktygen är egna initiativ och inte system som införts av en arbetsgivare. Ritningar och demos använder generiska data, inga projektdata.</p>
    <p class="foot-y">© ${new Date().getFullYear()} ${esc(fullName)}</p>
  </div>
</footer>
</body>
</html>
`;
}

/* ---------------- Startsidan: genererade block ---------------- */
function heroBlock() {
  const hero = R.hall('bldg');
  const g = R.gantt(hero.late);
  return {
    HERO: hero.svg, GANTT_TICKS: g.ticks, GANTT_ROWS: g.rows,
    C_D: String(g.counts.d), C_O: String(g.counts.o), C_L: String(g.counts.l), C_P: String(g.counts.p),
    VALUETEXT: g.valuetext, NOW: String(R.NOW), NOW2: String(R.NOW).padStart(2, '0'), WEEKS: String(R.WEEKS),
  };
}

function flagship() {
  const id = 'tidplan-i-modellen';
  const demo = DEMO.flytta;
  const tabs = [
    ['flytta', 'Flytta en aktivitet', () => demo.html(), demo.cap, 'Demo · generiska data'],
    ['montage', 'Montageordning', () => R.flagMontage(), 'Ordningen som delarna monteras i, synlig i modellen.', 'Illustration'],
    ['lagesbild', 'Lägesbild till Trimble Connect', () => R.flagLagesbild(), 'Lägesbilder med skyltar i 3D. Skyltar och etiketter exporteras som IFC i SWEREF 99 till Trimble Connect.', 'Illustration'],
  ];
  const btns = tabs.map(([k, t], i) => `<button type="button" class="tab" role="tab" id="ft-${k}" aria-controls="fp-${k}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}><span class="tab-n">0${i + 1}</span>${t}</button>`).join('');
  const panels = tabs.map(([k, t, body, cap, mode], i) => {
    const m = media('start/flaggskepp-' + k, '', {});
    return `<div class="tp" id="fp-${k}" role="tabpanel" aria-labelledby="ft-${k}"${i ? ' data-off' : ''}>${frame({ fig: '2.' + (i + 1), title: t, mode: m ? m.mode : mode, body: m ? m.html : body(), cls: 'frame-stage' + (k === 'flytta' && !m ? ' frame-demo' : ''), caption: esc(cap) })}</div>`;
  }).join('');
  return `<section class="scene flag" id="tidplan" aria-labelledby="h-flag">
  <div class="wrap">
    <div class="sec-head">
      <p class="over">Tidplan i modellen ${badge(id)}</p>
      <h2 id="h-flag">Modellen visar veckan.</h2>
      <p class="lead">Ett tillägg till SketchUp som läser tidplanen från Powerproject eller Primavera P6. Flytta en aktivitet och se vilka delar som blir sena.</p>
    </div>
    <div class="tabs" data-tabs>
      <div class="tablist js-only" role="tablist" aria-label="Funktioner i Tidplan i modellen">${btns}</div>
      <div class="tabpanels" data-vt="${id}">${panels}</div>
    </div>
    <p class="more-link"><a class="tlink" href="verktyg/${id}/">Så fungerar Tidplan i modellen ${arrow}</a></p>
  </div>
</section>`;
}

function cards() {
  const art = { 'trimble-connect': R.cardTC(), 'production-cockpit': R.cardCockpit(), binderbuilder: R.cardBinder() };
  const list = ['trimble-connect', 'production-cockpit', 'binderbuilder', 'fore-efter'];
  const nr = (id) => String(verktyg.findIndex((v) => v.id === id) + 1).padStart(2, '0');
  return list.map((id, i) => {
    const v = byId[id];
    const isCase = !!v.case;
    let body, mode;
    if (id === 'fore-efter') {
      body = `<div class="ba" id="ba" style="--pos:50%">
            <div class="ba-layer ba-after">${R.elevation('late')}</div>
            <div class="ba-layer ba-before">${R.elevation('early')}</div>
            <input class="ba-range" type="range" id="ba-range" min="0" max="100" step="1" value="50" aria-label="Jämför före och efter: vecka 6 mot vecka 22" aria-valuetext="Hälften före, hälften efter">
            <span class="ba-line" aria-hidden="true"><span class="ba-knob"><svg viewBox="0 0 24 24" focusable="false"><path d="M9 7 L4 12 L9 17 M15 7 L20 12 L15 17" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round"/></svg></span></span>
          </div>
          <p class="ba-hint" aria-hidden="true"><span>Före · V 06</span><span>Dra i skiljelinjen</span><span>Efter · V 22</span></p>`;
      mode = 'Demo · generiska data';
    } else {
      const m = media('start/kort-' + id, '');
      body = m ? m.html : art[id];
      mode = m ? m.mode : 'Illustration';
    }
    const vt = isCase ? ` data-vt="${id}"` : '';
    return `<article class="card${isCase ? ' card-link' : ''} reveal" aria-labelledby="c-${id}">
      ${frame({ fig: 3 + i, title: `Verktyg ${nr(id)}`, mode, body, cls: id === 'fore-efter' ? 'frame-ba' : '', attrs: vt })}
      <div class="card-body">
        <p class="card-meta">${badge(id)}${v.typ ? `<span class="card-typ">${esc(v.typ)}</span>` : ''}</p>
        <h3 id="c-${id}">${esc(v.namn)}</h3>
        <p class="card-p">${esc(v.kort.problem)}</p>
        <p class="card-e">${esc(v.kort.effekt)}</p>
        ${tags(v.kort.taggar, 'Funktioner')}
        ${isCase ? `<p class="card-more"><a class="tlink" href="verktyg/${id}/">Se hur det fungerar<span class="vh"> – ${esc(v.namn)}</span> ${arrow}</a></p>` : '<p class="card-note">Bilderna i demon är egenritade: en tidig och en sen byggfas.</p>'}
      </div>
    </article>`;
  }).join('\n');
}

function register() {
  const chips = [['alla', 'Alla'], ...Object.entries(kategorier)].map(([k, t], i) => `<li><button type="button" class="chip" data-filter="${k}" aria-pressed="${i === 0}">${t}<span class="chip-n">${k === 'alla' ? verktyg.length : verktyg.filter((v) => v.kategorier.includes(k)).length}</span></button></li>`).join('');
  const rows = verktyg.map((v, i) => {
    const thumb = media(v.id + '/miniatyr', '');
    const name = v.case ? `<a href="verktyg/${v.id}/">${esc(v.namn)}</a>` : esc(v.namn);
    return `<tr data-cat="${v.kategorier.join(' ')}"${thumb ? ' class="has-thumb"' : ''}>
        <td class="r-nr">${String(i + 1).padStart(2, '0')}</td>
        <th scope="row" class="r-name">${name}${v.typ ? `<span class="r-typ">${esc(v.typ)}</span>` : ''}</th>
        <td class="r-desc">${esc(v.rad)}${thumb ? `<span class="r-thumb" aria-hidden="true">${thumb.html.replace(/ alt="[^"]*"/, ' alt=""')}</span>` : ''}</td>
        <td class="r-cat">${v.kategorier.map((k) => kategorier[k]).join(' · ')}</td>
        <td class="r-st">${badge(v.id)}</td>
      </tr>`;
  }).join('\n');
  return `<div class="filter js-only"><p class="filter-k" id="filter-k">Visa</p><ul class="chips" aria-labelledby="filter-k">${chips}</ul><p class="vh" aria-live="polite" id="filter-live"></p></div>
    <div class="reg-wrap">
    <table class="reg">
      <caption class="vh">Alla verktyg med kategori och status</caption>
      <thead><tr><th scope="col" class="r-nr">Nr</th><th scope="col">Verktyg</th><th scope="col" class="r-desc">Vad det gör</th><th scope="col" class="r-cat">Kategori</th><th scope="col" class="r-st">Status</th></tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>
    </div>
    <p class="reg-more js-only"><button type="button" class="btn-s" data-reg-more aria-expanded="false">Visa alla ${verktyg.length} verktyg</button></p>`;
}

function systemkarta() {
  // Endast kopplingar som underlaget belägger (beslut3 punkt 5)
  const lanes = [
    { k: 'tidplan', t: 'Tidplan till modell och byggplats', nodes: [['Tidplan', 'Powerproject · Primavera P6'], ['Tidplan i modellen', 'SketchUp-tillägg', 'tidplan-i-modellen'], ['IFC', 'SWEREF 99'], ['Trimble Connect', 'Modellvisare']] },
    { k: 'ritningar', t: 'Ritningar till pärmar', nodes: [['Ritningsleverans', 'PDF'], ['BinderBuilder', 'Pärm per område', 'binderbuilder']] },
    { k: 'pp', t: 'Powerproject-filer direkt', nodes: [['Powerproject-filer', '.pp'], ['4D-planeringsappen', 'Tavla · Gantt · beroenden', '4d-planeringsappen']] },
  ];
  return `<ol class="map">${lanes.map((l) => `
      <li class="lane lane-${l.k} reveal">
        <p class="lane-t">${esc(l.t)}</p>
        <ol class="nodes">${l.nodes.map(([n, s, tool]) => {
          const inner = `<span class="node-n">${esc(n)}</span><span class="node-s">${esc(s)}</span>`;
          const cls = tool ? ' node-tool' : '';
          if (tool && byId[tool].case) return `<li class="node${cls}"><a href="verktyg/${tool}/">${inner}</a></li>`;
          return `<li class="node${cls}"><span class="node-in">${inner}</span></li>`;
        }).join('')}</ol>
      </li>`).join('')}
    </ol>`;
}

function kalkyl() {
  const opts = [['alla', 'Alla'], ...moment.map((m) => [m.verktyg, m.kort || byId[m.verktyg].namn])];
  const chips = opts.map(([k, t], i) => `<li><button type="button" class="chip" data-preset="${k}" aria-pressed="${i === 0}">${esc(t)}</button></li>`).join('');
  const rows = moment.map((m, i) => `
          <div class="crow" data-tool="${m.verktyg}">
            <label for="${m.id}">${esc(m.text)} <span class="by">${esc(byId[m.verktyg].namn)}</span></label>
            <input type="range" id="${m.id}" data-h data-def="${m.h}" data-i="${i}" min="0" max="8" step="0.5" value="${m.h}" aria-valuetext="${m.h} ${m.h === 1 ? 'timme' : 'timmar'}">
            <output class="cval" for="${m.id}">${m.h} h</output>
          </div>`).join('');
  const totH = moment.reduce((s, m) => s + m.h, 0);
  const kr = (n) => new Intl.NumberFormat('sv-SE').format(Math.round(n / 1000) * 1000) + ' kr';
  const weeks = 45, rate = 700, mon = 24;
  const shares = moment.map((m, i) => `<span class="sh sh-${i}" style="--v:${m.h / totH}"></span>`).join('');
  const legend = moment.map((m, i) => `<li><i class="sh-${i}" aria-hidden="true"></i>${esc(byId[m.verktyg].namn)}<b data-share="${i}">${Math.round(m.h / totH * 100)} %</b></li>`).join('');
  return `<div class="calc" id="calc-root">
      <div class="calc-presets js-only"><p class="filter-k" id="preset-k">Förval</p><ul class="chips" aria-labelledby="preset-k">${chips}</ul></div>
      <div class="calc-grid">
      <form class="calc-form" id="calc">
        <details class="calc-d" data-moments open>
          <summary><span>Timmar per vecka per moment</span><span class="calc-d-v" id="sum-h">${totH} h</span></summary>
        <fieldset>
          <legend class="vh">Timmar per vecka som går till</legend>${rows}
        </fieldset>
        </details>
        <details class="calc-d">
          <summary><span>Förutsättningar</span><span class="calc-d-v" id="sum-f">${rate} kr/h · 1 person · ${mon} mån · ${weeks} v</span></summary>
        <fieldset>
          <legend class="vh">Förutsättningar</legend>
          <div class="crow">
            <label for="c-rate">Timkostnad</label>
            <input type="range" id="c-rate" min="300" max="1500" step="50" value="${rate}" aria-valuetext="${rate} kronor">
            <output class="cval" for="c-rate">${rate} kr</output>
          </div>
          <div class="crow">
            <label for="c-ppl">Personer som gör samma moment</label>
            <input type="range" id="c-ppl" min="1" max="10" step="1" value="1" aria-valuetext="1 person">
            <output class="cval" for="c-ppl">1</output>
          </div>
          <div class="crow">
            <label for="c-mon">Projektets längd</label>
            <input type="range" id="c-mon" min="6" max="60" step="6" value="${mon}" aria-valuetext="${mon} månader">
            <output class="cval" for="c-mon">${mon} mån</output>
          </div>
          <div class="crow">
            <label for="c-wk">Arbetsveckor per år</label>
            <input type="range" id="c-wk" min="40" max="48" step="1" value="${weeks}" aria-valuetext="${weeks} veckor">
            <output class="cval" for="c-wk">${weeks} v</output>
          </div>
        </fieldset>
        </details>
        <p class="calc-nojs">Reglagen räknar om resultatet när JavaScript är påslaget. Siffrorna nedan gäller startvärdena.</p>
      </form>
      <div class="calc-out scene" id="calc-out">
        <p class="over">Resultat</p>
        <div aria-live="polite" aria-atomic="true">
        <dl>
          <div class="big"><dt>Handgrepp per projekt, <span id="o-mon">${mon}</span> månader</dt><dd id="o-proj">${kr(totH * weeks * (mon / 12) * rate)}</dd></div>
          <div><dt>Per år</dt><dd id="o-year">${totH * weeks} h · ${kr(totH * weeks * rate)}</dd></div>
          <div><dt>Per vecka</dt><dd id="o-week">${totH} h</dd></div>
        </dl>
        </div>
        <div class="shares" aria-hidden="true">${shares}</div>
        <ul class="share-l" hidden>${legend}</ul>
        <p class="calc-f">Timmar per vecka × personer × timkostnad × arbetsveckor. Startvärdena är exempel som visar storleksordningen, inte mätresultat.</p>
      </div>
      </div>
      <p class="calc-sticky js-only" aria-hidden="true"><span>Per projekt</span> <b class="js-proj">${kr(totH * weeks * (mon / 12) * rate)}</b></p>
    </div>`;
}

function kontakt() {
  const rows = [];
  if (epostSet) rows.push(`<li><span class="c-k">E-post</span><a class="c-v" href="mailto:${esc(P.epost)}">${esc(P.epost)}</a></li>`);
  if (liSet) rows.push(`<li><span class="c-k">LinkedIn</span><a class="c-v" href="${esc(P.linkedin)}">${esc(P.linkedin.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a></li>`);
  rows.push(`<li><span class="c-k">Ort</span><span class="c-v">${esc(P.ort)}</span></li>`);
  const how = epostSet && liSet ? ' Skicka ett mejl eller hitta mig på LinkedIn.' : epostSet ? ' Skicka ett mejl.' : ' Hitta mig på LinkedIn.';
  // Utan kontaktväg: ingen uppmaning att höra av sig, och inget menyval (se header)
  const head = hasContact
    ? `<p class="over">Kontakt</p>
      <h2 id="h-kontakt">Planering, VDC och digitalisering.</h2>
      <p class="lead">Hör av dig om du vill prata planering, VDC eller digitalisering i byggprojekt.${how}</p>`
    : `<h2 id="h-kontakt">Planering, VDC och egna verktyg.</h2>`;
  return { KONTAKT_HEAD: head, KONTAKT: `<ul class="contact">${rows.join('')}</ul>` };
}

/* ---------------- Startsidan ---------------- */
function buildHome() {
  const base = '';
  const drift = verktyg.filter((v) => STATUS[v.id] === 'drift').length;
  const title = `${fullName} – Produktionsplanering, VDC och egna digitala verktyg`;
  const desc = 'Projektering, teknisk ledning och nu produktionsplanering och VDC. Egna verktyg, byggda med AI som utvecklingsstöd, som kopplar tidplanen till modellen och byggplatsen.';
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'Person', name: fullName, url: URL,
    jobTitle: 'Produktionsplanering och VDC', description: desc, knowsAbout: ['Produktionsplanering', 'VDC', '4D-planering', 'BIM', 'Tekla', 'Trimble Connect'],
    address: { '@type': 'PostalAddress', addressRegion: P.ort, addressCountry: 'SE' },
    ...(liSet ? { sameAs: [P.linkedin] } : {}),
  };
  const rep = {
    ...heroBlock(),
    HEAD: head({ base, title, desc, canonical: URL, ogImageAlt: 'Linjeritning av en industrihall i statusfärger, vecka 18', jsonld }).replace('<html lang="sv">', '<html lang="sv" data-page="start">'),
    HEADER: header(base, true),
    FOOTER: footer(),
    NAME: esc(fullName),
    TOOLS_N: String(verktyg.length),
    TOOLS_DRIFT: String(drift),
    FLAGSHIP: flagship(),
    CARDS: cards(),
    REGISTER: register(),
    MAP: systemkarta(),
    KALKYL: kalkyl(),
    ...kontakt(),
  };
  let src = fs.readFileSync(path.join(__dirname, 'index.src.html'), 'utf8');
  src = src.replace(/\{\{(\w+)\}\}/g, (m, k) => { if (!(k in rep)) throw new Error('Okänd platshållare ' + k); return rep[k]; });
  fs.writeFileSync(path.join(ROOT, 'index.html'), src);
  return src.length;
}

/* ---------------- Case-sidor ---------------- */
const CASE_ART = { 'tidplan-i-modellen': () => R.caseTidplan(), 'trimble-connect': () => R.cardTC(), 'production-cockpit': () => R.cardCockpit(), binderbuilder: () => R.cardBinder() };
const DEMO = {
  flytta: { html: D.flytta, title: 'Flytta en aktivitet', cap: 'Dra en aktivitet i Gantten. Delarna i modellen byter status vecka 18, och det som blir sent syns direkt.' },
  kaskad: { html: D.kaskad, title: 'Kaskaden', cap: 'Flytta en aktivitet: efterföljarna flyttas automatiskt. I demon visar heatmapen antal aktiviteter per vecka. AI-delen visas inte i demon.' },
  platsminne: { html: D.platsminne, title: 'Platsminnet', cap: 'Varje objekt bär sina att göra-punkter, sin ritning och sitt foto. Ritning och foto är egenritade.' },
  sortera: { html: D.sortera, title: 'Sortera leveransen', cap: 'Tryck Kör: 24 generiska ritningar sorteras till pärmar per område.' },
};

function buildCase(id, idx) {
  const v = byId[id];
  const c = v.case;
  const base = '../../';
  const canonical = `${URL}verktyg/${id}/`;
  const title = `${v.namn} – ${fullName}`;
  const desc = c.lede;
  const s = statusOf(id);
  const demo = DEMO[c.demo];
  const demoFrame = (fig) => frame({ fig, title: demo.title, mode: 'Demo · generiska data', body: demo.html(), cls: 'frame-stage frame-demo', caption: esc(demo.cap) });
  const prevMedia = media(id + '/forhandsvisning', base, { eager: true });
  const preview = prevMedia
    ? frame({ fig: 1, title: v.namn, mode: prevMedia.mode, body: prevMedia.html, cls: 'frame-stage', attrs: ` data-vt="${id}"` })
    : demoFrame(1).replace('<figure class="frame', `<figure data-vt="${id}" class="frame`);

  const fakta = [...c.fakta, ['Status', badge(id)]];
  const factsHtml = fakta.map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${k === 'Status' ? val : esc(val)}</dd></div>`).join('');

  const fig = { n: 1 }; // löpande figurnummer i sidans ordning
  const steps = c.steg.map((st, i) => {
    const m = media(`${id}/steg-${i + 1}`, base);
    return `<li class="step reveal"><span class="step-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div class="step-b"><h3>${esc(st.t)}</h3><p>${esc(st.p)}</p>${m ? `<div class="step-m">${frame({ fig: ++fig.n, title: st.t, mode: m.mode, body: m.html })}</div>` : ''}</div></li>`;
  }).join('');

  const fnMedia = {};
  c.funktioner.forEach((f) => { if (f.bild === false) return; const m = media(`${id}/funktion-${f.key}`, base); if (m) fnMedia[f.key] = m; });
  const art = CASE_ART[id]();
  const fnBody = `<div class="fn-art" data-art>${art}</div>${Object.entries(fnMedia).map(([k, m]) => `<div class="fn-m" data-f="${k}" hidden>${m.html}</div>`).join('')}`;
  const fnList = c.funktioner.map((f) => f.bild === false
    ? `<li class="fn-plain"><span class="fn-n">${esc(f.namn)}</span><span class="fn-t">${esc(f.text)}</span></li>`
    : `<li><button type="button" class="fn-b" data-f="${f.key}" data-mode="${fnMedia[f.key] ? esc(fnMedia[f.key].mode) : 'Illustration'}" aria-pressed="false"><span class="fn-n">${esc(f.namn)}</span><span class="fn-t">${esc(f.text)}</span></button></li>`).join('');

  // Teknik och Status: bara fält med värde visas
  const T = c.teknik || {};
  const tekRows = [['Språk', T.sprak], ['Körs', T.kors], ['Data lagras', T.data], ['Externa tjänster', T.externa]].filter(([, v2]) => isSet(v2 || ''));
  const tekHtml = tekRows.length || (T.taggar || []).length ? `
<section class="c-sec" aria-labelledby="h-tech">
  <div class="wrap c-row">
    <h2 class="c-h" id="h-tech">Teknik</h2>
    <div class="c-c">
      ${tekRows.length ? `<dl class="facts c-facts">${tekRows.map(([k, v2]) => `<div><dt>${k}</dt><dd>${esc(v2)}</dd></div>`).join('')}</dl>` : ''}
      ${(T.taggar || []).length ? tags(T.taggar) : ''}
    </div>
  </div>
</section>` : '';
  const S = c.status || {};
  const stRows = [['Fungerar i dag', S.fungerar], ['Återstår', S.aterstar]].filter(([, v2]) => isSet(v2 || ''));
  const fnHtml = c.funktioner.length ? `
<section class="c-sec c-fn" aria-labelledby="h-fn">
  <div class="wrap">
    <div class="c-row"><h2 class="c-h" id="h-fn">Funktioner</h2><p class="c-c c-note js-only">Välj en funktion för att se var den finns.</p></div>
    <div class="fn" data-fn>
      <ul class="fn-list">${fnList}</ul>
      <div class="fn-stage">FNFRAME</div>
    </div>
  </div>
</section>` : '';

  const next = byId[caseOrdning[(idx + 1) % caseOrdning.length]];
  const nextArt = CASE_ART[next.id]();
  const nytta = c.nytta.map((n) => `<li>${esc(n)}</li>`).join('');

  const demoLater = prevMedia ? `
<section class="scene c-demo" aria-labelledby="h-demo">
  <div class="wrap">
    <div class="c-row"><h2 class="c-h" id="h-demo">Prova själv</h2><div class="c-c">${demoFrame(++fig.n)}</div></div>
  </div>
</section>` : '';

  const fnFinal = fnHtml.replace('FNFRAME', () => frame({ fig: ++fig.n, title: 'Funktioner', mode: 'Illustration', body: fnBody, cls: 'frame-fn' }));
  const jsonld = { '@context': 'https://schema.org', '@type': 'CreativeWork', name: v.namn, description: c.lede, url: canonical, inLanguage: 'sv', creator: { '@type': 'Person', name: fullName, url: URL } };

  const html = `${head({ base, title, desc, canonical, ogImageAlt: 'Linjeritning av en industrihall i statusfärger, vecka 18', jsonld })}
<body>
${header(base, false)}

<main id="innehall" tabindex="-1">

<section class="c-hero" aria-labelledby="h1">
  <div class="wrap">
    <nav class="crumbs" aria-label="Brödsmulor"><ol><li><a href="${base}#verktyg">Verktyg</a></li><li><span aria-current="page">${esc(v.namn)}</span></li></ol></nav>
    <div class="c-hero-in">
      <div class="c-hero-t">
        <h1 id="h1">${esc(v.namn)}</h1>
        <p class="lead">${esc(c.lede)}</p>
      </div>
      <dl class="facts">${factsHtml}</dl>
    </div>
  </div>
</section>

<section class="scene c-prev" aria-label="Förhandsvisning">
  <div class="wrap wrap-bleed">
    ${preview}
  </div>
</section>

<section class="c-sec" aria-labelledby="h-problem">
  <div class="wrap c-row">
    <h2 class="c-h" id="h-problem">Problemet</h2>
    <div class="c-c">${c.problem.map((p, i) => `<p class="${i ? 'c-p' : 'c-lead'}">${esc(p)}</p>`).join('')}</div>
  </div>
</section>

<section class="c-sec" aria-labelledby="h-how">
  <div class="wrap c-row">
    <h2 class="c-h" id="h-how">Så fungerar det</h2>
    <ol class="c-c steps">${steps}</ol>
  </div>
</section>
${demoLater}
${fnFinal}
${tekHtml}

<section class="c-sec" aria-labelledby="h-status">
  <div class="wrap c-row">
    <h2 class="c-h" id="h-status">Status</h2>
    <div class="c-c"><p class="c-status">${badge(id)}</p>${stRows.length ? `<dl class="facts c-facts">${stRows.map(([k, v2]) => `<div><dt>${k}</dt><dd>${esc(v2)}</dd></div>`).join('')}</dl>` : ''}</div>
  </div>
</section>

<section class="c-sec" aria-labelledby="h-nytta">
  <div class="wrap c-row">
    <h2 class="c-h" id="h-nytta">Nytta</h2>
    <div class="c-c">
      <ul class="nytta">${nytta}</ul>
      <p class="more-link"><a class="tlink" href="${base}?verktyg=${id}#kalkyl">Räkna på handgreppen i ditt projekt ${arrow}</a></p>
    </div>
  </div>
</section>

<section class="c-next" aria-labelledby="h-next">
  <div class="wrap">
    <h2 class="vh" id="h-next">Nästa verktyg</h2>
    <a class="next" href="${base}verktyg/${next.id}/">
      <span class="next-t"><span class="over">Nästa verktyg</span><span class="next-n">${esc(next.namn)}</span><span class="next-l">${esc(next.case.lede)}</span><span class="tlink">Se hur det fungerar ${arrow}</span></span>
      <span class="next-a" aria-hidden="true">${nextArt}</span>
    </a>
    <p class="back"><a class="tlink" href="${base}#verktyg"><span class="arr arr-l" aria-hidden="true">←</span> Alla verktyg</a></p>
  </div>
</section>

</main>

${footer()}`;
  const dir = path.join(ROOT, 'verktyg', id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return html.length;
}

/* ---------------- 404, sitemap, robots ---------------- */
function build404() {
  const base = URL_PATH;
  const html = `${head({ base, title: `Sidan finns inte – ${fullName}`, desc: 'Sidan finns inte.', canonical: URL, ogImageAlt: 'Linjeritning av en industrihall', jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Sidan finns inte' } }).replace(/<link rel="canonical"[^>]*>\n/, '').replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"')}
<body>
${header(base, false)}
<main id="innehall" tabindex="-1">
<section class="c-hero nf">
  <div class="wrap">
    <p class="over">Fel 404</p>
    <h1 id="h1">Ritningen finns inte i förteckningen.</h1>
    <p class="lead">Adressen leder inte till någon sida. Börja om från startsidan.</p>
    <p class="more-link"><a class="btn btn-main" href="${base}">Till startsidan</a></p>
  </div>
</section>
</main>
${footer()}`;
  fs.writeFileSync(path.join(ROOT, '404.html'), html);
}
function buildSeo() {
  const urls = [URL, ...caseOrdning.map((id) => `${URL}verktyg/${id}/`)];
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${URL}sitemap.xml\n`);
}

/* ---------------- Kör ---------------- */
function build() {
  const n = buildHome();
  console.log('Skrev index.html (' + n + ' tecken)');
  caseOrdning.forEach((id, i) => { if (!byId[id] || !byId[id].case) throw new Error('Case saknas för ' + id); const k = buildCase(id, i); console.log(`Skrev verktyg/${id}/index.html (${k} tecken)`); });
  build404();
  buildSeo();
  fs.writeFileSync(path.join(ROOT, 'img', 'favicon.svg'), R.favicon());
  const hero = R.hall('og');
  fs.writeFileSync(path.join(__dirname, 'og-hero.svg'), hero.svg);
  Object.keys(MEDIA).forEach((k) => { if (!usedSlots.has(k)) warn(`platsen "${k}" i media.js används inte på någon sida`); });
  console.log('Klart. Media ifyllda: ' + Object.values(MEDIA).filter(Boolean).length + ' av ' + Object.keys(MEDIA).length);
}

module.exports = { build };
if (require.main === module) build();
