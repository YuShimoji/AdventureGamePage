#!/usr/bin/env node
// Minimal static server for CI smoke (port 8080)
// Refactored to use modular components
const http = require("http");
const fs = require("fs");

const { getMimeType } = require("./dev-server.mime.js");
const { safeJoin, serveFile, findAvailablePort } = require("./dev-server.utils.js");

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const ROOT = process.cwd();

const server = http.createServer((req, res) => {
  const urlPath = decodeURI((req.url || "/").split("?")[0]);
  let filePath = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const safePath = safeJoin(ROOT, filePath);
  try {
    console.debug(`[dev-server] req ${req.method} ${urlPath} => ${filePath} | safe=${safePath}`);
  } catch {}
  if (!safePath) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad Request");
    return;
  }
  fs.stat(safePath, (err, st) => {
    if (err) {
      try {
        console.warn(`[dev-server] stat err for ${safePath}: ${err.code}`);
      } catch {}
    }
    if (!err && st.isDirectory()) {
      const idx = safeJoin(safePath, "index.html");
      return serveFile(res, idx, getMimeType);
    }
    if (!err) return serveFile(res, safePath, getMimeType);
    // try fallback for missing extension (e.g., /index)
    const htmlFallback = safePath + ".html";
    fs.stat(htmlFallback, (e2, st2) => {
      if (e2) {
        try {
          console.warn(`[dev-server] fallback stat err for ${htmlFallback}: ${e2.code}`);
        } catch {}
      }
      if (!e2 && st2.isFile()) return serveFile(res, htmlFallback, getMimeType);
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
    });
  });
});

// Use available port
findAvailablePort(PORT)
  .then((availablePort) => {
    server.listen(availablePort, () => {
      console.debug(`[dev-server] Serving ${ROOT} at http://127.0.0.1:${availablePort}/`);
      if (availablePort !== PORT) {
        console.debug(
          `[dev-server] Note: Using port ${availablePort} instead of ${PORT} (was in use)`
        );
      }
    });
  })
  .catch((err) => {
    console.error("[dev-server] Failed to find available port:", err);
    process.exit(1);
  });
