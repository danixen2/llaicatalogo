async function init() {
  const lang = getLang();
  document.documentElement.lang = lang;

  renderLangSwitcher('lang-switch', lang, (newLang) => {
    const url = new URL(location.href);
    url.searchParams.set('lang', newLang);
    location.href = url.toString();
  });

  document.getElementById('back-link').textContent = t('back_link', lang);
  document.getElementById('back-link').href = 'index.html?lang=' + lang;
  document.getElementById('page-title').textContent = t('contacto_page_title', lang);

  const site = await (await fetch('site.json?t=' + Date.now())).json();

  document.getElementById('brand-name').textContent = site.brandName || '';
  document.getElementById('footer-brand').textContent = '© ' + new Date().getFullYear() + ' ' + (site.brandName || '');

  const avatarImg = document.getElementById('avatar-img');
  const avatarPlaceholder = document.getElementById('avatar-placeholder');
  if (site.avatarImage) {
    avatarImg.src = site.avatarImage;
    avatarImg.classList.remove('hidden');
    avatarPlaceholder.style.display = 'none';
  }

  const list = document.getElementById('contact-list');
  const links = site.contactLinks || [];

  if (links.length === 0) {
    list.innerHTML = `<p class="empty">${t('no_contacts_msg', lang)}</p>`;
    return;
  }

  list.innerHTML = links.map(c => `
    <a class="contact-item" href="${escapeHtml(c.link || '#')}" target="_blank" rel="noopener">
      ${c.icon ? `<img class="contact-icon" src="${escapeHtml(c.icon)}" alt="${escapeHtml(c.label)}">` : `<span class="contact-icon contact-icon-fallback">🔗</span>`}
      <span class="contact-label">${escapeHtml(c.label)}</span>
      <span class="contact-arrow">→</span>
    </a>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

init();
