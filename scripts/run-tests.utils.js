#!/usr/bin/env node
// Test runner utilities module

class TestUtils {
  static log(message) {
    console.debug(`[TEST] ${message}`);
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
      const lines = output.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const parts = lines[0].split(/\s+/);
        const pid = parts[parts.length - 1];
        execSync(`taskkill /PID ${pid} /T /F`);
        this.log(`Killed process ${pid} using port ${port}`);
        return true;
      }
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
