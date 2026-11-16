import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseCSV, readJobs } from './jobs.mjs';
import { indiaDate, windowStart, removalReason } from './job-window.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const encodeCSV = rows => rows.map(row => row.map(value =>
  /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value,
).join(',')).join('\n') + '\n';

export async function pruneJobs({
  csvPath = join(root, 'data/jobs.csv'), archiveDir = join(root, 'data/job-archive'),
  today = indiaDate(), dryRun = false,
} = {}) {
  const cutoff = windowStart(today);
  const original = await readFile(csvPath, 'utf8');
  readJobs(original); // Fail before writing if the input is malformed.
  const [header, ...rows] = parseCSV(original);
  const removed = [], kept = [];
  for (const row of rows) {
    const job = Object.fromEntries(header.map((key, index) => [key, row[index]]));
    const reason = removalReason(job, today);
    if (reason) removed.push({ reason, job });
    else kept.push(row);
  }
  const report = { run_date: today, cutoff, before: rows.length, remaining: kept.length,
    removed: removed.map(({ reason, job }) => ({ id: job.id, reason })), dry_run: dryRun };
  if (dryRun || !removed.length) return report;
  const createdAt = new Date().toISOString();
  const name = `${createdAt.replaceAll(':', '-')}-${randomUUID().slice(0, 8)}.json`;
  await mkdir(archiveDir, { recursive: true });
  const archive = join(archiveDir, name);
  // Preserve raw rows (all columns) before replacing the feed. Source and salary
  // audits stay intact as historical evidence and for deduplication on later runs.
  await writeFile(archive, JSON.stringify({ created_at: createdAt, run_date: today,
    cutoff, policy: 'one-calendar-month', records: removed }, null, 2) + '\n', { flag: 'wx' });
  const temporary = join(dirname(csvPath), `.jobs-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, encodeCSV([header, ...kept]), { flag: 'wx' });
    if (await readFile(csvPath, 'utf8') !== original)
      throw new Error('CSV changed during pruning; rerun against the current feed. Archive retained.');
    await rename(temporary, csvPath);
  } finally { await rm(temporary, { force: true }); }
  return { ...report, archive };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--dry-run')) throw new Error('Usage: npm run jobs:prune -- [--dry-run]');
  console.log(JSON.stringify(await pruneJobs({ dryRun: args.includes('--dry-run') }), null, 2));
}
