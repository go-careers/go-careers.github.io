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

const flag = country => String.fromCodePoint(...[...country].map(letter => 0x1F1E6 + letter.charCodeAt(0) - 65));
const time = date => `<time datetime="${date}">${dateLabel.format(new Date(date))}</time>`;

export function relocationPage(jobs, companyMark) {
  const countries = [...new Set(jobs.map(job => job.country))].sort((a, b) => countryNames.of(a).localeCompare(countryNames.of(b)));
  const cards = jobs.map((job, index) => `<article class="relocation-row" data-country="${job.country}" data-window-end="${windowEnd(job.posted_date)}" data-expiry="${job.expiry_date || ''}">
    <div class="relocation-role">
      <div class="relocation-identity">${companyMark(job, index)}<div><p class="relocation-company">${e(job.company)}</p>
        <p class="relocation-place"><span aria-hidden="true">${flag(job.country)}</span> ${e(job.city)}, ${e(countryNames.of(job.country))}</p></div></div>
      <h2>${e(job.title)}</h2><p class="relocation-description">${e(job.description)}</p>
    </div>
    <dl class="moving-support"><div><dt><span aria-hidden="true">📦</span> Moving assistance</dt><dd>${e(job.relocation_support)}</dd></div>
      <div><dt><span aria-hidden="true">🛂</span> Visa support</dt><dd>${e(job.visa_support)}</dd></div></dl>
    <div class="relocation-action"><p class="relocation-dates"><span>Posted ${time(job.posted_date)}</span><span>Checked ${time(job.verified_date)}</span></p>
      <a class="row-link" href="${e(job.source_url)}" aria-label="View ${e(job.title)} at ${e(job.company)} on the employer’s site">View opening <span aria-hidden="true">↗</span></a></div>
  </article>`).join('');
  return `<main id="main" class="container collection-page relocation-page">
    <header class="relocation-hero"><div class="relocation-intro">
      <a class="back-link" href="../#opportunities"><span aria-hidden="true">←</span> Jobs in India</a>
      <h1>Jobs abroad <em>with relocation</em></h1>
      <p>Explore engineering jobs outside India. Compare moving assistance and visa terms for each role.</p>
    </div><div class="relocation-photo"><img src="../assets/relocation-flight.webp" alt="" width="1152" height="740" fetchpriority="high"></div></header>
    <div class="relocation-toolbar"><div class="relocation-results"><h2>Open roles</h2><p id="relocation-count" role="status">${jobs.length} ${jobs.length === 1 ? 'opening' : 'openings'}</p></div>
      <div id="destination-field" class="filter-field" hidden><label for="destination">Destination</label><select id="destination"><option value="">All countries</option>${countries.map(code => `<option value="${code}">${e(countryNames.of(code))}</option>`).join('')}</select></div></div>
    <div class="relocation-list">${cards}</div>
    <div id="relocation-empty" class="empty-state"${jobs.length ? ' hidden' : ''}><h2>No current relocation openings</h2><p>Check back for newly verified roles or explore jobs in India.</p><a class="button secondary" href="../#opportunities">Browse jobs in India</a></div>
  </main>`;
}
