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

const FEATURED_IMAGE_MAP = {
  "Wool Coat": "/images/Wool Coat.jpg",
  "Leather Moto Jacket": "/images/Leather Moto Jacket.jpg",
  "Wool Blend Trench Coat": "/images/Wool Blend Trench Coat.jpg",
  "Cashmere Robe": "/images/Cashmere Robe 2.jpg"
};

let toastTimer = null;

// Toast notification
function showToast(message) {
  const toast = document.querySelector('#toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

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
  setupCategoryClickToBrowse();
  setupBrowse();
  setupBrowseFilters();
  setupCartButton();
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
      buildSizeFilters()
      buildColorFilters();          // dynamic COLORS accordion
      applyBrowseFilters();
      buildFeaturedProducts();
    })
    .catch(err => {
      console.error("Error loading products JSON:", err);
    });
}

const SIZE_TYPE_MAP = {
  // clothing (general sizes)
  'XS': 'Clothing',
  'S':  'Clothing',
  'M':  'Clothing',
  'L':  'Clothing',
  'XL': 'Clothing',

  // dual sizes (robe / loungewear style)
  'S/M':  'Dual clothing',
  'L/XL': 'Dual clothing',

  // one size accessories / scarves / bags
  'One Size': 'One-size / accessories',

  // pants (waist)
  '24': 'Pants',
  '26': 'Pants',
  '28': 'Pants',
  '30': 'Pants',
  '32': 'Pants',

  // numeric shoe sizes
  '6':  'Shoe size',
  '7':  'Shoe size',
  '8':  'Shoe size',
  '9':  'Shoe size',
  '10': 'Shoe size'
};

function buildSizeFilters() {
  const container = document.querySelector('#sizeFilter');
  if (!container || !products || products.length === 0) return;

  const seen = new Set();
  const sizes = [];

  products.forEach(p => {
    (p.sizes || []).forEach(sz => {
      if (!sz || seen.has(sz)) return;
      seen.add(sz);
      sizes.push(sz);
    });
  });

  sizes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  container.innerHTML = '';

  sizes.forEach(sz => {
    const wrapper = document.createElement('div');
    wrapper.className = 'filter-checkbox';

    const id = `size-${sz.replace(/\W+/g, '').toLowerCase()}`;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.dataset.size = sz;

    const label = document.createElement('label');
    label.htmlFor = id;

    // Look up a friendly type label (Shoes, Clothing, etc.)
    const type = SIZE_TYPE_MAP[sz];
    label.textContent = type ? `${sz} (${type})` : sz;

    wrapper.append(input, label);
    container.appendChild(wrapper);
  });
}

function buildGenderCategoryCards(gender) {
  const gallery = document.querySelector('#genderCategoryGallery');
  if (!gallery) return;

  // Always rebuild for the selected gender
  gallery.textContent = '';

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
    btn.dataset.gender = gender;   // 👈 now gender will be set correctly

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

  // Collect unique colors from products
  const seen = new Set();
  const colors = [];

  products.forEach(p => {
    const colorArray = p.color || p.colors || [];
    colorArray.forEach(c => {
      if (!c) return;
      const name = typeof c === 'string' ? c : c.name;
      const hex  = typeof c === 'string' ? '#ccc' : c.hex;
      if (!name || seen.has(name)) return;
      seen.add(name);
      colors.push({ name, hex });
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
    input.dataset.color = c.name;
    input.dataset.hex   = c.hex;

    const text = document.createElement('span');
    text.textContent = c.name;

    const swatch = document.createElement('span');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = c.hex;

    label.append(input, swatch, text);
    container.appendChild(label);
  });
}

const sizeTypeMap = {
  // Clothing
  'XS': 'Clothing',
  'S':  'Clothing',
  'M':  'Clothing',
  'L':  'Clothing',
  'XL': 'Clothing',
  'One Size': 'Clothing',
  'S/M': 'Clothing',
  'L/XL': 'Clothing',

  // Pants (waist)
  '24': 'Pants',
  '26': 'Pants',
  '28': 'Pants',
  '30': 'Pants',
  '32': 'Pants',

  // Shoes
  '6': 'Shoes',
  '7': 'Shoes',
  '8': 'Shoes',
  '9': 'Shoes'
};

const browseFilters = {
  genders: new Set(),      // 'womens' , 'mens'
  categories: new Set(),    // 'Tops', 'Intimates', ...
  sizes: new Set(),  // 'Small', 'Medium', ...
  colors: new Set()  // 'Beige', 'Blue', ...
};

function setupBrowseFilters() {
  const sidebar = document.querySelector('.browse-filters');
  const tagsRow = document.querySelector('#browseTags');

  if (!sidebar || !tagsRow) return;

  // Gender + category: click on pill buttons
  sidebar.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;

    if (pill.dataset.gender) {
        // ---- GENDER: multi-select (mens, womens) ----
        const g = pill.dataset.gender; // 'mens' or 'womens'

        if (browseFilters.genders.has(g)) {
            // turn OFF
            browseFilters.genders.delete(g);
            pill.classList.remove('active');
        } else {
            // turn ON
            browseFilters.genders.add(g);
            pill.classList.add('active');
        }

        } else if (pill.dataset.category) {
        // ---- CATEGORY: multi-select, with special "All" ----
        const c = pill.dataset.category; // 'All', 'Tops', 'Intimates', ...

        const allPill = sidebar.querySelector('.filter-pill[data-category="All"]');

        if (c === 'All') {
            // "All" means no category filters
            browseFilters.categories.clear();

            // visually: All ON, others OFF
            sidebar
            .querySelectorAll('.filter-pill[data-category]')
            .forEach(btn => btn.classList.remove('active'));
            if (allPill) allPill.classList.add('active');

        } else {
            // toggle this category
            const isActive = browseFilters.categories.has(c);

            if (isActive) {
            browseFilters.categories.delete(c);
            pill.classList.remove('active');
            } else {
            browseFilters.categories.add(c);
            pill.classList.add('active');
            }

            // if any specific categories selected, All should NOT look active
            if (allPill) {
            allPill.classList.toggle('active', browseFilters.categories.size === 0);
            }
        }
        }

        applyBrowseFilters();
  });

  // Size + color: checkbox changes
  sidebar.addEventListener('change', (e) => {
    const input = e.target;

    if (input.dataset.size) {
      const size = input.dataset.size;
      if (input.checked) {
        browseFilters.sizes.add(size);
      } else {
        browseFilters.sizes.delete(size);
      }
      applyBrowseFilters();
    }

    if (input.dataset.color) {
      const color = input.dataset.color;
      if (input.checked) {
        browseFilters.colors.add(color);
      } else {
        browseFilters.colors.delete(color);
      }
      applyBrowseFilters();
    }
  });

  // Tag row: click on a tag or Clear All (event delegation)
  tagsRow.addEventListener('click', (e) => {
    const clearBtn = e.target.closest('.browse-clear');
    const tag = e.target.closest('.browse-tag');

    if (clearBtn) {
      clearAllBrowseFilters();
    } else if (tag) {
      const type = tag.dataset.type;
      const value = tag.dataset.value;
      removeSingleFilter(type, value);
    }
  });
}

function applyBrowseFilters() {
  if (!products || products.length === 0) return;

  let list = [...products];

  // gender
  if (browseFilters.genders.size > 0) {
    list = list.filter(p => browseFilters.genders.has(p.gender));
  }

  // category (null = All)
  if (browseFilters.categories.size > 0) {
    list = list.filter(p => browseFilters.categories.has(p.category));
  }

  // size (intersection)
  if (browseFilters.sizes.size > 0) {
    list = list.filter(p => {
      const sizes = p.sizes || [];
      return sizes.some(sz => browseFilters.sizes.has(sz));
    });
  }

  // color (intersection on color.name)
  if (browseFilters.colors.size > 0) {
    list = list.filter(p => {
      const colorArray = p.color || p.colors || [];
      const names = colorArray.map(c => typeof c === 'string' ? c : c.name);
      return names.some(name => browseFilters.colors.has(name));
    });
  }

  // sort (using existing browseState.sort)
  if (browseState.sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (browseState.sort === 'category') {
    list.sort((a, b) => a.category.localeCompare(b.category));
  } else if (browseState.sort === 'price-asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (browseState.sort === 'price-desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (browseState.sort === 'best-sales') {
    list.sort((a, b) => (b.sales?.total || 0) - (a.sales?.total || 0));
  }

  renderBrowseGrid(list);
  renderBrowseTags();
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
      hideAllMainViews();

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

      applyBrowseFilters();
      setupAccordions();
    });
  }

  // sort change
  if (browseSort) {
    browseSort.addEventListener('change', () => {
      browseState.sort = browseSort.value;
      applyBrowseFilters();
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
}

function renderBrowseGrid(list) {
  const grid = document.querySelector('#browseGrid');
  if (!grid) return;

  grid.textContent = '';

  list.forEach(p => {
    const card = document.createElement('article');
    card.classList.add('product-card');

    const imgPlaceholder = document.createElement('div');
    imgPlaceholder.classList.add('placeholder-img');
    imgPlaceholder.textContent = 'placeholder';

    const title = document.createElement('div');
    title.classList.add('title');
    title.textContent = p.name;

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

    // Clicking the "+" adds to cart (but doesn't open detail)
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // don't trigger card click
      addToCart(p, 1);
    });

    // Clicking anywhere else on the card opens the single product view
    card.addEventListener('click', () => {
      showSingleProduct(p.id);
    });

    footer.appendChild(price);
    footer.appendChild(addBtn);

    card.appendChild(imgPlaceholder);
    card.appendChild(title);
    card.appendChild(footer);

    grid.appendChild(card);
  });
}

function renderBrowseTags() {
  const tagsRow = document.querySelector('#browseTags');
  if (!tagsRow) return;

  tagsRow.textContent = '';

  const hasAny =
    browseFilters.genders.size > 0 ||
    browseFilters.categories.size > 0 ||
    browseFilters.sizes.size > 0 ||
    browseFilters.colors.size > 0;

  const label = document.createElement('span');
  label.classList.add('browse-tags-label');
  label.textContent = 'Results';
  tagsRow.appendChild(label);

  if (!hasAny) {
    const span = document.createElement('span');
    span.textContent = 'All products';
    tagsRow.appendChild(span);
    return;
  }

  const tags = [];

  // gender
  browseFilters.genders.forEach(g => {
    tags.push({
      type: 'gender',
      value: g,
      label: g === 'womens' ? "Women's" : "Men's"
    });
  });

  // categories
  browseFilters.categories.forEach(cat => {
    tags.push({
      type: 'category',
      value: cat,
      label: cat
    });
  });

  // sizes
  browseFilters.sizes.forEach(size => {
    const typeLabel = sizeTypeMap[size] || 'Size';
    tags.push({
        type: 'size',
        value: size,
        label: `${size} - ${typeLabel}`   // e.g. "7 – Shoes"
    });
  });

  // colors
  browseFilters.colors.forEach(color => {
    tags.push({ type: 'color', value: color, label: color });
  });

  tags.forEach(t => {
    const tagEl = document.createElement('button');
    tagEl.type = 'button';
    tagEl.classList.add('browse-tag');
    tagEl.dataset.type = t.type;
    tagEl.dataset.value = t.value;

    const text = document.createElement('span');
    text.textContent = t.label;

    const x = document.createElement('span');
    x.classList.add('browse-tag-remove');
    x.textContent = '×';

    tagEl.appendChild(text);
    tagEl.appendChild(x);
    tagsRow.appendChild(tagEl);
  });

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.classList.add('browse-clear');
  clearBtn.textContent = '✕ Clear All';
  tagsRow.appendChild(clearBtn);
}

function clearAllBrowseFilters() {
  browseFilters.genders.clear();
  browseFilters.categories.clear();
  browseFilters.sizes.clear();
  browseFilters.colors.clear();

  const sidebar = document.querySelector('.browse-filters');
  if (sidebar) {
    sidebar.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    sidebar.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.checked = false;
    });

    // make "All" category pill active again
    const allPill = sidebar.querySelector('.filter-pill[data-category="All"]');
    if (allPill) allPill.classList.add('active');
  }

  applyBrowseFilters();
}

function removeSingleFilter(type, value) {
  const sidebar = document.querySelector('.browse-filters');

  if (type === 'gender') {
    browseFilters.genders.delete(value);
    if (sidebar) {
      const pill = sidebar.querySelector(`.filter-pill[data-gender="${value}"]`);
      if (pill) pill.classList.remove('active');
    }

  } else if (type === 'category') {
    browseFilters.categories.delete(value);
    if (sidebar) {
      const pill = sidebar.querySelector(`.filter-pill[data-category="${value}"]`);
      if (pill) pill.classList.remove('active');

      // if no categories left, re-activate "All"
      if (browseFilters.categories.size === 0) {
        const allPill = sidebar.querySelector('.filter-pill[data-category="All"]');
        if (allPill) allPill.classList.add('active');
      }
    }

  } else if (type === 'size') {
    browseFilters.sizes.delete(value);
    if (sidebar) {
      const input = sidebar.querySelector(`input[data-size="${value}"]`);
      if (input) input.checked = false;
    }

  } else if (type === 'color') {
    browseFilters.colors.delete(value);
    if (sidebar) {
      const input = sidebar.querySelector(`input[data-color="${value}"]`);
      if (input) input.checked = false;
    }
  }

  applyBrowseFilters();
}

function hideAllMainViews() {
  const heroSection = document.querySelector('.hero');
  const homeIntro   = document.querySelector('#homeIntro');
  const genderCats  = document.querySelector('#genderCategories');
  const browseView  = document.querySelector('#filter');
  const singleView  = document.querySelector('#singleproduct');
  const cartView    = document.querySelector('#cartView');

  if (heroSection) heroSection.classList.add('hidden');
  if (homeIntro)   homeIntro.classList.add('hidden');
  if (genderCats)  genderCats.classList.add('hidden');
  if (browseView)  browseView.classList.add('hidden');
  if (singleView)  singleView.classList.add('hidden');
  if (cartView)    cartView.classList.add('hidden');
}

function showCartView() {
  hideAllMainViews(); // hide hero, home, gender cats, browse, single

  const cartView = document.querySelector('#cartView');
  if (cartView) {
    cartView.classList.remove('hidden');
  }
}

function setupCartButton() {
  const cartLink = document.querySelector('.cart-link');
  if (!cartLink) return;

  cartLink.addEventListener('click', (e) => {
    e.preventDefault();
    hideAllMainViews();
    showCartView();
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

// Generic "add to cart" helper
function addToCart(product, qty = 1) {
  if (!product) return;

  // find existing
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty
    });
  }
  renderCart();
  showToast(`${qty} × ${product.name} added to cart`);
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
      const gKey = gender === 'women' ? 'womens' : 'mens';
      buildGenderCategoryCards(gKey);
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
      hideAllMainViews();
      showHomeView();
    });
  }

  if (womenLink) {
    womenLink.addEventListener('click', (e) => {
      e.preventDefault();
      hideAllMainViews();
      showGenderView('women');
    });
  }

  if (menLink) {
    menLink.addEventListener('click', (e) => {
      e.preventDefault();
      hideAllMainViews();
      showGenderView('men');
    });
  }

  // start in home view
  showHomeView();
}

function setupCategoryClickToBrowse() {
  const gallery    = document.querySelector('#genderCategoryGallery');
  const navBrowse  = document.querySelector('#navBrowse');      // correct id
  const browseArticle = document.querySelector('#filter');

  if (!gallery) return;

  gallery.addEventListener('click', (e) => {
    const card = e.target.closest('.category-card');
    if (!card) return;

    const gender   = card.dataset.gender;   // 'womens' or 'mens'
    const category = card.dataset.category; // e.g. 'Tops'

    // --- 1) Update filter state using browseFilters (not browseState) ---
    browseFilters.genders.clear();
    browseFilters.categories.clear();

    if (gender && gender !== 'All') {
      browseFilters.genders.add(gender);
    }
    if (category && category !== 'All') {
      browseFilters.categories.add(category);
    }

    // Optional: sync sidebar pill UI so it matches filters
    const sidebar = document.querySelector('.browse-filters');
    if (sidebar) {
      // gender pills
      sidebar.querySelectorAll('.filter-pill[data-gender]').forEach(pill => {
        const g = pill.dataset.gender;
        pill.classList.toggle('active', browseFilters.genders.has(g));
      });

      // category pills
      const allPill = sidebar.querySelector('.filter-pill[data-category="All"]');
      sidebar.querySelectorAll('.filter-pill[data-category]').forEach(pill => {
        const c = pill.dataset.category;
        const isActive =
          browseFilters.categories.size === 0
            ? c === 'All'
            : browseFilters.categories.has(c);
        pill.classList.toggle('active', isActive);
      });
    }

    // --- 2) Switch to the Browse view ---
    if (navBrowse) {
      // reuse existing navBrowse click handler
      navBrowse.click();
    } else {
      // fallback: manual show / hide
      if (typeof hideAllMainViews === 'function') {
        hideAllMainViews();
      }
      if (browseArticle) {
        browseArticle.classList.remove('hidden');
      }
      if (typeof applyBrowseFilters === 'function') {
        applyBrowseFilters();
      }
    }
  });
}

function showSingleProduct(productId) {
  if (!products || products.length === 0) return;

  const product = products.find(p => String(p.id) === String(productId));
  if (!product) return;

  const heroSection = document.querySelector('.hero');
  const homeIntro   = document.querySelector('#homeIntro');
  const genderCategoriesSection = document.querySelector('#genderCategories');
  const browseArticle = document.querySelector('#filter');
  const singleArticle = document.querySelector('#singleproduct');

  // Hide other views
  if (heroSection) heroSection.classList.add('hidden');
  if (homeIntro) homeIntro.classList.add('hidden');
  if (genderCategoriesSection) genderCategoriesSection.classList.add('hidden');
  if (browseArticle) browseArticle.classList.add('hidden');

  // Show single product article
  if (singleArticle) singleArticle.classList.remove('hidden');

  renderSingleProduct(product);
}

function renderSingleProduct(product) {
  // Breadcrumb: "Home > Women > Dresses > Product Name"
  const breadcrumb = document.querySelector('#spBreadcrumb');
  if (breadcrumb) {
    const genderLabel =
      product.gender === 'womens' ? "Women" :
      product.gender === 'mens'   ? "Men"   :
      product.gender || "";
    breadcrumb.textContent =
      `Home > ${genderLabel} > ${product.category} > ${product.name}`;
  }

  const titleEl = document.querySelector('#spTitle');
  const priceEl = document.querySelector('#spPrice');
  const descEl  = document.querySelector('#spDescription');
  const matEl   = document.querySelector('#spMaterial');
  const sizeRow = document.querySelector('#spSizes');
  const colorRow = document.querySelector('#spColors');
  const qtyInput = document.querySelector('#spQty');
  const addBtn   = document.querySelector('#spAddToCart');

  if (titleEl) titleEl.textContent = product.name;
  if (priceEl) priceEl.textContent = `$${product.price.toFixed(2)}`;
  if (descEl)  descEl.textContent  = product.description || 'No description available.';
  if (matEl)   matEl.textContent   = product.material || '—';
  if (qtyInput) qtyInput.value = 1;

  // Sizes as pills
  if (sizeRow) {
    sizeRow.textContent = '';
    (product.sizes || []).forEach(sz => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'size-pill';
      pill.textContent = sz;
      sizeRow.appendChild(pill);
    });
  }

  // Color swatches
  if (colorRow) {
    colorRow.textContent = '';
    (product.color || []).forEach(c => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = c.hex || '#e5e7eb';
      swatch.title = c.name || '';
      colorRow.appendChild(swatch);
    });
  }

  // Add-to-cart for this product/quantity
  if (addBtn && qtyInput) {
    addBtn.onclick = () => {
      const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      addToCart(product, qty);
    };
  }

  renderSingleRelatedProducts(product);
}

function renderSingleRelatedProducts(product) {
  const grid = document.querySelector('#spRelatedGrid');
  if (!grid || !products) return;

  grid.textContent = '';

  const related = products
    .filter(p =>
      p.id !== product.id &&
      p.gender === product.gender &&
      p.category === product.category
    )
    .slice(0, 4); // up to 4

  related.forEach(p => {
    const card = document.createElement('article');
    card.classList.add('product-card');

    const imgPlaceholder = document.createElement('div');
    imgPlaceholder.classList.add('placeholder-img');
    imgPlaceholder.textContent = 'placeholder';

    const title = document.createElement('div');
    title.classList.add('title');
    title.textContent = p.name;

    const footer = document.createElement('div');
    footer.classList.add('product-footer');

    const price = document.createElement('span');
    price.classList.add('price');
    price.textContent = `$${p.price.toFixed(2)}`;

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.classList.add('btn-add-cart');
    addBtn.textContent = '+';
    addBtn.setAttribute('aria-label', `Add ${p.name} to cart`);

    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(p, 1);
    });

    footer.append(price, addBtn);
    card.append(imgPlaceholder, title, footer);

    // Clicking a related card navigates to that product detail
    card.addEventListener('click', () => {
      showSingleProduct(p.id);
    });

    grid.appendChild(card);
  });
}

function buildFeaturedProducts() {
  const grid = document.querySelector('#featuredGrid');
  if (!grid || !products || products.length === 0) return;

  // Copy and sort by price descending
  const sorted = [...products].sort((a, b) => b.price - a.price);

  // Prefer products that we actually have images for
  const topWithImages = sorted.filter(p => FEATURED_IMAGE_MAP[p.name]);
  const topFour = (topWithImages.length >= 4 ? topWithImages : sorted).slice(0, 4);

  grid.textContent = '';

  topFour.forEach(p => {
    const card = document.createElement('article');
    card.className = 'featured-card';

    card.addEventListener('click', () => {
      showSingleProduct(p.id);
    });

    // --- image at top ---
    const imgWrap = document.createElement('div');
    imgWrap.className = 'featured-img';

    const img = document.createElement('img');
    img.src = FEATURED_IMAGE_MAP[p.name] || 'images/placeholder.jpg';
    img.alt = p.name;
    img.loading = 'lazy';

    imgWrap.appendChild(img);

    // --- text content ---
    const badge = document.createElement('div');
    badge.className = 'featured-badge';
    const genderLabel =
      p.gender === 'womens' ? "Women's" :
      p.gender === 'mens'   ? "Men's"   : '';
    badge.textContent = `${genderLabel} ${p.category}`.trim();

    const title = document.createElement('h3');
    title.className = 'featured-title';
    title.textContent = p.name;

    const price = document.createElement('p');
    price.className = 'featured-price';
    price.textContent = `$${p.price.toFixed(2)}`;

    const desc = document.createElement('p');
    desc.className = 'featured-desc';
    desc.textContent = p.description || '';

    card.append(imgWrap, badge, title, price, desc);
    grid.appendChild(card);
  });
}