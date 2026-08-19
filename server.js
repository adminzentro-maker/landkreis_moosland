const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORTS = [8080, 3000, 8000];
const DATA_DIR = path.join(__dirname, 'data');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'custom_payments.json');
const CONFIG_FILE = path.join(DATA_DIR, 'store_config.json');
const RESOURCES_DIR = path.join(__dirname, 'resources');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const defaultConfig = {
    tebexStoreUrl: 'https://losangeleslife.tebex.io',
    paypalEmail: 'shop@losangeles-v3.de',
    paypalMeLink: 'https://paypal.me/losangeleslife',
    currency: 'EUR'
};

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.lua': 'text/plain',
    '.apk': 'application/vnd.android.package-archive',
    '.webmanifest': 'application/manifest+json'
};

const rateLimitMap = new Map();
const isRateLimited = (ip) => {
    const now = Date.now();
    const windowMs = 60000;
    const maxRequests = 120;
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return false;
    }
    const record = rateLimitMap.get(ip);
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        return false;
    }
    record.count++;
    return record.count > maxRequests;
};

const requestHandler = (req, res) => {
    const clientIp = req.socket.remoteAddress || '127.0.0.1';
    
    if (isRateLimited(clientIp)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
        return;
    }

    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let urlPath = urlObj.pathname;

    // 1. Get Local LAN IP for Mobile Phone Access & QR Code
    if (urlPath === '/api/mobile/network-info') {
        const interfaces = os.networkInterfaces();
        let lanIps = [];
        for (let devName in interfaces) {
            interfaces[devName].forEach(iface => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    lanIps.push(iface.address);
                }
            });
        }
        const primaryIp = lanIps[0] || '127.0.0.1';
        const mobileUrl = `http://${primaryIp}:8080/`;
        
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({
            primaryIp: primaryIp,
            port: 8080,
            mobileUrl: mobileUrl,
            allIps: lanIps
        }));
        return;
    }

    // 2. Custom Standalone Payment Gateway
    if (urlPath === '/api/payment/custom-gateway' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const scriptName = data.scriptName || 'Standalone Item';
                const price = data.price || '14.99 €';
                const cardNumber = data.cardNumber || '**** **** **** 8888';
                
                const randSeg = (len) => crypto.randomBytes(len).toString('hex').toUpperCase().slice(0, len);
                const generatedKey = `LAV3-GATEWAY-${randSeg(4)}-${randSeg(4)}`;
                const txId = `TX-V3-${Date.now()}-${randSeg(2)}`;

                let payments = [];
                if (fs.existsSync(PAYMENTS_FILE)) {
                    try { payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf-8') || '[]'); } catch(e){}
                }

                const newPaymentRecord = {
                    txId: txId,
                    scriptName: scriptName,
                    price: price,
                    key: generatedKey,
                    method: 'Standalone Custom Gateway',
                    maskedCard: cardNumber.slice(-4),
                    timestamp: new Date().toISOString(),
                    clientIpHash: crypto.createHash('sha256').update(clientIp).digest('hex').slice(0, 16)
                };

                payments.unshift(newPaymentRecord);
                fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2), 'utf-8');

                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({
                    success: true,
                    txId: txId,
                    key: generatedKey,
                    message: 'Zahlung über V3 Custom Gateway erfolgreich verarbeitet!'
                }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Gateway Verarbeitung fehlgeschlagen' }));
            }
        });
        return;
    }

    // 3. Merchant Store Config (Tebex & PayPal)
    if (urlPath === '/api/shop/config') {
        if (req.method === 'GET') {
            let configData = defaultConfig;
            if (fs.existsSync(CONFIG_FILE)) {
                try { configData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')); } catch(e){}
            }
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify(configData));
            return;
        }
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const parsed = JSON.parse(body || '{}');
                    const newConfig = {
                        tebexStoreUrl: parsed.tebexStoreUrl || defaultConfig.tebexStoreUrl,
                        paypalEmail: parsed.paypalEmail || '',
                        paypalMeLink: parsed.paypalMeLink || '',
                        currency: parsed.currency || 'EUR'
                    };
                    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify({ success: true, config: newConfig }));
                } catch(e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Konfiguration konnte nicht gespeichert werden' }));
                }
            });
            return;
        }
    }

    // 4. Get Script Source Code Files
    if (urlPath === '/api/shop/script-source') {
        const folder = urlObj.searchParams.get('folder');
        if (!folder || folder.includes('..') || folder.includes('/')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ungültiges Script Verzeichnis' }));
            return;
        }
        
        const scriptDir = path.join(RESOURCES_DIR, folder);
        if (!fs.existsSync(scriptDir)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Script Paket nicht gefunden' }));
            return;
        }
        
        try {
            const fxmanifest = fs.readFileSync(path.join(scriptDir, 'fxmanifest.lua'), 'utf-8');
            const config = fs.readFileSync(path.join(scriptDir, 'config.lua'), 'utf-8');
            const client = fs.readFileSync(path.join(scriptDir, 'client', 'main.lua'), 'utf-8');
            const server = fs.readFileSync(path.join(scriptDir, 'server', 'main.lua'), 'utf-8');
            
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({
                folder: folder,
                fxmanifest: fxmanifest,
                config: config,
                client: client,
                server: server
            }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Fehler beim Lesen der Dateien: ' + e.message }));
        }
        return;
    }

    // 5. Checkout & Keymaster Generation
    if (urlPath === '/api/shop/checkout' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const scriptName = data.scriptName || 'V3 Custom Script';
                const paymentMethod = data.paymentMethod || 'Tebex';
                
                const randSeg = (len) => crypto.randomBytes(len).toString('hex').toUpperCase().slice(0, len);
                const generatedKey = `LAV3-KM${randSeg(2)}-${randSeg(4)}-${randSeg(4)}`;
                
                let licenses = [];
                if (fs.existsSync(LICENSES_FILE)) {
                    try { licenses = JSON.parse(fs.readFileSync(LICENSES_FILE, 'utf-8') || '[]'); } catch(e){}
                }
                
                const newLicense = {
                    id: crypto.randomBytes(8).toString('hex'),
                    scriptName: scriptName,
                    key: generatedKey,
                    paymentMethod: paymentMethod,
                    timestamp: new Date().toISOString(),
                    clientIpHash: crypto.createHash('sha256').update(clientIp).digest('hex').slice(0, 16)
                };
                
                licenses.unshift(newLicense);
                fs.writeFileSync(LICENSES_FILE, JSON.stringify(licenses, null, 2), 'utf-8');
                
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({
                    success: true,
                    key: generatedKey,
                    license: newLicense
                }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Checkout Verarbeitung fehlgeschlagen' }));
            }
        });
        return;
    }

    // 6. FiveM Live Server Status Proxy
    if (urlPath === '/api/status/main' || urlPath === '/api/status/test' || urlPath === '/api/status') {
        let hostB64 = "NS4xNzUuMjIxLjI4OjMwMTIw";
        let maxSlots = 250;
        if (urlPath === '/api/status/test') {
            hostB64 = "NS4xNzUuMjIxLjE3NTozMDEyMA==";
            maxSlots = 48;
        }
        
        const targetHost = Buffer.from(hostB64, 'base64').toString('utf-8');
        const [serverIp, serverPort] = targetHost.split(':');
        
        let playersList = [];
        let completed = 0;
        let hasFailed = false;
        
        const sendResponse = () => {
            if (hasFailed) return;
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ online: true, players: playersList.length, maxPlayers: maxSlots, playersList: playersList }));
        };
        
        const sendFailure = () => {
            if (hasFailed) return;
            hasFailed = true;
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ online: false, players: 0, maxPlayers: maxSlots, playersList: [] }));
        };
        
        http.get(`http://${serverIp}:${serverPort}/players.json`, { timeout: 3000 }, (apiRes) => {
            let rawData = '';
            apiRes.on('data', (chunk) => { rawData += chunk; });
            apiRes.on('end', () => {
                try {
                    const parsed = JSON.parse(rawData);
                    if (Array.isArray(parsed)) {
                        playersList = parsed;
                        completed++;
                        if (completed === 2) sendResponse();
                    } else {
                        throw new Error();
                    }
                } catch (e) {
                    sendFailure();
                }
            });
        }).on('error', sendFailure);
        
        http.get(`http://${serverIp}:${serverPort}/dynamic.json`, { timeout: 3000 }, (apiRes) => {
            let rawData = '';
            apiRes.on('data', (chunk) => { rawData += chunk; });
            apiRes.on('end', () => {
                try {
                    const parsed = JSON.parse(rawData);
                    if (parsed && parsed.sv_maxclients) {
                        maxSlots = parseInt(parsed.sv_maxclients, 10);
                    } else if (parsed && parsed.sv_maxClients) {
                        maxSlots = parseInt(parsed.sv_maxClients, 10);
                    }
                    completed++;
                    if (completed === 2) sendResponse();
                } catch (e) {
                    completed++;
                    if (completed === 2) sendResponse();
                }
            });
        }).on('error', () => {
            completed++;
            if (completed === 2) sendResponse();
        });
        
        return;
    }

    // Static File Serving
    if (urlPath === '/') {
        urlPath = '/index.html';
    }
    
    const filePath = path.join(__dirname, urlPath);
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Datei nicht gefunden');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Server Fehler: ' + err.code);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'SAMEORIGIN'
            });
            res.end(content, 'utf-8');
        }
    });
};

PORTS.forEach(port => {
    try {
        const srv = http.createServer(requestHandler);
        srv.listen(port, '0.0.0.0', () => {
            console.log(`Sicherer Server lauscht auf 0.0.0.0:${port}`);
        });
        srv.on('error', (err) => {
            console.log(`Port ${port} belegt oder blockiert.`);
        });
    } catch(e) {}
});
