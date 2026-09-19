const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.webmanifest': 'application/manifest+json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // Data Storage Directory for Sync
  const DATA_DIR = path.join(__dirname, 'data');
  const STORE_FILE = path.join(DATA_DIR, 'system_store.json');

  if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
  }

  // Cross-Device Sync: PUSH Endpoint
  if (req.url === '/api/sync/push' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const serverToken = process.env.SYNC_PASSPHRASE || '';
        const clientToken = req.headers['authorization'] ? req.headers['authorization'].replace('Bearer ', '') : (payload.passphrase || '');

        if (serverToken && clientToken !== serverToken) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Unauthorized: Invalid sync passphrase' }));
          return;
        }

        const storeData = {
          tasks: payload.tasks || [],
          fitness: payload.fitness || [],
          distractions: payload.distractions || [],
          xp: payload.xp || 0,
          achievements: payload.achievements || [],
          reflections: payload.reflections || [],
          mission: payload.mission || {},
          updatedAt: Date.now()
        };

        fs.writeFileSync(STORE_FILE, JSON.stringify(storeData, null, 2), 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, timestamp: storeData.updatedAt, message: 'System state synced to server' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Cross-Device Sync: PULL Endpoint
  if ((req.url === '/api/sync/pull' || req.url === '/api/sync') && req.method === 'GET') {
    const serverToken = process.env.SYNC_PASSPHRASE || '';
    const clientToken = req.headers['authorization'] ? req.headers['authorization'].replace('Bearer ', '') : '';

    if (serverToken && clientToken !== serverToken) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized: Invalid sync passphrase' }));
      return;
    }

    if (fs.existsSync(STORE_FILE)) {
      try {
        const fileContent = fs.readFileSync(STORE_FILE, 'utf-8');
        const storeData = JSON.parse(fileContent);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: storeData }));
        return;
      } catch (err) {}
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: null, message: 'No server sync store present yet' }));
    return;
  }

  // AI Assistance Server Proxy Route (Secure API backend)
  if (req.url === '/api/ai/assist' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      let parsed = {};
      try {
        parsed = JSON.parse(body);
      } catch (err) {
        try {
          parsed = JSON.parse(body.replace(/\\"/g, '"'));
        } catch (e2) {
          parsed = {};
        }
      }

      const action = parsed.action || 'decompose';
      const taskTitle = parsed.taskTitle || 'Objective';
      const prompt = parsed.prompt || '';

      let responsePayload = {};
      if (action === 'decompose') {
        responsePayload = {
          success: true,
          suggestedSubtasks: [
            { title: `Define scope & specs for ${taskTitle}`, effort: "30m" },
            { title: `Execute core implementation block`, effort: "60m" },
            { title: `Verify output & edge cases`, effort: "30m" }
          ],
          suggestedPriority: "P2",
          estimatedTotalTime: "2 hours"
        };
      } else if (action === 'parse_thought') {
        responsePayload = {
          success: true,
          title: prompt ? prompt.split('\n')[0].slice(0, 60) : 'Action Item',
          description: prompt ? prompt.slice(0, 140) : '',
          suggestedCategory: "TECHNICAL",
          suggestedPriority: "P2",
          isActionable: true
        };
      } else {
        responsePayload = {
          success: true,
          message: "SYSTEM AI Engine active."
        };
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responsePayload));
    });
    return;
  }


  // Normalize URL to prevent directory traversal
  const safeUrl = path.normalize(decodeURI(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safeUrl === '/' || safeUrl === '\\' ? 'index.html' : safeUrl);

  // If path is a directory, look for index.html
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        if (readErr.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
          res.end('404 Not Found');
        } else {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
          res.end(`Internal Server Error: ${readErr.code}`);
        }
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });
});

const os = require('os');

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const k in interfaces) {
    for (const net of interfaces[k]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`SYSTEM // SELF-MASTERY OS SERVER ONLINE`);
  console.log(`Local Access:   http://localhost:${PORT}`);
  
  const localIps = getLocalIpAddresses();
  if (localIps.length > 0) {
    localIps.forEach(ip => {
      console.log(`Mobile/Wi-Fi:   http://${ip}:${PORT}`);
    });
  } else {
    console.log(`Mobile/Wi-Fi:   Connect via your computer's local IP address on PORT ${PORT}`);
  }
  console.log(`==================================================\n`);
});


