export default async function handler(req, res) {
  const targetUrl = "https://icnfjixjohbxjxqbnnac.supabase.co" + req.url;

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type, content-profile, accept, accept-profile, prefer, range, x-supabase-api-version");
  res.setHeader("Access-Control-Expose-Headers", "content-range, x-supabase-api-version");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Forward headers
  const headers = {};
  for (const key of ["authorization", "apikey", "content-type", "content-profile", "accept", "accept-profile", "prefer", "range", "x-client-info"]) {
    if (req.headers[key]) headers[key] = req.headers[key];
  }

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
  });

  const data = await response.text();
  
  // Forward response headers
  for (const [key, value] of response.headers.entries()) {
    try { res.setHeader(key, value); } catch(e) {}
  }
  
  // Re-set CORS (in case overwritten)
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  res.status(response.status).send(data);
  }
