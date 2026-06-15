// =====================================================
// SITES.JS
// =====================================================
import { SitesAPI, DevicesAPI, SiteCoreNotesAPI } from './supabase.js';
import { getSiteColor, getSiteEmoji, getDeviceIcon, getDeviceBgColor, getDeviceColor, calcPercent, getDeviceCapacity } from './utils.js';
import { canEdit } from './auth.js';
import { showToast } from './app.js';

export async function renderSitePage(siteId, container) {
  if (!siteId) { window.App.navigate('dashboard'); return; }

  try {
    const site = await SitesAPI.getById(siteId);
    if (!site) throw new Error('Site tidak ditemukan');
    const actualSiteId = site.id;

    const [devices, coreNotes] = await Promise.all([
      DevicesAPI.getBySite(actualSiteId),
      SiteCoreNotesAPI.getBySite(actualSiteId)
    ]);

    const siteColor = getSiteColor(site.name);
    const siteEmoji = getSiteEmoji(site.name);

    // Calculate site-wide stats from devices
    let totalPorts = 0, filledPorts = 0;
    devices.forEach(d => {
      const typeName = d.device_types?.name || 'OTHER';
      const ports = d.port_connections || [];
      const filled = ports.filter(p => p.status === 'filled').length;
      
      const total = getDeviceCapacity(d);
      
      totalPorts += total;
      filledPorts += filled;
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
        <div class="site-detail-header" style="background:${siteColor}15;border:1px solid ${siteColor}33;padding:var(--space-4);border-radius:var(--radius-xl);margin-bottom:var(--space-5);">
          <div class="site-detail-content" style="width:100%">
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
            <button class="btn btn-primary btn-sm" onclick="showAddDeviceModal('${actualSiteId}', '${siteId}')">
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
              ${canEdit() ? `<button class="btn btn-primary" onclick="showAddDeviceModal('${actualSiteId}', '${siteId}')">+ Tambah Perangkat</button>` : ''}
            </div>
          ` : devices.map(device => renderDeviceListItem(device, site.code || siteId, site)).join('')}
        </div>

        <!-- Catatan Core Section -->
        <div class="section-header" style="margin-top:var(--space-6);">
          <div class="section-title">
            <span class="section-title__icon">📝</span>
            Catatan Core & ODC
          </div>
          ${canEdit() ? `
            <button class="btn btn-secondary btn-sm" onclick="showAddCoreNoteModal('${actualSiteId}', '${siteId}')">
              + Catatan
            </button>
          ` : ''}
        </div>

        <div class="card" style="overflow-x:auto;">
          ${coreNotes.length === 0 ? `
            <div class="empty-state" style="padding:var(--space-6)">
              <div class="empty-state__icon">📝</div>
              <div class="empty-state__title">Belum ada catatan core</div>
              <div class="empty-state__desc">Tambahkan catatan alokasi core di lokasi ini.</div>
            </div>
          ` : `
            <table style="width:100%; text-align:left; border-collapse:collapse; white-space:nowrap;">
              <thead style="background:var(--color-bg-elevated); border-bottom:1px solid var(--color-border);">
                <tr>
                  <th style="padding:12px; font-weight:600; color:var(--color-text-muted);">OLT Port</th>
                  <th style="padding:12px; font-weight:600; color:var(--color-text-muted);">Tube</th>
                  <th style="padding:12px; font-weight:600; color:var(--color-text-muted);">Core</th>
                  <th style="padding:12px; font-weight:600; color:var(--color-text-muted);">Perangkat</th>
                  <th style="padding:12px; font-weight:600; color:var(--color-text-muted); text-align:center;">Kapasitas</th>
                  <th style="padding:12px; font-weight:600; color:var(--color-text-muted); text-align:center;">Terpakai</th>
                  <th style="padding:12px; font-weight:600; color:var(--color-text-muted); text-align:center;">Sisa</th>
                  <th style="padding:12px; font-weight:600; color:var(--color-text-muted);">Keterangan</th>
                  ${canEdit() ? '<th style="padding:12px; font-weight:600; color:var(--color-text-muted);">Aksi</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${coreNotes.map(note => `
                  <tr>
                    <td style="padding:12px; border-bottom:1px solid var(--color-border);">${note.olt_port || '-'}</td>
                    <td style="padding:12px; border-bottom:1px solid var(--color-border);">${note.tube_color || '-'}</td>
                    <td style="padding:12px; border-bottom:1px solid var(--color-border);">${note.core_color || '-'}</td>
                    <td style="padding:12px; border-bottom:1px solid var(--color-border);">${note.device_name || '-'}</td>
                    <td style="padding:12px; border-bottom:1px solid var(--color-border); text-align:center;">${note.capacity || 0}</td>
                    <td style="padding:12px; border-bottom:1px solid var(--color-border); text-align:center;">${note.used_ports || 0}</td>
                    <td style="padding:12px; border-bottom:1px solid var(--color-border); text-align:center;">${(note.capacity || 0) - (note.used_ports || 0)}</td>
                    <td style="padding:12px; border-bottom:1px solid var(--color-border);">${note.description || '-'}</td>
                    ${canEdit() ? `
                      <td style="padding:12px; border-bottom:1px solid var(--color-border);">
                        <button class="btn btn-ghost btn-icon-sm" onclick="deleteCoreNote('${note.id}', '${siteId}')" title="Hapus">🗑️</button>
                      </td>
                    ` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
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

function renderDeviceListItem(device, siteCode, site) {
  const typeName = device.device_types?.name || 'OTHER';
  const icon  = getDeviceIcon(typeName, device.device_types?.icon);
  const color = getDeviceColor(typeName);
  const bgColor = getDeviceBgColor(typeName);

  const ports = device.port_connections || [];
  const filled = ports.filter(p => p.status === 'filled').length;
  
  const total = getDeviceCapacity(device);

  
  const pct = calcPercent(filled, Math.max(total, 1));

  return `
    <div class="device-list-item" onclick="App.navigate('device', {siteId:'${siteCode}', deviceId:'${device.id}', deviceName:'${device.name}'})">
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
window.showAddDeviceModal = async function(dbSiteId, slugSiteId) {
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
        <select class="form-select" id="new-dev-type" onchange="
          const t = this.options[this.selectedIndex].text.toUpperCase();
          const isOLT = t.includes('OLT') || t.includes('GTGO');
          document.getElementById('custom-type-group').style.display = this.value === 'custom' ? 'block' : 'none';
          document.getElementById('normal-ports-group').style.display = isOLT ? 'none' : 'block';
          document.getElementById('olt-ports-group').style.display = isOLT ? 'block' : 'none';
        ">
          ${types.map(t => `<option value="${t.id}">${t.name} — ${t.description}</option>`).join('')}
          <option value="custom">➕ Tipe Baru (Tulis Manual)...</option>
        </select>
      </div>
      
      <div id="custom-type-group" style="display:none; margin-top:12px; padding:12px; background:var(--color-bg-overlay); border-radius:8px;">
        <div class="form-group">
          <label class="form-label">Nama Tipe Baru *</label>
          <input class="form-input" id="custom-type-name" type="text" placeholder="cth: MIKROTIK">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Logo / Ikon Tipe Baru (Opsional)</label>
          <input class="form-input" id="custom-type-logo" type="file" accept="image/*" style="padding:6px">
        </div>
      </div>
      
      <div class="form-group" style="margin-top:16px;">
        <label class="form-label">Model / Seri</label>
        <input class="form-input" id="new-dev-model" type="text" placeholder="cth: OTB 96 Core">
      </div>
      <div class="form-group" id="normal-ports-group">
        <label class="form-label">Total Port</label>
        <input class="form-input" id="new-dev-ports" type="number" value="48" min="1" max="1000">
      </div>
      
      <div id="olt-ports-group" style="display:none; background:rgba(59,130,246,0.05); padding:12px; border-radius:8px; border:1px solid rgba(59,130,246,0.2); margin-bottom:16px;">
        <div style="font-size:0.75rem; color:var(--color-text-muted); margin-bottom:8px; font-weight:bold;">Konfigurasi OLT / GTGO</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Slot ke Samping</label>
            <input class="form-input" id="new-dev-slots" type="number" value="16" min="1" max="100">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Port ke Bawah</label>
            <input class="form-input" id="new-dev-pps" type="number" value="8" min="1" max="100">
          </div>
        </div>
        <div class="form-group" style="margin-top:12px; margin-bottom:0">
          <label class="form-label">Mulai dari Slot</label>
          <input class="form-input" id="new-dev-start" type="number" value="3" min="1" max="100" placeholder="contoh: 2">
        </div>
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
        <button class="btn btn-primary" style="flex:2" onclick="submitAddDevice('${dbSiteId}', '${slugSiteId}')">➕ Tambah</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  setTimeout(() => document.getElementById('new-dev-name')?.focus(), 300);
};

window.submitAddDevice = async function(dbSiteId, slugSiteId) {
  const name       = document.getElementById('new-dev-name').value.trim();
  let typeId       = document.getElementById('new-dev-type').value;
  const model      = document.getElementById('new-dev-model').value.trim();
  
  const sel = document.getElementById('new-dev-type');
  const typeText = sel.options[sel.selectedIndex].text.toUpperCase();
  const isOLT = typeText.includes('OLT') || typeText.includes('GTGO');
  
  let totalPorts = parseInt(document.getElementById('new-dev-ports').value) || 48;
  let description = null;
  
  if (isOLT) {
    const slots = parseInt(document.getElementById('new-dev-slots').value) || 16;
    const pps = parseInt(document.getElementById('new-dev-pps').value) || 8;
    const start = parseInt(document.getElementById('new-dev-start').value) || 3;
    totalPorts = slots * pps;
    description = JSON.stringify({ startSlot: start, slots: slots, portsPerSlot: pps });
  }
  const rack       = document.getElementById('new-dev-rack').value.trim();
  const notes      = document.getElementById('new-dev-notes').value.trim();

  if (!name) { showToast('Nama perangkat wajib diisi', 'warning'); return; }
  
  const btn = document.querySelector('.modal .btn-primary');
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  try {
    const { DevicesAPI, DeviceTypesAPI } = await import('./supabase.js');
    
    if (typeId === 'custom') {
      const customName = document.getElementById('custom-type-name').value.trim();
      if (!customName) {
        showToast('Nama Tipe Baru wajib diisi', 'warning');
        btn.disabled = false;
        btn.textContent = '➕ Tambah';
        return;
      }
      
      const fileInput = document.getElementById('custom-type-logo');
      let iconBase64 = null;
      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        // Read file as data URL
        iconBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      
      const newType = await DeviceTypesAPI.create({
        name: customName.toUpperCase(),
        description: 'Perangkat khusus',
        icon: iconBase64 || '',
        color: '#8b5cf6'
      });
      typeId = newType.id;
    }

    const { currentProfile } = await import('./auth.js');
    
    // Sort order
    const devices = await DevicesAPI.getBySite(dbSiteId);
    const sortOrder = devices.length + 1;

    const device = await DevicesAPI.create({
      site_id: dbSiteId,
      device_type_id: typeId,
      name: name,
      model: model || null,
      total_ports: totalPorts,
      rack_position: rack || null,
      notes: notes || null,
      description: description,
      is_active: true,
      sort_order: sortOrder
    });

    // Auto-create port connections only if not reactivated
    if (!device._reactivated) {
      const portsData = Array.from({ length: totalPorts }, (_, i) => ({
        device_id: device.id,
        port_number: i + 1,
        status: 'empty'
      }));
      const { PortsAPI } = await import('./supabase.js');
      await PortsAPI.bulkCreate(portsData);
    }

    document.querySelector('.modal-backdrop').remove();
    showToast(`✅ Perangkat ${name} berhasil ditambahkan!`, 'success');
    window.App.navigate('site', { siteId: slugSiteId });
    if (typeof window.renderSidebarSites === 'function') {
      window.renderSidebarSites();
    }
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
