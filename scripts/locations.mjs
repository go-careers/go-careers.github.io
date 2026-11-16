const cities = [
  ['bengaluru', 'Bengaluru', ['Bangalore', 'Bengaluru']],
  ['chennai', 'Chennai', ['Chennai', 'Madras']],
  ['delhi-ncr', 'Delhi NCR', ['Delhi', 'New Delhi', 'Delhi NCR', 'Delhi-NCR', 'NCR', 'Noida', 'Greater Noida', 'Gurgaon', 'Gurugram']],
  ['hyderabad', 'Hyderabad', ['Hyderabad', 'Secunderabad']],
  ['mumbai', 'Mumbai', ['Mumbai', 'Bombay', 'Navi Mumbai']],
  ['pune', 'Pune', ['Pune']],
];
const normalize = value => value.trim().toLowerCase().replace(/\s+/g, ' ');
const aliases = new Map(cities.flatMap(([id, , names]) => names.map(name => [normalize(name), id])));
const byId = new Map(cities.map(([id, label, names]) => [id, { id, label, aliases: names }]));

// Parse the employer's location without changing the location displayed on its card.
export function jobLocations(location, workMode) {
  const found = new Map();
  for (const group of location.split(/\s*[/;|]\s*|\s+or\s+/i)) {
    const parts = group.split(',').map(part => part.trim()).filter(Boolean);
    const known = parts.map(part => aliases.get(normalize(part))).filter(Boolean);
    for (const id of known) found.set(id, byId.get(id));
    const place = parts[0];
    if (!known.length && place && !/^(india|remote|anywhere in india|pan[- ]india)$/i.test(place)) {
      const id = 'place-' + normalize(place).replace(/[^\p{L}\p{N}]+/gu, '-');
      found.set(id, { id, label: place, aliases: [place] });
    }
  }
  if (!found.size) found.set('city-unspecified', { id: 'city-unspecified', label: 'City unspecified', aliases: ['India', 'Anywhere in India', 'Pan India'] });
  // Country-only locations must not be assumed to offer remote work.
  if (workMode === 'Remote') found.set('remote', { id: 'remote', label: 'Remote in India', aliases: ['Remote'] });
  return [...found.values()];
}

export function locationOptions(jobs) {
  const options = new Map();
  for (const job of jobs) for (const place of jobLocations(job.location, job.work_mode)) {
    if (!options.has(place.id)) options.set(place.id, { ...place, count: 0 });
    options.get(place.id).count++;
  }
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function locationSearchTerms(location, workMode) {
  return jobLocations(location, workMode).flatMap(place => place.aliases).join(' ');
}
