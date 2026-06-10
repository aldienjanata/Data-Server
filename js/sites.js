// =====================================================
// SITES.JS
// =====================================================
import { SitesAPI, DevicesAPI } from './supabase.js';
import { getSiteColor, getSiteEmoji, getDeviceIcon, getDeviceBgColor, getDeviceColor, calcPercent } from './utils.js';
import { canEdit } from './auth.js';
import { showToast } from './app.js';

export async function renderSitePage(siteId, container) {
  if (!siteId) { window.App.navigate('dashboard'); return; }

  try {
    const [site, devices] = await Promise.all([
      SitesAPI.getById(siteId),
      DevicesAPI.getBySite(siteId)
    ]);

    const siteColor = getSiteColor(site.name);
    const siteEmoji = getSiteEmoji(site.name);

    // Calculate site-wide stats from devices
    let totalPorts = 0, filledPorts = 0;
    devices.forEach(d => {
      (d.port_connections || []).forEach(pc => {
        totalPorts++;
        if (pc.status === 'filled') filledPorts++;
      });
    });
    const pct = calcPercent(filledPorts, totalPorts);

    container.innerHTML = `
      <div class="stagger">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <span class="breadcrumb__item" onclick="App.navigate('dashboard')">🏠 Dashboard</span>
          <span class="breadcrumb__sep">›</span>
          <span class="breadcrumb__item active">${site.name}</span>
        </div>

        <!-- Site Header -->
        <div class="site-detail-header" style="background:${siteColor}15;border:1px solid ${siteColor}33">
          <div class="site-detail-bg">${siteEmoji}</div>
          <div class="site-detail-content">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div class="site-detail-name">${site.name}</div>
                <div class="site-detail-location">📍 ${site.location || 'Jawa Tengah'}</div>
                ${site.description ? `<div style="font-size:0.82rem;color:var(--color-text-muted);margin-top:6px">${site.description}</div>` : ''}
              </div>
              ${canEdit() ? `
                <div style="display:flex;gap:8px;flex-shrink:0">
                  <button class="btn btn-ghost btn-icon-sm" onclick="showEditSiteModal('${siteId}','${site.name}','${site.location||''}','${site.description||''}')"
                          title="Edit Site">✏️</button>
                </div>
              ` : ''}
            </div>
            <div class="site-stats-row">
              <div class="site-stat">
                <div class="site-stat__value">${devices.length}</div>
                <div class="site-stat__label">Perangkat</div>
              </div>
              <div class="site-stat">
                <div class="site-stat__value" style="color:var(--color-filled)">${filledPorts}</div>
                <div class="site-stat__label">Port Terisi</div>
              </div>
              <div class="site-stat">
                <div class="site-stat__value" style="color:${siteColor}">${pct}%</div>
                <div class="site-stat__label">Penggunaan</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Devices Section -->
        <div class="section-header">
          <div class="section-title">
            <span class="section-title__icon">🖥️</span>
            Perangkat di ${site.name}
          </div>
          ${canEdit() ? `
            <button class="btn btn-primary btn-sm" onclick="showAddDeviceModal('${siteId}')">
              + Perangkat
            </button>
          ` : ''}
        </div>

        <div class="devices-list">
          ${devices.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state__icon">🖥️</div>
              <div class="empty-state__title">Belum ada perangkat</div>
              <div class="empty-state__desc">Tambahkan perangkat untuk site ini</div>
              ${canEdit() ? `<button class="btn btn-primary" onclick="showAddDeviceModal('${siteId}')">+ Tambah Perangkat</button>` : ''}
            </div>
          ` : devices.map(device => renderDeviceListItem(device, siteId)).join('')}
        </div>
      </div>
    `;

  } catch (err) {
    console.error('[Sites] Error:', err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Gagal memuat site</div>
        <div class="empty-state__desc">${err.message}</div>
        <button class="btn btn-secondary" onclick="App.navigate('dashboard')">← Kembali</button>
      </div>
    `;
  }
}

function renderDeviceListItem(device, siteId) {
  const typeName = device.device_types?.name || 'OTHER';
  const icon  = getDeviceIcon(typeName);
  const color = getDeviceColor(typeName);
  const bgColor = getDeviceBgColor(typeName);

  const ports = device.port_connections || [];
  const filled = ports.filter(p => p.status === 'filled').length;
  const total  = ports.length || device.total_ports;
  const pct    = calcPercent(filled, total);

  return `
    <div class="device-list-item" onclick="App.navigate('device', {siteId:'${siteId}',deviceId:'${device.id}'})">
      <div class="device-list-item__icon" style="background:${bgColor}">
        ${icon}
      </div>
      <div class="device-list-item__info">
        <div class="device-list-item__name">${device.name}</div>
        <div class="device-list-item__meta">
          <span class="badge badge-${typeName.toLowerCase()}">${typeName}</span>
          ${device.model ? `<span>${device.model}</span>` : ''}
          ${device.rack_position ? `<span>Rack: ${device.rack_position}</span>` : ''}
        </div>
      </div>
      <div class="device-list-item__usage">
        <div class="progress-ring">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle class="progress-ring__bg" cx="28" cy="28" r="22"/>
            <circle class="progress-ring__fill" cx="28" cy="28" r="22"
                    stroke="${color}"
                    stroke-dasharray="${2 * Math.PI * 22}"
                    stroke-dashoffset="${2 * Math.PI * 22 * (1 - pct / 100)}"
                    transform="rotate(-90 28 28)"/>
          </svg>
          <div class="progress-ring__text">${pct}%</div>
        </div>
        <div style="font-size:0.7rem;color:var(--color-text-muted);text-align:center">${filled}/${total}</div>
      </div>
    </div>
  `;
}

// =====================================================
// ADD DEVICE MODAL
// =====================================================
window.showAddDeviceModal = async function(siteId) {
  const { DeviceTypesAPI } = await import('./supabase.js');
  const types = await DeviceTypesAPI.getAll();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
  backdrop.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal__handle"></div>
      <div class="modal__title">🖥️ Tambah Perangkat</div>
      <div class="form-group">
        <label class="form-label">Nama Perangkat *</label>
        <input class="form-input" id="new-dev-name" type="text" placeholder="cth: OTB 4, CISCO 2" required>
      </div>
      <div class="form-group">
        <label class="form-label">Tipe Perangkat *</label>
        <select class="form-select" id="new-dev-type">
          ${types.map(t => `<option value="${t.id}">${t.name} — ${t.description}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Model / Seri</label>
        <input class="form-input" id="new-dev-model" type="text" placeholder="cth: OTB 96 Core">
      </div>
      <div class="form-group">
        <label class="form-label">Total Port</label>
        <input class="form-input" id="new-dev-ports" type="number" value="48" min="1" max="1000">
      </div>
      <div class="form-group">
        <label class="form-label">Posisi Rack</label>
        <input class="form-input" id="new-dev-rack" type="text" placeholder="cth: U1, U3">
      </div>
      <div class="form-group">
        <label class="form-label">Catatan</label>
        <textarea class="form-textarea" id="new-dev-notes" placeholder="Catatan tambahan..."></textarea>
      </div>
      <div class="modal__actions">
        <button class="btn btn-secondary" style="flex:1" onclick="document.querySelector('.modal-backdrop').remove()">Batal</button>
        <button class="btn btn-primary" style="flex:2" onclick="submitAddDevice('${siteId}')">➕ Tambah</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  setTimeout(() => document.getElementById('new-dev-name')?.focus(), 300);
};

window.submitAddDevice = async function(siteId) {
  const name       = document.getElementById('new-dev-name').value.trim();
  const typeId     = document.getElementById('new-dev-type').value;
  const model      = document.getElementById('new-dev-model').value.trim();
  const totalPorts = parseInt(document.getElementById('new-dev-ports').value) || 48;
  const rack       = document.getElementById('new-dev-rack').value.trim();
  const notes      = document.getElementById('new-dev-notes').value.trim();

  if (!name) { showToast('Nama perangkat wajib diisi', 'warning'); return; }
  const btn = document.querySelector('.modal .btn-primary');
  btn.classList.add('loading'); btn.disabled = true;

  try {
    const device = await DevicesAPI.create({
      site_id: siteId,
      device_type_id: typeId,
      name, model: model || null,
      total_ports: totalPorts,
      rack_position: rack || null,
      notes: notes || null
    });

    // Auto-create port connections
    const portsData = Array.from({ length: totalPorts }, (_, i) => ({
      device_id: device.id,
      port_number: i + 1,
      status: 'empty'
    }));
    const { PortsAPI } = await import('./supabase.js');
    await PortsAPI.bulkCreate(portsData);

    document.querySelector('.modal-backdrop').remove();
    showToast(`✅ Perangkat ${name} berhasil ditambahkan!`, 'success');
    window.App.navigate('site', { siteId });
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    btn.classList.remove('loading'); btn.disabled = false;
  }
};

// =====================================================
// EDIT SITE MODAL
// =====================================================
window.showEditSiteModal = function(siteId, name, location, desc) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
  backdrop.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal__handle"></div>
      <div class="modal__title">✏️ Edit Site</div>
      <div class="form-group">
        <label class="form-label">Nama Site</label>
        <input class="form-input" id="edit-site-name" type="text" value="${name}">
      </div>
      <div class="form-group">
        <label class="form-label">Lokasi</label>
        <input class="form-input" id="edit-site-location" type="text" value="${location}">
      </div>
      <div class="form-group">
        <label class="form-label">Deskripsi</label>
        <textarea class="form-textarea" id="edit-site-desc">${desc}</textarea>
      </div>
      <div class="modal__actions">
        <button class="btn btn-secondary" style="flex:1" onclick="document.querySelector('.modal-backdrop').remove()">Batal</button>
        <button class="btn btn-primary" style="flex:2" onclick="submitEditSite('${siteId}')">💾 Simpan</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
};

window.submitEditSite = async function(siteId) {
  const name     = document.getElementById('edit-site-name').value.trim();
  const location = document.getElementById('edit-site-location').value.trim();
  const desc     = document.getElementById('edit-site-desc').value.trim();
  const btn = document.querySelector('.modal .btn-primary');
  btn.classList.add('loading'); btn.disabled = true;
  try {
    await SitesAPI.update(siteId, { name, location: location || null, description: desc || null });
    document.querySelector('.modal-backdrop').remove();
    showToast('✅ Site berhasil diperbarui', 'success');
    window.App.navigate('site', { siteId });
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    btn.classList.remove('loading'); btn.disabled = false;
  }
};
