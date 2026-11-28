import { activeJobs, escapeHTML as e, validDate } from './jobs.mjs';
import { indiaDate, windowEnd } from './job-window.mjs';
import { ingestionTime } from './ingestion.mjs';

const countryNames = new Intl.DisplayNames('en', { type: 'region', fallback: 'none' });
const dateLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function relocationListings(rows, today) {
  if (!Array.isArray(rows)) throw new Error('Relocation listings must be an array.');
  const ids = new Set();
  const links = new Set();
  const jobs = rows.map(row => {
    const fail = message => { throw new Error(`Relocation job ${row?.id || '(unknown)'}: ${message}`); };
    if (!row || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id || '') || ids.has(row.id)) fail('invalid or duplicate id');
    for (const key of ['title', 'company', 'city', 'description', 'relocation_support', 'visa_support']) {
      if (typeof row[key] !== 'string' || !row[key].trim()) fail('missing ' + key);
    }
    if (!/^[A-Z]{2}$/.test(row.country) || ['IN', 'ZZ'].includes(row.country) || !countryNames.of(row.country)) fail('expected a destination country outside India');
    const source = new URL(row.source_url);
    if (source.protocol !== 'https:' || source.username || source.password || links.has(source.href)) fail('invalid or duplicate employer link');
    const ingested = ingestionTime(row.ingested_at);
    if (!ingested || !validDate(row.posted_date) || !validDate(row.verified_date) || row.verified_date < row.posted_date) fail('invalid publication, verification or ingestion date');
    if (row.expiry_date && (!validDate(row.expiry_date) || row.expiry_date < row.posted_date)) fail('invalid closing date');
    ids.add(row.id);
    links.add(source.href);
    return { ...row, ingested_at: ingested };
  });
  return activeJobs(jobs.filter(job => indiaDate(new Date(job.ingested_at)) <= today), today);
}

export function relocationPage(jobs) {
  const countries = [...new Set(jobs.map(job => job.country))].sort((a, b) => countryNames.of(a).localeCompare(countryNames.of(b)));
  const time = date => `<time datetime="${date}">${dateLabel.format(new Date(date))}</time>`;
  return `<main id="main" class="container collection-page relocation-page">
    <a class="back-link" href="../#opportunities">← Jobs in India</a>
    <h1>Jobs abroad with relocation</h1>
    <p class="collection-summary">Explore engineering roles outside India with employer-provided moving support. Each opening links to the employer’s relocation and visa terms.</p>
    <div class="relocation-toolbar"><p id="relocation-count" role="status">${jobs.length} ${jobs.length === 1 ? 'opening' : 'openings'}</p>
      <div id="destination-field" class="filter-field" hidden><label for="destination">Destination</label><select id="destination"><option value="">All countries</option>${countries.map(code => `<option value="${code}">${e(countryNames.of(code))}</option>`).join('')}</select></div></div>
    <div class="relocation-list">${jobs.map(job => `<article class="relocation-row" data-country="${job.country}" data-window-end="${windowEnd(job.posted_date)}" data-expiry="${job.expiry_date || ''}">
      <div><p class="relocation-place">${e(job.city)}, ${e(countryNames.of(job.country))}</p>
        <h2>${e(job.title)}</h2><p class="company-name">${e(job.company)}</p><p>${e(job.description)}</p></div>
      <div class="moving-support"><h3>Relocation support</h3><p>${e(job.relocation_support)} ${e(job.visa_support)}</p></div>
      <div class="relocation-action"><a class="row-link" href="${e(job.source_url)}" aria-label="View ${e(job.title)} at ${e(job.company)} on the employer’s site">View opening <span aria-hidden="true">↗</span></a>
        <div class="relocation-dates"><small>Posted ${time(job.posted_date)}</small><small>Checked ${time(job.verified_date)}</small></div></div></article>`).join('')}</div>
    <div id="relocation-empty" class="empty-state"${jobs.length ? ' hidden' : ''}><h2>No current relocation openings</h2><p>Check back for newly verified roles or explore jobs in India.</p><a class="button secondary" href="../#opportunities">Browse jobs in India</a></div>
  </main>`;
}
