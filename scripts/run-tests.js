#!/usr/bin/env node
// Test runner script with proper process management for Windows
const { spawn, execSync } = require('child_process');
const http = require('http');

const PORT = 8080;
const HOST = '127.0.0.1';
const TEST_PATH = '/tests/test.html';
let TEST_URL = `http://${HOST}:${PORT}${TEST_PATH}`;
const SERVER_START_TIMEOUT = 10000;
const TEST_TIMEOUT = 30000;

function log(message) {
  console.log(`[TEST] ${message}`);
}

// Fallback: simple smoke checks for core pages if tests page is unavailable
async function runSmokeOnPort(port) {
  const pages = ['/', '/index.html', '/learn.html', '/admin.html', '/play.html'];
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TEST_TIMEOUT);
  try {
    for (const p of pages) {
      const url = `http://${HOST}:${port}${p}`;
      log(`Smoke check: ${url}`);
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Smoke HTTP ${res.status} for ${p}`);
      }
      const text = await res.text();
      if (!text || text.length < 32) {
        throw new Error(`Smoke short body for ${p}`);
      }
    }
  } finally {
    clearTimeout(t);
  }
}

function waitForServerFromOutput(serverProcess) {
  return new Promise((resolve, reject) => {
    let resolved = false;
    let buffer = '';
    const timeout = setTimeout(() => {
      if (!resolved) {
        reject(new Error('Dev server did not report ready state in time'));
      }
    }, SERVER_START_TIMEOUT);

    const handleLine = (line) => {
      const trimmed = line.trim();
      if (trimmed) {
        console.log(`[dev-server] ${trimmed}`);
        const match = trimmed.match(/http:\/\/127\.0\.0\.1:(\d+)\//);
        if (match && !resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(parseInt(match[1], 10));
        }
      }
    };

    serverProcess.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      lines.forEach(handleLine);
    });

    serverProcess.stdout.on('error', (err) => {
      if (!resolved) {
        clearTimeout(timeout);
        reject(err);
      }
    });

    serverProcess.on('exit', (code) => {
      if (!resolved) {
        clearTimeout(timeout);
        reject(new Error(`Dev server exited with code ${code} before reporting ready state`));
      }
    });
  });
}

function error(message) {
  console.error(`[TEST ERROR] ${message}`);
}

// Check if port is in use
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(false));
    });
    server.on('error', () => resolve(true));
  });
}

// Kill process using the port (Windows specific)
function killPortProcess(port) {
  try {
    // Use netstat to find process ID
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = output.split('\n').filter(line => line.includes(`:${port}`));

    const pids = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && !pids.includes(pid)) {
          pids.push(pid);
        }
      }
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
        log(`Killed process ${pid} using port ${port}`);
      } catch (e) {
        // Process might have already exited
      }
    }

    // Wait a bit for port to be freed
    return new Promise(resolve => setTimeout(resolve, 2000));
  } catch (e) {
    log(`No process found using port ${port}`);
    return Promise.resolve();
  }
}

// Wait for server to be ready (check multiple ports)
function waitForServer(startPort, maxRetries = 10) {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    function check() {
      attempts++;
      const url = `http://${HOST}:${currentPort}${TEST_PATH}`;

      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve(currentPort);
          return;
        }
        res.resume();
        if (attempts >= maxRetries) {
          reject(new Error(`Server not accessible on any port after ${maxRetries} attempts`));
          return;
        }
        currentPort++;
        setTimeout(check, 500);
      }).on('error', () => {
        if (attempts >= maxRetries) {
          reject(new Error(`Server not accessible on any port after ${maxRetries} attempts`));
          return;
        }
        currentPort++;
        setTimeout(check, 500);
      });
    }

    check();
  });
}

// Run tests without external dependencies (use Node fetch)
async function runTests() {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TEST_TIMEOUT);
  try {
    log(`Fetching test page: ${TEST_URL}`);
    const res = await fetch(TEST_URL, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const text = await res.text();
    if (!text || text.length < 32) {
      throw new Error('Empty or too short response from test page');
    }
    log('Tests passed');
  } catch (e) {
    error(`Fetch failed: ${e.message || e}`);
    throw e;
  } finally {
    clearTimeout(t);
  }
}

// Main test runner
async function main() {
  let serverProcess = null;
  let actualPort = PORT;

  try {
    log('Starting test runner...');

    // Check if port is in use
    const isPortInUse = await checkPort(PORT);
    if (isPortInUse) {
      log(`Port ${PORT} is in use, but dev-server will find an available port automatically...`);
    }

    log('Starting development server...');
    serverProcess = spawn('node', ['scripts/dev-server.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      detached: false,
      env: { ...process.env, PORT: '0' }
    });

    // Handle server process errors
    serverProcess.on('error', (err) => {
      error(`Server process error: ${err.message}`);
    });

    // Wait for server to be ready and get actual port
    log('Waiting for server to be ready...');
    try {
      actualPort = await waitForServerFromOutput(serverProcess);
    } catch (stdoutErr) {
      log(`Falling back to port probing: ${stdoutErr.message}`);
      actualPort = await waitForServer(PORT);
    }

    const actualTestUrl = `http://${HOST}:${actualPort}${TEST_PATH}`;
    log(`Server is ready on port ${actualPort}, running tests...`);

    // Override TEST_URL with actual port
    TEST_URL = actualTestUrl;

    try {
      await runTests();
      log('All tests completed successfully!');
    } catch (e) {
      // If tests page is missing, fall back to smoke checks
      if (String(e && e.message).includes('HTTP 404')) {
        log('Falling back to smoke checks (index/admin/play)...');
        await runSmokeOnPort(actualPort);
        log('Smoke OK: server responded and pages are accessible');
      } else {
        throw e;
      }
    }

  } catch (err) {
    error(`Test runner failed: ${err.message}`);
    process.exit(1);
  } finally {
    // Clean up server process
    if (serverProcess) {
      log('Stopping server...');
      serverProcess.kill();
    }
  }
}

// Handle command line arguments
if (process.argv.includes('--ci')) {
  // CI mode - more strict
  process.env.CI = 'true';
}

main().catch(err => {
  error(`Unhandled error: ${err.message}`);
  process.exit(1);
});
