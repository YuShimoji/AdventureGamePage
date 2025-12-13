#!/usr/bin/env node
// CI smoke check: verify static server responds and key pages are accessible
const { spawn } = require('child_process');
const http = require('http');

const HOST = '127.0.0.1';
const START_PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const SERVER_START_TIMEOUT = 10000;

function waitForServerFromOutput(serverProcess) {
  return new Promise((resolve, reject) => {
    let resolved = false;
    let buffer = '';
    const timeout = setTimeout(() => {
      if (!resolved) reject(new Error('Dev server did not report ready state in time'));
    }, SERVER_START_TIMEOUT);

    const handleLine = line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const match = trimmed.match(/http:\/\/127\.0\.0\.1:(\d+)\//);
      if (match && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(parseInt(match[1], 10));
      }
    };

    serverProcess.stdout.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      lines.forEach(handleLine);
    });

    serverProcess.on('exit', code => {
      if (!resolved) {
        clearTimeout(timeout);
        reject(new Error(`Dev server exited with code ${code} before reporting ready state`));
      }
    });
  });
}

function getText(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      const { statusCode } = res;
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode, body });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error(`Request timeout: ${url}`));
    });
  });
}

(async () => {
  const paths = ['/', '/index.html', '/learn.html', '/admin.html', '/play.html'];
  let serverProcess = null;

  try {
    serverProcess = spawn('node', ['scripts/dev-server.js'], {
      stdio: ['ignore', 'pipe', 'inherit'],
      detached: false,
      env: { ...process.env, PORT: String(START_PORT) },
    });

    const port = await waitForServerFromOutput(serverProcess);
    const base = `http://${HOST}:${port}`;
    const targets = paths.map(p => `${base}${p}`);

    for (const url of targets) {
      const { statusCode, body } = await getText(url);
      if (!statusCode || statusCode < 200 || statusCode >= 300) {
        throw new Error(`Fetch failed: ${url} -> ${statusCode}`);
      }
      if (!body || body.length < 32) throw new Error(`Empty or too short response from ${url}`);
    }

    console.log('Smoke OK: server responded and pages are accessible');
  } catch (e) {
    console.error('Smoke FAILED:', e?.message || e);
    process.exitCode = 1;
  } finally {
    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch {}
    }
  }
})();
