async function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const lang = getLang();
  document.documentElement.lang = lang;

  renderLangSwitcher('lang-switch', lang, (newLang) => {
    const url = new URL(location.href);
    url.searchParams.set('lang', newLang);
    location.href = url.toString();
  });

  document.getElementById('back-link').textContent = t('back_link', lang);
  document.getElementById('loading-msg').textContent = t('loading_msg', lang);

  const [siteRes, prodRes] = await Promise.all([
    fetch('site.json?t=' + Date.now()),
    fetch('products.json?t=' + Date.now()),
  ]);
  const site = await siteRes.json();
  const products = await prodRes.json();

  document.getElementById('brand-name').textContent = site.brandName || '';
  document.getElementById('footer-brand').textContent = '© ' + new Date().getFullYear() + ' ' + (site.brandName || '');

  const product = products.find(p => p.id === id);
  const content = document.getElementById('content');

  if (!product) {
    content.innerHTML = `<p class="notfound">${t('notfound_msg', lang)} <a href="index.html">${t('back_link', lang)}</a></p>`;
    return;
  }

  const name = localizedField(product, 'name', lang);
  const description = localizedField(product, 'description', lang);

  document.title = name + ' — ' + (site.brandName || '');

  const catMap = {};
  (site.categories || []).forEach(c => catMap[c.id] = c.label); // categoría sin traducir

  content.innerHTML = `
    <div class="product-detail">
      <img class="main-image" src="${escapeHtml(product.image || '')}" alt="${escapeHtml(name)}">
      <div>
        <span class="badge-pill" style="background:var(--purple); display:inline-block; margin-bottom:10px;">${escapeHtml(catMap[product.category] || product.category || '')}</span>
        <h1>${escapeHtml(name)}</h1>
        <div class="tags">${(product.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <p class="desc" style="margin-top:16px;">${escapeHtml(description)}</p>
        <div class="actions">
          ${product.sampleLink ? `<a class="btn-lg ghost" href="${escapeHtml(product.sampleLink)}" target="_blank" rel="noopener">${t('ver_muestra_gratis_btn', lang)}</a>` : ''}
          ${product.purchaseLink ? `<a class="btn-lg primary" href="${escapeHtml(product.purchaseLink)}" target="_blank" rel="noopener">${t('comprar_btn', lang)}</a>` : ''}
        </div>
      </div>
    </div>
  `;

  const related = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 3);
  if (related.length) {
    document.getElementById('related-wrap').innerHTML = `
      <h2 class="section-title related-title">${t('mas_packs_de', lang)} ${escapeHtml(catMap[product.category] || '')}</h2>
      <div class="grid" style="padding-bottom:50px;">
        ${related.map(p => `
          <a class="card" href="producto.html?id=${encodeURIComponent(p.id)}&lang=${lang}">
            <div class="thumb-wrap">
              <img class="thumb" src="${escapeHtml(p.image || '')}" alt="${escapeHtml(localizedField(p, 'name', lang))}" loading="lazy">
            </div>
            <div class="body">
              <h3>${escapeHtml(localizedField(p, 'name', lang))}</h3>
              <span class="more-btn">${t('ver_mas', lang)}</span>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

init();
