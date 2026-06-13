// =====================================================
// PANELS.JS - CISCO/HUAWEI Port Panel Visual Module
// =====================================================
import { PortsAPI } from './supabase.js';
import { formatPort, vibrate } from './utils.js';
import { showPortModal } from './app.js';

// =====================================================
// CISCO PORT LAYOUT (sesuai Excel: 2 baris fisik)
// Baris atas: port ganjil (A), Baris bawah: port genap (B)
// Kolom 1-4: PORT 1&2, 3&4, 5&6, 7&8
// Kolom 5-13: PORT 31&32 ... 47&48
// =====================================================
const CISCO_LAYOUT = [
  { label: 'Baris A (Atas)',  ports: [1, 3, 5, 7, 31, 33, 35, 37, 39, 41, 43, 45, 47] },
  { label: 'Baris B (Bawah)', ports: [2, 4, 6, 8, 32, 34, 36, 38, 40, 42, 44, 46, 48] }
];

// =====================================================
// HUAWEI PORT LAYOUT (sesuai Excel: 2 baris)
// 28 kolom x 2 baris (PORT 1&2 ... 55&56)
// =====================================================
const HUAWEI_LAYOUT = [
  { label: 'Baris A (Atas)',  ports: Array.from({length:28}, (_,i) => i*2+1) },
  { label: 'Baris B (Bawah)', ports: Array.from({length:28}, (_,i) => i*2+2) }
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

    const layoutCols = parseInt(localStorage.getItem('layout_cols_' + device.id));
    const layoutRows = parseInt(localStorage.getItem('layout_rows_' + device.id));
    
    let layout;
    if (layoutCols && layoutRows) {
      layout = [];
      for (let r = 0; r < layoutRows; r++) {
        const rowPorts = [];
        for (let c = 0; c < layoutCols; c++) {
          rowPorts.push(r * layoutCols + c + 1);
        }
        layout.push({ label: `Row ${r+1}`, ports: rowPorts });
      }
    } else {
      layout = isCisco ? CISCO_LAYOUT : isHuawei ? HUAWEI_LAYOUT : generateLayout(device.total_ports || 48);
    }
    
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
            ">${ports.filter(p => p.status === 'filled').length}/${layout.reduce((acc, r) => acc + r.ports.length, 0)} PORT TERISI</div>
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
          <div style="overflow-x:auto; padding-bottom:12px;">
            ${layout.map(row => `
              <div style="display:flex; gap:8px;">
                ${row.ports.filter(portNum => portNum <= ports.length || portNum <= device.total_ports).map(portNum => {
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
                         data-status="${status}"
                         data-label="${label.toLowerCase()}"
                         style="flex-shrink:0;">
                      <div class="panel-port__connector"></div>
                      <div class="panel-port__num">${formatPort(portNum)}</div>
                      ${label ? `<div class="panel-port__label" style="font-weight:600">${shortLabel}</div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            `).join('')}
          </div>

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
  return [{
    label: 'All Ports',
    ports: Array.from({ length: totalPorts }, (_, j) => j + 1)
  }];
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

// =====================================================
// GTGO / OLT PANEL VIEW
// Layout: 8 baris (port 1-8 ke bawah) x 16 kolom
// Dimulai dari slot 3, format label: 1/slot/port
// =====================================================
export async function renderGTGOView(device, container) {
  container.innerHTML = `<div class="skeleton" style="height:300px;border-radius:var(--radius-xl)"></div>`;

  try {
    const ports = await PortsAPI.getByDevice(device.id);
    const portMap = {};
    ports.forEach(p => {
      // Index by port_label AND port_number for reliable lookup
      if (p.port_label) portMap[p.port_label] = p;
      portMap[String(p.port_number)] = p;
    });

    // Layout: slot 3-18 (16 slots) x port 1-8 (8 ports)
    const SLOTS = 16;
    const PORTS_PER_SLOT = 8;
    const START_SLOT = 3;
    const deviceColor = 'var(--color-primary)';

    let html = `
      <div class="device-panel fade-in">
        <div class="device-panel__rack" style="border-color:${deviceColor}33;overflow-x:auto;padding:var(--space-5)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="font-family:var(--font-mono);font-size:0.65rem;color:${deviceColor};font-weight:700;letter-spacing:0.1em">${device.name} — GTGO/OLT</div>
            <div style="font-size:0.6rem;color:var(--color-text-muted);font-family:var(--font-mono)">${ports.filter(p=>p.status==='filled').length}/${SLOTS*PORTS_PER_SLOT} PORT TERISI</div>
          </div>
          <div style="height:3px;background:linear-gradient(90deg,transparent,${deviceColor},transparent);border-radius:var(--radius-full);margin-bottom:16px;opacity:0.6"></div>
          
          <div style="display:grid;grid-template-columns:40px repeat(${SLOTS},1fr);gap:4px;min-width:${SLOTS*52+48}px">
            <!-- Header row -->
            <div></div>
            ${Array.from({length:SLOTS},(_,i)=>`
              <div style="text-align:center;font-size:0.6rem;font-family:var(--font-mono);color:${deviceColor};font-weight:700;padding:3px">Slot ${START_SLOT+i}</div>
            `).join('')}
    `;

    // Each port row (1-8)
    for (let port = 1; port <= PORTS_PER_SLOT; port++) {
      html += `<div style="display:contents">`;
      // Row label
      html += `<div style="display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-family:var(--font-mono);color:var(--color-text-muted);font-weight:700">P${port}</div>`;
      
      for (let slot = 0; slot < SLOTS; slot++) {
        const label = `1/${START_SLOT + slot}/${port}`;
        // Calculate the sequential port_number for this slot/port
        const calcPortNumber = slot * PORTS_PER_SLOT + port;
        // Look up by port_label first, then by calculated port_number
        const p = portMap[label] || ports.find(px => px.port_number === calcPortNumber);
        const status = p?.status || 'empty';
        const conn = p?.connection_detail || p?.connection_label || '';
        const shortConn = conn.length > 9 ? conn.slice(0,8)+'…' : conn;
        const isFilled = status === 'filled';
        const portId = p?.id || '';
        const portNum = p?.port_number || calcPortNumber;

        html += `
          <div class="panel-port ${status}"
               onclick="handlePanelPortClick('${device.id}','${portId}',${portNum},'${label}')"
               id="panel-port-${device.id}-${label.replace(/\//g,'-')}"
               title="${label}${conn ? ' → '+conn : ''}"
               data-status="${status}"
               data-label="${conn.toLowerCase()}"
               style="
                 border-radius:5px;
                 padding:4px 3px;
                 min-height:56px;
                 display:flex;flex-direction:column;
                 align-items:center;justify-content:center;
                 font-size:0.65rem;cursor:pointer;
                 transition:transform 0.1s;
                 background:${isFilled ? 'rgba(16,185,129,0.18)' : 'var(--color-bg-elevated)'};
                 border:1.5px solid ${isFilled ? 'var(--color-filled)' : 'var(--color-border)'};
               "
               onmouseenter="this.style.transform='scale(1.08)';this.style.zIndex='10'"
               onmouseleave="this.style.transform='';this.style.zIndex='1'">
            <div style="font-family:var(--font-mono);font-weight:800;color:${isFilled ? 'var(--color-filled)' : 'var(--color-text-primary)'}">${label}</div>
            ${isFilled ? `<div style="margin-top:2px;text-align:center;color:#f8fafc;word-break:break-word;line-height:1.2;font-weight:700;font-size:0.6rem">${shortConn}</div>` : ''}
          </div>
        `;
      }
      html += `</div>`;
    }

    html += `
          </div>
          <div style="height:2px;background:linear-gradient(90deg,transparent,${deviceColor},transparent);border-radius:var(--radius-full);margin-top:16px;opacity:0.4"></div>
        </div>
        <div style="padding:16px 20px;border-top:1px solid var(--color-border)">
          <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
            ${renderPortLegend()}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    window.handlePanelPortClick = async (deviceId, portId, portNumber, portLabel) => {
      const { showPortModal } = await import('./app.js');
      showPortModal(deviceId, portId || null, portNumber, null, 'panel', portLabel || null);
    };

  } catch(err) {
    container.innerHTML = `<div style="padding:40px;color:var(--color-danger)">Gagal memuat GTGO: ${err.message}</div>`;
  }
}

