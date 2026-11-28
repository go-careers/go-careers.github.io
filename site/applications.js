(() => {
  const mark = document.getElementById('mark-applied');
  const list = document.getElementById('applications-list');
  if (!mark && !list) return;

  const prefix = 'go-careers:applied:v1:';
  const feedback = document.getElementById('tracker-feedback');
  const empty = document.getElementById('tracker-empty');
  const listedThrough = list ? JSON.parse(list.dataset.listedThrough) : {};
  const dateLabel = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' });
  const calendar = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Kolkata' });
  let renderedDay;

  function read(id) {
    const raw = localStorage.getItem(prefix + id);
    if (!raw) return null;
    try {
      const record = JSON.parse(raw);
      if (typeof record?.title === 'string' && typeof record.company === 'string' &&
          typeof record.appliedAt === 'string' && Number.isFinite(Date.parse(record.appliedAt))) {
        return { id, title: record.title, company: record.company, appliedAt: record.appliedAt };
      }
    } catch { /* Skip a damaged entry without losing the rest of the history. */ }
    return null;
  }

  function renderHistory() {
    const records = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      const id = key.slice(prefix.length);
      if (!/^[a-z0-9-]{1,100}$/.test(id)) continue;
      const record = read(id);
      if (record) records.push(record);
    }
    records.sort((a, b) => Date.parse(b.appliedAt) - Date.parse(a.appliedAt) || a.id.localeCompare(b.id));
    renderedDay = calendar.format(new Date());
    const template = document.getElementById('application-row');
    const fragment = document.createDocumentFragment();
    for (const record of records) {
      const row = template.content.firstElementChild.cloneNode(true);
      const title = row.querySelector('h2');
      if (Object.hasOwn(listedThrough, record.id) && listedThrough[record.id] >= renderedDay) {
        const link = document.createElement('a');
        link.href = '../jobs/' + record.id + '/';
        link.textContent = record.title;
        title.append(link);
      } else {
        title.textContent = record.title;
        row.querySelector('.unlisted').hidden = false;
      }
      row.querySelector('.company-name').textContent = record.company;
      const time = row.querySelector('time');
      time.dateTime = record.appliedAt;
      time.textContent = dateLabel.format(new Date(record.appliedAt));
      const remove = row.querySelector('button');
      remove.dataset.removeId = record.id;
      remove.setAttribute('aria-label', 'Remove ' + record.title + ' at ' + record.company + ' from applications');
      fragment.append(row);
    }
    list.replaceChildren(fragment);
    empty.hidden = records.length > 0;
    list.hidden = !empty.hidden;
  }

  function refresh() {
    try {
      if (mark) {
        const record = read(mark.dataset.id);
        mark.disabled = false;
        mark.hidden = false;
        mark.setAttribute('aria-pressed', String(!!record));
        mark.textContent = record ? 'Applied' : 'Mark as applied';
        feedback.textContent = record ? 'Marked as applied on ' + dateLabel.format(new Date(record.appliedAt)) + '.' : '';
      } else {
        const focused = document.activeElement?.dataset.removeId;
        renderHistory();
        if (focused) (list.querySelector(`[data-remove-id="${CSS.escape(focused)}"]`) ||
          list.querySelector('button') || empty.querySelector('a')).focus({preventScroll: true});
      }
    } catch {
      feedback.textContent = 'Allow browser storage to use the application tracker.';
      if (mark) { mark.hidden = false; mark.disabled = true; }
    }
  }

  mark?.addEventListener('click', () => {
    const { id, title, company } = mark.dataset;
    const removing = mark.getAttribute('aria-pressed') === 'true';
    try {
      if (removing) localStorage.removeItem(prefix + id);
      else if (!read(id)) localStorage.setItem(prefix + id, JSON.stringify({ title, company, appliedAt: new Date().toISOString() }));
    } catch {
      feedback.textContent = 'Could not save this change. Check your browser storage and try again.';
      return;
    }
    refresh();
    if (removing) feedback.textContent = 'Removed from applications.';
  });
  list?.addEventListener('click', event => {
    const button = event.target.closest('button[data-remove-id]');
    if (!button) return;
    try { localStorage.removeItem(prefix + button.dataset.removeId); }
    catch { feedback.textContent = 'Could not remove this application. Check your browser storage and try again.'; return; }
    refresh();
    feedback.textContent = 'Removed from applications.';
  });
  window.addEventListener('storage', event => {
    if (event.key === null || event.key.startsWith(prefix)) refresh();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
  if (list) setInterval(() => { if (calendar.format(new Date()) !== renderedDay) refresh(); }, 60000);
  refresh();
})();
