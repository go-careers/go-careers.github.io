import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { columns, salaryColumns, readJobs } from '../scripts/jobs.mjs';
import { build as buildSite } from '../scripts/build.mjs';
const companyAudit = { companies: [{ company: 'Example', eligible: true, stage: 'Seed', ownership: { status: 'private', independent: true, checked_at: '2026-11-16', sources: ['https://example.com/about'] } }] };
const build = options => buildSite({ companyAudit, ...options });

const headers = [...columns, ...salaryColumns];
const fixture = { funding_stage:'Seed',funding_source_url:'https://example.com/seed',funding_checked_at:'2026-11-16', id:'salary-test', title:'Engineer',company:'Example',location:'India',work_mode:'Remote',employment_type:'Full-time',posted_date:'2026-11-01',description:'Role description.',is_demo:'false',apply_url:'https://example.com/apply',salary_benchmark:'₹20–30 LPA',salary_basis:'Total pay',salary_source_name:'Example reports',salary_source_url:'https://example.com/salaries',salary_note:'Related role only; <b>small sample</b>.',salary_checked_at:'2026-11-16' };
const csv = row => [headers.join(','),headers.map(key=>`"${String(row[key]??'').replaceAll('"','""')}"`).join(',')].join('\n');
test('benchmarks require evidence, pay basis and a valid research date',()=>{
  assert.equal(readJobs(csv(fixture))[0].salary,'');
  for(const key of salaryColumns.slice(1)) assert.throws(()=>readJobs(csv({...fixture,[key]:''})),/required/);
  for(const url of ['javascript:alert(1)','http://example.com','https://user:pass@example.com']) assert.throws(()=>readJobs(csv({...fixture,salary_source_url:url})),/HTTPS/);
  assert.throws(()=>readJobs(csv({...fixture,salary_basis:'CTC?'})),/salary_basis/);
  assert.throws(()=>readJobs(csv({...fixture,salary_checked_at:'2026-02-30'})),/real YYYY-MM-DD/);
  assert.throws(()=>readJobs(csv({...fixture,salary_benchmark:''})),/require salary_benchmark/);
});
test('expected compensation stays concise and identifies estimates without displaying research',async()=>{
  const output=await mkdtemp(join(tmpdir(),'gocareers-salary-'));
  try {
    await build({output,csv:csv(fixture),today:'2026-11-16'});
    const detail=await readFile(join(output,'jobs/salary-test/index.html'),'utf8');
    const index=await readFile(join(output,'index.html'),'utf8');
    assert.match(detail,/Expected compensation/);
    assert.match(detail,/₹20–30 LPA/);
    assert.match(detail,/Estimate · total pay/);
    assert.doesNotMatch(detail,/small sample|example.com\/salaries|Research checked|Not an employer offer/);
    assert.ok(detail.indexOf('Job brief') < detail.indexOf('Expected compensation'));
    assert.match(index,/Estimate · total pay/);
    assert.match(index,/salary-test\/#compensation/);
    const unavailable={...fixture,...Object.fromEntries(salaryColumns.map(key=>[key,''])),salary_note:'No comparable evidence found.',salary_checked_at:'2026-11-16'};
    await build({output,csv:csv(unavailable),today:'2026-11-16'});
    const unknown=await readFile(join(output,'jobs/salary-test/index.html'),'utf8');
    assert.match(unknown,/expected-compensation">Not disclosed/);
    assert.doesNotMatch(unknown,/No comparable evidence found|compensation-estimate/);
    assert.doesNotMatch(unknown,/benchmark-amount|₹20/);
  }finally{await rm(output,{recursive:true,force:true});}
});
