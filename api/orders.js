'use strict';

const { getSession } = require('../lib/admin-auth');
const cloudStore = require('../lib/cloud-store');
const defaultMenu = require('../cardapio-data');

const statusValues = new Set([
  'received',
  'approved',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'rejected',
  'cancelled'
]);

const sendError = (res, error) => {
  if (error?.code === 'STORAGE_NOT_CONFIGURED') {
    return res.status(503).json({ error: 'Persistent storage is not configured.' });
  }
  console.error(error);
  return res.status(500).json({ error: 'Could not access orders.' });
};

const requireAdmin = (req, res) => {
  if (!getSession(req)) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return false;
  }
  return true;
};

const parseBody = body => {
  if (!body) return {};
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
};

const normalizeItem = item => {
  const source = item && typeof item === 'object' ? item : {};
  return {
    name: String(source.name || '').trim().slice(0, 200),
    category: String(source.category || '').trim().slice(0, 160),
    image: String(source.image || '').trim().slice(0, 500),
    basePrice: Number(source.basePrice),
    unitPrice: Number(source.unitPrice),
    quantity: Number(source.quantity),
    options: Array.isArray(source.options)
      ? source.options.slice(0, 20).map(option => ({
        name: String(option?.name || '').trim().slice(0, 120),
        price: Number(option?.price)
      }))
      : []
  };
};

const normalizeOrderPayload = payload => {
  const source = payload && typeof payload === 'object' ? payload : {};
  return {
    customer: {
      name: String(source.customer?.name || '').trim().slice(0, 120),
      phone: String(source.customer?.phone || '').trim().slice(0, 40)
    },
    fulfillment: source.fulfillment === 'pickup' ? 'pickup' : 'delivery',
    address: {
      address: String(source.address?.address || '').trim().slice(0, 240),
      neighborhood: String(source.address?.neighborhood || '').trim().slice(0, 120),
      reference: String(source.address?.reference || '').trim().slice(0, 240)
    },
    payment: String(source.payment || '').trim().slice(0, 40),
    change: String(source.change || '').trim().slice(0, 40),
    note: String(source.note || '').trim().slice(0, 500),
    items: Array.isArray(source.items) ? source.items.slice(0, 50).map(normalizeItem) : [],
    subtotal: Number(source.subtotal) || 0,
    deliveryFee: Number(source.deliveryFee) || 0,
    total: Number(source.total) || 0
  };
};

const isMoney = value => Number.isFinite(value) && value >= 0 && value <= 1000000;

const parseCatalogPrice = value => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const raw = String(value ?? '').replace(/[^\d,.-]/g, '');
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const catalogPriceMap = menu => {
  const prices = new Map();
  for (const category of menu?.categories || []) {
    for (const item of category.items || []) {
      const price = parseCatalogPrice(item.price);
      if (item.name && Number.isFinite(price)) prices.set(String(item.name), price);
    }
  }
  return prices;
};

const validateCatalogPrices = (payload, menu) => {
  const prices = catalogPriceMap(menu);
  for (const item of payload.items) {
    const basePrice = prices.get(item.name);
    if (!Number.isFinite(basePrice)) return 'One or more products are no longer available.';
    const optionsTotal = item.options.reduce((total, option) => {
      const optionPrice = prices.get(option.name);
      if (!Number.isFinite(optionPrice)) return NaN;
      return total + optionPrice;
    }, 0);
    if (!Number.isFinite(optionsTotal) || Math.abs(item.unitPrice - (basePrice + optionsTotal)) > 0.01) {
      return 'One or more product prices are no longer current.';
    }
  }
  return null;
};

const validateOrderPayload = async payload => {
  if (!payload.customer.name || !payload.customer.phone || !payload.items.length) {
    return 'Customer and order details are required.';
  }
  if (payload.customer.name.length > 120 || payload.customer.phone.length > 40) {
    return 'Customer details are invalid.';
  }
  if (!isMoney(payload.subtotal) || !isMoney(payload.deliveryFee) || !isMoney(payload.total)) {
    return 'Order totals are invalid.';
  }

  let calculatedSubtotal = 0;
  for (const item of payload.items) {
    if (!item.name || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) {
      return 'Order items are invalid.';
    }
    if (!isMoney(item.unitPrice) || item.unitPrice > 100000) return 'Order item prices are invalid.';
    if (item.options.some(option => !option.name || !isMoney(option.price))) {
      return 'Order options are invalid.';
    }
    calculatedSubtotal += item.unitPrice * item.quantity;
  }

  if (Math.abs(calculatedSubtotal - payload.subtotal) > 0.01) {
    return 'Order subtotal does not match its items.';
  }

  const menu = await cloudStore.getMenu() || defaultMenu;
  const catalogError = validateCatalogPrices(payload, menu);
  if (catalogError) return catalogError;

  const settings = await cloudStore.getSettings();
  const configuredDeliveryFee = payload.fulfillment === 'delivery'
    ? Number(settings.deliveryFee || 0)
    : 0;
  if (!isMoney(configuredDeliveryFee) || Math.abs(payload.deliveryFee - configuredDeliveryFee) > 0.01) {
    return 'Delivery fee is no longer current.';
  }
  if (Math.abs(payload.total - (payload.subtotal + payload.deliveryFee)) > 0.01) {
    return 'Order total does not match its items.';
  }

  return null;
};

const toPublicOrder = order => ({
  id: order.id,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  status: order.status,
  fulfillment: order.fulfillment,
  items: (Array.isArray(order.items) ? order.items : []).map(item => ({
    name: String(item.name || '').slice(0, 200),
    quantity: Number(item.quantity) || 0
  })),
  subtotal: Number(order.subtotal) || 0,
  deliveryFee: Number(order.deliveryFee) || 0,
  total: Number(order.total) || 0
});

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const payload = normalizeOrderPayload(parseBody(req.body));
      const validationError = await validateOrderPayload(payload);
      if (validationError) return res.status(400).json({ error: validationError });
      const order = await cloudStore.createOrder(payload);
      return res.status(201).json(order);
    }

    const orderId = String(req.query?.id || '').trim();
    if (req.method === 'GET' && orderId) {
      const order = await cloudStore.getOrder(orderId);
      return order
        ? res.status(200).json(toPublicOrder(order))
        : res.status(404).json({ error: 'Order not found.' });
    }

    if (req.method === 'GET') {
      if (!requireAdmin(req, res)) return;
      return res.status(200).json({ orders: await cloudStore.listOrders() });
    }

    if (!requireAdmin(req, res)) return;
    const body = parseBody(req.body);
    const targetId = String(body.id || '').trim();
    if (!targetId) return res.status(400).json({ error: 'Order id is required.' });

    if (req.method === 'PATCH') {
      const updates = {};
      if (body.status && statusValues.has(body.status)) updates.status = body.status;
      if (body.approvedAt) updates.approvedAt = String(body.approvedAt);
      if (body.rejectedAt) updates.rejectedAt = String(body.rejectedAt);
      if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid updates provided.' });
      const order = await cloudStore.updateOrder(targetId, updates);
      return order
        ? res.status(200).json(order)
        : res.status(404).json({ error: 'Order not found.' });
    }

    if (req.method === 'DELETE') {
      const deleted = await cloudStore.deleteOrder(targetId);
      return deleted
        ? res.status(200).json({ deleted: true })
        : res.status(404).json({ error: 'Order not found.' });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return sendError(res, error);
  }
};
