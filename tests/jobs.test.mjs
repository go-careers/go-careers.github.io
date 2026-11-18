import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { columns, parseCSV, readJobs, activeJobs } from "../scripts/jobs.mjs";
import { build as buildSite } from "../scripts/build.mjs";

const companyAudit = { companies: [{ company: 'Example', eligible: true, stage: 'Seed', ownership: { status: 'private', independent: true, checked_at: '2026-11-16', sources: ['https://example.com/about'] } }] };
const build = options => buildSite({ companyAudit, ...options });

const row = {
  id: "frontend-1",
  title: "Frontend Engineer",
  company: "Example",
  location: "Bengaluru",
  work_mode: "Hybrid",
  employment_type: "Full-time",
  experience_min: "0",
  experience_max: "2",
  skills: "React|CSS",
  salary: "",
  apply_url: "https://example.com/careers/1",
  posted_date: "2026-11-01",
  expiry_date: "2026-11-30",
  description: "A useful role.",
  is_demo: "false",
  funding_stage: "Seed",
  funding_source_url: "https://example.com/seed",
  funding_checked_at: "2026-11-16",
};
const csv = (...rows) =>
  [
    columns.join(","),
    ...rows.map((r) =>
      columns
        .map((key) => `"${String(r[key] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\r\n");

test("CSV handles BOM, quoted commas, escaped quotes, newlines, CRLF and trailing empty cells", () => {
  assert.deepEqual(
    parseCSV('\uFEFFa,b,c\r\n"one, two","say ""hi""\nnext",\r\n'),
    [
      ["a", "b", "c"],
      ["one, two", 'say "hi"\nnext', ""],
    ],
  );
});
test("malformed CSV is rejected rather than silently changing data", () => {
  for (const text of ['"unfinished', 'a"b,c', '"closed"extra,c'])
    assert.throws(() => parseCSV(text), /Invalid CSV/);
});
test("headers, required values, row widths and duplicate IDs are validated", () => {
  assert.throws(() => readJobs(""), /empty/);
  assert.throws(() => readJobs("title,title"), /duplicate column/);
  assert.throws(() => readJobs("title\nHello"), /missing/);
  assert.throws(() => readJobs(csv(row, row)), /duplicate id/);
  assert.throws(
    () => readJobs(csv({ ...row, title: "" })),
    /title is required/,
  );
  assert.throws(() => readJobs(csv(row) + ",extra"), /expected 18 cells/);
});
test("unsafe URLs, path IDs, dates and reversed experience ranges are rejected", () => {
  for (const apply_url of [
    "javascript:alert(1)",
    "http://example.com",
    "//example.com",
    "https://user:pass@example.com",
  ])
    assert.throws(() => readJobs(csv({ ...row, apply_url })), /HTTPS/);
  assert.throws(
    () => readJobs(csv({ ...row, apply_url: "" })),
    /apply_url is required/,
  );
  assert.throws(() => readJobs(csv({ ...row, id: "../escape" })), /URL-safe/);
  assert.throws(
    () => readJobs(csv({ ...row, posted_date: "2026-02-30" })),
    /real YYYY-MM-DD/,
  );
  assert.throws(
    () => readJobs(csv({ ...row, expiry_date: "2026-10-01" })),
    /precedes/,
  );
  assert.throws(
    () => readJobs(csv({ ...row, experience_min: 3, experience_max: 1 })),
    /exceeds/,
  );
  assert.throws(
    () => readJobs(csv({ ...row, experience_min: "NaN" })),
    /number/,
  );
});
test("expiry is inclusive through its India date; future listings remain hidden", () => {
  const jobs = readJobs(
    csv(
      row,
      { ...row, id: "expired", expiry_date: "2026-11-15" },
      { ...row, id: "today", expiry_date: "2026-11-16" },
      { ...row, id: "future", posted_date: "2026-11-17" },
    ),
  );
  assert.deepEqual(
    activeJobs(jobs, "2026-11-16").map((j) => j.id),
    ["frontend-1", "today"],
  );
});
test("undated jobs retain their evidence but are excluded from the recent feed", async () => {
  const unknown = {...row,posted_date:'',work_mode:'Not specified'};
  assert.throws(() => readJobs(csv(unknown)), /requires verified_date/);
  const [header,line] = csv(unknown).split('\r\n');
  const source = `${header},verified_date\r\n${line},2026-11-16`;
  const jobs = readJobs(source);
  assert.equal(jobs[0].posted_date, '');
  assert.equal(activeJobs(jobs,'2026-11-16').length,0);
  const output = await mkdtemp(join(tmpdir(),'gocareers-undated-'));
  try {
    await build({output,csv:source,today:'2026-11-16'});
    await assert.rejects(readFile(join(output,'jobs/frontend-1/index.html'),'utf8'), {code:'ENOENT'});
    assert.doesNotMatch(await readFile(join(output,'index.html'),'utf8'), /class="job-card"/);
  } finally { await rm(output,{recursive:true,force:true}); }
});
test("real builds create static detail pages, canonical URLs and sitemap while escaping CSV content", async () => {
  const output = await mkdtemp(join(tmpdir(), "gocareers-test-"));
  try {
    const dangerous = '<img src=x onerror=alert(1)> & "quote"';
    const result = await build({
      output,
      csv: csv({
        ...row,
        title: dangerous,
        description: "First paragraph.\n\n" + dangerous,
      }),
      today: "2026-11-16",
      production: true,
      siteURL: "https://example.com/jobs-board/",
    });
    assert.equal(result.active, 1);
    const html = await readFile(
      join(output, "jobs/frontend-1/index.html"),
      "utf8",
    );
    assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt;"));
    assert.ok(!html.includes("<img src=x"));
    assert.match(html, /href="\.\.\/\.\.\/assets\/styles\.css\?v=[a-f0-9]{12}"/);
    assert.ok(html.includes("https://example.com/jobs-board/jobs/frontend-1/"));
    assert.ok(html.includes('id="apply-link"'));
    assert.ok(!html.includes("noindex"));
    assert.match(
      await readFile(join(output, "sitemap.xml"), "utf8"),
      /jobs-board\/jobs\/frontend-1/,
    );
    assert.match(
      await readFile(join(output, "robots.txt"), "utf8"),
      /Sitemap:/,
    );
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
test("search destinations and breadcrumbs follow the live feed on project subpaths", async (t) => {
  const output = await mkdtemp(join(tmpdir(), "gocareers-discovery-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  const base = "https://example.com/board/";
  const ai = { ...row, id: "ml", title: "Applied Scientist", location: "Bangalore / Gurugram", expiry_date: "2026-11-16",
    description: "Develop language models.\n\nReview </script> markers and evaluation results." };
  const remote = { ...row, id: "remote", title: "Platform Engineer", location: "India", work_mode: "Remote", skills: "AI|Python" };
  const source = csv(ai, remote, { ...row, id: "old", posted_date: "2026-10-15" });
  const page = path => readFile(join(output, path, "index.html"), "utf8");
  const graph = html => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
  await build({ output, csv: source, today: "2026-11-16", production: true, siteURL: base });
  const home = await page("");
  assert.ok(graph(home).some(item => item["@type"] === "WebSite" && item.url === base));
  const aiPath = "browse/ai-ml-jobs-india/";
  const remotePath = "browse/remote-startup-jobs-india/";
  assert.ok(home.includes(`href="${aiPath}"`));
  const sitemap = await readFile(join(output, "sitemap.xml"), "utf8");
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(new Set(paths), new Set(["", aiPath, remotePath, "browse/startup-jobs-bengaluru/", "browse/startup-jobs-delhi-ncr/", "about/", "jobs/ml/", "jobs/remote/"].map(path => base + path)));
  assert.equal(paths.length, new Set(paths).size);
  const collection = await page(aiPath);
  assert.ok(collection.includes('href="../../jobs/ml/"'));
  assert.ok(!collection.includes('href="../../jobs/remote/"'));
  assert.ok(!(await page(remotePath)).includes('href="../../jobs/ml/"'));
  const detail = await page("jobs/ml/");
  const [webPage, breadcrumb] = graph(detail);
  assert.equal(webPage["@type"], "WebPage");
  assert.equal(webPage.relatedLink, ai.apply_url);
  assert.ok(webPage.description.includes("</script>"));
  assert.equal(breadcrumb["@id"], webPage.breadcrumb["@id"]);
  assert.deepEqual(breadcrumb.itemListElement.map(item => item.item), [base, base + aiPath, base + "jobs/ml/"]);
  assert.match(await page("jobs/remote/"), /<title>Platform Engineer at Example \| Remote in India \| Go Careers<\/title>/);
  for (const path of paths) {
    const html = await page(path.slice(base.length));
    assert.ok(html.includes(`rel="canonical" href="${path}"`));
    assert.ok(html.includes(`property="og:image" content="${base}assets/logo.jpg"`));
    assert.doesNotMatch(html, /noindex|JobPosting/);
  }
  const missing = await readFile(join(output, "404.html"), "utf8");
  assert.match(missing, /noindex, follow/);
  assert.doesNotMatch(missing, /rel="canonical"/);
  await build({ output, csv: source, today: "2026-11-17", production: true, siteURL: base });
  await assert.rejects(page(aiPath), { code: "ENOENT" });
  await assert.rejects(page("jobs/ml/"), { code: "ENOENT" });
  assert.doesNotMatch(await readFile(join(output, "sitemap.xml"), "utf8"), /ai-ml-jobs|jobs\/ml\/|delhi-ncr|bengaluru/);
  assert.ok((await page(remotePath)).includes('href="../../jobs/remote/"'));
});
test("demo builds disable application links and indexing; production refuses sample data", async () => {
  const output = await mkdtemp(join(tmpdir(), "gocareers-test-"));
  const data = csv({ ...row, is_demo: "true" });
  try {
    await build({ output, csv: data, today: "2026-11-16" });
    const html = await readFile(
      join(output, "jobs/frontend-1/index.html"),
      "utf8",
    );
    assert.ok(html.includes("noindex"));
    assert.ok(!html.includes('id="apply-link"'));
    await assert.rejects(
      build({ output, csv: data, production: true }),
      /demo jobs/,
    );
    await access(join(output, "index.html")); // failed validation preserves the previous output
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
test("rebuilding removes aged-out pages and sitemap entries even without employer expiry", async () => {
  const output = await mkdtemp(join(tmpdir(), "gocareers-window-build-"));
  const options = {output, csv:csv({...row, posted_date:'2026-10-16', expiry_date:''}), siteURL:'https://example.com/'};
  try {
    await build({...options, today:'2026-11-16'});
    const detail = await readFile(join(output,'jobs/frontend-1/index.html'),'utf8');
    assert.match(detail, /data-window-end="2026-11-16"/);
    await build({...options, today:'2026-11-17'});
    await assert.rejects(access(join(output,'jobs/frontend-1/index.html')));
    assert.doesNotMatch(await readFile(join(output,'sitemap.xml'),'utf8'), /frontend-1/);
    assert.doesNotMatch(await readFile(join(output,'index.html'),'utf8'), /class="job-card"/);
  } finally { await rm(output,{recursive:true,force:true}); }
});

test("empty feeds render gracefully; rebuilding removes expired pages", async () => {
  const output = await mkdtemp(join(tmpdir(), "gocareers-test-"));
  try {
    await build({ output, csv: csv(row), today: "2026-11-16" });
    await access(join(output, "jobs/frontend-1/index.html"));
    await build({ output, csv: csv(row), today: "2026-12-01" });
    await assert.rejects(access(join(output, "jobs/frontend-1/index.html")));
    assert.match(
      await readFile(join(output, "index.html"), "utf8"),
      /no open roles/,
    );
    assert.deepEqual(await build({ output, csv: csv(), today: "2026-11-16" }), {
      total: 0,
      active: 0,
    });
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test('unspecified and open-ended experience is preserved without invented limits', async () => {
  const jobs = readJobs(csv({ ...row, experience_min: '', experience_max: '' }, { ...row, id: 'minimum', experience_min: '5', experience_max: '' }, { ...row, id: 'maximum', experience_min: '', experience_max: '2' }));
  assert.equal(jobs[0].experience_min, null);
  assert.equal(jobs[0].experience_max, null);
  assert.equal(jobs[1].experience_min, 5);
  assert.equal(jobs[1].experience_max, null);
  const output = await mkdtemp(join(tmpdir(), 'gocareers-test-'));
  try {
    await build({ output, csv: csv({ ...row, experience_min: '5', experience_max: '' }), today: '2026-11-16' });
    const html = await readFile(join(output, 'index.html'), 'utf8');
    assert.match(html, /5\+ years/);
    assert.match(html, /data-min="5" data-max=""/);
  } finally { await rm(output, { recursive: true, force: true }); }
});

test('private startup funding accepts later rounds and still requires evidence', () => {
  for (const funding_stage of ['Public', 'Acquired', 'Unknown', ''])
    assert.throws(() => readJobs(csv({ ...row, funding_stage })), /funding_stage/);
  for (const funding_stage of ['Bootstrapped', 'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Series F', 'Series L', 'Undisclosed'])
    assert.equal(readJobs(csv({ ...row, funding_stage }))[0].funding_stage, funding_stage);
  for (const funding_source_url of ['', 'javascript:alert(1)', 'https://user:pass@example.com'])
    assert.throws(() => readJobs(csv({ ...row, funding_source_url })), /funding_source_url/);
  assert.throws(() => readJobs(csv({ ...row, funding_checked_at: '2026-02-30' })), /funding_checked_at/);
});

test('build blocks public, acquired and unaudited employers before replacing output', async () => {
  const output = await mkdtemp(join(tmpdir(), 'gocareers-ownership-'));
  const good = companyAudit.companies[0];
  try {
    await build({output, csv: csv(row), today: '2026-11-16'});
    const before = await readFile(join(output, 'index.html'), 'utf8');
    for (const companies of [
      [],
      [{...good, ownership: undefined}],
      [{...good, eligible: false}],
      [{...good, ownership: {...good.ownership, status: 'public'}}],
      [{...good, ownership: {...good.ownership, status: 'unknown'}}],
      [{...good, ownership: {...good.ownership, independent: false}}],
      [{...good, ownership: {...good.ownership, sources: []}}],
      [{...good, ownership: {...good.ownership, checked_at: '2026-02-30'}}],
      [{...good, ownership: {...good.ownership, sources: ['http://example.com']}}],
      [{...good, stage: 'Series D'}],
      [{...good, stage: 'Series B'}],
    ]) {
      await assert.rejects(build({output, csv: csv(row), companyAudit: {companies}, today: '2026-11-16'}), /privately held|ownership|funding stage/);
      assert.equal(await readFile(join(output, 'index.html'), 'utf8'), before);
    }
  } finally { await rm(output, {recursive: true, force: true}); }
});
