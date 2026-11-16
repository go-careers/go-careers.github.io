// These are ordinary LinkedIn search links; results use the visitor's session.
export function linkedinPeopleLinks(companyId) {
  if (typeof companyId !== 'string' || !/^[1-9]\d*$/.test(companyId)) {
    throw new Error('LinkedIn company_id must be a verified numeric company ID.');
  }
  const search = (extra = {}) => {
    const url = new URL('https://www.linkedin.com/search/results/people/');
    url.searchParams.set('currentCompany', JSON.stringify([companyId]));
    for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);
    return url.href;
  };
  return {
    people: search(),
    recruiters: search({ keywords: 'recruiter OR "talent acquisition" OR "talent partner"' }),
    connections: search({ network: JSON.stringify(['F']) }),
  };
}
