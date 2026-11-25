#!/usr/bin/env node
/*
  Ritar om img/og.png (1200 × 630) i samma stil som sidan.
  Kräver puppeteer:  PUPPETEER_EXECUTABLE_PATH=/sökväg/till/chrome node tools/og.js
  Kör  node tools/gen.js  först så att namnet i tools/config.js och hallen är aktuella.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const config = require('./config');
const ROOT = path.join(__dirname, '..');
const puppeteer = require(process.env.PUPPETEER_MODULE || 'puppeteer');

const set = (v) => typeof v === 'string' && v.trim() && v.trim()[0] !== '[';
const name = 'Victor' + (set(config.person.efternamn) ? ' ' + config.person.efternamn : '');
const svg = fs.readFileSync(path.join(__dirname, 'og-hero.svg'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
const html = `<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8">
<style>${css.replace(/\.\.\/fonts\//g, 'file://' + path.join(ROOT, 'fonts') + '/')}
body{margin:0;width:1200px;height:630px;overflow:hidden}
.og{display:grid;grid-template-columns:480px 1fr;gap:36px;padding:56px;height:630px;box-sizing:border-box;align-items:center}
.og .n{font:600 30px var(--sans);margin:0 0 14px}.og .c{font:600 58px/1.04 var(--sans);letter-spacing:-.03em;margin:0}
.box{background:#fff;border:1.5px solid #16191D;padding:12px}.box p{font:500 13px var(--mono);letter-spacing:.08em;margin:6px 4px 0}
</style></head><body><div class="og"><div><p class="over">Planering · VDC · Egna verktyg</p><p class="n">${name}</p><p class="c">Tidplanen styr modellen. Verktygen bygger jag själv.</p></div>
<div class="box">${svg}<p>V 18 · NU &nbsp; <span style="color:#2E8B57">&#9632;</span> KLAR &nbsp;<span style="color:#D99A00">&#9632;</span> PÅGÅR &nbsp;<span style="color:#C8403A">&#9632;</span> FÖRSENAD &nbsp;<span style="color:#3466C9">&#9633;</span> PLANERAD</p></div></div></body></html>`;

(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1200, height: 630 });
  const tmp = path.join(require('os').tmpdir(), 'portfolio-og.html');
  fs.writeFileSync(tmp, html);
  await p.goto('file://' + tmp, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 300));
  await p.screenshot({ path: path.join(ROOT, 'img', 'og.png') });
  await b.close();
  console.log('Skrev img/og.png');
})();
