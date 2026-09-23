'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const rootDirectory = path.resolve(__dirname);
const rootPrefix = `${rootDirectory.toLowerCase()}${path.sep}`;
const port = Number(process.env.PORT || 4173);
const blockedSegments = new Set([
  'readme.md',
  'nuclei',
  'nuclei-templates',
  'nuclei-runtime',
  'nuclei-runtime.zip',
  'nuclei-scan.jsonl'
]);

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://client-assets.anota.ai https://legacy-assets.anota.ai data:; connect-src 'self'; font-src 'self' data:;",
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Permitted-Cross-Domain-Policies': 'none'
};

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

const send = (res, statusCode, body, headers = {}) => {
  res.writeHead(statusCode, { ...securityHeaders, ...headers });
  if (res.req.method === 'HEAD') return res.end();
  return res.end(body);
};

const resolveRequestPath = requestUrl => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname);
  } catch {
    return { error: 400 };
  }

  const relativePath = pathname.replace(/^[/\\]+/, '');
  const segments = relativePath.split(/[\\/]+/).filter(Boolean);
  if (segments.some(segment => segment.startsWith('.') || blockedSegments.has(segment.toLowerCase()))) return { error: 404 };

  const filePath = path.resolve(rootDirectory, relativePath || 'index.html');
  if (!filePath.toLowerCase().startsWith(rootPrefix)) return { error: 403 };
  return { filePath };
};

const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });

  const resolved = resolveRequestPath(req.url || '/');
  if (resolved.error) return send(res, resolved.error, 'Not found');

  let filePath = resolved.filePath;
  try {
    if (fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
    if (!filePath.toLowerCase().startsWith(rootPrefix)) return send(res, 403, 'Forbidden');
    const body = fs.readFileSync(filePath);
    return send(res, 200, body, {
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
    });
  } catch {
    return send(res, 404, 'Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Joker dev server listening at http://127.0.0.1:${port}/`);
});
