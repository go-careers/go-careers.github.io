import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../scripts/build.mjs';

test('analytics runs only in production and disables automatic history pageviews', async () => {
  const output = await mkdtemp(join(tmpdir(), 'gocareers-analytics-'));
  try {
    await build({ output, today:'2026-11-16' });
    assert.doesNotMatch(await readFile(join(output, 'index.html'), 'utf8'), /cloud\.umami\.is|assets\/analytics\.js/);
    await build({ output, production:true, today:'2026-11-16', siteURL:'https://go-careers.github.io/' });
    const html = await readFile(join(output, 'index.html'), 'utf8');
    assert.equal((html.match(/id="umami-tracker"/g) || []).length, 1);
    assert.match(html, /data-website-id="e6cb80e5-9b47-4a06-823e-7d76c5c0e762"/);
    assert.match(html, /data-domains="go-careers.github.io"/);
    assert.match(html, /data-auto-pageview="false"/);
    assert.match(html, /data-before-send="goCareersBeforeSend"/);
    assert.ok(html.indexOf('assets/analytics.js') < html.indexOf('assets/app.js'));
    assert.ok(html.indexOf('assets/app.js') < html.indexOf('id="umami-tracker"'));
    assert.match(await readFile(join(output, '404.html'), 'utf8'), /id="umami-tracker"/);
  } finally { await rm(output, { recursive:true, force:true }); }
});
