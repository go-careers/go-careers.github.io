import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function ingestionTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return '';
  const date = new Date(value);
  const day = new Date(value.slice(0, 10));
  if (!Number.isFinite(+date) || !Number.isFinite(+day) || day.toISOString().slice(0, 10) !== value.slice(0, 10)) return '';
  return date.toISOString();
}

export async function readIngestionTimes(directory = fileURLToPath(new URL('../data/job-runs/', import.meta.url))) {
  const firstAdded = new Map();
  for (const file of await readdir(directory)) {
    if (!file.endsWith('.json')) continue;
    const run = JSON.parse(await readFile(join(directory, file), 'utf8'));
    if (!run.added_ids?.length) continue;
    const time = ingestionTime(run.ingested_at ?? run.finished_at ?? run.completed_at ?? run.started_at);
    if (!time) throw new Error(`Invalid ingestion timestamp in ${file}`);
    for (const id of run.added_ids) {
      if (!firstAdded.has(id) || time < firstAdded.get(id)) firstAdded.set(id, time);
    }
  }
  return firstAdded;
}
