import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { readJobs, activeJobs, validateCompanyEligibility, escapeHTML as e } from './jobs.mjs';
import { linkedinPeopleLinks } from './linkedin.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
const dateLabel = value => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const experience = job => {
  if (job.experience_min === null && job.experience_max === null) return 'Experience not specified';
  if (job.experience_max === null) return `${job.experience_min}+ years`;
  if (job.experience_min === null) return `Up to ${job.experience_max} years`;
  return job.experience_min === job.experience_max ? `${job.experience_min} years` : `${job.experience_min}–${job.experience_max} years`;
};
const salarySummary = job => (job.salary || job.salary_benchmark).replace(/ LPA \/ year$/, ' LPA');
const compensation = job => `<dt id="compensation">Expected salary</dt><dd class="expected-compensation">${e(salarySummary(job) || 'Not disclosed')}</dd>`;

const initials = company => company.split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();

export async function build({ output = join(root, 'dist'), csv, today = new Date().toISOString().slice(0, 10), production = false, siteURL = process.env.SITE_URL || '', validateOnly = false, companyAudit } = {}) {
  const allJobs = readJobs(csv ?? await readFile(join(root, 'data/jobs.csv'), 'utf8'));
  if (production && allJobs.some(job => job.is_demo)) throw new Error('Production build blocked: replace or remove all demo jobs in data/jobs.csv first.');
  for (const logo of new Set(allJobs.map(job => job.company_logo).filter(Boolean))) {
    const bytes = await readFile(join(root, 'site/companies', logo));
    if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Invalid PNG company logo: ' + logo);
  }
  validateCompanyEligibility(allJobs, companyAudit ?? JSON.parse(await readFile(join(root, 'data/company-funding.json'), 'utf8')));
  const jobs = activeJobs(allJobs, today);
  if (validateOnly) return { total: allJobs.length, active: jobs.length };
  const linkedinData = JSON.parse(await readFile(join(root, 'data/company-linkedin.json'), 'utf8'));
  const linkedinCompanies = new Map();
  for (const company of linkedinData.companies) {
    if (linkedinCompanies.has(company.company)) throw new Error('Duplicate LinkedIn company: ' + company.company);
    linkedinCompanies.set(company.company, linkedinPeopleLinks(company.company_id));
  }
  const networking = job => {
    const links = linkedinCompanies.get(job.company);
    if (job.is_demo || !links) return '';
    return `<section class="description company-network" aria-labelledby="network-heading"><h2 id="network-heading">Find people at ${e(job.company)}</h2><div class="network-links"><a data-network="people" href="${e(links.people)}" target="_blank" rel="noopener noreferrer">Find employees <span aria-hidden="true">↗</span></a><a data-network="recruiters" href="${e(links.recruiters)}" target="_blank" rel="noopener noreferrer">Find recruiters <span aria-hidden="true">↗</span></a><a data-network="connections" href="${e(links.connections)}" target="_blank" rel="noopener noreferrer">Your 1st-degree connections <span aria-hidden="true">↗</span></a></div><p class="network-note">LinkedIn · Sign in to see your connections.</p></section>`;
  };
  const [styleVersion, scriptVersion] = await Promise.all(['styles.css', 'app.js'].map(async file => createHash('sha256').update(await readFile(join(root, 'site', file))).digest('hex').slice(0, 12)));
  const demo = jobs.some(job => job.is_demo);
  let canonicalBase = '';
  if (siteURL) {
    const url = new URL(siteURL);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('SITE_URL must be an HTTPS site root, without credentials, query, or fragment.');
    canonicalBase = url.href.replace(/\/?$/, '/');
  }
  const option = (value, label = value) => `<option value="${e(value)}">${e(label)}</option>`;
  const unique = key => [...new Set(jobs.map(job => job[key]))].sort();
  const badge = (job, prefix = '') => job.company_logo ? `<span class="company-mark company-logo" aria-hidden="true"><img src="${prefix}assets/companies/${e(job.company_logo)}" alt="" width="40" height="40" decoding="async"></span>` : `<span class="company-mark tone-${job.company.length % 4}" aria-hidden="true">${e(initials(job.company))}</span>`;
  const tags = job => [job.location, ...(job.location === job.work_mode || job.work_mode === 'Not specified' ? [] : [job.work_mode]), job.employment_type, experience(job)].map(value => `<span>${e(value)}</span>`).join('');
  const cardTags = job => [
    job.location,
    ...(job.location === job.work_mode || job.work_mode === 'Not specified' ? [] : [job.work_mode]),
    ...(job.employment_type !== 'Full-time' && !job.title.toLowerCase().includes(job.employment_type.toLowerCase().replace('ship', '')) ? [job.employment_type] : []),
    ...(job.experience_min === null && job.experience_max === null ? [] : [experience(job)]),
  ].map(value => `<span>${e(value)}</span>`).join('');
  const saveButton = (job, compact = false) => `<button type="button" class="save-job ${compact ? 'save-compact' : ''}" data-save-id="${e(job.id)}" data-save-title="${e(job.title + ' at ' + job.company)}" aria-label="Save ${e(job.title)} at ${e(job.company)}" aria-pressed="false" hidden><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4z"/></svg><span class="save-label${compact ? ' sr-only' : ''}">Save job</span></button>`;
  const card = job => `<article class="job-card" data-id="${e(job.id)}" data-posted="${e(job.posted_date)}" data-expiry="${e(job.expiry_date)}" data-company="${e(job.company)}" data-location="${e(job.location)}" data-mode="${e(job.work_mode)}" data-type="${e(job.employment_type)}" data-min="${job.experience_min ?? ''}" data-max="${job.experience_max ?? ''}" data-search="${e([job.title, job.company, job.location, ...job.skills].join(' ').toLowerCase())}">
    ${badge(job)}<div class="job-heading"><h3><a href="jobs/${e(job.id)}/">${e(job.title)}</a></h3><p class="company-name">${e(job.company)}${job.is_demo ? '<span class="sample-tag">Sample</span>' : ''}</p><div class="job-meta">${cardTags(job)}</div></div>
    <div class="job-summary">${salarySummary(job) ? `<div class="salary-block"><span class="salary-label">Expected salary</span><p class="salary">${e(salarySummary(job))}</p></div>` : ''}<div class="row-actions">${saveButton(job, true)}<a class="row-link" href="jobs/${e(job.id)}/" aria-label="View ${e(job.title)} at ${e(job.company)}">View job <span aria-hidden="true">→</span></a></div></div>
  </article>`;
  const shell = ({ title, description, body, prefix = './', path = '', noindex = false }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)}</title><meta name="description" content="${e(description)}"><meta name="theme-color" content="#ffffff">${noindex || demo ? '<meta name="robots" content="noindex, nofollow">' : ''}${canonicalBase ? `<link rel="canonical" href="${e(canonicalBase + path)}"><meta property="og:url" content="${e(canonicalBase + path)}">` : ''}<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><link rel="icon" href="${prefix}assets/favicon.png" type="image/png"><link rel="stylesheet" href="${prefix}assets/styles.css?v=${styleVersion}"><script src="${prefix}assets/app.js?v=${scriptVersion}" defer></script></head>
<body><a class="skip-link" href="#main">Skip to content</a>${demo ? '<div class="demo-bar">Preview · All sample listings are fictional. Applications are disabled.</div>' : ''}<header class="site-header"><div class="container nav"><a class="brand" href="${prefix}" aria-label="Go Careers home"><img class="brand-logo" src="${prefix}assets/logo.jpg" alt="" width="46" height="46"><span class="brand-copy">Go Careers</span></a><nav aria-label="Main navigation"><a class="browse-nav${path === '' ? ' nav-current' : ''}" data-nav-view="all"${path === '' ? ' aria-current="page"' : ''} href="${prefix}#opportunities" aria-label="Browse jobs"><span>Browse<span class="nav-suffix"> jobs</span></span></a><a class="saved-nav" data-nav-view="saved" href="${prefix}?saved=1#opportunities" aria-label="Saved jobs" hidden><span>Saved<span class="nav-suffix"> jobs</span></span></a></nav></div></header>
${body}<p id="save-status" class="save-status" role="status" aria-live="polite"></p><button class="back-top" id="back-top" type="button" hidden aria-label="Back to search and filters">↑ <span>Back to top</span></button><footer class="site-footer" id="about-board"><div class="container footer-inner"><p><strong>Go Careers</strong></p><span>© ${today.slice(0, 4)}</span></div></footer></body></html>`;
  const index = shell({ title: 'Go Careers — Startup SDE, ML & AI jobs', description: 'Explore software engineering, machine learning, and AI jobs at independent, privately held startups.', body: `
<main id="main"><section class="hero container"><div class="intro"><div><h1>Find your next startup role<span class="name-dot">.</span></h1><p>SDE, ML &amp; AI jobs at startups in India.</p></div></div>
<form id="search-form" class="search-bar" role="search" hidden><span class="search-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></span><label class="sr-only" for="search">Search job titles, companies, or skills</label><input id="search" name="q" type="search" placeholder="Search roles or skills" autocomplete="off"><button id="clear-search" type="button" class="clear-search" aria-label="Clear search" hidden>×</button><button type="submit" class="button">Search jobs</button></form>
<div id="quick-searches" class="quick-searches" aria-label="Quick searches" hidden><button type="button" data-quick="q" data-value="machine learning" aria-pressed="false">Machine learning</button><button type="button" data-quick="q" data-value="backend" aria-pressed="false">Backend</button><button type="button" data-quick="q" data-value="python" aria-pressed="false">Python</button><button type="button" data-quick="mode" data-value="Remote" aria-pressed="false">Remote</button></div>
</section>
<section id="opportunities" class="opportunities"><div class="container">
<div class="board-layout"><div class="filter-toggle-bar" id="filter-toggle-bar" hidden><button id="filter-toggle" class="button secondary" type="button" aria-controls="filters" aria-expanded="false">Filters <span id="filter-count"></span><span aria-hidden="true">⌄</span></button></div><aside class="filters" id="filters" hidden><div class="filter-heading"><h2>Filter jobs</h2><button class="text-button" type="button" id="reset">Clear all</button></div><div class="filter-field"><label for="company">Company</label><select id="company" name="company">${option('', 'All startups')}${unique('company').map(v => option(v)).join('')}</select></div><div class="filter-field"><label for="location">Location</label><select id="location" name="location">${option('', 'All locations')}${unique('location').map(v => option(v)).join('')}</select></div><div class="filter-field"><label for="mode">Work style</label><select id="mode" name="mode">${option('', 'Any work style')}${['Remote', 'Hybrid', 'On-site', 'Not specified'].map(v => option(v)).join('')}</select></div><div class="filter-field"><label for="type">Job type</label><select id="type" name="type">${option('', 'All job types')}${unique('employment_type').map(v => option(v)).join('')}</select></div><div class="filter-field"><label for="experience">Your experience</label><select id="experience" name="experience">${option('', 'Any experience')}${option('0', 'Fresher · 0 years')}${option('0-2', '0–2 years')}${option('3-5', '3–5 years')}${option('6-10', '6–10 years')}${option('11-60', '11+ years')}</select></div><button type="button" id="filters-done" class="button filters-done">Show results</button></aside>
<div class="results"><div id="view-bar" class="view-bar" hidden><div class="board-tabs" role="group" aria-label="Job views"><button id="all-view" type="button" aria-pressed="true">All jobs</button><button id="saved-view" type="button" aria-pressed="false">Saved jobs <span id="saved-count">0</span></button></div><span class="saved-hint" id="saved-hint" hidden>Saved on this browser</span></div><div id="active-filters" class="active-filters" role="group" aria-label="Applied filters" hidden></div><div class="results-toolbar"><div class="results-heading"><h2>Open roles</h2><p id="result-count" role="status" aria-live="polite">${jobs.length} ${demo ? 'sample ' : ''}opportunities</p></div><div id="sort-control" hidden><label for="sort">Sort by</label><select id="sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div></div><noscript><p class="notice">All current listings are shown below. Enable JavaScript to search and filter them.</p></noscript><div id="job-list">${jobs.map(card).join('')}</div><div id="empty-state" class="empty-state" ${jobs.length ? 'hidden' : ''}><span aria-hidden="true">⌕</span><h3 id="empty-title">${jobs.length ? 'No matching opportunities' : 'Good things are on their way'}</h3><p id="empty-description">${jobs.length ? 'Try a broader search or clear your filters.' : 'There are no open roles listed right now. Check back soon.'}</p><button type="button" class="button secondary" id="empty-reset" hidden>Clear all filters</button><button type="button" class="button secondary" id="empty-browse" hidden>Browse all jobs</button></div><nav id="pagination" class="pagination" aria-label="Job result pages" hidden><button id="previous" type="button">← Previous</button><div class="page-picker"><label for="page-select" id="page-label">Page</label><select id="page-select" aria-label="Go to results page"></select></div><button id="next" type="button">Next →</button></nav></div></div></div></section>
</main>` });
  // All input is validated before replacing the generated output.
  await rm(output, { recursive: true, force: true });
  await mkdir(join(output, 'assets'), { recursive: true });
  await cp(join(root, 'site'), join(output, 'assets'), { recursive: true });
  await writeFile(join(output, 'index.html'), index);
  await writeFile(join(output, '.nojekyll'), '');
  for (const job of jobs) {
    const description = job.description.slice(0, 155).replace(/\s+/g, ' ');
    const apply = job.is_demo ? '<div class="notice">This is a fictional sample listing. Applications are disabled.</div>' : `<a id="apply-link" class="button apply-button" href="${e(job.apply_url)}" target="_blank" rel="noopener noreferrer">Apply for this role <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
    const content = shell({ title: `${job.title} at ${job.company} | Go Careers`, description, prefix: '../../', path: `jobs/${job.id}/`, body: `<main id="main" class="container detail-page" data-expiry="${e(job.expiry_date)}"><a class="back-link" href="../../#opportunities">← Back to jobs</a><div class="detail-layout"><article class="detail-content"><div class="detail-heading">${badge(job, '../../')}<p class="company-name">${e(job.company)}${job.is_demo ? '<span class="sample-tag">Sample</span>' : ''}</p><h1>${e(job.title)}</h1><div class="job-meta">${tags(job)}</div></div><div id="closed-notice" class="notice" hidden>This listing has expired and is no longer accepting applications.</div><section class="description"><h2>Job brief</h2>${job.description.split(/\r?\n\s*\r?\n/).filter(p => !p.startsWith('Summary of the employer’s listing.')).map(p => `<p>${e(p).replace(/\r?\n/g, '<br>')}</p>`).join('')}</section>${job.skills.length ? `<section class="description"><h2>Key skills</h2><div class="skills required-skills">${job.skills.map(skill => `<span>${e(skill)}</span>`).join('')}</div></section>` : ''}${networking(job)}</article><aside class="detail-sidebar"><h2>At a glance</h2>${apply}${saveButton(job)}<dl><dt>Location</dt><dd>${e(job.location)}${job.work_mode !== 'Not specified' && job.location !== job.work_mode ? ` · ${e(job.work_mode)}` : ''}</dd><dt>Employment</dt><dd>${e(job.employment_type)}</dd><dt>Experience</dt><dd>${e(experience(job))}</dd>${compensation(job)}${job.posted_date ? `<dt>Posted</dt><dd><time datetime="${job.posted_date}">${dateLabel(job.posted_date)}</time></dd>` : ''}${job.expiry_date ? `<dt>Apply by (UTC)</dt><dd><time datetime="${job.expiry_date}">${dateLabel(job.expiry_date)}</time></dd>` : ''}</dl><button id="share" class="button secondary" type="button" hidden>Copy job link</button><p id="share-status" class="apply-note" role="status"></p></aside></div></main>` });
    await mkdir(join(output, 'jobs', job.id), { recursive: true });
    await writeFile(join(output, 'jobs', job.id, 'index.html'), content);
  }
  await writeFile(join(output, '404.html'), shell({ title: 'Page not found | Go Careers', description: 'This opportunity may have closed or moved.', noindex: true, prefix: canonicalBase || '/', body: `<main id="main" class="container not-found"><p class="eyebrow">404 · A DIFFERENT DIRECTION</p><h1>This page has moved on.</h1><p>The job may have closed, or the link may be incorrect.</p><a class="button" href="${e(canonicalBase || '/')}">Explore current opportunities →</a></main>` }));
  if (canonicalBase && !demo) {
    await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', ...jobs.map(job => `jobs/${job.id}/`)].map(path => `<url><loc>${e(canonicalBase + path)}</loc></url>`).join('')}</urlset>`);
    await writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${canonicalBase}sitemap.xml\n`);
  } else await writeFile(join(output, 'robots.txt'), demo ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n');
  return { total: allJobs.length, active: jobs.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await build({ production: process.argv.includes('--production'), validateOnly: process.argv.includes('--validate') });
    console.log(`CSV valid: ${result.active} active / ${result.total} total jobs.${process.argv.includes('--validate') ? '' : ' Site generated in dist/.'}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
