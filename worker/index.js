/**
 * YouAreVeganFit Auth Worker
 * Handles: POST /api/login, POST /api/logout, GET /api/verify
 * Protects: all non-login static assets via cookie session
 */

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days in seconds
const COOKIE_NAME = 'yavf_session';

// ---- Crypto helpers ----

async function pbkdf2Hash(password, saltHex) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const salt = hexToBytes(saltHex);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 },
    keyMaterial, 256
  );
  return bytesToHex(new Uint8Array(bits));
}

async function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---- Cookie helpers ----

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) cookies[k.trim()] = v.join('=').trim();
  }
  return cookies;
}

function setCookieHeader(token, maxAge) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

// ---- CORS headers ----

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

// ---- Route handlers ----

async function handleLogin(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { username, password } = body;
  if (!username || !password) {
    return json({ error: 'Username and password required' }, 400);
  }

  // Look up user
  const result = await env.DB.prepare(
    'SELECT password_hash, salt, role, active FROM users WHERE username = ?'
  ).bind(username.toLowerCase().trim()).first();

  if (!result || !result.active) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  // Verify password
  const hash = await pbkdf2Hash(password, result.salt);
  if (hash !== result.password_hash) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  // Create session
  const token = await generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString();

  await env.DB.prepare(
    'INSERT INTO sessions (token, username, role, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(token, username.toLowerCase().trim(), result.role, expiresAt).run();

  const origin = request.headers.get('Origin');
  return json(
    { ok: true, username: username.toLowerCase().trim(), role: result.role },
    200,
    { 'Set-Cookie': setCookieHeader(token, SESSION_TTL), ...corsHeaders(origin) }
  );
}

async function handleLogout(request, env) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies[COOKIE_NAME];

  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }

  const origin = request.headers.get('Origin');
  return json(
    { ok: true },
    200,
    { 'Set-Cookie': setCookieHeader('', 0), ...corsHeaders(origin) }
  );
}

async function handleVerify(request, env) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies[COOKIE_NAME];

  if (!token) {
    return json({ authenticated: false }, 401);
  }

  const session = await env.DB.prepare(
    'SELECT username, role, expires_at FROM sessions WHERE token = ?'
  ).bind(token).first();

  if (!session) {
    return json({ authenticated: false }, 401);
  }

  if (new Date(session.expires_at) < new Date()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return json({ authenticated: false }, 401);
  }

  return json({ authenticated: true, username: session.username, role: session.role });
}

// ---- Main fetch handler ----

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });
    }

    // API routes
    if (pathname === '/api/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }
    if (pathname === '/api/logout' && request.method === 'POST') {
      return handleLogout(request, env);
    }
    if (pathname === '/api/verify' && request.method === 'GET') {
      return handleVerify(request, env);
    }

    return json({ error: 'Not found' }, 404);
  }
};
