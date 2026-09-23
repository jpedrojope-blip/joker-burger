'use strict';

const crypto = require('node:crypto');

const COOKIE_NAME = 'joker_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const getConfig = () => ({
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
  secret: process.env.ADMIN_SESSION_SECRET
});

const isConfigured = () => {
  const config = getConfig();
  return Boolean(config.username && config.password && config.secret);
};

const encode = value => Buffer.from(value).toString('base64url');
const decode = value => Buffer.from(value, 'base64url').toString('utf8');

const sign = value => crypto
  .createHmac('sha256', getConfig().secret)
  .update(value)
  .digest('base64url');

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const credentialsMatch = (username, password) => {
  const config = getConfig();
  if (!isConfigured()) return false;
  return safeEqual(username, config.username) && safeEqual(password, config.password);
};

const createToken = () => {
  const payload = encode(JSON.stringify({
    sub: getConfig().username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(16).toString('hex')
  }));
  return `${payload}.${sign(payload)}`;
};

const parseCookies = header => String(header || '').split(';').reduce((cookies, part) => {
  const separator = part.indexOf('=');
  if (separator < 0) return cookies;
  const key = part.slice(0, separator).trim();
  const value = part.slice(separator + 1).trim();
  try {
    cookies[key] = decodeURIComponent(value);
  } catch {
    // Ignore malformed cookies instead of turning a bad client header into a 500.
  }
  return cookies;
}, {});

const getSession = req => {
  if (!isConfigured()) return null;
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  try {
    const session = JSON.parse(decode(payload));
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    if (!safeEqual(session.sub, getConfig().username)) return null;
    return session;
  } catch {
    return null;
  }
};

const cookieOptions = req => {
  const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  return [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
    secure ? 'Secure' : ''
  ].filter(Boolean).join('; ');
};

const sessionCookie = (req, token) => {
  const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${SESSION_TTL_SECONDS}`,
    secure ? 'Secure' : ''
  ].filter(Boolean).join('; ');
};

module.exports = {
  COOKIE_NAME,
  cookieOptions,
  credentialsMatch,
  createToken,
  getSession,
  isConfigured,
  sessionCookie
};
