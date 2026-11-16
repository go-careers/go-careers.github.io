// Optional browser QA against the current CSV, using an existing Playwright installation.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { readJobs, activeJobs } from '../scripts/jobs.mjs';
import { windowEnd } from '../scripts/job-window.mjs';
import { jobLocations, locationOptions } from '../scripts/locations.mjs';
const jobs = activeJobs(readJobs(await readFile(new URL('../data/jobs.csv', import.meta.url), 'utf8')));
const linkedin = JSON.parse(await readFile(new URL('../data/company-linkedin.json', import.meta.url), 'utf8'));
assert.ok(jobs.length > 0, 'This browser scenario needs an active listing.');
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
  await page.waitForFunction(() => [...document.querySelectorAll('.company-logo img')].every(img => img.complete && img.naturalWidth > 0));
  assert.equal(await page.locator('.company-logo img').count(), jobs.filter(job => job.company_logo).length);
  assert.equal(await count(), Math.min(20, jobs.length));
  if (jobs.length > 20) {
    await page.locator('#next').click();
    assert.equal(await count(), Math.min(20, jobs.length - 20));
    await page.locator('#previous').click();
  } else assert.equal(await page.locator('#pagination').isVisible(), false);
  await page.getByRole('button', { name: 'Backend', exact: true }).click();
  assert.equal(new URL(page.url()).searchParams.get('q'), 'backend');
  await page.getByRole('button', { name: 'Remote', exact: true }).click();
  assert.equal(new URL(page.url()).searchParams.get('mode'), 'Remote');
  assert.equal(new URL(page.url()).searchParams.get('q'), 'backend', 'Quick filters compose with search');
  await page.getByRole('button', { name: 'Remove Remote filter', exact: true }).click();
  assert.equal(new URL(page.url()).searchParams.has('mode'), false);
  assert.equal(new URL(page.url()).searchParams.get('q'), 'backend');
  await page.getByRole('button', { name: 'Remove Search: backend filter', exact: true }).click();
  assert.equal(await page.locator('#active-filters').isVisible(), false);
  if (jobs.length > 20) {
    await page.locator('#page-select').selectOption('2');
    const resultId = await page.locator('.job-card:visible').first().getAttribute('data-id');
    await page.locator('.job-card:visible h3 a').first().click();
    await page.getByRole('link', { name: 'Back to your results' }).click();
    assert.equal(new URL(page.url()).searchParams.get('page'), '2');
    assert.equal(await page.locator('.job-card:visible').first().getAttribute('data-id'), resultId);
    await page.locator('#page-select').selectOption('1');
  }
  const target = jobs[0];
  await page.locator('#company').selectOption(target.company);
  assert.equal(await count(), Math.min(20, jobs.filter(job => job.company === target.company).length));
  await page.locator('#reset').click();
  await page.locator('#saved-view').click();
  assert.equal(await page.locator('.nav-current').getAttribute('data-nav-view'), 'saved');
  assert.equal(await page.locator('.saved-nav').getAttribute('aria-current'), 'page');
  assert.equal(await count(), 0);
  assert.equal(await page.locator('#empty-title').textContent(), 'Your shortlist starts here');
  await page.locator('#empty-browse').click();
  assert.equal(await page.locator('.nav-current').getAttribute('data-nav-view'), 'all');
  const focusedLink = page.locator('.job-card:visible h3 a').first();
  await focusedLink.focus();
  await page.evaluate(() => dispatchEvent(new StorageEvent('storage', {key:'go-careers:saved:v1',newValue:'[]'})));
  assert.equal(await focusedLink.evaluate(link => link === document.activeElement), true, 'Background updates preserve focused job links');
  const firstSave = page.locator('.job-card:visible [data-save-id]').first();
  const savedId = await firstSave.getAttribute('data-save-id');
  await firstSave.click();
  assert.equal(await firstSave.getAttribute('aria-pressed'), 'true');
  assert.equal(await firstSave.evaluate(button => button === document.activeElement), true, 'Saving preserves keyboard focus');
  await page.locator('#saved-view').click();
  assert.equal(await count(), 1);
  assert.equal(new URL(page.url()).searchParams.get('saved'), '1');
  await page.reload();
  assert.equal(await count(), 1, 'Saved roles survive reload');
  assert.equal(await page.locator('.job-card:visible').getAttribute('data-id'), savedId);
  const savedDetail = await context.newPage();
  await savedDetail.goto(`${base}/jobs/${savedId}/`);
  assert.equal(await savedDetail.locator('[data-save-id]').getAttribute('aria-pressed'), 'true');
  await savedDetail.locator('[data-save-id]').click();
  await page.waitForFunction(() => document.querySelector('#saved-count').textContent === '0');
  assert.equal(await count(), 0, 'Unsave synchronizes between tabs');
  await savedDetail.close();
  await page.locator('#empty-browse').click();
  await page.locator('#search').fill('unmatched-shortlist-check');
  await page.locator('#clear-search').click();
  assert.equal(await count(), 20);
  assert.equal(await page.locator('#search').inputValue(), '');
  // City matching includes each city on a multi-location listing.
  const places = locationOptions(jobs);
  const matchesPlace = (job, place) => jobLocations(job.location, job.work_mode).some(entry => entry.id === place.id);
  for (const place of places) {
    const matching = jobs.filter(job => matchesPlace(job, place));
    await page.locator('#location').selectOption(place.id);
    assert.match(await page.locator('#result-count').textContent(), new RegExp(`of ${matching.length} opportunities`));
    if (matching.length <= 20) assert.deepEqual((await page.locator('.job-card:visible').evaluateAll(cards => cards.map(card => card.dataset.id))).sort(), matching.map(job => job.id).sort());
    assert.equal(new URL(page.url()).searchParams.get('location'), place.id);
    await page.reload();
    assert.equal(await page.locator('#location').inputValue(), place.id);
  }
  await page.locator('#reset').click();
  const incompatible = places.flatMap(place => [...new Set(jobs.map(job => job.company))]
    .filter(company => !jobs.some(job => job.company === company && matchesPlace(job, place)))
    .map(company => ({place, company})))[0];
  if (incompatible) {
    const {place, company} = incompatible;
    await page.locator('#company').selectOption(company);
    assert.equal(await page.locator(`#location option[value="${place.id}"]`).isDisabled(), true);
    await page.locator('#reset').click();
    await page.locator('#location').selectOption(place.id);
    await page.locator('#company').selectOption(company);
    assert.equal(await count(), 0);
    await page.getByRole('button', {name:`Remove ${place.label} filter`,exact:true}).click();
    assert.equal(await count(), Math.min(20, jobs.filter(job => job.company === company).length));
  }
  await page.goto(base + '?location=Bangalore%2C%20India');
  assert.equal(await page.locator('#location').inputValue(), 'bengaluru');
  const multi = jobs.find(job => jobLocations(job.location, job.work_mode).filter(place => !['remote','city-unspecified'].includes(place.id)).length > 1);
  if (multi) {
    await page.goto(base + '?location=' + encodeURIComponent(multi.location));
    assert.equal(await count(), Math.min(20, jobs.filter(job => job.location === multi.location).length), 'Old multi-city shared URLs keep their exact selection');
  }
  await page.goto(base + '?location=India');
  assert.equal(await page.locator('#location').inputValue(), 'city-unspecified');
  await page.locator('#reset').click();
  await page.locator('#search').fill('Bangalore');
  const aliasCount = await page.locator('#result-count').textContent();
  await page.locator('#search').fill('Bengaluru');
  assert.equal(await page.locator('#result-count').textContent(), aliasCount);
  await page.locator('#reset').click();
  const query = `${target.company} ${target.title}`;
  const searchMatches = jobs.filter(job => query.toLowerCase().split(/\s+/).every(token => [job.title,job.company,job.location,...job.skills].join(' ').toLowerCase().includes(token)));
  await page.locator('#search').fill(query);
  assert.equal(await count(), Math.min(20,searchMatches.length));
  assert.equal(new URL(page.url()).searchParams.get('q'), query);
  await page.reload();
  assert.equal(await count(), Math.min(20,searchMatches.length));
  await page.locator('#reset').click();
  await page.locator('#experience').selectOption('0');
  const fresher = jobs.filter(j => (j.experience_min !== null || j.experience_max !== null) && (j.experience_min ?? 0) === 0);
  assert.equal(await count(), Math.min(20, fresher.length));
  await page.locator('#reset').click();
  const mode = target.work_mode, type = target.employment_type;
  await page.locator('#mode').selectOption(mode);
  await page.locator('#type').selectOption(type);
  const filtered = jobs.filter(j => j.work_mode === mode && j.employment_type === type);
  assert.equal(await count(), Math.min(20, filtered.length));
  assert.match(await page.locator('#result-count').textContent(), new RegExp(`of ${filtered.length} opportunities`));
  await page.locator('#reset').click();
  await page.locator('#sort').selectOption('oldest');
  const oldest = [...jobs].sort((a,b) => Number(!a.posted_date)-Number(!b.posted_date) || a.posted_date.localeCompare(b.posted_date) || a.id.localeCompare(b.id))[0];
  assert.equal(await page.locator('.job-card:visible').first().getAttribute('data-id'), oldest.id);
  await page.locator('#search').fill('no-such-role-123');
  assert.equal(await count(), 0);
  assert.equal(await page.locator('#empty-state').isVisible(), true);
  await page.locator('#empty-reset').click();
  assert.equal(await count(), Math.min(20, jobs.length));
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
  for(const width of [900,768,375,320]) {
    await page.setViewportSize({width,height:812});
    await page.goto(base);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`No overflow at ${width}px`);
    assert.equal(await page.locator('#filters').isVisible(), false, 'Mobile filters start collapsed');
    await page.locator('#filter-toggle').click();
    assert.equal(await page.locator('#filter-toggle').getAttribute('aria-expanded'), 'true');
    const clipped = await page.locator('#filters select').evaluateAll(selects => selects.filter(select => {
      const style = getComputedStyle(select);
      const canvas = document.createElement('canvas').getContext('2d');
      canvas.font = style.font;
      return canvas.measureText(select.selectedOptions[0].textContent).width > select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    }).map(select => select.id));
    assert.deepEqual(clipped, [], `Default filter labels fit at ${width}px`);
    if (width >= 768) assert.ok((await page.locator('.job-card:visible .job-heading').first().boundingBox()).width > 300, 'Tablet titles have room to read');
    for (const label of await page.locator('.nav nav a > span').all()) assert.ok((await label.boundingBox()).height < 25, 'Header links stay on one line');
    await page.locator('#mode').selectOption(mode);
    assert.equal(await count(),Math.min(20,jobs.filter(j=>j.work_mode===mode).length));
    await page.locator('#reset').click();
    await page.locator('#filters-done').click();
    assert.equal(await page.locator('#filters').isVisible(), false);
    if(width===375)await page.screenshot({path:'.artifacts/mobile.png',fullPage:true});
  }
  const noJS=await browser.newPage({javaScriptEnabled:false});
  const unavailable = await browser.newContext();
  await unavailable.addInitScript(() => Object.defineProperty(window, 'localStorage', {get() {throw new Error('Storage disabled');}}));
  const privatePage = await unavailable.newPage();
  await privatePage.goto(base);
  await privatePage.locator('.job-card:visible [data-save-id]').first().click();
  assert.match(await privatePage.locator('#save-status').textContent(), /Saved for this visit/);
  await privatePage.locator('#saved-view').click();
  assert.equal(await privatePage.locator('.job-card:visible').count(), 1, 'Saving degrades to memory when storage is unavailable');
  await unavailable.close();
  if (!target.is_demo) {
    await page.goto(`${base}/jobs/${target.id}/`);
    const applyBox = await page.locator('#apply-link').boundingBox();
    assert.ok(applyBox && applyBox.y >= 0 && applyBox.y + applyBox.height <= 812, 'Mobile apply action is visible without scrolling');
    if (process.env.AXE_MODULE) {
      const mod = await import(pathToFileURL(process.env.AXE_MODULE).href);
      const AxeBuilder = mod.default.default || mod.default;
      const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
    }
  }
  for (const job of jobs) {
    await page.goto(`${base}/jobs/${job.id}/#compensation`);
    if (!job.is_demo) {
      const company = linkedin.companies.find(company => company.company === job.company);
      assert.equal(await page.locator('.network-links a').count(), 3);
      for (const link of await page.locator('.network-links a').all()) {
        const url = new URL(await link.getAttribute('href'));
        assert.equal(url.origin, 'https://www.linkedin.com');
        assert.deepEqual(JSON.parse(url.searchParams.get('currentCompany')), [company.company_id]);
        assert.equal(await link.getAttribute('target'), '_blank');
        assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
      }
      const connectionURL = new URL(await page.locator('[data-network="connections"]').getAttribute('href'));
      assert.deepEqual(JSON.parse(connectionURL.searchParams.get('network')), ['F']);
    }
    assert.equal(await page.locator('#compensation').count(), 1);
    if (job.company_logo) {
      await page.waitForFunction(() => [...document.querySelectorAll('.company-logo img')].every(img => img.complete && img.naturalWidth > 0));
      assert.equal(await page.locator('.company-logo img').getAttribute('src'), `../../assets/companies/${job.company_logo}`);
    }
    assert.equal(await page.locator('.funding-tag, .funding-checked').count(), 0);
    assert.equal(await page.locator('.funding-source').count(), 0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), true, `Salary detail fits mobile: ${job.id}`);
    assert.equal(await page.locator('#compensation').textContent(), 'Expected salary');
    assert.equal(await page.locator('.expected-compensation').textContent(), (job.salary || job.salary_benchmark || 'Not disclosed').replace(/ LPA \/ year$/, ' LPA'));
    assert.equal(await page.locator('.compensation-estimate').count(), 0);
    assert.equal(await page.locator('.salary-source, .salary-reviewed, .benchmark-label').count(), 0);
    assert.equal(await page.getByRole('heading', {name:'Key skills',exact:true}).count(), job.skills.length ? 1 : 0);
    assert.equal(await page.locator('dt').filter({hasText:/^Posted$/}).count(), job.posted_date ? 1 : 0);
  }
  await noJS.goto(base);
  assert.equal(await noJS.locator('.job-card:visible').count(),jobs.length);
  assert.equal(await noJS.locator('#filters').isVisible(),false);
  assert.ok((await noJS.locator('.results').boundingBox()).width > 800, 'The no-JavaScript board uses the full content width');
  await noJS.locator('.job-card h3 a').first().click();
  assert.ok(await noJS.locator('.description').count()>0);
  await noJS.close();
  assert.equal((await page.goto(base+'/missing-page')).status(),404);
  // A cached board/detail must age out at midnight in India without a rebuild.
  const agingJob = jobs.find(job => !job.expiry_date);
  if (agingJob) {
    const deadline = windowEnd(agingJob.posted_date);
    const expiryBoard = await context.newPage();
    const expiryDetail = await context.newPage();
    for (const tab of [expiryBoard, expiryDetail]) await tab.clock.install({time: new Date(`${deadline}T18:29:00Z`)});
    await expiryBoard.goto(base + '?q=' + encodeURIComponent(agingJob.company + ' ' + agingJob.title));
    await expiryDetail.goto(`${base}/jobs/${agingJob.id}/`);
    const agingCard = expiryBoard.locator(`.job-card[data-id="${agingJob.id}"]`);
    assert.equal(await agingCard.isVisible(), true);
    assert.equal(await expiryDetail.locator('#apply-link').count(), 1);
    for (const tab of [expiryBoard, expiryDetail]) await tab.clock.fastForward(60001);
    assert.equal(await agingCard.isVisible(), false);
    assert.equal(await expiryDetail.locator('#apply-link').count(), 0);
    assert.equal(await expiryDetail.locator('#closed-notice').isVisible(), true);
    await expiryBoard.close(); await expiryDetail.close();
  }
  assert.deepEqual(errors,[]);
  console.log(`Browser QA passed for ${jobs.length} current listings, including real application links, experience filters, desktop/mobile and accessibility.`);
} finally { await browser.close(); }
