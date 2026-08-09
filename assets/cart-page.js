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

  applyStaticText();
  renderCart();

  document.getElementById('download-pdf-btn').addEventListener('click', generateReceiptPdf);
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
    return `
      <div class="cart-item">
        <img src="${escapeHtml(product.image || '')}" alt="${escapeHtml(name)}">
        <div>
          <h3>${escapeHtml(name)}</h3>
          <div class="version-select">
            <label><input type="radio" name="version-${idx}" value="base" ${item.version === 'base' ? 'checked' : ''} data-pid="${escapeAttr(item.productId)}" data-oldv="${escapeAttr(item.version)}"> ${t('version_base', L)} · ${formatYen(product.price)}</label>
            <label><input type="radio" name="version-${idx}" value="boost" ${item.version === 'boost' ? 'checked' : ''} data-pid="${escapeAttr(item.productId)}" data-oldv="${escapeAttr(item.version)}"> ${t('version_boost', L)} · ${formatYen(product.price * 2)}</label>
          </div>
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

// ---------- Generación del PDF (siempre en inglés, salvo el pie de página) ----------

function generateReceiptPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const items = getCart();
  const brandName = (cartState.site.brandName || 'Catalog');
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  let y = 55;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(brandName, marginX, y);
  y += 22;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110);
  doc.text('Order Summary', marginX, y);
  y += 16;

  const dateStr = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  doc.setFontSize(9);
  doc.text('Date: ' + dateStr, marginX, y);
  y += 28;

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

  if (y > 680) { doc.addPage(); y = 55; }

  doc.setDrawColor(230);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 24;

  const footerLines = [
    'Gracias por tu recibo, por favor unite a mi servidor de Discord para contactarme y coordinar el pago de los productos seleccionados.',
    'Thank you for your receipt — please join my Discord server to contact me and arrange payment for the selected products.',
    'レシートをありがとうございます。ご連絡とお支払いの調整については、Discordサーバーにご参加ください。',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  footerLines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, pageWidth - marginX * 2);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 12 + 8;
  });

  const discordLink = cartState.site.receiptDiscordLink;
  if (discordLink) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(90, 60, 160);
    doc.textWithLink('Discord: ' + discordLink, marginX, y, { url: discordLink });
  }

  doc.save('order-summary.pdf');
}

init();
