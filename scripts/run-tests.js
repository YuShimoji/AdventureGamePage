#!/usr/bin/env node
// Test runner script with proper process management for Windows
const { spawn, execSync } = require('child_process');
const http = require('http');

const PORT = 8080;
const HOST = '127.0.0.1';
let TEST_URL = `http://${HOST}:${PORT}/tests/test.html`;
const SERVER_START_TIMEOUT = 10000;
const TEST_TIMEOUT = 30000;

function log(message) {
  console.log(`[TEST] ${message}`);
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
      const url = `http://${HOST}:${currentPort}/`;

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

// Run tests
function runTests() {
  return new Promise((resolve, reject) => {
    const testProcess = spawn('curl', ['-f', TEST_URL], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    testProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        log('Tests passed');
        resolve();
      } else {
        error(`Tests failed with exit code ${code}`);
        if (stderr) error(stderr);
        reject(new Error('Tests failed'));
      }
    });

    testProcess.on('error', (err) => {
      reject(err);
    });

    // Timeout
    setTimeout(() => {
      testProcess.kill();
      reject(new Error('Test timeout'));
    }, TEST_TIMEOUT);
  });
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
      detached: false
    });

    // Handle server process errors
    serverProcess.on('error', (err) => {
      error(`Server process error: ${err.message}`);
    });

    // Wait for server to be ready and get actual port
    log('Waiting for server to be ready...');
    actualPort = await waitForServer(PORT);

    const actualTestUrl = `http://${HOST}:${actualPort}/tests/test.html`;
    log(`Server is ready on port ${actualPort}, running tests...`);

    // Override TEST_URL with actual port
    TEST_URL = actualTestUrl;

    await runTests();

    log('All tests completed successfully!');

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
