'use strict';

const { cookieOptions } = require('../lib/admin-auth');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', cookieOptions(req));
  return res.status(200).json({ authenticated: false });
};
