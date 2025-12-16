#!/usr/bin/env node
// Test runner server management module
const { spawn } = require('child_process');
const http = require('http');

class TestServerManager {
  constructor(port = 8080, host = '127.0.0.1', testPath = '/tests/test.html') {
    this.PORT = port;
    this.HOST = host;
    this.TEST_PATH = testPath;
    this.TEST_URL = `http://${host}:${port}${testPath}`;
    this.SERVER_START_TIMEOUT = 10000;
    this.TEST_TIMEOUT = 30000;
  }

  log(message) {
    console.debug(`[TEST] ${message}`);
  }

  waitForServerFromOutput(serverProcess) {
    return new Promise((resolve, reject) => {
      let resolved = false;
      let buffer = '';
      const timeout = setTimeout(() => {
        if (!resolved) {
          reject(new Error('Dev server did not report ready state in time'));
        }
      }, this.SERVER_START_TIMEOUT);

      const handleLine = (line) => {
        const trimmed = line.trim();
        if (trimmed) {
          console.debug(`[dev-server] ${trimmed}`);
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

      serverProcess.stderr.on('data', (chunk) => {
        console.error(`[dev-server stderr] ${chunk.toString().trim()}`);
      });

      serverProcess.on('error', (err) => {
        if (!resolved) {
          clearTimeout(timeout);
          reject(err);
        }
      });

      serverProcess.on('exit', (code) => {
        if (!resolved) {
          clearTimeout(timeout);
          reject(new Error(`Server exited prematurely with code ${code}`));
        }
      });
    });
  }

  async startServer(scriptPath) {
    const server = spawn('node', [scriptPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    const port = await this.waitForServerFromOutput(server);
    this.TEST_URL = `http://${this.HOST}:${port}${this.TEST_PATH}`;

    return { server, port };
  }

  async checkServerReady(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Server readiness check timed out'));
      }, timeout);

      http.get(url, (res) => {
        clearTimeout(timeoutId);
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Server returned status ${res.statusCode}`));
        }
      }).on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }

  killServer(serverProcess) {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
  }
}

module.exports = TestServerManager;
