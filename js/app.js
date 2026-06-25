// =====================================================
// APP.JS - Main Application Router & Controller
// =====================================================
import { initSupabase, SitesAPI, DevicesAPI, PortsAPI, AuditAPI } from './supabase.js';
import { initAuth, currentUser, currentProfile, canEdit, isGuest, renderLoginPage, initLoginAnimation, handleSignOut } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderSitePage, renderAllSitesList } from './sites.js';
import { renderDevicePage } from './devices.js';
import { renderSettingsPage } from './settings.js';
import { OfflineQueue } from './supabase.js';
import { storage, isOnline, formatPort, vibrate, getStatusLabel, getDeviceIcon, FIBER_COLORS, getTubeColorIndex, getCoreColorIndex } from './utils.js';

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
// MOBILE BACK BUTTON
// =====================================================
window.handleMobileBack = function() {
  if (AppState.currentPage === 'device' && AppState.currentSiteId) {
    Router.navigate('site', {siteId: AppState.currentSiteId});
  } else if (AppState.currentPage === 'site') {
    Router.navigate('sites');
  } else {
    window.history.back();
  }
};

// =====================================================
// GO TO DEVICE HELPER
// =====================================================
window.goToDevice = async function(deviceId) {
  try {
    const { DevicesAPI } = await import('./supabase.js');
    const dev = await DevicesAPI.getById(deviceId);
    if (dev && dev.site_id) {
      document.querySelector('.modal-backdrop')?.remove();
      setTimeout(() => {
        // Use the global navigation helper set up by the router after init
        if (typeof window._navigateTo === 'function') {
          window._navigateTo('device', { siteId: dev.site_id, deviceId: dev.id, deviceName: dev.name });
        } else {
          // Fallback: change hash directly
          const slug = dev.name.replace(/\s+/g, '-');
          window.location.hash = `#/device/${dev.site_id}/${slug}`;
        }
      }, 100);
    }
  } catch (err) {
    console.error('Failed to jump to device', err);
  }
};

// =====================================================
// PORT MODAL - Edit port connection
// =====================================================
export async function showPortModal(deviceId, portId, portNumber, tubeId, displayType = 'otb', portLabel = null) {
  // Get port data and device data
  let portData = null;
  let deviceData = null;
  try {
    const { DevicesAPI } = await import('./supabase.js');
    deviceData = await DevicesAPI.getById(deviceId);
    
    const ports = await PortsAPI.getByDevice(deviceId);
    if (portId) {
      portData = ports.find(p => p.id === portId);
    }
    // For GTGO: if no portId matched but portLabel given (e.g. '1/3/1'),
    // calculate the sequential port_number and find the port that way
    if (!portData && portLabel && portLabel !== 'null') {
      // Try by port_label field first
      portData = ports.find(p => p.port_label === portLabel);
      
      // If still not found, calculate port_number from label format 1/SLOT/PORT
      if (!portData) {
        const parts = portLabel.split('/');
        if (parts.length === 3) {
          const START_SLOT = 3;
          const PORTS_PER_SLOT = 8;
          const slot = parseInt(parts[1]);
          const port = parseInt(parts[2]);
          const calcPortNumber = (slot - START_SLOT) * PORTS_PER_SLOT + port;
          portData = ports.find(p => p.port_number === calcPortNumber);
        }
      }
    }
    // After finding portData, use its real id for saving
    if (portData) portId = portData.id;
    
    // If this port's detail is empty but it's linked to another port,
    // fetch the target port's data to auto-fill connection_detail and notes
    if (portData?.connection_target_port && (!portData.connection_detail || !portData.notes)) {
      try {
        const targetPort = await PortsAPI.getById(portData.connection_target_port).catch(() => null);
        if (targetPort) {
          if (!portData.connection_detail && targetPort.connection_detail) {
            portData = { ...portData, connection_detail: targetPort.connection_detail };
          }
          if (!portData.notes && targetPort.notes) {
            portData = { ...portData, notes: targetPort.notes };
          }
        }
      } catch {}
    }
  } catch {}

  let isEditable = canEdit();
  const isOTBDevice = deviceData?.device_types?.name === 'OTB';
  if (isOTBDevice) {
    isEditable = false;
  }
  const label = portData?.connection_label || '';
  const detail = portData?.connection_detail || '';
  const status = portData?.status || 'empty';
  const notes  = portData?.notes || '';
  
  // Try to parse existing target port if any (we store it in connection_target_port for sync purposes if needed, but we can also just let the user re-link)
  const targetDevId = portData?.connection_target_device || '';
  const targetPortIdStr = portData?.connection_target_port || '';

  let colorInfoHTML = '';
  if (displayType === 'otb') {
    const tubeIdx = getTubeColorIndex(portNumber);
    const coreIdx = getCoreColorIndex(portNumber);
    const tCol = FIBER_COLORS[tubeIdx];
    const cCol = FIBER_COLORS[coreIdx];
    colorInfoHTML = `
      <div style="display:flex;gap:8px;margin-top:8px;justify-content:center;">
        <div style="font-size:0.6rem;padding:2px 6px;border-radius:4px;background:${tCol.hex};color:${tCol.text};font-weight:600;border:1px solid rgba(0,0,0,0.1)">
          Tube: ${tCol.name}
        </div>
        <div style="font-size:0.6rem;padding:2px 6px;border-radius:4px;background:${cCol.hex};color:${cCol.text};font-weight:600;border:1px solid rgba(0,0,0,0.1)">
          Core: ${cCol.name}
        </div>
      </div>
    `;
  }

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
            📍 ${portLabel ? `PON ${portLabel}` : `PORT ${String(portNumber).padStart(2, '0')}`}
          </div>
          <span class="badge badge-${status}">${getStatusLabel(status)}</span>
        </div>
        ${colorInfoHTML}
        ${(label || targetDevId || detail) ? `
          <div class="connection-path">
            <div class="connection-path__node">
              <div class="connection-path__node-label">Dari</div>
              <div class="connection-path__node-value" style="color:var(--color-primary-light)">
                ${portLabel ? `PON ${portLabel}` : `Port ${portNumber}`}
              </div>
            </div>
            <div class="connection-path__line">→</div>
            <div class="connection-path__node">
              <div class="connection-path__node-label">Ke</div>
              <div class="connection-path__node-value" style="color:var(--color-filled);word-break:break-word;">
                ${label || detail || 'Perangkat Terhubung'}
              </div>
              ${targetDevId ? `
                <button type="button" onclick="goToDevice('${targetDevId}')"
                        style="margin-top:8px;background:rgba(59,130,246,0.15);color:var(--color-primary);border:1px solid rgba(59,130,246,0.3);padding:4px 10px;border-radius:6px;font-size:0.65rem;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:4px">
                  Buka Perangkat ↗
                </button>
              ` : ''}
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
            <label class="form-label">Keterangan Tujuan Port</label>
            <input class="form-input" type="text" id="modal-detail"
                   value="${detail}" placeholder="cth: Desa Bangsa"
                   autocomplete="off"
                   oninput="if(this.value.trim() !== '') document.getElementById('modal-status').value = 'filled';">
          </div>

          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="modal-status">
              <option value="filled"     ${status === 'filled'     ? 'selected' : ''}>🟢 Terisi</option>
              <option value="empty"      ${status === 'empty'      ? 'selected' : ''}>⚪ Kosong</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Keterangan Power / Fisik</label>
            <textarea class="form-textarea" id="modal-notes" placeholder="cth: ODC 16 Power Tube Biru Core Biru">${notes}</textarea>
          </div>

          <div class="modal__actions">
            <button class="btn btn-secondary" style="flex:1" onclick="document.querySelector('.modal-backdrop').remove()">
              Batal
            </button>
            <button class="btn btn-primary" style="flex:2"
                    onclick="savePortEdit('${deviceId}', '${portId || ''}', ${portNumber}, '${tubeId || ''}', '${displayType}', '${portLabel || ''}')">
              💾 Simpan
            </button>
          </div>

          ${portId ? `
            <div style="margin-top:16px;text-align:center;display:flex;flex-direction:column;gap:8px;">
              <button class="btn btn-ghost btn-sm" style="color:var(--color-text-muted)"
                      onclick="verifyPort('${portId}', '${deviceId}')">
                ✅ Tandai Sudah Diverifikasi
              </button>
              ${portData?.connection_label || portData?.status === 'filled' ? `
                <button class="btn btn-ghost btn-sm" style="color:#f87171;border:1px solid rgba(248,113,113,0.3)"
                        onclick="clearPortData('${portId}', '${deviceId}')">
                  🗑️ Hapus Isi Port
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="port-detail-body">
          <div style="text-align:center;padding:24px;color:var(--color-text-muted); line-height: 1.5;">
            ${isOTBDevice 
              ? '👀 <b>Read-Only</b><br><span style="font-size:0.85rem">Port OTB hanya dapat diedit melalui perangkat sumber (OLT, Cisco, Huawei, dll) yang terhubung.</span>' 
              : (isGuest() ? '👀 Mode tamu — tidak bisa mengedit' : 'Anda tidak memiliki izin edit')}
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
      option.dataset.portLabel = p.port_label || '';
      option.dataset.detail = p.connection_detail || '';
      option.dataset.notes = p.notes || '';
      // Show if it's filled
      const statusIcon = p.status === 'filled' ? '🔴' : '🟢';
      const labelStr = p.port_label ? p.port_label : `Port ${p.port_number}`;
      const connStr = p.connection_label ? ` (${p.connection_label})` : ' (KOSONG)';
      option.textContent = `${statusIcon} ${labelStr}${connStr}`;
      if (p.id === targetPortId) option.selected = true;
      select.appendChild(option);
    });
    select.disabled = false;
    
    // If there's a pre-selected port, auto-fill the detail from it
    if (targetPortId && select.value) {
      const selectedOpt = select.options[select.selectedIndex];
      if (selectedOpt) {
        const detailInput = document.getElementById('modal-detail');
        // Only auto-fill if the field is currently empty
        if (detailInput && !detailInput.value.trim() && selectedOpt.dataset.detail) {
          detailInput.value = selectedOpt.dataset.detail;
        }
        const notesInput = document.getElementById('modal-notes');
        if (notesInput && !notesInput.value.trim() && selectedOpt.dataset.notes) {
          notesInput.value = selectedOpt.dataset.notes;
        }
      }
    }
    
    // Auto-fill label when a port is selected
    select.onchange = (e) => {
      const devSelect = document.getElementById('modal-target-device');
      const devName = devSelect.options[devSelect.selectedIndex]?.text;
      const portNum = e.target.options[e.target.selectedIndex]?.dataset.port;
      const portDetail = e.target.options[e.target.selectedIndex]?.dataset.detail || '';
      const portNotes = e.target.options[e.target.selectedIndex]?.dataset.notes || '';
      
      if (devName && portNum) {
        const statusSelect = document.getElementById('modal-status');
        if (statusSelect) statusSelect.value = 'filled';
        
        // Auto-fill Keterangan Tujuan Port from the selected port's connection_detail
        const detailInput = document.getElementById('modal-detail');
        if (detailInput && !detailInput.value.trim() && portDetail) {
          detailInput.value = portDetail;
        }
        const notesInput = document.getElementById('modal-notes');
        if (notesInput && !notesInput.value.trim() && portNotes) {
          notesInput.value = portNotes;
        }
      }
    };
  } catch (err) {
    console.error('Failed to load target ports', err);
  }
}


// =====================================================
// SAVE PORT EDIT
// =====================================================
window.savePortEdit = async function(deviceId, portId, portNumber, tubeId, displayType, portLabel = '') {
  const detail = document.getElementById('modal-detail').value.trim();
  const status = document.getElementById('modal-status').value;
  const notes  = document.getElementById('modal-notes').value.trim();
  
  const targetDevId = document.getElementById('modal-target-device')?.value;
  const targetPortId = document.getElementById('modal-target-port')?.value;

  const targetDevSelect = document.getElementById('modal-target-device');
  const targetPortSelect = document.getElementById('modal-target-port');
  
  let targetLabelToSave = null;
  if (targetDevSelect && targetDevSelect.selectedIndex > 0 && targetPortSelect && targetPortSelect.selectedIndex > 0) {
    const targetDevName = targetDevSelect.options[targetDevSelect.selectedIndex].text;
    const pOption = targetPortSelect.options[targetPortSelect.selectedIndex];
    const tPortLabel = pOption.dataset.portLabel || `Port ${pOption.dataset.port}`;
    targetLabelToSave = `${targetDevName} ${tPortLabel}`;
  }

  const updates = {
    connection_label:  targetLabelToSave || null,
    connection_detail: detail || null,
    connection_target_device: targetDevId || null,
    connection_target_port: targetPortId || null,
    status,
    notes: notes || null,
    // Save port_label for GTGO slots (e.g. 1/3/1) so we can look them up later
    ...(portLabel && portLabel !== 'null' ? { port_label: portLabel } : {}),
    updated_by: currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'anonymous',
    last_verified_at: status === 'filled' ? new Date().toISOString() : undefined
  };

  const btn = document.querySelector('.modal .btn-primary');
  if (btn) { btn.classList.add('loading'); btn.disabled = true; }

  try {
    const { DevicesAPI, PortsAPI } = await import('./supabase.js');
    const currentDevice = await DevicesAPI.getById(deviceId);
    // For GTGO/OLT, use the slot/port label (e.g. 1/3/1); otherwise use Port N
    const sourceLabel = portLabel && portLabel !== 'null' 
      ? `${currentDevice.name} ${portLabel}` 
      : `${currentDevice.name} Port ${portNumber}`;

    let savedPort;
    let oldTargetPortId = null;
    
    if (portId) {
      const currentPort = await PortsAPI.getById(portId);
      oldTargetPortId = currentPort.connection_target_port;
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
    
    // Clear the old target port if it was changed or removed
    if (oldTargetPortId && oldTargetPortId !== targetPortId) {
      await PortsAPI.update(oldTargetPortId, {
        connection_label: null,
        connection_detail: null,
        connection_target_device: null,
        connection_target_port: null,
        status: 'empty',
        notes: null,
        updated_by: currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'anonymous'
      });
    }
    
    // Handle Two-way sync
    if (targetPortId && targetDevId) {
      await PortsAPI.update(targetPortId, {
        connection_label: sourceLabel,
        connection_detail: detail || null,
        connection_target_device: deviceId,
        connection_target_port: savedPort.id,
        status: status === 'empty' ? 'empty' : 'filled', // Keep synced status
        notes: notes || null,
        updated_by: currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'anonymous'
      });
    }

    document.querySelector('.modal-backdrop')?.remove();
    vibrate([10, 5, 10]);
    showToast('✅ Port berhasil disimpan, menyegarkan data...', 'success');
    
    // Auto refresh to ensure all data and stats are synced
    setTimeout(() => {
      window.location.reload();
    }, 800);

  } catch (err) {
    console.error('[App] Save port error:', err);
    // Queue for offline sync
    if (!isOnline()) {
      await OfflineQueue.add({ type: 'updatePort', portId, updates, updatedBy: currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'anonymous' });
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
// CLEAR PORT DATA (hapus isi port + port yang tertaut)
// =====================================================
window.clearPortData = async function(portId, deviceId) {
  const confirmed = confirm('Apakah yakin ingin menghapus semua data port ini?\nData di perangkat yang tertaut juga akan otomatis terhapus.');
  if (!confirmed) return;

  const CLEAR_DATA = {
    connection_label: null,
    connection_detail: null,
    connection_target_device: null,
    connection_target_port: null,
    status: 'empty',
    notes: null,
    updated_by: currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'anonymous'
  };

  try {
    // Get current port to find old linked target
    const currentPort = await PortsAPI.getById(portId);
    const oldTargetPortId = currentPort?.connection_target_port;

    // Clear current port
    await PortsAPI.update(portId, CLEAR_DATA);

    // Clear linked target port if it exists
    if (oldTargetPortId) {
      await PortsAPI.update(oldTargetPortId, CLEAR_DATA);
    }

    document.querySelector('.modal-backdrop')?.remove();
    showToast('🗑️ Isi port berhasil dihapus, menyegarkan data...', 'success');
    vibrate([10, 5, 10]);

    // Auto refresh to sync stats and grid
    setTimeout(() => {
      window.location.reload();
    }, 800);
  } catch (err) {
    showToast(`❌ Gagal menghapus: ${err.message}`, 'error');
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
      verified_by: currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'anonymous',
      updated_by: currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'anonymous'
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
    'sites':    renderSitesRoute,
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
    updateBottomNav(page, params);
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

async function renderSitesRoute() {
  document.getElementById('app')?.classList.remove('is-login');
  showBottomNav();
  setPageContent('<div class="page-content"><div class="loading-spinner" style="margin:40px auto;display:block"></div></div>');
  await renderAllSitesList(document.querySelector('.page-content'));
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

function updateBottomNav(page, params = {}) {
  document.querySelectorAll('.bottom-nav__item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  // Also update sidebar
  document.querySelectorAll('.app-sidebar__item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  
  const backBtn = document.getElementById('mobile-back-btn');
  if (backBtn) {
    if (page === 'site' || page === 'device') {
      backBtn.classList.add('is-active');
    } else {
      backBtn.classList.remove('is-active');
    }
  }

  // Update dynamic sidebar items
  document.querySelectorAll('.sidebar-dynamic').forEach(item => {
    let isActive = false;
    if (page === 'site' && item.dataset.site && !item.dataset.device) {
      isActive = (item.dataset.site === (params.siteId || ''));
    } else if (page === 'device' && item.dataset.device) {
      isActive = (item.dataset.device === (params.deviceId || ''));
    }
    item.classList.toggle('active', isActive);
  });
}

// =====================================================
// HEADER RENDER
// =====================================================
function renderHeader(siteName = '') {
  return `
    <header class="app-header">
      <div style="display:flex;align-items:center;">
        <button id="mobile-back-btn" class="btn btn-ghost btn-icon" onclick="window.handleMobileBack()" title="Kembali" style="display:none;margin-right:8px;padding:4px;width:32px;height:32px">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
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
          <img src="/logos/logo-apk.jpg" style="width: 24px; height: 24px; object-fit: cover; border-radius: 6px;">
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

      <button class="bottom-nav__item" data-page="sites" onclick="App.navigate('sites')">
        <span class="bottom-nav__icon">📍</span>
        <span class="bottom-nav__label">Daftar Site</span>
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
  
  // ====== TEMP MIGRATION: Rename and Update X86 BMS-01 Layout ======
  setTimeout(async () => {
    try {
      const client = (await import('./supabase.js')).getClient();
      
      // Look for the device either by its old name or new name
      const { data: d } = await client.from('devices').select('id, name, total_ports').in('name', ['X86 Server Speedtest', 'X86 BMS-01']);
      
      if (d && d.length > 0) {
        const devId = d[0].id;
        
        // 1. Rename to X86 BMS-01 and update layout
        const newDesc = JSON.stringify([
          ...Array.from({length:7},(_,i)=>({ label: `Slot ${i+1}`, ports: [i*2+1, i*2+2] })), 
          { label: "Ethernet", ports: [15,16,17,18] }
        ]);
        
        await client.from('devices').update({ 
          name: 'X86 BMS-01', 
          total_ports: 18, 
          description: newDesc 
        }).eq('id', devId);
        
        // 2. Add missing ports 15-18
        const { data: existingPorts } = await client.from('port_connections')
          .select('port_number').eq('device_id', devId).in('port_number', [15,16,17,18]);
        const existingNums = new Set(existingPorts ? existingPorts.map(p => p.port_number) : []);
        
        const portsToInsert = [];
        for (let i = 15; i <= 18; i++) {
          if (!existingNums.has(i)) {
            portsToInsert.push({
              device_id: devId,
              port_number: i,
              status: 'empty',
              port_label: `ETH ${i-14}`,
              updated_at: new Date().toISOString()
            });
          }
        }
        
        if (portsToInsert.length > 0) {
          await client.from('port_connections').insert(portsToInsert);
          console.log('[Migration] Added ethernet ports 15-18');
        }
        
        // 3. Force refresh if they are on the old device page
        if (location.hash.includes('Speedtest')) {
          location.hash = location.hash.replace('Speedtest', 'BMS-01');
          window.location.reload();
        } else if (location.hash.includes('BMS-01')) {
          // If already on BMS-01 but missing the new ports, reload
          if (portsToInsert.length > 0) window.location.reload();
        }
      }
    } catch (e) {
      console.error('Migration error:', e);
    }
  }, 2000);
  // ==========================================

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
    window.renderSidebarSites();
  }
}

// =====================================================
// SIDEBAR DYNAMIC LIST (Accordion)
// =====================================================
window.renderSidebarSites = async function renderSidebarSites() {
  const container = document.getElementById('sidebar-sites-content');
  if (!container) return;

  try {
    const [sites, devices] = await Promise.all([
      SitesAPI.getAll(),
      DevicesAPI.getAll()
    ]);

    if (!sites || sites.length === 0) {
      container.innerHTML = '<div style="padding:8px 0">Belum ada data</div>';
      return;
    }

    let html = '';
    sites.forEach((site, idx) => {
      const siteDevices = devices.filter(d => d.site_id === site.id);
      const cid = `sdb-${idx}`;
      let devHtml = '';
      if (siteDevices.length === 0) {
        devHtml = `<div style="font-size:0.8rem;color:var(--color-text-muted);padding:4px 6px">Tidak ada perangkat</div>`;
      } else {
        siteDevices.forEach(device => {
          const type = device.device_types?.name || 'OTHER';
          const dbIcon = device.device_types?.icon;
          
          let logoHtml;
          if (dbIcon && dbIcon.startsWith('<')) {
            logoHtml = `<span style="width:16px;height:16px;display:inline-block">${dbIcon}</span>`;
          } else if (dbIcon && dbIcon.startsWith('/')) {
            logoHtml = `<img src="${dbIcon}" style="width:16px;height:16px;object-fit:contain;border-radius:3px;flex-shrink:0" onerror="this.style.display='none'">`;
          } else {
            const fallbackSrc = { OTB: '/logos/OTB.webp', CISCO: '/logos/CISCO.webp', HUAWEI: '/logos/Huawei.webp', GTGO: '/logos/GTGO-OLT.jpeg' }[type];
            if (fallbackSrc) {
              logoHtml = `<img src="${fallbackSrc}" style="width:16px;height:16px;object-fit:contain;border-radius:3px;flex-shrink:0" onerror="this.style.display='none'">`;
            } else {
              logoHtml = `<svg style="width:16px;height:16px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9H21a2 2 0 0 1 0 4z"/></svg>`;
            }
          }
          devHtml += `<div class="sidebar-dynamic" data-device="${device.id}" style="font-size:0.82rem;color:var(--color-text);cursor:pointer;padding:4px 6px;border-radius:4px;display:flex;align-items:center;gap:6px;transition:background 0.15s" onmouseover="if(!this.classList.contains('active'))this.style.background='var(--color-bg-overlay)'" onmouseout="if(!this.classList.contains('active'))this.style.background='transparent'" onclick="App.navigate('device', {siteId:'${site.code || site.id}', deviceId:'${device.id}', deviceName:'${device.name}'})"><span style="display:flex;align-items:center;flex-shrink:0">${logoHtml}</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${device.name}">${device.name}</span></div>`;
        });
      }
      html += `<div style="margin-top:4px"><div class="sidebar-dynamic" data-site="${site.code || site.id}" style="font-weight:600;cursor:pointer;padding:5px 8px;border-radius:6px;display:flex;align-items:center;gap:5px;transition:background 0.15s" onmouseover="if(!this.classList.contains('active'))this.style.background='var(--color-bg-overlay)'" onmouseout="if(!this.classList.contains('active'))this.style.background='transparent'" onclick="App.navigate('site', {siteId:'${site.code || site.id}'}); sidebarToggleSite('${cid}',event,true)"><span onclick="sidebarToggleSite('${cid}',event);event.stopPropagation()">📍</span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${site.name}</span><span id="${cid}-arr" style="font-size:0.65rem;opacity:0.6;transition:transform 0.2s" onclick="sidebarToggleSite('${cid}',event);event.stopPropagation()">▶</span></div><div id="${cid}" style="display:none;flex-direction:column;padding-left:12px;gap:2px;margin-top:2px">${devHtml}</div></div>`;
    });

    container.innerHTML = html;
  } catch (err) {
    console.error('Failed to load sidebar sites', err);
    container.innerHTML = '<span style="color:var(--color-danger)">Gagal memuat data</span>';
  }
}

window.sidebarToggleSite = function(cid, e, onlyOpen = false) {
  e && e.stopPropagation && e.stopPropagation();
  const p = document.getElementById(cid);
  const a = document.getElementById(cid + '-arr');
  if (!p) return;
  const isOpen = p.style.display === 'flex';
  if (onlyOpen && isOpen) return; // do not close if onlyOpen is true
  p.style.display = isOpen ? 'none' : 'flex';
  p.style.flexDirection = 'column';
  if (a) a.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
};

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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
