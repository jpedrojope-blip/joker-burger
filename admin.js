(function () {
  'use strict';

  const store = window.JokerStore;
  const loginScreen = document.querySelector('[data-admin-login-screen]');
  const dashboard = document.querySelector('[data-admin-dashboard]');
  const loginForm = document.querySelector('[data-admin-login-form]');
  const loginFeedback = document.querySelector('[data-admin-login-feedback]');
  const logoutButton = document.querySelector('[data-admin-logout]');
  let dashboardStarted = false;

  const setAuthView = authenticated => {
    loginScreen.hidden = authenticated;
    dashboard.hidden = !authenticated;
    logoutButton.hidden = !authenticated;
  };

  const startDashboard = () => {
    if (dashboardStarted) return;
    dashboardStarted = true;

    if (new URLSearchParams(window.location.search).has('reset')) {
      store.saveOrders([]);
      store.clearCart();
    }

    const menu = store.getMenu();
    const settings = store.getSettings();
    const ordersElement = document.querySelector('[data-admin-orders]');
    const categorySelect = document.querySelector('[data-admin-category]');
    const productSelect = document.querySelector('[data-admin-product]');
    const productForm = document.querySelector('[data-product-form]');
    const productList = document.querySelector('[data-product-list]');
    const settingsForm = document.querySelector('[data-settings-form]');
    const search = document.querySelector('[data-admin-search]');
    const searchSummary = document.querySelector('[data-admin-search-summary]');
    const productSubmit = document.querySelector('[data-product-submit]');
    const newProductButton = document.querySelector('[data-admin-new-product]');
    const cancelProductButton = document.querySelector('[data-admin-cancel-product]');
    const deleteProductButton = document.querySelector('[data-admin-delete-product]');
    const storeToggle = document.querySelector('[data-admin-store-toggle]');
    const financePeriod = document.querySelector('[data-admin-finance-period]');
    const customerSearch = document.querySelector('[data-admin-customer-search]');
    const customersElement = document.querySelector('[data-admin-customers]');
    let creatingProduct = false;

    const statusLabels = {
      received: 'Recebido',
      approved: 'Aprovado',
      preparing: 'Preparando',
      ready: 'Pronto',
      out_for_delivery: 'Saiu para entrega',
      completed: 'Concluído',
      rejected: 'Recusado',
      cancelled: 'Cancelado'
    };

    const formatPrice = value => new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value) || 0);

    const formatDate = value => new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));

    const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
    }[character]));

    const parseMoney = value => {
      if (typeof value === 'number') return Number(value) || 0;
      const raw = String(value ?? '').replace(/[^\d,.-]/g, '');
      const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
      return Number(normalized) || 0;
    };

    const getProducts = () => menu.categories.flatMap(category => category.items.map(item => ({ category, item })));

    const findProduct = () => {
      const category = menu.categories.find(item => item.id === categorySelect.value);
      const item = category?.items.find(product => product.name === productSelect.value);
      return category && item ? { category, item } : null;
    };

    const setProductMode = isNew => {
      creatingProduct = isNew;
      productSelect.disabled = isNew;
      productSubmit.textContent = isNew ? 'Adicionar produto' : 'Salvar produto';
      cancelProductButton.hidden = !isNew;
      deleteProductButton.hidden = isNew;
      if (isNew) {
        productForm.reset();
        productForm.elements.available.checked = true;
        categorySelect.disabled = false;
        productForm.elements.name.focus();
      }
    };

    const loadProductForm = () => {
      if (creatingProduct) return;
      const found = findProduct();
      if (!found) return;
      productForm.elements.name.value = found.item.name;
      productForm.elements.price.value = found.item.price;
      productForm.elements.cost.value = found.item.cost || '';
      productForm.elements.image.value = found.item.image || '';
      productForm.elements.description.value = found.item.description || '';
      productForm.elements.available.checked = found.item.available !== false;
    };

    const populateProducts = () => {
      const category = menu.categories.find(item => item.id === categorySelect.value) || menu.categories[0];
      productSelect.innerHTML = (category?.items || []).map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join('');
      loadProductForm();
    };

    const populateCategories = () => {
      categorySelect.innerHTML = menu.categories.map(category => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.title)}</option>`).join('');
      populateProducts();
    };

    const getValidOrders = () => store.getOrders().filter(order => !['cancelled', 'rejected'].includes(order.status));

    const getOrdersForPeriod = () => {
      const period = financePeriod.value;
      if (period === 'all') return getValidOrders();
      const now = new Date();
      const start = new Date(now);
      if (period === 'today') start.setHours(0, 0, 0, 0);
      if (period === 'week') start.setDate(now.getDate() - 6);
      if (period === 'month') start.setDate(now.getDate() - 29);
      return getValidOrders().filter(order => new Date(order.createdAt) >= start);
    };

    const findMenuItemForOrder = orderItem => {
      const category = menu.categories.find(item => item.title === orderItem.category || item.id === orderItem.category);
      return category?.items.find(item => item.name === orderItem.name)
        || menu.categories.flatMap(item => item.items).find(item => item.name === orderItem.name);
    };

    const renderFinance = () => {
      const orders = getOrdersForPeriod();
      const currentSettings = store.getSettings();
      const revenue = orders.reduce((sum, order) => sum + parseMoney(order.total), 0);
      let costs = 0;
      let missingCostLines = 0;

      orders.forEach(order => {
        if (order.fulfillment === 'delivery') costs += parseMoney(currentSettings.deliveryCost);
        order.items.forEach(item => {
          const menuItem = findMenuItemForOrder(item);
          const hasOrderCost = item.unitCost !== undefined && parseMoney(item.unitCost) > 0;
          const unitCost = hasOrderCost ? parseMoney(item.unitCost) : parseMoney(menuItem?.cost);
          if (unitCost > 0) costs += unitCost * (Number(item.quantity) || 0);
          else missingCostLines += Number(item.quantity) || 0;
        });
      });

      const profit = revenue - costs;
      const averageTicket = orders.length ? revenue / orders.length : 0;
      document.querySelector('[data-admin-revenue]').textContent = formatPrice(revenue);
      document.querySelector('[data-admin-costs]').textContent = formatPrice(costs);
      document.querySelector('[data-admin-profit]').textContent = formatPrice(profit);
      document.querySelector('[data-admin-ticket]').textContent = formatPrice(averageTicket);
      document.querySelector('[data-admin-finance-note]').textContent = !orders.length
        ? 'Os indicadores serão calculados assim que os primeiros pedidos forem registrados.'
        : missingCostLines
          ? `${missingCostLines} item(ns) ainda sem custo cadastrado. O lucro é uma estimativa.`
          : 'Cálculo com custo dos produtos e custo médio de entrega.';
    };

    const renderCustomers = () => {
      const customerMap = new Map();
      getValidOrders().forEach(order => {
        const name = order.customer?.name || 'Cliente';
        const phone = order.customer?.phone || '';
        const key = phone.replace(/\D/g, '') || name.toLocaleLowerCase('pt-BR');
        const customer = customerMap.get(key) || { name, phone, orders: 0, spent: 0, lastOrder: order.createdAt };
        customer.orders += 1;
        customer.spent += parseMoney(order.total);
        if (new Date(order.createdAt) > new Date(customer.lastOrder)) customer.lastOrder = order.createdAt;
        customerMap.set(key, customer);
      });

      const term = (customerSearch.value || '').trim().toLocaleLowerCase('pt-BR');
      const customers = [...customerMap.values()]
        .filter(customer => `${customer.name} ${customer.phone}`.toLocaleLowerCase('pt-BR').includes(term))
        .sort((a, b) => new Date(b.lastOrder) - new Date(a.lastOrder));

      customersElement.innerHTML = customers.map(customer => `
        <article class="admin-customer-row">
          <div><strong>${escapeHtml(customer.name)}</strong><small>${escapeHtml(customer.phone || 'Telefone não informado')}</small></div>
          <div class="admin-customer-stat"><strong>${customer.orders}</strong><small>${customer.orders === 1 ? 'pedido' : 'pedidos'}</small></div>
          <div class="admin-customer-stat"><strong>${formatPrice(customer.spent)}</strong><small>gasto total</small></div>
          <div class="admin-customer-last"><small>Último pedido</small><span>${formatDate(customer.lastOrder)}</span></div>
        </article>`).join('') || '<div class="admin-empty"><strong>Nenhum cliente encontrado.</strong><span>Os clientes aparecem depois que um pedido é confirmado.</span></div>';
    };

    const renderMetrics = () => {
      const orders = store.getOrders();
      const active = orders.filter(order => !['completed', 'cancelled', 'rejected'].includes(order.status));
      const sales = orders.filter(order => !['cancelled', 'rejected'].includes(order.status)).reduce((total, order) => total + Number(order.total || 0), 0);
      document.querySelector('[data-admin-active-orders]').textContent = active.length;
      document.querySelector('[data-admin-total-orders]').textContent = orders.length;
      document.querySelector('[data-admin-sales]').textContent = formatPrice(sales);
      const isOpen = store.getSettings().open;
      document.querySelector('[data-admin-store-status]').textContent = isOpen ? 'Aberta' : 'Fechada';
      storeToggle.textContent = isOpen ? 'Fechar loja' : 'Abrir loja';
      storeToggle.setAttribute('aria-pressed', String(isOpen));
      storeToggle.classList.toggle('is-closed', !isOpen);
    };

    const renderOrders = () => {
      const orders = store.getOrders();
      if (!orders.length) {
        ordersElement.innerHTML = '<div class="admin-empty"><strong>Nenhum pedido ainda.</strong><span>Os pedidos confirmados no checkout aparecem aqui.</span></div>';
        return;
      }

      ordersElement.innerHTML = orders.map(order => `
        <article class="admin-order-row">
          <div class="admin-order-main">
            <div><strong>${escapeHtml(order.id)}</strong><span>${formatDate(order.createdAt)}</span></div>
            <p>${escapeHtml(order.customer?.name || 'Cliente')} · ${order.fulfillment === 'delivery' ? 'Entrega' : 'Retirada'} · ${formatPrice(order.total)}</p>
            <small>${order.items.map(item => `${item.quantity}x ${escapeHtml(item.name)}`).join(' · ')}</small>
          </div>
          <div class="admin-order-controls">
            <label class="admin-status-control"><span>Status</span><select data-order-status data-order-id="${escapeHtml(order.id)}">${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${order.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
            <div class="admin-order-actions">
              ${order.status === 'received' ? '<button class="admin-action-button is-success" type="button" data-order-action="approve">Aprovar</button><button class="admin-action-button is-danger" type="button" data-order-action="reject">Recusar</button>' : ''}
              <button class="admin-action-button is-danger" type="button" data-order-action="delete">Excluir</button>
            </div>
          </div>
        </article>`).join('');
    };

    const renderProducts = () => {
      const term = (search.value || '').trim().toLocaleLowerCase('pt-BR');
      const products = getProducts().filter(({ category, item }) => `${category.title} ${item.name}`.toLocaleLowerCase('pt-BR').includes(term));
      searchSummary.textContent = `${products.length} ${products.length === 1 ? 'produto' : 'produtos'}`;
      productList.innerHTML = products.map(({ category, item }) => `
        <button class="admin-product-row" type="button" data-select-product data-category-id="${escapeHtml(category.id)}" data-product-name="${escapeHtml(item.name)}">
          <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(category.title)}</small></span>
          <span><b>${escapeHtml(item.price)}</b><small class="${item.available === false ? 'is-unavailable' : ''}">${item.available === false ? 'Indisponível' : 'Disponível'}</small></span>
        </button>`).join('') || '<div class="admin-empty"><strong>Nenhum produto encontrado.</strong><span>Adicione um novo item ou ajuste a busca.</span></div>';
    };

    const showProductFeedback = message => {
      document.querySelector('[data-product-feedback]').textContent = message;
    };

    settingsForm.elements.open.checked = settings.open;
    settingsForm.elements.deliveryFee.value = settings.deliveryFee;
    settingsForm.elements.deliveryCost.value = settings.deliveryCost;
    settingsForm.elements.estimatedTime.value = settings.estimatedTime;
    populateCategories();
    renderMetrics();
    renderFinance();
    renderOrders();
    renderCustomers();
    renderProducts();

    categorySelect.addEventListener('change', () => {
      if (!creatingProduct) populateProducts();
    });
    productSelect.addEventListener('change', loadProductForm);
    search.addEventListener('input', renderProducts);
    financePeriod.addEventListener('change', renderFinance);
    customerSearch.addEventListener('input', renderCustomers);

    storeToggle.addEventListener('click', () => {
      const nextOpen = !store.getSettings().open;
      store.saveSettings({ open: nextOpen });
      settingsForm.elements.open.checked = nextOpen;
      renderMetrics();
      document.querySelector('[data-settings-feedback]').textContent = nextOpen ? 'Loja aberta para receber pedidos.' : 'Loja fechada para novos pedidos.';
    });

    newProductButton.addEventListener('click', () => {
      setProductMode(true);
      showProductFeedback('Preencha os dados do novo item.');
    });

    cancelProductButton.addEventListener('click', () => {
      setProductMode(false);
      populateProducts();
      showProductFeedback('');
    });

    deleteProductButton.addEventListener('click', () => {
      const found = findProduct();
      if (!found || !window.confirm(`Excluir “${found.item.name}” do cardápio?`)) return;
      const index = found.category.items.indexOf(found.item);
      if (index >= 0) found.category.items.splice(index, 1);
      store.saveMenu(menu);
      setProductMode(false);
      populateProducts();
      renderProducts();
      showProductFeedback('Produto excluído do catálogo local.');
    });

    productList.addEventListener('click', event => {
      const trigger = event.target.closest('[data-select-product]');
      if (!trigger) return;
      setProductMode(false);
      categorySelect.value = trigger.dataset.categoryId;
      populateProducts();
      productSelect.value = trigger.dataset.productName;
      loadProductForm();
      productForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    productForm.addEventListener('submit', event => {
      event.preventDefault();
      const name = productForm.elements.name.value.trim();
      const price = productForm.elements.price.value.trim();
      const cost = productForm.elements.cost.value.trim();
      const image = productForm.elements.image.value.trim();
      const description = productForm.elements.description.value.trim();
      if (!name || !price) return;

      if (creatingProduct) {
        const category = menu.categories.find(item => item.id === categorySelect.value);
        if (!category) return;
        if (category.items.some(item => item.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) {
          showProductFeedback('Já existe um produto com esse nome nesta categoria.');
          return;
        }
        const item = { name, price, cost: cost || '0', image: image || 'public/assets/joker/joker-combo.jpg', description, available: productForm.elements.available.checked };
        category.items.push(item);
        store.saveMenu(menu);
        setProductMode(false);
        populateProducts();
        productSelect.value = name;
        loadProductForm();
        renderProducts();
        renderFinance();
        showProductFeedback('Novo produto adicionado ao catálogo local.');
        return;
      }

      const found = findProduct();
      if (!found) return;
      found.item.name = name;
      found.item.price = price;
      found.item.cost = cost || '0';
      found.item.image = image || found.item.image || 'public/assets/joker/joker-combo.jpg';
      found.item.description = description;
      found.item.available = productForm.elements.available.checked;
      store.saveMenu(menu);
      productSelect.innerHTML = (found.category.items || []).map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join('');
      productSelect.value = found.item.name;
      renderProducts();
      renderFinance();
      showProductFeedback('Produto salvo no catálogo local.');
    });

    settingsForm.addEventListener('submit', event => {
      event.preventDefault();
      store.saveSettings({
        open: settingsForm.elements.open.checked,
        deliveryFee: Number(settingsForm.elements.deliveryFee.value) || 0,
        deliveryCost: Number(settingsForm.elements.deliveryCost.value) || 0,
        estimatedTime: settingsForm.elements.estimatedTime.value.trim() || '35–50 min'
      });
      renderMetrics();
      renderFinance();
      document.querySelector('[data-settings-feedback]').textContent = 'Configurações salvas.';
    });

    ordersElement.addEventListener('change', event => {
      const select = event.target.closest('[data-order-status]');
      if (!select) return;
      store.updateOrder(select.dataset.orderId, { status: select.value });
      renderMetrics();
      renderFinance();
      renderCustomers();
      renderOrders();
    });

    ordersElement.addEventListener('click', event => {
      const button = event.target.closest('[data-order-action]');
      if (!button) return;
      const row = button.closest('.admin-order-row');
      const select = row?.querySelector('[data-order-status]');
      const orderId = select?.dataset.orderId;
      const action = button.dataset.orderAction;
      if (!orderId) return;

      if (action === 'approve') store.updateOrder(orderId, { status: 'approved', approvedAt: new Date().toISOString() });
      if (action === 'reject') {
        if (!window.confirm('Recusar este pedido?')) return;
        store.updateOrder(orderId, { status: 'rejected', rejectedAt: new Date().toISOString() });
      }
      if (action === 'delete') {
        if (!window.confirm('Excluir este pedido do painel local?')) return;
        store.deleteOrder(orderId);
      }
      renderMetrics();
      renderFinance();
      renderCustomers();
      renderOrders();
    });

    document.querySelector('[data-admin-refresh]').addEventListener('click', () => {
      renderMetrics();
      renderFinance();
      renderCustomers();
      renderOrders();
      renderProducts();
    });
  };

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const username = loginForm.elements.username.value.trim();
    const password = loginForm.elements.password.value;
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    loginFeedback.textContent = 'Validando acesso…';
    const authenticated = await store.loginAdmin(username, password);
    submitButton.disabled = false;
    if (!authenticated) {
      loginFeedback.textContent = 'Usuário ou senha inválidos, ou o servidor ainda não foi configurado.';
      loginForm.elements.password.select();
      return;
    }
    loginFeedback.textContent = '';
    setAuthView(true);
    startDashboard();
  });

  logoutButton.addEventListener('click', async () => {
    await store.logoutAdmin();
    window.location.reload();
  });

  setAuthView(false);
  store.isAdminAuthenticated().then(authenticated => {
    setAuthView(authenticated);
    if (authenticated) startDashboard();
  });
})();
