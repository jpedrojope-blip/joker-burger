'use strict';

const { getSession } = require('../lib/admin-auth');
const cloudStore = require('../lib/cloud-store');

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

const normalizeOrderPayload = payload => ({
  customer: {
    name: String(payload.customer?.name || '').trim().slice(0, 120),
    phone: String(payload.customer?.phone || '').trim().slice(0, 40)
  },
  fulfillment: payload.fulfillment === 'pickup' ? 'pickup' : 'delivery',
  address: {
    address: String(payload.address?.address || '').trim().slice(0, 240),
    neighborhood: String(payload.address?.neighborhood || '').trim().slice(0, 120),
    reference: String(payload.address?.reference || '').trim().slice(0, 240)
  },
  payment: String(payload.payment || '').trim().slice(0, 40),
  change: String(payload.change || '').trim().slice(0, 40),
  note: String(payload.note || '').trim().slice(0, 500),
  items: Array.isArray(payload.items) ? payload.items.slice(0, 50) : [],
  subtotal: Number(payload.subtotal) || 0,
  deliveryFee: Number(payload.deliveryFee) || 0,
  total: Number(payload.total) || 0
});

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const payload = normalizeOrderPayload(parseBody(req.body));
      if (!payload.customer.name || !payload.customer.phone || !payload.items.length) {
        return res.status(400).json({ error: 'Customer and order details are required.' });
      }
      const order = await cloudStore.createOrder(payload);
      return res.status(201).json(order);
    }

    const orderId = String(req.query?.id || '').trim();
    if (req.method === 'GET' && orderId) {
      const order = await cloudStore.getOrder(orderId);
      return order
        ? res.status(200).json(order)
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
