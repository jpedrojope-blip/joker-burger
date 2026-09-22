(function () {
  'use strict';

  const store = window.JokerStore;
  if (!store) return;

  const cart = store.getCart();
  const settings = store.getSettings();
  const form = document.querySelector('[data-checkout-form]');
  const itemsElement = document.querySelector('[data-checkout-items]');
  const emptyElement = document.querySelector('[data-checkout-empty]');
  const deliveryFields = document.querySelector('[data-delivery-fields]');
  const successElement = document.querySelector('[data-checkout-success]');
  const storeStatus = document.querySelector('[data-store-status]');
  const deliveryFeeElement = document.querySelector('[data-checkout-delivery]');
  const subtotalElement = document.querySelector('[data-checkout-subtotal]');
  const totalElement = document.querySelector('[data-checkout-total]');
  const orderNumberElement = document.querySelector('[data-order-number]');
  const orderLinkElement = document.querySelector('[data-order-link]');

  const formatPrice = value => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);

  const subtotal = cart.reduce((total, line) => total + line.unitPrice * line.quantity, 0);

  const getFulfillment = () => form?.querySelector('input[name="fulfillment"]:checked')?.value || 'delivery';

  const renderItems = () => {
    if (!cart.length) {
      emptyElement.hidden = false;
      form.hidden = true;
      itemsElement.innerHTML = '<p class="checkout-no-items">Nenhum item adicionado ainda.</p>';
      return;
    }

    itemsElement.innerHTML = cart.map(line => `
      <article class="checkout-summary-item">
        <img src="${line.image}" alt="" />
        <div>
          <strong>${line.quantity}x ${line.name}</strong>
          ${line.options?.length ? `<small>${line.options.map(option => option.name).join(', ')}</small>` : ''}
          <span>${formatPrice(line.unitPrice * line.quantity)}</span>
        </div>
      </article>`).join('');
  };

  const updateTotals = () => {
    const delivery = getFulfillment() === 'delivery' ? Number(settings.deliveryFee || 0) : 0;
    subtotalElement.textContent = formatPrice(subtotal);
    deliveryFeeElement.textContent = delivery ? formatPrice(delivery) : 'Grátis';
    totalElement.textContent = formatPrice(subtotal + delivery);
    deliveryFields.hidden = getFulfillment() !== 'delivery';
    deliveryFields.querySelectorAll('input').forEach(input => {
      input.required = getFulfillment() === 'delivery' && input.name !== 'reference';
    });
  };

  const showSuccess = order => {
    form.hidden = true;
    document.querySelector('.checkout-summary-card').hidden = true;
    successElement.hidden = false;
    orderNumberElement.textContent = order.id;
    orderLinkElement.href = `pedido.html?id=${encodeURIComponent(order.id)}`;
  };

  renderItems();
  updateTotals();
  storeStatus.textContent = settings.open ? 'Loja aberta' : 'Loja fechada';
  storeStatus.classList.toggle('is-closed', !settings.open);
  const submitButton = form?.querySelector('button[type="submit"]');
  if (!settings.open && submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Loja fechada no momento';
  }

  form?.addEventListener('change', updateTotals);

  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!settings.open || !cart.length || !form.reportValidity()) return;

    const data = new FormData(form);
    const delivery = getFulfillment() === 'delivery' ? Number(settings.deliveryFee || 0) : 0;
    const order = store.createOrder({
      customer: {
        name: data.get('name'),
        phone: data.get('phone')
      },
      fulfillment: getFulfillment(),
      address: {
        address: data.get('address'),
        neighborhood: data.get('neighborhood'),
        reference: data.get('reference')
      },
      payment: data.get('payment'),
      change: data.get('change'),
      note: data.get('note'),
      items: cart,
      subtotal,
      deliveryFee: delivery,
      total: subtotal + delivery
    });

    store.clearCart();
    showSuccess(order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
