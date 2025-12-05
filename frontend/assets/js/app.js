/* assets/js/app.js
   Общие JS-утилиты и логика для DataHub ВУЗ-ов "РК"
   Используется на страницах: index.html, programs.html, admission.html, compare.html, partners.html, tour.html, university.html
*/

/* ======================
   Configuration
   ====================== */
const API_BASE = ''; // пусто => относительные пути, можно поставить 'http://localhost:8000' если backend на другом хосте
const DEFAULT_PAGE_SIZE = 12;

/* ======================
   Helpers
   ====================== */

// safe escape for text injection
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// simple toast/message
function showToast(msg, type = 'info', timeout = 3500) {
  const t = document.createElement('div');
  t.className = `dh-toast dh-toast-${type}`;
  t.style.cssText = 'position:fixed;right:18px;bottom:18px;background:rgba(2,6,23,0.9);color:#e6eef8;padding:10px 14px;border-radius:8px;box-shadow:0 8px 30px rgba(2,6,23,0.6);z-index:99999;font-weight:600;';
  t.innerHTML = escapeHtml(msg);
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(()=>t.remove(),400); }, timeout);
}

// fetch wrapper GET
async function apiGet(path, opts = {}) {
  const url = (API_BASE || '') + path;
  try {
    const resp = await fetch(url, { method: 'GET', credentials: 'same-origin', ...opts });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('application/json')) return await resp.json();
    return await resp.text();
  } catch (err) {
    // bubble up
    throw err;
  }
}

// fetch wrapper POST JSON
async function apiPost(path, body = {}, opts = {}) {
  const url = (API_BASE || '') + path;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      body: JSON.stringify(body),
      ...opts
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(()=>null);
      throw new Error(txt || `HTTP ${resp.status}`);
    }
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('application/json')) return await resp.json();
    return await resp.text();
  } catch (err) {
    throw err;
  }
}

// fetch wrapper POST FormData (files)
async function apiPostForm(path, formData, opts = {}) {
  const url = (API_BASE || '') + path;
  try {
    const resp = await fetch(url, { method: 'POST', credentials: 'same-origin', body: formData, ...opts });
    if (!resp.ok) {
      const txt = await resp.text().catch(()=>null);
      throw new Error(txt || `HTTP ${resp.status}`);
    }
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('application/json')) return await resp.json();
    return await resp.text();
  } catch (err) {
    throw err;
  }
}

/* ======================
   API helpers (common)
   Each returns JSON or throws
   ====================== */

async function fetchUniversities(params = {}) {
  // params: {q, region, page, page_size}
  const qs = new URLSearchParams(params || {}).toString();
  try {
    const res = await apiGet(`/api/universities${qs ? '?' + qs : ''}`);
    // expect array
    return Array.isArray(res) ? res : (res.items || []);
  } catch (e) {
    console.warn('fetchUniversities failed:', e);
    // fallback small mock
    return [
      { id: 'u_demo_1', name: 'Университет Демонстрация A', short_desc: 'Демо вуз A', rating: 82, city: 'Алматы', student_count: 12000 },
      { id: 'u_demo_2', name: 'Университет Демонстрация B', short_desc: 'Демо вуз B', rating: 75, city: 'Нур-Султан', student_count: 7500 },
      { id: 'u_demo_3', name: 'Университет Демонстрация C', short_desc: 'Демо вуз C', rating: 68, city: 'Шымкент', student_count: 9800 }
    ];
  }
}

async function fetchPrograms(params = {}) {
  const qs = new URLSearchParams(params || {}).toString();
  try {
    const res = await apiGet(`/api/programs${qs ? '?' + qs : ''}`);
    return Array.isArray(res) ? res : (res.items || []);
  } catch (e) {
    console.warn('fetchPrograms failed:', e);
    return []; // no mock here
  }
}

async function fetchUniversityById(id) {
  if (!id) throw new Error('id required');
  try {
    return await apiGet(`/api/universities/${id}`);
  } catch (e) {
    console.warn('fetchUniversityById failed', e);
    throw e;
  }
}

async function fetchAdmissionForUniversity(id) {
  try {
    return await apiGet(`/api/universities/${id}/admission`);
  } catch (e) {
    console.warn('fetchAdmissionForUniversity failed', e);
    return null;
  }
}

async function fetchPartnersForUniversity(id) {
  try {
    return await apiGet(`/api/universities/${id}/partners`);
  } catch (e) {
    console.warn('fetchPartnersForUniversity failed', e);
    return [];
  }
}

async function fetchTourForUniversity(id) {
  try {
    return await apiGet(`/api/universities/${id}/tour`);
  } catch (e) {
    console.warn('fetchTourForUniversity failed', e);
    return null;
  }
}

/* ======================
   Render helpers
   ====================== */

// render a grid of university cards into containerElement (DOM element)
function renderUniversityCards(containerElement, universities, opts = {}) {
  // opts: showShort, showActions
  containerElement.innerHTML = '';
  if (!universities || universities.length === 0) {
    containerElement.innerHTML = '<div class="card empty"><h4>Вузы не найдены</h4><p class="small muted-note">Попробуйте изменить фильтры или обновить страницу.</p></div>';
    return;
  }
  universities.forEach(u => {
    const art = document.createElement('article');
    art.className = 'card univ-card';
    art.dataset.id = u.id || '';
    // image/logo fallback
    const logoHtml = u.logo_url ? `<img class="logo" src="${escapeHtml(u.logo_url)}" alt="${escapeHtml(u.name)}">` : `<div class="logo" style="display:flex;align-items:center;justify-content:center;height:140px;color:var(--muted)">${escapeHtml(u.name ? u.name.slice(0,1) : '')}</div>`;
    art.innerHTML = `
      ${logoHtml}
      <h3>${escapeHtml(u.name || '—')}</h3>
      <p class="short small muted-note">${escapeHtml(u.short_desc || '')}</p>
      <div class="meta small muted-note">${escapeHtml(u.city || '')} · рейтинг: ${escapeHtml(u.rating != null ? String(u.rating) : '—')}</div>
      <div style="margin-top:8px; display:flex; gap:8px;">
        <a class="btn ghost" href="university.html?id=${encodeURIComponent(u.id || '')}">Подробнее</a>
        <a class="btn primary" href="admission.html?univ_id=${encodeURIComponent(u.id || '')}">Подать заявление</a>
      </div>
    `;
    containerElement.appendChild(art);
  });
}

// render simple list of popular universities (ul element)
function renderPopularList(ulElement, universities = []) {
  ulElement.innerHTML = '';
  universities.slice(0, 6).forEach(u => {
    const li = document.createElement('li');
    li.style.listStyle = 'none';
    li.style.marginBottom = '8px';
    li.innerHTML = `<a href="university.html?id=${encodeURIComponent(u.id||'')}" style="color:var(--accent)">${escapeHtml(u.name||'—')}</a> <span class="small muted-note"> · ${escapeHtml(u.city||'')}</span>`;
    ulElement.appendChild(li);
  });
}

/* ======================
   Index page init
   - search, filters, pagination, popular list
   ====================== */
async function initIndexPage(opts = {}) {
  // opts: containerId, popularId, searchFormId, pageSize
  const container = document.getElementById(opts.containerId || 'univList');
  const popularEl = document.getElementById(opts.popularId || 'popularList');
  const searchForm = document.getElementById(opts.searchFormId || 'searchForm');

  let page = 1;
  const pageSize = opts.pageSize || DEFAULT_PAGE_SIZE;
  let currentResults = [];

  // load initial universities
  async function loadAndRender(q = '', region = '', sortBy = '') {
    try {
      const params = {};
      if (q) params.q = q;
      if (region) params.region = region;
      const list = await fetchUniversities(params);
      // simple client-side sort
      if (sortBy === 'rating') list.sort((a,b)=> (b.rating||0)-(a.rating||0));
      if (sortBy === 'students') list.sort((a,b)=> (b.student_count||0)-(a.student_count||0));
      currentResults = list;
      renderPage(1);
      renderPopularList(popularEl, list.filter(x => x.rating).slice(0,6));
      // update pagination info if exists
      const pagination = document.getElementById('pagination');
      if (pagination) {
        const pageInfo = document.getElementById('pageInfo');
        pageInfo.textContent = `1 / ${Math.max(1, Math.ceil(currentResults.length / pageSize))}`;
        pagination.style.display = currentResults.length > pageSize ? 'flex' : 'none';
      }
    } catch (e) {
      console.error('loadAndRender error', e);
      showToast('Ошибка загрузки списка вузов (см. консоль)', 'error', 3000);
    }
  }

  function renderPage(p = 1) {
    page = p;
    const start = (p - 1) * pageSize;
    const items = currentResults.slice(start, start + pageSize);
    renderUniversityCards(container, items);
    // pagination UI
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) pageInfo.textContent = `${p} / ${Math.max(1, Math.ceil(currentResults.length / pageSize))}`;
  }

  // attach search form
  if (searchForm) {
    searchForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const q = document.getElementById('searchQ') ? document.getElementById('searchQ').value.trim() : '';
      const region = document.getElementById('filterRegion') ? document.getElementById('filterRegion').value : '';
      loadAndRender(q, region, document.getElementById('sortBy') ? document.getElementById('sortBy').value : '');
    });
  }

  // sort/select handlers
  const sortByEl = document.getElementById('sortBy');
  if (sortByEl) sortByEl.addEventListener('change', ()=> loadAndRender(document.getElementById('searchQ').value, document.getElementById('filterRegion').value, sortByEl.value));
  const showOnly = document.getElementById('showOnly');
  if (showOnly) showOnly.addEventListener('change', ()=> loadAndRender(document.getElementById('searchQ').value, document.getElementById('filterRegion').value, sortByEl ? sortByEl.value : ''));

  // pagination controls
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  if (prevBtn) prevBtn.addEventListener('click', ()=> { if (page>1) renderPage(page-1); });
  if (nextBtn) nextBtn.addEventListener('click', ()=> { if (page < Math.ceil(currentResults.length / pageSize)) renderPage(page+1); });

  // reload button
  const btnReload = document.getElementById('btnReload');
  if (btnReload) btnReload.addEventListener('click', ()=> loadAndRender(document.getElementById('searchQ').value || '', document.getElementById('filterRegion').value || ''));

  // initial load
  loadAndRender();
}

/* ======================
   Programs page utilities
   - small helper used by programs.html
   ====================== */

async function initProgramsPage(opts = {}) {
  // opts not required; page-specific code in programs.html mostly calls fetchProgramsServer
  // but we expose helper functions used there
  // For completeness, preload universities for filter selects
  const univSelect = document.getElementById('univFilterProg');
  if (univSelect) {
    try {
      const unis = await fetchUniversities();
      univSelect.innerHTML = '<option value="">Все вузы</option>' + unis.map(u => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)}</option>`).join('');
    } catch (e) { console.warn('initProgramsPage loadUniversities fail', e); }
  }
}

/* ======================
   Compare page helpers
   (most compare logic in compare.html; we expose fetchUniversities)
   ====================== */

/* ======================
   Partners page helpers
   ====================== */

async function initPartnersPage() {
  // preload universities into selects
  const selects = document.querySelectorAll('#univFilter, #ap_univ');
  if (!selects) return;
  try {
    const unis = await fetchUniversities();
    selects.forEach(sel => {
      sel.innerHTML = (sel.id === 'univFilter' ? '<option value="">Все университеты</option>' : '<option value="">— выбрать —</option>') + unis.map(u=>`<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)}</option>`).join('');
    });
  } catch (e) {
    console.warn('initPartnersPage: failed to load universities', e);
  }
}

/* ======================
   Tour page helpers
   ====================== */

async function initTourPage() {
  // preload univ list for tour page
  const sel = document.getElementById('univTourSelect');
  if (!sel) return;
  try {
    const unis = await fetchUniversities();
    sel.innerHTML = '<option value="">— выбрать вуз —</option>' + unis.map(u=>`<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)}</option>`).join('');
  } catch (e) {
    console.warn('initTourPage failed', e);
  }
}

/* ======================
   University page helpers
   ====================== */

async function initUniversityPage() {
  // nothing general here; university.html contains its own loader using fetchUniversityById
}

/* ======================
   Generic CSV export helper
   - rows: array of objects; header: array of keys/labels
   ====================== */
function exportCSV(filename = 'export.csv', header = [], rows = []) {
  // header: array of strings (column names), rows: array of arrays (each row same order)
  const csv = [ header.join(',') ].concat(rows.map(r => r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ======================
   Modal helpers
   ====================== */
function openModal(el) {
  if (!el) return;
  el.style.display = 'flex';
}
function closeModal(el) {
  if (!el) return;
  el.style.display = 'none';
}

/* ======================
   Auto-init for common pages
   If index page present -> initIndexPage
   If programs page present -> initProgramsPage
   If partners page present -> initPartnersPage
   If tour page present -> initTourPage
   ====================== */
document.addEventListener('DOMContentLoaded', () => {
  // small delay to let page-specific inline scripts run if needed
  try {
    if (document.getElementById('univList')) {
      initIndexPage({ containerId: 'univList', popularId: 'popularList', searchFormId: 'searchForm', pageSize: 12 });
    }
    if (document.getElementById('programsList')) {
      initProgramsPage();
    }
    if (document.getElementById('partnersGrid')) {
      initPartnersPage();
    }
    if (document.getElementById('panorama')) {
      initTourPage();
    }
  } catch (e) {
    console.warn('Auto init error', e);
  }
});

/* ======================
   Expose utilities for page-local scripts
   ====================== */
window.DataHub = {
  apiGet, apiPost, apiPostForm,
  escapeHtml, showToast,
  fetchUniversities, fetchPrograms, fetchUniversityById, fetchAdmissionForUniversity,
  fetchPartnersForUniversity, fetchTourForUniversity,
  renderUniversityCards, renderPopularList,
  exportCSV, openModal, closeModal
};
// ripple.js — добавляет эффект волны на элементы с классом .ripple
document.addEventListener('click', function(e){
  const el = e.target.closest('button.ripple, .btn.ripple, a.btn.ripple');
  if(!el) return;

  // координаты клика внутри элемента
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // создаём span .ripple-node (или используем pseudo-element via class toggle)
  let node = el.querySelector('.ripple-node');
  if(!node) {
    node = document.createElement('span');
    node.className = 'ripple-node';
    Object.assign(node.style, {
      position: 'absolute',
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      background: 'rgba(255,255,255,0.26)',
      left: '0px',
      top: '0px',
      width: '0px',
      height: '0px',
      transition: 'width 420ms ease, height 420ms ease, opacity 420ms ease'
    });
    el.appendChild(node);
  } else {
    node.style.transition = 'none';
    node.style.width = '0px';
    node.style.height = '0px';
    node.style.opacity = '1';
  }

  node.style.left = x + 'px';
  node.style.top = y + 'px';

  // force layout then animate
  void node.offsetWidth;
  const size = Math.max(rect.width, rect.height) * 2;
  node.style.width = size + 'px';
  node.style.height = size + 'px';
  node.style.opacity = '0.95';

  // fade out later
  setTimeout(()=> {
    node.style.opacity = '0';
  }, 250);

  // cleanup after animation
  setTimeout(()=> {
    try { node.remove(); } catch(e){}
  }, 700);
});


/* ======================
   End of file
   ====================== */
