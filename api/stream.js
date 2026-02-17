export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS, HEAD",
  "Access-Control-Allow-Headers": "range, content-type",
  "Access-Control-Expose-Headers": "content-range, content-length, accept-ranges, content-type",
};

export default async function handler(req, res) {
  const path = req.url.replace(/^\/stream/, "");
  const targetUrl = "https://tw.thewayofthedragg.workers.dev" + path;

  if (req.method === "OPTIONS") {
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    return res.status(204).end();
  }

  const headers = {};
  if (req.headers["range"]) headers["Range"] = req.headers["range"];
  if (req.headers["user-agent"]) headers["User-Agent"] = req.headers["user-agent"];

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      redirect: "follow",
    });

    const forwardHeaders = [
      "content-type", "content-length", "content-range",
      "accept-ranges", "content-disposition",
    ];
    for (const key of forwardHeaders) {
      const val = response.headers.get(key);
      if (val) res.setHeader(key, val);
    }

    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);

    const data = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    res.status(502).json({ error: "Stream proxy error", details: err.message });
  }
}
