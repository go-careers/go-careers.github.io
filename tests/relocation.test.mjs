import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { relocationListings } from '../scripts/relocation.mjs';
import { columns } from '../scripts/jobs.mjs';
import { build } from '../scripts/build.mjs';

const day = '2026-11-28';
const sample = {
  id: 'example-role', company: 'Example', title: 'Engineer <Data>', description: 'Build data tools.',
  city: 'Tokyo', country: 'JP', relocation_support: 'International moving allowance.', visa_support: 'Visa sponsorship available.',
  posted_date: '2026-10-28', verified_date: day, ingested_at: '2026-11-28T02:00:00Z',
  source_url: 'https://example.com/careers/engineer',
};

test('relocation requires an overseas destination, source and explicit support', () => {
  for (const change of [{country:'IN'}, {country:'ZZ'}, {country:'Tokyo'}, {relocation_support:' '},
    {visa_support:''}, {source_url:'javascript:void(0)'}, {source_url:'https://a:b@example.com'},
    {posted_date:'2026-02-30'}, {ingested_at:''}, {verified_date:'2025-01-01'}]) {
    assert.throws(() => relocationListings([{...sample, ...change}], day));
  }
  assert.throws(() => relocationListings([sample, sample], day), /duplicate/);
  assert.throws(() => relocationListings([sample, {...sample, id:'other'}], day), /duplicate/);
});

test('relocation uses the inclusive publication window, employer closing dates and first import order', () => {
  const later = {...sample, id:'later', source_url:'https://example.com/later', ingested_at:'2026-11-28T04:00:00Z'};
  assert.deepEqual(relocationListings([sample, later], day).map(job => job.id), ['later', 'example-role']);
  assert.equal(relocationListings([sample], '2026-11-29').length, 0);
  assert.equal(relocationListings([{...sample, expiry_date:'2026-11-27'}], day).length, 0);
  assert.equal(relocationListings([{...sample, expiry_date:day}], day).length, 1);
  assert.equal(relocationListings([sample], '2026-11-27').length, 0);
});

test('relocation is linked, readable without JavaScript and excluded from India totals', async t => {
  const output = await mkdtemp(join(tmpdir(), 'go-careers-relocation-'));
  t.after(() => rm(output, {recursive:true, force:true}));
  const options = {output, csv:columns.join(','), relocationJobs:[sample], today:day, siteURL:'https://example.com/board/'};
  assert.equal((await build(options)).active, 0);
  const read = path => readFile(join(output, path), 'utf8');
  assert.match(await read('index.html'), /href=".\/relocation\/"/);
  assert.doesNotMatch(await read('index.html'), /Engineer &lt;Data&gt;/);
  const page = await read('relocation/index.html');
  assert.match(page, /Engineer &lt;Data&gt;/);
  assert.match(page, /International moving allowance/);
  assert.match(page, /Tokyo, Japan/);
  assert.match(page, /href="https:\/\/example.com\/careers\/engineer"/);
  assert.match(await read('sitemap.xml'), /board\/relocation\//);
  await build({...options, today:'2026-11-29'});
  assert.match(await read('relocation/index.html'), /id="relocation-empty" class="empty-state">/);
  assert.doesNotMatch(await read('relocation/index.html'), /example.com\/careers\/engineer/);
  assert.doesNotMatch(await read('sitemap.xml'), /board\/relocation\//);
});
