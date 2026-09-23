'use strict';

const crypto = require('node:crypto');

const ORDERS_INDEX_KEY = 'joker:orders:index:v1';
const ORDER_KEY_PREFIX = 'joker:order:v1:';
const SETTINGS_KEY = 'joker:settings:v1';
const MENU_KEY = 'joker:menu:v1';

const defaultSettings = {
  storeName: 'Joker Burger e Beer',
  open: true,
  deliveryFee: 6,
  minimumOrder: 0,
  deliveryCost: 0,
  estimatedTime: '35–50 min',
  address: 'Rua Comandante Vergueiro da Cruz, 584 — Japi da Penha'
};

const storageConfigured = () => Boolean(
  (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)
  && (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
);

const storageUrl = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const storageToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const assertStorage = () => {
  if (!storageConfigured()) {
    const error = new Error('Persistent storage is not configured.');
    error.code = 'STORAGE_NOT_CONFIGURED';
    throw error;
  }
};

const redisCommand = async (...parts) => {
  assertStorage();
  const response = await fetch(storageUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${storageToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parts)
  });

  let result;
  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok || result.error) {
    const error = new Error(result.error || `Storage request failed with ${response.status}.`);
    error.code = 'STORAGE_REQUEST_FAILED';
    throw error;
  }

  return result.result;
};

const parseJSON = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const orderKey = orderId => `${ORDER_KEY_PREFIX}${orderId}`;

const listOrders = async () => {
  const ids = await redisCommand('ZREVRANGE', ORDERS_INDEX_KEY, '0', '-1');
  if (!Array.isArray(ids) || !ids.length) return [];
  const values = await redisCommand('MGET', ...ids.map(orderKey));
  return values.map(value => parseJSON(value, null)).filter(Boolean);
};

const getOrder = async orderId => parseJSON(await redisCommand('GET', orderKey(orderId)), null);

const createOrder = async payload => {
  const order = {
    id: `joker-${crypto.randomBytes(16).toString('hex')}`.toUpperCase(),
    createdAt: new Date().toISOString(),
    status: 'received',
    ...payload
  };

  await redisCommand('SET', orderKey(order.id), JSON.stringify(order));
  await redisCommand('ZADD', ORDERS_INDEX_KEY, String(Date.parse(order.createdAt)), order.id);
  return order;
};

const updateOrder = async (orderId, updates) => {
  const current = await getOrder(orderId);
  if (!current) return null;
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  await redisCommand('SET', orderKey(orderId), JSON.stringify(updated));
  return updated;
};

const deleteOrder = async orderId => {
  const existing = await getOrder(orderId);
  if (!existing) return false;
  await redisCommand('DEL', orderKey(orderId));
  await redisCommand('ZREM', ORDERS_INDEX_KEY, orderId);
  return true;
};

const getSettings = async () => ({
  ...defaultSettings,
  ...parseJSON(await redisCommand('GET', SETTINGS_KEY), {})
});

const saveSettings = async settings => {
  const next = { ...defaultSettings, ...(settings || {}) };
  await redisCommand('SET', SETTINGS_KEY, JSON.stringify(next));
  return next;
};

const getMenu = async () => parseJSON(await redisCommand('GET', MENU_KEY), null);

const saveMenu = async menu => {
  await redisCommand('SET', MENU_KEY, JSON.stringify(menu));
  return menu;
};

module.exports = {
  createOrder,
  deleteOrder,
  getMenu,
  getOrder,
  getSettings,
  listOrders,
  saveMenu,
  saveSettings,
  storageConfigured,
  updateOrder
};
