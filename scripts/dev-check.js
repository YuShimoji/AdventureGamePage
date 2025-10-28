#!/usr/bin/env node
// CI smoke check: verify static server responds and key pages are accessible
(async () => {
  const targets = ["http://127.0.0.1:8080/", "http://127.0.0.1:8080/index.html"];
  try {
    for (const url of targets) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed: ${url} -> ${res.status}`);
      const text = await res.text();
      if (!text || text.length < 32) throw new Error(`Empty or too short response from ${url}`);
    }
    console.log("Smoke OK: server responded and pages are accessible");
  } catch (e) {
    console.error("Smoke FAILED:", e?.message || e);
    process.exit(1);
  }
})();
