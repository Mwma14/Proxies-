export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Expose-Headers",
    "Content-Length, Content-Range, Content-Type, Accept-Ranges");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Forward Range header for seek support
  const headers = {};
  if (req.headers.range) {
    headers["Range"] = req.headers.range;
  }

  const upstream = await fetch(targetUrl, { headers, redirect: "follow" });

  // Forward relevant headers
  const ct = upstream.headers.get("content-type");
  if (ct) res.setHeader("Content-Type", ct);

  const cl = upstream.headers.get("content-length");
  if (cl) res.setHeader("Content-Length", cl);

  const cr = upstream.headers.get("content-range");
  if (cr) res.setHeader("Content-Range", cr);

  const ar = upstream.headers.get("accept-ranges");
  if (ar) res.setHeader("Accept-Ranges", ar);

  res.status(upstream.status);

  // Pipe the video stream
  const reader = upstream.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}
