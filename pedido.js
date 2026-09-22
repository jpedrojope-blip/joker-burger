(function () {
  'use strict';

  const root = document.querySelector('[data-order-view]');
  const store = window.JokerStore;
  const orderId = new URLSearchParams(window.location.search).get('id');
  const statuses = [
    ['received', 'Pedido recebido', 'A Joker recebeu sua jogada.'],
    ['approved', 'Pedido aprovado', 'A Joker confirmou sua jogada.'],
    ['preparing', 'Preparando', 'A chapa já está trabalhando.'],
    ['ready', 'Pedido pronto', 'Tudo pronto para sair.'],
    ['out_for_delivery', 'A caminho', 'Seu pedido está chegando.'],
    ['completed', 'Concluído', 'Bom apetite e até a próxima.']
  ];

  const formatPrice = value => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value) || 0);

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[character]));

  const render = () => {
    const order = store.getOrders().find(item => item.id === orderId);
    if (!order) {
      root.innerHTML = `
        <section class="pedido-empty">
          <span class="pedido-eyebrow">Joker Burger e Beer</span>
          <h1>Pedido não encontrado.</h1>
          <p>Confira o número do pedido ou volte ao cardápio para começar uma nova jogada.</p>
          <a class="pedido-button" href="cardapio.html">Voltar ao cardápio</a>
        </section>`;
      return;
    }

    const currentIndex = statuses.findIndex(([key]) => key === order.status);
    const isCancelled = ['cancelled', 'rejected'].includes(order.status);
    const statusTitle = order.status === 'rejected' ? 'Pedido recusado' : 'Pedido cancelado';
    const statusLabel = order.status === 'rejected' ? 'Recusado' : 'Cancelado';
    root.innerHTML = `
      <div class="pedido-heading">
        <span class="pedido-eyebrow">Pedido ${escapeHtml(order.id)}</span>
        <h1>Acompanhe sua jogada.</h1>
        <p>${escapeHtml(order.customer?.name || 'Cliente')}, atualizamos o pedido por aqui.</p>
      </div>
      <section class="pedido-card pedido-status-card">
        <div class="pedido-status-top"><div><span class="pedido-eyebrow">Status atual</span><h2>${isCancelled ? statusTitle : escapeHtml(statuses[Math.max(currentIndex, 0)]?.[1] || 'Pedido recebido')}</h2></div><span class="pedido-status-pill ${isCancelled ? 'is-cancelled' : ''}">${isCancelled ? statusLabel : 'Em andamento'}</span></div>
        <div class="pedido-timeline ${isCancelled ? 'is-cancelled' : ''}">${statuses.map(([key, title, description], index) => `
          <div class="pedido-step ${!isCancelled && index <= currentIndex ? 'is-done' : ''} ${!isCancelled && index === currentIndex ? 'is-current' : ''}">
            <span class="pedido-step-dot" aria-hidden="true">${index <= currentIndex && !isCancelled ? '✓' : index + 1}</span>
            <div><strong>${title}</strong><small>${description}</small></div>
          </div>`).join('')}</div>
      </section>
      <section class="pedido-card pedido-summary-card">
        <div class="pedido-card-heading"><div><span class="pedido-eyebrow">Resumo</span><h2>Sua jogada</h2></div><span class="pedido-date">${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(order.createdAt))}</span></div>
        <div class="pedido-items">${order.items.map(item => `<div><span>${item.quantity}x ${escapeHtml(item.name)}</span><strong>${formatPrice(item.unitPrice * item.quantity)}</strong></div>`).join('')}</div>
        <div class="pedido-total"><span>Total</span><strong>${formatPrice(order.total)}</strong></div>
        <p class="pedido-delivery">${order.fulfillment === 'delivery' ? `Entrega em ${escapeHtml(order.address?.neighborhood || 'seu endereço')}` : 'Retirada no Japi da Penha'} · ${escapeHtml(order.payment || 'Pagamento selecionado')}</p>
      </section>
      <a class="pedido-button pedido-button-primary" href="cardapio.html">Fazer outro pedido</a>`;
  };

  render();
  window.setInterval(render, 15000);
})();
