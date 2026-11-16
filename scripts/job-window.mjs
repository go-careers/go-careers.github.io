// One calendar month, inclusive, using the board's India calendar date.
export function indiaDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

function dateParts(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)
    throw new Error('Window date must be a real YYYY-MM-DD date.');
  return value.split('-').map(Number);
}
const iso = date => date.toISOString().slice(0, 10);

export function windowStart(today = indiaDate()) {
  const [year, month, day] = dateParts(today);
  const end = new Date(Date.UTC(year, month - 1, 0));
  return iso(new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), Math.min(day, end.getUTCDate()))));
}

// Last day on which subtracting one month still includes this posting.
// Month-end postings remain eligible through the next month's end.
export function windowEnd(posted) {
  const [year, month, day] = dateParts(posted);
  const thisEnd = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const nextEnd = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(year, month, day === thisEnd ? nextEnd : Math.min(day, nextEnd))));
}

export function removalReason(job, today = indiaDate()) {
  const cutoff = windowStart(today);
  if (!job.posted_date) return 'posting-date-unknown';
  dateParts(job.posted_date);
  if (job.posted_date < cutoff) return 'older-than-one-month';
  if (job.expiry_date && job.expiry_date < today) return 'employer-expired';
  return null;
}
