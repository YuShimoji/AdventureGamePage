#!/usr/bin/env node
// Minimal Playwright-based E2E smoke test for /tests/test.html
// 1. Start dev-server (scripts/dev-server.js)
// 2. Detect the actual port from dev-server logs
// 3. Launch headless browser to /tests/test.html
// 4. Wait for Mocha to finish and check for failures
// 5. Capture a screenshot for debugging

const { spawn } = require('child_process');
const path = require('path');

async function main() {
  const { chromium } = require('playwright');

  const serverScript = path.join(__dirname, 'dev-server.js');
  let port = 8080;

  const server = spawn('node', [serverScript], {
    stdio: ['ignore', 'pipe', 'inherit'],
    cwd: path.join(__dirname, '..'),
  });

  let buffer = '';
  const portRegex = /http:\/\/127\.0\.0\.1:(\d+)\//;

  const serverReady = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('dev-server did not report a ready URL in time'));
    }, 15000);

    server.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) {
        const m = line.match(portRegex);
        if (m) {
          port = Number(m[1]);
          clearTimeout(timeout);
          resolve();
          return;
        }
      }
    });

    server.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    server.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`dev-server exited early with code ${code}`));
    });
  });

  try {
    await serverReady;
    const baseUrl = `http://127.0.0.1:${port}`;
    const testUrl = `${baseUrl}/tests/test.html?e2e=1`;

    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', (msg) => {
      try {
        console.debug(`[E2E][browser console.${msg.type()}] ${msg.text()}`);
      } catch {}
    });

    page.on('pageerror', (err) => {
      try {
        console.error(`[E2E][browser pageerror] ${String((err && err.message) || err)}`);
      } catch {}
    });

    await page.goto(testUrl, { waitUntil: 'networkidle' });

    // Wait for Mocha to complete by polling the .failures count
    await page.waitForFunction(() => {
      // eslint-disable-next-line no-undef
      const done = window.__mochaDone === true;
      // eslint-disable-next-line no-undef
      const stats = window.__mochaStats;
      return done && stats && typeof stats.tests === 'number';
    }, { timeout: 60000 });

    // eslint-disable-next-line no-undef
    const result = await page.evaluate(() => {
      const stats = window.__mochaStats;
      if (!stats) return { tests: 0, failures: 1, error: 'mocha stats missing' };
      return { tests: stats.tests || 0, failures: stats.failures || 0, error: stats.error };
    });

    await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'e2e-screenshot.png') });

    console.debug(`[E2E] Mocha tests: ${result.tests}, failures: ${result.failures}`);
    if (result.error) {
      console.error(`[E2E] Mocha error: ${result.error}`);
    }

    await browser.close();

    if (!result.tests || result.tests <= 0) {
      console.error('[E2E] No tests detected; treating as failure');
      process.exitCode = 1;
    } else if (result.failures > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('[E2E] Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    if (server && !server.killed) {
      server.kill();
    }
  }
}

main().catch((err) => {
  console.error('[E2E] Unhandled error:', err);
  process.exit(1);
});
