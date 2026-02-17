export const config = {
  api: {
    bodyParser: false,
  },
};

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, content-profile, accept, accept-profile, prefer, range, x-supabase-api-version",
  "Access-Control-Expose-Headers": "content-range, x-supabase-api-version",
};

export default async function handler(req, res) {
  const targetUrl =
    "https://icnfjixjohbxjxqbnnac.supabase.co" + req.url;

  // Handle preflight
  if (req.method === "OPTIONS") {
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    return res.status(204).end();
  }

  // Forward selected headers only
  const headers = {};
  const forwardList = [
    "authorization", "apikey", "content-type", "content-profile",
    "accept", "accept-profile", "prefer", "range", "x-client-info",
  ];
  for (const key of forwardList) {
    if (req.headers[key]) headers[key] = req.headers[key];
  }

  // Read raw body for POST/PUT/PATCH
  let body = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await readBody(req);
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const data = await response.text();

    // Only forward safe response headers (NOT all of them)
    const safeHeaders = ["content-type", "content-range", "x-supabase-api-version"];
    for (const key of safeHeaders) {
      const val = response.headers.get(key);
      if (val) res.setHeader(key, val);
    }

    // Always set CORS last so they can't be overwritten
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);

    res.status(response.status).send(data);
  } catch (err) {
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    res.status(502).json({ error: "Proxy error", details: err.message });
  }
  }
