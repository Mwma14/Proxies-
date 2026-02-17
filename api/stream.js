export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const path = req.url.replace(/^\/stream/, '');
  const targetUrl = 'https://tw.thewayofthedragg.workers.dev' + path;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 'User-Agent': req.headers['user-agent'] || '' },
    });
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);
    const data = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    res.status(502).json({ error: 'Stream proxy error', details: err.message });
  }
    }
    
