// Fixed listings exercise calendar boundaries, overlapping families and missing data.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from '../scripts/build.mjs';
import { columns, salaryColumns } from '../scripts/jobs.mjs';

const headers = [...columns, ...salaryColumns, 'ingested_at'];
const defaults = {
  company:'Example', location:'Bengaluru', employment_type:'Full-time', work_mode:'Remote',
  posted_date:'2026-11-06', description:'Build data products.', is_demo:'true', funding_stage:'Seed',
  funding_source_url:'https://example.com/seed', funding_checked_at:'2026-11-25',
};
const roles = [
  {id:'ai-backend', title:'Backend AI Engineer', salary:'₹30–50 LPA', ingested_at:'2026-11-27T18:30:00Z'},
  {id:'frontend', title:'Frontend Engineer', funding_stage:'Series B', ingested_at:'2026-11-25T18:30:00Z',
    salary_benchmark:'₹12–20 LPA', salary_basis:'Base pay', salary_source_name:'Survey',
    salary_note:'India benchmark', salary_source_url:'https://example.com/pay', salary_checked_at:'2026-11-25'},
  {id:'infra', title:'SRE', ingested_at:'2026-11-25T18:29:59.999Z'},
  {id:'legacy', title:'Backend Engineer', posted_date:'2026-11-28', funding_stage:'Undisclosed'},
];
const csv = [headers.join(','), ...roles.map(role => {
  const row = {...defaults, ...role};
  return headers.map(key => row[key] || '').join(',');
})].join('\n');
const pw = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const engine = process.env.BROWSER || 'chromium';
const browser = await pw[engine].launch(engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {});
const output = await mkdtemp(join(tmpdir(), 'gocareers-filters-'));
const origin = 'https://board.example';
try {
  await build({csv, today:'2026-11-28', output});
  const page = await browser.newPage({viewport:{width:1280,height:900}, timezoneId:'America/Los_Angeles'});
  await page.route(origin + '/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({path:join(output, path.endsWith('/') ? path + 'index.html' : path)});
  });
  await page.clock.install({time:new Date('2026-11-28T18:29:00Z')});
  await page.goto(origin);
  const visible = () => page.locator('.job-card:visible').evaluateAll(cards => cards.map(card => card.dataset.id));
  const advanced = page.locator('#advanced-filters');
  assert.ok(!await page.getByLabel('Salary source').isVisible());
  await advanced.locator('summary').focus();
  await page.keyboard.press('Enter');
  await page.getByRole('combobox', {name:'Added to Go Careers', exact:true}).selectOption('3');
  assert.deepEqual(await visible(), ['ai-backend', 'frontend']);
  await page.getByRole('combobox', {name:'Added to Go Careers', exact:true}).selectOption('1');
  assert.deepEqual(await visible(), ['ai-backend']);
  await page.locator('#role').selectOption('ai-ml-jobs-india');
  assert.deepEqual(await visible(), ['ai-backend']);
  await page.locator('#role').selectOption('backend-jobs-india');
  await page.locator('#stage').selectOption('Seed');
  await page.locator('#pay').selectOption('employer');
  assert.deepEqual(await visible(), ['ai-backend']);
  assert.equal(await page.locator('#advanced-count').innerText(), '(4)');
  await page.locator('.job-card:visible .save-job').click();
  await page.locator('#saved-view').click();
  await page.locator('#job-charts summary').click();
  await page.getByRole('button', {name:'Remote, 1 job'}).click();
  const search = new URL(page.url()).search;
  await page.locator('.job-card:visible h3 a').click();
  await page.getByRole('link', {name:'Back to your results', exact:false}).click();
  assert.equal(new URL(page.url()).search, search);
  assert.ok(await advanced.evaluate(el => el.open));
  assert.deepEqual(await visible(), ['ai-backend']);
  await page.setViewportSize({width:320,height:812});
  await page.locator('#filter-toggle').click();
  await page.locator('#pay').selectOption('estimate');
  assert.ok(await page.locator('#empty-state').isVisible());
  assert.equal(await page.locator('#filters-done').innerText(), 'Show 0 results');
  await page.locator('#filters-done').click();
  await page.getByRole('button', {name:'Remove Salary source: Market estimate filter'}).click();
  assert.deepEqual(await visible(), ['ai-backend']);
  assert.ok(!new URL(page.url()).searchParams.has('pay'));
  await page.locator('#all-view').click();
  await page.locator('#filter-toggle').click();
  await page.locator('#reset').click();
  assert.equal((await visible()).length, roles.length);
  await page.locator('#pay').selectOption('listed');
  assert.deepEqual(await visible(), ['ai-backend', 'frontend']);
  await page.locator('#pay').selectOption('estimate');
  assert.deepEqual(await visible(), ['frontend']);
  await page.goto(origin + '/?stage=invalid&role=invalid&added=99&pay=invalid');
  assert.equal((await visible()).length, roles.length);
  await page.goto(origin + '/?added=1');
  assert.deepEqual(await visible(), ['ai-backend']);
  await page.clock.fastForward(60001);
  assert.deepEqual(await visible(), [], 'Today rolls over at India midnight');
  console.log(engine + ': advanced filters, India date boundaries, keyboard, charts, saved jobs and shared URLs passed.');
} finally {
  await browser.close();
  await rm(output, {recursive:true, force:true});
}
