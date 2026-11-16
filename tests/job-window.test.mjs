import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { indiaDate, windowStart, windowEnd, removalReason } from '../scripts/job-window.mjs';
import { activeJobs, columns, parseCSV } from '../scripts/jobs.mjs';
import { pruneJobs } from '../scripts/prune-jobs.mjs';

test('one month uses the India date and clamps month ends, including leap years', () => {
  assert.equal(indiaDate(new Date('2026-11-15T18:30:00Z')), '2026-11-16');
  assert.equal(indiaDate(new Date('2026-11-15T18:29:59Z')), '2026-11-15');
  for (const [today, expected] of [
    ['2026-11-16', '2026-10-16'], ['2026-01-31', '2025-12-31'],
    ['2026-03-31', '2026-02-28'], ['2024-03-31', '2024-02-29'],
    ['2026-05-31', '2026-04-30'],
  ]) assert.equal(windowStart(today), expected);
  assert.throws(() => windowStart('2026-02-30'), /real YYYY-MM-DD/);
});

test('cutoff is inclusive; re-verification never renews age; future and undated jobs stay hidden', () => {
  const jobs = [
    {id:'old', posted_date:'2026-10-15', verified_date:'2026-11-16'},
    {id:'edge', posted_date:'2026-10-16'},
    {id:'today', posted_date:'2026-11-16', expiry_date:'2026-11-16'},
    {id:'expired', posted_date:'2026-11-01', expiry_date:'2026-11-15'},
    {id:'future', posted_date:'2026-11-17'},
    {id:'unknown', posted_date:'', verified_date:'2026-11-16'},
  ];
  assert.deepEqual(activeJobs(jobs, '2026-11-16').map(job => job.id), ['today','edge']);
  assert.equal(removalReason(jobs[0], '2026-11-16'), 'older-than-one-month');
  assert.equal(removalReason(jobs[5], '2026-11-16'), 'posting-date-unknown');
});

test('browser expiry agrees with the rolling cutoff for every posting day across leap and non-leap years', () => {
  const next = day => new Date(Date.parse(day) + 86400000).toISOString().slice(0,10);
  for (const year of [2024, 2026]) {
    for (let posted = `${year}-01-01`; posted <= `${year}-12-31`; posted = next(posted)) {
      const end = windowEnd(posted);
      assert.ok(posted >= windowStart(end), `${posted} must remain visible through ${end}`);
      assert.ok(posted < windowStart(next(end)), `${posted} must expire after ${end}`);
    }
  }
});

test('pruning archives complete rows, preserves CSV values, previews safely and is idempotent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gocareers-prune-'));
  const csvPath = join(dir, 'jobs.csv'), archiveDir = join(dir, 'archive');
  const header = [...columns, 'verified_date'];
  const base = {company:'Example', title:'Engineer, AI', location:'India', work_mode:'Remote',
    employment_type:'Full-time', description:'Build "agents".\nSecond line.', is_demo:'false',
    funding_stage:'Seed', funding_source_url:'https://example.com/seed', funding_checked_at:'2026-11-16',
    apply_url:'https://example.com/apply', verified_date:'2026-11-16'};
  const rows = [
    {...base, id:'old', posted_date:'2026-10-15'},
    {...base, id:'boundary', posted_date:'2026-10-16'},
    {...base, id:'unknown', posted_date:''},
    {...base, id:'closed', posted_date:'2026-11-01', expiry_date:'2026-11-15'},
  ];
  const source = [header, ...rows.map(row => header.map(key => row[key] || ''))]
    .map(row => row.map(cell => `"${cell.replaceAll('"','""')}"`).join(',')).join('\r\n');
  const options = {csvPath, archiveDir, today:'2026-11-16'};
  try {
    await writeFile(csvPath, source);
    const preview = await pruneJobs({...options, dryRun:true});
    assert.equal(preview.removed.length, 3);
    assert.equal(await readFile(csvPath, 'utf8'), source);
    await assert.rejects(readdir(archiveDir), {code:'ENOENT'});
    const result = await pruneJobs(options);
    const archive = JSON.parse(await readFile(result.archive, 'utf8'));
    assert.equal(archive.records[0].job.description, base.description);
    assert.equal(archive.records[0].job.verified_date, '2026-11-16');
    assert.deepEqual(archive.records.map(record => record.reason), ['older-than-one-month','posting-date-unknown','employer-expired']);
    assert.deepEqual(parseCSV(await readFile(csvPath, 'utf8')), [header, header.map(key => rows[1][key] || '')]);
    const unchanged = await readFile(csvPath, 'utf8');
    assert.equal((await pruneJobs(options)).removed.length, 0);
    assert.equal(await readFile(csvPath, 'utf8'), unchanged);
    assert.equal((await readdir(archiveDir)).length, 1);
    assert.equal((await pruneJobs({...options, today:'2026-11-17'})).remaining, 0);
    assert.deepEqual(parseCSV(await readFile(csvPath, 'utf8')), [header]);
    await writeFile(csvPath, 'invalid CSV');
    await assert.rejects(pruneJobs(options));
    assert.equal(await readFile(csvPath, 'utf8'), 'invalid CSV');
    assert.equal((await readdir(archiveDir)).length, 2);
  } finally { await rm(dir, {recursive:true, force:true}); }
});
