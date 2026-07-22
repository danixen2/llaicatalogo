const CFG_KEY = 'catalogo_ia_gh_config_v2';

let cfg = null;
let site = null;
let products = [];
let siteSha = null;
let productsSha = null;

function loadCfg() { const raw = localStorage.getItem(CFG_KEY); return raw ? JSON.parse(raw) : null; }
function saveCfg(c) { localStorage.setItem(CFG_KEY, JSON.stringify(c)); }

function ghHeaders() {
  return { 'Authorization': `token ${cfg.token}`, 'Accept': 'application/vnd.github+json' };
}
function contentsUrl(path) {
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
}
function toBase64(str) { return btoa(unescape(encodeURIComponent(str))); }
function fromBase64(str) { return decodeURIComponent(escape(atob(str.replace(/\n/g, '')))); }

function setStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status ' + (type || 'info');
  el.classList.remove('hidden');
}
function clearStatus() { document.getElementById('status').classList.add('hidden'); }

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }
function escapeAttr(str) { return (str || '').replace(/"/g, '&quot;'); }

// ---------- Connection test ----------

document.getElementById('cfg-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const testCfg = {
    owner: document.getElementById('cfg-owner').value.trim(),
    repo: document.getElementById('cfg-repo').value.trim(),
    branch: document.getElementById('cfg-branch').value.trim() || 'main',
    token: document.getElementById('cfg-token').value.trim(),
  };

  setStatus('Probando conexión…', 'info');
  cfg = testCfg;

  try {
    const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`, { headers: ghHeaders() });

    if (res.status === 401) throw new Error('Token inválido o expirado. Generá uno nuevo.');
    if (res.status === 404) throw new Error('No se encontró el repositorio, o el token no tiene acceso a él. Revisá el nombre exacto (mayúsculas incluidas) y que el token tenga ese repo seleccionado.');
    if (!res.ok) throw new Error(`GitHub respondió con error ${res.status}.`);

    const data = await res.json();
    if (!data.permissions || !data.permissions.push) {
      throw new Error('El token no tiene permiso de escritura (Contents: Read and write) sobre este repositorio.');
    }
    if (data.default_branch && data.default_branch !== cfg.branch) {
      setStatus(`Conectado, pero ojo: la rama por defecto del repo es "${data.default_branch}", no "${cfg.branch}". Ajustando automáticamente.`, 'info');
      cfg.branch = data.default_branch;
      document.getElementById('cfg-branch').value = cfg.branch;
    } else {
      setStatus('Conectado correctamente ✓', 'ok');
    }

    saveCfg(cfg);
    document.getElementById('editor').classList.remove('hidden');
    await loadSite();
    await loadProducts();
  } catch (err) {
    setStatus(err.message, 'err');
    cfg = null;
  }
});

document.getElementById('cfg-forget').addEventListener('click', () => {
  localStorage.removeItem(CFG_KEY);
  location.reload();
});

// ---------- Tabs ----------

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    document.querySelector(`[data-panel="${btn.dataset.tab}"]`).classList.remove('hidden');
  });
});

// ---------- Site.json ----------

async function loadSite() {
  try {
    const res = await fetch(contentsUrl('site.json') + `?ref=${cfg.branch}`, { headers: ghHeaders() });
    if (!res.ok) throw new Error('No se pudo cargar site.json (' + res.status + ')');
    const data = await res.json();
    siteSha = data.sha;
    site = JSON.parse(fromBase64(data.content));
    fillSiteForm();
    renderCategoryRows();
    fillContactForm();
    populateCategorySelect();
  } catch (err) {
    setStatus('Error cargando site.json: ' + err.message, 'err');
  }
}

function fillSiteForm() {
  document.getElementById('s-brand').value = site.brandName || '';
  document.getElementById('s-title').value = site.siteTitle || '';
  document.getElementById('s-tagline').value = site.tagline || '';
  document.getElementById('s-seal').value = site.sealText || '';
  document.getElementById('s-badge1').value = (site.badges || [])[0] || '';
  document.getElementById('s-badge2').value = (site.badges || [])[1] || '';
  document.getElementById('s-badge3').value = (site.badges || [])[2] || '';
  document.getElementById('s-hero').value = site.heroImage || '';
  document.getElementById('s-samples').value = site.freeSamplesLink || '';
  document.getElementById('s-disclaimer').value = site.disclaimer || '';
}

function fillContactForm() {
  const c = site.contact || {};
  document.getElementById('c-email').value = c.email || '';
  document.getElementById('c-twitter').value = c.twitter || '';
  document.getElementById('c-instagram').value = c.instagram || '';
  document.getElementById('c-discord').value = c.discord || '';
}

async function saveSiteJson(successMsg) {
  try {
    const body = {
      message: 'Actualiza configuración del sitio (' + new Date().toISOString() + ')',
      content: toBase64(JSON.stringify(site, null, 2)),
      branch: cfg.branch,
    };
    if (siteSha) body.sha = siteSha;
    const res = await fetch(contentsUrl('site.json'), {
      method: 'PUT', headers: { ...ghHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || res.status); }
    const data = await res.json();
    siteSha = data.content.sha;
    setStatus(successMsg + ' — se verá reflejado en 1-2 minutos.', 'ok');
  } catch (err) {
    setStatus('Error al guardar: ' + err.message, 'err');
  }
}

document.getElementById('save-site').addEventListener('click', () => {
  site.brandName = document.getElementById('s-brand').value.trim();
  site.siteTitle = document.getElementById('s-title').value.trim();
  site.tagline = document.getElementById('s-tagline').value.trim();
  site.sealText = document.getElementById('s-seal').value.trim();
  site.badges = [document.getElementById('s-badge1').value.trim(), document.getElementById('s-badge2').value.trim(), document.getElementById('s-badge3').value.trim()].filter(Boolean);
  site.heroImage = document.getElementById('s-hero').value.trim();
  site.freeSamplesLink = document.getElementById('s-samples').value.trim();
  site.disclaimer = document.getElementById('s-disclaimer').value.trim();
  saveSiteJson('Portada guardada');
});

document.getElementById('save-contact').addEventListener('click', () => {
  site.contact = {
    email: document.getElementById('c-email').value.trim(),
    twitter: document.getElementById('c-twitter').value.trim(),
    instagram: document.getElementById('c-instagram').value.trim(),
    discord: document.getElementById('c-discord').value.trim(),
  };
  saveSiteJson('Contacto guardado');
});

// ---------- Categories ----------

function renderCategoryRows() {
  const wrap = document.getElementById('cat-rows');
  wrap.innerHTML = '';
  (site.categories || []).forEach((cat, i) => {
    const row = document.createElement('div');
    row.className = 'cat-editor-row';
    row.innerHTML = `
      <input data-i="${i}" data-f="icon" value="${escapeAttr(cat.icon)}" placeholder="⭐">
      <input data-i="${i}" data-f="id" value="${escapeAttr(cat.id)}" placeholder="id-interno">
      <input data-i="${i}" data-f="label" value="${escapeAttr(cat.label)}" placeholder="Nombre visible">
      <button class="btn-danger" data-del="${i}" type="button">✕</button>
    `;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const i = parseInt(e.target.dataset.i, 10);
      site.categories[i][e.target.dataset.f] = e.target.value;
    });
  });
  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      site.categories.splice(parseInt(btn.dataset.del, 10), 1);
      renderCategoryRows();
    });
  });
}

document.getElementById('add-cat').addEventListener('click', () => {
  site.categories = site.categories || [];
  site.categories.push({ id: '', label: '', icon: '⭐' });
  renderCategoryRows();
});

document.getElementById('save-cats').addEventListener('click', () => {
  saveSiteJson('Categorías guardadas');
  populateCategorySelect();
});

function populateCategorySelect() {
  const sel = document.getElementById('new-category');
  sel.innerHTML = (site.categories || []).map(c => `<option value="${escapeAttr(c.id)}">${escapeHtml(c.label)}</option>`).join('');
}

// ---------- Products ----------

async function loadProducts() {
  try {
    const res = await fetch(contentsUrl('products.json') + `?ref=${cfg.branch}`, { headers: ghHeaders() });
    if (res.status === 404) { products = []; productsSha = null; renderProductList(); return; }
    if (!res.ok) throw new Error('No se pudo cargar products.json (' + res.status + ')');
    const data = await res.json();
    productsSha = data.sha;
    products = JSON.parse(fromBase64(data.content));
    renderProductList();
  } catch (err) {
    setStatus('Error cargando productos: ' + err.message, 'err');
  }
}

async function saveProducts() {
  try {
    const body = {
      message: 'Actualiza productos (' + new Date().toISOString() + ')',
      content: toBase64(JSON.stringify(products, null, 2)),
      branch: cfg.branch,
    };
    if (productsSha) body.sha = productsSha;
    const res = await fetch(contentsUrl('products.json'), {
      method: 'PUT', headers: { ...ghHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || res.status); }
    const data = await res.json();
    productsSha = data.content.sha;
    setStatus('Productos guardados — se verán reflejados en 1-2 minutos.', 'ok');
  } catch (err) {
    setStatus('Error al guardar productos: ' + err.message + (err.message.includes('sha') ? ' — tocá "Recargar desde GitHub" y volvé a intentar.' : ''), 'err');
  }
}

function renderProductList() {
  const container = document.getElementById('product-list');
  if (products.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem;">Todavía no agregaste ningún pack.</p>';
    return;
  }
  const catMap = {};
  (site.categories || []).forEach(c => catMap[c.id] = c.label);

  container.innerHTML = products.map((p, i) => `
    <div class="product-item">
      <div class="top">
        <strong>${escapeHtml(p.name || '(sin título)')}</strong>
        <button class="btn-danger" data-del="${i}" type="button">Eliminar</button>
      </div>
      <div class="field"><label>Título</label><input data-i="${i}" data-f="name" value="${escapeAttr(p.name)}"></div>
      <div class="row2">
        <div class="field"><label>Categoría</label>
          <select data-i="${i}" data-f="category">
            ${(site.categories || []).map(c => `<option value="${escapeAttr(c.id)}" ${c.id === p.category ? 'selected' : ''}>${escapeHtml(c.label)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Imagen de portada</label><input data-i="${i}" data-f="image" value="${escapeAttr(p.image)}"></div>
        <div class="field"><label>Fecha de publicación</label><input data-i="${i}" data-f="publishedAt" type="date" value="${escapeAttr(p.publishedAt)}"></div>
      </div>
      <div class="field"><label>Descripción (Español)</label><textarea data-i="${i}" data-f="description">${escapeHtml(p.description || '')}</textarea></div>
      <div class="field"><label>Tags (separados por coma, sin traducción)</label><input data-i="${i}" data-f="tags" value="${escapeAttr((p.tags || []).join(', '))}"></div>
      <div class="row2">
        <div class="field"><label>Link de compra</label><input data-i="${i}" data-f="purchaseLink" value="${escapeAttr(p.purchaseLink)}"></div>
        <div class="field"><label>Link de muestra gratis</label><input data-i="${i}" data-f="sampleLink" value="${escapeAttr(p.sampleLink)}"></div>
      </div>
      <details style="margin-top:8px;">
        <summary style="cursor:pointer; font-size:0.82rem; color:var(--purple-dark); font-weight:700;">🌍 Traducciones (English / 日本語)</summary>
        <div class="field" style="margin-top:10px;"><label>Título (English)</label><input data-i="${i}" data-f="name_en" value="${escapeAttr(p.name_en)}"></div>
        <div class="field"><label>Descripción (English)</label><textarea data-i="${i}" data-f="description_en">${escapeHtml(p.description_en || '')}</textarea></div>
        <div class="field"><label>Título (日本語)</label><input data-i="${i}" data-f="name_ja" value="${escapeAttr(p.name_ja)}"></div>
        <div class="field"><label>Descripción (日本語)</label><textarea data-i="${i}" data-f="description_ja">${escapeHtml(p.description_ja || '')}</textarea></div>
      </details>
    </div>
  `).join('');

  container.querySelectorAll('[data-f]').forEach(el => {
    el.addEventListener('input', (e) => {
      const i = parseInt(e.target.dataset.i, 10);
      const f = e.target.dataset.f;
      products[i][f] = f === 'tags' ? e.target.value.split(',').map(t => t.trim()).filter(Boolean) : e.target.value;
    });
  });
  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.del, 10);
      if (confirm('¿Eliminar "' + (products[i].name || 'este pack') + '"?')) {
        products.splice(i, 1);
        renderProductList();
      }
    });
  });
}

document.getElementById('add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  products.push({
    id: 'pack-' + Date.now(),
    name: document.getElementById('new-name').value.trim(),
    category: document.getElementById('new-category').value,
    image: document.getElementById('new-image').value.trim(),
    description: document.getElementById('new-desc').value.trim(),
    tags: document.getElementById('new-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    purchaseLink: document.getElementById('new-purchase').value.trim(),
    sampleLink: document.getElementById('new-sample').value.trim(),
    name_en: document.getElementById('new-name-en').value.trim(),
    description_en: document.getElementById('new-desc-en').value.trim(),
    name_ja: document.getElementById('new-name-ja').value.trim(),
    description_ja: document.getElementById('new-desc-ja').value.trim(),
    publishedAt: document.getElementById('new-published').value || new Date().toISOString().slice(0, 10),
  });
  e.target.reset();
  renderProductList();
});

document.getElementById('save-products').addEventListener('click', saveProducts);
document.getElementById('reload-products').addEventListener('click', loadProducts);

// ---------- Init ----------

(function initFromSavedCfg() {
  const saved = loadCfg();
  if (saved) {
    document.getElementById('cfg-owner').value = saved.owner;
    document.getElementById('cfg-repo').value = saved.repo;
    document.getElementById('cfg-branch').value = saved.branch;
    document.getElementById('cfg-token').value = saved.token;
    document.getElementById('cfg-form').requestSubmit();
  }
})();
