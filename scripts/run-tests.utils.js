#!/usr/bin/env node
// Test runner utilities module

class TestUtils {
  static log(message) {
    console.debug(`[TEST] ${message}`);
  }

  static _extractWindowsPidsFromNetstat(output) {
    const text = String(output || '');
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const pids = [];

    for (const line of lines) {
      const m = line.match(/(\d+)\s*$/);
      if (!m) continue;
      const pid = String(m[1] || '').trim();
      if (pid) pids.push(pid);
    }

    return Array.from(new Set(pids));
  }

  static checkWindowsProcess(port) {
    try {
      // Check if port is in use on Windows
      const { execSync } = require('child_process');
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.split('\n').filter(line => line.trim());
      return lines.length > 0;
    } catch (e) {
      return false;
    }
  }

  static killWindowsProcess(port) {
    try {
      const { execSync } = require('child_process');
      // Find PID using the port
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });

      const pids = this._extractWindowsPidsFromNetstat(output)
        .map(pid => pid.replace(/\D/g, ''))
        .filter(Boolean);

      if (pids.length === 0) {
        this.log(`No PID found for port ${port}; skipping taskkill`);
        return false;
      }

      pids.forEach(pid => {
        execSync(`taskkill /PID ${pid} /T /F`);
        this.log(`Killed process ${pid} using port ${port}`);
      });

      return true;
    } catch (e) {
      this.log(`Failed to kill process on port ${port}: ${e.message}`);
    }
    return false;
  }

  static validateEnvironment() {
    const required = ['http', 'child_process', 'path'];
    const missing = required.filter(mod => {
      try {
        require.resolve(mod);
        return false;
      } catch {
        return true;
      }
    });

    if (missing.length > 0) {
      throw new Error(`Missing required modules: ${missing.join(', ')}`);
    }
  }
}

module.exports = TestUtils;
