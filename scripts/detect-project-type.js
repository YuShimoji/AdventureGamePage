#!/usr/bin/env node
// Utility to detect project type based on repository contents.
// Outputs a short descriptor used by shared workflows and AI collaborators.

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const checks = [
  {
    name: 'hasPackageJson',
    test: () => fs.existsSync(path.join(ROOT, 'package.json')),
  },
  {
    name: 'hasScriptsDir',
    test: () => fs.existsSync(path.join(ROOT, 'scripts')),
  },
  {
    name: 'hasHtmlEntry',
    test: () => ['index.html', 'admin.html', 'play.html'].some((file) =>
      fs.existsSync(path.join(ROOT, file))
    ),
  },
  {
    name: 'hasDocsDir',
    test: () => fs.existsSync(path.join(ROOT, 'docs')),
  },
];

const results = checks.reduce(
  (acc, check) => ({ ...acc, [check.name]: check.test() }),
  {}
);

let type = 'unknown';
if (results.hasHtmlEntry && results.hasScriptsDir) {
  type = 'static-web-app';
  if (results.hasPackageJson) {
    type = 'static-web-app+node-tooling';
  }
}

const payload = {
  type,
  checks: results,
};

process.stdout.write(JSON.stringify(payload, null, 2));
