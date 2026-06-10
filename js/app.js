// =====================================================
// APP.JS - Main Application Router & Controller
// =====================================================
import { initSupabase, SitesAPI, DevicesAPI, PortsAPI, AuditAPI } from './supabase.js';
import { initAuth, currentUser, currentProfile, canEdit, isGuest, renderLoginPage, initLoginAnimation, handleSignOut } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderSitePage } from './sites.js';
import { renderDevicePage } from './devices.js';
import { renderSearchPage } from './search.js';
import { renderSettingsPage } from './settings.js';
import { OfflineQueue } from './supabase.js';
import { storage, vibrate, isOnline } from './utils.js';

// =====================================================
// APP STATE
// =====================================================
const AppState = {
  currentPage: 'dashboard',
  currentSiteId: null,
  currentDeviceId: null,
  theme: storage.get('theme', 'dark'),
  siteCache: null,
  deviceCache: {}
};

// =====================================================
// TOAST NOTIFICATION SYSTEM
// =====================================================
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast__text">${message}</span>
    <button onclick="this.closest('.toast').remove()" 
            style="background:none;border:none;color:var(--color-text-muted);cursor:pointer;padding:2px;margin-left:4px;font-size:16px;">✕</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// =====================================================
// PORT MODAL - Edit port connection
// =====================================================
export async function showPortModal(deviceId, portId, portNumber, tubeId, displayType = 'otb') {
  // Get port data
  let portData = null;
  if (portId) {
    try {
      const ports = await PortsAPI.getByDevice(deviceId);
      portData = ports.find(p => p.id === portId);
    } catch {}
  }

  const isEditable = canEdit();
  const label = portData?.connection_label || '';
  const detail = portData?.connection_detail || '';
  const status = portData?.status || 'empty';
  const notes  = portData?.notes || '';

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };

  backdrop.innerHTML = `
    <div class="modal port-detail-modal" onclick="event.stopPropagation()">
      <div class="modal__handle"></div>

      <!-- Header -->
      <div class="port-detail-header">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div class="port-number-badge">
            📍 PORT ${String(portNumber).padStart(2, '0')}
          </div>
          <span class="badge badge-${status}">${getStatusLabel(status)}</span>
        </div>
        ${label ? `
          <div class="connection-path">
            <div class="connection-path__node">
              <div class="connection-path__node-label">Dari</div>
              <div class="connection-path__node-value" style="color:var(--color-primary-light)">
                Port ${portNumber}
              </div>
            </div>
            <div class="connection-path__line">→</div>
            <div class="connection-path__node">
              <div class="connection-path__node-label">Ke</div>
              <div class="connection-path__node-value" style="color:var(--color-filled)">
                ${label}
              </div>
            </div>
          </div>
        ` : `
          <div style="text-align:center;padding:12px;color:var(--color-text-muted);font-size:0.875rem;">
            Port ini belum memiliki koneksi
          </div>
        `}
      </div>

      <!-- Body: Edit Form -->
      ${isEditable ? `
        <div class="port-detail-body">
          <div class="form-group">
            <label class="form-label">Label Koneksi / Tujuan</label>
            <input class="form-input" type="text" id="modal-label"
                   value="${label}" placeholder="cth: Karangtengah 1/3/2 atau CWDM-KBM-1470"
                   autocomplete="off">
            <div class="form-hint">Nama lokasi atau label yang terhubung ke port ini</div>
          </div>

          <div class="form-group">
            <label class="form-label">Detail / Keterangan Tambahan</label>
            <input class="form-input" type="text" id="modal-detail"
                   value="${detail}" placeholder="cth: Port 17, GTGO 1/3/2"
                   autocomplete="off">
          </div>

          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="modal-status">
              <option value="filled"     ${status === 'filled'     ? 'selected' : ''}>🟢 Terisi</option>
              <option value="empty"      ${status === 'empty'      ? 'selected' : ''}>⚪ Kosong</option>
              <option value="unverified" ${status === 'unverified' ? 'selected' : ''}>🟡 Belum Verifikasi</option>
              <option value="reserved"   ${status === 'reserved'   ? 'selected' : ''}>🟣 Reservasi</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Catatan</label>
            <textarea class="form-textarea" id="modal-notes" placeholder="Catatan tambahan...">${notes}</textarea>
          </div>

          <div class="modal__actions">
            <button class="btn btn-secondary" style="flex:1" onclick="document.querySelector('.modal-backdrop').remove()">
              Batal
            </button>
            <button class="btn btn-primary" style="flex:2"
                    onclick="savePortEdit('${deviceId}', '${portId || ''}', ${portNumber}, '${tubeId || ''}', '${displayType}')">
              💾 Simpan
            </button>
          </div>

          ${portId ? `
            <div style="margin-top:16px;text-align:center;">
              <button class="btn btn-ghost btn-sm" style="color:var(--color-text-muted)"
                      onclick="verifyPort('${portId}', '${deviceId}')">
                ✅ Tandai Sudah Diverifikasi
              </button>
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="port-detail-body">
          <div style="text-align:center;padding:24px;color:var(--color-text-muted);">
            ${isGuest() ? '👀 Mode tamu — tidak bisa mengedit' : 'Anda tidak memiliki izin edit'}
          </div>
          <button class="btn btn-secondary btn-full" onclick="document.querySelector('.modal-backdrop').remove()">
            Tutup
          </button>
        </div>
      `}
    </div>
  `;

  document.body.appendChild(backdrop);

  // Focus first input
  setTimeout(() => {
    const firstInput = backdrop.querySelector('.form-input');
    if (firstInput) firstInput.focus();
  }, 300);
}

function getStatusLabel(status) {
  const map = { filled: 'Terisi', empty: 'Kosong', unverified: 'Belum Verif', reserved: 'Reservasi' };
  return map[status] || status;
}

// =====================================================
// SAVE PORT EDIT
// =====================================================
window.savePortEdit = async function(deviceId, portId, portNumber, tubeId, displayType) {
  const label  = document.getElementById('modal-label').value.trim();
  const detail = document.getElementById('modal-detail').value.trim();
  const status = document.getElementById('modal-status').value;
  const notes  = document.getElementById('modal-notes').value.trim();

  const updates = {
    connection_label:  label  || null,
    connection_detail: detail || null,
    status,
    notes: notes || null,
    updated_by: currentUser?.email || 'anonymous',
    last_verified_at: status === 'filled' ? new Date().toISOString() : undefined
  };

  const btn = document.querySelector('.modal .btn-primary');
  if (btn) { btn.classList.add('loading'); btn.disabled = true; }

  try {
    let savedPort;
    if (portId) {
      savedPort = await PortsAPI.update(portId, updates);
    } else {
      // Create new port connection
      savedPort = await PortsAPI.create({
        device_id: deviceId,
        tube_id: tubeId || null,
        port_number: portNumber,
        ...updates
      });
    }

    // Update DOM
    if (displayType === 'otb') {
      const { updatePortCell } = await import('./otb.js');
      updatePortCell(savedPort.id, savedPort);
    } else if (displayType === 'panel') {
      const { updatePanelPort } = await import('./panels.js');
      updatePanelPort(deviceId, portNumber, savedPort);
    }

    document.querySelector('.modal-backdrop')?.remove();
    vibrate([10, 5, 10]);
    showToast('✅ Port berhasil disimpan', 'success');

  } catch (err) {
    console.error('[App] Save port error:', err);
    // Queue for offline sync
    if (!isOnline()) {
      await OfflineQueue.add({ type: 'updatePort', portId, updates, updatedBy: currentUser?.email });
      showToast('📱 Tersimpan offline, akan disinkronkan saat online', 'warning');
      document.querySelector('.modal-backdrop')?.remove();
    } else {
      showToast(`❌ Gagal menyimpan: ${err.message}`, 'error');
    }
  } finally {
    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
  }
};

// =====================================================
// VERIFY PORT
// =====================================================
window.verifyPort = async function(portId, deviceId) {
  try {
    await PortsAPI.update(portId, {
      status: 'filled',
      last_verified_at: new Date().toISOString(),
      verified_by: currentUser?.email || 'anonymous',
      updated_by: currentUser?.email || 'anonymous'
    });
    showToast('✅ Port ditandai terverifikasi', 'success');
    document.querySelector('.modal-backdrop')?.remove();
    vibrate([10, 5, 10]);
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  }
};

// =====================================================
// NAVIGATION ROUTER
// =====================================================
const Router = {
  routes: {
    'login':    renderLoginRoute,
    'dashboard': renderDashboardRoute,
    'site':     renderSiteRoute,
    'device':   renderDeviceRoute,
    'search':   renderSearchRoute,
    'settings': renderSettingsRoute,
    'audit':    renderAuditRoute
  },

  navigate(page, params = {}) {
    // Update state
    AppState.currentPage = page;
    if (params.siteId)   AppState.currentSiteId = params.siteId;
    if (params.deviceId) AppState.currentDeviceId = params.deviceId;

    // Update hash
    const hash = params.siteId
      ? `#/${page}/${params.siteId}${params.deviceId ? '/' + params.deviceId : ''}`
      : `#/${page}`;
    history.pushState({ page, params }, '', hash);

    // Render page
    this.render(page, params);

    // Update bottom nav
    updateBottomNav(page);

    // Scroll to top
    document.querySelector('.app-main')?.scrollTo({ top: 0, behavior: 'smooth' });
  },

  render(page, params = {}) {
    const handler = this.routes[page];
    if (handler) handler(params);
    else renderDashboardRoute();
  },

  handleHashChange() {
    const hash = location.hash.slice(2); // remove '#/'
    const parts = hash.split('/');
    const page = parts[0] || 'dashboard';
    const params = {};
    if (parts[1]) params.siteId = parts[1];
    if (parts[2]) params.deviceId = parts[2];
    this.render(page, params);
    updateBottomNav(page);
  }
};

// =====================================================
// ROUTE HANDLERS
// =====================================================
let _cleanupLoginAnim = null;
async function renderLoginRoute() {
  if (_cleanupLoginAnim) { _cleanupLoginAnim(); _cleanupLoginAnim = null; }
  setPageContent(renderLoginPage());
  hideBottomNav();
  // Start canvas animation after DOM is ready
  requestAnimationFrame(() => {
    _cleanupLoginAnim = initLoginAnimation();
  });
}

async function renderDashboardRoute() {
  showBottomNav();
  setPageContent('<div class="page-content"><div class="skeleton" style="height:400px;border-radius:var(--radius-xl)"></div></div>');
  await renderDashboard(document.querySelector('.page-content'));
}

async function renderSiteRoute(params) {
  showBottomNav();
  const { renderSitePage: renderSite } = await import('./sites.js');
  setPageContent('<div class="page-content"><div class="skeleton" style="height:500px;border-radius:var(--radius-xl)"></div></div>');
  await renderSite(params.siteId, document.querySelector('.page-content'));
}

async function renderDeviceRoute(params) {
  showBottomNav();
  setPageContent('<div class="page-content"><div class="skeleton" style="height:500px;border-radius:var(--radius-xl)"></div></div>');
  await renderDevicePage(params.deviceId, params.siteId, document.querySelector('.page-content'));
}

async function renderSearchRoute() {
  showBottomNav();
  setPageContent('<div class="page-content"></div>');
  await renderSearchPage(document.querySelector('.page-content'));
}

async function renderSettingsRoute() {
  showBottomNav();
  const { renderSettingsPage: renderSettings } = await import('./settings.js');
  setPageContent('<div class="page-content"></div>');
  await renderSettings(document.querySelector('.page-content'));
}

async function renderAuditRoute() {
  showBottomNav();
  setPageContent('<div class="page-content"><div class="audit-page"></div></div>');
  const auditEl = document.querySelector('.audit-page');
  await renderAuditLog(auditEl);
}

// =====================================================
// RENDER AUDIT LOG
// =====================================================
async function renderAuditLog(container) {
  container.innerHTML = `
    <div class="section-header">
      <div class="section-title">📋 Riwayat Perubahan</div>
    </div>
    <div class="skeleton" style="height:400px;border-radius:var(--radius-xl)"></div>
  `;

  try {
    const logs = await AuditAPI.getRecent(100);
    const { timeAgo } = await import('./utils.js');

    const actionMap = {
      created:  { icon: '➕', label: 'Ditambahkan', class: 'created' },
      updated:  { icon: '✏️', label: 'Diubah',      class: 'updated' },
      deleted:  { icon: '🗑️', label: 'Dihapus',     class: 'deleted' },
      verified: { icon: '✅', label: 'Diverifikasi', class: 'verified' }
    };

    container.innerHTML = `
      <div class="section-header">
        <div class="section-title">📋 Riwayat Perubahan</div>
        <span class="badge badge-primary">${logs.length} entri</span>
      </div>
      <div class="card">
        <div class="card__body" style="padding:0">
          <div class="audit-list" style="padding:16px 20px">
            ${logs.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state__icon">📋</div>
                <div class="empty-state__title">Belum ada riwayat</div>
              </div>
            ` : logs.map(log => {
              const action = actionMap[log.action] || actionMap.updated;
              return `
                <div class="audit-item">
                  <div class="audit-item__icon ${action.class}">${action.icon}</div>
                  <div class="audit-item__content">
                    <div class="audit-item__title">
                      <strong>${action.label}</strong> Port ${log.port_number}
                      ${log.device_name ? `<span style="color:var(--color-text-muted)"> — ${log.device_name}</span>` : ''}
                    </div>
                    ${log.old_connection_label || log.new_connection_label ? `
                      <div class="audit-item__meta" style="margin-top:4px">
                        ${log.old_connection_label ? `<span style="text-decoration:line-through;color:var(--color-danger)">${log.old_connection_label}</span> → ` : ''}
                        ${log.new_connection_label ? `<span style="color:var(--color-filled)">${log.new_connection_label}</span>` : ''}
                      </div>
                    ` : ''}
                    <div class="audit-item__meta">
                      ${log.changed_by || 'Anonim'} • ${timeAgo(log.changed_at)}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML += `<div style="color:var(--color-danger);text-align:center;padding:24px">${err.message}</div>`;
  }
}

// =====================================================
// DOM HELPERS
// =====================================================
function setPageContent(html) {
  const main = document.querySelector('.app-main');
  if (main) main.innerHTML = html;
}

function showBottomNav() {
  const nav = document.querySelector('.app-bottom-nav');
  if (nav) nav.style.display = 'flex';
}

function hideBottomNav() {
  const nav = document.querySelector('.app-bottom-nav');
  if (nav) nav.style.display = 'none';
}

function updateBottomNav(page) {
  document.querySelectorAll('.bottom-nav__item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
}

// =====================================================
// HEADER RENDER
// =====================================================
function renderHeader(siteName = '') {
  return `
    <header class="app-header">
      <div class="app-header__logo">
        <div class="app-header__logo-icon" style="background: transparent; box-shadow: none; width: auto;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#logoGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 6px rgba(59,130,246,0.5));">
            <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>
            <path d="M4 12h16"/>
            <circle cx="8" cy="8" r="1" fill="#3b82f6" stroke="none"/>
            <circle cx="8" cy="16" r="1" fill="#8b5cf6" stroke="none"/>
            <line x1="12" y1="8" x2="16" y2="8"/>
            <line x1="12" y1="16" x2="16" y2="16"/>
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stop-color="#3b82f6"/>
                <stop offset="100%" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span>ServerData</span>
      </div>
      ${siteName ? `
        <div class="app-header__site-badge" onclick="App.navigate('dashboard')">
          <div class="app-header__site-dot"></div>
          <span class="app-header__site-name">${siteName}</span>
          ▾
        </div>
      ` : ''}
      <div class="app-header__actions">
        <button class="btn btn-ghost btn-icon" onclick="App.navigate('search')" 
                title="Cari Port" id="search-btn">🔍</button>
        <button class="btn btn-ghost btn-icon" onclick="toggleTheme()" 
                id="theme-btn" title="Ganti Tema">🌙</button>
      </div>
    </header>
  `;
}

// =====================================================
// THEME TOGGLE
// =====================================================
window.toggleTheme = function() {
  AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', AppState.theme);
  storage.set('theme', AppState.theme);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = AppState.theme === 'dark' ? '🌙' : '☀️';
  vibrate([5]);
};

// =====================================================
// ONLINE/OFFLINE INDICATOR
// =====================================================
function setupOnlineOfflineHandlers() {
  const indicator = document.getElementById('offline-indicator');

  window.addEventListener('offline', () => {
    if (indicator) indicator.classList.remove('hidden');
    showToast('📱 Koneksi terputus - mode offline', 'warning');
  });

  window.addEventListener('online', async () => {
    if (indicator) indicator.classList.add('hidden');
    showToast('✅ Koneksi kembali - menyinkronkan data...', 'success');
    // Sync offline queue
    try {
      const synced = await OfflineQueue.sync();
      if (synced > 0) showToast(`🔄 ${synced} perubahan berhasil disinkronkan`, 'success');
    } catch {}
  });

  // Initial check
  if (!navigator.onLine && indicator) indicator.classList.remove('hidden');
}

// =====================================================
// APP INITIALIZATION
// =====================================================
async function initApp() {
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', AppState.theme);

  // Init Supabase
  initSupabase();

  // Init offline queue
  await OfflineQueue.init().catch(console.error);

  // Render shell
  document.getElementById('app').innerHTML = `
    ${renderHeader()}
    <main class="app-main">
      <div class="page-content"></div>
    </main>
    <nav class="app-bottom-nav">
      <button class="bottom-nav__item" data-page="dashboard" onclick="App.navigate('dashboard')">
        <span class="bottom-nav__icon">🏠</span>
        <span class="bottom-nav__label">Dashboard</span>
      </button>
      <button class="bottom-nav__item" data-page="search" onclick="App.navigate('search')">
        <span class="bottom-nav__icon">🔍</span>
        <span class="bottom-nav__label">Cari</span>
      </button>
      <button class="bottom-nav__item" data-page="audit" onclick="App.navigate('audit')">
        <span class="bottom-nav__icon">📋</span>
        <span class="bottom-nav__label">Riwayat</span>
      </button>
      <button class="bottom-nav__item" data-page="settings" onclick="App.navigate('settings')">
        <span class="bottom-nav__icon">⚙️</span>
        <span class="bottom-nav__label">Pengaturan</span>
      </button>
    </nav>
    <div id="toast-container"></div>
    <div class="online-indicator hidden" id="offline-indicator">
      📵 Offline
    </div>
  `;

  // Setup event listeners
  setupOnlineOfflineHandlers();
  window.addEventListener('popstate', () => Router.handleHashChange());
  window.addEventListener('hashchange', () => Router.handleHashChange());

  // Check auth
  const isAuthed = await initAuth();

  // Remove loading screen
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => loadingScreen.remove(), 350);
  }

  // Navigate to initial page
  if (location.hash && location.hash !== '#/') {
    Router.handleHashChange();
  } else {
    if (isAuthed || storage.get('guestMode')) {
      Router.navigate('dashboard');
    } else {
      Router.navigate('login');
    }
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Failed (non-critical):', err));
  }
}

// =====================================================
// GLOBAL APP OBJECT
// =====================================================
window.App = {
  navigate: (page, params) => Router.navigate(page, params || {}),
  state: AppState,
  signOut: handleSignOut
};

// =====================================================
// START
// =====================================================
document.addEventListener('DOMContentLoaded', initApp);
