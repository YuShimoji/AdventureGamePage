#!/usr/bin/env node
// E2E Tests Core Module - Main test execution logic
const path = require('path');

class E2ETestCore {
  constructor(scriptPath = path.join(__dirname, 'dev-server.js'), port = 8080) {
    this.scriptPath = scriptPath;
    this.port = port;
    this.serverProcess = null;
    this.browser = null;
  }

  async startServer() {
    const { spawn } = require('child_process');
    let buffer = '';
    const portRegex = /http:\/\/127\.0\.0\.1:(\d+)\//;

    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', [this.scriptPath], {
        stdio: ['ignore', 'pipe', 'inherit'],
        cwd: path.join(__dirname, '..'),
      });

      const timeout = setTimeout(() => {
        reject(new Error('dev-server did not report a ready URL in time'));
      }, 15000);

      this.serverProcess.stdout.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop();
        for (const line of lines) {
          const m = line.match(portRegex);
          if (m) {
            clearTimeout(timeout);
            resolve(parseInt(m[1], 10));
            return;
          }
        }
      });

      this.serverProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  async runTest(testPath) {
    const { chromium } = require('playwright');

    try {
      this.browser = await chromium.launch();
      const context = await this.browser.newContext();
      const page = await context.newPage();

      const testUrl = `http://127.0.0.1:${this.port}/${testPath}`;
      await page.goto(testUrl);

      // Wait for Mocha to complete
      await page.waitForFunction(() => {
        return window.mocha && window.mocha.stats && window.mocha.stats.end;
      }, { timeout: 30000 });

      // Get test results
      const result = await page.evaluate(() => {
        const stats = window.mocha && window.mocha.stats;
        if (!stats) return { tests: 0, failures: 0 };
        return { tests: stats.tests || 0, failures: stats.failures || 0 };
      });

      await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'e2e-screenshot.png') });

      console.debug(`[E2E] Mocha tests: ${result.tests}, failures: ${result.failures}`);

      await this.browser.close();
      this.browser = null;

      if (result.failures > 0) {
        process.exitCode = 1;
      }

    } catch (err) {
      console.error('[E2E] Error:', err.message || err);
      process.exitCode = 1;
    }
  }

  stopServer() {
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
    }
    if (this.browser) {
      this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = E2ETestCore;
