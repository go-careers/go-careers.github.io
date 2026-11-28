// Exercise both generations of a small board at one origin using real browser storage.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from '../scripts/build.mjs';
import { columns } from '../scripts/jobs.mjs';

const pw = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const engine = process.env.BROWSER || 'chromium';
const browser = await pw[engine].launch({
  ...(engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
});
const output = await mkdtemp(join(tmpdir(), 'gocareers-tracker-'));
const origin = 'https://board.example';
const company = 'Example';
const first = {id:'first-role', title:'Backend Engineer', posted_date:'2026-11-10', expiry_date:'2026-11-27'};
const second = {id:'second-role', title:'Engineer <Data>', posted_date:'2026-11-22'};
const audit = {companies:[{company, eligible:true, stage:'Seed', ownership:{status:'private', independent:true,
  checked_at:'2026-11-25', sources:['https://example.com/seed']}}]};

async function rebuild(roles) {
  const lines = roles.map(role => {
    const row = {company, location:'India', work_mode:'Remote', employment_type:'Full-time', is_demo:'false',
      description:'Build data products.', apply_url:'https://employer.example/apply/' + role.id,
      funding_stage:'Seed', funding_source_url:'https://example.com/seed', funding_checked_at:'2026-11-25', ...role};
    return columns.map(column => row[column] || '').join(',');
  });
  await build({csv:[columns.join(','), ...lines].join('\n'), companyAudit:audit, today:'2026-11-27', output});
}
async function contextFor(options = {}) {
  const context = await browser.newContext(options);
  await context.route(origin + '/**', async route => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({path:join(output, path.endsWith('/') ? path + 'index.html' : path)});
  });
  await context.route('https://employer.example/**', route => route.fulfill({body:'Employer application'}));
  return context;
}
const trackerURL = origin + '/applications/';
const jobURL = job => origin + '/jobs/' + job.id + '/';
try {
  await rebuild([first, second]);
  const context = await contextFor();
  const detail = await context.newPage();
  await detail.clock.install({time:new Date('2026-11-27T18:29:00Z')}); // 23:59 in India.
  const tracker = await context.newPage();
  await detail.goto(jobURL(first));
  await tracker.goto(trackerURL);
  assert.equal(await tracker.locator('#tracker-empty').isVisible(), true);
  const popup = context.waitForEvent('page');
  await detail.locator('#apply-link').click();
  await (await popup).close();
  assert.equal(await tracker.locator('.application-row').count(), 0);
  const mark = detail.getByRole('button', {name:'Mark as applied'});
  await mark.focus();
  await detail.keyboard.press('Space');
  await tracker.getByRole('link', {name:first.title}).waitFor();
  assert.equal(await tracker.locator('.application-row time').innerText(), '27 Nov 2026');
  await detail.reload();
  assert.equal(await detail.locator('#mark-applied').getAttribute('aria-pressed'), 'true');
  await detail.goto(jobURL(second));
  await detail.locator('#mark-applied').click();
  await tracker.getByRole('link', {name:second.title}).waitFor();
  assert.deepEqual(await tracker.locator('.application-row h2').allTextContents(), [second.title,first.title]);
  await tracker.reload();
  assert.equal(await tracker.locator('.application-row').count(), 2);

  await detail.clock.fastForward(61000);
  const oldRow = tracker.locator('.application-row').filter({hasText:first.title});
  await oldRow.getByText('No longer listed', {exact:false}).waitFor();
  assert.equal(await oldRow.getByRole('link').count(), 0);
  await detail.locator('#mark-applied').click();
  await tracker.getByRole('link', {name:second.title}).waitFor({state:'detached'});
  await detail.locator('#mark-applied').click();
  await tracker.getByRole('link', {name:second.title}).waitFor();
  assert.equal(await tracker.locator('.application-row').filter({hasText:second.title}).locator('time').innerText(), '28 Nov 2026');
  await detail.clock.setSystemTime(new Date('2026-11-27T18:00:00Z'));
  await rebuild([second]); // First job is now absent even before its stored expiry.
  await tracker.reload();
  assert.equal(await oldRow.locator('.unlisted').isVisible(), true);
  assert.equal(await oldRow.locator('time').innerText(), '27 Nov 2026');
  assert.equal(await oldRow.getByRole('link').count(), 0);
  for (const width of [1440, 375, 320]) {
    await tracker.setViewportSize({width,height:812});
    const overflowing = await tracker.evaluate(() => [...document.querySelectorAll('body *')].filter(el =>
      el.getBoundingClientRect().right > window.innerWidth + 0.5).map(el => el.tagName + '.' + el.className));
    assert.deepEqual(overflowing, [], 'Tracker elements fit at ' + width + 'px');
    assert.equal(await tracker.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Page fits at ' + width + 'px');
  }
  if (process.env.AXE_MODULE) {
    const mod = await import(pathToFileURL(process.env.AXE_MODULE).href);
    const AxeBuilder = mod.default.default || mod.default;
    const results = await new AxeBuilder({page:tracker}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(results.violations.map(rule => rule.id), []);
  }
  await tracker.getByRole('button', {name:'Remove ' + second.title, exact:false}).click();
  await mark.waitFor();
  assert.equal(await tracker.locator('.application-row').count(), 1);
  await oldRow.getByRole('button').focus();
  await tracker.keyboard.press('Enter');
  await tracker.locator('#tracker-empty:visible').waitFor();
  assert.equal(await tracker.locator('#tracker-empty a').evaluate(link => link === document.activeElement), true);
  await detail.locator('#mark-applied').click();
  await tracker.getByRole('link', {name:second.title}).waitFor();
  await detail.locator('#mark-applied').click();
  await tracker.locator('#tracker-empty:visible').waitFor();
  await tracker.evaluate(() => localStorage.setItem('go-careers:applied:v1:bad-record','{oops'));
  await tracker.reload();
  assert.equal(await tracker.locator('#tracker-empty').isVisible(), true);

  const blocked = await contextFor();
  await blocked.addInitScript(() => Object.defineProperty(window,'localStorage',{get(){ throw new Error('Disabled'); }}));
  const denied = await blocked.newPage();
  await denied.goto(jobURL(second));
  assert.equal(await denied.locator('#mark-applied').isDisabled(), true);
  assert.match(await denied.locator('#tracker-feedback').innerText(), /browser storage/);
  const full = await contextFor();
  await full.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  const fullPage = await full.newPage();
  await fullPage.goto(jobURL(second));
  await fullPage.locator('#mark-applied').click();
  assert.equal(await fullPage.locator('#mark-applied').getAttribute('aria-pressed'), 'false');
  assert.match(await fullPage.locator('#tracker-feedback').innerText(), /Could not save/);
  await denied.goto(trackerURL);
  assert.match(await denied.locator('#tracker-feedback').innerText(), /browser storage/);
  const noJS = await contextFor({javaScriptEnabled:false});
  const plain = await noJS.newPage();
  await plain.goto(trackerURL);
  assert.match(await plain.locator('main').innerText(), /Enable JavaScript/);
  await plain.goto(jobURL(second));
  assert.equal(await plain.locator('#mark-applied').isVisible(), false);
  assert.equal(await plain.locator('#apply-link').isVisible(), true);
  console.log(engine + ': application tracker passed persistence, cross-tab, expiry, rebuilt feed, mobile, removal and storage checks.');
} finally {
  await browser.close();
  await rm(output, { recursive:true, force:true });
}
