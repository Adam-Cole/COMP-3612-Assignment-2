// global cart state
let cart = [];
// Global products array
let products = [];

function renderCart() {
  const cartSection   = document.querySelector('.cart');
  const itemsContainer = document.querySelector('#cartItems');
  const emptyMsg      = document.querySelector('#emptyMsg');

  const sumMerch  = document.querySelector('#sumMerch');
  const sumShip   = document.querySelector('#sumShip');
  const sumTax    = document.querySelector('#sumTax');
  const sumTotal  = document.querySelector('#sumTotal');
  const cartBadge = document.querySelector('#cartCount');
  const shipBlock = document.querySelector('#shipBlock');
  const shipMethod = document.querySelector('#shipMethod');
  const shipDest   = document.querySelector('#shipDest');
  const checkoutBtn = document.querySelector('#checkoutBtn');

  // remove any existing item rows
  itemsContainer.querySelectorAll('.cart-row').forEach(r => r.remove());

  if (cart.length === 0) {
    // === EMPTY CART STATE ===
    emptyMsg.style.display = 'block';
    cartSection.dataset.state = 'empty';

    cartBadge.textContent = '0';
    sumMerch.textContent = '$0.00';
    sumShip.textContent  = '$0.00';
    sumTax.textContent   = '$0.00';
    sumTotal.textContent = '$0.00';

    shipBlock.classList.add('disabled');
    shipMethod.disabled = true;
    shipDest.disabled   = true;

    checkoutBtn.classList.remove('ready');
    checkoutBtn.disabled = true;
    return;
  }

  // === HAS ITEMS STATE ===
  emptyMsg.style.display = 'none';
  cartSection.dataset.state = 'has-items';

  let merchTotal = 0;
  let itemCount  = 0;

  const template = document.querySelector('#itemTemplate');

  cart.forEach(item => {
    merchTotal += item.price * item.qty;
    itemCount  += item.qty;

    const row = template.content.firstElementChild.cloneNode(true);
    row.dataset.itemId = item.id;

    row.querySelector('.title').textContent = item.name;
    row.querySelector('.price').textContent = `$${item.price.toFixed(2)}`;
    row.querySelector('.qty input').value   = item.qty;
    row.querySelector('.subtotal').textContent =
      `$${(item.price * item.qty).toFixed(2)}`;

    itemsContainer.appendChild(row);
  });

  cartBadge.textContent = itemCount;
  sumMerch.textContent  = `$${merchTotal.toFixed(2)}`;
  // simple example: shipping/tax 0 for now
  sumShip.textContent   = '$0.00';
  sumTax.textContent    = '$0.00';
  sumTotal.textContent  = `$${merchTotal.toFixed(2)}`;

  shipBlock.classList.remove('disabled');
  shipMethod.disabled = false;
  shipDest.disabled   = false;

  checkoutBtn.classList.add('ready');
  checkoutBtn.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();     // set up the empty cart
  loadProducts();   // fetch data-pretty.json and build product cards
  setupAboutDialog();
  setupCategoryView();
});

function loadProducts() {
  fetch('data-pretty.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      products = data;               // store globally
      console.log('Loaded products:', products);

      // Now you can render products, build categories, etc.
      // renderProducts(products);
    })
    .catch(err => {
      console.error('Error loading JSON:', err);
    });
}

function setupAboutDialog() {
  const aboutLink   = document.querySelector('#aboutLink');
  const aboutDialog = document.querySelector('#aboutDialog');
  const closeX      = aboutDialog.querySelector('.about-close');
  const closeBtn    = aboutDialog.querySelector('.about-ok');

  if (!aboutLink || !aboutDialog) return;

  // Open dialog when clicking "About" in nav
  aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    aboutDialog.showModal();
  });

  // Close buttons
  closeX.addEventListener('click', () => aboutDialog.close());
  closeBtn.addEventListener('click', () => aboutDialog.close());

  // Click on dark backdrop closes as well
  aboutDialog.addEventListener('click', (e) => {
    if (e.target === aboutDialog) {
      aboutDialog.close();
    }
  });
}

function setupCategoryView() {
  const homeLink  = document.querySelector('#navHome');
  const womenLink = document.querySelector('#navWomen');
  const menLink   = document.querySelector('#navMen');

  const heroSection = document.querySelector('.hero');
  const heroCopy  = document.querySelector('#heroCopy');
  const heroLabel = document.querySelector('#heroLabel');
  const heroCategoryLabel = document.querySelector('#heroCategoryLabel');

  const homeIntro = document.querySelector('#homeIntro');
  const categoryGallery = document.querySelector('#categoryGallery');

  if (!heroCopy || !heroLabel || !categoryGallery) return;

  const categories = [
    'All',
    'Tops',
    'Bottoms',
    'Sweaters',
    'Outerwear',
    'Dresses',
    'Jumpsuits',
    'Accessories',
    'Shoes',
    'Intimates',
    'Loungewear',
    'Swimwear'
  ];

  function buildCategoryCards() {
    categoryGallery.innerHTML = '';
    categories.forEach(cat => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'category-card';

      const ph = document.createElement('div');
      ph.className = 'placeholder';
      ph.textContent = 'placeholder';

      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = cat;

      card.appendChild(ph);
      card.appendChild(label);
      categoryGallery.appendChild(card);
    });
  }

  function showGenderView(gender) {
    // nav state
    if (homeLink) {
      homeLink.classList.remove('active');
      homeLink.removeAttribute('aria-current');
    }
    if (gender === 'women') {
      womenLink.classList.add('active');
      womenLink.setAttribute('aria-current', 'page');
      menLink.classList.remove('active');
      menLink.removeAttribute('aria-current');
    } else {
      menLink.classList.add('active');
      menLink.setAttribute('aria-current', 'page');
      womenLink.classList.remove('active');
      womenLink.removeAttribute('aria-current');
    }

    // hero: compact height + label
    if (heroSection) heroSection.classList.add('hero--compact');
    heroCopy.classList.add('hidden');
    heroLabel.classList.remove('hidden');
    heroCategoryLabel.textContent = gender.toUpperCase();

    // content: hide home intro, show categories
    if (homeIntro) homeIntro.classList.add('hidden');
    categoryGallery.classList.remove('hidden');
    buildCategoryCards();
  }

  function showHomeView() {
    if (homeLink) {
      homeLink.classList.add('active');
      homeLink.setAttribute('aria-current', 'page');
    }
    womenLink.classList.remove('active');
    womenLink.removeAttribute('aria-current');
    menLink.classList.remove('active');
    menLink.removeAttribute('aria-current');

    if (heroSection) heroSection.classList.remove('hero--compact');
    heroCopy.classList.remove('hidden');
    heroLabel.classList.add('hidden');

    if (homeIntro) homeIntro.classList.remove('hidden');
    categoryGallery.classList.add('hidden');
  }

  // hook up clicks
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      showHomeView();
    });
  }

  womenLink.addEventListener('click', (e) => {
    e.preventDefault();
    showGenderView('women');
  });

  menLink.addEventListener('click', (e) => {
    e.preventDefault();
    showGenderView('men');
  });

  // start in home view
  showHomeView();
}