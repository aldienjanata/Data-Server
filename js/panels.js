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
      if (p.port_label) portMap[p.port_label] = p;
      portMap[String(p.port_number)] = p;
    });

    const SLOTS = 16;
    const PORTS_PER_SLOT = 8;
    const START_SLOT = 3;
    const filledCount = ports.filter(p => p.status === 'filled').length;
    const totalPorts = SLOTS * PORTS_PER_SLOT;
    const pct = Math.round(filledCount / totalPorts * 100);

    // Color palette per slot column for visual distinction
    const SLOT_COLORS = [
      '#6366f1','#8b5cf6','#ec4899','#f43f5e',
      '#f97316','#eab308','#22c55e','#10b981',
      '#06b6d4','#3b82f6','#6366f1','#a855f7',
      '#e11d48','#f59e0b','#84cc16','#14b8a6'
    ];

    let html = `
      <div class="device-panel fade-in" style="overflow:hidden">
        <!-- Header bar -->
        <div style="
          display:flex;justify-content:space-between;align-items:center;
          padding:14px 20px;
          background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08));
          border-bottom:1px solid rgba(99,102,241,0.2);
        ">
          <div>
            <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--color-primary);font-weight:700;letter-spacing:0.12em;text-transform:uppercase">
              ${device.name} &nbsp;·&nbsp; GTGO / OLT
            </div>
            <div style="font-size:0.65rem;color:var(--color-text-muted);margin-top:3px">
              Slot 3 – 18 &nbsp;|&nbsp; 8 PON per slot &nbsp;|&nbsp; Total ${totalPorts} PON
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.4rem;font-weight:800;color:var(--color-primary);line-height:1">${filledCount}</div>
            <div style="font-size:0.6rem;color:var(--color-text-muted);margin-top:1px">PON Terisi / ${totalPorts}</div>
          </div>
        </div>

        <!-- Progress bar -->
        <div style="height:4px;background:var(--color-bg-elevated)">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#6366f1,#10b981);transition:width 0.6s ease"></div>
        </div>

        <!-- Grid area -->
        <div style="overflow-x:auto;padding:16px 20px 8px">
          <div style="display:grid;grid-template-columns:48px repeat(${SLOTS},1fr);gap:3px;min-width:${SLOTS*58+56}px">
            <!-- Slot header row -->
            <div style="padding:4px;display:flex;align-items:flex-end;justify-content:center">
              <span style="font-size:0.55rem;color:var(--color-text-muted);font-family:var(--font-mono)">PON</span>
            </div>
            ${Array.from({length:SLOTS},(_,i) => {
              const slotNum = START_SLOT + i;
              const col = SLOT_COLORS[i];
              return `
                <div style="
                  text-align:center;padding:5px 3px;
                  background:${col}18;
                  border-radius:6px 6px 0 0;
                  border-top:3px solid ${col};
                ">
                  <div style="font-size:0.58rem;font-family:var(--font-mono);color:${col};font-weight:800">S${slotNum}</div>
                  <div style="font-size:0.5rem;color:${col}99;margin-top:1px">1/${slotNum}</div>
                </div>
              `;
            }).join('')}
    `;

    // Each port row (1-8)
    for (let port = 1; port <= PORTS_PER_SLOT; port++) {
      // Row label
      html += `
        <div style="
          display:flex;align-items:center;justify-content:center;
          font-size:0.62rem;font-family:var(--font-mono);
          color:var(--color-text-muted);font-weight:700;
          padding:3px;
        ">P${port}</div>
      `;

      for (let slot = 0; slot < SLOTS; slot++) {
        const label = `1/${START_SLOT + slot}/${port}`;
        const calcPortNumber = slot * PORTS_PER_SLOT + port;
        const p = portMap[label] || ports.find(px => px.port_number === calcPortNumber);
        const status = p?.status || 'empty';
        const conn = p?.connection_detail || p?.connection_label || '';
        const shortConn = conn.length > 10 ? conn.slice(0,9)+'…' : conn;
        const isFilled = status === 'filled';
        const portId = p?.id || '';
        const portNum = p?.port_number || calcPortNumber;
        const col = SLOT_COLORS[slot];
        const isUnverif = status === 'unverified';
        const isReserved = status === 'reserved';

        let bg, border, textColor;
        if (isFilled) {
          bg = `${col}22`;
          border = col;
          textColor = col;
        } else if (isUnverif) {
          bg = 'rgba(234,179,8,0.08)';
          border = '#eab308';
          textColor = '#eab308';
        } else if (isReserved) {
          bg = 'rgba(139,92,246,0.08)';
          border = '#8b5cf6';
          textColor = '#8b5cf6';
        } else {
          bg = 'var(--color-bg-elevated)';
          border = 'var(--color-border)';
          textColor = 'var(--color-text-muted)';
        }

        html += `
          <div
            onclick="handlePanelPortClick('${device.id}','${portId}',${portNum},'${label}')"
            id="panel-port-${device.id}-${label.replace(/\//g,'-')}"
            title="${label}${conn ? ' → '+conn : ' (Kosong)'}"
            data-status="${status}"
            data-label="${conn.toLowerCase()}"
            style="
              border-radius:5px;
              padding:5px 3px;
              min-height:60px;
              display:flex;flex-direction:column;
              align-items:center;justify-content:center;
              cursor:pointer;
              transition:all 0.15s ease;
              background:${bg};
              border:1.5px solid ${isFilled ? border : 'rgba(255,255,255,0.06)'};
              position:relative;
              gap:2px;
            "
            onmouseenter="this.style.transform='scale(1.1)';this.style.zIndex='10';this.style.border='1.5px solid ${col}';this.style.boxShadow='0 4px 12px ${col}33'"
            onmouseleave="this.style.transform='';this.style.zIndex='1';this.style.border='1.5px solid ${isFilled ? border : 'rgba(255,255,255,0.06)'}';this.style.boxShadow=''">
            ${isFilled ? `<div style="position:absolute;top:3px;right:3px;width:5px;height:5px;border-radius:50%;background:${col};box-shadow:0 0 5px ${col}"></div>` : ''}
            <div style="font-family:var(--font-mono);font-weight:800;font-size:0.6rem;color:${textColor};letter-spacing:-0.02em">${label}</div>
            ${isFilled ? `<div style="margin-top:1px;text-align:center;color:#e2e8f0;word-break:break-word;line-height:1.2;font-weight:600;font-size:0.55rem;max-width:100%;overflow:hidden">${shortConn || '—'}</div>` : ''}
          </div>
        `;
      }
    }

    html += `
          </div>
        </div>

        <!-- Legend -->
        <div style="padding:12px 20px 16px;border-top:1px solid var(--color-border);display:flex;gap:20px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:10px;height:10px;border-radius:50%;background:#6366f1;box-shadow:0 0 5px #6366f133"></div>
            <span style="font-size:0.7rem;color:var(--color-text-muted)">Terisi</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:10px;height:10px;border-radius:50%;background:var(--color-border);opacity:0.4"></div>
            <span style="font-size:0.7rem;color:var(--color-text-muted)">Kosong</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:10px;height:10px;border-radius:50%;background:#eab308"></div>
            <span style="font-size:0.7rem;color:var(--color-text-muted)">Belum Verifikasi</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:10px;height:10px;border-radius:50%;background:#8b5cf6"></div>
            <span style="font-size:0.7rem;color:var(--color-text-muted)">Reservasi</span>
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


