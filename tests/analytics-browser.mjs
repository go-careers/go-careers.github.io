// Optional integration QA: uses the public tracker, intercepts every network request.
// UMAMI_SCRIPT_PATH must point to a downloaded https://cloud.umami.is/script.js.
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from '../scripts/build.mjs';
import { readJobs, activeJobs } from '../scripts/jobs.mjs';
import { locationOptions } from '../scripts/locations.mjs';
const sampleLocation = locationOptions(activeJobs(readJobs(await readFile(new URL('../data/jobs.csv', import.meta.url), 'utf8'))))[0];
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const tracker = await readFile(process.env.UMAMI_SCRIPT_PATH, 'utf8');
const output = await mkdtemp(join(tmpdir(), 'gocareers-tracking-'));
const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {})});
const base = 'https://go-careers.github.io';
const events = [], errors = [];
let releaseTracker;
const trackerGate = new Promise(resolve => { releaseTracker = resolve; });
async function contextFor(mode = 'normal') {
  const context = await browser.newContext();
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'cloud.umami.is') {
      if (mode === 'blocked') return route.abort();
      if (mode === 'delayed') await trackerGate;
      return route.fulfill({contentType:'application/javascript',body:tracker});
    }
    if (url.hostname === 'gateway.umami.is') {
      events.push(JSON.parse(route.request().postData()));
      return route.fulfill({contentType:'application/json',body:'{}'});
    }
    if (url.origin === base || url.hostname === 'localhost') {
      const file = resolve(output, '.' + decodeURIComponent(url.pathname) + (url.pathname.endsWith('/') ? 'index.html' : ''));
      assert.ok(file.startsWith(output + sep));
      const type = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'}[extname(file)];
      return route.fulfill({contentType:type,body:await readFile(file)});
    }
    // Employer and LinkedIn destinations are also intercepted; no applications or traffic sent.
    return route.fulfill({contentType:'text/html',body:'<p>Test destination</p>'});
  });
  return context;
}
const settle = page => page.waitForTimeout(450);
const pageviews = () => events.filter(event => !event.payload.name);
try {
  await build({output,production:true,siteURL:base});
  const context = await contextFor();
  const page = await context.newPage();
  await page.goto(base + '/?q=private%40example.com&utm_source=linkedin&utm_campaign=launch#opportunities', {referer:'https://example.com/?secret=test'});
  await settle(page);
  assert.equal(pageviews().length,1);
  assert.equal(pageviews()[0].payload.website,'e6cb80e5-9b47-4a06-823e-7d76c5c0e762');
  assert.equal(pageviews()[0].payload.url,'/?utm_source=linkedin&utm_campaign=launch');
  assert.equal(pageviews()[0].payload.referrer,'https://example.com/');
  await page.locator('#reset').click();
  const save = page.locator('.job-card:visible [data-save-id]').first();
  const savedId = await save.getAttribute('data-save-id');
  await save.click(); await settle(page);
  assert.deepEqual(events.filter(event=>event.payload.name==='job_saved').map(event=>event.payload.data),[{job_id:savedId}]);
  await save.click();
  await page.locator('#search').fill('python');
  await page.locator('#search').fill('no-results-check');
  await page.locator('#search-form').evaluate(form=>form.requestSubmit());
  await page.locator('#reset').click();
  await page.locator('#location').selectOption(sampleLocation.id);
  await page.locator('#reset').click();
  await page.locator('#next').click();
  await settle(page);
  assert.equal(events.length,2,'Search, filters, pagination and unsave produce no events or extra pageviews');
  await page.locator('.job-card:visible h3 a').first().click();
  await settle(page);
  assert.equal(pageviews().length,2,'Job details use the pageview, not a separate job_view event');
  assert.ok(!pageviews()[1].payload.url.includes('return'));
  const popup = page.waitForEvent('popup');
  await page.locator('#apply-link').click();
  await (await popup).close();
  await settle(page);
  const apply = events.filter(event=>event.payload.name==='apply_click');
  assert.equal(apply.length,1);
  assert.equal(apply[0].payload.data,undefined,'Apply event reuses page URL; no chargeable custom properties');
  assert.ok(apply[0].payload.url.startsWith('/jobs/'));
  const networkPopup = page.waitForEvent('popup');
  await page.locator('[data-network="people"]').click();
  await (await networkPopup).close();
  await settle(page);
  assert.equal(events.length,4);
  assert.ok(!JSON.stringify(events).includes('private@example.com'));
  await context.close();

  const initialCount = events.length;
  const preview = await contextFor();
  const local = await preview.newPage(); await local.goto('http://localhost/');
  await local.locator('.job-card:visible [data-save-id]').first().click();
  await settle(local); assert.equal(events.length,initialCount,'Localhost never sends analytics, even with production HTML');
  await preview.close();

  const blocked = await contextFor('blocked');
  const blockedPage = await blocked.newPage(); await blockedPage.goto(base);
  await blockedPage.locator('#location').selectOption(sampleLocation.id);
  assert.equal(await blockedPage.locator('.job-card:visible').count(),Math.min(20,sampleLocation.count));
  await blockedPage.locator('.job-card:visible [data-save-id]').first().click();
  await settle(blockedPage); assert.equal(events.length,initialCount);
  await blocked.close();

  const delayed = await contextFor('delayed');
  const delayedPage = await delayed.newPage(); await delayedPage.goto(base,{waitUntil:'commit'});
  await delayedPage.locator('#search-form:visible').waitFor();
  await delayedPage.locator('.job-card:visible [data-save-id]').first().click();
  assert.equal(events.length,initialCount,'The app works while the tracker is still loading');
  releaseTracker(); await delayedPage.waitForLoadState('load'); await settle(delayedPage);
  assert.equal(events.length,initialCount+2,'Delayed load sends one pageview and one queued save');
  assert.deepEqual(errors,[]);
  console.log('Analytics QA passed: real tracker payloads, only pageviews/apply/save, no filter spam, safe URLs, preview exclusion, blocked and delayed tracker behavior. No requests reached Umami.');
} finally {
  releaseTracker();
  await browser.close();
  await rm(output,{recursive:true,force:true});
}
