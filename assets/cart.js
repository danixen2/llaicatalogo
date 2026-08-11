const CART_KEY = 'catalogo_cart_v1';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}

function saveCart(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* almacenamiento no disponible */ }
}

// version: 'base' | 'boost'
function addToCart(productId, version) {
  const items = getCart();
  const exists = items.some(it => it.productId === productId && it.version === version);
  if (!exists) {
    items.push({ productId, version: version || 'base', selected: true });
    saveCart(items);
  }
  return items;
}

function removeFromCart(productId, version) {
  const items = getCart().filter(it => !(it.productId === productId && it.version === version));
  saveCart(items);
  return items;
}

function setCartItemVersion(productId, oldVersion, newVersion) {
  const items = getCart();
  const item = items.find(it => it.productId === productId && it.version === oldVersion);
  if (item) item.version = newVersion;
  saveCart(items);
  return items;
}

// Marca o desmarca un producto sin sacarlo de la lista (para "probar" combinaciones sin perder el pack).
function setCartItemSelected(productId, version, selected) {
  const items = getCart();
  const item = items.find(it => it.productId === productId && it.version === version);
  if (item) item.selected = selected;
  saveCart(items);
  return items;
}

function cartCount() { return getCart().length; }

function updateCartBadge(lang) {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = cartCount();
  if (count > 0) { badge.textContent = String(count); badge.classList.remove('hidden'); }
  else { badge.classList.add('hidden'); }
}
