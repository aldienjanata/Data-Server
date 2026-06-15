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
  { label: 'Baris A (Atas)',  ports: Array.from({length:24}, (_,i) => i*2+1), extra: [49, 51] },
  { label: 'Baris B (Bawah)', ports: Array.from({length:24}, (_,i) => i*2+2), extra: [50, 52] }
];

// =====================================================
// HUAWEI PORT LAYOUT (sesuai Excel: 2 baris)
// 24 kolom x 2 baris (PORT 1-48) + 8 extra port 100G
// =====================================================
const HUAWEI_LAYOUT = [
  { label: 'Baris A (Atas)',  ports: Array.from({length:24}, (_,i) => i*2+1), extra: [49, 51, 53, 55] },
  { label: 'Baris B (Bawah)', ports: Array.from({length:24}, (_,i) => i*2+2), extra: [50, 52, 54, 56] }
];

// =====================================================
// RENDER CISCO/HUAWEI PANEL
// =====================================================
export async function renderPanelView(device, container) {
  const typeName = device.device_types?.name || device.type_name || 'OTHER';
  const isCisco  = typeName === 'CISCO';
  const isHuawei = typeName === 'HUAWEI';
  const panelTotalPorts = isCisco ? 52 : isHuawei ? 56 : (device.total_ports || 48);

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
    if (isCisco) {
      layout = CISCO_LAYOUT;
    } else if (isHuawei) {
      layout = HUAWEI_LAYOUT;
    } else if (layoutCols && layoutRows) {
      layout = [];
      for (let r = 0; r < layoutRows; r++) {
        const rowPorts = [];
        for (let c = 0; c < layoutCols; c++) {
          rowPorts.push(r * layoutCols + c + 1);
        }
        layout.push({ label: `Row ${r+1}`, ports: rowPorts });
      }
    } else {
      layout = generateLayout(panelTotalPorts);
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
              font-size:0.6rem;color:${deviceColor};
              font-family:var(--font-mono);font-weight:600;
            ">
              ${(() => {
                const mainTotal = layout.reduce((acc, r) => acc + r.ports.length, 0);
                const extraTotal = layout.reduce((acc, r) => acc + (r.extra ? r.extra.length : 0), 0);
                const mainFilled = ports.filter(p => p.status === 'filled' && layout.some(r => r.ports.includes(p.port_number))).length;
                const extraFilled = ports.filter(p => p.status === 'filled' && layout.some(r => r.extra && r.extra.includes(p.port_number))).length;
                
                let text = `${mainFilled}/${mainTotal} PORT TERISI`;
                if (extraTotal > 0) {
                  text += ` &nbsp;|&nbsp; ${extraFilled}/${extraTotal} PORT TERISI (100G)`;
                }
                return text;
              })()}
            </div>
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
                ${row.ports.filter(portNum => portNum <= ports.length || portNum <= panelTotalPorts).map(portNum => {
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
                ${row.extra && row.extra.length > 0 ? `
                  <div style="width:24px;flex-shrink:0;border-left:2px dashed rgba(255,255,255,0.1);margin-left:4px;margin-right:4px;"></div>
                  ${row.extra.filter(portNum => portNum <= ports.length || portNum <= panelTotalPorts).map((portNum, idx) => {
                    const port = portMap[portNum];
                    const status = port?.status || 'empty';
                    const label = port?.connection_label || '';
                    const detail = port?.connection_detail || '';
                    const shortLabel = label.length > 8 ? label.slice(0, 7) + '…' : label;
                    const displayNum = idx * 2 + (row.label.includes('Atas') ? 1 : 2);

                    return `
                      <div class="panel-port ${status}"
                           onclick="handlePanelPortClick('${device.id}', '${port?.id || ''}', ${portNum})"
                           title="${label || ('Port 100G-' + displayNum)}${detail ? ' (' + detail + ')' : ''}"
                           id="panel-port-${device.id}-${portNum}"
                           data-port-num="${portNum}"
                           data-status="${status}"
                           data-label="${label.toLowerCase()}"
                           style="flex-shrink:0;">
                        <div class="panel-port__connector"></div>
                        <div class="panel-port__num">${displayNum}</div>
                        ${label ? `<div class="panel-port__label" style="font-weight:600">${shortLabel}</div>` : ''}
                      </div>
                    `;
                  }).join('')}
                ` : ''}
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
    { color: 'var(--color-text-muted)', label: 'Kosong', dashed: true }
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
      if (p.port_label) portMap[p.port_label] = p;
      portMap[String(p.port_number)] = p;
    });

    let SLOTS = 16;
    let START_SLOT = 3;
    let PORTS_PER_SLOT = 8;
    
    if (device.description && device.description.startsWith('{')) {
      try {
        const conf = JSON.parse(device.description);
        SLOTS = conf.slots || SLOTS;
        START_SLOT = conf.startSlot !== undefined ? conf.startSlot : START_SLOT;
        PORTS_PER_SLOT = conf.portsPerSlot || PORTS_PER_SLOT;
      } catch(e) {}
    } else {
      // Fallback for legacy devices
      const siteName = device.sites?.name || '';
      if (siteName === 'Kebumen') {
        SLOTS = 14;
        START_SLOT = 2;
      } else if (siteName === 'Banyumas') {
        SLOTS = 16;
        START_SLOT = 3;
      }
    }
    
    // Calculate stats based on what is actually rendered in the grid
    let realFilledCount = 0;
    for (let p = 1; p <= PORTS_PER_SLOT; p++) {
      for (let s = START_SLOT; s < START_SLOT + SLOTS; s++) {
        const label = `1/${s}/${p}`;
        const portNum = (s - START_SLOT) * PORTS_PER_SLOT + p;
        const pData = portMap[label] || portMap[String(portNum)];
        if (pData && pData.status === 'filled') realFilledCount++;
      }
    }

    const filledCount = realFilledCount;
    const totalPorts = SLOTS * PORTS_PER_SLOT;
    const pct = Math.round(filledCount / totalPorts * 100);

    // Single accent color - professional blue
    const ACCENT = '#3b82f6';
    const FILLED_COLOR = '#10b981';
    const UNVERIF_COLOR = '#f59e0b';
    const RESERVED_COLOR = '#8b5cf6';

    let html = `
      <div class="device-panel fade-in" style="overflow:hidden;border-radius:var(--radius-xl);border:1px solid var(--color-border)">

        <!-- Header -->
        <div style="
          display:flex;justify-content:space-between;align-items:center;
          padding:16px 20px;
          background:rgba(59,130,246,0.06);
          border-bottom:1px solid var(--color-border);
        ">
          <div>
            <div style="font-family:var(--font-mono);font-size:0.72rem;color:${ACCENT};font-weight:700;letter-spacing:0.08em">
              ${device.name} &nbsp;/&nbsp; OLT
            </div>
            <div style="font-size:0.68rem;color:var(--color-text-muted);margin-top:4px">
              Slot ${START_SLOT}–${START_SLOT + SLOTS - 1} &nbsp;·&nbsp; ${PORTS_PER_SLOT} PON/Slot &nbsp;·&nbsp; Total ${totalPorts} PON
            </div>
          </div>
        </div>

        <!-- Progress bar -->
        <div style="height:3px;background:rgba(255,255,255,0.06)">
          <div style="height:100%;width:${pct}%;background:${FILLED_COLOR};transition:width 0.6s ease"></div>
        </div>

        <!-- Grid -->
        <div style="overflow-x:auto;padding:12px 16px 0">
          <div style="display:grid;grid-template-columns:36px repeat(${SLOTS},1fr);gap:2px;min-width:${SLOTS*54+44}px">

            <!-- Slot headers -->
            <div></div>
            ${Array.from({length:SLOTS}, (_,i) => {
              const slotNum = START_SLOT + i;
              return `
                <div style="
                  text-align:center;padding:4px 2px 5px;
                  border-bottom:2px solid ${ACCENT}44;
                ">
                  <div style="font-size:0.6rem;font-family:var(--font-mono);color:${ACCENT};font-weight:700">S${slotNum}</div>
                </div>
              `;
            }).join('')}
    `;

    // Port rows 1–8
    for (let port = 1; port <= PORTS_PER_SLOT; port++) {
      // Row label
      html += `
        <div style="
          display:flex;align-items:center;justify-content:center;
          font-size:0.6rem;font-family:var(--font-mono);
          color:var(--color-text-muted);font-weight:600;
        ">P${port}</div>
      `;

      for (let slot = 0; slot < SLOTS; slot++) {
        const label = `1/${START_SLOT + slot}/${port}`;
        const calcPortNumber = slot * PORTS_PER_SLOT + port;
        const p = portMap[label] || ports.find(px => px.port_number === calcPortNumber);
        const status = p?.status || 'empty';
        const conn = p?.connection_detail || p?.connection_label || '';
        const shortConn = conn.length > 9 ? conn.slice(0, 8) + '…' : conn;
        const isFilled   = status === 'filled';
        const isReserved = status === 'reserved';
        const portId  = p?.id || '';
        const portNum = p?.port_number || calcPortNumber;

        let bg, borderColor, labelColor;
        if (isFilled)        { bg = `rgba(16,185,129,0.15)`;  borderColor = FILLED_COLOR;   labelColor = '#ffffff'; }
        else if (isReserved) { bg = `rgba(139,92,246,0.10)`;  borderColor = RESERVED_COLOR; labelColor = '#ffffff'; }
        else                 { bg = `rgba(255,255,255,0.04)`;  borderColor = 'rgba(255,255,255,0.15)'; labelColor = 'rgba(255,255,255,0.55)'; }

        html += `
          <div
            onclick="handlePanelPortClick('${device.id}','${portId}',${portNum},'${label}')"
            id="panel-port-${device.id}-${label.replace(/\//g,'-')}"
            title="${label}${conn ? ' → ' + conn : ' (Kosong)'}"
            data-status="${status}"
            data-label="${conn.toLowerCase()}"
            style="
              border-radius:4px;
              padding:6px 4px;
              min-height:60px;
              display:flex;flex-direction:column;
              align-items:center;justify-content:center;
              gap:4px;
              cursor:pointer;
              transition:all 0.12s ease;
              background:${bg};
              border:1px solid ${borderColor};
            "
            onmouseenter="this.style.transform='scale(1.08)';this.style.zIndex='10';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)'"
            onmouseleave="this.style.transform='';this.style.zIndex='';this.style.boxShadow=''">
            <div style="font-family:var(--font-mono);font-weight:900;font-size:0.8rem;color:${labelColor};line-height:1.1;text-align:center;text-shadow:0 1px 2px rgba(0,0,0,0.6)">${label}</div>
            ${isFilled ? `<div style="font-size:0.7rem;font-weight:700;color:#ffffff;text-align:center;line-height:1.2;width:100%;word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 1px 2px rgba(0,0,0,0.6)">${conn || '—'}</div>` : ''}
            ${p?.notes ? `<div style="font-size:0.5rem;font-weight:800;color:#fcd34d;text-align:center;line-height:1.2;margin-top:4px;max-width:100%;word-break:break-word;text-shadow:0 1px 2px rgba(0,0,0,0.6)" title="${p.notes}">${p.notes}</div>` : ''}
          </div>
        `;
      }
    }

    html += `
          </div>
        </div>

        <!-- Legend -->
        <div style="padding:10px 16px 14px;display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:4px">
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:${FILLED_COLOR}"></div>
            <span style="font-size:0.68rem;color:var(--color-text-muted)">Terisi</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2)"></div>
            <span style="font-size:0.68rem;color:var(--color-text-muted)">Kosong</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:${RESERVED_COLOR}"></div>
            <span style="font-size:0.68rem;color:var(--color-text-muted)">Reservasi</span>
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
