// =====================================================
// APP.JS - Main Application Router & Controller
// =====================================================
import { initSupabase, SitesAPI, DevicesAPI, PortsAPI, AuditAPI } from './supabase.js';
import { initAuth, currentUser, currentProfile, canEdit, isGuest, renderLoginPage, initLoginAnimation, handleSignOut } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderSitePage } from './sites.js';
import { renderDevicePage } from './devices.js';
import { renderSettingsPage } from './settings.js';
import { OfflineQueue } from './supabase.js';
import { storage, vibrate, isOnline, getDeviceIcon } from './utils.js';

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
  // Get port data and device data
  let portData = null;
  let deviceData = null;
  try {
    const { DevicesAPI } = await import('./supabase.js');
    deviceData = await DevicesAPI.getById(deviceId);
    
    if (portId) {
      const ports = await PortsAPI.getByDevice(deviceId);
      portData = ports.find(p => p.id === portId);
    }
  } catch {}

  const isEditable = canEdit();
  const label = portData?.connection_label || '';
  const detail = portData?.connection_detail || '';
  const status = portData?.status || 'empty';
  const notes  = portData?.notes || '';
  
  // Try to parse existing target port if any (we store it in connection_target_port for sync purposes if needed, but we can also just let the user re-link)
  const targetDevId = portData?.connection_target_device || '';
  const targetPortIdStr = portData?.connection_target_port || '';

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
            <label class="form-label">Tautkan ke Perangkat & Port</label>
            <div style="display:flex;gap:8px;">
              <select class="form-select" id="modal-target-device" onchange="loadTargetPorts('${deviceData?.site_id}', this.value, '${targetPortIdStr}')" style="flex:1">
                <option value="">-- Pilih Perangkat Tujuan --</option>
              </select>
              <select class="form-select" id="modal-target-port" style="flex:1" disabled>
                <option value="">-- Pilih Port --</option>
              </select>
            </div>
            <div class="form-hint" style="color:var(--color-primary-light)">Memilih port tujuan akan mengupdate kedua port agar sinkron (dua arah).</div>
          </div>

          <div class="form-group">
            <label class="form-label">Label Manual (Opsional)</label>
            <input class="form-input" type="text" id="modal-label"
                   value="${label}" placeholder="Kosongkan jika memilih port tujuan di atas"
                   autocomplete="off">
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
  
  if (isEditable && deviceData) {
    loadTargetDevices(deviceData.site_id, deviceId, targetDevId, targetPortIdStr);
  }
}

// Helper to load devices for sync
async function loadTargetDevices(siteId, currentDeviceId, targetDevId, targetPortId) {
  try {
    const { DevicesAPI } = await import('./supabase.js');
    const devices = await DevicesAPI.getBySite(siteId);
    const select = document.getElementById('modal-target-device');
    if (!select) return;
    
    devices.forEach(d => {
      if (d.id === currentDeviceId) return; // Don't link to self
      const option = document.createElement('option');
      option.value = d.id;
      option.textContent = d.name;
      if (d.id === targetDevId) option.selected = true;
      select.appendChild(option);
    });
    
    if (targetDevId) {
      await loadTargetPorts(siteId, targetDevId, targetPortId);
    }
  } catch (err) {
    console.error('Failed to load target devices', err);
  }
}

window.loadTargetPorts = async function(siteId, targetDevId, targetPortId = '') {
  const select = document.getElementById('modal-target-port');
  if (!select) return;
  select.innerHTML = '<option value="">-- Pilih Port --</option>';
  select.disabled = true;
  
  if (!targetDevId) return;
  
  try {
    const { PortsAPI } = await import('./supabase.js');
    const ports = await PortsAPI.getByDevice(targetDevId);
    ports.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      // Also store port number as data attribute to build the label later
      option.dataset.port = p.port_number;
      // Show if it's filled
      const statusIcon = p.status === 'filled' ? '🔴' : '🟢';
      const labelStr = p.port_label ? p.port_label : `Port ${p.port_number}`;
      const connStr = p.connection_label ? ` (${p.connection_label})` : ' (KOSONG)';
      option.textContent = `${statusIcon} ${labelStr}${connStr}`;
      if (p.id === targetPortId) option.selected = true;
      select.appendChild(option);
    });
    select.disabled = false;
    
    // Auto-fill label when a port is selected
    select.onchange = (e) => {
      const devSelect = document.getElementById('modal-target-device');
      const devName = devSelect.options[devSelect.selectedIndex]?.text;
      const portNum = e.target.options[e.target.selectedIndex]?.dataset.port;
      
      const labelInput = document.getElementById('modal-label');
      const statusSelect = document.getElementById('modal-status');
      
      if (devName && portNum) {
        labelInput.value = `${devName} Port ${portNum}`;
        statusSelect.value = 'filled';
      }
    };
  } catch (err) {
    console.error('Failed to load target ports', err);
  }
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
  
  const targetDevId = document.getElementById('modal-target-device')?.value;
  const targetPortId = document.getElementById('modal-target-port')?.value;

  const updates = {
    connection_label:  label  || null,
    connection_detail: detail || null,
    connection_target_device: targetDevId || null,
    connection_target_port: targetPortId || null,
    status,
    notes: notes || null,
    updated_by: currentUser?.email || 'anonymous',
    last_verified_at: status === 'filled' ? new Date().toISOString() : undefined
  };

  const btn = document.querySelector('.modal .btn-primary');
  if (btn) { btn.classList.add('loading'); btn.disabled = true; }

  try {
    const { DevicesAPI } = await import('./supabase.js');
    const currentDevice = await DevicesAPI.getById(deviceId);
    const sourceLabel = `${currentDevice.name} Port ${portNumber}`;

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
    
    // Handle Two-way sync
    if (targetPortId && targetDevId) {
      await PortsAPI.update(targetPortId, {
        connection_label: sourceLabel,
        connection_target_device: deviceId,
        connection_target_port: savedPort.id,
        status: status === 'empty' ? 'empty' : 'filled', // Keep synced status
        updated_by: currentUser?.email || 'anonymous'
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
// URL SLUG HELPERS
// =====================================================
// Convert "GTGO OLT" -> "GTGO-OLT", "OTB 1 96" -> "OTB-1-96"
function slugifyDeviceName(name) {
  return name
    .trim()
    .replace(/\s+/g, '-');  // replace spaces with hyphens (no encoding needed)
}

// Convert "GTGO-OLT" -> "GTGO OLT"
function deslugifyDeviceName(slug) {
  return decodeURIComponent(slug).replace(/-/g, ' ');
}

// =====================================================
// NAVIGATION ROUTER
// =====================================================
const Router = {
  routes: {
    'login':    renderLoginRoute,
    'dashboard': renderDashboardRoute,
    'site':     renderSiteRoute,
    'device':   renderDeviceRoute,
    'settings': renderSettingsRoute,
    'audit':    renderAuditRoute,
    'list-data': renderListDataRoute
  },

  navigate(page, params = {}) {
    // Update state
    AppState.currentPage = page;
    if (params.siteId)   AppState.currentSiteId = params.siteId;
    if (params.deviceId) AppState.currentDeviceId = params.deviceId;

    // Update hash
    let hash = `#/${page}`;
    if (page === 'site' && params.siteId) {
      hash += `/${params.siteId}`;
    } else if (page === 'device') {
      if (params.siteId && params.deviceName) {
        hash += `/${params.siteId}/${slugifyDeviceName(params.deviceName)}`;
      } else if (params.deviceId) {
        hash += `/${params.deviceId}`;
      }
      if (params.portId) {
        hash += `?port=${params.portId}`;
      }
    }
    
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
    const rawHash = window.location.hash.slice(1) || '/dashboard';
    const [pathPart, queryPart] = rawHash.split('?');
    const parts = pathPart.split('/').filter(Boolean);
    const page = parts[0];

    const params = {};
    if (queryPart && queryPart.startsWith('port=')) {
      params.portId = queryPart.split('=')[1];
    }

    if (page === 'site') {
      params.siteId = parts[1];
    } else if (page === 'device') {
      if (parts.length >= 3) {
        params.siteId = parts[1];
        params.deviceName = deslugifyDeviceName(parts[2]);
      } else {
        params.deviceId = parts[1];
      }
    }
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
  // Hide sidebar/header for login screen
  document.getElementById('app')?.classList.add('is-login');
  setPageContent(renderLoginPage());
  hideBottomNav();
  requestAnimationFrame(() => {
    _cleanupLoginAnim = initLoginAnimation();
  });
}

async function renderDashboardRoute() {
  document.getElementById('app')?.classList.remove('is-login');
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
  const { renderDevicePage } = await import('./devices.js');
  await renderDevicePage(params.deviceId, params.siteId, document.querySelector('.page-content'), params.deviceName, params.portId);
}

// Search route removed

async function renderSettingsRoute() {
  showBottomNav();
  const { renderSettingsPage: renderSettings } = await import('./settings.js');
  setPageContent('<div class="page-content"></div>');
  await renderSettings(document.querySelector('.page-content'));
}

async function renderListDataRoute() {
  showBottomNav();
  setPageContent('<div class="page-content"></div>');
  const { renderListDataPage } = await import('./list-data.js');
  await renderListDataPage(document.querySelector('.page-content'));
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
  // Also update sidebar
  document.querySelectorAll('.app-sidebar__item[data-page]').forEach(item => {
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
    <aside class="app-sidebar" id="app-sidebar">
      <div class="app-sidebar__brand">
        <div class="app-sidebar__brand-logo">
          <img src="/logos/logo apk.jpg" style="width: 24px; height: 24px; object-fit: cover; border-radius: 6px;">
        </div>
        <div>
          <div class="app-sidebar__brand-name">ServerData</div>
          <div class="app-sidebar__brand-sub">Network Manager</div>
        </div>
      </div>
      <div class="app-sidebar__section">
        <div class="app-sidebar__section-label">Menu Utama</div>
        <button class="app-sidebar__item active" data-page="dashboard" onclick="App.navigate('dashboard')">
          <span class="app-sidebar__item-icon">🏠</span> Dashboard
        </button>
        <button class="app-sidebar__item" data-page="list-data" onclick="App.navigate('list-data')">
          <span class="app-sidebar__item-icon">📋</span> Data Port Perangkat
        </button>

        <button class="app-sidebar__item" data-page="audit" onclick="App.navigate('audit')">
          <span class="app-sidebar__item-icon">📋</span> Riwayat
        </button>
      </div>
      
      <div class="app-sidebar__section" id="sidebar-sites-section" style="margin-top:var(--space-2)">
        <div class="app-sidebar__section-label">Lokasi & Perangkat</div>
        <div id="sidebar-sites-content" style="font-size:0.85rem;color:var(--color-text);padding-left:16px;">Memuat...</div>
      </div>
      
      <div class="app-sidebar__spacer"></div>
      <div class="app-sidebar__footer">
        <button class="app-sidebar__item" data-page="settings" onclick="App.navigate('settings')">
          <span class="app-sidebar__item-icon">⚙️</span> Pengaturan
        </button>
        <button class="app-sidebar__item" onclick="App.signOut()" style="color:var(--color-danger)">
          <span class="app-sidebar__item-icon">🚪</span> Keluar
        </button>
      </div>
    </aside>
    ${renderHeader()}
    <main class="app-main">
      <div class="page-content"></div>
    </main>
    <nav class="app-bottom-nav">
      <button class="bottom-nav__item" data-page="dashboard" onclick="App.navigate('dashboard')">
        <span class="bottom-nav__icon">🏠</span>
        <span class="bottom-nav__label">Dashboard</span>
      </button>
      <button class="bottom-nav__item" data-page="list-data" onclick="App.navigate('list-data')">
        <span class="bottom-nav__icon">📋</span>
        <span class="bottom-nav__label">Data Port</span>
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
  
  // Render sidebar sites
  if (isAuthed || storage.get('guestMode')) {
    renderSidebarSites();
  }
}

// =====================================================
// SIDEBAR DYNAMIC LIST
// =====================================================
async function renderSidebarSites() {
  const container = document.getElementById('sidebar-sites-content');
  if (!container) return;
  
  try {
    const { SitesAPI, DevicesAPI } = await import('./supabase.js');
    const [sites, devices] = await Promise.all([
      SitesAPI.getAll(),
      DevicesAPI.getAll()
    ]);
    
    if (!sites || sites.length === 0) {
      container.innerHTML = '<div style="padding:8px 0">Belum ada data</div>';
      return;
    }

    let html = '';
    sites.forEach(site => {
      const siteDevices = devices.filter(d => d.site_id === site.id);
      
      html += `
        <div class="sidebar-site-group" style="margin-top:12px">
          <div class="sidebar-site-header" style="font-weight:600;color:var(--color-text);cursor:pointer;padding:6px 0;display:flex;align-items:center;gap:6px" onclick="App.navigate('site', {siteId:'${site.code || site.id}'})">
            <span>📍</span> <span style="flex:1">${site.name}</span>
          </div>
          <div class="sidebar-site-devices" style="padding-left:12px;display:flex;flex-direction:column;gap:4px;margin-top:4px">
      `;
      
      if (siteDevices.length === 0) {
        html += `<div style="font-size:0.8rem;color:var(--color-text-muted);opacity:0.7">Tidak ada perangkat</div>`;
      } else {
        siteDevices.forEach(device => {
          const type = device.device_types?.name || 'OTHER';
          html += `
            <div class="sidebar-device-item" style="font-size:0.85rem;color:var(--color-text);opacity:0.9;cursor:pointer;padding:4px 6px;border-radius:4px;transition:all 0.2s;display:flex;align-items:center;gap:6px" 
                 onmouseover="this.style.background='var(--color-bg-overlay)';this.style.opacity='1'" 
                 onmouseout="this.style.background='transparent';this.style.opacity='0.9'"
                 onclick="App.navigate('device', {siteId:'${site.code || site.id}', deviceId:'${device.id}', deviceName:'${device.name}'})">
              <div style="width:16px;height:16px;flex-shrink:0">${getDeviceIcon(type, device.device_types?.icon)}</div> <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px" title="${device.name}">${device.name}</span>
            </div>
          `;
        });
      }
      
      html += `
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  } catch (err) {
    console.error('Failed to load sidebar sites', err);
    container.innerHTML = '<span style="color:var(--color-danger)">Gagal memuat data</span>';
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
