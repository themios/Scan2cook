const bcrypt = require('bcryptjs');
const { dbGet, dbSet } = require('./_db');
const {
  normalizeEmail,
  signAuthToken,
  getTokenFromReq,
  verifyAuthToken,
} = require('./_auth');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function jsonResponse(res, status, payload) {
  res.status(status).json(payload);
}

function userByEmailKey(email) {
  return `scan2cook:user:email:${email}`;
}

function userByIdKey(userId) {
  return `scan2cook:user:id:${userId}`;
}

function validateCredentials(email, password) {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    createdAt: user.createdAt,
  };
}

async function register(payload) {
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || '');
  const name = String(payload?.name || '').trim().slice(0, 60);

  validateCredentials(email, password);

  const existing = await dbGet(userByEmailKey(email));
  if (existing) {
    throw new Error('Account already exists for this email.');
  }

  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id,
    email,
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await dbSet(userByIdKey(id), user);
  await dbSet(userByEmailKey(email), { id });

  const token = signAuthToken(user);
  return { token, user: publicUser(user) };
}

async function login(payload) {
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || '');
  validateCredentials(email, password);

  const lookup = await dbGet(userByEmailKey(email));
  if (!lookup?.id) {
    throw new Error('Invalid email or password.');
  }

  const user = await dbGet(userByIdKey(lookup.id));
  if (!user?.passwordHash) {
    throw new Error('Account record is invalid.');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new Error('Invalid email or password.');
  }

  const token = signAuthToken(user);
  return { token, user: publicUser(user) };
}

async function me(req) {
  const token = getTokenFromReq(req);
  const claims = verifyAuthToken(token);
  if (!claims?.userId) {
    throw new Error('Not authenticated.');
  }

  const user = await dbGet(userByIdKey(claims.userId));
  if (!user) {
    throw new Error('User not found.');
  }

  return { user: publicUser(user) };
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    jsonResponse(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, payload } = body || {};

    if (action === 'register') {
      const data = await register(payload);
      jsonResponse(res, 200, { data });
      return;
    }

    if (action === 'login') {
      const data = await login(payload);
      jsonResponse(res, 200, { data });
      return;
    }

    if (action === 'me') {
      const data = await me(req);
      jsonResponse(res, 200, { data });
      return;
    }

    jsonResponse(res, 400, { error: 'Unknown action' });
  } catch (error) {
    jsonResponse(res, 400, {
      error: error instanceof Error ? error.message : 'Request failed',
    });
  }
};
