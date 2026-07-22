const I18N = {
  es: {
    nav_home: 'Inicio', nav_packs: 'Packs', nav_samples: 'Muestras Gratis',
    nav_categories: 'Categorías', nav_contact: 'Contacto',
    search_placeholder: 'Buscar packs...',
    categorias_title: 'Categorías', todos: 'Todos', packs_title: 'Packs',
    empty_msg: 'No hay packs que coincidan con tu búsqueda.', ver_mas: 'Ver más',
    muestras_title: 'Muestras Gratis',
    muestras_desc: 'Descargá imágenes de muestra y probá la calidad de mis packs antes de comprar.',
    ver_muestras_btn: 'Ver muestras',
    como_funciona_title: 'Cómo Funciona',
    step1_title: 'Elegí un pack', step1_desc: 'Explorá y seleccioná tu favorito.',
    step2_title: 'Descargá y disfrutá', step2_desc: 'Recibí tu pack al instante.',
    step3_title: 'Creá y compartí', step3_desc: 'Usalo para lo que quieras inspirarte.',
    duda_title: '¿Tenés alguna duda?', escribime_a: 'Escribime a', gracias_apoyo: '— ¡gracias por apoyar mi trabajo!',
    contactar_btn: 'Contactar', footer_hecho: 'Hecho con amor para fans',
    back_link: '← Volver al catálogo',
    ver_muestra_gratis_btn: '🌟 Ver muestra gratis', comprar_btn: '💜 Comprar',
    mas_packs_de: 'Más packs de', notfound_msg: 'No encontramos ese pack.',
    loading_msg: 'Cargando…',
    sort_label: 'Ordenar:', sort_newest: 'Más nuevos primero', sort_oldest: 'Más antiguos primero',
  },
  en: {
    nav_home: 'Home', nav_packs: 'Packs', nav_samples: 'Free Samples',
    nav_categories: 'Categories', nav_contact: 'Contact',
    search_placeholder: 'Search packs...',
    categorias_title: 'Categories', todos: 'All', packs_title: 'Packs',
    empty_msg: 'No packs match your search.', ver_mas: 'View more',
    muestras_title: 'Free Samples',
    muestras_desc: 'Download sample images and try the quality of my packs before buying.',
    ver_muestras_btn: 'View samples',
    como_funciona_title: 'How It Works',
    step1_title: 'Choose a pack', step1_desc: 'Browse and pick your favorite.',
    step2_title: 'Download and enjoy', step2_desc: 'Get your pack instantly.',
    step3_title: 'Create and share', step3_desc: 'Use it however inspires you.',
    duda_title: 'Have a question?', escribime_a: 'Write to me at', gracias_apoyo: '— thanks for supporting my work!',
    contactar_btn: 'Contact', footer_hecho: 'Made with love for fans',
    back_link: '← Back to catalog',
    ver_muestra_gratis_btn: '🌟 View free sample', comprar_btn: '💜 Buy',
    mas_packs_de: 'More packs from', notfound_msg: "We couldn't find that pack.",
    loading_msg: 'Loading…',
    sort_label: 'Sort:', sort_newest: 'Newest first', sort_oldest: 'Oldest first',
  },
  ja: {
    nav_home: 'ホーム', nav_packs: 'パック', nav_samples: '無料サンプル',
    nav_categories: 'カテゴリー', nav_contact: 'お問い合わせ',
    search_placeholder: 'パックを検索...',
    categorias_title: 'カテゴリー', todos: 'すべて', packs_title: 'パック',
    empty_msg: '検索条件に一致するパックがありません。', ver_mas: '詳細を見る',
    muestras_title: '無料サンプル',
    muestras_desc: '購入前にサンプル画像をダウンロードして品質をお試しください。',
    ver_muestras_btn: 'サンプルを見る',
    como_funciona_title: 'ご利用方法',
    step1_title: 'パックを選ぶ', step1_desc: 'お気に入りを探して選択してください。',
    step2_title: 'ダウンロードして楽しむ', step2_desc: 'すぐにパックを受け取れます。',
    step3_title: '作成してシェア', step3_desc: 'インスピレーションのままにお使いください。',
    duda_title: 'ご質問がありますか？', escribime_a: 'こちらまでご連絡ください:', gracias_apoyo: '— ご支援ありがとうございます！',
    contactar_btn: 'お問い合わせ', footer_hecho: 'ファンのために心を込めて作りました',
    back_link: '← カタログに戻る',
    ver_muestra_gratis_btn: '🌟 無料サンプルを見る', comprar_btn: '💜 購入する',
    mas_packs_de: '関連パック：', notfound_msg: 'そのパックが見つかりませんでした。',
    loading_msg: '読み込み中…',
    sort_label: '並び替え：', sort_newest: '新しい順', sort_oldest: '古い順',
  },
};

function getLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl && I18N[fromUrl]) { localStorage.setItem('catalogo_lang', fromUrl); return fromUrl; }
  const saved = localStorage.getItem('catalogo_lang');
  if (saved && I18N[saved]) return saved;
  return 'es';
}

function setLang(lang) { localStorage.setItem('catalogo_lang', lang); }

function t(key, lang) { return (I18N[lang] && I18N[lang][key]) || I18N.es[key] || key; }

// Título/descripción: usa la versión del idioma si existe, si no cae al español.
// Tags, categoría, nombre de marca NUNCA se traducen (se muestran tal cual se cargaron).
function localizedField(obj, field, lang) {
  if (lang === 'es') return obj[field] || '';
  const key = field + '_' + lang;
  return (obj[key] && obj[key].trim()) ? obj[key] : (obj[field] || '');
}

function renderLangSwitcher(containerId, lang, onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const langs = [['es', 'ES'], ['en', 'EN'], ['ja', '日本語']];
  el.innerHTML = langs.map(([code, label]) =>
    `<button type="button" class="lang-btn ${code === lang ? 'active' : ''}" data-lang="${code}">${label}</button>`
  ).join('');
  el.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      onChange(btn.dataset.lang);
    });
  });
}
