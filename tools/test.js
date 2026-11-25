#!/usr/bin/env node
/*
  Röktest och skärmbilder.  Kör:
  PUPPETEER_MODULE=/sökväg/puppeteer PUPPETEER_EXECUTABLE_PATH=/sökväg/chrome node tools/test.js [utmapp]
  Kontrollerar konsolfel, horisontell scroll, uppspelning, reglage, utan JS,
  reduced motion och utskrift, och sparar skärmbilder i utmappen.
*/
'use strict';
const path = require('path');
const fs = require('fs');
const puppeteer = require(process.env.PUPPETEER_MODULE || 'puppeteer');
const http = require('http');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
let URL;
const OUT = process.argv[2] || path.join(require('os').tmpdir(), 'portfolio-test');
fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

(async () => {
  await new Promise((r) => server.once('listening', r));
  URL = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  const errs = [];
  const page = async (w, h = 900, opts = {}) => {
    const p = await b.newPage();
    p.on('console', (m) => { if (m.type() === 'error') errs.push(w + ': ' + m.text()); });
    p.on('pageerror', (e) => errs.push(w + ': ' + e.message));
    if (opts.nojs) await p.setJavaScriptEnabled(false);
    if (opts.reduce) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    if (opts.device) await p.emulate(opts.device); else await p.setViewport({ width: w, height: h });
    await p.goto(URL, { waitUntil: 'networkidle0' });
    return p;
  };
  const scrollAll = (p) => p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 90)); } window.scrollTo({ top: 0, behavior: 'instant' }); });

  // Bredder
  for (const w of [320, 375, 390, 768, 1024, 1440]) {
    const p = await page(w);
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    log(w, 'px scrollWidth', sw, sw > w ? 'FEL' : 'ok');
    await p.close();
  }

  // Uppspelning och skärmbilder
  const d = await page(1440, 900);
  const early = await d.$eval('#wk', (e) => e.textContent);
  await wait(6500);
  log('hero', early, '->', await d.$eval('#wk', (e) => e.textContent + ' ' + document.getElementById('wk-tag').textContent));
  await d.screenshot({ path: path.join(OUT, 'runda2-hero.png') });
  await scrollAll(d); await wait(1500);
  await d.screenshot({ path: path.join(OUT, 'runda2-desktop.png'), fullPage: true });
  await d.focus('#wk-range'); await d.keyboard.press('End');
  log('End ->', await d.$eval('#wk-range', (e) => e.getAttribute('aria-valuetext')));
  await d.$eval('#ba', (e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await wait(200);
  const r = await d.$eval('#ba', (e) => { const x = e.getBoundingClientRect(); return { x: x.x, y: x.y, w: x.width, h: x.height }; });
  await d.mouse.move(r.x + r.w / 2, r.y + r.h / 2); await d.mouse.down(); await d.mouse.move(r.x + r.w * 0.25, r.y + r.h / 2, { steps: 5 }); await d.mouse.up();
  log('ba mus ->', await d.$eval('#ba', (e) => e.style.getPropertyValue('--pos')));
  await d.focus('#ba-range'); await d.keyboard.press('ArrowRight');
  log('ba tangent ->', await d.$eval('#ba', (e) => e.style.getPropertyValue('--pos')));
  await d.close();

  const m = await page(390, 844);
  await wait(6500); await scrollAll(m); await wait(1500);
  await m.screenshot({ path: path.join(OUT, 'runda2-mobil.png'), fullPage: true });
  await m.close();

  // Touch: vertikal svepning får inte flytta Före/Efter, vågrät ska
  const t = await page(390, 844, { device: puppeteer.KnownDevices['iPhone 13'] });
  await t.$eval('#ba', (e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await wait(200);
  const q = await t.$eval('#ba', (e) => { const x = e.getBoundingClientRect(); return { x: x.x, y: x.y, w: x.width, h: x.height }; });
  await t.touchscreen.touchStart(q.x + q.w * 0.2, q.y + q.h * 0.5);
  await t.touchscreen.touchMove(q.x + q.w * 0.21, q.y + q.h * 0.1);
  await t.touchscreen.touchEnd();
  log('touch vertikal ->', await t.$eval('#ba', (e) => e.style.getPropertyValue('--pos')));
  await wait(1200);
  await t.$eval('#ba', (e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await wait(300);
  Object.assign(q, await t.$eval('#ba', (e) => { const x = e.getBoundingClientRect(); return { x: x.x, y: x.y, w: x.width, h: x.height }; }));
  await t.touchscreen.touchStart(q.x + q.w * 0.5, q.y + q.h * 0.5);
  await t.touchscreen.touchMove(q.x + q.w * 0.65, q.y + q.h * 0.52);
  await t.touchscreen.touchMove(q.x + q.w * 0.8, q.y + q.h * 0.52);
  await t.touchscreen.touchEnd();
  log('touch vågrät ->', await t.$eval('#ba', (e) => e.style.getPropertyValue('--pos')));
  await t.close();

  // Utan JS, reduced motion, utskrift
  const n = await page(390, 844, { nojs: true });
  log('utan JS: dolda reveal', await n.$$eval('.reveal', (a) => a.filter((e) => getComputedStyle(e).opacity !== '1').length), 'vecka', await n.$eval('#wk', (e) => e.textContent));
  await n.screenshot({ path: path.join(OUT, 'runda2-nojs.png'), fullPage: true });
  await n.close();
  const rm = await page(1440, 900, { reduce: true });
  await wait(1500);
  log('reduced: vecka', await rm.$eval('#wk', (e) => e.textContent), 'dolda', await rm.$$eval('.reveal', (a) => a.filter((e) => getComputedStyle(e).opacity !== '1').length));
  await rm.close();
  const pr = await page(1440, 900);
  await pr.emulateMediaType('print');
  log('utskrift: dolda reveal', await pr.$$eval('.reveal', (a) => a.filter((e) => getComputedStyle(e).opacity !== '1').length));
  await pr.pdf({ path: path.join(OUT, 'runda2-utskrift.pdf'), format: 'A4', printBackground: false });
  await pr.close();

  log('konsolfel', errs.length ? errs : 'inga');
  await b.close();
  server.close();
})();
