let allTagCounts = [];
let currentLang = 'es';

async function init() {
  currentLang = getLang();
  document.documentElement.lang = currentLang;

  renderLangSwitcher('lang-switch', currentLang, (newLang) => {
    const url = new URL(location.href);
    url.searchParams.set('lang', newLang);
    location.href = url.toString();
  });

  document.getElementById('back-link').textContent = t('back_link', currentLang);
  document.getElementById('back-link').href = 'index.html?lang=' + currentLang;
  document.getElementById('page-title').textContent = t('tags_page_title', currentLang);
  document.getElementById('tag-search').placeholder = t('tags_search_placeholder', currentLang);

  const [siteRes, prodRes] = await Promise.all([
    fetch('site.json?t=' + Date.now()),
    fetch('products.json?t=' + Date.now()),
  ]);
  const site = await siteRes.json();
  const products = await prodRes.json();

  document.getElementById('brand-name').textContent = site.brandName || '';
  document.getElementById('footer-brand').textContent = '© ' + new Date().getFullYear() + ' ' + (site.brandName || '');

  const counts = {};
  products.forEach(p => (p.tags || []).forEach(tag => { counts[tag] = (counts[tag] || 0) + 1; }));
  allTagCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  renderTags(allTagCounts);

  document.getElementById('tag-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = allTagCounts.filter(([tag]) => tag.toLowerCase().includes(q));
    renderTags(filtered);
  });
}

function renderTags(list) {
  const el = document.getElementById('all-tags');
  if (list.length === 0) {
    el.innerHTML = `<p class="empty">—</p>`;
    return;
  }
  el.innerHTML = list.map(([tag, count]) => `
    <a class="tag" href="index.html?tag=${encodeURIComponent(tag)}&lang=${currentLang}">${escapeHtml(tag)} <span style="opacity:0.65;">(${count})</span></a>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

init();
