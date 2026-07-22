# Catálogo de Packs IA v2 — Guía de instalación

## Archivos
- `index.html` → catálogo público (portada, categorías, grilla, contacto). Link fijo para tus seguidores.
- `producto.html` → página individual de cada pack (se abre al hacer clic en un producto).
- `admin.html` → panel privado. **No lo compartas.**
- `site.json` → configuración de portada, categorías y contacto.
- `products.json` → tus productos.

## Instalación (igual que antes)
1. Creá un repositorio público en GitHub y subí todos estos archivos (manteniendo la carpeta `assets/`).
2. Settings → Pages → Branch `main` → carpeta `/ (root)` → Guardar.
3. Tu catálogo va a estar en `https://TU-USUARIO.github.io/TU-REPO/` en 1-2 minutos. Ese link no cambia nunca.
4. Generá un token fine-grained (Settings → Developer settings → Fine-grained tokens) con:
   - **Repository access:** solo tu repositorio del catálogo (creá el repo primero, después el token).
   - **Permissions → Contents: Read and write.**
5. Abrí `admin.html` en privado y conectate.

## Si el panel admin falla
Esta versión tiene un botón que **prueba la conexión antes de dejarte editar** y te va a decir exactamente qué está mal:
- **"Token inválido"** → el token venció o lo copiaste mal. Generá uno nuevo.
- **"No se encontró el repositorio, o el token no tiene acceso"** → revisá que el nombre de usuario y repo estén exactos (sensible a mayúsculas), y que el token tenga ese repo específico marcado en "Repository access". Si creaste el repo después del token, tenés que editar el token y agregar el repo.
- **"El token no tiene permiso de escritura"** → volvé a generar el token y asegurate de tildar **Contents: Read and write**, no solo "Read".
- La rama se ajusta sola si tu repo usa `master` en vez de `main`.

## Cómo agregar un producto
1. Abrí `admin.html` → pestaña **Productos**.
2. Completá título, categoría, imagen de portada, descripción (esta se muestra recién cuando el interesado hace clic en el producto), tags y tus dos links.
3. "Agregar a la lista" → "Guardar productos en GitHub".
4. En 1-2 minutos aparece en tu catálogo público, con su propia página de detalle en `producto.html?id=...`.

## Personalizar portada, categorías y contacto
Todo desde `admin.html`:
- **Pestaña Portada:** nombre de marca, título, bajada, badges, imagen de fondo del header, link general de muestras gratis.
- **Pestaña Categorías:** agregá/editá/borrá las categorías que aparecen en la barra lateral (id interno, nombre visible, ícono/emoji).
- **Pestaña Contacto:** email y redes sociales, aparecen en la sección de contacto y en el footer.

## Nada de esto depende de Claude/Anthropic
Es HTML/CSS/JS puro. Podés mover el sitio a cualquier otro hosting cuando quieras.
