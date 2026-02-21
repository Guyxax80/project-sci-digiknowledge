// config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error('Missing SUPABASE_URL');
if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

const redact = (value) => {
  const s = String(value || '');
  if (!s) return '<empty>';
  if (s.length <= 8) return `${s[0]}***`;
  return `${s.slice(0, 4)}***${s.slice(-4)}`;
};

const hasHeader = (headers, name) => {
  if (!headers) return false;

  if (typeof headers.get === 'function') {
    return Boolean(headers.get(name));
  }

  if (Array.isArray(headers)) {
    return headers.some(([k, v]) => String(k).toLowerCase() === name.toLowerCase() && Boolean(v));
  }

  if (typeof headers === 'object') {
    return Object.entries(headers).some(([k, v]) => String(k).toLowerCase() === name.toLowerCase() && Boolean(v));
  }

  return false;
};

const parseBodyFromText = (text) => {
  if (!text || !String(text).trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

let parsedSupabaseUrl;
try {
  parsedSupabaseUrl = new URL(supabaseUrl);
} catch {
  throw new Error(`Invalid SUPABASE_URL format: ${supabaseUrl}`);
}

console.log('[supabase] init', {
  origin: parsedSupabaseUrl.origin,
  hasServiceRoleKey: Boolean(serviceKey),
  serviceRoleKeyPreview: redact(serviceKey),
});

const loggingFetch = async (input, init) => {
  const requestUrl = typeof input === 'string' ? input : input?.url;
  const method = init?.method || 'GET';
  const hasAuthorization = hasHeader(init?.headers, 'authorization');
  const hasApikey = hasHeader(init?.headers, 'apikey');

  if (requestUrl?.includes('/storage/v1/object')) {
    console.log('[supabase] storage request', {
      method,
      fullUrl: requestUrl,
      hasAuthorizationHeader: hasAuthorization,
      hasApikeyHeader: hasApikey,
    });
  }

  const response = await fetch(input, init);

  if (!response.ok) {
    const bodyText = await response.clone().text();
    const parsedBody = parseBodyFromText(bodyText);

    console.error('[supabase] non-ok response', {
      method,
      url: requestUrl,
      status: response.status,
      contentType: response.headers.get('content-type'),
      hasAuthorizationHeader: hasAuthorization,
      hasApikeyHeader: hasApikey,
      bodyPreview: bodyText.slice(0, 300),
    });

    if (!parsedBody) {
      return new Response(
        JSON.stringify({
          message: 'Supabase upstream returned non-JSON body',
          statusCode: response.status,
          upstreamBodyPreview: bodyText.slice(0, 300),
          url: requestUrl,
        }),
        {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'content-type': 'application/json',
          },
        },
      );
    }
  }

  return response;
};

module.exports = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
  global: { fetch: loggingFetch },
});