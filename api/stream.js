// api/stream.js
// Deploy this to your proxies-lake Vercel project

export const config = {
  runtime: 'edge', // Use Edge Runtime for streaming support
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
    'Access-Control-Expose-Headers':
      'Content-Length, Content-Range, Content-Type, Accept-Ranges',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Build upstream request headers
    const upstreamHeaders = {};

    // Forward Range header for seeking / resume
    const range = req.headers.get('range');
    if (range) {
      upstreamHeaders['Range'] = range;
    }

    // Fetch the actual video
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: upstreamHeaders,
      redirect: 'follow',
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(
        JSON.stringify({ error: `Upstream returned ${upstream.status}` }),
        {
          status: upstream.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build response headers
    const responseHeaders = { ...corsHeaders };

    const contentType = upstream.headers.get('content-type');
    responseHeaders['Content-Type'] = contentType || 'application/octet-stream';

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) responseHeaders['Content-Length'] = contentLength;

    const contentRange = upstream.headers.get('content-range');
    if (contentRange) responseHeaders['Content-Range'] = contentRange;

    const acceptRanges = upstream.headers.get('accept-ranges');
    if (acceptRanges) responseHeaders['Accept-Ranges'] = acceptRanges;

    // Stream the video body through
    return new Response(upstream.body, {
      status: upstream.status, // 200 or 206
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Proxy fetch failed' }),
      {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
      }
