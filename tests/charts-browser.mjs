// Run against the local preview with the same Playwright environment as tests/browser.mjs.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { readJobs, activeJobs } from '../scripts/jobs.mjs';
import { jobLocations } from '../scripts/locations.mjs';
import { windowEnd } from '../scripts/job-window.mjs';

const pw = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const engine = process.env.BROWSER || 'chromium';
const browser = await pw[engine].launch(engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {});
const base = process.env.PREVIEW_URL || 'http://localhost:4173';
const jobs = activeJobs(readJobs(await readFile(new URL('../data/jobs.csv', import.meta.url), 'utf8')));
const places = job => jobLocations(job.location, job.work_mode).map(place => place.id);
const context = await browser.newContext({viewport:{width:1440,height:900}, colorScheme:'light'});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const chart = page.locator('#job-charts');
const bars = key => page.locator('#' + key + '-chart button');
const counts = key => bars(key).evaluateAll(nodes => nodes.map(node => [node.dataset.value, Number(node.querySelector('.chart-count').textContent)]));
async function verifyLight(tab) {
  const scheme = await tab.locator('html').evaluate(root => getComputedStyle(root).colorScheme);
  assert.deepEqual(scheme.split(' ').sort(), ['light', 'only']);
  assert.equal(await tab.locator('#theme, #dark-palette').count(), 0);
}

try {
  await context.addInitScript(() => localStorage.setItem('go-careers:theme:v1', 'dark'));
  await page.goto(base);
  await verifyLight(page);
  await page.emulateMedia({colorScheme:'dark'});
  await page.reload();
  await verifyLight(page);
  const tab = await context.newPage();
  await tab.emulateMedia({colorScheme:'dark'});
  await tab.goto(base + '/applications/');
  await verifyLight(tab);
  await tab.close();

  assert.equal(await chart.getAttribute('open'), null);
  await chart.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.ok(await bars('city').count() > 0);
  const widths = await chart.locator('.chart-bars button').evaluateAll(items => items.map(item => ({
    count: Number(item.querySelector('.chart-count').textContent),
    percent: parseFloat(item.style.getPropertyValue('--bar-width')),
  })));
  const largest = Math.max(...widths.map(item => item.count));
  assert.ok(widths.every(item => Math.abs(item.percent - 100 * item.count / largest) < 0.001), 'Both charts share a count scale');
  const cityCounts = await counts('city');
  const allCities = new Map();
  for (const job of jobs) for (const id of places(job)) {
    if (id !== 'remote' && id !== 'city-unspecified') allCities.set(id, (allCities.get(id) || 0) + 1);
  }
  assert.deepEqual(cityCounts.map(([,n]) => n), [...allCities.values()].sort((a,b) => b-a).slice(0,5));
  for (const [city, count] of cityCounts) assert.equal(count, allCities.get(city));
  assert.equal((await counts('mode')).reduce((sum,[,n]) => sum+n, 0), jobs.length);
  const [city, cityTotal] = cityCounts[0];
  await bars('city').first().focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#location').inputValue(), city);
  assert.match(await page.locator('#chart-result-link').innerText(), new RegExp('View ' + cityTotal + ' matching job'));
  assert.equal(new URL(page.url()).searchParams.get('location'), city);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.value), city);
  assert.match(await page.locator('#result-count').textContent(), new RegExp('of ' + cityTotal + ' opportunities'));
  const cityJobs = jobs.filter(job => places(job).includes(city));
  const workCounts = await counts('mode');
  for (const [mode, count] of workCounts) assert.equal(count, cityJobs.filter(job => job.work_mode === mode).length);
  const [mode] = workCounts[0];
  await bars('mode').first().click();
  assert.equal(await page.locator('#mode').inputValue(), mode);
  for (const [town, count] of await counts('city')) {
    assert.equal(count, jobs.filter(job => job.work_mode === mode && places(job).includes(town)).length);
  }
  await page.reload();
  await chart.locator('summary').click();
  assert.equal(await page.locator('#mode-chart [aria-pressed=true]').getAttribute('data-value'), mode);
  await page.locator('#mode-chart [aria-pressed=true]').click();
  assert.equal(await page.locator('#mode').inputValue(), '');
  await page.locator('#city-chart [aria-pressed=true]').click();
  assert.equal(await page.locator('#location').inputValue(), '');

  await page.locator('#saved-view').click();
  assert.equal(await bars('city').count(), 0);
  assert.match(await page.locator('#mode-chart').innerText(), /No matching jobs/);
  await page.locator('#all-view').click();
  await page.locator('#search').fill('no-such-role-983747');
  assert.equal(await bars('mode').count(), 0);
  await page.locator('#clear-search').click();
  const first = page.locator('.job-card:visible').first();
  await first.locator('[data-save-id]').click();
  await page.locator('#saved-view').click();
  assert.deepEqual((await counts('mode')).map(([,n]) => n), [1]);
  await page.locator('#all-view').click();

  const axeModule = process.env.AXE_MODULE && await import(pathToFileURL(process.env.AXE_MODULE).href);
  for (const width of [1440, 768, 481, 390, 361, 320]) {
    await page.setViewportSize({width,height:844});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Charts or navigation overflow at ' + width);
    assert.equal(await page.locator('.chart-switch').isVisible(), width <= 480);
    assert.equal(await page.locator('#mode-panel').isVisible(), width > 480);
    if (engine === 'chromium' && axeModule && [1440, 390].includes(width)) {
      const Axe = axeModule.default.default || axeModule.default;
      const audit = await new Axe({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      assert.deepEqual(audit.violations.map(v => [v.id, v.nodes.map(n => n.target)]), []);
    }
  }
  const workStyle = page.getByRole('button', {name:'Work style', exact:true});
  await workStyle.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#city-panel').isVisible(), false);
  assert.equal(await workStyle.getAttribute('aria-pressed'), 'true');
  await bars('mode').first().click();
  assert.ok(new URL(page.url()).searchParams.has('mode'));
  await page.locator('#job-charts a').click();
  assert.equal(new URL(page.url()).hash, '#open-roles');
  assert.equal(await chart.getAttribute('open'), null);
  await page.getByRole('link', {name:'Back to top'}).click();
  assert.equal(new URL(page.url()).hash, '#top');
  assert.equal(await page.evaluate(() => scrollY), 0);
  await first.locator('h3 a').click();
  await verifyLight(page);

  const noJS = await browser.newPage({javaScriptEnabled:false, colorScheme:'dark'});
  await noJS.goto(base);
  await verifyLight(noJS);
  assert.equal(await noJS.locator('#job-charts').isVisible(), false);
  assert.equal(await noJS.locator('.job-card:visible').count(), jobs.length);
  const aging = await browser.newPage();
  const lastDay = jobs.map(job => windowEnd(job.posted_date)).sort().at(-1);
  await aging.clock.install({time:new Date(lastDay + 'T18:29:00Z')});
  await aging.goto(base);
  await aging.locator('#job-charts summary').click();
  await aging.clock.fastForward(60001);
  assert.equal(await aging.locator('.chart-bars button').count(), 0, 'Expired listings disappear from both charts at India midnight');
  assert.deepEqual(errors, []);
  console.log(engine + ': chart counts, filters, keyboard, responsive layout, and light-only appearance checks passed.');
} finally { await browser.close(); }
