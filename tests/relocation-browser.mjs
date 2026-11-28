import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { indiaDate, windowEnd } from '../scripts/job-window.mjs';
import { relocationListings } from '../scripts/relocation.mjs';

const pw = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const engine = process.env.BROWSER || 'chromium';
const browser = await pw[engine].launch(engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {});
const base = process.env.PREVIEW_URL || 'http://localhost:4173';
const jobs = relocationListings(JSON.parse(await readFile(new URL('../data/relocation-jobs.json', import.meta.url))), indiaDate());
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route('https://cloud.umami.is/**', route => route.abort());
  await page.goto(base);
  const views = page.getByRole('group', {name:'Job views'});
  const abroad = views.getByRole('link', {name:'Jobs abroad', exact:true});
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({width, height:812});
    const left = await views.getByRole('button', {name:'All jobs'}).boundingBox();
    const tab = await abroad.boundingBox();
    const right = await views.getByRole('button', {name:/Saved jobs/}).boundingBox();
    assert.ok(tab && left && right && left.x + left.width <= tab.x && tab.x + tab.width <= right.x);
    assert.ok(tab.y === left.y && tab.y === right.y && tab.y >= 0 && tab.y + tab.height <= 812, 'All three views are visible together at ' + width);
  }
  await abroad.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL('**/relocation/');
  assert.ok(await page.getByRole('heading', {level:1, name:'Jobs abroad with relocation'}).isVisible());
  const links = page.locator('.relocation-row:visible a');
  const sources = () => links.evaluateAll(nodes => nodes.map(node => node.href));
  assert.deepEqual(await sources(), jobs.map(job => job.source_url));
  const logos = new Map(JSON.parse(await readFile(new URL('../data/company-logos.json', import.meta.url))).logos.map(({company, file}) => [company, file]));
  const images = page.locator('.relocation-row img');
  assert.deepEqual(await images.evaluateAll(nodes => nodes.map(img => img.src.split('/').pop())),
    jobs.map(job => logos.get(job.company)).filter(Boolean));
  const visuals = page.locator('.relocation-hero img, .relocation-row img');
  await visuals.evaluateAll(async nodes => {
    for (const img of nodes) img.loading = 'eager';
    await Promise.all(nodes.map(img => img.decode()));
  });
  const destination = page.getByLabel('Destination', {exact:true});
  if (new Set(jobs.map(job => job.country)).size > 1) {
    const country = jobs.at(-1).country;
    await destination.selectOption(country);
    const expected = jobs.filter(job => job.country === country).map(job => job.source_url);
    assert.deepEqual(await sources(), expected);
    assert.equal(new URL(page.url()).searchParams.get('country'), country);
    await page.reload();
    assert.equal(await destination.inputValue(), country);
    assert.deepEqual(await sources(), expected);
    await page.goto(new URL('?country=INVALID', page.url()).href);
    assert.deepEqual(await sources(), jobs.map(job => job.source_url));
  }
  for (const width of [1440,1024,768,481,390,361,320]) {
    await page.setViewportSize({width,height:850});
    assert.ok(await page.evaluate(() => {
      const header = document.querySelector('.brand').getBoundingClientRect();
      const nav = document.querySelector('.nav nav').getBoundingClientRect();
      return document.documentElement.scrollWidth <= innerWidth && header.right <= nav.left && nav.right <= innerWidth;
    }), 'Navigation or cards overflow at ' + width);
  }
  if (process.env.AXE_MODULE && engine === 'chromium') {
    const axe = await import(pathToFileURL(process.env.AXE_MODULE).href);
    const Axe = axe.default.default || axe.default;
    const result = await new Axe({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(result.violations.map(v => v.id), []);
  }
  const noJs = await browser.newPage({javaScriptEnabled:false});
  await noJs.goto(base);
  await noJs.getByRole('group', {name:'Job views'}).getByRole('link', {name:'Jobs abroad'}).click();
  assert.equal(await noJs.locator('.relocation-row:visible a').count(), jobs.length);
  assert.equal(await noJs.locator('#destination-field').isVisible(), false);
  if (jobs.length) {
    const last = jobs.map(job => [windowEnd(job.posted_date), job.expiry_date || '9999-12-31'].sort()[0]).sort().at(-1);
    await page.clock.install({time:new Date(last + 'T18:29:00Z')});
    await page.reload();
    await page.clock.fastForward(60001);
    assert.equal(await links.count(), 0);
    assert.ok(await page.locator('#relocation-empty').isVisible());
  }
  console.log(engine + ': verified ' + jobs.length + ' relocation postings, destination links, navigation, mobile layout and expiry.');
} finally { await browser.close(); }
