// global cart state
let cart = [];
// Global products array
let products = [];
// browsing state
const browseState = {
  gender: null,         // 'womens' | 'mens' | null
  category: 'All',      // category name or 'All'
  sort: 'name'
};

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
  setupBrowse();
});

function loadProducts() {
  fetch("https://gist.githubusercontent.com/rconnolly/d37a491b50203d66d043c26f33dbd798/raw/37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok: " + response.status);
      }
      return response.json();
    })
    .then(data => {
      products = data;
      console.log("Loaded products:", products);

      // Rebuild any dynamic UI that depends on products
      buildColorFilters();          // your dynamic COLORS accordion
      // renderBrowseGrid();        // if you want to refresh the browse view
      // renderHomeFeatured();      // etc., if you have other product-based UIs
    })
    .catch(err => {
      console.error("Error loading products JSON:", err);
    });
}

function buildGenderCategoryCards() {
  const gallery = document.querySelector('#genderCategoryGallery');
  if (!gallery) return;

  // Only build once
  if (gallery.children.length > 0) return;

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

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-card';
    btn.dataset.category = cat;

    const ph = document.createElement('div');
    ph.className = 'placeholder';
    ph.textContent = 'placeholder';

    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = cat;

    btn.appendChild(ph);
    btn.appendChild(label);
    gallery.appendChild(btn);
  });
}

function buildColorFilters() {
  const container = document.querySelector('#colorFilter');
  if (!container || !products || products.length === 0) return;

  // Collect unique colors from JSON
  const seen = new Set();
  const colors = [];

  products.forEach(p => {
    (p.color || []).forEach(c => {
      if (!c || !c.name) return;
      if (!seen.has(c.name)) {
        seen.add(c.name);
        colors.push(c);  // { name, hex }
      }
    });
  });

  // Sort alphabetically by name for a nice UI
  colors.sort((a, b) => a.name.localeCompare(b.name));

  // Clear any existing content
  container.innerHTML = '';

  // Create checkbox for each color
  colors.forEach(c => {
    const label = document.createElement('label');
    label.className = 'filter-checkbox';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'color';
    input.value = c.name;
    input.dataset.hex = c.hex;   // for swatches

    const text = document.createElement('span');
    text.textContent = c.name;

    // If you want a tiny swatch but still “toggle-style”, you can add:
    const swatch = document.createElement('span');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = c.hex;
    label.append(input, swatch, text);
    container.appendChild(label);
  });
}

function setupBrowse() {
  const navBrowse = document.querySelector('#navBrowse');
  const navHome   = document.querySelector('#navHome');
  const navWomen  = document.querySelector('#navWomen');
  const navMen    = document.querySelector('#navMen');

  const filterArticle = document.querySelector('#filter');          // browse layout
  const homeIntro     = document.querySelector('#homeIntro');
  const genderCategoriesSection = document.querySelector('#genderCategories');

  const browseGrid = document.querySelector('#browseGrid');
  const browseSort = document.querySelector('#browseSort');

  const heroSection = document.querySelector('.hero');
  const heroCopy    = document.querySelector('#heroCopy');
  const heroLabel   = document.querySelector('#heroLabel');

  if (!filterArticle || !browseGrid) return;

  if (navBrowse) {
    navBrowse.addEventListener('click', (e) => {
      e.preventDefault();

      // nav states
      navBrowse.classList.add('active');
      navBrowse.setAttribute('aria-current', 'page');

      if (navHome) {
        navHome.classList.remove('active');
        navHome.removeAttribute('aria-current');
      }
      if (navWomen) {
        navWomen.classList.remove('active');
        navWomen.removeAttribute('aria-current');
      }
      if (navMen) {
        navMen.classList.remove('active');
        navMen.removeAttribute('aria-current');
      }

      // hide hero completely on Browse
      if (heroSection) {
        heroSection.classList.add('hidden');
      }
      if (heroCopy && heroLabel) {
        heroCopy.classList.remove('hidden');
        heroLabel.classList.add('hidden');
      }

      // hide home intro & gender categories, show browse article
      if (homeIntro) homeIntro.classList.add('hidden');
      if (genderCategoriesSection) genderCategoriesSection.classList.add('hidden');
      filterArticle.classList.remove('hidden');

      renderBrowseGrid();
      setupAccordions();
    });
  }

  // sort change
  if (browseSort) {
    browseSort.addEventListener('change', () => {
      browseState.sort = browseSort.value;
      renderBrowseGrid();
    });
  }

  // core renderer: apply filters to `products` and paint grid
  function renderBrowseGrid() {
    if (!products || products.length === 0) return;

    let list = [...products];

    // filter by gender if wired later from sidebar pills
    if (browseState.gender) {
      list = list.filter(p => p.gender === browseState.gender);
    }

    // filter by category from sidebar (if you wire it)
    if (browseState.category && browseState.category !== 'All') {
      list = list.filter(p => p.category === browseState.category);
    }

    // sort
    if (browseState.sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (browseState.sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (browseState.sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    // render cards
    browseGrid.innerHTML = '';
    list.forEach(p => {
        const card = document.createElement('article');
        card.classList.add('product-card');

        // top placeholder image
        const imgPlaceholder = document.createElement('div');
        imgPlaceholder.classList.add('placeholder-img');
        imgPlaceholder.textContent = 'placeholder';

        // title
        const title = document.createElement('div');
        title.classList.add('title');
        title.textContent = p.name;

        // bottom row: price + button
        const footer = document.createElement('div');
        footer.classList.add('product-footer');

        const price = document.createElement('span');
        price.classList.add('price');
        price.textContent = `$${p.price.toFixed(2)}`;

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.classList.add('btn-add-cart');
        addBtn.dataset.id = p.id;
        addBtn.setAttribute('aria-label', `Add ${p.name} to cart`);
        addBtn.textContent = '+';

        // (optional) hook up add-to-cart logic here
        // addBtn.addEventListener('click', () => addToCartFromBrowse(p));

        footer.appendChild(price);
        footer.appendChild(addBtn);

        // assemble card
        card.appendChild(imgPlaceholder);
        card.appendChild(title);
        card.appendChild(footer);

        // add to grid
        browseGrid.appendChild(card);
    });
  }

  // sidebar accordion setup (Gender / Category / Size / Colors)
  function setupAccordions() {
    const headers = document.querySelectorAll('.collapsible-header');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const arrow = header.querySelector('.arrow');

        content.classList.toggle('expanded');
        if (arrow) {
          arrow.classList.toggle('expanded');
        }
      });
    });
  }

  // optional: expose for debugging in console
  window.renderBrowseGrid = renderBrowseGrid;
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
  const homeLink   = document.querySelector('#navHome');
  const womenLink  = document.querySelector('#navWomen');
  const menLink    = document.querySelector('#navMen');
  const browseLink = document.querySelector('#navBrowse');

  const heroSection = document.querySelector('.hero');
  const heroCopy    = document.querySelector('#heroCopy');
  const heroLabel   = document.querySelector('#heroLabel');
  const heroCategoryLabel = document.querySelector('#heroCategoryLabel');

  const homeIntro   = document.querySelector('#homeIntro');
  const genderCategoriesSection = document.querySelector('#genderCategories'); // hero category grid
  const browseArticle = document.querySelector('#filter'); // Browse view article

  if (!heroCopy || !heroLabel) return;

  // Show only WOMEN/MEN categories (3x4) under hero
  function showGenderView(gender) {
    if (heroSection) {
      heroSection.classList.remove('hidden');
    }
    // nav state
    if (homeLink) {
      homeLink.classList.remove('active');
      homeLink.removeAttribute('aria-current');
    }
    if (browseLink) {
      browseLink.classList.remove('active');
      browseLink.removeAttribute('aria-current');
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

    // hero: compact height + bilingual WOMEN/MEN label
    if (heroSection) heroSection.classList.add('hero--compact');
    heroCopy.classList.add('hidden');
    heroLabel.classList.remove('hidden');

    const genderLabels = {
      women: {
        np: "महिलाहरूको लुगा",
        en: "WOMEN'S CLOTHING"
      },
      men: {
        np: "पुरुषहरूको लुगा",
        en: "MEN'S CLOTHING"
      }
    };
    const key = gender.toLowerCase();
    const label = genderLabels[key];

    if (label) {
      heroCategoryLabel.textContent = "";
      const npSpan = document.createElement("span");
      npSpan.className = "hero-label-np";
      npSpan.textContent = label.np;

      const enSpan = document.createElement("span");
      enSpan.className = "hero-label-en";
      enSpan.textContent = label.en;

      heroCategoryLabel.appendChild(npSpan);
      heroCategoryLabel.appendChild(enSpan);
    }

    // hide home intro, hide browse, show gender categories section
    if (homeIntro) homeIntro.classList.add('hidden');
    if (browseArticle) browseArticle.classList.add('hidden');
    if (genderCategoriesSection) {
      genderCategoriesSection.classList.remove('hidden');
      buildGenderCategoryCards();
    }
  }

  // Show HOME view (hero tagline + Our Story, nothing else)
  function showHomeView() {
    if (heroSection) {
      heroSection.classList.remove('hidden');
    }
    // nav state
    if (homeLink) {
      homeLink.classList.add('active');
      homeLink.setAttribute('aria-current', 'page');
    }
    if (womenLink) {
      womenLink.classList.remove('active');
      womenLink.removeAttribute('aria-current');
    }
    if (menLink) {
      menLink.classList.remove('active');
      menLink.removeAttribute('aria-current');
    }
    if (browseLink) {
      browseLink.classList.remove('active');
      browseLink.removeAttribute('aria-current');
    }

    // hero: tall with tagline
    if (heroSection) heroSection.classList.remove('hero--compact');
    heroCopy.classList.remove('hidden');
    heroLabel.classList.add('hidden');

    // show home intro, hide gender categories & browse
    if (homeIntro) homeIntro.classList.remove('hidden');
    if (genderCategoriesSection) genderCategoriesSection.classList.add('hidden');
    if (browseArticle) browseArticle.classList.add('hidden');
  }

  // hook up clicks
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      showHomeView();
    });
  }

  if (womenLink) {
    womenLink.addEventListener('click', (e) => {
      e.preventDefault();
      showGenderView('women');
    });
  }

  if (menLink) {
    menLink.addEventListener('click', (e) => {
      e.preventDefault();
      showGenderView('men');
    });
  }

  // start in home view
  showHomeView();
}