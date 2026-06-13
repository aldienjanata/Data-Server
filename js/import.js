// =====================================================
// IMPORT.JS - Excel Import/Export & Template
// =====================================================
import { SitesAPI, DevicesAPI, PortsAPI } from './supabase.js';
import { showToast } from './app.js';

// =====================================================
// RENDER IMPORT PAGE
// =====================================================
export async function renderImportPage(container) {
  container.innerHTML = `
    <div style="max-width:900px;margin:0 auto;">
      <div style="margin-bottom:var(--space-6)">
        <h1 style="font-size:1.5rem;font-weight:800;margin-bottom:4px">📥 Import & Export Data</h1>
        <p style="color:var(--color-text-muted);font-size:0.875rem">
          Import data dari Excel atau unduh template untuk diisi
        </p>
      </div>

      <!-- Quick Action Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:var(--space-4);margin-bottom:var(--space-6)">
        <!-- Download Template -->
        <div class="card" style="cursor:pointer;transition:all 0.2s" onclick="downloadTemplate()" 
             onmouseenter="this.style.borderColor='var(--color-primary)'"
             onmouseleave="this.style.borderColor=''">
          <div class="card__body" style="display:flex;align-items:flex-start;gap:var(--space-4)">
            <div style="width:48px;height:48px;background:linear-gradient(135deg,#10b981,#059669);border-radius:var(--radius-lg);display:grid;place-items:center;font-size:24px;flex-shrink:0">📋</div>
            <div>
              <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px">Unduh Template Excel</div>
              <div style="font-size:0.8rem;color:var(--color-text-muted)">Template kosong sesuai format OTB, CISCO, HUAWEI & GTGO</div>
              <div style="margin-top:var(--space-3)">
                <span class="badge badge-primary">Format Standar</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Import File -->
        <div class="card" style="cursor:pointer;transition:all 0.2s" onclick="document.getElementById('import-file-input').click()"
             onmouseenter="this.style.borderColor='var(--color-primary)'"
             onmouseleave="this.style.borderColor=''">
          <div class="card__body" style="display:flex;align-items:flex-start;gap:var(--space-4)">
            <div style="width:48px;height:48px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:var(--radius-lg);display:grid;place-items:center;font-size:24px;flex-shrink:0">📤</div>
            <div>
              <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px">Import dari Excel</div>
              <div style="font-size:0.8rem;color:var(--color-text-muted)">Upload file .xlsx untuk mengimpor data port ke database</div>
              <div style="margin-top:var(--space-3)">
                <span class="badge" style="background:rgba(59,130,246,0.15);color:#60a5fa">.xlsx .xls</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Export Data -->
        <div class="card" style="cursor:pointer;transition:all 0.2s" onclick="exportAllData()"
             onmouseenter="this.style.borderColor='var(--color-primary)'"
             onmouseleave="this.style.borderColor=''">
          <div class="card__body" style="display:flex;align-items:flex-start;gap:var(--space-4)">
            <div style="width:48px;height:48px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:var(--radius-lg);display:grid;place-items:center;font-size:24px;flex-shrink:0">📊</div>
            <div>
              <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px">Export Semua Data</div>
              <div style="font-size:0.8rem;color:var(--color-text-muted)">Ekspor seluruh data port ke Excel sesuai format aslinya</div>
              <div style="margin-top:var(--space-3)">
                <span class="badge" style="background:rgba(245,158,11,0.15);color:#fbbf24">Semua Site</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Zone -->
      <div class="card" style="margin-bottom:var(--space-5)">
        <div class="card__header">
          <div class="card__title">📤 Upload File Excel</div>
        </div>
        <div class="card__body">
          <input type="file" id="import-file-input" accept=".xlsx,.xls" style="display:none" onchange="handleFileSelect(event)">
          
          <div id="dropzone" class="dropzone" 
               onclick="document.getElementById('import-file-input').click()"
               ondragover="event.preventDefault();this.classList.add('drag-over')"
               ondragleave="this.classList.remove('drag-over')"
               ondrop="handleFileDrop(event)">
            <div class="dropzone__icon">📂</div>
            <div class="dropzone__text">Klik atau seret file Excel ke sini</div>
            <div class="dropzone__hint">Format: .xlsx atau .xls — Pastikan format sesuai template</div>
          </div>

          <!-- Import options -->
          <div style="margin-top:var(--space-4);display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
            <div class="form-group" style="margin:0">
              <label class="form-label">Site Tujuan</label>
              <select class="form-select" id="import-site-select">
                <option value="">— Pilih Site —</option>
              </select>
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label">Mode Import</label>
              <select class="form-select" id="import-mode">
                <option value="merge">Merge (tambah & update)</option>
                <option value="replace">Replace (hapus & ganti)</option>
                <option value="skip">Skip (lewati yang ada)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Area -->
      <div id="import-preview-area" style="display:none">
        <div class="card" style="margin-bottom:var(--space-5)">
          <div class="card__header">
            <div class="card__title">👁️ Preview Data</div>
            <div id="preview-summary" class="badge badge-primary"></div>
          </div>
          <div class="card__body" style="padding:0">
            <div id="preview-table-wrap" class="import-preview"></div>
          </div>
          <div class="card__body" style="display:flex;gap:var(--space-3);padding-top:0">
            <button class="btn btn-secondary" style="flex:1" onclick="cancelImport()">Batal</button>
            <button class="btn btn-primary" style="flex:2" id="confirm-import-btn" onclick="confirmImport()">
              ✅ Konfirmasi Import
            </button>
          </div>
        </div>
      </div>

      <!-- Import Log -->
      <div class="card">
        <div class="card__header">
          <div class="card__title">📝 Log Import</div>
        </div>
        <div class="card__body" style="padding:0">
          <div id="import-log" style="padding:var(--space-4);color:var(--color-text-muted);font-size:0.85rem;font-family:var(--font-mono)">
            Belum ada aktivitas import...
          </div>
        </div>
      </div>
    </div>
  `;

  // Load sites for select
  try {
    const sites = await SitesAPI.getAll();
    const sel = document.getElementById('import-site-select');
    sites.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });
  } catch (e) {
    console.warn('Could not load sites:', e);
  }

  // Register global handlers
  window.handleFileSelect = handleFileSelect;
  window.handleFileDrop = handleFileDrop;
  window.downloadTemplate = downloadTemplate;
  window.exportAllData = exportAllData;
  window.cancelImport = cancelImport;
  window.confirmImport = confirmImport;
}

// =====================================================
// FILE HANDLING
// =====================================================
let _parsedImportData = null;

function handleFileDrop(event) {
  event.preventDefault();
  document.getElementById('dropzone').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file) processFile(file);
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) processFile(file);
}

async function processFile(file) {
  addLog(`📂 Memproses file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

  if (!window.XLSX) {
    addLog('⏳ Memuat library Excel...');
    await loadXLSX();
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      addLog(`✅ File berhasil dibaca. Sheet: ${wb.SheetNames.join(', ')}`);
      _parsedImportData = parseWorkbook(wb);
      showPreview(_parsedImportData);
    } catch (err) {
      addLog(`❌ Error membaca file: ${err.message}`);
      showToast('Gagal membaca file Excel', 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

// =====================================================
// PARSE WORKBOOK - Sesuai format Excel Anda
// =====================================================
function parseWorkbook(wb) {
  const result = { devices: [], ports: [], totalPorts: 0 };

  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

    // Detect sheet type
    if (sheetName.toUpperCase().includes('OTB')) {
      parseOTBSheet(sheetName, rows, result);
    } else if (sheetName.toUpperCase().includes('CISCO')) {
      parsePairSheet('CISCO', sheetName, rows, result);
    } else if (sheetName.toUpperCase().includes('HUAWEI') || sheetName.toUpperCase().includes('HW')) {
      parsePairSheet('HUAWEI', sheetName, rows, result);
    } else if (sheetName.toUpperCase().includes('GTGO') || sheetName.toUpperCase().includes('DATA')) {
      parseGTGOSheet(sheetName, rows, result);
    } else {
      // Fallback for custom devices: parse as a generic pair sheet
      parsePairSheet(sheetName, sheetName, rows, result);
    }
  });

  return result;
}

function parseOTBSheet(sheetName, rows, result) {
  // Find device name from row 1
  const nameRow = rows[0] || [];
  const deviceName = nameRow.find(c => c && typeof c === 'string' && c.includes('OTB')) || sheetName;

  // Extract tube number and capacity from name (e.g. "DATA OTB 3 144" -> 144 cores)
  const totalCoresMatch = deviceName.toString().match(/\d+$/);
  const totalCores = totalCoresMatch ? parseInt(totalCoresMatch[0]) : 96;

  const device = {
    type: 'OTB',
    name: deviceName.replace('DATA ', '').trim(),
    totalPorts: totalCores,
    ports: []
  };

  // Parse rows: port header row (No, 1, 2, 3...) followed by core label row followed by connection row
  for (let i = 0; i < rows.length - 2; i++) {
    const row = rows[i];
    if (!row) continue;

    // Detect: header row starts with 'No' and has numbers
    if (row[0] === 'No' || (row[0] && typeof row[0] === 'string' && row[0].toLowerCase() === 'no')) {
      const portNumbers = row.slice(1).filter(v => v !== null && v !== undefined);
      const coreRow = rows[i + 1] || [];
      const connRow = rows[i + 2] || [];
      const tubeNum = coreRow[0]; // tube number is col A of core row

      portNumbers.forEach((portNum, colIdx) => {
        const colActual = colIdx + 1;
        const coreLabel = coreRow[colActual];
        const connLabel = connRow[colActual];

        if (coreLabel) {
          device.ports.push({
            port_number: parseInt(portNum) || (colIdx + 1),
            tube_number: tubeNum ? parseInt(tubeNum) : null,
            core_label: coreLabel ? coreLabel.toString().trim() : null,
            connection_label: connLabel ? connLabel.toString().trim() : null,
            status: connLabel ? 'filled' : 'empty'
          });
        }
      });
    }
  }

  result.devices.push(device);
  result.totalPorts += device.ports.length;
}

function parsePairSheet(type, sheetName, rows, result) {
  const device = { type, name: type, totalPorts: 0, ports: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    // Find port header row (PORT 1 & 2, PORT 3 & 4...)
    const portCells = row.slice(1).filter(c => c && typeof c === 'string' && c.toUpperCase().includes('PORT'));
    if (portCells.length > 0) {
      const connRow = rows[i + 1] || [];
      const connRow2 = rows[i + 2] || null;

      row.slice(1).forEach((cell, colIdx) => {
        if (!cell || !cell.toString().toUpperCase().includes('PORT')) return;

        const portLabel = cell.toString().trim();
        // Extract port numbers from "PORT 1 & 2"
        const nums = portLabel.match(/\d+/g);
        if (!nums) return;

        const conn1 = connRow[colIdx + 1];
        const conn2 = connRow2 ? connRow2[colIdx + 1] : null;
        const connLabel = [conn1, conn2].filter(Boolean).join(' / ');

        nums.forEach((num, ni) => {
          device.ports.push({
            port_number: parseInt(num),
            tube_number: null,
            core_label: `Port ${num}`,
            connection_label: ni === 0 ? (conn1 ? conn1.toString().trim() : null) : (conn2 ? conn2.toString().trim() : null),
            status: conn1 ? 'filled' : 'empty'
          });
        });
      });
    }
  }

  device.totalPorts = device.ports.length;
  result.devices.push(device);
  result.totalPorts += device.ports.length;
}

function parseGTGOSheet(sheetName, rows, result) {
  // Find GTGO section header row
  let headerRow = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    if (row.some(c => c && typeof c === 'string' && c.toUpperCase().includes('GTGTO') || c === 'GTGO' || c === 'GTGTO')) {
      headerRow = i;
      break;
    }
  }
  if (headerRow < 0) return;

  const device = { type: 'GTGO', name: 'GTGO', totalPorts: 0, ports: [] };

  // Parse rows after header
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    // GTGO data: OTB | CORE | KETERANGAN | GTGO_PORT
    // Find columns (1-indexed, col B=1 onwards)
    const otbCol = row[1], coreCol = row[2], keteranganCol = row[3], gtgoCol = row[4];
    if (!gtgoCol || typeof gtgoCol !== 'string') continue;
    if (!gtgoCol.match(/\d+\/\d+\/\d+/)) continue; // Must match X/Y/Z format

    device.ports.push({
      port_number: device.ports.length + 1,
      port_label: gtgoCol.trim(),
      tube_number: null,
      core_label: coreCol ? coreCol.toString().trim() : null,
      connection_label: keteranganCol ? keteranganCol.toString().trim() : null,
      source_otb: otbCol ? `OTB ${otbCol}` : null,
      status: keteranganCol ? 'filled' : 'empty'
    });
  }

  device.totalPorts = device.ports.length;
  if (device.ports.length > 0) {
    result.devices.push(device);
    result.totalPorts += device.ports.length;
  }
}

// =====================================================
// PREVIEW
// =====================================================
function showPreview(data) {
  const area = document.getElementById('import-preview-area');
  area.style.display = 'block';

  document.getElementById('preview-summary').textContent =
    `${data.devices.length} Perangkat | ${data.totalPorts} Port`;

  let html = '';
  data.devices.forEach(dev => {
    html += `
      <div style="padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--color-border)">
        <div style="font-weight:700;font-size:0.875rem;margin-bottom:var(--space-2)">
          ${getDeviceEmoji(dev.type)} ${dev.name}
          <span class="badge badge-primary" style="margin-left:8px">${dev.ports.length} port</span>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:0.78rem;min-width:500px">
            <thead>
              <tr style="background:var(--color-bg-elevated)">
                <th style="padding:6px 10px;text-align:left;color:var(--color-text-muted);font-weight:600;white-space:nowrap">Port #</th>
                ${dev.type === 'OTB' ? '<th style="padding:6px 10px;text-align:left;color:var(--color-text-muted);font-weight:600">Tube</th>' : ''}
                <th style="padding:6px 10px;text-align:left;color:var(--color-text-muted);font-weight:600">Core/Label</th>
                <th style="padding:6px 10px;text-align:left;color:var(--color-text-muted);font-weight:600">Koneksi/Tujuan</th>
                <th style="padding:6px 10px;text-align:left;color:var(--color-text-muted);font-weight:600">Status</th>
              </tr>
            </thead>
            <tbody>
              ${dev.ports.slice(0, 10).map(p => `
                <tr style="border-bottom:1px solid var(--color-border)">
                  <td style="padding:5px 10px;font-family:var(--font-mono)">${p.port_number || p.port_label || '-'}</td>
                  ${dev.type === 'OTB' ? `<td style="padding:5px 10px;font-family:var(--font-mono)">${p.tube_number || '-'}</td>` : ''}
                  <td style="padding:5px 10px;color:var(--color-text-secondary)">${p.core_label || '-'}</td>
                  <td style="padding:5px 10px;color:var(--color-filled)">${p.connection_label || '<span style="color:var(--color-text-muted)">Kosong</span>'}</td>
                  <td style="padding:5px 10px"><span class="badge badge-${p.status === 'filled' ? 'filled' : 'empty'}">${p.status === 'filled' ? 'Terisi' : 'Kosong'}</span></td>
                </tr>
              `).join('')}
              ${dev.ports.length > 10 ? `<tr><td colspan="5" style="padding:8px 10px;color:var(--color-text-muted);font-style:italic">... dan ${dev.ports.length - 10} port lainnya</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  document.getElementById('preview-table-wrap').innerHTML = html;
  addLog(`✅ Preview siap. ${data.devices.length} perangkat terdeteksi dengan total ${data.totalPorts} port.`);
}

function getDeviceEmoji(type) {
  return { OTB: '📦', CISCO: '🔌', HUAWEI: '📡', GTGO: '🔗' }[type] || '⚙️';
}

// =====================================================
// CONFIRM IMPORT
// =====================================================
async function confirmImport() {
  if (!_parsedImportData) return;

  const siteId = document.getElementById('import-site-select').value;
  if (!siteId) {
    showToast('Pilih site tujuan terlebih dahulu', 'warning');
    return;
  }

  const btn = document.getElementById('confirm-import-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  let totalImported = 0;
  let errors = 0;

  try {
    for (const devData of _parsedImportData.devices) {
      addLog(`⏳ Mengimport perangkat: ${devData.name}...`);

      try {
        // Find or create device
        const allDevices = await DevicesAPI.getBySite(siteId);
        let device = allDevices.find(d => d.name.toLowerCase() === devData.name.toLowerCase());

        if (!device) {
          // Get device type id
          const { DeviceTypesAPI } = await import('./supabase.js');
          const types = await DeviceTypesAPI.getAll();
          const devType = types.find(t => t.name === devData.type) || types[0];

          device = await DevicesAPI.create({
            site_id: siteId,
            device_type_id: devType.id,
            name: devData.name,
            total_ports: devData.totalPorts || devData.ports.length,
            is_active: true
          });
          addLog(`  ✅ Perangkat baru dibuat: ${device.name}`);
        }

        // Import ports
        const mode = document.getElementById('import-mode').value;
        const existingPorts = await PortsAPI.getByDevice(device.id);

        for (const portData of devData.ports) {
          const existing = existingPorts.find(p => p.port_number === portData.port_number);

          if (existing && mode === 'skip') continue;

          const payload = {
            device_id: device.id,
            port_number: portData.port_number,
            core_label: portData.core_label,
            connection_label: portData.connection_label,
            status: portData.status || 'empty',
            notes: portData.source_otb || null,
            updated_by: 'import'
          };

          if (existing && mode !== 'skip') {
            await PortsAPI.update(existing.id, payload);
          } else if (!existing) {
            await PortsAPI.create(payload);
          }
          totalImported++;
        }

        addLog(`  ✅ ${devData.ports.length} port dari ${devData.name} berhasil diimport`);

      } catch (devErr) {
        errors++;
        addLog(`  ❌ Error pada ${devData.name}: ${devErr.message}`);
      }
    }

    addLog(`\n🎉 SELESAI! Total ${totalImported} port diimport. ${errors > 0 ? errors + ' error.' : 'Tidak ada error.'}`);
    showToast(`✅ Import selesai: ${totalImported} port berhasil`, 'success');
    cancelImport();

  } catch (err) {
    addLog(`❌ Import gagal: ${err.message}`);
    showToast(`Import gagal: ${err.message}`, 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function cancelImport() {
  _parsedImportData = null;
  document.getElementById('import-preview-area').style.display = 'none';
  document.getElementById('import-file-input').value = '';
}

// =====================================================
// DOWNLOAD TEMPLATE
// =====================================================
export function downloadTemplate(specificTypeName = null, specificDeviceName = null) {
  if (!window.XLSX) {
    showToast('Memuat library Excel...', 'info');
    loadXLSX().then(() => downloadTemplate(specificTypeName, specificDeviceName));
    return;
  }

  const wb = XLSX.utils.book_new();

  const addOTBSheet = () => {
    const otbData = [
      [null, specificDeviceName || 'DATA OTB 1 96'],
      [], [],
      [null, 'NO', 'TUBE', 'CORE', 'TUJUAN'],
      [null, 1, 'BIRU', 'BIRU', '(isi tujuan/keterangan disini)'],
      [null, 2, 'BIRU', 'ORANYE', null]
    ];
    const ws = XLSX.utils.aoa_to_sheet(otbData);
    ws['!cols'] = Array(13).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(wb, ws, specificDeviceName ? specificDeviceName.substring(0,31) : 'OTB 1 96');
  };

  const addCiscoSheet = () => {
    const ciscoData = [
      [null, specificDeviceName || 'CISCO'],
      [], [],
      [null, 'PORT 1 & 2', 'PORT 3 & 4', 'PORT 5 & 6', 'PORT 7 & 8', 'PORT 9 & 10', 'PORT 11 & 12'],
      [null, '(isi koneksi)', null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ciscoData);
    ws['!cols'] = Array(7).fill({ wch: 20 });
    XLSX.utils.book_append_sheet(wb, ws, specificDeviceName ? specificDeviceName.substring(0,31) : 'CISCO');
  };

  const addHuaweiSheet = () => {
    const huaweiData = [
      [null, specificDeviceName || 'HUAWEI'],
      [], [],
      [null, 'PORT 1&2', 'PORT 3&4', 'PORT 5&6', 'PORT 7&8', 'PORT 9&10', 'PORT 11&12', 'PORT 13&14', 'PORT 15&16', 'PORT 17&18'],
      [null, '(isi koneksi)', null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
    ];
    const ws = XLSX.utils.aoa_to_sheet(huaweiData);
    ws['!cols'] = Array(10).fill({ wch: 20 });
    XLSX.utils.book_append_sheet(wb, ws, specificDeviceName ? specificDeviceName.substring(0,31) : 'HUAWEI');
  };

  const addGTGOSheet = () => {
    const gtgoData = [
      [null, specificDeviceName ? `DATA ${specificDeviceName}` : 'DATA GTGO'],
      [], [],
      [null, 'OTB', 'CORE', 'KETERANGAN', 'GTGO PORT'],
      [null, 1, 'CORE 50', '(nama lokasi)', '1/3/1'],
      [null, 2, 'CORE 40', '(nama lokasi)', '1/3/2'],
      [null, '(No OTB)', '(No Core)', '(Tujuan/Keterangan)', '(Slot/Port/Channel)'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(gtgoData);
    ws['!cols'] = [{ wch: 4 }, { wch: 8 }, { wch: 12 }, { wch: 28 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, specificDeviceName ? specificDeviceName.substring(0,31) : 'DATA GTGO-CISCO-HW');
  };

  if (!specificTypeName) {
    addOTBSheet();
    addCiscoSheet();
    addHuaweiSheet();
    addGTGOSheet();
  } else {
    if (specificTypeName === 'OTB') addOTBSheet();
    else if (specificTypeName === 'CISCO') addCiscoSheet();
    else if (specificTypeName === 'HUAWEI') addHuaweiSheet();
    else if (specificTypeName === 'GTGO' || specificTypeName === 'OLT') addGTGOSheet();
    else {
      const customData = [
        [null, specificDeviceName || specificTypeName],
        [], [],
        [null, 'PORT 1', 'PORT 2', 'PORT 3', 'PORT 4', 'PORT 5', 'PORT 6', 'PORT 7', 'PORT 8'],
        [null, '(isi koneksi)', null, null, null, null, null, null, null],
      ];
      const ws = XLSX.utils.aoa_to_sheet(customData);
      ws['!cols'] = Array(9).fill({ wch: 20 });
      XLSX.utils.book_append_sheet(wb, ws, (specificDeviceName || specificTypeName).substring(0,31));
    }
  }

  const guideData = [
    [null, 'PETUNJUK PENGISIAN TEMPLATE'],
    [],
    ['Catatan Penting:'],
    ['- Jangan mengubah struktur baris/kolom template'],
    ['- Isi keterangan/tujuan di sel di bawah label PORT'],
    ['- Kosongkan sel jika port tidak digunakan'],
    ['- Nama sheet HARUS mengandung: OTB, CISCO, HUAWEI, GTGO, atau sama dengan nama perangkat'],
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 28 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'PETUNJUK');

  const fileName = specificDeviceName ? `Template_${specificDeviceName.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx` : 'Template_ServerData.xlsx';
  XLSX.writeFile(wb, fileName);
  addLog(`📋 Template Excel berhasil diunduh: ${fileName}`);
  showToast('Template berhasil diunduh', 'success');
}

// =====================================================
// EXPORT ALL DATA
// =====================================================
export async function exportAllData() {
  if (!window.XLSX) await loadXLSX();

  addLog('⏳ Mengambil semua data dari database...');
  showToast('Menyiapkan export...', 'info');

  try {
    const sites = await SitesAPI.getAll();
    const wb = XLSX.utils.book_new();
    let totalExported = 0;

    for (const site of sites) {
      const devices = await DevicesAPI.getBySite(site.id);

      for (const device of devices) {
        const ports = await PortsAPI.getByDevice(device.id);
        totalExported += ports.length;

        const typeName = device.device_types?.name || 'OTHER';

        let sheetData = [];

        if (typeName === 'OTB') {
          sheetData = buildOTBExport(device, ports);
        } else {
          sheetData = buildPairExport(device, ports);
        }

        const wsName = `${site.name.substring(0,8)}_${device.name.substring(0,12)}`.replace(/[/\\?*[\]]/g, '_').substring(0, 31);
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!cols'] = Array(sheetData[0]?.length || 5).fill({ wch: 20 });
        XLSX.utils.book_append_sheet(wb, ws, wsName);
      }
    }

    if (wb.SheetNames.length === 0) {
      showToast('Tidak ada data untuk diekspor', 'warning');
      return;
    }

    const filename = `ServerData_Export_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    addLog(`✅ Export selesai! ${totalExported} port dari ${sites.length} site → ${filename}`);
    showToast(`✅ Export ${totalExported} port berhasil`, 'success');

  } catch (err) {
    addLog(`❌ Export gagal: ${err.message}`);
    showToast(`Export gagal: ${err.message}`, 'error');
  }
}

function buildOTBExport(device, ports) {
  const rows = [[`DATA ${device.name}`, ...Array(23).fill(null)], [null]];

  // Group by tube
  const byTube = {};
  ports.forEach(p => {
    const t = p.tube_number || 1;
    if (!byTube[t]) byTube[t] = [];
    byTube[t].push(p);
  });

  Object.entries(byTube).sort((a, b) => b[0] - a[0]).forEach(([tube, tubePorts]) => {
    tubePorts.sort((a, b) => a.port_number - b.port_number);
    const portNums = tubePorts.map(p => p.port_number);
    const coreLabels = tubePorts.map(p => p.core_label || `CORE ${p.port_number}`);
    const connLabels = tubePorts.map(p => p.connection_label || null);

    rows.push(['No', ...portNums]);
    rows.push([parseInt(tube), ...coreLabels]);
    rows.push([null, ...connLabels]);
  });

  return rows;
}

function buildPairExport(device, ports) {
  const portPairs = [];
  const portLabels = [];
  const portConns = [];

  ports.sort((a, b) => a.port_number - b.port_number);

  for (let i = 0; i < ports.length; i += 2) {
    const p1 = ports[i];
    const p2 = ports[i + 1];
    portPairs.push(`PORT ${p1.port_number}${p2 ? '&' + p2.port_number : ''}`);
    portConns.push(p1.connection_label || null);
  }

  return [
    [null, device.name],
    [], [],
    [null, ...portPairs],
    [null, ...portConns],
    [],
  ];
}

// =====================================================
// HELPERS
// =====================================================
function addLog(msg) {
  const log = document.getElementById('import-log');
  if (!log) return;
  const time = new Date().toLocaleTimeString('id-ID');
  log.innerHTML += `\n[${time}] ${msg}`;
  log.scrollTop = log.scrollHeight;
}

async function loadXLSX() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) return resolve();
    const s = document.createElement('script');
    s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Gagal memuat library XLSX'));
    document.head.appendChild(s);
  });
}
