// ---------- Sanitizador de HTML enriquecido ----------
// Solo permite formato básico de texto: negrita, cursiva, subrayado, tachado,
// listas, párrafos/saltos de línea y alineación. Nada de scripts, links, imágenes ni estilos raros.
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
        frag.appendChild(cleanedChildren); // tag no permitido: se descarta pero se conserva el contenido
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

// Texto plano viejo (de antes de este editor) -> HTML editable, respetando saltos de línea.
function plainToEditableHtml(text) {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text; // ya viene con formato
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}

// ---------- Barra de herramientas ----------
// Delegación de eventos: funciona incluso con editores agregados dinámicamente después.
document.addEventListener('mousedown', (e) => {
  const btn = e.target.closest('[data-rte-cmd]');
  if (!btn) return;
  e.preventDefault(); // no perder la selección de texto al hacer clic en el botón
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

// Genera el bloque completo: label + toolbar + editor. initialValue puede ser texto plano viejo o HTML.
function rteFieldHtml(label, dataI, dataF, initialValue) {
  return `
    <div class="rte-field">
      <label>${label}</label>
      ${rteToolbarHtml()}
      <div class="rte-editor" contenteditable="true" data-i="${dataI}" data-f="${dataF}">${plainToEditableHtml(initialValue)}</div>
    </div>
  `;
}
