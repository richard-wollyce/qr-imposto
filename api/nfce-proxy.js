const ALLOWED_HOSTS = new Set(['www.nfce.fazenda.sp.gov.br']);
const BODY_LIMIT_BYTES = 8 * 1024;
const FETCH_TIMEOUT_MS = 15000;
const MAX_RESPONSE_BYTES = 1024 * 1024;

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch {
    response.status(400).json({ error: 'invalid_request' });
    return;
  }

  const rawUrl = typeof body?.url === 'string' ? body.url.trim() : '';

  let targetUrl;
  try {
    targetUrl = validateTargetUrl(rawUrl);
  } catch {
    response.status(400).json({ error: 'unsupported_nfce_url' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetchAllowedUrl(targetUrl, controller.signal);

    if (!upstream.ok) {
      response.status(502).json({ error: 'nfce_public_page_unavailable' });
      return;
    }

    const pageText = await readLimitedText(upstream);
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.status(200).send(pageText);
  } catch {
    response.status(502).json({ error: 'nfce_proxy_failed' });
  } finally {
    clearTimeout(timeout);
  }
};

async function fetchAllowedUrl(targetUrl, signal, redirectsLeft = 3) {
  const upstream = await fetch(targetUrl.toString(), {
    redirect: 'manual',
    signal,
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'QR-Imposto-MVP/1.0',
    },
  });

  if (upstream.status >= 300 && upstream.status < 400) {
    if (redirectsLeft <= 0) {
      throw new Error('too_many_redirects');
    }

    const location = upstream.headers.get('location');
    if (!location) {
      throw new Error('redirect_without_location');
    }

    return fetchAllowedUrl(validateTargetUrl(new URL(location, targetUrl).toString()), signal, redirectsLeft - 1);
  }

  return upstream;
}

function validateTargetUrl(input) {
  if (input.length < 12 || input.length > 4096) {
    throw new Error('invalid_url_length');
  }

  const targetUrl = new URL(input);

  if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') {
    throw new Error('invalid_protocol');
  }

  if (targetUrl.username || targetUrl.password || targetUrl.port) {
    throw new Error('unsupported_url_authority');
  }

  if (!ALLOWED_HOSTS.has(targetUrl.hostname.toLowerCase())) {
    throw new Error('unsupported_host');
  }

  return targetUrl;
}

async function readJsonBody(request) {
  if (typeof request.body === 'object' && request.body !== null) {
    return request.body;
  }

  if (typeof request.body === 'string') {
    if (Buffer.byteLength(request.body, 'utf8') > BODY_LIMIT_BYTES) {
      throw new Error('body_too_large');
    }

    return JSON.parse(request.body);
  }

  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > BODY_LIMIT_BYTES) {
      throw new Error('body_too_large');
    }

    chunks.push(buffer);
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function readLimitedText(upstream) {
  if (!upstream.body?.getReader) {
    const text = await upstream.text();

    if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES) {
      throw new Error('response_too_large');
    }

    return text;
  }

  const reader = upstream.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > MAX_RESPONSE_BYTES) {
      throw new Error('response_too_large');
    }

    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks).toString('utf8');
}
