// api/stream.js

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
    'Access-Control-Expose-Headers':
      'Content-Length, Content-Range, Content-Type, Accept-Ranges',
  };

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
    const upstreamHeaders = {};

    const range = req.headers.get('range');
    if (range) {
      upstreamHeaders['Range'] = range;
    }

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

    const responseHeaders = { ...corsHeaders };

    const contentType = upstream.headers.get('content-type');
    responseHeaders['Content-Type'] = contentType || 'application/octet-stream';

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) responseHeaders['Content-Length'] = contentLength;

    const contentRange = upstream.headers.get('content-range');
    if (contentRange) responseHeaders['Content-Range'] = contentRange;

    // Always advertise byte-range support so the browser enables seeking
    responseHeaders['Accept-Ranges'] = 'bytes';

    return new Response(upstream.body, {
      status: upstream.status,
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
