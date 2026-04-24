/**
 * YouAreVeganFit Auth Worker
 * Routes:
 *   POST   /api/login
 *   POST   /api/logout
 *   GET    /api/verify
 *   GET    /api/admin/users          (admin only)
 *   POST   /api/admin/users          (admin only)
 *   PATCH  /api/admin/users/:name    (admin only)
 *   DELETE /api/admin/users/:name    (admin only)
 */

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
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

async function generateToken(bytes = 32) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return bytesToHex(buf);
}

function hexToBytes(hex) {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) b[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return b;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---- Cookie helpers ----

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) out[k.trim()] = v.join('=').trim();
  }
  return out;
}

function setCookie(token, maxAge) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

// ---- Response helpers ----

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ---- Session helpers ----

async function getSession(request, env) {
  const token = parseCookies(request.headers.get('Cookie'))[COOKIE_NAME];
  if (!token) return null;
  const session = await env.DB.prepare(
    'SELECT username, role, expires_at FROM sessions WHERE token = ?'
  ).bind(token).first();
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }
  return session;
}

// ---- Handlers ----

async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { username, password } = body;
  if (!username || !password) return json({ error: 'Username and password required' }, 400);

  const user = await env.DB.prepare(
    'SELECT password_hash, salt, role, active FROM users WHERE username = ?'
  ).bind(username.toLowerCase().trim()).first();

  if (!user || !user.active) return json({ error: 'Invalid credentials' }, 401);

  const hash = await pbkdf2Hash(password, user.salt);
  if (hash !== user.password_hash) return json({ error: 'Invalid credentials' }, 401);

  const token = await generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString();
  await env.DB.prepare(
    'INSERT INTO sessions (token, username, role, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(token, username.toLowerCase().trim(), user.role, expiresAt).run();

  const origin = request.headers.get('Origin');
  return json(
    { ok: true, username: username.toLowerCase().trim(), role: user.role },
    200,
    { 'Set-Cookie': setCookie(token, SESSION_TTL), ...cors(origin) }
  );
}

async function handleLogout(request, env) {
  const token = parseCookies(request.headers.get('Cookie'))[COOKIE_NAME];
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  return json({ ok: true }, 200, { 'Set-Cookie': setCookie('', 0), ...cors(request.headers.get('Origin')) });
}

async function handleVerify(request, env) {
  const session = await getSession(request, env);
  if (!session) return json({ authenticated: false }, 401);
  return json({ authenticated: true, username: session.username, role: session.role });
}

// ---- Admin: list users ----

async function handleAdminListUsers(request, env, session) {
  if (session.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { results } = await env.DB.prepare(
    'SELECT username, role, active, created_at FROM users ORDER BY created_at DESC'
  ).all();
  return json({ users: results });
}

// ---- Admin: create user ----

async function handleAdminCreateUser(request, env, session) {
  if (session.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { username, password, role } = body;
  if (!username || !password) return json({ error: 'Username and password required' }, 400);
  if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);
  if (!['admin', 'client'].includes(role)) return json({ error: 'Invalid role' }, 400);

  const salt = await generateToken(16);
  const hash = await pbkdf2Hash(password, salt);

  try {
    await env.DB.prepare(
      'INSERT INTO users (username, password_hash, salt, role) VALUES (?, ?, ?, ?)'
    ).bind(username.toLowerCase().trim(), hash, salt, role).run();
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) return json({ error: 'Username already exists' }, 409);
    return json({ error: 'Failed to create user' }, 500);
  }

  return json({ ok: true });
}

// ---- Admin: toggle active ----

async function handleAdminToggleUser(request, env, session, username) {
  if (session.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  if (username === session.username) return json({ error: 'Cannot deactivate yourself' }, 400);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const active = body.active ? 1 : 0;
  await env.DB.prepare('UPDATE users SET active = ? WHERE username = ?').bind(active, username).run();
  return json({ ok: true });
}

// ---- Admin: delete user ----

async function handleAdminDeleteUser(request, env, session, username) {
  if (session.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  if (username === session.username) return json({ error: 'Cannot delete yourself' }, 400);

  await env.DB.prepare('DELETE FROM sessions WHERE username = ?').bind(username).run();
  await env.DB.prepare('DELETE FROM users WHERE username = ?').bind(username).run();
  return json({ ok: true });
}

// ---- Main ----

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    // Public routes
    if (pathname === '/api/login' && request.method === 'POST') return handleLogin(request, env);
    if (pathname === '/api/logout' && request.method === 'POST') return handleLogout(request, env);
    if (pathname === '/api/verify' && request.method === 'GET') return handleVerify(request, env);

    // Protected admin routes — require session
    if (pathname.startsWith('/api/admin/')) {
      const session = await getSession(request, env);
      if (!session) return json({ error: 'Unauthorized' }, 401);

      if (pathname === '/api/admin/users') {
        if (request.method === 'GET') return handleAdminListUsers(request, env, session);
        if (request.method === 'POST') return handleAdminCreateUser(request, env, session);
      }

      const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
      if (userMatch) {
        const username = decodeURIComponent(userMatch[1]);
        if (request.method === 'PATCH') return handleAdminToggleUser(request, env, session, username);
        if (request.method === 'DELETE') return handleAdminDeleteUser(request, env, session, username);
      }
    }

    return json({ error: 'Not found' }, 404);
  }
};
