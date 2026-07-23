const state = {
  site: null, products: [], activeCat: 'all', activeTag: null,
  query: '', lang: 'es', sort: 'newest', priceMin: null, priceMax: null,
};

async function init() {
  state.lang = getLang();
  const tagFromUrl = new URLSearchParams(location.search).get('tag');
  if (tagFromUrl) state.activeTag = tagFromUrl;

  const [siteRes, prodRes] = await Promise.all([
    fetch('site.json?t=' + Date.now()),
    fetch('products.json?t=' + Date.now()),
  ]);
  state.site = await siteRes.json();
  state.products = await prodRes.json();

  renderLangSwitcher('lang-switch', state.lang, (newLang) => {
    state.lang = newLang;
    renderAll();
  });

  renderAll();

  document.getElementById('search').addEventListener('input', (e) => {
    state.query = e.target.value.toLowerCase().trim();
    renderGrid();
  });

  document.getElementById('sort-select').addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderGrid();
  });

  document.getElementById('price-apply-btn').addEventListener('click', () => {
    const min = document.getElementById('price-min').value;
    const max = document.getElementById('price-max').value;
    state.priceMin = min !== '' ? Number(min) : null;
    state.priceMax = max !== '' ? Number(max) : null;
    renderGrid();
  });

  document.getElementById('price-clear-btn').addEventListener('click', () => {
    state.priceMin = null;
    state.priceMax = null;
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    renderGrid();
  });
}

function renderAll() {
  applyStaticText();
  applySiteSettings();
  renderCategories();
  renderTagCloud();
  renderGrid();
}

function applyStaticText() {
  const L = state.lang;
  document.getElementById('nav-home').textContent = '🏠 ' + t('nav_home', L);
  document.getElementById('nav-packs').textContent = '🎁 ' + t('nav_packs', L);
  document.getElementById('nav-samples').textContent = '🌟 ' + t('nav_samples', L);
  document.getElementById('nav-categories').textContent = '🎤 ' + t('nav_categories', L);
  document.getElementById('nav-contact').textContent = '✉️ ' + t('nav_contact', L);
  document.getElementById('search').placeholder = t('search_placeholder', L);
  document.getElementById('categorias-title').textContent = '🎤 ' + t('categorias_title', L);
  document.getElementById('tags-title').textContent = '🏷️ ' + t('tags_title', L);
  document.getElementById('ver-todos-tags').textContent = t('ver_todos_tags', L);
  document.getElementById('ver-todos-tags').href = 'tags.html?lang=' + L;
  document.getElementById('price-filter-title').textContent = '💴 ' + t('price_filter_title', L);
  document.getElementById('price-min-label').textContent = t('price_min', L);
  document.getElementById('price-max-label').textContent = t('price_max', L);
  document.getElementById('price-apply-btn').textContent = t('price_apply', L);
  document.getElementById('price-clear-btn').textContent = t('price_clear', L);
  document.getElementById('grid-title').textContent = '✨ ' + t('packs_title', L);
  document.getElementById('muestras-title').textContent = '🎁 ' + t('muestras_title', L);
  document.getElementById('muestras-desc').textContent = t('muestras_desc', L);
  document.getElementById('samples-btn').textContent = t('ver_muestras_btn', L);
  document.getElementById('como-funciona-title').textContent = '💫 ' + t('como_funciona_title', L);
  document.getElementById('step1-title').textContent = t('step1_title', L);
  document.getElementById('step1-desc').textContent = t('step1_desc', L);
  document.getElementById('step2-title').textContent = t('step2_title', L);
  document.getElementById('step2-desc').textContent = t('step2_desc', L);
  document.getElementById('step3-title').textContent = t('step3_title', L);
  document.getElementById('step3-desc').textContent = t('step3_desc', L);
  document.getElementById('duda-title').textContent = '💌 ' + t('duda_title', L);
  document.getElementById('contact-btn').textContent = t('contactar_btn', L);
  document.getElementById('sort-label').textContent = t('sort_label', L);
  const sortSelect = document.getElementById('sort-select');
  sortSelect.options[0].textContent = t('sort_newest', L);
  sortSelect.options[1].textContent = t('sort_oldest', L);
  sortSelect.options[2].textContent = t('sort_price_asc', L);
  sortSelect.options[3].textContent = t('sort_price_desc', L);
  sortSelect.value = state.sort;
  document.documentElement.lang = L;
}

function applySiteSettings() {
  const s = state.site;
  const L = state.lang;
  document.getElementById('brand-name').textContent = s.brandName || '';
  document.getElementById('site-title').textContent = s.siteTitle || '';
  document.getElementById('tagline').textContent = s.tagline || '';
  document.getElementById('seal-text').textContent = s.sealText || '';
  document.getElementById('footer-brand').textContent = '© ' + new Date().getFullYear() + ' ' + (s.brandName || '') + ' — ' + t('footer_hecho', L);
  document.getElementById('disclaimer-box').textContent = s.disclaimer || '';

  const badgesEl = document.getElementById('badges');
  badgesEl.innerHTML = (s.badges || []).map(b => `<span class="badge-pill">${escapeHtml(b)}</span>`).join('');

  const avatarImg = document.getElementById('avatar-img');
  const avatarPlaceholder = document.getElementById('avatar-placeholder');
  if (s.avatarImage) {
    avatarImg.src = s.avatarImage;
    avatarImg.classList.remove('hidden');
    avatarPlaceholder.style.display = 'none';
  } else {
    avatarImg.classList.add('hidden');
    avatarPlaceholder.style.display = 'flex';
  }

  const bannerImg = document.getElementById('hero-banner-img');
  if (s.heroImage) { bannerImg.src = s.heroImage; bannerImg.classList.remove('hidden'); }
  else { bannerImg.classList.add('hidden'); }

  if (s.freeSamplesLink) {
    document.getElementById('samples-btn').href = s.freeSamplesLink;
    document.getElementById('nav-samples').href = s.freeSamplesLink;
  }

  const c = s.contact || {};
  document.getElementById('contact-text').textContent = t('escribime_a', L) + ' ' + (c.email || '') + ' ' + t('gracias_apoyo', L);
  if (c.email) {
    document.getElementById('contact-btn').href = 'mailto:' + c.email;
    document.getElementById('nav-contact').href = '#contacto';
  }

  const socials = [];
  if (c.twitter) socials.push(`<a href="${c.twitter}" target="_blank" rel="noopener">Twitter/X</a>`);
  if (c.instagram) socials.push(`<a href="${c.instagram}" target="_blank" rel="noopener">Instagram</a>`);
  if (c.discord) socials.push(`<a href="${c.discord}" target="_blank" rel="noopener">Discord</a>`);
  document.getElementById('footer-social').innerHTML = socials.join('');
}

function renderCategories() {
  const list = document.getElementById('cat-list');
  const counts = {};
  state.products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });

  // Nota: el nombre del grupo idol (cat.label) NUNCA se traduce, se muestra tal cual lo escribiste.
  let html = `<li><button class="${state.activeCat === 'all' ? 'active' : ''}" data-cat="all">${t('todos', state.lang)} <span class="count">${state.products.length}</span></button></li>`;
  (state.site.categories || []).forEach(cat => {
    html += `<li><button class="${state.activeCat === cat.id ? 'active' : ''}" data-cat="${cat.id}">${cat.icon || ''} ${escapeHtml(cat.label)} <span class="count">${counts[cat.id] || 0}</span></button></li>`;
  });
  list.innerHTML = html;

  list.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeCat = btn.dataset.cat;
      list.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid();
    });
  });
}

function renderTagCloud() {
  const counts = {};
  state.products.forEach(p => (p.tags || []).forEach(tag => { counts[tag] = (counts[tag] || 0) + 1; }));
  const top10 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);

  const el = document.getElementById('tag-cloud');
  if (top10.length === 0) { el.innerHTML = ''; return; }

  el.innerHTML = top10.map(tag => `
    <button type="button" class="tag ${state.activeTag === tag ? 'active' : ''}" data-tag="${escapeAttr(tag)}">${escapeHtml(tag)}</button>
  `).join('');

  el.querySelectorAll('.tag').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTag = state.activeTag === btn.dataset.tag ? null : btn.dataset.tag;
      renderTagCloud();
      renderGrid();
    });
  });
}

function sortProducts(list, mode) {
  const copy = [...list];
  copy.sort((a, b) => {
    if (mode === 'price-asc') return (a.price ?? 0) - (b.price ?? 0);
    if (mode === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return mode === 'oldest' ? da - db : db - da;
  });
  return copy;
}

function renderGrid() {
  const grid = document.getElementById('grid-content');
  let visible = state.products;

  if (state.activeCat !== 'all') visible = visible.filter(p => p.category === state.activeCat);
  if (state.activeTag) visible = visible.filter(p => (p.tags || []).includes(state.activeTag));
  if (state.query) {
    visible = visible.filter(p =>
      localizedField(p, 'name', state.lang).toLowerCase().includes(state.query) ||
      (p.tags || []).some(tag => tag.toLowerCase().includes(state.query))
    );
  }
  if (state.priceMin !== null) visible = visible.filter(p => (p.price ?? 0) >= state.priceMin);
  if (state.priceMax !== null) visible = visible.filter(p => (p.price ?? 0) <= state.priceMax);

  visible = sortProducts(visible, state.sort);

  if (visible.length === 0) {
    grid.innerHTML = `<p class="empty">${t('empty_msg', state.lang)}</p>`;
    return;
  }

  const catMap = {};
  (state.site.categories || []).forEach(c => catMap[c.id] = c.label); // etiqueta de grupo idol: sin traducir

  grid.innerHTML = visible.map(p => `
    <a class="card" href="producto.html?id=${encodeURIComponent(p.id)}&lang=${state.lang}">
      <div class="thumb-wrap">
        <img class="thumb" src="${escapeHtml(p.image || '')}" alt="${escapeHtml(localizedField(p, 'name', state.lang))}" loading="lazy">
        <span class="cat-badge">${escapeHtml(catMap[p.category] || p.category || '')}</span>
      </div>
      <div class="body">
        <h3>${escapeHtml(localizedField(p, 'name', state.lang))}</h3>
        <div class="tags">${(p.tags || []).slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="meta-row">
          <span class="pub-date">${escapeHtml(formatDate(p.publishedAt, state.lang))}</span>
          <span class="price-tag">${escapeHtml(formatYen(p.price))}</span>
        </div>
        <span class="more-btn">${t('ver_mas', state.lang)}</span>
      </div>
    </a>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escapeAttr(str) { return (str || '').replace(/"/g, '&quot;'); }

init();
