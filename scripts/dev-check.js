#!/usr/bin/env node
// CI smoke check: verify static server responds and key pages are accessible
(async () => {
  const HOST = '127.0.0.1';
  const BASE = process.env.PORT ? Number(process.env.PORT) : 8080;
  const MAX_PORTS = 20; // try 20 consecutive ports
  const TIMEOUT = 10000;

  async function probePort(port) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const url = `http://${HOST}:${port}/index.html`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return false;
      const text = await res.text();
      return !!(text && text.length >= 32);
    } catch {
      return false;
    } finally {
      clearTimeout(t);
    }
  }

  async function findWorkingPort() {
    for (let p = BASE, tries = 0; tries < MAX_PORTS; p++, tries++) {
      if (await probePort(p)) return p;
    }
    throw new Error(`No responding server found from ${BASE}..${BASE + MAX_PORTS - 1}`);
  }

  try {
    const port = await findWorkingPort();
    const mk = (path) => `http://${HOST}:${port}${path}`;
    const targets = [
      mk('/'),
      mk('/index.html'),
      mk('/learn.html'),
      mk('/admin.html'),
      mk('/play.html')
    ];
    for (const url of targets) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed: ${url} -> ${res.status}`);
      const text = await res.text();
      if (!text || text.length < 32) throw new Error(`Empty or too short response from ${url}`);
    }
    console.log('Smoke OK: server responded and pages are accessible');
  } catch (e) {
    console.error('Smoke FAILED:', e?.message || e);
    process.exit(1);
  }
})();
