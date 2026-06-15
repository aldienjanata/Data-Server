// =====================================================
// LIST-DATA.JS - Global Data Table
// =====================================================
import { PortsAPI, SitesAPI, DevicesAPI } from './supabase.js';
import { getStatusLabel } from './utils.js';

export async function renderListDataPage(container) {
  container.innerHTML = `
    <div style="max-width:var(--max-content-w);margin:0 auto">
      <div style="margin-bottom:var(--space-6)">
        <h1 style="font-size:1.5rem;font-weight:800;margin-bottom:4px">📋 Data Port Perangkat</h1>
        <p style="color:var(--color-text-muted);font-size:0.875rem">
          Lihat dan filter seluruh data port dari semua site
        </p>
      </div>

      <div class="card" style="margin-bottom:var(--space-5)">
        <div class="card__body" style="display:flex;gap:var(--space-3);flex-wrap:wrap">
          <input type="text" class="form-input" id="filter-search" placeholder="Cari port/lokasi..." style="flex:1;min-width:200px;max-width:300px" onkeydown="if(event.key==='Enter') loadListData()">
          <select class="form-select" id="filter-site" style="flex:1;min-width:150px">
            <option value="all">Semua Site</option>
          </select>
          <select class="form-select" id="filter-device" style="flex:1;min-width:150px">
            <option value="all">Semua Perangkat</option>
          </select>
          <select class="form-select" id="filter-status" style="flex:1;min-width:150px">
            <option value="all">Semua Status</option>
            <option value="filled">Terisi</option>
            <option value="empty">Kosong</option>
            <option value="unverified">Belum Verifikasi</option>
          </select>
          <button class="btn btn-primary" onclick="loadListData()">Cari & Filter</button>
          <button class="btn btn-secondary" onclick="handleExportData()" style="margin-left:auto">📤 Export Excel</button>
        </div>
      </div>

      <div class="card">
        <div class="data-table-wrapper" id="list-data-table-container">
          <div style="padding:var(--space-8);text-align:center;color:var(--color-text-muted)">
            <div class="skeleton" style="height:40px;margin-bottom:10px"></div>
            <div class="skeleton" style="height:40px;margin-bottom:10px"></div>
            <div class="skeleton" style="height:40px"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Load filters
  try {
    const sites = await SitesAPI.getAll();
    const siteSelect = document.getElementById('filter-site');
    sites.forEach(s => {
      siteSelect.insertAdjacentHTML('beforeend', `<option value="${s.id}">${s.name}</option>`);
    });

    siteSelect.addEventListener('change', async (e) => {
      const siteId = e.target.value;
      const devSelect = document.getElementById('filter-device');
      devSelect.innerHTML = '<option value="all">Semua Perangkat</option>';
      if (siteId !== 'all') {
        const devs = await DevicesAPI.getBySite(siteId);
        devs.forEach(d => {
          devSelect.insertAdjacentHTML('beforeend', `<option value="${d.id}">${d.name}</option>`);
        });
      }
    });

  } catch (err) {
    console.error('Filter load error:', err);
  }

  window.loadListData = loadListData;
  window.handleExportData = async () => {
    const imp = await import('./import.js');
    if (imp.exportFilteredData) {
      const filters = {
        siteId: document.getElementById('filter-site').value,
        deviceId: document.getElementById('filter-device').value,
        status: document.getElementById('filter-status').value,
        searchQ: document.getElementById('filter-search')?.value.trim() || ''
      };
      imp.exportFilteredData(filters);
    }
  };
  await loadListData();
}

async function loadListData() {
  const container = document.getElementById('list-data-table-container');
  container.innerHTML = '<div style="padding:20px;text-align:center">Memuat data...</div>';

  const siteId = document.getElementById('filter-site').value;
  const devId = document.getElementById('filter-device').value;
  const status = document.getElementById('filter-status').value;
  const searchQ = document.getElementById('filter-search')?.value.trim() || '';

  try {
    const filters = { siteId, deviceId: devId, status };
    // Pass the search query and filters to API
    const filtered = await PortsAPI.search(searchQ, filters);

    if (filtered.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--color-text-muted)">Tidak ada data ditemukan</div>';
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Site</th>
            <th>Perangkat</th>
            <th>Port</th>
            <th>Core Label</th>
            <th>Koneksi / Tujuan</th>
            <th>Keterangan</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(p => `
            <tr>
              <td><span class="highlight">${p.devices?.sites?.name || '-'}</span></td>
              <td>${p.devices?.name || '-'} <span style="color:var(--color-text-muted);font-size:0.7rem">(${p.devices?.device_types?.name || '-'})</span></td>
              <td style="font-family:var(--font-mono)">${p.port_label || p.port_number || '-'}</td>
              <td>${p.core_label || '-'}</td>
              <td style="${p.connection_label ? 'color:var(--color-filled)' : ''}">${p.connection_label || '-'}</td>
              <td>${p.connection_detail ? p.connection_detail + '<br>' : ''}<span style="font-size:0.75rem;color:var(--color-text-muted)">${p.notes || ''}</span></td>
              <td><span class="badge badge-${p.status === 'filled' ? 'filled' : 'empty'}">${getStatusLabel(p.status)}</span></td>
              <td>
                <button class="btn btn-ghost btn-sm" style="white-space:nowrap;font-size:0.75rem"
                  onclick="App.navigate('device',{siteId:'${p.devices?.sites?.code || ''}', deviceId:'${p.device_id}', deviceName:'${p.devices?.name || ''}', portId:'${p.id}'})"
                  title="Lihat di Perangkat">
                  🔌 Lihat
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

  } catch (err) {
    container.innerHTML = `<div style="padding:20px;color:var(--color-danger)">Error: ${err.message}</div>`;
  }
}
