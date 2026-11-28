import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { readJobs, activeJobs, validateCompanyEligibility, escapeHTML as e } from './jobs.mjs';
import { indiaDate, windowEnd } from './job-window.mjs';
import { readIngestionTimes } from './ingestion.mjs';
import { linkedinPeopleLinks } from './linkedin.mjs';
import { jobLocations, locationOptions, locationSearchTerms } from './locations.mjs';
import { browseCollections } from './browse.mjs';
import { discoveryHead, jobPreview } from './seo.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
const dateLabel = value => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const addedDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const experience = job => {
  if (job.experience_min === null && job.experience_max === null) return 'Experience not specified';
  if (job.experience_max === null) return `${job.experience_min}+ years`;
  if (job.experience_min === null) return `Up to ${job.experience_max} years`;
  return job.experience_min === job.experience_max ? `${job.experience_min} years` : `${job.experience_min}–${job.experience_max} years`;
};
const salarySummary = job => (job.salary || job.salary_benchmark).replace(/ LPA \/ year$/, ' LPA');
const compensation = job => `<dt id="compensation">Expected salary</dt><dd class="expected-compensation">${e(salarySummary(job) || 'Not disclosed')}</dd>`;

const initials = company => company.split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();

export async function build({ output = join(root, 'dist'), csv, today = indiaDate(), production = false, siteURL = process.env.SITE_URL || '', validateOnly = false, companyAudit } = {}) {
  const allJobs = readJobs(csv ?? await readFile(join(root, 'data/jobs.csv'), 'utf8'), await readIngestionTimes());
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
  const [styleVersion, scriptVersion, analyticsVersion, trackerVersion] = await Promise.all(['styles.css', 'app.js', 'analytics.js', 'applications.js'].map(async file => createHash('sha256').update(await readFile(join(root, 'site', file))).digest('hex').slice(0, 12)));
  const demo = allJobs.some(job => job.is_demo);
  const analyticsEnabled = production && !demo;
  let canonicalBase = '';
  if (siteURL) {
    const url = new URL(siteURL);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('SITE_URL must be an HTTPS site root, without credentials, query, or fragment.');
    canonicalBase = url.href.replace(/\/?$/, '/');
  }
  const option = (value, label = value) => `<option value="${e(value)}">${e(label)}</option>`;
  const places = locationOptions(jobs);
  const collections = browseCollections(jobs, places);
  const browsePath = collection => `browse/${collection.slug}/`;
  const homeCrumb = { name: 'Go Careers', path: '' };
  const aboutPath = 'about/';
  const applicationsPath = 'applications/';
  const browseMenu = collections.length ? `<nav class="browse-menu container" aria-label="Browse startup jobs"><h2>Browse startup jobs</h2>${['Role', 'Location'].map(group => {
    const links = collections.filter(c => c.group === group).map(c => `<a href="${browsePath(c)}">${e(c.label)}</a>`).join('');
    return links ? `<div><strong>${group}</strong>${links}</div>` : '';
  }).join('')}</nav>` : '';
  const placeOption = place => `<option value="${e(place.id)}" data-label="${e(place.label)}" data-aliases="${e(JSON.stringify(place.aliases.map(alias => alias.toLowerCase())))}">${e(place.label)} (${place.count})</option>`;
  const otherPlaces = new Set(['remote', 'city-unspecified']);
  const locationChoices = `<option value="" data-label="All locations">All locations (${jobs.length})</option><optgroup label="Cities" data-cities>${places.filter(place => !otherPlaces.has(place.id)).map(placeOption).join('')}</optgroup><optgroup label="Other options">${places.filter(place => otherPlaces.has(place.id)).map(placeOption).join('')}</optgroup>`;
  const unique = key => [...new Set(jobs.map(job => job[key]))].sort();
  const badge = (job, prefix = '', lazy = false) => job.company_logo ? `<span class="company-mark company-logo" aria-hidden="true"><img src="${prefix}assets/companies/${e(job.company_logo)}" alt="" width="40" height="40" decoding="async"${lazy ? ' loading="lazy"' : ''}></span>` : `<span class="company-mark tone-${job.company.length % 4}" aria-hidden="true">${e(initials(job.company))}</span>`;
  const tags = job => [job.location, ...(job.location === job.work_mode || job.work_mode === 'Not specified' ? [] : [job.work_mode]), job.employment_type, experience(job)].map(value => `<span>${e(value)}</span>`).join('');
  const cardTags = job => [
    job.location,
    ...(job.location === job.work_mode || job.work_mode === 'Not specified' ? [] : [job.work_mode]),
    ...(job.employment_type !== 'Full-time' && !job.title.toLowerCase().includes(job.employment_type.toLowerCase().replace('ship', '')) ? [job.employment_type] : []),
    ...(job.experience_min === null && job.experience_max === null ? [] : [experience(job)]),
  ].map(value => `<span>${e(value)}</span>`).join('');
  const saveButton = (job, compact = false) => `<button type="button" class="save-job ${compact ? 'save-compact' : ''}" data-save-id="${e(job.id)}" data-save-title="${e(job.title + ' at ' + job.company)}" aria-label="Save ${e(job.title)} at ${e(job.company)}" aria-pressed="false" hidden><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4z"/></svg><span class="save-label${compact ? ' sr-only' : ''}">Save job</span></button>`;
  const card = (job, index, prefix = '') => `<article class="job-card" data-id="${e(job.id)}" data-ingested="${e(job.ingested_at)}" data-posted="${e(job.posted_date)}" data-expiry="${e(job.expiry_date)}" data-window-end="${windowEnd(job.posted_date)}" data-company="${e(job.company)}" data-location="${e(job.location)}" data-locations="${e(JSON.stringify(jobLocations(job.location, job.work_mode).map(place => place.id)))}" data-mode="${e(job.work_mode)}" data-type="${e(job.employment_type)}" data-min="${job.experience_min ?? ''}" data-max="${job.experience_max ?? ''}" data-search="${e([job.title, job.company, job.location, locationSearchTerms(job.location, job.work_mode), ...job.skills].join(' ').toLowerCase())}">
    ${badge(job, prefix, index >= 4)}<div class="job-heading"><h3><a href="${prefix}jobs/${e(job.id)}/">${e(job.title)}</a></h3><p class="company-name">${e(job.company)}${job.is_demo ? '<span class="sample-tag">Sample</span>' : ''}</p><div class="job-meta">${cardTags(job)}${job.ingested_at ? `<time class="added-date" datetime="${e(job.ingested_at)}">Added ${addedDate.format(new Date(job.ingested_at))}</time>` : ''}</div></div>
    <div class="job-summary">${salarySummary(job) ? `<div class="salary-block"><span class="salary-label">Expected salary</span><p class="salary">${e(salarySummary(job))}</p></div>` : ''}<div class="row-actions">${saveButton(job, true)}<a class="row-link" href="${prefix}jobs/${e(job.id)}/" aria-label="View ${e(job.title)} at ${e(job.company)}">View job <span aria-hidden="true">→</span></a></div></div>
  </article>`;
  const jobCharts = `<details id="job-charts" class="job-charts" data-view="city" hidden>
    <summary><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M4 5h16M4 12h11M4 19h6"/></svg>Explore job charts</summary>
    <div class="chart-switch" role="group" aria-label="Choose a chart"><button type="button" data-chart-view="city" aria-controls="city-panel" aria-pressed="true">Top cities</button><button type="button" data-chart-view="mode" aria-controls="mode-panel" aria-pressed="false">Work style</button></div>
    <div class="chart-grid">
      <section id="city-panel" aria-labelledby="city-chart-title"><h2 id="city-chart-title">Top cities</h2><div id="city-chart" class="chart-bars" role="group" aria-labelledby="city-chart-title"></div><p class="chart-note">Roles in multiple cities count once in each city.</p></section>
      <section id="mode-panel" aria-labelledby="mode-chart-title"><h2 id="mode-chart-title">Work style</h2><div id="mode-chart" class="chart-bars" role="group" aria-labelledby="mode-chart-title"></div></section>
    </div><div class="chart-footer"><span>Select a bar to filter jobs. Select it again to clear.</span><a id="chart-result-link" href="#open-roles">View results ↓</a></div></details>`;
  const shell = ({ title, description, body, prefix = './', path = '', noindex = false, type, crumbs, source }) => `<!doctype html>
<html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)}</title><meta name="description" content="${e(description)}"><meta name="color-scheme" content="only light"><meta name="theme-color" content="#ffffff">${discoveryHead({ base: canonicalBase, path, title, description, type, crumbs, source, noindex: noindex || demo })}<link rel="icon" href="${prefix}assets/favicon.png" type="image/png"><link rel="stylesheet" href="${prefix}assets/styles.css?v=${styleVersion}">${analyticsEnabled ? `<script src="${prefix}assets/analytics.js?v=${analyticsVersion}" defer></script>` : ''}<script src="${prefix}assets/app.js?v=${scriptVersion}" defer></script>${path === applicationsPath || path.startsWith('jobs/') ? `<script src="${prefix}assets/applications.js?v=${trackerVersion}" defer></script>` : ''}${analyticsEnabled ? '<script id="umami-tracker" defer src="https://cloud.umami.is/script.js" data-website-id="e6cb80e5-9b47-4a06-823e-7d76c5c0e762" data-domains="go-careers.github.io" data-auto-pageview="false" data-before-send="goCareersBeforeSend"></script>' : ''}</head>
<body><a class="skip-link" href="#main">Skip to content</a>${demo ? '<div class="demo-bar">Preview · All sample listings are fictional. Applications are disabled.</div>' : ''}<header id="top" tabindex="-1" class="site-header"><div class="container nav"><a class="brand" href="${prefix}" aria-label="Go Careers home"><img class="brand-logo" src="${prefix}assets/logo.jpg" alt="" width="46" height="46"><span class="brand-copy">Go Careers</span></a><nav aria-label="Main navigation"><a class="browse-nav${path === '' ? ' nav-current' : ''}" data-nav-view="all"${path === '' ? ' aria-current="page"' : ''} href="${prefix}#opportunities" aria-label="Browse jobs"><span>Browse<span class="nav-suffix"> jobs</span></span></a><a class="saved-nav" data-nav-view="saved" href="${prefix}?saved=1#opportunities" aria-label="Saved jobs" hidden><span>Saved<span class="nav-suffix"> jobs</span></span></a><a href="${prefix}${applicationsPath}"${path === applicationsPath ? ' class="nav-current" aria-current="page"' : ''}>Applications</a></nav></div></header>
${body}<p id="save-status" class="save-status" role="status" aria-live="polite"></p><footer class="site-footer" id="about-board"><div class="container footer-inner"><p><strong>Go Careers</strong></p><a href="${prefix}about/">How listings are selected</a><span>© ${today.slice(0, 4)}</span><a href="#top">Back to top <span aria-hidden="true">↑</span></a></div></footer></body></html>`;
  const index = shell({ title: 'Startup Jobs in India for Software, AI & ML Engineers | Go Careers', type: 'CollectionPage', description: 'Find software engineering, AI and machine learning jobs at private startups hiring in India. Filter by experience, city or remote work and apply on the original listing.', body: `
<main id="main"><section class="hero" aria-labelledby="board-title"><div class="container hero-inner">
<div class="intro"><h1 id="board-title">Startup jobs <em>in India.</em></h1><p>Software, data and AI roles posted in the past month.</p></div>
<div class="search-tools">
<form id="search-form" role="search" hidden><label class="search-label" for="search">Role, company or skill</label><div class="search-bar"><span class="search-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></span><input id="search" name="q" type="search" placeholder="e.g. Backend engineer" autocomplete="off"><button id="clear-search" type="button" class="clear-search" aria-label="Clear search" hidden>×</button><button type="submit" class="button">Search jobs</button></div></form>
<div id="quick-searches" class="quick-searches" aria-label="Quick searches" hidden><button type="button" data-quick="q" data-value="machine learning" aria-pressed="false">Machine learning</button><button type="button" data-quick="q" data-value="backend" aria-pressed="false">Backend</button><button type="button" data-quick="q" data-value="python" aria-pressed="false">Python</button><button type="button" data-quick="mode" data-value="Remote" aria-pressed="false">Remote</button></div>
</div></div></section>
<section id="opportunities" class="opportunities"><div class="container">
<div class="board-layout"><div id="view-bar" class="view-bar" hidden><div class="board-tabs" role="group" aria-label="Job views"><button id="all-view" type="button" aria-pressed="true">All jobs</button><button id="saved-view" type="button" aria-pressed="false">Saved jobs <span id="saved-count">0</span></button></div><div class="filter-toggle-bar" id="filter-toggle-bar" hidden><button id="filter-toggle" class="button secondary" type="button" aria-controls="filters" aria-expanded="false"><span>Filters<span id="filter-count"></span></span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 7h7m4 0h7M3 17h12m4 0h2"/><circle cx="12" cy="7" r="2"/><circle cx="17" cy="17" r="2"/></svg></button></div><span class="saved-hint" id="saved-hint" hidden>Saved on this browser</span></div><aside class="filters" id="filters" hidden><div class="filter-heading"><h2>Filter jobs</h2><button class="text-button" type="button" id="reset">Clear all</button></div><div class="filter-field"><label for="experience">Your experience</label><select id="experience" name="experience">${option('', 'Any experience')}${option('0', 'Fresher · 0 years')}${option('0-2', '0–2 years')}${option('3-5', '3–5 years')}${option('6-10', '6–10 years')}${option('11-60', '11+ years')}</select></div><div class="filter-field"><label for="company">Company</label><select id="company" name="company">${option('', 'All startups')}${unique('company').map(v => option(v)).join('')}</select></div><div class="filter-field"><label for="location">Location</label><select id="location" name="location">${locationChoices}</select></div><div class="filter-field"><label for="mode">Work style</label><select id="mode" name="mode">${option('', 'Any work style')}${['Remote', 'Hybrid', 'On-site', 'Not specified'].map(v => option(v)).join('')}</select></div><div class="filter-field"><label for="type">Job type</label><select id="type" name="type">${option('', 'All job types')}${unique('employment_type').map(v => option(v)).join('')}</select></div><button type="button" id="filters-done" class="button filters-done">Show results</button></aside>
<div class="results">${jobCharts}<div id="active-filters" class="active-filters" role="group" aria-label="Applied filters" hidden></div><div class="results-toolbar"><div class="results-heading"><h2 id="open-roles" tabindex="-1">Open roles</h2><p id="result-count" role="status" aria-live="polite">${jobs.length} ${demo ? 'sample ' : ''}opportunities</p></div><div id="sort-control" hidden><label for="sort">Sort by</label><select id="sort" aria-label="Sort jobs by"><option value="newest">Recently added</option><option value="oldest">Earliest added</option></select></div></div><noscript><p class="notice">All current listings are shown below. Enable JavaScript to search and filter them.</p></noscript><div id="job-list">${jobs.map((job, index) => card(job, index)).join('')}</div><div id="empty-state" class="empty-state" ${jobs.length ? 'hidden' : ''}><span aria-hidden="true">⌕</span><h3 id="empty-title">${jobs.length ? 'No matching opportunities' : 'Good things are on their way'}</h3><p id="empty-description">${jobs.length ? 'Try a broader search or clear your filters.' : 'There are no open roles listed right now. Check back soon.'}</p><button type="button" class="button secondary" id="empty-reset" hidden>Clear all filters</button><button type="button" class="button secondary" id="empty-browse" hidden>Browse all jobs</button></div><nav id="pagination" class="pagination" aria-label="Job result pages" hidden><button id="previous" type="button">← Previous</button><div class="page-picker"><label for="page-select" id="page-label">Page</label><select id="page-select" aria-label="Go to results page"></select></div><button id="next" type="button">Next →</button></nav></div></div></div></section>
${browseMenu}</main>` });
  // All input is validated before replacing the generated output.
  await rm(output, { recursive: true, force: true });
  await mkdir(join(output, 'assets'), { recursive: true });
  await cp(join(root, 'site'), join(output, 'assets'), { recursive: true });
  if (canonicalBase === 'https://go-careers.github.io/' && !demo) {
    const verificationFile = 'google5ddf0a2ba94d4a71.html';
    await cp(join(root, verificationFile), join(output, verificationFile));
  }
  await writeFile(join(output, 'index.html'), index);
  await writeFile(join(output, '.nojekyll'), '');
  const listedThrough = Object.fromEntries(jobs.map(job => {
    const end = windowEnd(job.posted_date);
    return [job.id, job.expiry_date && job.expiry_date < end ? job.expiry_date : end];
  }));
  const tracker = shell({
    title: 'My applications | Go Careers', description: 'Review the roles you marked as applied on this browser.',
    prefix: '../', path: applicationsPath, noindex: true,
    body: `<main id="main" class="container guide-page tracker-page">
      <a class="back-link" href="../#opportunities">← Browse jobs</a>
      <h1>My applications</h1><p class="collection-summary">Your application history is stored in this browser.</p>
      <noscript><p>Enable JavaScript to use the application tracker.</p></noscript>
      <p id="tracker-feedback" class="tracker-feedback" role="status"></p>
      <div class="empty-state" id="tracker-empty" hidden><div><h2>No applications yet</h2><p>After you apply, select <strong>Mark as applied</strong> on the job page.</p></div><a class="button" href="../#opportunities">Browse jobs</a></div>
      <ul id="applications-list" class="applications-list" aria-label="Applications, newest first" data-listed-through="${e(JSON.stringify(listedThrough))}" hidden></ul>
      <template id="application-row"><li class="application-row"><div><h2></h2><p class="company-name"></p></div><p class="application-meta">Applied <time></time><span class="unlisted" hidden> · No longer listed</span></p><button class="text-button" type="button">Remove</button></li></template>
    </main>`,
  });
  await mkdir(join(output, applicationsPath), { recursive: true });
  await writeFile(join(output, applicationsPath, 'index.html'), tracker);
  const about = shell({
    path: aboutPath, prefix: '../', type: 'AboutPage', title: 'How Go Careers selects startup jobs in India',
    description: 'How Go Careers selects India startup jobs, checks posting dates, handles expected pay and links applicants to the original hiring page.',
    crumbs: [homeCrumb, { name: 'How listings are selected', path: aboutPath }],
    body: `<main id="main" class="container guide-page"><a class="back-link" href="../">← Go Careers</a><h1>How listings are selected</h1><section class="description"><h2>Which jobs make the board?</h2><p>Go Careers curates public software, data and AI engineering openings at independent, private startups hiring in India. Each listing has an original posting date and an advertised Indian location or explicit eligibility to work remotely from India.</p></section><section class="description"><h2>How recent are the openings?</h2><p>We keep one calendar month of postings. A listing leaves the board sooner if its advertised closing date passes. Following the application link lets you check whether the employer is still accepting applications.</p></section><section class="description"><h2>Where does expected salary come from?</h2><p>We show the employer’s published pay when available. Otherwise, we may show an estimate from comparable Indian roles. The original listing is the source for any compensation the employer offers.</p></section><section class="description"><h2>Where do I apply?</h2><p>Each job brief links to the original hiring page. The employer or its recruiting platform handles the application.</p></section><a class="button" href="../#opportunities">Browse open jobs →</a></main>`,
  });
  await mkdir(join(output, aboutPath), { recursive: true });
  await writeFile(join(output, aboutPath, 'index.html'), about);
  for (const collection of collections) {
    const { heading, jobs: matches } = collection;
    const path = browsePath(collection);
    const employers = [...new Set(matches.map(job => job.company))];
    const sample = new Intl.ListFormat('en-IN', { style: 'long', type: 'conjunction' }).format(employers.slice(0, 3));
    const summary = `${matches.length} ${matches.length === 1 ? 'opening' : 'openings'} at ${employers.length} private ${employers.length === 1 ? 'startup' : 'startups'}.`;
    const description = `${heading}. Recent openings at ${sample}. Check the job brief, required skills and original application link.`;
    const content = shell({ title: heading + ' | Go Careers', description, type: 'CollectionPage', path, prefix: '../../',
      crumbs: [homeCrumb, { name: heading, path }],
      body: `<main id="main" class="container collection-page" data-collection><a class="back-link" href="../../#opportunities">← All startup jobs</a><h1>${e(heading)}</h1><p class="collection-summary" data-collection-summary>${e(summary)}</p><h2 class="sr-only">Open roles</h2><div class="collection-jobs">${matches.map((job, index) => card(job, index, '../../')).join('')}</div></main>`,
    });
    await mkdir(join(output, path), { recursive: true });
    await writeFile(join(output, path, 'index.html'), content);
  }
  for (const job of jobs) {
    const { title, description } = jobPreview(job);
    const path = `jobs/${job.id}/`;
    const related = collections.filter(c => c.jobs.includes(job));
    const [primary, ...otherCollections] = related;
    const breadcrumb = `<nav class="detail-trail" aria-label="Breadcrumb"><a class="back-link" href="../../#opportunities">← Back to jobs</a>${primary ? `<span aria-hidden="true">›</span><a href="../../${browsePath(primary)}">${e(primary.label)}</a>` : ''}</nav>`;
    const crumbs = [homeCrumb, ...(primary ? [{ name: primary.heading, path: browsePath(primary) }] : []), { name: job.title, path }];
    const relatedLinks = otherCollections.length ? `<nav class="related-collections" aria-label="Related job lists"><h2>Browse similar jobs</h2>${otherCollections.map(c => `<a href="../../${browsePath(c)}">${e(c.heading)}</a>`).join('')}</nav>` : '';
    const apply = job.is_demo ? '<div class="notice">This is a fictional sample listing. Applications are disabled.</div>' : `<a id="apply-link" class="button apply-button" href="${e(job.apply_url)}" target="_blank" rel="noopener noreferrer">Apply for this role <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
    const markApplied = job.is_demo ? '' : `<button type="button" id="mark-applied" class="button secondary" data-id="${e(job.id)}" data-title="${e(job.title)}" data-company="${e(job.company)}" aria-pressed="false" hidden>Mark as applied</button><p id="tracker-feedback" class="tracker-feedback" role="status"></p>`;
    const content = shell({ title, description, prefix: '../../', path, crumbs, source: job.apply_url, body: `<main id="main" class="container detail-page" data-expiry="${e(job.expiry_date)}" data-window-end="${windowEnd(job.posted_date)}">${breadcrumb}<div class="detail-layout"><article class="detail-content"><div class="detail-heading">${badge(job, '../../')}<p class="company-name">${e(job.company)}${job.is_demo ? '<span class="sample-tag">Sample</span>' : ''}</p><h1>${e(job.title)}</h1><div class="job-meta">${tags(job)}</div></div><div id="closed-notice" class="notice" hidden>This listing is no longer in our latest-jobs feed.</div><section class="description"><h2>Job brief</h2>${job.description.split(/\r?\n\s*\r?\n/).filter(p => !p.startsWith('Summary of the employer’s listing.')).map(p => `<p>${e(p).replace(/\r?\n/g, '<br>')}</p>`).join('')}</section>${job.skills.length ? `<section class="description"><h2>Key skills</h2><div class="skills required-skills">${job.skills.map(skill => `<span>${e(skill)}</span>`).join('')}</div></section>` : ''}${networking(job)}${relatedLinks}</article><aside class="detail-sidebar"><h2>At a glance</h2>${apply}${saveButton(job)}${markApplied}<dl><dt>Location</dt><dd>${e(job.location)}${job.work_mode !== 'Not specified' && job.location !== job.work_mode ? ` · ${e(job.work_mode)}` : ''}</dd><dt>Employment</dt><dd>${e(job.employment_type)}</dd><dt>Experience</dt><dd>${e(experience(job))}</dd>${compensation(job)}${job.ingested_at ? `<dt>Added to Go Careers</dt><dd><time datetime="${job.ingested_at}">${dateLabel(indiaDate(new Date(job.ingested_at)))}</time></dd>` : ''}${job.posted_date ? `<dt>Posted</dt><dd><time datetime="${job.posted_date}">${dateLabel(job.posted_date)}</time></dd>` : ''}${job.expiry_date ? `<dt>Apply by (IST)</dt><dd><time datetime="${job.expiry_date}">${dateLabel(job.expiry_date)}</time></dd>` : ''}</dl><button id="share" class="button secondary" type="button" hidden>Copy job link</button><p id="share-status" class="apply-note" role="status"></p></aside></div></main>` });
    await mkdir(join(output, 'jobs', job.id), { recursive: true });
    await writeFile(join(output, 'jobs', job.id, 'index.html'), content);
  }
  await writeFile(join(output, '404.html'), shell({ title: 'Page not found | Go Careers', description: 'This opportunity may have closed or moved.', path: '404.html', noindex: true, prefix: canonicalBase || '/', body: `<main id="main" class="container not-found"><h1>Page not found</h1><p>The job may have closed, or the link may be incorrect.</p><a class="button" href="${e(canonicalBase || '/')}">Explore current opportunities →</a></main>` }));
  if (canonicalBase && !demo) {
    await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', aboutPath, ...collections.map(browsePath), ...jobs.map(job => `jobs/${job.id}/`)].map(path => `<url><loc>${e(canonicalBase + path)}</loc></url>`).join('')}</urlset>`);
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
