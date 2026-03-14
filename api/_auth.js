const jwt = require('jsonwebtoken');

const JWT_EXPIRY = '30d';

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error('Server is missing AUTH_JWT_SECRET.');
  }
  return secret;
}

function signAuthToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name || '',
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRY }
  );
}

function getTokenFromReq(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

function verifyAuthToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

module.exports = {
  normalizeEmail,
  signAuthToken,
  getTokenFromReq,
  verifyAuthToken,
};
