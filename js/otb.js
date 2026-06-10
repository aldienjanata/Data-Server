// =====================================================
// OTB.JS - OTB Visual Display Module
// =====================================================
import { TubesAPI, PortsAPI } from './supabase.js';
import { formatPort, vibrate, getStatusLabel } from './utils.js';
import { showToast, showPortModal } from './app.js';
import { canEdit } from './auth.js';

// =====================================================
// RENDER OTB DEVICE VIEW
// =====================================================
export async function renderOTBView(device, container) {
  container.innerHTML = `
    <div class="otb-container stagger" id="otb-container">
      ${Array.from({ length: 3 }).map(() => `
        <div class="skeleton" style="height:120px;border-radius:var(--radius-xl)"></div>
      `).join('')}
    </div>
  `;

  try {
    const [tubes, allPorts] = await Promise.all([
      TubesAPI.getByDevice(device.id),
      PortsAPI.getByDevice(device.id)
    ]);

    // Group ports by tube
    const portsByTube = {};
    allPorts.forEach(p => {
      const tubeId = p.tube_id || 'no-tube';
      if (!portsByTube[tubeId]) portsByTube[tubeId] = [];
      portsByTube[tubeId].push(p);
    });

    const otbContainer = document.getElementById('otb-container');
    otbContainer.innerHTML = '';

    if (!tubes.length) {
      otbContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📦</div>
          <div class="empty-state__title">Tidak ada tube</div>
          <div class="empty-state__desc">Tambahkan tube untuk OTB ini</div>
        </div>
      `;
      return;
    }

    tubes.forEach((tube, idx) => {
      const ports = (portsByTube[tube.id] || []).sort((a, b) => a.port_number - b.port_number);
      const filled = ports.filter(p => p.status === 'filled').length;
      const total = ports.length || tube.total_cores;
      const percent = total > 0 ? Math.round(filled / total * 100) : 0;

      const tubeEl = document.createElement('div');
      tubeEl.className = 'otb-tube fade-in';
      tubeEl.style.animationDelay = `${idx * 0.06}s`;
      tubeEl.innerHTML = `
        <div class="otb-tube__header" onclick="toggleTube(this)">
          <div class="otb-tube__number">${tube.tube_number}</div>
          <div class="otb-tube__title">Tube ${tube.tube_number}</div>
          <div class="tube-progress">
            <div class="tube-progress__fill" style="width:${percent}%"></div>
          </div>
          <div class="otb-tube__stats">
            <span class="otb-tube__stat otb-tube__stat--filled">${filled} terisi</span>
            <span class="otb-tube__stat otb-tube__stat--total">${total} core</span>
          </div>
          <span class="otb-tube__chevron">▼</span>
        </div>
        <div class="otb-tube__cores">
          ${renderOTBCores(ports, tube, device)}
        </div>
      `;
      otbContainer.appendChild(tubeEl);
    });

  } catch (err) {
    console.error('[OTB] Error loading tubes:', err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Gagal memuat data</div>
        <div class="empty-state__desc">${err.message}</div>
      </div>
    `;
  }
}

// =====================================================
// RENDER OTB CORE CELLS
// =====================================================
function renderOTBCores(ports, tube, device) {
  if (!ports.length) {
    // Generate empty slots
    return Array.from({ length: tube.total_cores }, (_, i) => `
      <div class="port-cell empty" 
           onclick="handlePortClick('${device.id}', null, ${i + 1}, '${tube.id}')"
           id="port-${tube.id}-${i + 1}">
        <div class="port-cell__number">C${formatPort(i + 1)}</div>
        <div class="port-cell__dot"></div>
      </div>
    `).join('');
  }

  return ports.map(port => {
    const label = port.connection_label || '';
    const shortLabel = label.length > 12 ? label.slice(0, 10) + '…' : label;
    const coreLabel = port.core_number ? `C${formatPort(port.core_number)}` : `C${formatPort(port.port_number)}`;

    return `
      <div class="port-cell ${port.status}" 
           onclick="handlePortClick('${device.id}', '${port.id}', ${port.port_number}, '${port.tube_id || ''}')"
           id="port-cell-${port.id}"
           title="${label || 'Kosong'}"
           data-port-id="${port.id}"
           data-status="${port.status}">
        <div class="port-cell__number">${coreLabel}</div>
        <div class="port-cell__dot"></div>
        ${label ? `<div class="port-cell__label">${shortLabel}</div>` : ''}
      </div>
    `;
  }).join('');
}

// =====================================================
// TOGGLE TUBE COLLAPSE
// =====================================================
window.toggleTube = function(headerEl) {
  const tube = headerEl.closest('.otb-tube');
  tube.classList.toggle('collapsed');
  vibrate([5]);
};

// =====================================================
// HANDLE PORT CLICK
// =====================================================
window.handlePortClick = function(deviceId, portId, portNumber, tubeId) {
  vibrate([8]);
  showPortModal(deviceId, portId, portNumber, tubeId, 'otb');
};

// =====================================================
// UPDATE PORT CELL IN DOM (after save)
// =====================================================
export function updatePortCell(portId, portData) {
  const cell = document.getElementById(`port-cell-${portId}`);
  if (!cell) return;

  cell.className = `port-cell ${portData.status}`;
  cell.setAttribute('data-status', portData.status);

  const label = portData.connection_label || '';
  const shortLabel = label.length > 12 ? label.slice(0, 10) + '…' : label;

  // Update label
  let labelEl = cell.querySelector('.port-cell__label');
  if (label) {
    if (!labelEl) {
      labelEl = document.createElement('div');
      labelEl.className = 'port-cell__label';
      cell.appendChild(labelEl);
    }
    labelEl.textContent = shortLabel;
  } else {
    labelEl?.remove();
  }

  // Flash animation
  cell.style.transform = 'scale(1.15)';
  cell.style.zIndex = '10';
  setTimeout(() => {
    cell.style.transform = '';
    cell.style.zIndex = '';
  }, 250);
}

// =====================================================
// RENDER TUBE STATS SUMMARY
// =====================================================
export function renderTubeStats(tubes, portsByTube) {
  return tubes.map(tube => {
    const ports = portsByTube[tube.id] || [];
    const filled = ports.filter(p => p.status === 'filled').length;
    const total = ports.length || tube.total_cores;
    const percent = total > 0 ? Math.round(filled / total * 100) : 0;

    return {
      tubeNumber: tube.tube_number,
      filled,
      total,
      percent
    };
  });
}

// =====================================================
// EXPORT OTB DATA
// =====================================================
export async function exportOTBData(device) {
  try {
    const [tubes, ports] = await Promise.all([
      TubesAPI.getByDevice(device.id),
      PortsAPI.getByDevice(device.id)
    ]);

    const rows = [];
    tubes.forEach(tube => {
      const tubePorts = ports.filter(p => p.tube_id === tube.id).sort((a, b) => a.port_number - b.port_number);
      tubePorts.forEach(port => {
        rows.push({
          'Perangkat': device.name,
          'Tube': tube.tube_number,
          'Core': port.core_number || port.port_number,
          'Port No': port.port_number,
          'Koneksi': port.connection_label || '',
          'Detail': port.connection_detail || '',
          'Status': getStatusLabel(port.status),
          'Catatan': port.notes || '',
          'Update': port.updated_at || ''
        });
      });
    });

    return rows;
  } catch (err) {
    console.error('[OTB] Export error:', err);
    throw err;
  }
}
