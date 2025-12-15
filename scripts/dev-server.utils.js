// Dev server utilities module
const fs = require("fs");
const path = require("path");

function safeJoin(root, p) {
  const resolved = path.resolve(root, p);
  if (!resolved.startsWith(path.resolve(root))) return null;
  return resolved;
}

function serveFile(res, filePath, getMimeType) {
  const ext = path.extname(filePath).toLowerCase();
  const type = getMimeType(ext);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end(err.code === "ENOENT" ? "Not Found" : "Internal Server Error");
      return;
    }
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = require("http").createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      // Port is in use, try next port
      findAvailablePort(startPort + 1)
        .then(resolve)
        .catch(reject);
    });
  });
}

module.exports = { safeJoin, serveFile, findAvailablePort };
