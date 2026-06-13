// =====================================================
// OTB.JS - OTB Visual Display Module
// =====================================================
import { TubesAPI, PortsAPI } from './supabase.js';
import { formatPort, vibrate, getStatusLabel, FIBER_COLORS, getCoreColorIndex, getTubeColorIndex } from './utils.js';
import { showToast, showPortModal } from './app.js';
import { canEdit } from './auth.js';

// =====================================================
// RENDER OTB DEVICE VIEW (Custom Grids)
// =====================================================

export async function renderOTBView(device, container) {
  container.innerHTML = `
    <div class="otb-container stagger" id="otb-container">
      <div class="skeleton" style="height:200px;border-radius:var(--radius-xl)"></div>
    </div>
  `;

  try {
    const allPorts = await PortsAPI.getByDevice(device.id);
    
    // ── Enrich: for filled ports that link to another port but have no local detail/notes,
    //    fetch the target port's data so the cell displays the full info
    const filledWithTarget = allPorts.filter(p =>
      p.status === 'filled' && p.connection_target_port && (!p.connection_detail || !p.notes)
    );
    if (filledWithTarget.length > 0) {
      const fetches = filledWithTarget.map(p =>
        PortsAPI.getById(p.connection_target_port).catch(() => null)
      );
      const targetPorts = await Promise.all(fetches);
      targetPorts.forEach((tp, idx) => {
        if (!tp) return;
        const p = filledWithTarget[idx];
        const portInArray = allPorts.find(x => x.id === p.id);
        if (portInArray) {
          if (!portInArray.connection_detail && tp.connection_detail) portInArray.connection_detail = tp.connection_detail;
          if (!portInArray.notes && tp.notes) portInArray.notes = tp.notes;
        }
      });
    }
    
    const otbContainer = document.getElementById('otb-container');
    
    // Determine layout
    let cols = parseInt(localStorage.getItem('layout_cols_' + device.id));
    let rowsCount = parseInt(localStorage.getItem('layout_rows_' + device.id));
    
    const is144Default = device.model?.includes('144') || device.name?.includes('144') || allPorts.length === 144;
    if (!cols || !rowsCount) {
      cols = is144Default ? 12 : 24;
      rowsCount = is144Default ? 12 : 4;
    }
    
    const totalPorts = Math.max(allPorts.length, cols * rowsCount);

    // Create a 2D array for the grid [rows][cols]
    const grid = Array.from({ length: rowsCount }, () => Array(cols).fill(null));

    // Fill the grid based on layout rules
    for (let p = 1; p <= totalPorts; p++) {
      let r, c;
      let coreNumber;

      if (is144Default && !localStorage.getItem('layout_cols_' + device.id)) {
        // Default OTB 144 logic
        r = Math.floor((p - 1) / cols);
        c = (p - 1) % cols;
        coreNumber = (11 - r) * 12 + c + 1;
      } else {
        // Generic logic: bottom-up left-to-right
        r = Math.floor((p - 1) / cols);
        c = (p - 1) % cols;
        coreNumber = p;
      }

      const portData = allPorts.find(px => px.port_number === p) || {
        device_id: device.id, port_number: p, status: 'empty'
      };

      const visualRow = (is144Default && !localStorage.getItem('layout_cols_' + device.id)) ? r : (rowsCount - 1 - r);
      
      if (visualRow >= 0 && visualRow < rowsCount && c < cols) {
        grid[visualRow][c] = { portData, coreNumber };
      }
    }

    // Dynamic cell sizing: OTB 96 (24 cols) = larger cells, OTB 144 (12 cols) = medium
    const cellMinPx = cols >= 20 ? 64 : cols >= 12 ? 58 : 48;
    const fontSizeNum = cols >= 20 ? '0.85' : cols >= 12 ? '0.8' : '0.72';
    const labelFontSize = cols >= 20 ? '0.62' : cols >= 12 ? '0.55' : '0.5';

    // Render Grid
    let html = `
      <div class="card" style="overflow-x:auto;padding:var(--space-5)">
        <div style="min-width:${cols * cellMinPx}px;display:grid;grid-template-columns:repeat(${cols}, 1fr);gap:5px">
    `;

    for (let r = 0; r < rowsCount; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (!cell) { html += `<div></div>`; continue; }

        const p = cell.portData;
        const cn = cell.coreNumber;
        
        const coreColor = FIBER_COLORS[getCoreColorIndex(cn)];
        const tubeColor = FIBER_COLORS[getTubeColorIndex(cn)];

        const isFilled = p.status === 'filled';
        const opacity = isFilled ? '1' : '0.4';
        
        const label = p.connection_label || '';
        let formattedLabel = label;
        if (label.includes(' 1/')) {
          formattedLabel = label.replace(' 1/', '<br>1/');
        } else if (label.includes(' Port ')) {
          formattedLabel = label.replace(' Port ', '<br>Port ');
        }

        html += `
          <div class="otb-grid-cell" 
               onclick="handlePortClick('${device.id}', '${p.id || ''}', ${p.port_number})"
               id="port-cell-${p.id || p.port_number}"
               title="Port: ${p.port_number}\nCore: ${cn} (${tubeColor.name}/${coreColor.name})\n${label || 'Kosong'}${p.connection_detail ? '\n' + p.connection_detail : ''}${p.notes ? '\n' + p.notes : ''}"
               data-status="${p.status || 'empty'}"
               data-label="${label.toLowerCase()}"
               style="
                  aspect-ratio: 1 / 1;
                  min-height: 54px;
                  border: 2px solid ${tubeColor.hex};
                  background: ${isFilled ? coreColor.hex : 'transparent'};
                  color: ${isFilled ? coreColor.text : 'var(--color-text-secondary)'};
                  border-radius: 5px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  padding: 4px 2px;
                  box-sizing: border-box;
                  cursor: pointer;
                  transition: transform 0.1s;
                  opacity: ${opacity};
                  position: relative;
                  text-shadow: ${isFilled && coreColor.text === '#fff' ? '0 1px 4px rgba(0,0,0,0.9)' : isFilled ? '0 1px 2px rgba(255,255,255,0.8)' : 'none'};
                "
               onmouseenter="this.style.transform='scale(1.12)';this.style.zIndex='10'"
               onmouseleave="this.style.transform='scale(1)';this.style.zIndex='1'">
            
            ${!isFilled ? `<div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:${coreColor.hex}"></div>` : ''}
            
            <span style="font-size:${fontSizeNum}rem;font-weight:800;line-height:1">${p.port_number}</span>
            ${isFilled ? `
              <div style="font-size:${labelFontSize}rem;font-weight:700;margin-top:3px;line-height:1.2;width:100%;text-align:center;padding:0 2px;">
                ${formattedLabel}
                ${p.connection_detail ? `<div style="margin-top:2px;font-size:0.52rem;font-weight:700;color:${coreColor.text === '#fff' ? '#fff' : '#000'};word-break:break-word;line-height:1.1">${p.connection_detail}</div>` : ''}
                ${p.notes ? `<div style="margin-top:1px;font-size:0.42rem;font-weight:500;font-style:italic;color:${coreColor.text === '#fff' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)'};word-break:break-word;line-height:1.1">${p.notes}</div>` : ''}
              </div>
            ` : ''}
          </div>
        `;
      }
    }

    html += `
        </div>
        
        <!-- Legend -->
        <div style="margin-top:var(--space-6);padding-top:var(--space-4);border-top:1px solid var(--color-border);display:flex;gap:var(--space-4);flex-wrap:wrap;font-size:0.75rem">
          <div style="width:100%;font-weight:700;margin-bottom:8px">Urutan Warna Fiber (Tube/Core)</div>
          ${FIBER_COLORS.map((c, i) => `
            <div style="display:flex;align-items:center;gap:6px">
              <div style="width:12px;height:12px;background:${c.hex};border-radius:2px;border:1px solid rgba(255,255,255,0.2)"></div>
              <span>${i+1}. ${c.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    otbContainer.innerHTML = html;

  } catch (err) {
    console.error('[OTB] Error:', err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Gagal memuat OTB Grid</div>
        <div class="empty-state__desc">${err.message}</div>
      </div>
    `;
  }
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
window.handlePortClick = function(deviceId, portId, portNumber) {
  vibrate([8]);
  showPortModal(deviceId, portId, portNumber, null, 'otb');
};

// =====================================================
// UPDATE PORT CELL IN DOM (after save)
// =====================================================
export function updatePortCell(portId, portData) {
  // Since we changed the ID scheme, the easiest way to update the grid is to reload it.
  // The port data contains device_id.
  if (portData.device_id) {
    window.location.reload();
  }
}

// =====================================================
// RENDER TUBE STATS SUMMARY
// =====================================================
export function renderTubeStats() {
  return []; // Replaced by global device stats
}

// =====================================================
// EXPORT OTB DATA
// =====================================================
export async function exportOTBData(device) {
  try {
    const ports = await PortsAPI.getByDevice(device.id);

    const rows = [];
    ports.forEach(port => {
      rows.push({
        'Perangkat': device.name,
        'Port No': port.port_number,
        'Koneksi': port.connection_label || '',
        'Detail': port.connection_detail || '',
        'Status': getStatusLabel(port.status),
        'Catatan': port.notes || '',
        'Update': port.updated_at || ''
      });
    });

    return rows;
  } catch (err) {
    console.error('[OTB] Export error:', err);
    throw err;
  }
}
