const assets = 'public/assets/';
const orderUrl = 'checkout.html';
const instagramUrl = 'https://www.instagram.com/jokerburgerebeer/';

const vehicles = [
  {name:'Joker Fiel', type:'Burger da casa', image:'joker/joker-fiel.jpg', tags:['pão brioche','cheddar','molho da casa'], copy:'O clássico que faz a fome voltar: burger suculento, queijo derretido e aquele tempero que já virou lenda no Japi.', price:'Peça pelo app'},
  {name:'American Joker', type:'Mais que burger', image:'joker/joker-close.jpg', tags:['burger artesanal','bacon','queijo'], copy:'Grande, exagerado e pronto para a primeira mordida. Um burger para comer sem pressa e lembrar depois.', price:'Peça pelo app'},
  {name:'New Chicken', type:'Frango crocante', image:'joker/joker-chicken.jpg', tags:['frango','crocante','molho Joker'], copy:'Frango crocante, molho cremoso e pão macio. A escolha certa quando a vontade pede algo diferente.', price:'Peça pelo app'},
  {name:'Joker Combo', type:'Combo completo', image:'joker/joker-combo.jpg', tags:['burger','batata','bebida'], copy:'Burger, batata e bebida gelada na mesma jogada. Ideal para matar a fome em casa ou dividir a resenha.', price:'Peça pelo app'},
  {name:'Joker Fiel — Duplo', type:'Para a fome grande', image:'joker/joker-fiel.jpg', tags:['duplo','cheddar','muito sabor'], copy:'Duas camadas de sabor para quem não veio brincar. Escolha seu burger e deixe o resto com a chapa.', price:'Peça pelo app'},
  {name:'Joker na mesa', type:'Para compartilhar', image:'joker/joker-date.jpg', tags:['resenha','porções','chope'], copy:'A experiência completa da casa: comida caprichada, mesa cheia e uma noite que pede repeteco.', price:'Peça pelo app'}
];

const experiences = [
  {title:'Burger saindo da chapa', image:'joker/joker-close.jpg', copy:'Carne no ponto, queijo derretendo e aquele cheiro que avisa: hoje tem Joker.'},
  {title:'Combo para dividir', image:'joker/joker-combo.jpg', copy:'Batata crocante, bebida gelada e burger na mesa. Chame sua turma e escolha o combo.'},
  {title:'New Chicken crocante', image:'joker/joker-chicken.jpg', copy:'Uma mordida e pronto: frango crocante, molho cremoso e vontade de pedir mais.'},
  {title:'A casa é da galera', image:'joker/joker-galera.jpg', copy:'Joker é comida boa, resenha e uma mesa que sempre cabe mais um.'}
];

const journal = [
  {date:'Joker Burger Beer / Cardápio', title:'Qual vai ser o seu Joker de hoje?', copy:'Do clássico ao duplo, escolha o burger que combina com a sua fome e peça direto pelo app.', image:'joker/joker-fiel.jpg'},
  {date:'Combos / Delivery', title:'Burger, batata e bebida: fechou', copy:'O combo completo chega pronto para transformar qualquer noite comum em noite de Joker.', image:'joker/joker-combo.jpg'},
  {date:'New Chicken / Crocância', title:'New Chicken: o croc que chama', copy:'Frango crocante, molho cremoso e muito sabor. Peça pelo link da bio.', image:'joker/joker-chicken.jpg'},
  {date:'Na casa / Resenha', title:'Mais que burger', copy:'Tem comida boa, chope gelado e espaço para a sua galera no Japi da Penha.', image:'joker/joker-date.jpg'},
  {date:'Joker Fiel / Programa', title:'Fidelidade que dá fome', copy:'Já conhece o Joker Fiel? Acompanhe as novidades e aproveite as vantagens da casa.', image:'joker/joker-fiel.jpg'},
  {date:'Instagram / @jokerburgerebeer', title:'Acompanhe as novidades', copy:'Promoções, lançamentos e aquela fome visual que aparece no feed.', image:'joker/joker-galera.jpg'}
];

const reviews = [
  {image:'joker/joker-date.jpg', alt:'Burger e batata na mesa da Joker', title:'Burger caprichado e resenha garantida', copy:'Uma casa para chegar com fome, escolher sem pressa e sair já pensando no próximo pedido.', author:'Joker Burger e Beer', date:'Rua Comandante Vergueiro da Cruz, 584'},
  {image:'joker/joker-galera.jpg', alt:'Clientes com burgers na Joker', title:'Aqui a fome não tem vez', copy:'Burger suculento, porções para compartilhar e aquele clima bom de quem encontrou o lugar certo.', author:'Japi da Penha', date:'Dom–Qui 18h às 23h30'},
  {image:'joker/joker-combo.jpg', alt:'Combo Joker com batata e bebida', title:'Mais que burger', copy:'A experiência Joker junta comida boa, bebida gelada e uma mesa que sempre cabe mais um.', author:'Joker Burger e Beer', date:'Peça pelo app'}
];

function vehicleCard(item){
  return `<article class="vehicle-card"><div class="vehicle-card-inner"><img src="${assets}${item.image}" alt="${item.name} da Joker Burger e Beer" loading="lazy"><div class="card-body"><div class="card-label">${item.type}</div><h3>${item.name}</h3><div class="tags">${item.tags.map(tag=>`<span>${tag}</span>`).join('')}</div><p>${item.copy}</p><div class="card-bottom"><a class="button button-dark" href="${orderUrl}">Pedir agora</a><div class="price"><strong>${item.price}</strong></div></div></div></div></article>`;
}

function experienceCard(item){
  return `<article class="experience-card"><img src="${assets}${item.image}" alt="${item.title}" loading="lazy"><div class="experience-card-copy"><h3>${item.title}</h3><p>${item.copy}</p></div></article>`;
}

function journalCard(item){
  return `<article class="journal-card"><div class="journal-card-inner"><img src="${assets}${item.image}" alt="${item.title}" loading="lazy"><div class="journal-card-body"><div class="journal-date">${item.date}</div><h3>${item.title}</h3><p>${item.copy}</p><a href="${orderUrl}">→ Pedir agora</a></div></div></article>`;
}

document.querySelector('[data-rail="vehicles"]').innerHTML = vehicles.map(vehicleCard).join('');
document.querySelector('[data-rail="experiences"]').innerHTML = experiences.map(experienceCard).join('');
document.querySelector('[data-rail="journal"]').innerHTML = journal.map(journalCard).join('');

const railFor = name => document.querySelector(`[data-rail="${name}"]`);
document.querySelectorAll('[data-next],[data-prev]').forEach(button => {
  button.addEventListener('click', () => {
    const rail = railFor(button.dataset.next || button.dataset.prev);
    const direction = button.dataset.next ? 1 : -1;
    rail.scrollBy({left: direction * rail.clientWidth * .78, behavior:'smooth'});
  });
});

const coverflow = document.querySelector('[data-instagram-coverflow]');
if (coverflow) {
  const frame = coverflow.querySelector('[data-coverflow-frame]');
  const cards = [...coverflow.querySelectorAll('[data-coverflow-card]')];
  const previousButton = coverflow.querySelector('[data-coverflow-prev]');
  const nextButton = coverflow.querySelector('[data-coverflow-next]');
  const status = coverflow.querySelector('[data-coverflow-status]');
  const coverflowReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const count = cards.length;
  let position = 0;
  let target = 0;
  let frameId = null;
  let suppressClick = false;
  let drag = null;
  let coverflowTimer = null;

  const indexAt = value => ((Math.round(value) % count) + count) % count;
  const clampCoverflow = value => value;

  const paintCoverflow = () => {
    const cardWidth = cards[0]?.getBoundingClientRect().width || 0;
    if (!cardWidth) return;

    const pitch = cardWidth * 1.05;
    cards.forEach((card, index) => {
      let offset = index - position;
      offset = ((offset % count) + count) % count;
      if (offset > count / 2) offset -= count;

      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, .56);
      const tilt = Math.min(44 * ramp, 82) * Math.sign(offset);
      const edge = Math.min(1, Math.max(0, count / 2 - distance));
      const opacity = Math.max(0, 1 - .12 * distance) * edge;
      const scale = distance < .01 ? 1.08 : 1;

      card.style.transform = `translate(-50%, -50%) translateX(${offset * pitch}px) translateZ(${-0.6 * cardWidth * ramp}px) rotateY(${-tilt}deg) scale(${scale})`;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(100 - Math.round(distance));
      card.setAttribute('aria-current', distance < .01 ? 'true' : 'false');
      card.classList.toggle('is-active', distance < .01);
    });

    if (status) status.textContent = `${indexAt(position) + 1} / ${count}`;
  };

  const settleCoverflow = nextPosition => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    target = nextPosition;

    if (coverflowReduceMotion.matches) {
      position = target;
      paintCoverflow();
      return;
    }

    const step = () => {
      const remaining = target - position;
      if (Math.abs(remaining) < .0004) {
        position = target;
        paintCoverflow();
        frameId = null;
        return;
      }
      position += remaining * .16;
      paintCoverflow();
      frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
  };

  const nudgeCoverflow = amount => settleCoverflow(target + amount);
  const goToCoverflow = index => settleCoverflow(index + Math.round((target - index) / count) * count);
  const stopCoverflowRotation = () => {
    if (coverflowTimer === null) return;
    window.clearInterval(coverflowTimer);
    coverflowTimer = null;
  };
  const startCoverflowRotation = () => {
    if (coverflowReduceMotion.matches || coverflowTimer !== null) return;
    coverflowTimer = window.setInterval(() => nudgeCoverflow(1), 2000);
  };

  const resizeCoverflow = () => paintCoverflow();
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(resizeCoverflow);
    observer.observe(frame);
  }
  window.addEventListener('resize', resizeCoverflow);

  frame.addEventListener('pointerdown', event => {
    stopCoverflowRotation();
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    frame.setPointerCapture(event.pointerId);
    drag = {id:event.pointerId, startX:event.clientX, startPosition:position, lastX:event.clientX, lastTime:performance.now(), velocity:0, moved:false};
  });

  frame.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const cardWidth = cards[0]?.getBoundingClientRect().width || 0;
    const pitch = cardWidth * 1.05;
    if (!pitch) return;

    const now = performance.now();
    const previousPosition = position;
    position = clampCoverflow(drag.startPosition - (event.clientX - drag.startX) / pitch);
    drag.velocity = (position - previousPosition) / Math.max((now - drag.lastTime) / 1000, .016);
    drag.lastX = event.clientX;
    drag.lastTime = now;
    drag.moved = drag.moved || Math.abs(event.clientX - drag.startX) > 5;
    paintCoverflow();
  });

  const endCoverflowDrag = event => {
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick = drag.moved;
    const carried = Math.max(-2, Math.min(2, drag.velocity * .18));
    drag = null;
    settleCoverflow(Math.round(position + carried));
    startCoverflowRotation();
  };
  frame.addEventListener('pointerup', endCoverflowDrag);
  frame.addEventListener('pointercancel', endCoverflowDrag);

  frame.addEventListener('click', event => {
    const card = event.target.closest('[data-coverflow-card]');
    if (!card) return;
    if (suppressClick) {
      event.preventDefault();
      suppressClick = false;
      return;
    }
    const index = cards.indexOf(card);
    if (index !== indexAt(position)) {
      event.preventDefault();
      goToCoverflow(index);
    }
  });

  frame.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nudgeCoverflow(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      nudgeCoverflow(1);
    }
  });
  previousButton?.addEventListener('click', () => nudgeCoverflow(-1));
  nextButton?.addEventListener('click', () => nudgeCoverflow(1));
  frame.addEventListener('mouseenter', stopCoverflowRotation);
  frame.addEventListener('mouseleave', startCoverflowRotation);
  frame.addEventListener('focusin', stopCoverflowRotation);
  frame.addEventListener('focusout', event => {
    if (!coverflow.contains(event.relatedTarget)) startCoverflowRotation();
  });
  if (coverflowReduceMotion.addEventListener) coverflowReduceMotion.addEventListener('change', () => {
    paintCoverflow();
    if (coverflowReduceMotion.matches) stopCoverflowRotation();
    else startCoverflowRotation();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopCoverflowRotation();
    else startCoverflowRotation();
  });
  paintCoverflow();
  startCoverflowRotation();
}

const footer = document.querySelector('.site-footer');
const footerRevealItems = [...document.querySelectorAll('[data-footer-reveal]')];
if (footer && footerRevealItems.length) {
  footerRevealItems.forEach((item, index) => item.style.setProperty('--footer-delay', `${index * .1}s`));
  footer.classList.add('footer-motion-ready');
  const revealFooterItem = item => item.classList.add('is-visible');
  const footerReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (footerReduceMotion.matches || !('IntersectionObserver' in window)) {
    footerRevealItems.forEach(revealFooterItem);
  } else {
    const footerObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealFooterItem(entry.target);
        footerObserver.unobserve(entry.target);
      });
    }, {threshold:.12});
    footerRevealItems.forEach(item => footerObserver.observe(item));
  }
}

const reviewReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const reviewTitle = document.querySelector('#reviews-title');
const reviewCopy = document.querySelector('#review-copy');
const reviewAuthor = document.querySelector('#review-author');
const reviewImage = document.querySelector('#review-image');

const replayReviewFold = element => {
  if (!element || reviewReduceMotion.matches) return;
  element.classList.remove('is-folding');
  void element.offsetWidth;
  element.classList.add('is-folding');
};

const renderFoldedTitle = text => {
  if (!reviewTitle) return;
  reviewTitle.setAttribute('aria-label', text);
  reviewTitle.replaceChildren();
  const visual = document.createElement('span');
  visual.className = 'review-fold-visual';
  visual.setAttribute('aria-hidden', 'true');
  [...text].forEach((character, index) => {
    const piece = document.createElement('span');
    piece.className = 'review-fold-piece';
    piece.style.setProperty('--review-fold-delay', `${index * .018}s`);
    piece.textContent = character === ' ' ? '\u00A0' : character;
    visual.appendChild(piece);
  });
  reviewTitle.appendChild(visual);
};

let reviewIndex = 0;
function renderReview(animate = true){
  const review = reviews[reviewIndex];
  const title = `“${review.title}”`;
  reviewImage.src = assets + review.image;
  reviewImage.alt = review.alt;
  renderFoldedTitle(title);
  reviewCopy.textContent = review.copy;
  reviewAuthor.innerHTML = `${review.author} <span>${review.date}</span>`;
  if (animate) {
    replayReviewFold(reviewTitle);
    replayReviewFold(reviewCopy);
    replayReviewFold(reviewAuthor);
    replayReviewFold(reviewImage);
  }
}

const reviewRegion = document.querySelector('.testimonials');
let reviewTimer = null;

const stopReviewRotation = () => {
  if (reviewTimer === null) return;
  window.clearInterval(reviewTimer);
  reviewTimer = null;
};

const startReviewRotation = () => {
  if (reviewReduceMotion.matches || reviewTimer !== null) return;
  reviewTimer = window.setInterval(() => {
    reviewIndex = (reviewIndex + 1) % reviews.length;
    renderReview();
  }, 2000);
};

renderReview(false);

if (reviewRegion) {
  reviewRegion.addEventListener('mouseenter', stopReviewRotation);
  reviewRegion.addEventListener('mouseleave', startReviewRotation);
  reviewRegion.addEventListener('focusin', stopReviewRotation);
  reviewRegion.addEventListener('focusout', event => {
    if (!reviewRegion.contains(event.relatedTarget)) startReviewRotation();
  });
  startReviewRotation();
}

if (reviewReduceMotion.addEventListener) {
  reviewReduceMotion.addEventListener('change', () => {
    if (reviewReduceMotion.matches) stopReviewRotation();
    else startReviewRotation();
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopReviewRotation();
  else startReviewRotation();
});

const header = document.querySelector('#site-header');
const syncHeader = () => header.classList.toggle('scrolled', window.scrollY > 90);
window.addEventListener('scroll', syncHeader, {passive:true});
syncHeader();

const hero = document.querySelector('.hero');
const heroLayers = [...document.querySelectorAll('.hero-burger-piece')];
const burgerMotion = {
  'hero-burger-top': {x: 10, y: -84, rotate: -6, scale: .98},
  'hero-burger-salad': {x: -14, y: -42, rotate: 3, scale: 1},
  'hero-burger-cheese': {x: 14, y: -8, rotate: -2, scale: 1.01},
  'hero-burger-patty': {x: -12, y: 32, rotate: 2, scale: 1.01},
  'hero-burger-bottom': {x: 8, y: 82, rotate: -2, scale: 1.02}
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let heroFrame = 0;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const syncHeroBurger = () => {
  heroFrame = 0;
  if (!hero || !heroLayers.length) return;

  const heroRect = hero.getBoundingClientRect();
  const scrollRange = Math.max(1, hero.offsetHeight - window.innerHeight);
  const progress = reduceMotion.matches ? 0 : clamp(-heroRect.top / scrollRange, 0, 1);
  const motionScale = window.matchMedia('(max-width:760px)').matches ? .62 : 1;

  hero.style.setProperty('--hero-progress', progress.toFixed(4));
  hero.style.setProperty('--burger-progress', progress.toFixed(4));
  heroLayers.forEach(layer => {
    const key = [...layer.classList].find(className => burgerMotion[className]);
    const motion = burgerMotion[key];
    if (!motion) return;
    layer.style.setProperty('--burger-x', `${motion.x * progress * motionScale}px`);
    layer.style.setProperty('--burger-y', `${motion.y * progress * motionScale}px`);
    layer.style.setProperty('--burger-rotate', `${motion.rotate * progress}deg`);
    layer.style.setProperty('--burger-scale', `${1 + ((motion.scale - 1) * progress)}`);
  });
};
const queueHeroBurger = () => {
  if (heroFrame) return;
  heroFrame = requestAnimationFrame(syncHeroBurger);
};
window.addEventListener('scroll', queueHeroBurger, {passive:true});
window.addEventListener('resize', queueHeroBurger);
if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', queueHeroBurger);
syncHeroBurger();

const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.setAttribute('aria-label', open ? 'Abrir menu' : 'Fechar menu');
  mobileMenu.hidden = open;
  document.body.classList.toggle('menu-open', !open);
  if (!open) mobileMenu.querySelector('a')?.focus();
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click',()=>{
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded','false');
  menuButton.setAttribute('aria-label','Abrir menu');
  document.body.classList.remove('menu-open');
}));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || menuButton.getAttribute('aria-expanded') !== 'true') return;
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded','false');
  menuButton.setAttribute('aria-label','Abrir menu');
  document.body.classList.remove('menu-open');
  menuButton.focus();
});
