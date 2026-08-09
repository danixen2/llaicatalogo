// ---------- Sanitizador de HTML enriquecido ----------
const RTE_ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'UL', 'OL', 'LI', 'BR', 'DIV', 'P', 'SPAN']);

function rteCleanChildren(node) {
  const frag = document.createDocumentFragment();
  node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      frag.appendChild(child.cloneNode());
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName;
      const cleanedChildren = rteCleanChildren(child);
      if (RTE_ALLOWED_TAGS.has(tag)) {
        const newEl = document.createElement(tag);
        if ((tag === 'DIV' || tag === 'P') && child.style && child.style.textAlign) {
          newEl.style.textAlign = child.style.textAlign;
        }
        newEl.appendChild(cleanedChildren);
        frag.appendChild(newEl);
      } else {
        frag.appendChild(cleanedChildren);
      }
    }
  });
  return frag;
}

function sanitizeRichHtml(html) {
  if (!html) return '';
  const container = document.createElement('div');
  container.innerHTML = html;
  const cleaned = rteCleanChildren(container);
  const out = document.createElement('div');
  out.appendChild(cleaned);
  return out.innerHTML;
}

function plainToEditableHtml(text) {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}

// Convierte el HTML enriquecido a texto plano legible (para el PDF, que no soporta HTML).
function richHtmlToPlainText(html) {
  if (!html) return '';
  const container = document.createElement('div');
  container.innerHTML = html;
  container.querySelectorAll('li').forEach(li => { li.textContent = '• ' + li.textContent; });
  container.querySelectorAll('p, div, li, br').forEach(el => { el.insertAdjacentText('afterend', '\n'); });
  return (container.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

document.addEventListener('mousedown', (e) => {
  const btn = e.target.closest('[data-rte-cmd]');
  if (!btn) return;
  e.preventDefault();
  const field = btn.closest('.rte-field');
  const editor = field && field.querySelector('.rte-editor');
  if (!editor) return;
  editor.focus();
  document.execCommand(btn.dataset.rteCmd, false, null);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
});

function rteToolbarHtml() {
  return `
    <div class="rte-toolbar">
      <button type="button" data-rte-cmd="bold" title="Negrita"><b>B</b></button>
      <button type="button" data-rte-cmd="italic" title="Cursiva"><i>I</i></button>
      <button type="button" data-rte-cmd="underline" title="Subrayado"><u>U</u></button>
      <button type="button" data-rte-cmd="strikeThrough" title="Tachado"><s>T</s></button>
      <span class="rte-sep"></span>
      <button type="button" data-rte-cmd="insertUnorderedList" title="Viñetas">•≡</button>
      <button type="button" data-rte-cmd="insertOrderedList" title="Numerada">1≡</button>
      <span class="rte-sep"></span>
      <button type="button" data-rte-cmd="justifyLeft" title="Alinear izquierda">⟸</button>
      <button type="button" data-rte-cmd="justifyCenter" title="Centrar">⇔</button>
      <button type="button" data-rte-cmd="justifyRight" title="Alinear derecha">⟹</button>
      <button type="button" data-rte-cmd="justifyFull" title="Justificar">☰</button>
    </div>
  `;
}

function rteFieldHtml(label, dataI, dataF, initialValue) {
  return `
    <div class="rte-field">
      <label>${label}</label>
      ${rteToolbarHtml()}
      <div class="rte-editor" contenteditable="true" data-i="${dataI}" data-f="${dataF}">${plainToEditableHtml(initialValue)}</div>
    </div>
  `;
}
