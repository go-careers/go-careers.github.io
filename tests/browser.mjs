// Optional browser QA against the current CSV, using an existing Playwright installation.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { readJobs, activeJobs } from '../scripts/jobs.mjs';
const jobs = activeJobs(readJobs(await readFile(new URL('../data/jobs.csv', import.meta.url), 'utf8')));
assert.ok(jobs.length > 6, 'This browser scenario needs more than six active listings.');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) });
const base = process.env.PREVIEW_URL || 'http://localhost:4173';
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
const count = () => page.locator('.job-card:visible').count();
await mkdir('.artifacts', { recursive: true });
try {
  assert.equal((await page.goto(base)).status(), 200);
  await page.locator('#search-form:visible').waitFor();
  assert.equal(await page.locator('.job-card').count(), jobs.length);
  assert.equal(await count(), 6);
  await page.locator('#next').click();
  assert.equal(await count(), Math.min(6, jobs.length - 6));
  await page.locator('#previous').click();
  const target = jobs[0];
  await page.locator('#search').fill(target.title);
  assert.equal(await count(), 1);
  assert.equal(new URL(page.url()).searchParams.get('q'), target.title);
  await page.reload();
  assert.equal(await count(), 1);
  await page.locator('#reset').click();
  await page.locator('#experience').selectOption('0');
  const fresher = jobs.filter(j => (j.experience_min !== null || j.experience_max !== null) && (j.experience_min ?? 0) === 0);
  assert.equal(await count(), Math.min(6, fresher.length));
  await page.locator('#reset').click();
  const mode = target.work_mode, type = target.employment_type;
  await page.locator('#mode').selectOption(mode);
  await page.locator('#type').selectOption(type);
  const filtered = jobs.filter(j => j.work_mode === mode && j.employment_type === type);
  assert.equal(await count(), Math.min(6, filtered.length));
  assert.match(await page.locator('#result-count').textContent(), new RegExp(`of ${filtered.length} opportunities`));
  await page.locator('#reset').click();
  await page.locator('#sort').selectOption('oldest');
  const oldest = [...jobs].sort((a,b) => a.posted_date.localeCompare(b.posted_date) || a.id.localeCompare(b.id))[0];
  assert.equal(await page.locator('.job-card:visible').first().getAttribute('data-id'), oldest.id);
  await page.locator('#search').fill('no-such-role-123');
  assert.equal(await count(), 0);
  assert.equal(await page.locator('#empty-state').isVisible(), true);
  await page.locator('#empty-reset').click();
  assert.equal(await count(), 6);
  await page.evaluate(() => window.scrollTo(0,0));
  await page.screenshot({ path: '.artifacts/desktop.png', fullPage: true });
  if (process.env.AXE_MODULE) {
    const mod = await import(pathToFileURL(process.env.AXE_MODULE).href);
    const AxeBuilder = mod.default.default || mod.default;
    const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
  }
  await page.locator('.job-card:visible h3 a').first().click();
  assert.equal(await page.locator('h1').textContent(), target.title);
  if (target.is_demo) assert.equal(await page.locator('#apply-link').count(), 0);
  else {
    assert.equal(await page.locator('#apply-link').getAttribute('href'), target.apply_url);
    assert.equal(await page.locator('#apply-link').getAttribute('rel'), 'noopener noreferrer');
  }
  await page.locator('#share').click();
  await page.waitForFunction(()=>document.getElementById('share-status').textContent.length > 0);
  await page.screenshot({path:'.artifacts/job-detail.png',fullPage:true});
  for(const width of [375,320]) {
    await page.setViewportSize({width,height:812});
    await page.goto(base);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`No overflow at ${width}px`);
    await page.locator('#mode').selectOption(mode);
    assert.equal(await count(),Math.min(6,jobs.filter(j=>j.work_mode===mode).length));
    await page.locator('#reset').click();
    if(width===375)await page.screenshot({path:'.artifacts/mobile.png',fullPage:true});
  }
  const noJS=await browser.newPage({javaScriptEnabled:false});
  await noJS.goto(base);
  assert.equal(await noJS.locator('.job-card:visible').count(),jobs.length);
  assert.equal(await noJS.locator('#filters').isVisible(),false);
  await noJS.locator('.job-card h3 a').first().click();
  assert.ok(await noJS.locator('.description').count()>0);
  await noJS.close();
  assert.equal((await page.goto(base+'/missing-page')).status(),404);
  assert.deepEqual(errors,[]);
  console.log(`Browser QA passed for ${jobs.length} current listings, including real application links, experience filters, desktop/mobile and accessibility.`);
} finally { await browser.close(); }
