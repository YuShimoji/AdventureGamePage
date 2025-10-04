#!/usr/bin/env node
// Minimal static server for CI smoke (port 8080)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function safeJoin(root, p){
  const resolved = path.resolve(root, p);
  if (!resolved.startsWith(path.resolve(root))) return null;
  return resolved;
}

function serveFile(res, filePath){
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err){
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, {'Content-Type':'text/plain; charset=utf-8'});
      res.end(err.code === 'ENOENT' ? 'Not Found' : 'Internal Server Error');
      return;
    }
    res.writeHead(200, {'Content-Type': type});
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURI((req.url || '/').split('?')[0]);
  let filePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const safePath = safeJoin(ROOT, filePath);
  if (!safePath) {
    res.writeHead(400, {'Content-Type':'text/plain; charset=utf-8'});
    res.end('Bad Request');
    return;
  }
  fs.stat(safePath, (err, st) => {
    if (!err && st.isDirectory()) {
      const idx = safeJoin(safePath, 'index.html');
      return serveFile(res, idx);
    }
    if (!err) return serveFile(res, safePath);
    // try fallback for missing extension (e.g., /index)
    const htmlFallback = safePath + '.html';
    fs.stat(htmlFallback, (e2, st2) => {
      if (!e2 && st2.isFile()) return serveFile(res, htmlFallback);
      res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
      res.end('Not Found');
    });
  });
});

server.listen(PORT, () => {
  console.log(`[dev-server] Serving ${ROOT} at http://127.0.0.1:${PORT}/`);
});
