(() => {
  const byId = (id) => document.getElementById(id);
  const track = (name, data) => window.goCareersAnalytics?.track(name, data);
  const today = () => new Date().toISOString().slice(0, 10);
  const savedKey = 'go-careers:saved:v1';
  const decodeSaved = value => {
    try {
      const ids = JSON.parse(value || '[]');
      return new Set(Array.isArray(ids) ? ids.filter(id => typeof id === 'string' && /^[a-z0-9-]{1,100}$/.test(id)).slice(0, 1000) : []);
    } catch { return new Set(); }
  };
  let saved = new Set(), storageAvailable = true, onSavedChange = () => {}, statusTimer;
  try { saved = decodeSaved(localStorage.getItem(savedKey)); }
  catch { storageAvailable = false; }
  const saveButtons = [...document.querySelectorAll('[data-save-id]')];
  function syncSavedButtons() {
    for (const button of saveButtons) {
      const selected = saved.has(button.dataset.saveId);
      button.hidden = false;
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${selected ? 'Unsave' : 'Save'} ${button.dataset.saveTitle}`);
      button.querySelector('.save-label').textContent = selected ? 'Saved job' : 'Save job';
    }
  }
  syncSavedButtons();
  document.querySelectorAll('.saved-nav').forEach(link => { link.hidden = false; });
  for (const button of saveButtons) button.addEventListener('click', () => {
    const id = button.dataset.saveId;
    const removing = saved.has(id);
    if (removing) saved.delete(id); else saved.add(id);
    try { localStorage.setItem(savedKey, JSON.stringify([...saved])); storageAvailable = true; }
    catch { storageAvailable = false; }
    syncSavedButtons();
    onSavedChange();
    if (!removing) track('job_saved', { job_id: id });
    const card = button.closest('.job-card');
    if (card) {
      const nextFocus = card.hidden ? document.querySelector('.job-card:not([hidden]) [data-save-id]') || byId('saved-view') : button;
      nextFocus.focus({preventScroll: true});
    }
    clearTimeout(statusTimer);
    byId('save-status').textContent = removing ? 'Job removed from saved jobs.' : storageAvailable ? 'Job saved on this browser.' : 'Saved for this visit. Browser storage is unavailable.';
    statusTimer = setTimeout(() => { byId('save-status').textContent = ''; }, 4500);
  });
  window.addEventListener('storage', event => {
    if (event.key !== savedKey && event.key !== null) return;
    saved = decodeSaved(event.newValue);
    syncSavedButtons();
    onSavedChange();
  });
  const backTop = byId('back-top');
  const syncBackTop = () => { backTop.hidden = scrollY < 900; };
  window.addEventListener('scroll', syncBackTop, {passive: true});
  syncBackTop();
  backTop.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: 'auto'});
    (byId('search') || document.querySelector('.back-link'))?.focus({preventScroll: true});
  });
  const share = byId("share");
  if (share) {
    share.hidden = false;
    share.addEventListener("click", async () => {
      const sharedURL = new URL(location.href);
      sharedURL.searchParams.delete('return');
      try {
        await navigator.clipboard.writeText(sharedURL.href);
        byId("share-status").textContent = "Job link copied.";
      } catch {
        byId("share-status").textContent = `Copy this link: ${sharedURL.href}`;
      }
    });
  }
  const detail = document.querySelector(".detail-page");
  if (detail) {
    const returnQuery = new URLSearchParams(location.search).get("return");
    if (returnQuery?.startsWith("?")) {
      const back = detail.querySelector(".back-link");
      const url = new URL(back.href);
      url.search = returnQuery;
      back.href = url.href;
      back.textContent = "← Back to your results";
    }
  }
  const checkDetail = () => {
    if (detail?.dataset.expiry && detail.dataset.expiry < today()) {
      byId("closed-notice").hidden = false;
      byId("apply-link")?.remove();
    }
  };
  checkDetail();
  byId('apply-link')?.addEventListener('click', () => track('apply_click'));
  const list = byId("job-list");
  if (!list) {
    if (detail) setInterval(checkDetail, 60000);
    return;
  }
  const cards = [...list.querySelectorAll(".job-card")];
  const cardPlaces = new Map(cards.map(card => [card, JSON.parse(card.dataset.locations)]));
  const matchesLocation = (card, value) => !value || cardPlaces.get(card).includes(value) || card.dataset.location === value;
  const controls = {
    q: byId("search"),
    company: byId("company"),
    location: byId("location"),
    mode: byId("mode"),
    type: byId("type"),
    experience: byId("experience"),
    sort: byId("sort"),
  };
  const pageSize = 20;
  let page = 1;
  let savedOnly = false;
  const narrow = matchMedia("(max-width: 900px)");
  const filterToggle = byId("filter-toggle");
  function syncFilterPanel() {
    byId("filters").hidden = narrow.matches && filterToggle.getAttribute("aria-expanded") !== "true";
    byId("filter-toggle-bar").hidden = !narrow.matches;
  }
  filterToggle.addEventListener("click", () => {
    filterToggle.setAttribute("aria-expanded", String(filterToggle.getAttribute("aria-expanded") !== "true"));
    syncFilterPanel();
  });
  narrow.addEventListener("change", syncFilterPanel);
  byId('filters-done').addEventListener('click', () => {
    filterToggle.setAttribute('aria-expanded', 'false');
    syncFilterPanel();
    filterToggle.focus({preventScroll: true});
    byId('view-bar').scrollIntoView({block: 'start'});
  });
  const active = (card) =>
    card.dataset.posted <= today() &&
    (!card.dataset.expiry || card.dataset.expiry >= today());
  function readURL() {
    const params = new URLSearchParams(location.search);
    savedOnly = params.get('saved') === '1';
    for (const [key, input] of Object.entries(controls)) {
      let value = params.get(key) || (key === "sort" ? "newest" : "");
      if (key === 'location' && value && ![...input.options].some(option => option.value === value)) {
        // Keep old shared URLs working, including exact multi-city selections.
        const alias = value.toLowerCase().replace(/,\s*india$/i, '').trim();
        const canonical = [...input.options].find(option => JSON.parse(option.dataset.aliases || '[]').includes(alias));
        if (canonical) value = canonical.value;
        else if (cards.some(card => card.dataset.location === value)) {
          const legacy = new Option(value, value);
          legacy.dataset.label = value;
          legacy.hidden = true;
          input.append(legacy);
        }
      }
      input.value =
        input.tagName === "SELECT" &&
        ![...input.options].some((option) => option.value === value)
          ? key === "sort"
            ? "newest"
            : ""
          : value;
    }
    page = Math.max(1, Number.parseInt(params.get("page"), 10) || 1);
  }
  function writeURL() {
    const url = new URL(location.href);
    for (const [key, input] of Object.entries(controls)) {
      const value = input.value.trim();
      if (value && !(key === "sort" && value === "newest"))
        url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (page > 1) url.searchParams.set("page", String(page));
    else url.searchParams.delete("page");
    if (savedOnly) url.searchParams.set('saved', '1');
    else url.searchParams.delete('saved');
    history.replaceState(null, "", url);
  }
  function render(updateURL = true) {
    const focusedCardControl = list.contains(document.activeElement) ? document.activeElement : null;
    const tokens = controls.q.value
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const range = controls.experience.value
      ? controls.experience.value.split("-").map(Number)
      : null;
    const candidates = cards
      .filter((card) => {
        const d = card.dataset;
        return (
          active(card) &&
          (!savedOnly || saved.has(d.id)) &&
          tokens.every((token) => d.search.includes(token)) &&
          (!controls.company.value || controls.company.value === d.company) &&
          (!controls.mode.value || controls.mode.value === d.mode) &&
          (!controls.type.value || controls.type.value === d.type) &&
          (!range ||
            ((d.min !== "" || d.max !== "") &&
              (d.min === "" ? 0 : Number(d.min)) <= (range[1] ?? range[0]) &&
              (d.max === "" ? Infinity : Number(d.max)) >= range[0]))
        );
      });
    // Count locations within the other selected filters, not just the current city.
    for (const option of controls.location.options) {
      const count = candidates.filter(card => matchesLocation(card, option.value)).length;
      option.textContent = `${option.dataset.label} (${count})`;
      option.disabled = !!option.value && count === 0 && option.value !== controls.location.value;
    }
    const filtered = candidates.filter(card => matchesLocation(card, controls.location.value))
      .sort(
        (a, b) =>
          Number(!a.dataset.posted) - Number(!b.dataset.posted) ||
          (controls.sort.value === "oldest" ? 1 : -1) *
            a.dataset.posted.localeCompare(b.dataset.posted) ||
          a.dataset.id.localeCompare(b.dataset.id),
      );
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, pages);
    cards.forEach((card) => {
      card.hidden = true;
    });
    filtered.forEach((card, index) => {
      list.append(card);
      card.hidden = index < (page - 1) * pageSize || index >= page * pageSize;
    });
    if (focusedCardControl && !focusedCardControl.closest('.job-card').hidden) focusedCardControl.focus({preventScroll: true});
    const start = filtered.length ? (page - 1) * pageSize + 1 : 0;
    byId("result-count").textContent = filtered.length
      ? `Showing ${start}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length} opportunities`
      : "0 opportunities";
    const savedCount = cards.filter(card => active(card) && saved.has(card.dataset.id)).length;
    byId('saved-count').textContent = savedCount;
    byId('saved-view').setAttribute('aria-pressed', String(savedOnly));
    byId('all-view').setAttribute('aria-pressed', String(!savedOnly));
    for (const link of document.querySelectorAll('[data-nav-view]')) {
      const current = (link.dataset.navView === 'saved') === savedOnly;
      link.classList.toggle('nav-current', current);
      if (current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    byId('saved-hint').hidden = !savedOnly;
    byId('clear-search').hidden = !controls.q.value;
    byId('filters-done').textContent = `Show ${filtered.length} ${filtered.length === 1 ? 'result' : 'results'}`;
    byId('empty-title').textContent = savedOnly && !savedCount ? 'Your shortlist starts here' : 'No matching opportunities';
    byId('empty-description').textContent = savedOnly && !savedCount
      ? 'Save roles you like using the bookmark button. Your open saved jobs will appear here.'
      : savedOnly ? 'No saved jobs match these filters. Try clearing a filter.' : cards.filter(active).length ? 'Try another keyword or remove a filter to see more roles.' : 'There are no open roles listed right now. Check back soon.';
    byId('empty-browse').hidden = !savedOnly;
    byId("empty-state").hidden = filtered.length > 0;
    byId("empty-reset").hidden = !Object.entries(controls).some(
      ([key, input]) => key !== "sort" && input.value,
    );
    byId("pagination").hidden = pages <= 1;
    byId("previous").disabled = page <= 1;
    byId("next").disabled = page >= pages;
    byId("page-label").textContent = `Page ${page} of ${pages}`;
    const pageSelect = byId("page-select");
    if (pageSelect.options.length !== pages) {
      pageSelect.replaceChildren(...Array.from({ length: pages }, (_, i) => new Option(String(i + 1), String(i + 1))));
    }
    pageSelect.value = String(page);
    const applied = Object.entries(controls).filter(([key, input]) => key !== "sort" && input.value.trim());
    const chips = byId("active-filters");
    // Preserve focused chips during the periodic expiry check.
    const signature = JSON.stringify(applied.map(([key, input]) => [key, input.value]));
    if (chips.dataset.signature !== signature) {
      chips.replaceChildren(...applied.map(([key, input]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-chip";
        const label = key === "q" ? `Search: ${input.value.trim()}` : input.selectedOptions[0].dataset.label || input.selectedOptions[0].textContent;
        button.textContent = `${label} ×`;
        button.setAttribute("aria-label", `Remove ${label} filter`);
        button.addEventListener("click", () => {
          input.value = "";
          changed();
          (chips.querySelector("button") || controls.q).focus({ preventScroll: true });
        });
        return button;
      }));
      chips.dataset.signature = signature;
    }
    chips.hidden = !applied.length;
    byId("reset").disabled = !applied.length;
    const filterCount = applied.filter(([key]) => key !== "q").length;
    byId("filter-count").textContent = filterCount ? `(${filterCount})` : "";
    document.querySelectorAll("[data-quick]").forEach(button => {
      button.setAttribute("aria-pressed", String(controls[button.dataset.quick].value === button.dataset.value));
    });
    if (updateURL) writeURL();
    for (const link of list.querySelectorAll('a[href*="jobs/"]')) {
      const url = new URL(link.href);
      if (location.search) url.searchParams.set("return", location.search);
      else url.searchParams.delete("return");
      link.href = url.href;
    }
  }
  function changed() {
    page = 1;
    render();
  }
  function reset() {
    for (const [key, input] of Object.entries(controls))
      input.value = key === "sort" ? "newest" : "";
    changed();
  }
  function changeView(onlySaved) {
    savedOnly = onlySaved;
    changed();
  }
  onSavedChange = () => render();
  byId('saved-view').addEventListener('click', () => changeView(true));
  byId('all-view').addEventListener('click', () => changeView(false));
  byId('empty-browse').addEventListener('click', () => { savedOnly = false; reset(); byId('all-view').focus(); });
  byId('clear-search').addEventListener('click', () => { controls.q.value = ''; changed(); controls.q.focus(); });
  readURL();
  render(false);
  for (const id of ["search-form", "quick-searches", "sort-control", "view-bar"])
    byId(id).hidden = false;
  syncFilterPanel();
  controls.q.addEventListener("input", changed);
  for (const [key, input] of Object.entries(controls))
    if (key !== "q") input.addEventListener("change", changed);
  byId("search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    changed();
    byId("opportunities").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  });
  byId("reset").addEventListener("click", reset);
  byId("empty-reset").addEventListener("click", reset);
  document.querySelectorAll("[data-quick]").forEach((button) =>
    button.addEventListener("click", () => {
      const control = controls[button.dataset.quick];
      control.value = control.value === button.dataset.value ? "" : button.dataset.value;
      changed();
    }),
  );
  function focusResults() {
    list.querySelector(".job-card:not([hidden]) h3 a")?.focus({ preventScroll: true });
    byId("opportunities").scrollIntoView();
  }
  byId("page-select").addEventListener("change", () => {
    page = Number(byId("page-select").value);
    render();
    focusResults();
  });
  for (const [id, delta] of [
    ["previous", -1],
    ["next", 1],
  ])
    byId(id).addEventListener("click", () => {
      page += delta;
      render();
      focusResults();
    });
  window.addEventListener("popstate", () => {
    readURL();
    render(false);
  });
  // Recheck expiry in long-lived tabs; the daily build also removes expired pages.
  setInterval(() => render(false), 60000);
})();
