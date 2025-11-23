// global cart state
let cart = [];
// Global products array
let products = [];
// Drawer state for quick-add options
let optionDrawerProduct = null;
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

// Shipping pricing rules
const SHIPPING_RATES = {
  standard: { CA: 10, US: 15, INT: 20 },
  express:  { CA: 25, US: 25, INT: 30 },
  priority: { CA: 35, US: 50, INT: 50 }
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

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
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

    // DELETE item feature
    const removeBtn = row.querySelector('.remove-icon');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        cart = cart.filter(c => c !== item);
        saveCart();
        renderCart();
      });
    }

    row.querySelector('.title').textContent = item.name;
    row.querySelector('.price').textContent = `$${item.price.toFixed(2)}`;
    row.querySelector('.qty input').value   = item.qty;
    row.querySelector('.subtotal').textContent =
      `$${(item.price * item.qty).toFixed(2)}`;

    // Color cell: set swatch color/title
    const swatch = row.querySelector('.color-cell .swatch');
    if (swatch) {
      if (item.colorHex) {
        swatch.style.backgroundColor = item.colorHex;
        swatch.title = item.colorName || '';
      } else {
        swatch.style.backgroundColor = 'transparent';
        swatch.title = '';
      }
    }

    // Size cell: show size or dash if none
    const sizeCell = row.querySelector('.size-cell');
    if (sizeCell) {
      sizeCell.textContent = item.size || '—';
    }

    // --- QUANTITY CHANGE LISTENERS ---
    const minus = row.querySelector('.qty button:first-child');
    const plus  = row.querySelector('.qty button:last-child');
    const qtyInput = row.querySelector('.qty input');

    minus.addEventListener('click', () => {
      item.qty = Math.max(1, item.qty - 1);
      saveCart();
      renderCart();
    });

    plus.addEventListener('click', () => {
      item.qty++;
      saveCart();
      renderCart();
    });

    qtyInput.addEventListener('change', () => {
      let v = parseInt(qtyInput.value);
      item.qty = isNaN(v) || v < 1 ? 1 : v;
      saveCart();
      renderCart();
    });

    itemsContainer.appendChild(row);
  });

  cartBadge.textContent = itemCount;
  sumMerch.textContent  = `$${merchTotal.toFixed(2)}`;

  // --- SHIPPING & TAX ---
  let shipCost = 0;
  const method = shipMethod.value;
  const dest   = shipDest.value;

  // Free shipping if merchandise > $500
  if (merchTotal > 500) {
    shipCost = 0;
  } else {
    shipCost = SHIPPING_RATES[method][dest];
  }

  let tax = 0;
  if (dest === "CA") tax = merchTotal * 0.05;

  const grandTotal = merchTotal + shipCost + tax;

  sumShip.textContent  = `$${shipCost.toFixed(2)}`;
  sumTax.textContent   = `$${tax.toFixed(2)}`;
  sumTotal.textContent = `$${grandTotal.toFixed(2)}`;

  shipBlock.classList.remove('disabled');
  shipMethod.disabled = false;
  shipDest.disabled   = false;

  checkoutBtn.classList.add('ready');
  checkoutBtn.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  // LOAD CART FROM STORAGE
  const stored = localStorage.getItem("cart");
  if (stored) {
    try {
      cart = JSON.parse(stored);
    } catch (e) {
      cart = [];
    }
  }
  
  renderCart();     // set up the empty cart
  loadProducts();   // fetch data-pretty.json and build product cards
  setupAboutDialog();
  setupCategoryView();
  setupCategoryClickToBrowse();
  setupBrowse();
  setupBrowseFilters();
  setupCartButton();
  setupOptionDrawer();

  // --- SHIPPING OPTION CHANGE LISTENERS ---
  document.querySelector('#shipMethod').addEventListener('change', renderCart);
  document.querySelector('#shipDest').addEventListener('change', renderCart);

  // --- CHECKOUT BUTTON BEHAVIOR ---
  document.querySelector('#checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) return;

    showToast("Your order has been placed!");

    cart = [];          // clear shopping cart
    renderCart();       // update UI
    hideAllMainViews(); // hide all views

    // go back to home view
    document.querySelector('#home').classList.remove('hidden');
    document.querySelector('.hero').classList.remove('hidden');
    document.querySelector('#homeIntro')?.classList.remove('hidden');
    document.querySelector('#homeFeatured')?.classList.remove('hidden');
  });

  // --- CONTINUE SHOPPING BUTTON ---
  document.querySelector('#continueBtn').addEventListener('click', () => {
    // DO NOT clear the cart
    hideAllMainViews();

    // Show the Browse page instead of Home
    document.querySelector('#filter').classList.remove('hidden');
  });
  
  const loader = document.querySelector("#loader");
  if (loader) {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.3s ease";
    setTimeout(() => loader.remove(), 300);
  }

  document.body.classList.add("loaded");  
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

function openOptionDrawer(product) {
  optionDrawerProduct = product;

  const overlay   = document.querySelector('#optionDrawerOverlay');
  const nameEl    = document.querySelector('#optionDrawerProductName');
  const sizeGroup = document.querySelector('#optionDrawerSizeGroup');
  const colorGroup= document.querySelector('#optionDrawerColorGroup');
  const sizeRow   = document.querySelector('#optionDrawerSizes');
  const colorRow  = document.querySelector('#optionDrawerColors');

  if (!overlay || !nameEl || !sizeRow || !colorRow) return;

  nameEl.textContent = product.name || '';

  const sizes = product.sizes || [];
  const colors = product.color || [];

  // Show / hide groups depending on data
  sizeGroup.style.display  = sizes.length ? 'block' : 'none';
  colorGroup.style.display = colors.length ? 'block' : 'none';

  // Build size pills
  sizeRow.textContent = '';
  sizes.forEach((sz, index) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'size-pill';
    pill.textContent = sz;
    pill.dataset.size = sz;

    pill.addEventListener('click', () => {
      sizeRow.querySelectorAll('.size-pill').forEach(btn =>
        btn.classList.remove('is-selected')
      );
      pill.classList.add('is-selected');
    });

    // auto-select the first size
    if (index === 0) {
      pill.classList.add('is-selected');
    }

    sizeRow.appendChild(pill);
  });

  // Build color swatches
  colorRow.textContent = '';
  colors.forEach((c, index) => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = c.hex || '#e5e7eb';
    swatch.title = c.name || '';
    swatch.dataset.colorName = c.name || '';
    swatch.dataset.colorHex  = c.hex || '';

    swatch.addEventListener('click', () => {
      colorRow.querySelectorAll('.color-swatch').forEach(el =>
        el.classList.remove('is-selected')
      );
      swatch.classList.add('is-selected');
    });

    // auto-select the first color
    if (index === 0) {
      swatch.classList.add('is-selected');
    }

    colorRow.appendChild(swatch);
  });

  overlay.classList.remove('hidden');
}

function closeOptionDrawer() {
  const overlay = document.querySelector('#optionDrawerOverlay');
  if (overlay) overlay.classList.add('hidden');
  optionDrawerProduct = null;
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

function setupOptionDrawer() {
  const overlay   = document.querySelector('#optionDrawerOverlay');
  const closeBtn  = document.querySelector('#optionDrawerClose');
  const addBtn    = document.querySelector('#optionDrawerAddBtn');
  const sizeRow   = document.querySelector('#optionDrawerSizes');
  const colorRow  = document.querySelector('#optionDrawerColors');

  if (!overlay || !closeBtn || !addBtn) return;

  // Close on X or backdrop click
  closeBtn.addEventListener('click', closeOptionDrawer);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeOptionDrawer();
    }
  });

  // Confirm selection -> add to cart
  addBtn.addEventListener('click', () => {
    if (!optionDrawerProduct) return;

    let selectedSize = '';
    let selectedColorName = '';
    let selectedColorHex  = '';

    const selectedPill = sizeRow?.querySelector('.size-pill.is-selected');
    if (selectedPill) {
      selectedSize = selectedPill.dataset.size || '';
    }

    const selectedSwatch = colorRow?.querySelector('.color-swatch.is-selected');
    if (selectedSwatch) {
      selectedColorName = selectedSwatch.dataset.colorName || '';
      selectedColorHex  = selectedSwatch.dataset.colorHex || '';
    }

    // Quantity is always 1 from browse grid
    addToCart(optionDrawerProduct, 1, {
      size: selectedSize,
      colorName: selectedColorName,
      colorHex: selectedColorHex
    });

    closeOptionDrawer();
  });
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

    // Clicking the "+" either adds directly or opens options drawer
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // don't trigger card click

      const sizes  = p.sizes || [];
      const colors = p.color || [];

      const multipleSizes  = sizes.length > 1;
      const multipleColors = colors.length > 1;

      // If there's only one size AND only one color (or none), just add immediately
      if (!multipleSizes && !multipleColors) {
        const defaultSize = sizes.length === 1 ? sizes[0] : '';
        const defaultColorName = colors.length === 1 ? (colors[0].name || '') : '';
        const defaultColorHex  = colors.length === 1 ? (colors[0].hex || '')  : '';

        addToCart(p, 1, {
          size: defaultSize,
          colorName: defaultColorName,
          colorHex: defaultColorHex
        });
      } else {
        // Otherwise, let the user choose in the side drawer
        openOptionDrawer(p);
      }
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
function addToCart(product, qty = 1, options = {}) {
  if (!product) return;

  const size      = options.size || null;
  const colorName = options.colorName || null;
  const colorHex  = options.colorHex || null;

  // find existing with same id + size + color
  const existing = cart.find(item =>
    item.id === product.id &&
    item.size === size &&
    item.colorName === colorName &&
    item.colorHex === colorHex
  );

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty,
      size,
      colorName,
      colorHex
    });
  }

  saveCart();
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

  // CLICKING LOGO → ALWAYS GO HOME
  document.querySelector('#homeLogo').addEventListener('click', (e) => {
    e.preventDefault();
    hideAllMainViews();

    // Show home again
    showHomeView();
  });

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
  sizeRow.dataset.selectedSize = '';

  (product.sizes || []).forEach((sz) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'size-pill';
    pill.textContent = sz;
    pill.dataset.size = sz;

    pill.addEventListener('click', () => {
      sizeRow.querySelectorAll('.size-pill').forEach(btn =>
        btn.classList.remove('is-selected')
      );
      pill.classList.add('is-selected');
      sizeRow.dataset.selectedSize = sz;
    });

    sizeRow.appendChild(pill);
  });

  // Auto-select if there's only one size
  if ((product.sizes || []).length === 1) {
    const onlyPill = sizeRow.querySelector('.size-pill');
    if (onlyPill) {
      onlyPill.classList.add('is-selected');
      sizeRow.dataset.selectedSize = product.sizes[0];
    }
  }
}

  // Color swatches
  if (colorRow) {
    colorRow.textContent = '';
    colorRow.dataset.selectedColorName = '';
    colorRow.dataset.selectedColorHex = '';

    (product.color || []).forEach((c) => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = c.hex || '#e5e7eb';
      swatch.title = c.name || '';
      swatch.dataset.colorName = c.name || '';
      swatch.dataset.colorHex = c.hex || '';

      swatch.addEventListener('click', () => {
        colorRow.querySelectorAll('.color-swatch').forEach(el =>
          el.classList.remove('is-selected')
        );
        swatch.classList.add('is-selected');
        colorRow.dataset.selectedColorName = swatch.dataset.colorName;
        colorRow.dataset.selectedColorHex  = swatch.dataset.colorHex;
      });

      colorRow.appendChild(swatch);
    });

    // Auto-select if there's only one color
    if ((product.color || []).length === 1) {
      const onlySwatch = colorRow.querySelector('.color-swatch');
      if (onlySwatch) {
        onlySwatch.classList.add('is-selected');
        const first = product.color[0];
        colorRow.dataset.selectedColorName = first?.name || '';
        colorRow.dataset.selectedColorHex  = first?.hex  || '';
      }
    }
  }

  // Add-to-cart for this product/quantity, including selected size/color
  if (addBtn && qtyInput) {
    addBtn.onclick = () => {
      const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);

      // SIZE: use selected, or fall back to first size if none clicked
      let selectedSize = '';
      if (sizeRow) {
        const selectedPill = sizeRow.querySelector('.size-pill.is-selected');
        if (selectedPill) {
          selectedSize = selectedPill.dataset.size || '';
        } else if ((product.sizes || []).length > 0) {
          selectedSize = product.sizes[0];
        }
      }

      // COLOR: use selected, or fall back to first color if none clicked
      let selectedColorName = '';
      let selectedColorHex  = '';
      if (colorRow) {
        const selectedSwatch = colorRow.querySelector('.color-swatch.is-selected');
        if (selectedSwatch) {
          selectedColorName = selectedSwatch.dataset.colorName || '';
          selectedColorHex  = selectedSwatch.dataset.colorHex || '';
        } else if ((product.color || []).length > 0) {
          selectedColorName = product.color[0].name || '';
          selectedColorHex  = product.color[0].hex || '';
        }
      }

      addToCart(product, qty, {
        size: selectedSize,
        colorName: selectedColorName,
        colorHex: selectedColorHex
      });
    };
  }

  renderSingleRelatedProducts(product);
}

function renderSingleRelatedProducts(product) {
  const grid = document.querySelector('#spRelatedGrid');
  if (!grid || !products) return;

  grid.textContent = '';

  const basePrice = product.price;
  const lower = basePrice * 0.8;  // -20%
  const upper = basePrice * 1.2;  // +20%

  // 1. First pass: same gender + category + within ±20% price
  const primary = products
    .filter(p =>
      p.id !== product.id &&
      p.gender === product.gender &&
      p.category === product.category &&
      typeof p.price === 'number' &&
      p.price >= lower &&
      p.price <= upper
    )

  let related = [...primary];

  // 2. Fallback: if fewer than 4, fill with same gender+price filter (no category restriction)
  if (related.length < 4) {
    const secondary = products.filter(p =>
      p.id !== product.id &&
      p.gender === product.gender &&
      typeof p.price === 'number' &&
      p.price >= lower &&
      p.price <= upper &&
      !related.includes(p) // avoid duplicates
    );

    related = related.concat(secondary);
  }

  // 3. Fallback: if still fewer than 4, fill with same gender only (no price/category restriction)
  if (related.length < 4) {
    const tertiary = products.filter(p =>
      p.id !== product.id &&
      p.gender === product.gender &&
      !related.includes(p)
    );

    related = related.concat(tertiary);
  }

  // 4. Cap at 4 items
  related = related.slice(0, 4); // up to 4

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