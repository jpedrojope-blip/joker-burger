(function () {
  'use strict';

  const MENU_KEY = 'joker-menu-catalog-v1';
  const ORDERS_KEY = 'joker-orders-v1';
  const SETTINGS_KEY = 'joker-store-settings-v1';
  const CART_KEY = 'joker-menu-cart-v1';

  const clone = value => JSON.parse(JSON.stringify(value));

  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('joker-store-change', { detail: { key } }));
  };

  const defaultSettings = {
    storeName: 'Joker Burger e Beer',
    open: true,
    deliveryFee: 6,
    minimumOrder: 0,
    deliveryCost: 0,
    estimatedTime: '35–50 min',
    address: 'Rua Comandante Vergueiro da Cruz, 584 — Japi da Penha'
  };

  const getMenu = () => {
    const base = window.JOKER_MENU;
    const saved = read(MENU_KEY, null);
    return saved?.categories ? saved : clone(base);
  };

  const saveMenu = menu => write(MENU_KEY, clone(menu));

  const getSettings = () => ({ ...defaultSettings, ...read(SETTINGS_KEY, {}) });

  const saveSettings = settings => write(SETTINGS_KEY, { ...getSettings(), ...settings });

  const getOrders = () => read(ORDERS_KEY, []);

  const saveOrders = orders => write(ORDERS_KEY, orders);

  const getCart = () => read(CART_KEY, []);

  const saveCart = cart => write(CART_KEY, cart);

  const clearCart = () => saveCart([]);

  const createOrder = payload => {
    const orders = getOrders();
    const order = {
      id: `joker-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
      createdAt: new Date().toISOString(),
      status: 'received',
      ...payload
    };
    saveOrders([order, ...orders]);
    return order;
  };

  const updateOrder = (orderId, updates) => {
    const orders = getOrders().map(order => (
      order.id === orderId ? { ...order, ...updates, updatedAt: new Date().toISOString() } : order
    ));
    saveOrders(orders);
    return orders.find(order => order.id === orderId);
  };

  const deleteOrder = orderId => {
    const orders = getOrders().filter(order => order.id !== orderId);
    saveOrders(orders);
    return orders;
  };

  const isAdminAuthenticated = async () => {
    try {
      const response = await fetch('/api/admin-session', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!response.ok) return false;
      const result = await response.json();
      return result.authenticated === true;
    } catch {
      return false;
    }
  };

  const loginAdmin = async (username, password) => {
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const logoutAdmin = async () => {
    try {
      await fetch('/api/admin-logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // The page still reloads below, even if the network is unavailable.
    }
  };

  window.JokerStore = {
    keys: { MENU_KEY, ORDERS_KEY, SETTINGS_KEY, CART_KEY },
    getMenu,
    saveMenu,
    getSettings,
    saveSettings,
    getOrders,
    saveOrders,
    getCart,
    saveCart,
    clearCart,
    createOrder,
    updateOrder,
    deleteOrder,
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin
  };
})();
