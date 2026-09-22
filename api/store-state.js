'use strict';

const { getSession } = require('../lib/admin-auth');
const cloudStore = require('../lib/cloud-store');

const parseBody = body => {
  if (!body) return {};
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
};

const sendError = (res, error) => {
  if (error?.code === 'STORAGE_NOT_CONFIGURED') {
    return res.status(503).json({ error: 'Persistent storage is not configured.' });
  }
  console.error(error);
  return res.status(500).json({ error: 'Could not access store configuration.' });
};

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const [settings, menu] = await Promise.all([
        cloudStore.getSettings(),
        cloudStore.getMenu()
      ]);
      return res.status(200).json({ settings, menu });
    }

    if (req.method !== 'PATCH') {
      res.setHeader('Allow', 'GET, PATCH');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!getSession(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    const body = parseBody(req.body);
    const result = {};
    if (body.settings && typeof body.settings === 'object') result.settings = await cloudStore.saveSettings(body.settings);
    if (body.menu && Array.isArray(body.menu.categories)) result.menu = await cloudStore.saveMenu(body.menu);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
};
