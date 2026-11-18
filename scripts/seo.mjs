import { escapeHTML as e } from './jobs.mjs';

export function jobPreview(job) {
  const location = job.location.replace(/,\s*India$/i, '');
  const place = job.work_mode === 'Remote' && /^India$|^Remote(?: in)? India$/i.test(location)
    ? 'Remote in India' : location;
  const titlePlace = /[,/;|]/.test(place) ? 'India' : place;
  const intro = [job.company, place, job.work_mode === 'Not specified' || place === 'Remote in India' ? '' : job.work_mode].filter(Boolean);
  const brief = job.description.split(/\r?\n\s*\r?\n/).filter(p => !p.startsWith('Summary of the employer’s listing.')).join(' ').replace(/\s+/g, ' ').trim();
  const summary = intro.join(' · ') + '. ' + brief;
  const description = summary.length > 165 ? summary.slice(0, 164).replace(/\s+\S*$/, '').replace(/[.,;:–-]+$/, '') + '…' : summary.trim();
  return { title: job.title + ' at ' + job.company + ' | ' + titlePlace + ' | Go Careers', description };
}

export function discoveryHead({ base, path, title, description, type = 'WebPage', crumbs = [], source, noindex }) {
  if (noindex || !base) return '<meta name="robots" content="noindex, follow">';
  const url = base + path;
  const image = base + 'assets/logo.jpg';
  const website = { '@id': base + '#website' };
  const publisher = { '@id': base + '#publisher' };
  const page = { '@type': type, '@id': url + '#page', url, name: title, description, inLanguage: 'en-IN', isPartOf: website };
  if (source) page.relatedLink = source;
  const graph = [page];
  if (!path) {
    graph.push({ '@type': 'WebSite', ...website, name: 'Go Careers', url: base, publisher },
      { '@type': 'Organization', ...publisher, name: 'Go Careers', url: base, logo: image });
  }
  if (crumbs.length) {
    page.breadcrumb = { '@id': url + '#breadcrumb' };
    graph.push({ '@type': 'BreadcrumbList', ...page.breadcrumb, itemListElement: crumbs.map(({ name, path }, index) => ({
      '@type': 'ListItem', position: index + 1, name, item: base + path,
    })) });
  }
  // Script raw text is not HTML-entity decoded. Escaping '<' keeps CSV text
  // containing an end tag inside the JSON string in every HTML parser.
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<link rel="canonical" href="${e(url)}"><meta property="og:url" content="${e(url)}"><meta property="og:site_name" content="Go Careers"><meta property="og:locale" content="en_IN"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><meta property="og:image" content="${e(image)}"><meta property="og:image:width" content="500"><meta property="og:image:height" content="500"><meta property="og:image:alt" content="Go Careers logo"><meta name="twitter:card" content="summary"><meta name="twitter:image:alt" content="Go Careers logo"><script type="application/ld+json">${json}</script>`;
}
