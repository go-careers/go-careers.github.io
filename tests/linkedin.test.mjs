import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { linkedinPeopleLinks } from '../scripts/linkedin.mjs';
import { readJobs } from '../scripts/jobs.mjs';

test('LinkedIn links restrict current company and only the connections link restricts network', () => {
  const links = linkedinPeopleLinks('10347848');
  for (const href of Object.values(links)) {
    const url = new URL(href);
    assert.equal(url.origin, 'https://www.linkedin.com');
    assert.equal(url.pathname, '/search/results/people/');
    assert.deepEqual(JSON.parse(url.searchParams.get('currentCompany')), ['10347848']);
  }
  assert.equal(new URL(links.people).searchParams.has('keywords'), false);
  assert.equal(new URL(links.people).searchParams.has('network'), false);
  assert.equal(new URL(links.recruiters).searchParams.has('network'), false);
  assert.equal(new URL(links.recruiters).searchParams.get('keywords'), 'recruiter OR "talent acquisition" OR "talent partner"');
  assert.deepEqual(JSON.parse(new URL(links.connections).searchParams.get('network')), ['F']);
  assert.equal(new URL(links.connections).searchParams.has('keywords'), false);
  for (const bad of ['', 'Example', '0', '-1', '12&network=O', null])
    assert.throws(() => linkedinPeopleLinks(bad), /verified numeric/);
});

test('each currently listed real employer has a unique researched LinkedIn company mapping', async () => {
  const data = JSON.parse(await readFile(new URL('../data/company-linkedin.json', import.meta.url), 'utf8'));
  const jobs = readJobs(await readFile(new URL('../data/jobs.csv', import.meta.url), 'utf8'));
  const map = new Map(data.companies.map(company => [company.company, company]));
  assert.equal(map.size, data.companies.length);
  assert.equal(new Set(data.companies.map(company => company.company_id)).size, data.companies.length);
  for (const name of new Set(jobs.filter(job => !job.is_demo).map(job => job.company))) {
    const company = map.get(name);
    assert.ok(company, `Missing LinkedIn mapping for ${name}`);
    assert.match(company.source_url, /^https:\/\/www\.linkedin\.com\/company\/[\w-]+\/?$/);
    assert.match(company.checked_at, /^\d{4}-\d{2}-\d{2}$/);
    assert.doesNotThrow(() => linkedinPeopleLinks(company.company_id));
  }
});
