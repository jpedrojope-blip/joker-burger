'use strict';

const { getSession, isConfigured } = require('../lib/admin-auth');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isConfigured()) {
    return res.status(503).json({ authenticated: false, error: 'Admin authentication is not configured.' });
  }

  return res.status(200).json({ authenticated: Boolean(getSession(req)) });
};
