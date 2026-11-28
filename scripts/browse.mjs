import { jobLocations } from './locations.mjs';

// Keep a bounded set of useful destinations. Free-text searches and combinations
// of filters stay on the main board.
const topics = [
  ['ai-ml-jobs-india', 'AI and machine learning', 'AI and machine learning jobs in India', /\b(ai|artificial intelligence|gen[ -]?ai|ml|mlops|machine[ -]learning|deep learning|applied scientist|data scien(?:ce|tist)|computer vision|nlp|llms?)\b/i],
  ['backend-jobs-india', 'Backend engineering', 'Backend engineering jobs in India', /\bback[ -]?end\b/i],
  ['frontend-jobs-india', 'Frontend engineering', 'Frontend engineering jobs in India', /\bfront[ -]?end\b/i],
  ['full-stack-jobs-india', 'Full-stack engineering', 'Full-stack engineering jobs in India', /\bfull[ -]?stack\b/i],
  ['devops-sre-jobs-india', 'DevOps and SRE', 'DevOps and site reliability jobs in India', /\b(devops|sre|site reliability)\b/i],
];
const metros = new Set(['bengaluru', 'chennai', 'delhi-ncr', 'hyderabad', 'mumbai', 'pune']);

export function browseCollections(jobs, places) {
  const byLocation = new Map();
  for (const job of jobs) {
    for (const place of jobLocations(job.location, job.work_mode)) {
      if (!byLocation.has(place.id)) byLocation.set(place.id, []);
      byLocation.get(place.id).push(job);
    }
  }
  const collections = topics.map(([slug, label, heading, pattern]) => ({
    slug, label, heading, group: 'Role', roleFamily: true, jobs: jobs.filter(job => pattern.test(job.title)),
  }));
  collections.push({
    slug: 'engineering-internships-india', label: 'Engineering internships', heading: 'Startup engineering internships in India',
    group: 'Role', jobs: jobs.filter(job => job.employment_type === 'Internship'),
  }, {
    slug: 'remote-startup-jobs-india', label: 'Remote in India', heading: 'Remote startup tech jobs in India',
    group: 'Location', jobs: byLocation.get('remote') || [],
  });
  for (const place of places.filter(place => metros.has(place.id))) {
    collections.push({
      slug: 'startup-jobs-' + place.id, label: place.label, heading: 'Startup tech jobs in ' + place.label,
      group: 'Location', jobs: byLocation.get(place.id),
    });
  }
  return collections.filter(collection => collection.jobs.length > 0);
}
