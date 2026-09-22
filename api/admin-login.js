'use strict';

const { credentialsMatch, createToken, isConfigured, sessionCookie } = require('../lib/admin-auth');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isConfigured()) {
    return res.status(503).json({ error: 'Admin authentication is not configured.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const username = String(body.username || '');
  const password = String(body.password || '');
  if (!credentialsMatch(username, password)) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  res.setHeader('Set-Cookie', sessionCookie(req, createToken()));
  return res.status(200).json({ authenticated: true });
};
