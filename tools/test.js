#!/usr/bin/env node
/*
  Röktest: horisontell scroll, länkar, demos, utan JS, reduced motion, utskrift.
  Starta först en server i repots rot:  python3 -m http.server 8765
  Kör:  PUPPETEER_MODULE=/sökväg/puppeteer PUPPETEER_EXECUTABLE_PATH=/sökväg/chrome node tools/test.js
*/
const puppeteer = require(process.env.PUPPETEER_MODULE || 'puppeteer');
const BASE = process.env.BASE || 'http://localhost:8765/';
const PAGES = ['', 'verktyg/tidplan-i-modellen/', 'verktyg/trimble-connect/', 'verktyg/production-cockpit/', 'verktyg/binderbuilder/'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = []; const ok = (name, cond, info = '') => { results.push([cond ? 'OK ' : 'FEL', name, info]); };
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  const errs = [];
  const open = async (path, w = 1440, h = 900, o = {}) => {
    const p = await b.newPage();
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(path + ' ' + w + ': ' + m.text()); });
    p.on('pageerror', (e) => errs.push(path + ' ' + w + ' pageerror: ' + e.message));
    p.on('requestfailed', (r) => errs.push(path + ' reqfail ' + r.url()));
    p.on('response', (r) => { if (r.status() >= 400) errs.push(path + ' HTTP ' + r.status() + ' ' + r.url()); });
    if (o.nojs) await p.setJavaScriptEnabled(false);
    const feats = [];
    if (o.reduce) feats.push({ name: 'prefers-reduced-motion', value: 'reduce' });
    if (o.dark) feats.push({ name: 'prefers-color-scheme', value: 'dark' });
    if (feats.length) await p.emulateMediaFeatures(feats);
    if (o.touch) await p.emulate(puppeteer.KnownDevices['iPhone 13']); else await p.setViewport({ width: w, height: h });
    await p.goto(BASE + path, { waitUntil: 'networkidle0' });
    return p;
  };
  const scrollAll = (p) => p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 350) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 50)); } window.scrollTo({ top: 0, behavior: 'instant' }); });

  // 1. Bredder: horisontell scroll
  for (const path of PAGES) for (const w of [320, 390, 820, 1024, 1440]) {
    const p = await open(path, w, 900);
    await scrollAll(p); await wait(300);
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    ok(`scroll ${w} /${path}`, sw <= w, 'scrollWidth ' + sw);
    await p.close();
  }

  // 2. Länkar
  const seen = new Set(); const toCheck = [];
  for (const path of PAGES) {
    const p = await open(path);
    const links = await p.$$eval('a[href]', (as) => as.map((a) => a.href));
    links.forEach((l) => { if (l.startsWith(BASE) && !seen.has(l)) { seen.add(l); toCheck.push([path, l]); } });
    await p.close();
  }
  for (const [from, l] of toCheck) {
    const u = new URL(l);
    const p = await b.newPage();
    const res = await p.goto(u.origin + u.pathname + u.search, { waitUntil: 'domcontentloaded' });
    let hashOk = true;
    if (u.hash) hashOk = await p.evaluate((h) => !!document.getElementById(decodeURIComponent(h.slice(1))), u.hash);
    ok(`länk ${u.pathname}${u.search}${u.hash} (från /${from})`, [200, 304].includes(res.status()) && hashOk, res.status() + (hashOk ? '' : ' ankare saknas'));
    await p.close();
  }

  // 3. Startsidan: hero, flikar, filter, före/efter, kalkyl
  let p = await open('', 1440, 900);
  await wait(6800);
  ok('hero stannar på V 18 · NU', (await p.$eval('#wk', (e) => e.textContent + ' ' + document.getElementById('wk-tag').textContent)) === 'V 18 · NU');
  await p.$eval('#tidplan', (e) => e.scrollIntoView()); await wait(200);
  await p.click('#ft-montage'); await wait(300);
  ok('flik klick', await p.$eval('#fp-montage', (e) => !e.hasAttribute('data-off') && getComputedStyle(e).visibility === 'visible'));
  await p.focus('#ft-montage'); await p.keyboard.press('ArrowRight'); await wait(300);
  ok('flik tangent', await p.$eval('#fp-lagesbild', (e) => !e.hasAttribute('data-off')) && await p.evaluate(() => document.activeElement.id === 'ft-lagesbild'));
  await p.click('[data-filter="modell"]'); await wait(100);
  ok('filter modell', (await p.$$eval('.reg tbody tr', (r) => r.filter((x) => !x.hidden).length)) === 4);
  await p.click('[data-filter="alla"]');
  await p.$eval('#ba', (e) => e.scrollIntoView({ block: 'center' })); await wait(300);
  const r = await p.$eval('#ba', (e) => { const x = e.getBoundingClientRect(); return { x: x.x, y: x.y, w: x.width, h: x.height }; });
  await p.mouse.move(r.x + r.w / 2, r.y + r.h / 2); await p.mouse.down(); await p.mouse.move(r.x + r.w * .25, r.y + r.h / 2, { steps: 5 }); await p.mouse.up();
  ok('före/efter mus', (await p.$eval('#ba', (e) => e.style.getPropertyValue('--pos'))) === '25%');
  await p.$eval('#kalkyl', (e) => e.scrollIntoView()); await wait(1200);
  await p.click('[data-preset="binderbuilder"]'); await wait(400);
  ok('kalkyl förval', (await p.$eval('#o-week', (e) => e.textContent)) === '1 h', await p.$eval('#o-proj', (e) => e.textContent));
  await p.focus('#m-binder'); await p.keyboard.press('ArrowRight'); await wait(400);
  ok('kalkyl tangent', (await p.$eval('#o-week', (e) => e.textContent)) === '1,5 h');
  await p.close();
  p = await open('?verktyg=trimble-connect#kalkyl', 1440, 900); await wait(800);
  ok('kalkyl förval via länk', (await p.$eval('[data-preset="trimble-connect"]', (e) => e.getAttribute('aria-pressed'))) === 'true' && (await p.$eval('#m-tc', (e) => e.value)) === '1' && (await p.$eval('#m-binder', (e) => e.value)) === '0');
  await p.close();

  // 4. Demos
  p = await open('verktyg/tidplan-i-modellen/', 1440, 900); await wait(1200);
  const before = await p.$eval('.dfl-sum', (e) => e.textContent);
  const bar = '.dg-row[data-a="6"] .dg-bar';
  ok('demo B laddad (role slider)', (await p.$eval(bar, (e) => e.getAttribute('role'))) === 'slider');
  await p.focus(bar); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await wait(300);
  const after = await p.$eval('.dfl-sum', (e) => e.textContent);
  ok('demo B tangent ändrar status', before !== after, before + ' -> ' + after);
  const bb = await p.$eval('.dg-row[data-a="5"] .dg-bar', (e) => { const x = e.getBoundingClientRect(); return { x: x.x + x.width / 2, y: x.y + x.height / 2 }; });
  await p.mouse.move(bb.x, bb.y); await p.mouse.down(); await p.mouse.move(bb.x + 80, bb.y, { steps: 6 }); await p.mouse.up(); await wait(300);
  ok('demo B mus', (await p.$eval('.dg-row[data-a="5"] .dg-d', (e) => e.textContent)).startsWith('+'), await p.$eval('.dfl-sum', (e) => e.textContent));
  await p.click('.dfl [data-reset]'); await wait(200);
  ok('demo B återställ', (await p.$eval('.dfl-sum', (e) => e.textContent)) === before);
  await p.click('.fn-b[data-f="montage"]'); await wait(200);
  ok('funktion markerar grupp', await p.$eval('.fn-art svg', (s) => s.classList.contains('has-hl') && s.querySelector('[data-f="montage"]').classList.contains('is-hl')));
  await p.close();

  p = await open('verktyg/production-cockpit/', 1440, 900); await wait(1200);
  await p.$eval('.dka', (e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await wait(300);
  const kb = await p.$eval('.kg-row[data-id="C"] .kg-bar', (e) => { const x = e.getBoundingClientRect(); return { x: x.x + x.width / 2, y: x.y + x.height / 2, w: e.parentNode.getBoundingClientRect().width }; });
  await p.mouse.move(kb.x, kb.y); await p.mouse.down(); await p.mouse.move(kb.x + kb.w / 22 * 2, kb.y, { steps: 6 }); await p.mouse.up(); await wait(400);
  const ks = await p.$eval('.dka-sum', (e) => e.textContent);
  ok('demo C kaskad', /Stomme \+2 v/.test(ks) && /till flyttade/.test(ks), ks + ' / ' + await p.$eval('.dka-wk', (e) => e.textContent));
  // Regression: två flyttar i rad ska behålla den första (fel 1 i o3-test)
  await p.click('.dka [data-reset]'); await wait(200);
  const sOf = (id) => p.$eval(`.kg-row[data-id="${id}"]`, (r) => +getComputedStyle(r).getPropertyValue('--s'));
  await p.focus('.kg-row[data-id="C"] .kg-bar'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  await p.focus('.kg-row[data-id="E"] .kg-bar'); await p.keyboard.press('ArrowRight'); await wait(200);
  ok('demo C två flyttar i rad', (await sOf('C')) === 8 && (await sOf('E')) === 13, 'C ' + await sOf('C') + ' E ' + await sOf('E'));
  await p.click('.dka [data-reset]'); await wait(200);
  await p.focus('.kg-row[data-id="H"] .kg-bar'); for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowRight');
  await p.focus('.kg-row[data-id="I"] .kg-bar'); await p.keyboard.press('Home'); await wait(200);
  const hS = await sOf('H'), iS = await sOf('I');
  ok('demo C Home efter push', hS === 17 && iS === 21 && (await p.$eval('.dka-wk', (e) => e.textContent)).startsWith('Klart V 21'), `H ${hS} I ${iS} ` + await p.$eval('.dka-wk', (e) => e.textContent));
  await p.focus('.kg-row[data-id="A"] .kg-bar'); await p.keyboard.press('End'); await wait(200);
  ok('demo C End når aria-valuemax', (await sOf('A')) === +(await p.$eval('.kg-row[data-id="A"] .kg-bar', (e) => e.getAttribute('aria-valuemax'))) && (await sOf('A')) > 1, 'A ' + await sOf('A'));
  await p.click('.dka [data-reset]'); await wait(200);
  await p.focus('.kg-row[data-id="A"] .kg-bar'); await p.keyboard.press('ArrowRight'); await wait(300);
  ok('demo C tangent', /Schakt \+1 v/.test(await p.$eval('.dka-sum', (e) => e.textContent)));
  await p.close();

  p = await open('verktyg/trimble-connect/', 1440, 900); await wait(1200);
  await p.$eval('.dpm', (e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await wait(300);
  await p.click('.pm-btn[data-o="p4"]'); await wait(200);
  ok('demo D knapp', await p.$eval('.pm-panel[data-o="p4"]', (e) => !e.hidden) && await p.$eval('.pm-panel[data-o="p1"]', (e) => e.hidden));
  const ob = await p.$eval('.pm-obj[data-o="p3"]', (e) => { const x = e.getBoundingClientRect(); return { x: x.x + x.width / 2, y: x.y + x.height * .7 }; });
  await p.mouse.click(ob.x, ob.y); await wait(200);
  ok('demo D klick i modell', await p.$eval('.pm-panel[data-o="p3"]', (e) => !e.hidden));
  await p.close();

  p = await open('verktyg/binderbuilder/', 1440, 900); await wait(1200);
  ok('demo E startläge', (await p.$eval('.so-left', (e) => e.textContent)) === '24');
  await p.focus('[data-run]'); await p.keyboard.press('Enter'); await wait(2500);
  ok('demo E fokus kvar på Kör', await p.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-run')));
  ok('demo E sorterat', (await p.$eval('.so-left', (e) => e.textContent)) === '0' && (await p.$$eval('.so-n', (a) => a.map((x) => x.textContent).join(','))) === '8,8,8', await p.$$eval('.so-n', (a) => a.map((x) => x.textContent).join(',')));
  await p.click('.dso [data-reset]'); await wait(800);
  ok('demo E återställ', (await p.$eval('.so-left', (e) => e.textContent)) === '24');
  await p.close();

  // Mobil: registret fälls ihop och går att fälla ut, kalkylens moment är hopfällda
  p = await open('', 390, 844); await wait(500);
  ok('register hopfällt i mobil', (await p.$$eval('.reg tbody tr', (r) => r.filter((x) => getComputedStyle(x).display !== 'none').length)) === 5);
  await p.$eval('[data-reg-more]', (e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await p.click('[data-reg-more]'); await wait(200);
  ok('register utfällt', (await p.$$eval('.reg tbody tr', (r) => r.filter((x) => getComputedStyle(x).display !== 'none').length)) === 12);
  ok('meny utan Kontakt när kontaktväg saknas', (await p.$$eval('.nav a', (a) => a.map((x) => x.textContent))).join(',') === 'Verktyg,Arbetssätt,Erfarenhet');
  ok('mobilmeny håller marginal', (await p.$$eval('.nav a', (a) => Math.max(...a.map((x) => x.getBoundingClientRect().right)))) <= 372);
  await p.close();

  // Touch: lodrät svepning på demo-stapel ska inte flytta
  p = await open('verktyg/production-cockpit/', 390, 844, { touch: true }); await wait(800);
  await p.$eval('.dka', (e) => e.scrollIntoView({ block: 'center' })); await wait(1000);
  const tb = await p.$eval('.kg-row[data-id="C"] .kg-bar', (e) => { const x = e.getBoundingClientRect(); return { x: x.x + x.width / 2, y: x.y + x.height / 2 }; });
  await p.touchscreen.touchStart(tb.x, tb.y); await p.touchscreen.touchMove(tb.x + 2, tb.y - 60); await p.touchscreen.touchEnd(); await wait(300);
  ok('touch lodrätt flyttar inte', /Planen som den är lagd/.test(await p.$eval('.dka-sum', (e) => e.textContent)));
  await p.close();

  // 5. Utan JS
  for (const path of PAGES) {
    p = await open(path, 390, 844, { nojs: true });
    const hidden = await p.$$eval('.reveal', (a) => a.filter((e) => getComputedStyle(e).opacity !== '1').length);
    const ph = await p.evaluate(() => /\[(EFTERNAMN|E-POST|LINKEDIN)\]/.test(document.body.innerText));
    ok(`utan JS /${path}`, hidden === 0 && !ph, 'dolda ' + hidden + (ph ? ' PLATSHÅLLARE SYNS' : ''));
    await p.close();
  }
  p = await open('verktyg/binderbuilder/', 1440, 900, { nojs: true });
  ok('utan JS demo E slutläge', (await p.$$eval('.so-b .so-f', (a) => a.length)) === 24);
  await p.screenshot({ path: '/tmp/nojs-binder.png' });
  await p.close();

  // 6. Reduced motion, mörkt läge, utskrift
  p = await open('', 1440, 900, { reduce: true }); await wait(800);
  ok('reduced motion: V 18 direkt', (await p.$eval('#wk', (e) => e.textContent)) === 'V 18');
  await p.close();
  p = await open('', 1440, 900, { dark: true }); await wait(7000);
  await p.screenshot({ path: '/tmp/dark-home.png' });
  await p.close();
  p = await open('verktyg/trimble-connect/', 1440, 900, { dark: true }); await wait(1500);
  await p.screenshot({ path: '/tmp/dark-case.png', fullPage: true });
  await p.close();
  p = await open('', 1440, 900);
  await p.emulateMediaType('print');
  await p.pdf({ path: '/tmp/print.pdf', format: 'A4' });
  ok('utskrift reveal synliga', (await p.$$eval('.reveal', (a) => a.filter((e) => getComputedStyle(e).opacity !== '1').length)) === 0);
  await p.close();

  results.forEach((r) => console.log(r.join('  ')));
  console.log('FEL:', results.filter((r) => r[0] === 'FEL').length, 'av', results.length);
  console.log('Konsol/nätverk:', errs.length ? errs : 'inga');
  await b.close();
})();
