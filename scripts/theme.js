// Runs in the head so a saved choice applies before the board is painted.
(() => {
  const key = 'go-careers:theme:v1';
  const palette = document.getElementById('dark-palette');
  const device = matchMedia('(prefers-color-scheme: dark)');
  const toolbarColors = document.querySelectorAll('meta[name="theme-color"]');
  let preference = 'system';

  function apply(value) {
    preference = value === 'dark' || value === 'light' ? value : 'system';
    palette.media = preference === 'system' ? device.media : preference === 'dark' ? 'all' : 'not all';
    const dark = preference === 'dark' || (preference === 'system' && device.matches);
    toolbarColors[0].media = dark ? 'not all' : 'all';
    toolbarColors[1].media = dark ? 'all' : 'not all';
    const picker = document.getElementById('theme');
    if (picker) picker.value = preference;
  }
  function restore() {
    try { apply(localStorage.getItem(key)); }
    catch { apply(preference); }
  }
  restore();
  device.addEventListener('change', () => apply(preference));
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) restore();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) restore(); });
  document.addEventListener('DOMContentLoaded', () => {
    const picker = document.getElementById('theme');
    picker.value = preference;
    picker.parentElement.hidden = false;
    picker.addEventListener('change', () => {
      apply(picker.value);
      try {
        if (preference === 'system') localStorage.removeItem(key);
        else localStorage.setItem(key, preference);
      } catch { /* The selected theme still applies for this page. */ }
    });
  });
})();
