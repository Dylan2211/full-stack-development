(async () => {
  // fetch polyfill for older Node
  let fetchFn = global.fetch;
  if (!fetchFn) {
    try { fetchFn = (await import('node-fetch')).default; } catch (e) { console.error('fetch not available:', e.message); process.exit(1); }
  }

  const base = 'http://localhost:3000';
  async function call(path, opts) {
    try {
      const res = await fetchFn(base + path, opts);
      const text = await res.text();
      console.log(`${path} -> ${res.status}`);
      try { console.log(JSON.parse(text)); } catch { console.log(text); }
    } catch (e) {
      console.error(`${path} failed:`, e.message);
    }
  }

  await call('/api/analytics/init', { method: 'POST' });
  await call('/api/analytics/overview');
  await call('/api/analytics/events');
  await call('/api/ai/openai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'Hello analytics test' }), timeout: 120000 });
  await call('/api/analytics/overview');
})();
