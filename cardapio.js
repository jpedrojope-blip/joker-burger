const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');

if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    mobileMenu.hidden = open;
    document.body.classList.toggle('menu-open', !open);
  });

  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }));
}

const initializeCatalog = async () => {
await window.JokerStore?.hydratePublic?.();

const menu = window.JokerStore?.getMenu?.() || window.JOKER_MENU;
const catalog = document.querySelector('[data-menu-catalog]');
const highlights = document.querySelector('[data-menu-highlights]');
const categoryNav = document.querySelector('[data-menu-categories]');
const searchInput = document.querySelector('[data-menu-search]');
const results = document.querySelector('[data-menu-results]');
const modal = document.querySelector('[data-menu-modal]');
const modalImage = document.querySelector('[data-modal-image]');
const modalImageWebp = document.querySelector('[data-modal-image-webp]');
const modalKicker = document.querySelector('[data-modal-kicker]');
const modalTitle = document.querySelector('[data-modal-title]');
const modalDescription = document.querySelector('[data-modal-description]');
const modalOptions = document.querySelector('[data-modal-options]');
const modalTotal = document.querySelector('[data-modal-total]');
const modalAdd = document.querySelector('[data-modal-add]');
const cartToggle = document.querySelector('[data-cart-open]');
const cartOverlay = document.querySelector('[data-cart-overlay]');
const cartItems = document.querySelector('[data-cart-items]');
const cartFooter = document.querySelector('[data-cart-footer]');
const cartCount = document.querySelector('[data-cart-count]');
const cartTotal = document.querySelector('[data-cart-total]');
const fallbackImage = 'public/assets/joker/joker-combo.jpg';
const cartStorageKey = 'joker-menu-cart-v1';
const whatsappPhone = '555521965035071';

if (menu && catalog && categoryNav) {
  let activeCategory = 'all';
  let searchTerm = '';
  let currentProduct = null;
  let lastTrigger = null;
  let cart = readCart();

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#039;',
    '"': '&quot;'
  }[character]));

  const normalize = value => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const parsePrice = value => {
    const numeric = String(value ?? '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    return Number(numeric) || 0;
  };

  const formatPrice = value => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);

  function readCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function persistCart() {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch {
      // The cart still works for the current session if storage is unavailable.
    }
  }

  const categoryById = id => menu.categories.find(category => category.id === id);

  const addOnItems = categoryId => categoryById(categoryId)?.items || [];

  const getVisibleCategories = () => menu.categories
    .filter(category => activeCategory === 'all' || category.id === activeCategory)
    .map(category => ({
      ...category,
      items: category.items.filter(item => {
        if (item.available === false) return false;
        if (!searchTerm) return true;
        const haystack = normalize(`${category.title} ${item.name} ${item.description}`);
        return haystack.includes(normalize(searchTerm));
      })
    }))
    .filter(category => category.items.length > 0);

  const renderNavigation = () => {
    const links = [
      { id: 'all', label: 'Tudo' },
      ...menu.categories.map(category => ({ id: category.id, label: category.title }))
    ];

    categoryNav.innerHTML = `${links.map(link => `
      <a href="#${link.id === 'all' ? 'cardapio' : link.id}" data-menu-category="${escapeHtml(link.id)}" class="${activeCategory === link.id ? 'is-active' : ''}" aria-current="${activeCategory === link.id ? 'page' : 'false'}">${escapeHtml(link.label)}</a>
    `).join('')}
    <a class="menu-order-link" href="checkout.html">Seu pedido</a>`;
  };

  const renderHighlights = () => {
    if (!highlights) return;

    const highlightRefs = [
      ['promolove', 0],
      ['bebidas', 0],
      ['combo-mais-vendido', 0]
    ];
    const featured = highlightRefs
      .map(([categoryId, itemIndex]) => {
        const category = categoryById(categoryId);
        const item = category?.items[itemIndex];
        return category && item ? { category, item } : null;
      })
      .filter(Boolean);

    highlights.hidden = activeCategory !== 'all' || Boolean(searchTerm) || !featured.length;
    if (highlights.hidden) return;

    highlights.innerHTML = featured.map(({ category, item }) => {
      const image = item.image || fallbackImage;
      return `
        <button class="menu-highlight-card" type="button" data-add-item data-category-id="${escapeHtml(category.id)}" data-item-name="${escapeHtml(item.name)}" aria-label="Ver opções de ${escapeHtml(item.name)}">
          <span class="menu-highlight-media">
            <picture>
              <source srcset="${escapeHtml(`${image}.webp`)}" type="image/webp" />
              <img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${fallbackImage}'" />
            </picture>
          </span>
          <span class="menu-highlight-body">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.price)}</span>
          </span>
        </button>`;
    }).join('');
  };

  const renderCard = (item, category) => {
    const discount = item.discount
      ? `<span class="menu-discount">-${escapeHtml(item.discount)}</span>`
      : '';
    const oldPrice = item.oldPrice
      ? `<del class="menu-item-old-price">${escapeHtml(item.oldPrice)}</del>`
      : '';
    const description = item.description
      ? `<p>${escapeHtml(item.description)}</p>`
      : '<p class="menu-item-empty-description">Escolha seu acompanhamento e finalize pelo app.</p>';
    const image = item.image || fallbackImage;

    return `
      <article class="menu-item" data-menu-item>
        <div class="menu-item-media">
          <picture class="menu-product-picture">
            <source srcset="${escapeHtml(`${image}.webp`)}" type="image/webp" />
            <img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${fallbackImage}'" />
          </picture>
          <span class="menu-image-hint">Ver detalhes</span>
        </div>
        <div class="menu-item-body">
          <span class="menu-item-kicker">${escapeHtml(category.title)}</span>
          <h3>${escapeHtml(item.name)}</h3>
          ${description}
          <div class="menu-item-bottom">
            <div class="menu-price-wrap"><strong class="menu-item-price">${escapeHtml(item.price)}</strong>${oldPrice}${discount}</div>
            <button class="button button-dark" type="button" data-add-item data-category-id="${escapeHtml(category.id)}" data-item-name="${escapeHtml(item.name)}" aria-label="Ver opções de ${escapeHtml(item.name)}">Pedir</button>
          </div>
        </div>
      </article>`;
  };

  const renderCatalog = () => {
    renderHighlights();
    const visibleCategories = getVisibleCategories();
    const itemCount = visibleCategories.reduce((total, category) => total + category.items.length, 0);
    const categoryLabel = activeCategory === 'all'
      ? 'no cardápio'
      : `em ${menu.categories.find(category => category.id === activeCategory)?.title || 'esta categoria'}`;

    results.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'} ${categoryLabel}${searchTerm ? ` para “${searchTerm}”` : ''}`;

    if (!visibleCategories.length) {
      catalog.innerHTML = `
        <div class="menu-empty-state">
          <span class="eyebrow">Jogada não encontrada</span>
          <h2>Não achamos esse item.</h2>
          <p>Tente outro termo ou volte para ver o cardápio completo.</p>
          <button class="button button-dark" type="button" data-clear-menu>Limpar busca</button>
        </div>`;
      catalog.querySelector('[data-clear-menu]')?.addEventListener('click', () => {
        searchTerm = '';
        if (searchInput) searchInput.value = '';
        renderCatalog();
      });
      return;
    }

    catalog.innerHTML = visibleCategories.map(category => `
      <section class="menu-section menu-section-live" id="${escapeHtml(category.id)}" aria-labelledby="${escapeHtml(category.id)}-title">
        <div class="menu-section-head">
          <div><span class="eyebrow">${escapeHtml(category.items.length)} ${category.items.length === 1 ? 'opção' : 'opções'}</span><h2 id="${escapeHtml(category.id)}-title">${escapeHtml(category.title)}</h2></div>
          <p>${escapeHtml(category.intro)}</p>
        </div>
        <div class="menu-grid menu-grid-${category.items.length}">${category.items.map(item => renderCard(item, category)).join('')}</div>
      </section>
    `).join('');
  };

  const getOptionGroups = (item, category) => {
    const categoryIsDrink = category.id === 'bebidas';
    const categoryIsSauce = category.id === 'molhos';
    if (categoryIsDrink || categoryIsSauce) return [];

    const itemText = normalize(`${category.title} ${item.name}`);
    const includesPotato = itemText.includes('batata') || itemText.includes('batatinha') || itemText.includes('fries');
    const groups = [];

    if (!includesPotato) {
      groups.push({
        id: 'batata',
        label: 'Adicionar batata',
        items: addOnItems('petiscada').filter(option => /batata|fries/i.test(option.name))
      });
    }

    groups.push({
      id: 'bebida',
      label: itemText.includes('combo') || itemText.includes('refri') ? 'Adicionar bebida extra' : 'Adicionar bebida',
      items: addOnItems('bebidas')
    });
    groups.push({
      id: 'molho',
      label: 'Adicionar molho extra',
      items: addOnItems('molhos')
    });

    return groups;
  };

  const renderOptionGroup = group => `
    <label class="menu-option">
      <span>${escapeHtml(group.label)} <small>opcional</small></span>
      <select data-menu-option data-option-group="${escapeHtml(group.id)}" aria-label="${escapeHtml(group.label)}">
        <option value="" data-label="" data-price="0">Não adicionar</option>
        ${group.items.map(option => `<option value="${escapeHtml(option.name)}" data-label="${escapeHtml(option.name)}" data-price="${parsePrice(option.price)}" data-cost="${parsePrice(option.cost)}">${escapeHtml(option.name)} (+${escapeHtml(option.price)})</option>`).join('')}
      </select>
    </label>`;

  const updateModalTotal = () => {
    if (!currentProduct || !modalTotal) return;
    const extras = [...modalOptions.querySelectorAll('[data-menu-option]')]
      .reduce((total, select) => total + Number(select.selectedOptions[0]?.dataset.price || 0), 0);
    modalTotal.textContent = formatPrice(parsePrice(currentProduct.item.price) + extras);
  };

  const openModal = (item, category, trigger) => {
    currentProduct = { item, category };
    lastTrigger = trigger;
    const image = item.image || fallbackImage;
    modalImage.src = image;
    modalImage.alt = item.name;
    modalImageWebp.srcset = `${image}.webp`;
    modalKicker.textContent = category.title;
    modalTitle.textContent = item.name;
    modalDescription.textContent = item.description || 'Escolha seus complementos e finalize o pedido do seu jeito.';
    modalOptions.innerHTML = getOptionGroups(item, category).map(renderOptionGroup).join('') || '<p class="menu-no-options">Este item não precisa de adicionais. É só colocar no pedido.</p>';
    updateModalTotal();
    modal.hidden = false;
    document.body.classList.add('menu-modal-open');
    modalAdd.focus();
  };

  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove('menu-modal-open');
    if (lastTrigger) lastTrigger.focus();
    currentProduct = null;
  };

  const getSelectedOptions = () => [...modalOptions.querySelectorAll('[data-menu-option]')]
    .map(select => ({
      group: select.dataset.optionGroup,
      name: select.selectedOptions[0]?.dataset.label || '',
      price: Number(select.selectedOptions[0]?.dataset.price || 0),
      cost: Number(select.selectedOptions[0]?.dataset.cost || 0)
    }))
    .filter(option => option.name);

  const addCurrentProduct = () => {
    if (!currentProduct) return;
    const options = getSelectedOptions();
    const unitPrice = parsePrice(currentProduct.item.price) + options.reduce((total, option) => total + option.price, 0);
    const unitCost = parsePrice(currentProduct.item.cost) + options.reduce((total, option) => total + option.cost, 0);
    cart.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: currentProduct.item.name,
      image: currentProduct.item.image || fallbackImage,
      category: currentProduct.category.title,
      basePrice: parsePrice(currentProduct.item.price),
      unitPrice,
      unitCost,
      options,
      quantity: 1
    });
    persistCart();
    closeModal();
    renderCart();
    openCart();
  };

  const renderCart = () => {
    const quantity = cart.reduce((total, line) => total + line.quantity, 0);
    const total = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    cartCount.textContent = quantity;
    cartTotal.textContent = formatPrice(total);
    cartFooter.hidden = cart.length === 0;

    if (!cart.length) {
      cartItems.innerHTML = `
        <div class="menu-cart-empty">
          <div class="menu-cart-empty-icon" aria-hidden="true">+</div>
          <h3>Seu pedido está vazio.</h3>
          <p>Escolha um lanche e monte sua jogada.</p>
          <button class="button button-dark" type="button" data-cart-continue>Ver cardápio</button>
        </div>`;
      cartItems.querySelector('[data-cart-continue]')?.addEventListener('click', closeCart);
      return;
    }

    cartItems.innerHTML = cart.map((line, index) => `
      <article class="menu-cart-line">
        <img src="${escapeHtml(line.image)}" alt="" loading="lazy" />
        <div class="menu-cart-line-content">
          <div class="menu-cart-line-top"><div><span>${escapeHtml(line.category)}</span><h3>${escapeHtml(line.name)}</h3></div><button type="button" class="menu-line-remove" data-cart-action="remove" data-cart-index="${index}" aria-label="Remover ${escapeHtml(line.name)}">×</button></div>
          ${line.options.length ? `<ul>${line.options.map(option => `<li>${escapeHtml(option.name)}</li>`).join('')}</ul>` : ''}
          <div class="menu-cart-line-bottom"><strong>${formatPrice(line.unitPrice * line.quantity)}</strong><div class="menu-quantity" aria-label="Quantidade de ${escapeHtml(line.name)}"><button type="button" data-cart-action="decrease" data-cart-index="${index}" aria-label="Diminuir quantidade">−</button><span>${line.quantity}</span><button type="button" data-cart-action="increase" data-cart-index="${index}" aria-label="Aumentar quantidade">+</button></div></div>
        </div>
      </article>`).join('');
  };

  const openCart = () => {
    cartOverlay.hidden = false;
    cartToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-cart-open');
    document.querySelector('[data-cart-close]')?.focus();
  };

  const closeCart = () => {
    cartOverlay.hidden = true;
    cartToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-cart-open');
    cartToggle.focus();
  };

  const setCategory = categoryId => {
    activeCategory = menu.categories.some(category => category.id === categoryId) ? categoryId : 'all';
    renderNavigation();
    renderCatalog();
  };

  categoryNav.addEventListener('click', event => {
    const link = event.target.closest('[data-menu-category]');
    if (!link) return;
    event.preventDefault();
    setCategory(link.dataset.menuCategory);
    const destination = link.dataset.menuCategory === 'all' ? 'cardapio' : link.dataset.menuCategory;
    history.replaceState(null, '', `#${destination}`);
    document.querySelector(`#${destination}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  catalog.addEventListener('click', event => {
    const trigger = event.target.closest('[data-add-item]');
    if (!trigger) return;
    const category = categoryById(trigger.dataset.categoryId);
    const item = category?.items.find(menuItem => menuItem.name === trigger.dataset.itemName);
    if (item && category) openModal(item, category, trigger);
  });

  highlights?.addEventListener('click', event => {
    const trigger = event.target.closest('[data-add-item]');
    if (!trigger) return;
    const category = categoryById(trigger.dataset.categoryId);
    const item = category?.items.find(menuItem => menuItem.name === trigger.dataset.itemName);
    if (item && category) openModal(item, category, trigger);
  });

  searchInput?.addEventListener('input', event => {
    searchTerm = event.target.value.trim();
    renderCatalog();
  });

  modalOptions?.addEventListener('change', updateModalTotal);
  modalAdd?.addEventListener('click', addCurrentProduct);
  document.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });

  cartToggle?.addEventListener('click', openCart);
  document.querySelector('[data-cart-close]')?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', event => {
    if (event.target === cartOverlay) closeCart();
  });

  cartItems?.addEventListener('click', event => {
    const action = event.target.closest('[data-cart-action]');
    if (!action) return;
    const index = Number(action.dataset.cartIndex);
    const line = cart[index];
    if (!line) return;
    if (action.dataset.cartAction === 'increase') line.quantity += 1;
    if (action.dataset.cartAction === 'decrease') line.quantity -= 1;
    if (action.dataset.cartAction === 'remove' || line.quantity < 1) cart.splice(index, 1);
    persistCart();
    renderCart();
  });

  document.querySelector('[data-cart-whatsapp]')?.addEventListener('click', () => {
    const message = [
      'Olá, Joker! Quero fazer este pedido:',
      ...cart.map(line => `${line.quantity}x ${line.name}${line.options.length ? ` (${line.options.map(option => option.name).join(', ')})` : ''} — ${formatPrice(line.unitPrice * line.quantity)}`),
      `Subtotal: ${cartTotal.textContent}`
    ].join('\n');
    window.open(`https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!modal.hidden) closeModal();
      else if (!cartOverlay.hidden) closeCart();
    }
  });

  const hashCategory = window.location.hash.slice(1);
  setCategory(hashCategory && hashCategory !== 'cardapio' ? hashCategory : 'all');
  renderCart();
}
};

initializeCatalog();
