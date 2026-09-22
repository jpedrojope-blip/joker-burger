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

  const requestJSON = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      ...options,
      headers: {
        ...(options.headers || {}),
        'Content-Type': 'application/json'
      }
    });
    let result = null;
    try {
      result = await response.json();
    } catch {
      result = {};
    }
    if (!response.ok) {
      const error = new Error(result.error || `Request failed with ${response.status}.`);
      error.status = response.status;
      throw error;
    }
    return result;
  };

  const applyRemoteState = state => {
    if (state?.menu?.categories) write(MENU_KEY, clone(state.menu));
    if (state?.settings) write(SETTINGS_KEY, { ...defaultSettings, ...state.settings });
    return state;
  };

  const applyRemoteOrders = orders => {
    if (Array.isArray(orders)) write(ORDERS_KEY, clone(orders));
    return orders;
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

  const createOrder = async payload => {
    const order = await requestJSON('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    applyRemoteOrders([order, ...getOrders().filter(item => item.id !== order.id)]);
    return order;
  };

  const updateOrder = async (orderId, updates) => {
    const order = await requestJSON('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ id: orderId, ...updates })
    });
    applyRemoteOrders(getOrders().map(item => item.id === orderId ? order : item));
    return order;
  };

  const deleteOrder = async orderId => {
    await requestJSON('/api/orders', {
      method: 'DELETE',
      body: JSON.stringify({ id: orderId })
    });
    const orders = getOrders().filter(order => order.id !== orderId);
    applyRemoteOrders(orders);
    return orders;
  };

  const hydratePublic = async () => {
    try {
      return applyRemoteState(await requestJSON('/api/store-state'));
    } catch {
      return null;
    }
  };

  const refreshOrders = async () => {
    const result = await requestJSON('/api/orders');
    return applyRemoteOrders(result.orders || []);
  };

  const hydrateOrder = async orderId => {
    if (!orderId) return null;
    try {
      const order = await requestJSON(`/api/orders?id=${encodeURIComponent(orderId)}`);
      applyRemoteOrders([order, ...getOrders().filter(item => item.id !== order.id)]);
      return order;
    } catch {
      return getOrders().find(item => item.id === orderId) || null;
    }
  };

  const hydrateAdmin = async () => {
    const state = applyRemoteState(await requestJSON('/api/store-state'));
    const orders = await refreshOrders();
    if (!state.menu?.categories) await saveRemoteState({ menu: getMenu() });
    if (!state.settings) await saveRemoteState({ settings: getSettings() });
    return { state, orders };
  };

  const saveRemoteState = async state => {
    const result = await requestJSON('/api/store-state', {
      method: 'PATCH',
      body: JSON.stringify(state)
    });
    return applyRemoteState(result);
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
    hydratePublic,
    hydrateAdmin,
    refreshOrders,
    hydrateOrder,
    saveRemoteState,
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin
  };
})();
