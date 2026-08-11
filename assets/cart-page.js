let cartState = { site: null, products: [], lang: 'es' };

function versionPrice(product, version) {
  const base = Number(product.price || 0);
  return version === 'boost' ? base * 2 : base;
}

async function init() {
  cartState.lang = getLang();
  document.documentElement.lang = cartState.lang;

  renderLangSwitcher('lang-switch', cartState.lang, (newLang) => {
    cartState.lang = newLang;
    applyStaticText();
    renderCart();
  });

  const [siteRes, prodRes] = await Promise.all([
    fetch('site.json?t=' + Date.now()),
    fetch('products.json?t=' + Date.now()),
  ]);
  cartState.site = await siteRes.json();
  cartState.products = await prodRes.json();

  document.getElementById('brand-name').textContent = cartState.site.brandName || '';
  document.getElementById('footer-brand').textContent = '© ' + new Date().getFullYear() + ' ' + (cartState.site.brandName || '');

  normalizeCart();
  applyStaticText();
  renderCart();

  document.getElementById('download-pdf-btn').addEventListener('click', generateReceiptPdf);
}

// Si un pack no tiene versión Boost pero quedó guardada en el carrito de una visita anterior, lo corrige a Base.
function normalizeCart() {
  const items = getCart();
  let changed = false;
  items.forEach(it => {
    const product = cartState.products.find(p => p.id === it.productId);
    if (product && product.hasBoost === false && it.version === 'boost') {
      it.version = 'base';
      changed = true;
    }
  });
  if (changed) saveCart(items);
}

function applyStaticText() {
  const L = cartState.lang;
  document.getElementById('back-link').textContent = t('back_link', L);
  document.getElementById('back-link').href = 'index.html?lang=' + L;
  document.getElementById('page-title').textContent = t('cart_page_title', L);
  document.getElementById('summary-title').textContent = t('cart_page_title', L);
  document.getElementById('total-label').textContent = t('cart_total', L);
  document.getElementById('download-pdf-btn').textContent = t('download_pdf_btn', L);
}

function renderCart() {
  const L = cartState.lang;
  const items = getCart();
  const container = document.getElementById('cart-items');
  const pdfBtn = document.getElementById('download-pdf-btn');

  if (items.length === 0) {
    container.innerHTML = `<p class="empty" style="text-align:left; padding:20px 0;">${t('cart_empty', L)} <a href="index.html?lang=${L}" style="color:var(--purple-dark); font-weight:700;">${t('keep_browsing', L)}</a></p>`;
    document.getElementById('total-value').textContent = formatYen(0);
    pdfBtn.disabled = true;
    return;
  }

  let total = 0;

  container.innerHTML = items.map((item, idx) => {
    const product = cartState.products.find(p => p.id === item.productId);
    if (!product) return '';
    const price = versionPrice(product, item.version);
    total += price;
    const name = localizedField(product, 'name', L);
    const hasBoost = product.hasBoost !== false;

    const versionHtml = hasBoost ? `
      <div class="version-select">
        <label><input type="radio" name="version-${idx}" value="base" ${item.version === 'base' ? 'checked' : ''} data-pid="${escapeAttr(item.productId)}" data-oldv="${escapeAttr(item.version)}"> ${t('version_base', L)} · ${formatYen(product.price)}</label>
        <label><input type="radio" name="version-${idx}" value="boost" ${item.version === 'boost' ? 'checked' : ''} data-pid="${escapeAttr(item.productId)}" data-oldv="${escapeAttr(item.version)}"> ${t('version_boost', L)} · ${formatYen(product.price * 2)}</label>
      </div>
    ` : `
      <div class="version-select"><span style="font-size:0.8rem; color:var(--text-muted); font-weight:700;">${t('version_base', L)} · ${formatYen(product.price)}</span></div>
    `;

    return `
      <div class="cart-item">
        <img src="${escapeHtml(product.image || '')}" alt="${escapeHtml(name)}">
        <div>
          <h3>${escapeHtml(name)}</h3>
          ${versionHtml}
        </div>
        <div style="text-align:right;">
          <div class="line-price">${formatYen(price)}</div>
          <button type="button" class="remove-btn" data-remove-pid="${escapeAttr(item.productId)}" data-remove-v="${escapeAttr(item.version)}" title="${t('remove_item', L)}">✕</button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('total-value').textContent = formatYen(total);
  pdfBtn.disabled = false;

  container.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      setCartItemVersion(e.target.dataset.pid, e.target.dataset.oldv, e.target.value);
      renderCart();
    });
  });

  container.querySelectorAll('[data-remove-pid]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.removePid, btn.dataset.removeV);
      updateCartBadge();
      renderCart();
    });
  });

  updateCartBadge();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
function escapeAttr(str) { return (str || '').replace(/"/g, '&quot;'); }

// ---------- Carga de imágenes para el PDF (con opción a blanco y negro) ----------

async function loadImageAsDataUrl(url, grayscale) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('No se pudo descargar la imagen');
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (grayscale) ctx.filter = 'grayscale(100%)';
    ctx.drawImage(bitmap, 0, 0);
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('No se pudo incrustar la imagen en el PDF (posiblemente el hosting de la imagen no permite CORS):', e);
    return null;
  }
}

// ---------- Generación del PDF (siempre en inglés, salvo el pie de página) ----------

async function generateReceiptPdf() {
  const btn = document.getElementById('download-pdf-btn');
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = '…';

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // Fuente japonesa (subset) para el pie de página trilingüe.
    doc.addFileToVFS('NotoSansJP-subset.ttf', NOTO_SANS_JP_SUBSET_BASE64);
    doc.addFont('NotoSansJP-subset.ttf', 'NotoSansJP', 'normal');

    const items = getCart();
    const brandName = cartState.site.brandName || 'Catalog';
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    let y = 50;

    const logoStyle = cartState.site.receiptLogoStyle || 'none';
    const bannerStyle = cartState.site.receiptBannerStyle || 'none';

    // Banner (ancho completo, arriba de todo)
    if (bannerStyle !== 'none' && cartState.site.heroImage) {
      const dataUrl = await loadImageAsDataUrl(cartState.site.heroImage, bannerStyle === 'grayscale');
      if (dataUrl) {
        const bannerH = 90;
        doc.addImage(dataUrl, 'PNG', 0, 0, pageWidth, bannerH);
        y = bannerH + 30;
      }
    }

    // Logo circular + nombre de marca
    let textX = marginX;
    let logoBottom = y;
    if (logoStyle !== 'none' && cartState.site.avatarImage) {
      const dataUrl = await loadImageAsDataUrl(cartState.site.avatarImage, logoStyle === 'grayscale');
      if (dataUrl) {
        const logoSize = 46;
        doc.addImage(dataUrl, 'PNG', marginX, y, logoSize, logoSize);
        textX = marginX + logoSize + 12;
        logoBottom = y + logoSize;
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(brandName, textX, y + 20);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110);
    doc.text('Order Summary', textX, y + 38);

    y = Math.max(y + 55, logoBottom + 20);

    const dateStr = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
    doc.setFontSize(9);
    doc.text('Date: ' + dateStr, marginX, y);
    y += 26;

    doc.setDrawColor(220);
    doc.setTextColor(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Item', marginX, y);
    doc.text('Version', 330, y);
    doc.text('Price', pageWidth - marginX, y, { align: 'right' });
    y += 6;
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    let total = 0;

    items.forEach(item => {
      const product = cartState.products.find(p => p.id === item.productId);
      if (!product) return;
      const price = versionPrice(product, item.version);
      total += price;
      const nameEn = localizedField(product, 'name', 'en');
      const versionEn = item.version === 'boost' ? 'Boost Pack' : 'Base Pack';

      if (y > 740) { doc.addPage(); y = 55; }

      const nameLines = doc.splitTextToSize(nameEn, 260);
      doc.text(nameLines, marginX, y);
      doc.text(versionEn, 330, y);
      doc.text(formatYen(price), pageWidth - marginX, y, { align: 'right' });
      y += Math.max(16, nameLines.length * 13) + 6;
    });

    y += 6;
    doc.setDrawColor(220);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 22;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Total', marginX, y);
    doc.text(formatYen(total), pageWidth - marginX, y, { align: 'right' });
    y += 46;

    if (y > 660) { doc.addPage(); y = 55; }

    doc.setDrawColor(230);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 24;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);

    const esLine = 'Gracias por tu recibo, por favor unite a mi servidor de Discord para contactarme y coordinar el pago de los productos seleccionados.';
    const enLine = 'Thank you for your receipt \u2014 please join my Discord server to contact me and arrange payment for the selected products.';
    const jaLine = '\u30ec\u30b7\u30fc\u30c8\u3092\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059\u3002\u3054\u9023\u7d61\u3068\u304a\u652f\u6255\u3044\u306e\u8abf\u6574\u306b\u3064\u3044\u3066\u306f\u3001Discord\u30b5\u30fc\u30d0\u30fc\u306b\u3054\u53c2\u52a0\u304f\u3060\u3055\u3044\u3002';

    doc.setFont('helvetica', 'normal');
    [esLine, enLine].forEach(line => {
      const wrapped = doc.splitTextToSize(line, pageWidth - marginX * 2);
      if (y + wrapped.length * 12 > 800) { doc.addPage(); y = 55; }
      doc.text(wrapped, marginX, y);
      y += wrapped.length * 12 + 8;
    });

    doc.setFont('NotoSansJP', 'normal');
    const jaWrapped = doc.splitTextToSize(jaLine, pageWidth - marginX * 2);
    if (y + jaWrapped.length * 13 > 800) { doc.addPage(); y = 55; }
    doc.text(jaWrapped, marginX, y);
    y += jaWrapped.length * 13 + 10;

    const discordLink = cartState.site.receiptDiscordLink;
    if (discordLink) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(90, 60, 160);
      doc.textWithLink('Discord: ' + discordLink, marginX, y, { url: discordLink });
    }

    doc.save('order-summary.pdf');
  } catch (err) {
    console.error(err);
    alert('Hubo un problema generando el PDF. Probá de nuevo.');
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

init();
