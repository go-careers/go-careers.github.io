export const columns = [
  "id",
  "title",
  "company",
  "location",
  "work_mode",
  "employment_type",
  "experience_min",
  "experience_max",
  "skills",
  "salary",
  "apply_url",
  "posted_date",
  "expiry_date",
  "description",
  "is_demo",
];

// CSV with quoted commas, escaped quotes, CRLF, UTF-8 BOM, and multiline cells.
export function parseCSV(input) {
  const text = input.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [],
    field = "",
    quoted = false,
    closed = false;
  const cell = () => {
    row.push(field);
    field = "";
    closed = false;
  };
  const line = () => {
    cell();
    if (row.some((value) => value.trim())) rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
        closed = true;
      } else field += c;
    } else if (c === ",") cell();
    else if (c === "\r" || c === "\n") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      line();
    } else if (closed)
      throw new Error(
        "Invalid CSV: unexpected character after a closing quote.",
      );
    else if (c === '"') {
      if (field) throw new Error("Invalid CSV: quote inside an unquoted cell.");
      quoted = true;
    } else field += c;
  }
  if (quoted) throw new Error("Invalid CSV: unclosed quoted cell.");
  if (field || row.length || closed) line();
  return rows;
}

export function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function readJobs(csv) {
  const [rawHeaders, ...rows] = parseCSV(csv);
  if (!rawHeaders) throw new Error("CSV is empty. Include the header row.");
  const headers = rawHeaders.map((s) => s.trim());
  if (new Set(headers).size !== headers.length)
    throw new Error("CSV contains duplicate column names.");
  const missing = columns.filter((c) => !headers.includes(c));
  const unknown = headers.filter((c) => !columns.includes(c));
  if (missing.length || unknown.length)
    throw new Error(
      `CSV columns: missing [${missing.join(", ")}]; unknown [${unknown.join(", ")}].`,
    );
  const ids = new Set(),
    errors = [];
  const jobs = rows.map((row, index) => {
    const fail = (message) => errors.push(`Row ${index + 2}: ${message}`);
    if (row.length !== headers.length)
      fail(
        `expected ${headers.length} cells, got ${row.length}. Quote cells containing commas.`,
      );
    const job = Object.fromEntries(
      headers.map((key, i) => [key, (row[i] || "").trim()]),
    );
    for (const key of [
      "id",
      "title",
      "company",
      "location",
      "work_mode",
      "employment_type",
      "posted_date",
      "description",
      "is_demo",
    ]) {
      if (!job[key]) fail(`${key} is required.`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(job.id) || job.id.length > 100)
      fail("id must be a URL-safe lowercase slug, at most 100 characters.");
    if (ids.has(job.id)) fail(`duplicate id "${job.id}".`);
    ids.add(job.id);
    if (!["Remote", "Hybrid", "On-site"].includes(job.work_mode))
      fail("work_mode must be Remote, Hybrid, or On-site.");
    if (
      !["Full-time", "Part-time", "Contract", "Internship"].includes(
        job.employment_type,
      )
    )
      fail("invalid employment_type.");
    for (const key of ["experience_min", "experience_max"]) {
      if (job[key] !== "" && (!/^\d+(\.\d+)?$/.test(job[key]) || Number(job[key]) > 60))
        fail(`${key} must be a number between 0 and 60.`);
    }
    if (job.experience_min !== "" && job.experience_max !== "" && Number(job.experience_min) > Number(job.experience_max))
      fail("experience_min exceeds experience_max.");
    if (!validDate(job.posted_date))
      fail("posted_date must be a real YYYY-MM-DD date.");
    if (job.expiry_date && !validDate(job.expiry_date))
      fail("expiry_date must be a real YYYY-MM-DD date.");
    if (job.expiry_date && job.expiry_date < job.posted_date)
      fail("expiry_date precedes posted_date.");
    if (!["true", "false"].includes(job.is_demo))
      fail("is_demo must be true or false.");
    if (!job.apply_url && job.is_demo !== "true")
      fail("apply_url is required for real jobs.");
    if (job.apply_url) {
      try {
        const url = new URL(job.apply_url);
        if (url.protocol !== "https:" || url.username || url.password)
          throw new Error();
      } catch {
        fail("apply_url must be an absolute HTTPS URL without credentials.");
      }
    }
    return {
      ...job,
      experience_min: job.experience_min === "" ? null : Number(job.experience_min),
      experience_max: job.experience_max === "" ? null : Number(job.experience_max),
      skills: job.skills
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
      is_demo: job.is_demo === "true",
    };
  });
  if (errors.length) throw new Error(errors.join("\n"));
  return jobs;
}

export function activeJobs(
  jobs,
  today = new Date().toISOString().slice(0, 10),
) {
  return jobs
    .filter(
      (job) =>
        job.posted_date <= today &&
        (!job.expiry_date || job.expiry_date >= today),
    )
    .sort(
      (a, b) =>
        b.posted_date.localeCompare(a.posted_date) || a.id.localeCompare(b.id),
    );
}

export const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
