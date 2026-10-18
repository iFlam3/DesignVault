const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const state = { designs: [], taxonomy: { categories: [], styles: [] }, category: '', current: null };

async function api(url, opts = {}) {
  const res = await fetch(url, opts);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
  return body;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}

const catLabel = (id) => state.taxonomy.categories.find((c) => c.id === id)?.label ?? (id || 'Sin categoría');
const img = (d, im, key) => `/library/${d.slug}/${im[key]}?v=${encodeURIComponent(d.updatedAt)}`;

/* ---------- Filtros y rejilla ---------- */

function filtered() {
  const q = $('#q').value.trim().toLowerCase();
  const style = $('#style-filter').value;
  const pending = $('#only-pending').checked;
  return state.designs.filter((d) =>
    (!state.category || d.category === state.category) &&
    (!style || d.styles.includes(style)) &&
    (!pending || d.status === 'pending') &&
    (!q || [d.title, d.description, d.standout, d.tags.join(' '), d.styles.join(' '), d.url]
      .join(' ').toLowerCase().includes(q)));
}

function renderTabs() {
  const counts = {};
  for (const d of state.designs) counts[d.category] = (counts[d.category] ?? 0) + 1;
  const tabs = [{ id: '', label: 'Todo', n: state.designs.length },
    ...state.taxonomy.categories.filter((c) => counts[c.id]).map((c) => ({ ...c, n: counts[c.id] }))];
  $('#categories').innerHTML = tabs
    .map((t) => `<button role="tab" data-cat="${esc(t.id)}" aria-selected="${state.category === t.id}">${esc(t.label)}<sup>${t.n}</sup></button>`)
    .join('');
}

function renderGrid() {
  const list = filtered();
  const pending = state.designs.filter((d) => d.status === 'pending').length;
  $('#count').textContent = `· ${state.designs.length} diseños${pending ? ` · ${pending} pendientes` : ''}`;
  $('#empty').hidden = list.length > 0;
  $('#grid').innerHTML = list.map((d) => {
    const n = String(state.designs.length - state.designs.indexOf(d)).padStart(3, '0');
    const cover = d.images[0];
    return `<li><button class="card" data-slug="${d.slug}">
      <figure>
        ${cover ? `<img src="${img(d, cover, 'thumb')}" alt="" loading="lazy">` : ''}
        ${d.status === 'pending' ? '<span class="pending-dot">Pendiente</span>' : ''}
      </figure>
      <div class="card-meta"><span class="eyebrow">№ ${n}</span><span class="eyebrow">${esc(catLabel(d.category))}</span></div>
      <h3>${esc(d.title)}</h3>
      <div class="swatches">${d.palette.map((c) => `<span style="background:${esc(c)}"></span>`).join('')}</div>
      ${d.styles.length ? `<div class="card-styles">${esc(d.styles.join(' · '))}</div>` : ''}
    </button></li>`;
  }).join('');
}

function render() { renderTabs(); renderGrid(); }

async function load() {
  state.designs = await api('/api/designs');
  render();
}

/* ---------- Formularios compartidos ---------- */

function fillTaxonomyControls(root) {
  for (const sel of root.querySelectorAll('[data-categories]')) {
    sel.innerHTML = '<option value="">—</option>' +
      state.taxonomy.categories.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('');
  }
  for (const box of root.querySelectorAll('[data-styles]')) {
    box.innerHTML = state.taxonomy.styles
      .map((s) => `<label><input type="checkbox" name="styles" value="${s}"><span>${s}</span></label>`).join('');
  }
}

function formToObject(form) {
  const fd = new FormData(form);
  const obj = Object.fromEntries([...fd].filter(([k, v]) => k !== 'styles' && typeof v === 'string'));
  obj.styles = fd.getAll('styles');
  return obj;
}

/* ---------- Detalle ---------- */

function openDetail(slug) {
  const d = state.designs.find((x) => x.slug === slug);
  if (!d) return;
  state.current = d;
  const form = $('#edit-form');
  for (const k of ['title', 'url', 'description', 'category', 'status', 'standout', 'typography', 'layout']) form.elements[k].value = d[k] ?? '';
  form.elements.tags.value = d.tags.join(', ');
  // Estilos que Claude haya inventado fuera de la taxonomía también deben verse y poder quitarse.
  const box = $('[data-styles]', form);
  for (const s of d.styles) {
    if (!state.taxonomy.styles.includes(s) && !box.querySelector(`input[value="${CSS.escape(s)}"]`)) {
      box.insertAdjacentHTML('beforeend', `<label><input type="checkbox" name="styles" value="${esc(s)}"><span>${esc(s)}</span></label>`);
    }
  }
  for (const cb of form.querySelectorAll('[name=styles]')) cb.checked = d.styles.includes(cb.value);

  $('#detail-meta').textContent = `${d.slug} · ${d.images.length} img · ${new Date(d.createdAt).toLocaleDateString()}`;
  $('#palette').innerHTML = d.palette.map((c) => `<span><i style="background:${esc(c)}"></i>${esc(c)}</span>`).join('');
  $('#shots').innerHTML = d.images.map((im) => `<figure class="shot">
      <img src="${img(d, im, 'file')}" alt="${esc(d.title)}" loading="lazy">
      ${d.images.length > 1 ? `<button type="button" data-remove="${im.file}">Quitar</button>` : ''}
    </figure>`).join('') || '<p class="hint">Sin imágenes.</p>';

  const dlg = $('#detail');
  if (!dlg.open) dlg.showModal();
}

function replaceCurrent(updated) {
  state.designs = state.designs.map((d) => (d.slug === updated.slug ? updated : d));
  render();
  openDetail(updated.slug);
}

$('#edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    replaceCurrent(await api(`/api/designs/${state.current.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formToObject(e.target)),
    }));
    toast('Guardado');
  } catch (err) { toast(err.message); }
});

$('#add-images').addEventListener('change', async (e) => {
  if (!e.target.files.length) return;
  const fd = new FormData();
  for (const f of e.target.files) fd.append('images', f);
  e.target.value = '';
  toast('Procesando imágenes…');
  try {
    replaceCurrent(await api(`/api/designs/${state.current.slug}/images`, { method: 'POST', body: fd }));
    toast('Imágenes añadidas');
  } catch (err) { toast(err.message); }
});

$('#shots').addEventListener('click', async (e) => {
  const file = e.target.dataset.remove;
  if (!file || !confirm('¿Quitar esta imagen?')) return;
  try {
    replaceCurrent(await api(`/api/designs/${state.current.slug}/images/${file}`, { method: 'DELETE' }));
  } catch (err) { toast(err.message); }
});

$('#delete').addEventListener('click', async () => {
  const d = state.current;
  if (!confirm(`¿Eliminar “${d.title}” y sus imágenes? No se puede deshacer.`)) return;
  try {
    await api(`/api/designs/${d.slug}`, { method: 'DELETE' });
    state.designs = state.designs.filter((x) => x.slug !== d.slug);
    $('#detail').close();
    render();
    toast('Eliminado');
  } catch (err) { toast(err.message); }
});

/* ---------- Subida ---------- */

const uploadForm = $('#upload-form');
const fileInput = uploadForm.elements.images;
const drop = $('#drop');

function describeFiles() {
  const n = fileInput.files.length;
  $('#drop-text').textContent = n ? `${n} imagen${n > 1 ? 'es' : ''}: ${[...fileInput.files].map((f) => f.name).join(', ')}` : 'Suelta capturas aquí o haz clic';
  if (n && !uploadForm.elements.title.value) {
    uploadForm.elements.title.value = fileInput.files[0].name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  }
}
fileInput.addEventListener('change', describeFiles);
// Evita que soltar fuera de la zona abra la imagen en el navegador.
for (const ev of ['dragover', 'drop']) window.addEventListener(ev, (e) => e.preventDefault());
for (const ev of ['dragenter', 'dragover']) drop.addEventListener(ev, () => drop.classList.add('over'));
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', (e) => {
  drop.classList.remove('over');
  const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
  if (!files.length) return toast('Arrastra archivos de imagen desde tu carpeta');
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  fileInput.files = dt.files;
  describeFiles();
});

$('#open-upload').addEventListener('click', () => $('#upload').showModal());

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = uploadForm.querySelector('[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Procesando…';
  try {
    const created = await api('/api/designs', { method: 'POST', body: new FormData(uploadForm) });
    state.designs.unshift(created);
    uploadForm.reset();
    describeFiles();
    $('#upload').close();
    render();
    toast('Añadido como pendiente');
  } catch (err) {
    toast(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar en el archivo';
  }
});

/* ---------- Eventos de filtro ---------- */

$('#categories').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  state.category = b.dataset.cat;
  render();
});
$('#grid').addEventListener('click', (e) => {
  const card = e.target.closest('[data-slug]');
  if (card) openDetail(card.dataset.slug);
});
for (const id of ['#q', '#style-filter', '#only-pending']) $(id).addEventListener('input', renderGrid);

/* ---------- Arranque ---------- */

state.taxonomy = await api('/api/taxonomy');
fillTaxonomyControls(document);
$('#style-filter').insertAdjacentHTML('beforeend', state.taxonomy.styles.map((s) => `<option>${s}</option>`).join(''));
await load();
