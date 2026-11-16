import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { readJobs, activeJobs, escapeHTML as e } from './jobs.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
const dateLabel = value => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const experience = job => {
  if (job.experience_min === null && job.experience_max === null) return 'Experience not specified';
  if (job.experience_max === null) return `${job.experience_min}+ years`;
  if (job.experience_min === null) return `Up to ${job.experience_max} years`;
  return job.experience_min === job.experience_max ? `${job.experience_min} years` : `${job.experience_min}–${job.experience_max} years`;
};
const initials = company => company.split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();

export async function build({ output = join(root, 'dist'), csv, today = new Date().toISOString().slice(0, 10), production = false, siteURL = process.env.SITE_URL || '', validateOnly = false } = {}) {
  const allJobs = readJobs(csv ?? await readFile(join(root, 'data/jobs.csv'), 'utf8'));
  if (production && allJobs.some(job => job.is_demo)) throw new Error('Production build blocked: replace or remove all demo jobs in data/jobs.csv first.');
  const jobs = activeJobs(allJobs, today);
  if (validateOnly) return { total: allJobs.length, active: jobs.length };
  const demo = jobs.some(job => job.is_demo);
  let canonicalBase = '';
  if (siteURL) {
    const url = new URL(siteURL);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('SITE_URL must be an HTTPS site root, without credentials, query, or fragment.');
    canonicalBase = url.href.replace(/\/?$/, '/');
  }
  const option = (value, label = value) => `<option value="${e(value)}">${e(label)}</option>`;
  const unique = key => [...new Set(jobs.map(job => job[key]))].sort();
  const badge = job => `<span class="company-mark tone-${job.company.length % 4}" aria-hidden="true">${e(initials(job.company))}</span>`;
  const tags = job => [job.location, ...(job.location === job.work_mode ? [] : [job.work_mode]), job.employment_type, experience(job)].map(value => `<span>${e(value)}</span>`).join('');
  const card = job => `<article class="job-card" data-id="${e(job.id)}" data-posted="${e(job.posted_date)}" data-expiry="${e(job.expiry_date)}" data-location="${e(job.location)}" data-mode="${e(job.work_mode)}" data-type="${e(job.employment_type)}" data-min="${job.experience_min ?? ''}" data-max="${job.experience_max ?? ''}" data-search="${e([job.title, job.company, job.location, ...job.skills].join(' ').toLowerCase())}">
    ${badge(job)}<div class="job-heading"><h3><a href="jobs/${e(job.id)}/">${e(job.title)}</a></h3><p class="company-name">${e(job.company)}${job.is_demo ? '<span class="sample-tag">Sample</span>' : ''}</p><div class="job-meta">${tags(job)}</div><div class="skills">${job.skills.slice(0, 4).map(skill => `<span>${e(skill)}</span>`).join('')}</div></div>
    <div class="job-summary"><p class="salary">${e(job.salary || 'Salary not listed')}</p><time datetime="${job.posted_date}">${dateLabel(job.posted_date)}</time><a class="row-link" href="jobs/${e(job.id)}/" aria-label="View ${e(job.title)} at ${e(job.company)}">View job <span aria-hidden="true">↗</span></a></div>
  </article>`;
  const shell = ({ title, description, body, prefix = './', path = '', noindex = false }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)}</title><meta name="description" content="${e(description)}"><meta name="theme-color" content="#3458db">${noindex || demo ? '<meta name="robots" content="noindex, nofollow">' : ''}${canonicalBase ? `<link rel="canonical" href="${e(canonicalBase + path)}"><meta property="og:url" content="${e(canonicalBase + path)}">` : ''}<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><link rel="icon" href="${prefix}assets/favicon.png" type="image/png"><link rel="stylesheet" href="${prefix}assets/styles.css"><script src="${prefix}assets/app.js" defer></script></head>
<body><a class="skip-link" href="#main">Skip to content</a>${demo ? '<div class="demo-bar">Preview · All sample listings are fictional. Applications are disabled.</div>' : ''}<header class="site-header"><div class="container nav"><a class="brand" href="${prefix}" aria-label="Go Careers home"><img class="brand-logo" src="${prefix}assets/logo.jpg" alt="Go Careers" width="46" height="46"></a><nav aria-label="Main navigation"><a class="nav-current" href="${prefix}#opportunities">Browse jobs</a><a href="${prefix}#about-board">About</a></nav></div></header>
${body}<footer class="site-footer" id="about-board"><div class="container footer-inner"><p><strong>Go Careers</strong> · Browse openings and apply directly. No account needed.</p><span>© ${today.slice(0, 4)}</span></div></footer></body></html>`;
  const index = shell({ title: 'Go Careers — Find your next move', description: 'Explore jobs by role, skills, location, and experience. Find your next opportunity with Go Careers.', body: `
<main id="main"><section class="hero container"><div class="intro"><div><h1>Find your next role.</h1><p>Search jobs by role, company, or skill.</p></div><span class="updated">Updated ${dateLabel(today)}</span></div>
<form id="search-form" class="search-bar" role="search" hidden><label for="search" class="search-icon" aria-hidden="true">⌕</label><label class="sr-only" for="search">Search job titles, companies, or skills</label><input id="search" name="q" type="search" placeholder="Job title, company, or skill" autocomplete="off"><button type="submit" class="button">Search jobs</button></form>
</section>
<section id="opportunities" class="opportunities"><div class="container">
<div class="board-layout"><aside class="filters" id="filters" hidden><div class="filter-heading"><h2>Filters</h2><button class="text-button" type="button" id="reset">Reset</button></div><div class="filter-field"><label for="location">Location</label><select id="location" name="location">${option('', 'All locations')}${unique('location').map(v => option(v)).join('')}</select></div><div class="filter-field"><label for="mode">Work style</label><select id="mode" name="mode">${option('', 'Any work style')}${['Remote', 'Hybrid', 'On-site'].map(v => option(v)).join('')}</select></div><div class="filter-field"><label for="type">Job type</label><select id="type" name="type">${option('', 'All job types')}${unique('employment_type').map(v => option(v)).join('')}</select></div><div class="filter-field"><label for="experience">Your experience</label><select id="experience" name="experience">${option('', 'Any experience')}${option('0', 'Fresher · 0 years')}${option('0-2', '0–2 years')}${option('3-5', '3–5 years')}${option('6-10', '6–10 years')}${option('11-60', '11+ years')}</select></div></aside>
<div class="results"><div class="results-toolbar"><div class="results-heading"><h2>Jobs <span id="total-count" class="count-pill">${jobs.length}</span></h2><p id="result-count" role="status" aria-live="polite">${jobs.length} ${demo ? 'sample ' : ''}opportunities</p></div><div id="sort-control" hidden><label for="sort">Sort by</label><select id="sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div></div><noscript><p class="notice">All current listings are shown below. Enable JavaScript to search and filter them.</p></noscript><div id="job-list">${jobs.map(card).join('')}</div><div id="empty-state" class="empty-state" ${jobs.length ? 'hidden' : ''}><span aria-hidden="true">⌕</span><h3>${jobs.length ? 'No matching opportunities' : 'Good things are on their way'}</h3><p>${jobs.length ? 'Try a broader search or clear your filters.' : 'There are no open roles listed right now. Check back soon.'}</p><button type="button" class="button secondary" id="empty-reset" hidden>Clear all filters</button></div><nav id="pagination" class="pagination" aria-label="Job result pages" hidden><button id="previous" type="button">← Previous</button><span id="page-label"></span><button id="next" type="button">Next →</button></nav></div></div></div></section>
</main>` });
  // All input is validated before replacing the generated output.
  await rm(output, { recursive: true, force: true });
  await mkdir(join(output, 'assets'), { recursive: true });
  await cp(join(root, 'site'), join(output, 'assets'), { recursive: true });
  await writeFile(join(output, 'index.html'), index);
  await writeFile(join(output, '.nojekyll'), '');
  for (const job of jobs) {
    const description = job.description.slice(0, 155).replace(/\s+/g, ' ');
    const apply = job.is_demo ? '<div class="notice">This is a fictional sample listing. Applications are disabled.</div>' : `<a id="apply-link" class="button apply-button" href="${e(job.apply_url)}" target="_blank" rel="noopener noreferrer">Apply for this role <span aria-hidden="true">↗</span></a><p class="apply-note">Opens the application page in a new tab.</p>`;
    const content = shell({ title: `${job.title} at ${job.company} | Go Careers`, description, prefix: '../../', path: `jobs/${job.id}/`, body: `<main id="main" class="container detail-page" data-expiry="${e(job.expiry_date)}"><a class="back-link" href="../../#opportunities">← All opportunities</a><div class="detail-layout"><article class="detail-content"><div class="detail-heading">${badge(job)}<p class="company-name">${e(job.company)}${job.is_demo ? '<span class="sample-tag">Sample</span>' : ''}</p><h1>${e(job.title)}</h1><div class="job-meta">${tags(job)}</div></div><div id="closed-notice" class="notice" hidden>This listing has expired and is no longer accepting applications.</div><section class="description"><h2>About this opportunity</h2>${job.description.split(/\r?\n\s*\r?\n/).map(p => `<p>${e(p).replace(/\r?\n/g, '<br>')}</p>`).join('')}</section>${job.skills.length ? `<section class="description"><h2>Skills you’ll bring</h2><div class="skills">${job.skills.map(skill => `<span>${e(skill)}</span>`).join('')}</div></section>` : ''}</article><aside class="detail-sidebar"><h2>The details</h2><dl><dt>Location</dt><dd>${e(job.location)} · ${e(job.work_mode)}</dd><dt>Employment</dt><dd>${e(job.employment_type)}</dd><dt>Experience</dt><dd>${e(experience(job))}</dd><dt>Salary</dt><dd>${e(job.salary || 'Not listed')}</dd><dt>Posted</dt><dd><time datetime="${job.posted_date}">${dateLabel(job.posted_date)}</time></dd>${job.expiry_date ? `<dt>Apply by (UTC)</dt><dd><time datetime="${job.expiry_date}">${dateLabel(job.expiry_date)}</time></dd>` : ''}</dl>${apply}<button id="share" class="button secondary" type="button" hidden>Copy job link</button><p id="share-status" class="apply-note" role="status"></p></aside></div></main>` });
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
