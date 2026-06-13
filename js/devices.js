// =====================================================
// DEVICES.JS - Device Detail Page
// =====================================================
import { DevicesAPI, PortsAPI, AuditAPI } from './supabase.js';
import { getDeviceIcon, getDeviceBgColor, getDeviceColor, calcPercent, getStatusLabel, timeAgo, exportCSV } from './utils.js';
import { canEdit, isAdmin } from './auth.js';
import { showToast, showPortModal } from './app.js';
import { renderOTBView, exportOTBData } from './otb.js';
import { renderPanelView, renderGTGOView } from './panels.js';

export async function renderDevicePage(deviceId, siteId, container, deviceName, autoOpenPortId = null) {
  try {
    let device;
    if (!deviceId && siteId && deviceName) {
      device = await DevicesAPI.getBySiteAndName(siteId, deviceName);
      if (!device) throw new Error('Perangkat tidak ditemukan');
      deviceId = device.id;
    } else if (deviceId) {
      device = await DevicesAPI.getById(deviceId);
    } else {
      window.App.navigate('dashboard');
      return;
    }

    const typeName = device.device_types?.name || 'OTHER';
    const icon    = getDeviceIcon(typeName, device.device_types?.icon);
    const color   = getDeviceColor(typeName);
    const bgColor = getDeviceBgColor(typeName);

    // Get stats
    let stats;
    if (typeName === 'GTGO' || typeName === 'OLT') {
      const allPorts = await PortsAPI.getByDevice(deviceId);
      const portMap = {};
      allPorts.forEach(p => {
        if (p.port_label) portMap[p.port_label] = p;
        portMap[String(p.port_number)] = p;
      });
      let filled = 0, unverified = 0, reserved = 0;
      for (let p = 1; p <= 8; p++) {
        for (let s = 3; s < 19; s++) {
          const pData = portMap[`1/${s}/${p}`] || portMap[String((s-3)*8+p)];
          if (pData) {
            if (pData.status === 'filled') filled++;
            else if (pData.status === 'unverified') unverified++;
            else if (pData.status === 'reserved') reserved++;
          }
        }
      }
      stats = { total: 128, filled, unverified, reserved, empty: 128 - filled - unverified - reserved };
    } else {
      stats = await PortsAPI.getStats(deviceId);
    }
    
    // Calculate actual totals — always enforce hardware minimum as floor
    // (device.total_ports in DB may be stale/wrong, hardware capacity is the truth)
    let actualTotal = device.total_ports || stats.total || 0;
    if (typeName === 'GTGO' || typeName === 'OLT') actualTotal = Math.max(actualTotal, 128);
    else if (typeName === 'CISCO')  actualTotal = Math.max(actualTotal, 48);
    else if (typeName === 'HUAWEI') actualTotal = Math.max(actualTotal, 56);
    else if (typeName === 'OTB') {
      const is144 = device.model?.includes('144') || device.name?.includes('144') || stats.total >= 140;
      actualTotal = Math.max(actualTotal, is144 ? 144 : 96);
    }
    if (actualTotal === 0) actualTotal = stats.total || 1;
    
    const pct = calcPercent(stats.filled, actualTotal);
    const actualEmpty = Math.max(0, actualTotal - stats.filled - (stats.unverified || 0) - (stats.reserved || 0));

    container.innerHTML = `
      <div>
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <span class="breadcrumb__item" onclick="App.navigate('dashboard')">🏠</span>
          <span class="breadcrumb__sep">›</span>
          <span class="breadcrumb__item" onclick="App.navigate('site',{siteId:'${device.site_id}'})">${device.sites?.name || 'Site'}</span>
          <span class="breadcrumb__sep">›</span>
          <span class="breadcrumb__item active">${device.name}</span>
        </div>

        <!-- Device Header Card -->
        <div class="device-detail-header" style="border-color:${color}33">
          <div class="device-detail-icon" style="background:${bgColor}">${icon}</div>
          <div style="flex:1;min-width:0">
            <div class="device-detail-name">${device.name}</div>
            <div class="device-detail-type">
              <span class="badge badge-${typeName.toLowerCase()}">${typeName}</span>
              ${device.model ? `<span style="font-size:0.8rem;color:var(--color-text-muted);margin-left:6px">${device.model}</span>` : ''}
            </div>
            ${device.rack_position ? `<div style="font-size:0.78rem;color:var(--color-text-muted);margin-top:4px">Rack: ${device.rack_position}</div>` : ''}
          </div>
          ${canEdit() ? `
            <div style="display:flex;flex-direction:column;gap:6px">
              <button class="btn btn-ghost btn-icon-sm" onclick="showEditLayoutModal('${deviceId}', '${typeName}')" title="Edit Layout">⚙️</button>
              <button class="btn btn-ghost btn-icon-sm" onclick="showEditDeviceModal('${deviceId}','${device.name}','${device.model||''}','${device.rack_position||''}','${device.notes||''}')" title="Edit Perangkat">✏️</button>
              ${isAdmin() ? `<button class="btn btn-ghost btn-icon-sm" style="color:var(--color-danger)" onclick="confirmDeleteDevice('${deviceId}','${device.site_id}')" title="Hapus">🗑️</button>` : ''}
            </div>
          ` : ''}
        </div>
        

        <!-- Stats Row -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-bottom:var(--space-5)">
          <div class="stat-card" style="--stat-accent:var(--color-filled);--stat-accent-bg:rgba(16,185,129,0.1);padding:12px">
            <div class="stat-card__value" style="font-size:1.5rem">${stats.filled}</div>
            <div class="stat-card__label">Terisi</div>
          </div>
          <div class="stat-card" style="padding:12px">
            <div class="stat-card__value" style="font-size:1.5rem">${actualEmpty}</div>
            <div class="stat-card__label">Kosong</div>
          </div>
          <div class="stat-card" style="--stat-accent:${color};--stat-accent-bg:${bgColor};padding:12px">
            <div class="stat-card__value" style="font-size:1.5rem;color:${color}">${pct}%</div>
            <div class="stat-card__label">Penggunaan</div>
          </div>
        </div>

        <!-- Port Filter Chips and Search -->
        <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:var(--space-4); align-items:center;">
          <div class="search-wrapper" style="width: 100%; max-width: 300px;">
            <span class="search-icon">🔍</span>
            <input class="search-input" type="text" id="device-search" placeholder="Cari port/lokasi di perangkat ini..." autocomplete="off" oninput="filterDevicePorts()">
          </div>
          <div class="chip-group" id="port-filters" style="margin-bottom:0">
            <div class="chip active" onclick="filterPorts(this,'all')" data-filter="all">Semua</div>
            <div class="chip" onclick="filterPorts(this,'filled')" data-filter="filled">🟢 Terisi</div>
            <div class="chip" onclick="filterPorts(this,'empty')" data-filter="empty">⚪ Kosong</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-4);flex-wrap:wrap">
          ${canEdit() ? `
          <input type="file" id="device-import-file" accept=".xlsx,.xls" style="display:none" onchange="handleDeviceImportFile(event, '${deviceId}', '${device.site_id}', '${typeName}')">
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('device-import-file').click()">
            📥 Import Port
          </button>
          <button class="btn btn-secondary btn-sm" onclick="handleDownloadTemplate('${typeName}', '${device.name}')">
            📋 Template Excel
          </button>
          ` : ''}
          <button class="btn btn-secondary btn-sm" onclick="exportDevice('${deviceId}','${typeName}','${device.name}')">
            📤 Export
          </button>
          <button class="btn btn-secondary btn-sm" onclick="showAuditForDevice('${deviceId}','${device.name}')">
            📋 Riwayat
          </button>
        </div>

        <!-- Device Port View -->
        <div id="device-port-view"></div>

        <!-- Audit Log Section -->
        <div id="audit-section" style="margin-top:var(--space-5)"></div>
      </div>
    `;

    // Render appropriate view based on device type
    const portView = document.getElementById('device-port-view');
    if (typeName === 'OTB') {
      await renderOTBView(device, portView);
    } else if (typeName === 'GTGO' || typeName === 'OLT') {
      await renderGTGOView(device, portView);
    } else {
      await renderPanelView(device, portView);
    }

    // Load recent audit
    loadRecentAudit(deviceId);

    // Auto-open modal if portId is provided
    if (autoOpenPortId) {
      setTimeout(async () => {
        // Find the port to get its number and tube_id
        const ports = await PortsAPI.getByDevice(deviceId);
        const p = ports.find(x => x.id === autoOpenPortId);
        if (p) {
          const displayType = typeName === 'OTB' ? 'otb' : 'panel';
          showPortModal(deviceId, p.id, p.port_number, p.tube_id || null, displayType);
        }
      }, 500); // short delay to allow views to render
    }

  } catch (err) {
    console.error('[Device] Error:', err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Gagal memuat perangkat</div>
        <div class="empty-state__desc">${err.message}</div>
        <button class="btn btn-secondary" onclick="history.back()">← Kembali</button>
      </div>
    `;
  }
}

// =====================================================
// PORT FILTER
// =====================================================
window.filterPorts = function(chipEl, filter) {
  document.querySelectorAll('#port-filters .chip').forEach(c => c.classList.remove('active'));
  chipEl.classList.add('active');
  window.filterDevicePorts();
};

window.filterDevicePorts = function() {
  const query = document.getElementById('device-search')?.value.toLowerCase() || '';
  const activeFilter = document.querySelector('#port-filters .chip.active')?.dataset.filter || 'all';
  
  document.querySelectorAll('.port-cell, .panel-port, .otb-grid-cell').forEach(cell => {
    const status = cell.getAttribute('data-status') || 'empty';
    const label = cell.getAttribute('data-label') || '';
    
    const matchStatus = activeFilter === 'all' || status === activeFilter;
    const matchSearch = query === '' || label.includes(query) || cell.textContent.toLowerCase().includes(query);
    
    if (matchStatus && matchSearch) {
      cell.style.display = '';
      cell.style.opacity = '1';
    } else {
      cell.style.display = 'none';
    }
  });
};

// =====================================================
// EXPORT DEVICE DATA
// =====================================================
window.exportDevice = async function(deviceId, typeName, deviceName) {
  try {
    showToast('📥 Menyiapkan export...', 'info');
    let rows;
    if (typeName === 'OTB') {
      const device = await DevicesAPI.getById(deviceId);
      rows = await exportOTBData(device);
    } else {
      const ports = await PortsAPI.getByDevice(deviceId);
      rows = ports.map(p => ({
        'Port': p.port_number,
        'Detail Port': p.connection_detail || '',
        'Koneksi': p.connection_label || '',
        'Status': getStatusLabel(p.status),
        'Catatan': p.notes || '',
        'Update': p.updated_at || ''
      }));
    }
    exportCSV(rows, `${deviceName}_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('✅ Export berhasil!', 'success');
  } catch (err) {
    showToast(`❌ Export gagal: ${err.message}`, 'error');
  }
};

// =====================================================
// SHOW AUDIT FOR DEVICE
// =====================================================
window.showAuditForDevice = async function(deviceId, deviceName) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
  backdrop.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()" style="max-height:75vh;overflow-y:auto">
      <div class="modal__handle"></div>
      <div class="modal__title">📋 Riwayat — ${deviceName}</div>
      <div id="audit-modal-content">
        <div class="skeleton" style="height:200px;border-radius:var(--radius-lg)"></div>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const logs = await AuditAPI.getByDevice(deviceId, 30);
  const content = document.getElementById('audit-modal-content');
  if (!logs.length) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📋</div><div>Belum ada riwayat</div></div>`;
    return;
  }

  content.innerHTML = logs.map(log => `
    <div class="audit-item">
      <div class="audit-item__icon ${log.action}">${{ created:'➕', updated:'✏️', deleted:'🗑️', verified:'✅' }[log.action]}</div>
      <div class="audit-item__content">
        <div class="audit-item__title">Port ${log.port_number} — ${log.action}</div>
        ${log.new_connection_label ? `<div class="audit-item__meta" style="color:var(--color-filled)">${log.new_connection_label}</div>` : ''}
        <div class="audit-item__meta">${log.changed_by || 'Anonim'} • ${timeAgo(log.changed_at)}</div>
      </div>
    </div>
  `).join('');
};

// =====================================================
// RECENT AUDIT IN PAGE
// =====================================================
async function loadRecentAudit(deviceId) {
  const section = document.getElementById('audit-section');
  if (!section) return;
  try {
    const logs = await AuditAPI.getByDevice(deviceId, 5);
    if (!logs.length) return;
    section.innerHTML = `
      <div class="section-header">
        <div class="section-title">📋 Perubahan Terkini</div>
        <button class="btn btn-ghost btn-sm" onclick="showAuditForDevice('${deviceId}','Perangkat')">Lihat Semua</button>
      </div>
      <div class="card">
        <div class="card__body" style="padding:8px 20px">
          ${logs.map(log => `
            <div class="audit-item">
              <div class="audit-item__icon ${log.action}">${{ created:'➕', updated:'✏️', deleted:'🗑️', verified:'✅' }[log.action]}</div>
              <div class="audit-item__content">
                <div class="audit-item__title">Port ${log.port_number}</div>
                ${log.new_connection_label ? `<div style="font-size:0.75rem;color:var(--color-filled)">${log.new_connection_label}</div>` : ''}
                <div class="audit-item__meta">${log.changed_by || 'Anonim'} • ${timeAgo(log.changed_at)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch {}
}

// =====================================================
// EDIT DEVICE MODAL
// =====================================================
window.showEditDeviceModal = function(deviceId, name, model, rack, notes) {};  // defined below
window.confirmDeleteDevice = function(deviceId, siteId) {};  // defined below
window.saveDevice = function() {};  // defined below

// These are defined below; assigning here so inline HTML onclick can call them
window.showEditLayoutModal = function(deviceId, typeName) { showEditLayoutModal(deviceId, typeName); };
window.saveDeviceLayout = function(deviceId, btn) { saveDeviceLayout(deviceId, btn); };
window.handleDeviceImportFile = function(event, deviceId, siteId, typeName) { handleDeviceImportFile(event, deviceId, siteId, typeName); };
window.handleDownloadTemplate = async (typeName, deviceName) => {
  const imp = await import('./import.js');
  if (imp.downloadTemplate) imp.downloadTemplate(typeName, deviceName);
};

// =====================================================
// EDIT LAYOUT MODAL
// =====================================================
function showEditLayoutModal(deviceId, typeName) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
  const currentCols = localStorage.getItem('layout_cols_' + deviceId) || (typeName === 'OTB' ? 24 : 48);
  const currentRows = localStorage.getItem('layout_rows_' + deviceId) || (typeName === 'OTB' ? 4 : 2);
  backdrop.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal__handle"></div>
      <div class="modal__title">⚙️ Konfigurasi Layout Port</div>
      <div class="form-group">
        <label class="form-label">Jumlah Kolom (Horizontal)</label>
        <input type="number" id="edit-layout-cols" class="form-input" value="${currentCols}" min="1" max="144">
      </div>
      <div class="form-group">
        <label class="form-label">Jumlah Baris (Vertikal)</label>
        <input type="number" id="edit-layout-rows" class="form-input" value="${currentRows}" min="1" max="20">
      </div>
      <p style="font-size:0.8rem;color:var(--color-text-muted);margin-bottom:var(--space-4)">Mengubah layout hanya merubah tampilan visual. Data port di database tetap aman.</p>
      <div class="modal__actions">
        <button class="btn btn-secondary" style="flex:1" onclick="this.closest('.modal-backdrop').remove()">Batal</button>
        <button class="btn btn-primary" style="flex:2" onclick="saveDeviceLayout('${deviceId}', this)">Simpan Layout</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
}

function saveDeviceLayout(deviceId, btn) {
  const cols = document.getElementById('edit-layout-cols').value;
  const rows = document.getElementById('edit-layout-rows').value;
  if (!cols || !rows || cols < 1 || rows < 1) {
    showToast('Kolom dan baris harus lebih dari 0', 'warning');
    return;
  }
  localStorage.setItem('layout_cols_' + deviceId, cols);
  localStorage.setItem('layout_rows_' + deviceId, rows);
  btn.closest('.modal-backdrop').remove();
  showToast('Layout berhasil diperbarui', 'success');
  location.reload();
}

// =====================================================
// DEVICE IMPORT FILE HANDLER
// =====================================================
async function handleDeviceImportFile(event, deviceId, siteId, typeName) {
  const file = event.target.files[0];
  if (!file) return;
  showToast('Memproses file import...', 'info');
  try {
    const imp = await import('./import.js');
    if (imp.importPortsToDevice) {
      await imp.importPortsToDevice(file, deviceId, siteId, typeName);
    } else {
      showToast('Fungsi importPortsToDevice belum tersedia di import.js', 'warning');
    }
    location.reload();
  } catch (err) {
    console.error(err);
    showToast('Import gagal: ' + err.message, 'error');
  }
}

window.showEditDeviceModal = function(deviceId, name, model, rack, notes) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
  backdrop.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal__handle"></div>
      <div class="modal__title">✏️ Edit Perangkat</div>
      <div class="form-group">
        <label class="form-label">Nama Perangkat</label>
        <input class="form-input" id="edit-dev-name" type="text" value="${name}">
      </div>
      <div class="form-group">
        <label class="form-label">Model</label>
        <input class="form-input" id="edit-dev-model" type="text" value="${model}">
      </div>
      <div class="form-group">
        <label class="form-label">Posisi Rack</label>
        <input class="form-input" id="edit-dev-rack" type="text" value="${rack}">
      </div>
      <div class="form-group">
        <label class="form-label">Catatan</label>
        <textarea class="form-textarea" id="edit-dev-notes">${notes}</textarea>
      </div>
      <div class="modal__actions">
        <button class="btn btn-secondary" style="flex:1" onclick="document.querySelector('.modal-backdrop').remove()">Batal</button>
        <button class="btn btn-primary" style="flex:2" onclick="submitEditDevice('${deviceId}')">💾 Simpan</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
};

window.submitEditDevice = async function(deviceId) {
  const name  = document.getElementById('edit-dev-name').value.trim();
  const model = document.getElementById('edit-dev-model').value.trim();
  const rack  = document.getElementById('edit-dev-rack').value.trim();
  const notes = document.getElementById('edit-dev-notes').value.trim();
  const btn = document.querySelector('.modal .btn-primary');
  btn.classList.add('loading'); btn.disabled = true;
  try {
    await DevicesAPI.update(deviceId, {
      name, model: model || null,
      rack_position: rack || null,
      notes: notes || null
    });
    document.querySelector('.modal-backdrop').remove();
    showToast('✅ Perangkat berhasil diperbarui', 'success');
    location.reload();
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    btn.classList.remove('loading'); btn.disabled = false;
  }
};

// =====================================================
// DELETE DEVICE CONFIRM
// =====================================================
window.confirmDeleteDevice = function(deviceId, siteId) {
  if (!confirm('⚠️ Hapus perangkat ini? Semua data port akan ikut terhapus. Yakin?')) return;
  DevicesAPI.delete(deviceId)
    .then(() => {
      showToast('🗑️ Perangkat berhasil dihapus', 'info');
      window.App.navigate('site', { siteId });
    })
    .catch(err => showToast(`❌ ${err.message}`, 'error'));
};


