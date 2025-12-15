#!/usr/bin/env node
// Test runner script with proper process management for Windows
// Refactored to use modular components
const path = require('path');

const TestServerManager = require('./run-tests.server.js');
const TestRunner = require('./run-tests.test.js');
const TestUtils = require('./run-tests.utils.js');
async function main() {
  TestUtils.validateEnvironment();

  const serverManager = new TestServerManager();
  let serverProcess = null;

  try {
    TestUtils.log('Starting dev server...');

    // Try to kill any existing server on the port
    if (TestUtils.checkWindowsProcess(serverManager.PORT)) {
      TestUtils.log(`Port ${serverManager.PORT} is in use, attempting to free it...`);
      TestUtils.killWindowsProcess(serverManager.PORT);
      // Wait a bit for the port to be freed
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const { server, port } = await serverManager.startServer(path.join(__dirname, 'dev-server.js'));
    serverProcess = server;

    TestUtils.log(`Server started on port ${port}`);

    // Update test URL with actual port
    const testRunner = new TestRunner(serverManager.TEST_URL);

    // Wait for server to be ready
    await serverManager.checkServerReady(serverManager.TEST_URL);

    TestUtils.log('Running smoke test...');
    const smokeResult = await testRunner.runSmokeTest();
    testRunner.logResult(smokeResult);

    if (!smokeResult.success) {
      throw new Error('Smoke test failed');
    }

    TestUtils.log('All tests passed!');

  } catch (err) {
    console.error('[TEST] Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    if (serverProcess) {
      TestUtils.log('Stopping server...');
      serverManager.killServer(serverProcess);
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('[TEST] Unhandled error:', err);
    process.exit(1);
  });
}

module.exports = { main, TestServerManager, TestRunner, TestUtils };
