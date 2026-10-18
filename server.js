const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 80;
const PUBLIC_DIR = __dirname;
const HONOR_FILE = path.join(__dirname, 'data', 'honor.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

function readHonorData() {
  try {
    if (!fs.existsSync(HONOR_FILE)) return [];
    const content = fs.readFileSync(HONOR_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading honor.json:', err);
    return [];
  }
}

function writeHonorData(data) {
  try {
    const dir = path.dirname(HONOR_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(HONOR_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing honor.json:', err);
    return false;
  }
}

function isDevName(name) {
  return /\b(dev|developer|anton\s*maulana)\b/i.test(name || '');
}

function handleGetHonor(req, res) {
  const data = readHonorData();
  const visible = data.filter(entry => !isDevName(entry.name));
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(visible));
}

function parseHonorPayload(payload) {
  const rawName = String(payload.name || '').trim();
  const name = rawName.replace(/[<>]/g, '').slice(0, 25) || 'Pociman Misterius';
  const bumps = parseInt(payload.bumps, 10) || 0;
  const distance = parseInt(payload.distance, 10) || 0;
  const rank = String(payload.rank || 'Pociman Lincah ⚡').replace(/[<>]/g, '').slice(0, 40);
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) + ', ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  return {
    id: 'h-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    name, rank, bumps, distance, date: dateStr
  };
}

function handlePostHonor(req, res) {
  let body = '';
  req.on('data', chunk => {
    if (body.length < 10000) body += chunk;
  });
  req.on('end', () => {
    try {
      const entry = parseHonorPayload(JSON.parse(body || '{}'));
      const current = readHonorData();
      current.unshift(entry);
      const trimmed = current.slice(0, 100);
      writeHonorData(trimmed);

      const visible = trimmed.filter(e => !isDevName(e.name));
      res.writeHead(201, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ success: true, entry, list: visible }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid payload' }));
    }
  });
}

function serveStreamFile(req, res, filePath, stat, ext) {
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    if (!(start >= 0) || !(end >= start) || end >= stat.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      res.end();
      return;
    }
    const chunkSize = (end - start) + 1;
    const stream = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType
    });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400'
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

function serveStaticFile(req, res, pathname) {
  let safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';
  if (/^[/\\](server\.js|data|scripts|node_modules|package|\.)/i.test(safePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.mp4' || ext === '.webm') {
      serveStreamFile(req, res, filePath, stat, ext);
      return;
    }
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, must-revalidate',
      'Content-Length': stat.size
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/honor' && req.method === 'GET') {
    handleGetHonor(req, res);
    return;
  }
  if (pathname === '/api/honor' && req.method === 'POST') {
    handlePostHonor(req, res);
    return;
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }
  serveStaticFile(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Pociman server running on port ${PORT}`);
});
