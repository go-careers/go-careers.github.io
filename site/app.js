(() => {
  const byId = (id) => document.getElementById(id);
  const today = () => new Date().toISOString().slice(0, 10);
  const share = byId("share");
  if (share) {
    share.hidden = false;
    share.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        byId("share-status").textContent = "Job link copied.";
      } catch {
        byId("share-status").textContent = `Copy this link: ${location.href}`;
      }
    });
  }
  const detail = document.querySelector(".detail-page");
  const checkDetail = () => {
    if (detail?.dataset.expiry && detail.dataset.expiry < today()) {
      byId("closed-notice").hidden = false;
      byId("apply-link")?.remove();
    }
  };
  checkDetail();
  const list = byId("job-list");
  if (!list) {
    if (detail) setInterval(checkDetail, 60000);
    return;
  }
  const cards = [...list.querySelectorAll(".job-card")];
  const controls = {
    q: byId("search"),
    location: byId("location"),
    mode: byId("mode"),
    type: byId("type"),
    experience: byId("experience"),
    sort: byId("sort"),
  };
  const pageSize = 6;
  let page = 1;
  const active = (card) =>
    card.dataset.posted <= today() &&
    (!card.dataset.expiry || card.dataset.expiry >= today());
  function readURL() {
    const params = new URLSearchParams(location.search);
    for (const [key, input] of Object.entries(controls)) {
      const value = params.get(key) || (key === "sort" ? "newest" : "");
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
    history.replaceState(null, "", url);
  }
  function render(updateURL = true) {
    const tokens = controls.q.value
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const range = controls.experience.value
      ? controls.experience.value.split("-").map(Number)
      : null;
    const filtered = cards
      .filter((card) => {
        const d = card.dataset;
        return (
          active(card) &&
          tokens.every((token) => d.search.includes(token)) &&
          (!controls.location.value ||
            controls.location.value === d.location) &&
          (!controls.mode.value || controls.mode.value === d.mode) &&
          (!controls.type.value || controls.type.value === d.type) &&
          (!range ||
            ((d.min !== "" || d.max !== "") &&
              (d.min === "" ? 0 : Number(d.min)) <= (range[1] ?? range[0]) &&
              (d.max === "" ? Infinity : Number(d.max)) >= range[0]))
        );
      })
      .sort(
        (a, b) =>
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
    const start = filtered.length ? (page - 1) * pageSize + 1 : 0;
    byId("result-count").textContent = filtered.length
      ? `Showing ${start}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length} opportunities`
      : "0 opportunities";
    byId("total-count").textContent = cards.filter(active).length;
    byId("empty-state").hidden = filtered.length > 0;
    byId("empty-reset").hidden = !Object.entries(controls).some(
      ([key, input]) => key !== "sort" && input.value,
    );
    byId("pagination").hidden = pages <= 1;
    byId("previous").disabled = page <= 1;
    byId("next").disabled = page >= pages;
    byId("page-label").textContent = `Page ${page} of ${pages}`;
    if (updateURL) writeURL();
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
  readURL();
  render(false);
  for (const id of ["search-form", "filters", "sort-control"])
    byId(id).hidden = false;
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
  document.querySelectorAll("[data-query]").forEach((button) =>
    button.addEventListener("click", () => {
      reset();
      controls.q.value = button.dataset.query;
      changed();
    }),
  );
  for (const [id, delta] of [
    ["previous", -1],
    ["next", 1],
  ])
    byId(id).addEventListener("click", () => {
      page += delta;
      render();
      list
        .querySelector(".job-card:not([hidden]) h3 a")
        ?.focus({ preventScroll: true });
      byId("opportunities").scrollIntoView();
    });
  window.addEventListener("popstate", () => {
    readURL();
    render(false);
  });
  // Recheck expiry in long-lived tabs; the daily build also removes expired pages.
  setInterval(() => render(false), 60000);
})();
