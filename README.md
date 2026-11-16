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

The feed contains 25 real India openings from JumpCloud, Mindtickle, Drivetrain, and Onehouse, checked on 16 November 2026 against their official Lever posting endpoints. Source URLs, source timestamps, and verification results are recorded in `data/job-sources.json`. Descriptions are short editorial summaries; application links lead to the employer’s full listing. Availability can change after verification.

`posted_date` uses the source board’s creation timestamp, rather than treating the verification date as a new posting date. No salary or closing date is invented. The production build still rejects any future test rows marked `is_demo=true`.

Edit `data/jobs.csv` in GitHub or a spreadsheet, preserving the column names. Export as UTF-8 CSV. Every row is a job. Keep IDs stable so existing links continue to work.

| Column | Format |
| --- | --- |
| `id` | Unique lowercase slug, e.g. `acme-frontend-001`; letters, digits, hyphens; up to 100 characters |
| `title`, `company`, `location` | Required text; use a consistent location name for filtering |
| `work_mode` | `Remote`, `Hybrid`, or `On-site` |
| `employment_type` | `Full-time`, `Part-time`, `Contract`, or `Internship` |
| `experience_min`, `experience_max` | Optional years, 0–60; decimals allowed. Both blank = unspecified; min only = N+ years; max only = up to N years. If both supplied, min must not exceed max |
| `skills` | Optional skills separated by `|`, e.g. `React|TypeScript|CSS` |
| `salary` | Optional display text, e.g. `₹12–18 LPA` |
| `apply_url` | Required HTTPS application URL for real jobs; no credentials in URLs |
| `posted_date` | Required valid date, `YYYY-MM-DD`; future listings stay hidden |
| `expiry_date` | Optional `YYYY-MM-DD`; visible through that date in UTC, hidden afterward |
| `description` | Required plain text; blank lines create paragraphs; HTML is displayed as text |
| `is_demo` | Required `false` for a real job, `true` for a fictional sample |

Quote CSV cells containing commas, quotes, or line breaks. Double embedded quotes (`""`). Common spreadsheet exports handle this automatically. Blank records are ignored. Duplicate IDs, unknown or missing columns, invalid dates, malformed rows, and unsafe application URLs stop the build with an error.

The CSV is public repository content. Keep only information intended for job seekers in it. The site never sends applications or collects candidate data; Apply opens the supplied URL.

## GitHub Pages deployment

The workflow in `.github/workflows/csv-site.yml` runs validation on pushes and pull requests. **Publishing is disabled by default** while the current live site uses a different codebase. No domain or live deployment has been changed.

When this version is ready to replace the site:

1. Review the verified listings and application links in the CSV. Real jobs must have `is_demo=false`; keep only the header for an empty board.
2. Review and merge this branch into the repository's default branch.
3. In GitHub repository Settings → Pages, choose **GitHub Actions** as the source. Retain or configure the intended domain there.
4. Add the Actions repository variable `ENABLE_CSV_SITE` with the value `true`.
5. Run the **CSV job board** workflow on the default branch. Subsequent pushes to that branch deploy automatically. The daily scheduled workflow removes expired jobs and releases future-dated jobs.

The deployment passes the Pages base URL into the generator for canonical links and a sitemap, including project-site subpaths. Root and job assets use relative paths. Custom domains are managed in Pages settings; the old root `CNAME` is not copied automatically.

For another static host:

```sh
SITE_URL=https://your-domain.example npm run build -- --production
```

Upload `dist/` and configure the host to serve directory index pages and `404.html`. There is no SPA fallback. `SITE_URL` is optional locally; use the final HTTPS URL in production so canonical links and the sitemap are generated. GitHub's [custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) explains the hosting setup.

## Structure and limitations

- `data/jobs.csv`: the source of job listings.
- `data/job-sources.json`: source links and verification records for the imported jobs; update these when refreshing the feed.
- `scripts/jobs.mjs`: CSV parsing and validation.
- `scripts/build.mjs`: static HTML generation and expiry filtering.
- `site/`: browser JavaScript, CSS, and favicon.
- `tests/`: Node tests and optional browser QA.
- `dist/`: generated, ignored output; do not edit by hand.
- The older React/Vite files in `src/`, `redux/`, `public/`, and the root Vite/TypeScript configuration remain as migration references. The new npm scripts do not use them. Git history and the original checkout also preserve the old app.

Search matches words across titles, companies, locations, and skills. Filters combine, and experience matches overlapping ranges. Jobs without any numeric experience requirement appear with no experience filter selected, and are excluded when a numeric range is selected. Filter state is stored in the URL. Six results appear per page with JavaScript; all active jobs remain readable without it. This approach suits a modest feed (hundreds or a few thousand jobs); a very large catalogue would need a different search strategy.

Expiry is applied at build time and rechecked in open browser tabs every minute. With JavaScript disabled, expiry changes require the next build. GitHub scheduled workflows can be delayed and can be disabled after repository inactivity; check Actions if listings appear stale. Already-open pages cannot receive changed CSV content until refreshed after deployment.

Optional browser checks use an existing Playwright installation, with the preview server running:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/browser.mjs
```

Set `CHROMIUM_EXECUTABLE` if the installed browser is outside Playwright's default cache. Optionally set `AXE_MODULE` to an installed `@axe-core/playwright/dist/index.js` for accessibility checks. Screenshots go into ignored `.artifacts/`.
