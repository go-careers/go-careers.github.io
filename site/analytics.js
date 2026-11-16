(() => {
  const tracker = document.getElementById('umami-tracker');
  if (!tracker || location.hostname !== 'go-careers.github.io') return;
  const queue = [];
  let ready = false;

  // Keep campaign attribution, but omit job searches, return URLs and fragments.
  function cleanURL(value, campaigns = false) {
    if (!value) return '';
    try {
      const url = new URL(value, location.origin);
      const params = new URLSearchParams();
      if (campaigns) for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
        if (url.searchParams.has(key)) params.set(key, url.searchParams.get(key));
      }
      return (url.origin === location.origin ? '' : url.origin) + url.pathname + (params.size ? '?' + params : '');
    } catch { return ''; }
  }
  window.goCareersBeforeSend = (_type, payload) => ({
    ...payload,
    url: cleanURL(payload.url, true),
    referrer: cleanURL(payload.referrer),
  });
  function send(...args) {
    try { Promise.resolve(window.umami?.track(...args)).catch(() => {}); }
    catch { /* Analytics must never interrupt browsing or applications. */ }
  }
  window.goCareersAnalytics = {
    track(name, data) {
      if (ready) send(name, data);
      else if (queue.length < 50) queue.push([name, data]);
    },
  };
  tracker.addEventListener('load', () => {
    ready = true;
    // Exactly one pageview per document; filtering uses history.replaceState.
    send();
    for (const event of queue.splice(0)) send(...event);
  }, { once: true });
  tracker.addEventListener('error', () => { queue.length = 0; }, { once: true });
})();
