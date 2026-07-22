const state = { site: null, products: [], activeCat: 'all', query: '', lang: 'es', sort: 'newest' };

async function init() {
  state.lang = getLang();

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
}

function renderAll() {
  applyStaticText();
  applySiteSettings();
  renderCategories();
  renderGrid();
}

function applyStaticText() {
  const L = state.lang;
  document.getElementById('nav-home').textContent = '🏠 ' + t('nav_home', L);
  document.getElementById('nav-packs').textContent = '🎁 ' + t('nav_packs', L);
  document.getElementById('nav-samples').textContent = '🌟 ' + t('nav_samples', L);
  document.getElementById('nav-categories').textContent = '🗂️ ' + t('nav_categories', L);
  document.getElementById('nav-contact').textContent = '✉️ ' + t('nav_contact', L);
  document.getElementById('search').placeholder = t('search_placeholder', L);
  document.getElementById('categorias-title').textContent = '🗂️ ' + t('categorias_title', L);
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

  // Nota: el nombre de la categoría (cat.label) NUNCA se traduce, se muestra tal cual la escribiste.
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

function renderGrid() {
  const grid = document.getElementById('grid-content');
  let visible = state.products;

  if (state.activeCat !== 'all') visible = visible.filter(p => p.category === state.activeCat);
  if (state.query) {
    visible = visible.filter(p =>
      localizedField(p, 'name', state.lang).toLowerCase().includes(state.query) ||
      (p.tags || []).some(tag => tag.toLowerCase().includes(state.query))
    );
  }

  visible = sortByDate(visible, state.sort);

  if (visible.length === 0) {
    grid.innerHTML = `<p class="empty">${t('empty_msg', state.lang)}</p>`;
    return;
  }

  const catMap = {};
  (state.site.categories || []).forEach(c => catMap[c.id] = c.label); // etiqueta de categoría: sin traducir

  grid.innerHTML = visible.map(p => `
    <a class="card" href="producto.html?id=${encodeURIComponent(p.id)}&lang=${state.lang}">
      <div class="thumb-wrap">
        <img class="thumb" src="${escapeHtml(p.image || '')}" alt="${escapeHtml(localizedField(p, 'name', state.lang))}" loading="lazy">
        <span class="cat-badge">${escapeHtml(catMap[p.category] || p.category || '')}</span>
      </div>
      <div class="body">
        <h3>${escapeHtml(localizedField(p, 'name', state.lang))}</h3>
        <div class="tags">${(p.tags || []).slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <span class="more-btn">${t('ver_mas', state.lang)}</span>
      </div>
    </a>
  `).join('');
}

function sortByDate(list, mode) {
  const copy = [...list];
  copy.sort((a, b) => {
    // Sin fecha cargada = se trata como muy antiguo, para que no tape a los que sí tienen fecha.
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return mode === 'oldest' ? da - db : db - da;
  });
  return copy;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

init();
