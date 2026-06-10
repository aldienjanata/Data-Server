// =====================================================
// PANELS.JS - CISCO/HUAWEI Port Panel Visual Module
// =====================================================
import { PortsAPI } from './supabase.js';
import { formatPort, vibrate } from './utils.js';
import { showPortModal } from './app.js';

// =====================================================
// CISCO PORT LAYOUT DEFINITION
// Cisco typically has ports in pairs on a rack
// =====================================================
const CISCO_LAYOUT = [
  { label: 'Row 1 (Port 1-8)', ports: [1, 2, 3, 4, 5, 6, 7, 8] },
  { label: 'Row 2 (Port 9-16)', ports: [9, 10, 11, 12, 13, 14, 15, 16] },
  { label: 'Row 3 (Port 17-24)', ports: [17, 18, 19, 20, 21, 22, 23, 24] },
  { label: 'Row 4 (Port 25-32)', ports: [25, 26, 27, 28, 29, 30, 31, 32] },
  { label: 'Row 5 (Port 33-40)', ports: [33, 34, 35, 36, 37, 38, 39, 40] },
  { label: 'Row 6 (Port 41-48)', ports: [41, 42, 43, 44, 45, 46, 47, 48] }
];

// =====================================================
// HUAWEI PORT LAYOUT
// =====================================================
const HUAWEI_LAYOUT = [
  { label: 'Row 1 (Port 1-12)', ports: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { label: 'Row 2 (Port 13-24)', ports: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24] },
  { label: 'Row 3 (Port 25-36)', ports: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36] },
  { label: 'Row 4 (Port 37-48)', ports: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48] }
];

// =====================================================
// RENDER CISCO/HUAWEI PANEL
// =====================================================
export async function renderPanelView(device, container) {
  const typeName = device.device_types?.name || device.type_name || 'OTHER';
  const isCisco  = typeName === 'CISCO';
  const isHuawei = typeName === 'HUAWEI';

  container.innerHTML = `
    <div class="skeleton" style="height:400px;border-radius:var(--radius-xl)"></div>
  `;

  try {
    const ports = await PortsAPI.getByDevice(device.id);
    const portMap = {};
    ports.forEach(p => { portMap[p.port_number] = p; });

    const layout = isCisco ? CISCO_LAYOUT : isHuawei ? HUAWEI_LAYOUT : generateLayout(device.total_ports);
    const deviceColor = isCisco ? 'var(--color-cisco)' : 'var(--color-huawei)';
    const deviceGlow  = isCisco ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)';

    container.innerHTML = `
      <div class="device-panel fade-in">
        <div class="device-panel__rack" style="border-color:${deviceColor}33">
          
          <!-- Rack face plate top label -->
          <div style="
            display:flex;justify-content:space-between;align-items:center;
            margin-bottom:12px;padding:0 4px;
          ">
            <div style="
              font-family:var(--font-mono);font-size:0.65rem;
              color:${deviceColor};font-weight:700;letter-spacing:0.1em;
            ">${device.name} — ${typeName}</div>
            <div style="
              font-size:0.6rem;color:var(--color-text-muted);
              font-family:var(--font-mono);
            ">${ports.filter(p => p.status === 'filled').length}/${ports.length} PORT TERISI</div>
          </div>

          <!-- LED strip -->
          <div style="
            height:3px;
            background:linear-gradient(90deg, transparent, ${deviceColor}, ${deviceColor}, transparent);
            border-radius:var(--radius-full);
            margin-bottom:12px;
            opacity:0.6;
          "></div>

          <!-- Port Rows -->
          ${layout.map(row => `
            <div style="margin-bottom:10px;">
              <div class="panel-row-label">${row.label}</div>
              <div class="panel-row">
                ${row.ports.map(portNum => {
                  const port = portMap[portNum];
                  const status = port?.status || 'empty';
                  const label = port?.connection_label || '';
                  const detail = port?.connection_detail || '';
                  const shortLabel = label.length > 8 ? label.slice(0, 7) + '…' : label;

                  return `
                    <div class="panel-port ${status}"
                         onclick="handlePanelPortClick('${device.id}', '${port?.id || ''}', ${portNum})"
                         title="${label || ('Port ' + portNum)}${detail ? ' (' + detail + ')' : ''}"
                         id="panel-port-${device.id}-${portNum}"
                         data-port-num="${portNum}"
                         data-status="${status}">
                      <div class="panel-port__connector"></div>
                      <div class="panel-port__num">${formatPort(portNum)}</div>
                      ${label ? `<div class="panel-port__label">${shortLabel}</div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}

          <!-- Bottom LED -->
          <div style="
            height:2px;
            background:linear-gradient(90deg, transparent, ${deviceColor}, transparent);
            border-radius:var(--radius-full);
            margin-top:8px;
            opacity:0.4;
          "></div>
        </div>

        <!-- Port Count Summary -->
        <div style="padding:16px 20px;border-top:1px solid var(--color-border);">
          <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;">
            ${renderPortLegend()}
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    console.error('[Panel] Error:', err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Gagal memuat panel</div>
        <div class="empty-state__desc">${err.message}</div>
      </div>
    `;
  }
}

// =====================================================
// GENERATE GENERIC LAYOUT
// =====================================================
function generateLayout(totalPorts) {
  const PORTS_PER_ROW = 12;
  const rows = [];
  for (let i = 0; i < totalPorts; i += PORTS_PER_ROW) {
    const start = i + 1;
    const end = Math.min(i + PORTS_PER_ROW, totalPorts);
    rows.push({
      label: `Row (Port ${start}-${end})`,
      ports: Array.from({ length: end - start + 1 }, (_, j) => start + j)
    });
  }
  return rows;
}

// =====================================================
// RENDER PORT LEGEND
// =====================================================
function renderPortLegend() {
  const items = [
    { color: 'var(--color-filled)',    label: 'Terisi' },
    { color: 'var(--color-text-muted)', label: 'Kosong', dashed: true },
    { color: 'var(--color-unverified)', label: 'Belum Verifikasi' },
    { color: 'var(--color-reserved)',   label: 'Reservasi' }
  ];
  return items.map(item => `
    <div style="display:flex;align-items:center;gap:6px;">
      <div style="
        width:10px;height:10px;border-radius:50%;
        background:${item.color};flex-shrink:0;
        ${item.dashed ? 'opacity:0.4;' : ''}
      "></div>
      <span style="font-size:0.72rem;color:var(--color-text-muted);">${item.label}</span>
    </div>
  `).join('');
}

// =====================================================
// HANDLE PANEL PORT CLICK
// =====================================================
window.handlePanelPortClick = function(deviceId, portId, portNumber) {
  vibrate([8]);
  showPortModal(deviceId, portId || null, portNumber, null, 'panel');
};

// =====================================================
// UPDATE PANEL PORT IN DOM
// =====================================================
export function updatePanelPort(deviceId, portNumber, portData) {
  const portEl = document.getElementById(`panel-port-${deviceId}-${portNumber}`);
  if (!portEl) return;

  portEl.className = `panel-port ${portData.status}`;
  portEl.setAttribute('data-status', portData.status);

  // Update connector
  const connector = portEl.querySelector('.panel-port__connector');
  if (connector) {
    connector.style.background = portData.status === 'filled' ? 'var(--color-filled)' : '';
    connector.style.boxShadow = portData.status === 'filled' ? '0 0 6px var(--color-filled)' : '';
  }

  // Update label
  let labelEl = portEl.querySelector('.panel-port__label');
  const label = portData.connection_label || '';
  const shortLabel = label.length > 8 ? label.slice(0, 7) + '…' : label;

  if (label) {
    if (!labelEl) {
      labelEl = document.createElement('div');
      labelEl.className = 'panel-port__label';
      portEl.appendChild(labelEl);
    }
    labelEl.textContent = shortLabel;
  } else {
    labelEl?.remove();
  }

  // Update title
  portEl.title = label || `Port ${portNumber}`;

  // Flash animation
  portEl.style.transform = 'scale(1.2)';
  portEl.style.zIndex = '10';
  setTimeout(() => {
    portEl.style.transform = '';
    portEl.style.zIndex = '';
  }, 250);
}
