# Go Careers — CSV job board

A static job board built from `data/jobs.csv`. Plain HTML, CSS, and browser JavaScript; no API, database, framework, or runtime packages. Each job has a generated detail page that works without JavaScript. Search, filters, and pagination run in the browser.

## Run locally

Use Node.js 22 (Node 18.19+ also works). No package installation is necessary.

```sh
npm run dev
```

Open http://localhost:4173. CSV and `site/` changes rebuild automatically; refresh the browser to see them. Restart the server after editing build scripts. Set `PORT=4174` if the default port is busy.

```sh
npm run validate  # Check CSV without generating files
npm run test      # Parser, validation, expiry, and generated-page tests
npm run check     # Tests + validation + static build
npm run build     # Generate dist/ for any static host
```

## Add real jobs

This board includes independent private startups at any funding stage. There is no Series C cap. Exclude public, acquired and unverified-ownership companies. Funding rounds are background research, not a maximum eligibility threshold; keep the latest supported named round or `Undisclosed` when a current named round is not established in the reviewed evidence. Every real listing still requires company evidence and a research date. Eligibility is manually researched, not checked live against the web.

Ownership is a separate build requirement. Every real employer must have an eligible record in `data/company-funding.json` with a matching funding stage and an `ownership` object: `status: "private"`, `independent: true`, a real `checked_at` date and nonempty HTTPS `sources`. Public, acquired, unknown and unaudited employers stop validation before generated pages are replaced. These fields represent a researched decision, not automatic live verification. Minority investment from a public company does not by itself disqualify a startup; a controlling acquisition does. The earlier ownership review covered 39 historical employers on 16 November 2026. Employers added in later sourcing runs have individual ownership evidence and check dates; untouched records retain their earlier dates. Conflicting aggregator claims for Enterpret and Neuron7 are documented alongside the stronger sources used to retain them.

This board is focused on software development, machine learning, AI, and related engineering roles (platform/SRE, data engineering, and security automation). Keep sales, marketing, design, product management, customer support, and general IT operations out of the feed.

The **27 November 2026 evening refresh** added **50 verified India technical openings across 28 private companies**, following 50 additions in the morning. The board contained **498 active listings across 214 companies** at evening validation, covering 27 October through 27 November inclusive. The morning run archived 20 older postings. None aged out in the evening. [Evening run audit](data/job-runs/2026-11-27T15-00-17Z.json) · [Morning run audit](data/job-runs/2026-11-26T20-44-32Z.json)

The [earlier 100-role sourcing run](data/job-runs/2026-11-16T18-53-21Z.json) remains in the history. On 28 November, 29 more postings aged out of the one-month window. The board has 469 active roles across 208 companies. The archive contains 283 listings, including 267 older postings, 15 undated postings and one listing that reached its employer deadline. Each job carries its own verification date.

The earlier cross-source pass searched LinkedIn, Wellfound, Instahyre, Naukri, Himalayas, Remotive, Remote OK and Cutshort. It added five employer-authored Wellfound roles (Simplismart, Fibr AI, Zenskar), three India-remote OrbitShift roles confirmed through its official Zoho careers feed after discovery on LinkedIn/Himalayas, and five Prodigal roles from its current Greenhouse feed. Naukri denied automated retrieval; Instahyre returned errors/challenge content, so no listings available only on those platforms were claimed as verified. Stale and duplicate leads were excluded. `data/source-search.json` records coverage, access limits and rejected leads; new job audit entries contain `discovered_on` links. Board mirrors do not create extra opportunities.

Sources include employer ATS feeds (Ashby, Greenhouse, Lever, Workable, Keka and Teamtailor), official career pages, and employer-authored Wellfound and YC listings. India eligibility comes from advertised locations, including India-specific remote roles. Duplicate application URLs and company/title/location combinations were checked; near-identical Ema infrastructure postings were consolidated. Lyzr's Staff DevOps and DevOps roles remain separate because their minimum experience differs. Sales-led roles were excluded. Funding evidence is in `data/company-funding.json`; per-job sources and verification records are in `data/job-sources.json`. Descriptions are short editorial paraphrases, and skill chips reflect technologies mentioned in the JD, including preferred tools. Application links lead to the original listing or application form. Availability can change after verification.

`posted_date` uses the source's published or creation timestamp. Relative ages or unavailable dates remain blank and require `verified_date`; undated roles remain in historical evidence but are excluded from the recent feed. Verification is never presented as a new posting date. Unknown work styles use `Not specified`, rather than assuming on-site from a city. No salary or closing date is invented. The production build rejects rows marked `is_demo=true`.

The board puts the most recently added jobs first, using the earliest import that lists each ID in `added_ids`. Within an import, newer employer postings appear first, with the job ID breaking ties. Rechecking a listing keeps its original position. For manual CSV additions, set `ingested_at` on first entry. Jobs without an import record or timestamp follow dated additions in both sort directions.

Edit `data/jobs.csv` in GitHub or a spreadsheet, preserving the column names. Export as UTF-8 CSV. Every row is a job. Keep IDs stable so existing links continue to work.

| Column | Format |
| --- | --- |
| `id` | Unique lowercase slug, e.g. `acme-frontend-001`; letters, digits, hyphens; up to 100 characters |
| `title`, `company`, `location` | Required text; use a consistent location name for filtering |
| `work_mode` | `Remote`, `Hybrid`, `On-site`, or `Not specified` |
| `employment_type` | `Full-time`, `Part-time`, `Contract`, or `Internship` |
| `experience_min`, `experience_max` | Optional years, 0–60; decimals allowed. Both blank = unspecified; min only = N+ years; max only = up to N years. If both supplied, min must not exceed max |
| `skills` | Optional skills separated by `|`, e.g. `React|TypeScript|CSS` |
| `funding_stage` | Required for real jobs: `Bootstrapped`, `Pre-seed`, `Seed`, any named `Series A`–`Series Z` round, or `Undisclosed` |
| `funding_source_url` | Required HTTPS evidence URL; prefer the company or investor announcement |
| `funding_checked_at` | Required actual research date, `YYYY-MM-DD`; do not refresh automatically on build |
| `salary` | Employer-disclosed salary only; blank when undisclosed. Include currency, period and pay basis |
| `apply_url` | Required HTTPS application URL for real jobs; no credentials in URLs |
| `ingested_at` | Optional first import timestamp for manual entries, including time zone, e.g. `2026-11-27T15:00:00Z` |
| `posted_date` | Source date, `YYYY-MM-DD`; blank only with `verified_date`. Future listings stay hidden |
| `expiry_date` | Optional `YYYY-MM-DD`; visible through that date in Asia/Kolkata, hidden afterward |
| `description` | Required plain text; blank lines create paragraphs; HTML is displayed as text |
| `is_demo` | Required `false` for a real job, `true` for a fictional sample |

Quote CSV cells containing commas, quotes, or line breaks. Double embedded quotes (`""`). Common spreadsheet exports handle this automatically. Blank records are ignored. Duplicate IDs, unknown or missing columns, invalid dates, malformed rows, and unsafe application URLs stop the build with an error.

Optional `company_logo` and `verified_date` columns supplement the required schema. `company_logo` is a lowercase PNG filename from `site/companies/`; builds validate the local asset before replacing output. Without a logo, company initials remain as a fallback. `verified_date` records the actual listing check in `YYYY-MM-DD`; it remains in the source data separately from `posted_date`, so older open jobs are not presented as newly posted today.

Official logos are stored locally and documented in `data/company-logos.json`, including source page and asset URLs. Company trademarks belong to their owners. The site makes no external logo requests. The Drivetrain recruiting wordmark is displayed through a square CSS viewport showing its emblem.

### Location filters

City filters include every city on multi-location roles, normalize Bangalore/Bengaluru, and group Delhi, Noida and Gurugram under Delhi NCR. Counts update against the other active filters, including saved jobs. Empty choices are disabled while the current selection remains removable. Explicit remote jobs have a separate choice; a country-only India listing is shown as city unspecified and is never assumed remote. The card retains the employer's original location. City aliases also work in search, and previously shared location URLs still resolve.

### Salary research

On 28 November, **274 of 469 active openings show expected compensation**. Employers published pay for 71 roles, and 203 other roles have sourced estimates. The board preserves each amount’s currency and pay period.

Estimates use relevant company employee reports where available, then documented India role/experience benchmarks from Instahyre, Naukri, Glassdoor and Michael Page. Market estimates are **not company-confirmed salary bands**. Finite experience ranges use the envelope of overlapping published bands; open-ended experience uses the minimum band. Title-only comparisons, mismatched sectors, small samples and aging reports are documented per job. Some ranges include equity and variable pay; base-pay sources remain marked separately in the CSV. These are not take-home amounts. Internship estimates retain their monthly period. No arbitrary startup premium or currency conversion is added.

Cards and job details show only **Expected salary** and the amount. The job brief and key skills remain prominent. Sources, pay basis, methodology and confidence limitations stay in `data/salary-research.json` and the CSV, with no research links, notes or dates in the UI. LPA means lakh rupees per year. Cyble's employer-authored YC ranges and the existing Wellfound employer ranges are preserved; raw employer amounts remain in `data/job-sources.json`.

These additional CSV columns are optional for older feeds. When `salary_benchmark` is populated, all six are required:

| Column | Format |
| --- | --- |
| `salary_benchmark` | Sourced display amount, currency and explicit period (LPA for annual pay, /month for stipends); explicitly mark a median when used |
| `salary_basis` | `Total pay`, `Fixed pay`, or `Base pay`; never mix these |
| `salary_source_url` | Direct HTTPS evidence URL without credentials |
| `salary_source_name` | Publisher, e.g. Glassdoor, Levels.fyi or Weekday |
| `salary_note` | Comparison role, geography, sample size, source date and important mismatches; may also explain why a benchmark is unavailable |
| `salary_checked_at` | Actual research date in `YYYY-MM-DD`, not automatically refreshed by a build |

`data/salary-research.json` records the research decisions; the CSV supplies the displayed content. Update both when researching again. Keep employer salary separate from benchmarks, and leave unsupported figures blank. Review aging sources when refreshing job listings.

The CSV is public repository content. Keep only information intended for job seekers in it. The site never sends applications or collects candidate data; Apply opens the supplied URL.

## Rolling one-month feed

Only postings from one calendar month ago through today (inclusive, Asia/Kolkata) appear. For example, 16 November keeps 16 October onward. Month ends clamp to the previous month's last day; this is not a fixed 30-day window. Original publication dates determine age. Verification, collection and modification timestamps never extend it. Undated postings are excluded until a reliable in-window publication date is established. Employer closing dates can expire a role earlier; future postings stay hidden until their publication day.

The daily-jobs skill runs these commands before sourcing and again before final validation:

```sh
npm run jobs:prune -- --dry-run  # Preview IDs and reasons
npm run jobs:prune              # Archive and remove ineligible rows
```

The command archives complete removed CSV rows in `data/job-archive/` before replacing `data/jobs.csv`. It is safe to rerun: no changes or duplicate archive are created when nothing needs removal. Archive reasons distinguish old postings, unknown posting dates and employer expiry. Source, salary and company audits remain historical supersets, preserving evidence and duplicate detection. Removal for age does not mean the employer closed the vacancy. Read archived IDs and application URLs when sourcing to avoid reintroducing the same old requisition.

Builds enforce the same window without modifying the CSV, including scheduled daily deployments. Browser tabs recheck the generated retention deadline every minute, remove stale cards and disable Apply on aged-out detail pages. Generated pages and sitemap entries disappear on the next build. No new analytics events are added.

## Search discovery

The homepage links to static pages for role families, engineering internships, remote work and major Indian cities. The generator creates a collection only when it contains current openings. Every listing is readable without JavaScript and links to its original application page. The selection and salary methodology is published at `/about/`.

Production pages have a clean canonical URL, a search description and social preview metadata. Job briefs use WebPage and breadcrumb structured data. The daily rebuild removes closed or aged-out URLs and empty collections from both the output and the sitemap. Missing URLs return the site's 404 page.

The sitemap is [go-careers.github.io/sitemap.xml](https://go-careers.github.io/sitemap.xml). A verified owner can submit it once in [Google Search Console](https://search.google.com/search-console) and use the Performance report to measure search impressions and clicks.

## Analytics

Production pages use the owner's Umami Cloud website `e6cb80e5-9b47-4a06-823e-7d76c5c0e762`, restricted to `go-careers.github.io`. Local/preview builds omit tracking. The website ID is public configuration, not a secret.

The Hobby-plan configuration records only:

- **Pageviews**: one per document load, supporting visitors, traffic sources and popular job pages. Job detail views do not generate a duplicate custom event.
- **`apply_click`**: one per Apply click, with no custom properties; its page URL identifies the job. This measures an outbound click, not a completed application.
- **`job_saved`**: one per save action, with only `job_id` to distinguish jobs saved from the board. Unsave actions are not recorded. This counts actions, not a synchronized database of saved jobs.

Search, filtering, pagination, LinkedIn links and copying links generate no extra events. Automatic history-based pageviews, performance tracking and error tracking are not enabled. Umami counts pageviews, custom events and stored event properties toward usage, so the extra properties are deliberately limited to one on saves. See [current Umami pricing](https://umami.is/pricing).

The sender removes search/filter/return parameters and URL fragments from analytics URLs, preserving only standard UTM campaign parameters. Referrer query strings are removed. Normal navigation remains unchanged. Tracking is asynchronous, queues at most 50 early actions in memory, and does not interrupt the site if blocked. There is no session replay, custom visitor identity or free-form search-text collection.

In [Umami Cloud](https://cloud.umami.is/), open this website to see Visitors, Views, Referrers and Pages. Under Events, use `apply_click` and `job_saved`; the latter's `job_id` property distinguishes saved roles. Traffic starts after installation; historical visits cannot be reconstructed.

`tests/analytics-browser.mjs` exercises the real public tracker using a locally downloaded script supplied via `UMAMI_SCRIPT_PATH`. It intercepts every request (including collection and outbound destinations), checks the payloads and verifies preview, blocked-tracker and delayed-tracker behavior without sending test data to Umami. It uses the same `PLAYWRIGHT_MODULE` / `CHROMIUM_EXECUTABLE` environment variables as the main browser QA.

## GitHub Pages deployment

The live job board is published at **https://go-careers.github.io/** through `.github/workflows/csv-site.yml`. The workflow runs validation on pushes and pull requests, then publishes successful default-branch builds when the Actions repository variable `ENABLE_CSV_SITE` is `true`. GitHub Pages uses **GitHub Actions** as its source, and the `github-pages` environment permits the default branch, `development-2`, to deploy.

The existing `gocareers.in` domain points to a separate Vercel site. Its DNS and deployment are unchanged. The stale custom-domain mapping was removed from GitHub Pages so this board is accessible at its own HTTPS address. Moving the custom domain to this board requires access to the domain's DNS or the existing Vercel project. The root `CNAME` file belongs to the older app and is not included in this build.

To release changes, review the verified listings and application links, then merge or push to `development-2`. Real jobs must have `is_demo=false`; keep only the CSV header for an empty board. The **CSV job board** workflow can also be run manually on the default branch. Its daily schedule hides jobs outside the one-month window or past employer expiry and releases eligible future-dated jobs; it does not source new listings. Set `ENABLE_CSV_SITE` to `false` to pause future publishing without taking the existing deployment offline.

The daily jobs skill uses a separate research checkout. To publish a completed run, bring its CSV, evidence, run record, archives and company logos into `development-2` together. After Pages deploys, compare the first Recently added results with the newest run’s active IDs.

The deployment passes the Pages base URL into the generator for canonical links and a sitemap, including project-site subpaths. Root and job assets use relative paths. Custom domains are managed in Pages settings; the old root `CNAME` is not copied automatically.

For another static host:

```sh
SITE_URL=https://your-domain.example npm run build -- --production
```

Upload `dist/` and configure the host to serve directory index pages and `404.html`. There is no SPA fallback. `SITE_URL` is optional locally; use the final HTTPS URL in production so canonical links and the sitemap are generated. GitHub's [custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) explains the hosting setup.

## Structure and limitations

- `data/jobs.csv`: the source of job listings.
- `data/company-funding.json`: eligibility decisions, funding stages, research dates and sources.
- `data/company-linkedin.json`: researched LinkedIn company IDs and source pages for employee, recruiter and first-degree connection searches. Add a verified mapping for each new employer; the coverage test catches omissions. IDs come from the company's public employee-search link, not guessed company-name matches.
- `data/job-sources.json`: source links and verification records for the imported jobs; update these when refreshing the feed.
- `data/source-search.json`: cross-source search coverage, retrieval limits and rejected leads.
- `scripts/jobs.mjs`: CSV parsing and validation.
- `scripts/build.mjs`: static HTML generation and expiry filtering.
- `site/`: browser JavaScript, CSS, and favicon.
- `tests/`: Node tests and optional browser QA.
- `dist/`: generated, ignored output; do not edit by hand.
- The older React/Vite files in `src/`, `redux/`, `public/`, and the root Vite/TypeScript configuration remain as migration references. The new npm scripts do not use them. Git history and the original checkout also preserve the old app.

Search matches words across titles, companies, locations, and skills. Filters combine, and experience matches overlapping ranges. Jobs without any numeric experience requirement appear with no experience filter selected, and are excluded when a numeric range is selected. Filter state is stored in the URL. Twenty results appear per page with JavaScript; all active jobs remain readable without it. This approach suits a modest feed (hundreds or a few thousand jobs); a very large catalogue would need a different search strategy.

Expiry is applied at build time and rechecked in open browser tabs every minute. With JavaScript disabled, expiry changes require the next build. GitHub scheduled workflows can be delayed and can be disabled after repository inactivity; check Actions if listings appear stale. Already-open pages cannot receive changed CSV content until refreshed after deployment.

Optional browser checks use an existing Playwright installation, with the preview server running:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/browser.mjs
```

Set `CHROMIUM_EXECUTABLE` if the installed browser is outside Playwright's default cache. Optionally set `AXE_MODULE` to an installed `@axe-core/playwright/dist/index.js` for accessibility checks. Screenshots go into ignored `.artifacts/`.

Browser QA includes narrow phone and tablet layouts, unclipped default filter labels, single-line header navigation, the active saved-jobs state and keyboard focus during background updates. Filters collapse at 900px and below, with a single column on phones up to 480px. CSS and JavaScript asset URLs include content hashes so new releases load the matching assets; an already-open page still needs a refresh to load updated HTML.

Job cards show the role, company logo/name, location, work style and known experience, plus available pay labeled Expected salary. Cards show the first Go Careers import date in India time when it is known. Skills and employer posting dates live on detail pages; funding evidence, verification dates and salary research stay in the repository. Full-time and unknown-value placeholders are omitted from cards; internships remain identifiable in the title or metadata. Skill search and all filters still use the complete CSV data.

The interface uses the original yellow branding, readable job rows and larger controls. A sticky desktop sidebar includes company, location, work style, job type and experience filters. Quick searches combine with existing filters, and removable chips show the current selection. Filters collapse on mobile with a “Show results” action. Pagination shows 20 jobs per page with a page selector, and long pages offer a back-to-top button. Job links preserve search, filters, sort, saved view and page in a return query, so “Back to your results” restores the same view. Shared job links omit that return query. The application action appears at the top of the desktop details panel and stays within reach at the bottom of mobile screens.

Bookmark buttons on cards and detail pages build a Saved jobs shortlist without an account. Job IDs are stored in this browser's localStorage (`go-careers:saved:v1`) and synchronized across tabs; clearing site data removes the shortlist. Only active jobs appear in the saved view. When storage is unavailable, saving works in memory for the current page visit. With JavaScript disabled, all current job cards and detail pages remain available, while interactive controls stay hidden.

On a job detail page, **Mark as applied** records the role, company and time in this browser. **Applications** shows the history newest first, with dates in India time. Each record has its own storage key so different tabs can update different jobs independently. Records stay visible when jobs leave the feed, and candidates can remove them. Clearing site data clears the tracker. Opening an employer application link leaves the history unchanged.

Run `node tests/applications-browser.mjs` for tracker regression checks with the same Playwright environment as the main browser suite. Set `BROWSER=firefox` or `BROWSER=webkit` to select another installed engine. The tests rebuild a fixture board to exercise listing removal and use isolated browser storage.

Job detail pages include three LinkedIn shortcuts beneath the skills: employees, recruiters/talent acquisition, and the visitor's first-degree connections at that company. All use a verified `currentCompany` ID; only the connections link adds `network=["F"]`. Recruiters are a keyword search within that company, so relevance depends on LinkedIn profiles. The links open LinkedIn in a new tab and use the visitor's own signed-in account. Go Careers does not access or store their connections or send messages. Signed-in result availability is controlled by LinkedIn and is not verified by the local URL/layout tests.
