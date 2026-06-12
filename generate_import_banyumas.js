// generate_import_banyumas.js
// Membaca Excel dan menghasilkan SQL per perangkat
const XLSX = require('xlsx');
const wb = XLSX.readFile('Data Otb-Gtgo-Cisco Banyumas.xlsx');

const lines = [];
lines.push(`BEGIN;`);
lines.push(`DO $$`);
lines.push(`DECLARE`);
lines.push(`  v_site_id uuid;`);
lines.push(`  v_type_id uuid;`);
lines.push(`  v_dev_id  uuid;`);
lines.push(`  v_tube_id uuid;`);
lines.push(`BEGIN`);
lines.push(`  -- Cek/buat site Banyumas`);
lines.push(`  SELECT id INTO v_site_id FROM sites WHERE code = 'BMS' LIMIT 1;`);
lines.push(`  IF v_site_id IS NULL THEN`);
lines.push(`    v_site_id := gen_random_uuid();`);
lines.push(`    INSERT INTO sites (id,name,code,location,is_active)`);
lines.push(`    VALUES (v_site_id,'Banyumas','BMS','Jawa Tengah',true);`);
lines.push(`  END IF;`);
lines.push(``);
lines.push(`  -- Fix Schema Bug: Hapus SEMUA foreign key dari tabel log ke entitas utama
  ALTER TABLE IF EXISTS port_audit_log DROP CONSTRAINT IF EXISTS port_audit_log_port_id_fkey;
  ALTER TABLE IF EXISTS port_audit_log DROP CONSTRAINT IF EXISTS port_audit_log_device_id_fkey;
  ALTER TABLE IF EXISTS port_audit_log DROP CONSTRAINT IF EXISTS port_audit_log_site_id_fkey;
  ALTER TABLE IF EXISTS port_audit_log DROP CONSTRAINT IF EXISTS port_audit_log_tube_id_fkey;

  ALTER TABLE IF EXISTS device_audit_log DROP CONSTRAINT IF EXISTS device_audit_log_device_id_fkey;
  ALTER TABLE IF EXISTS device_audit_log DROP CONSTRAINT IF EXISTS device_audit_log_site_id_fkey;

  ALTER TABLE IF EXISTS tube_audit_log DROP CONSTRAINT IF EXISTS tube_audit_log_tube_id_fkey;
  ALTER TABLE IF EXISTS tube_audit_log DROP CONSTRAINT IF EXISTS tube_audit_log_device_id_fkey;

  -- Hapus data lama agar tidak duplicate key
  DELETE FROM devices 
  WHERE site_id = v_site_id 
    AND name IN ('OTB 1 96', 'OTB 2 96', 'OTB 3 144', 'CISCO', 'HUAWEI', 'GTGO OLT');`);
lines.push(``);

const q = (s) => s == null ? 'NULL' : `'${String(s).replace(/'/g,"''").trim()}'`;

// ================================================================
// HELPER: parse OTB sheet (96 or 144 core)
// ================================================================
function parseOTB(sheetName) {
  const sh = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {header:1, defval:null});
  const ports = []; // [{port_number, core_label, connection_label, tube_number}]

  for (let i = 0; i < sh.length - 1; i++) {
    const row = sh[i];
    if (!row) continue;
    // Detect core label row: first cell = tube number (int), rest = CORE X strings
    const firstCell = row[0];
    if (typeof firstCell === 'number' && firstCell >= 1) {
      const tubeNum = firstCell;
      const coreRow = row;
      const connRow = sh[i + 1] || [];
      // Port numbers come from the header row above (row with 'No' or numbered)
      // We find the "No" row by looking backwards
      let portNumRow = null;
      for (let k = i - 1; k >= 0; k--) {
        if (sh[k] && (sh[k][0] === 'No' || sh[k][0] === 'NO Tube')) {
          portNumRow = sh[k];
          break;
        }
      }
      for (let col = 1; col < coreRow.length; col++) {
        const coreLabel = coreRow[col];
        if (!coreLabel) continue;
        const portNum = portNumRow ? portNumRow[col] : null;
        const connLabel = connRow[col];
        ports.push({
          port_number: typeof portNum === 'number' ? portNum : null,
          core_label: String(coreLabel).trim(),
          connection_label: connLabel ? String(connLabel).trim() : null,
          tube_number: tubeNum
        });
      }
    }
  }
  return ports;
}

// ================================================================
// HELPER: extract port number for OTB sheets (port col index = actual port)
// In OTB 1 & 2 (96): ports numbered 1-24 across 4 rows
// In OTB 3 (144): ports numbered 1-12 across 12 rows
// We use positional ordering per tube since port nums are in "No" row
// ================================================================
function parseOTBFull(sheetName) {
  const sh = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {header:1, defval:null});
  const result = []; // {tube_number, ports:[{port_number, core_label, conn_label}]}
  let portCounter = 1; // global counter

  for (let i = 0; i < sh.length - 1; i++) {
    const row = sh[i];
    if (!row) continue;
    const firstCell = row[0];
    // Core row: first cell is tube number (integer 1-12)
    if (typeof firstCell === 'number' && Number.isInteger(firstCell) && firstCell >= 1 && firstCell <= 12) {
      const tubeNum = firstCell;
      const coreRow = row;
      const connRow = sh[i + 1] || [];
      // Find port number row: the row before with 'No' or 'NO Tube' header
      let portNumRow = null;
      for (let k = i - 1; k >= 0; k--) {
        const candidate = sh[k];
        if (candidate && (candidate[0] === 'No' || candidate[0] === 'NO Tube')) {
          portNumRow = candidate;
          break;
        }
      }
      const tubePorts = [];
      for (let col = 1; col < coreRow.length; col++) {
        const coreLabel = coreRow[col];
        if (!coreLabel) continue;
        const connLabel = connRow[col] ? String(connRow[col]).trim() : null;
        tubePorts.push({
          core_label: String(coreLabel).trim(),
          connection_label: connLabel,
        });
      }
      result.push({ tube_number: tubeNum, ports: tubePorts });
    }
  }
  
  // Sort tubes ascending so Tube 1 is first, then Tube 2, etc.
  result.sort((a, b) => a.tube_number - b.tube_number);
  
  // Assign global unique port numbers across the entire device
  let globalPortNum = 1;
  result.forEach(tube => {
    tube.ports.forEach(p => {
      p.port_number = globalPortNum++;
    });
  });

  return result;
}

// ================================================================
// OTB 1 96
// ================================================================
{
  const otbData = parseOTBFull('OTB 1 96');
  const totalPorts = otbData.reduce((s,t) => s + t.ports.length, 0);
  lines.push(`  -- ==============================`);
  lines.push(`  -- OTB 1 96`);
  lines.push(`  -- ==============================`);
  lines.push(`  SELECT id INTO v_type_id FROM device_types WHERE name='OTB' LIMIT 1;`);
  lines.push(`  v_dev_id := gen_random_uuid();`);
  lines.push(`  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)`);
  lines.push(`  VALUES(v_dev_id,v_site_id,v_type_id,'OTB 1 96',${totalPorts},true);`);
  lines.push(``);

  otbData.forEach(tube => {
    lines.push(`  v_tube_id := gen_random_uuid();`);
    lines.push(`  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)`);
    lines.push(`  VALUES(v_tube_id,v_dev_id,${tube.tube_number},${tube.ports.length});`);
    const vals = tube.ports.map(p =>
      `    (v_dev_id,v_tube_id,${p.port_number},${q(p.core_label)},${q(p.connection_label)},${p.connection_label ? "'filled'" : "'empty'"})`
    );
    lines.push(`  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES`);
    lines.push(vals.join(',\n') + ';');
    lines.push(``);
  });
}

// ================================================================
// OTB 2 96
// ================================================================
{
  const otbData = parseOTBFull('OTB 2 96');
  const totalPorts = otbData.reduce((s,t) => s + t.ports.length, 0);
  lines.push(`  -- ==============================`);
  lines.push(`  -- OTB 2 96`);
  lines.push(`  -- ==============================`);
  lines.push(`  SELECT id INTO v_type_id FROM device_types WHERE name='OTB' LIMIT 1;`);
  lines.push(`  v_dev_id := gen_random_uuid();`);
  lines.push(`  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)`);
  lines.push(`  VALUES(v_dev_id,v_site_id,v_type_id,'OTB 2 96',${totalPorts},true);`);
  lines.push(``);

  otbData.forEach(tube => {
    lines.push(`  v_tube_id := gen_random_uuid();`);
    lines.push(`  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)`);
    lines.push(`  VALUES(v_tube_id,v_dev_id,${tube.tube_number},${tube.ports.length});`);
    const vals = tube.ports.map(p =>
      `    (v_dev_id,v_tube_id,${p.port_number},${q(p.core_label)},${q(p.connection_label)},${p.connection_label ? "'filled'" : "'empty'"})`
    );
    lines.push(`  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES`);
    lines.push(vals.join(',\n') + ';');
    lines.push(``);
  });
}

// ================================================================
// OTB 3 144
// ================================================================
{
  const otbData = parseOTBFull('OTB 3 144');
  const totalPorts = otbData.reduce((s,t) => s + t.ports.length, 0);
  lines.push(`  -- ==============================`);
  lines.push(`  -- OTB 3 144`);
  lines.push(`  -- ==============================`);
  lines.push(`  SELECT id INTO v_type_id FROM device_types WHERE name='OTB' LIMIT 1;`);
  lines.push(`  v_dev_id := gen_random_uuid();`);
  lines.push(`  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)`);
  lines.push(`  VALUES(v_dev_id,v_site_id,v_type_id,'OTB 3 144',${totalPorts},true);`);
  lines.push(``);

  otbData.forEach(tube => {
    lines.push(`  v_tube_id := gen_random_uuid();`);
    lines.push(`  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)`);
    lines.push(`  VALUES(v_tube_id,v_dev_id,${tube.tube_number},${tube.ports.length});`);
    const vals = tube.ports.map(p =>
      `    (v_dev_id,v_tube_id,${p.port_number},${q(p.core_label)},${q(p.connection_label)},${p.connection_label ? "'filled'" : "'empty'"})`
    );
    lines.push(`  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES`);
    lines.push(vals.join(',\n') + ';');
    lines.push(``);
  });
}

// ================================================================
// CISCO
// ================================================================
{
  const sh = XLSX.utils.sheet_to_json(wb.Sheets['CISCO'], {header:1, defval:null});
  // Row 3 = port pair headers, Row 4 = connections A, Row 5 = connections B
  const portHeaderRow = sh[3] || [];
  const connRowA = sh[4] || [];
  const connRowB = sh[5] || [];

  const ports = [];
  let maxPort = 0;
  const seenPorts = new Set();
  portHeaderRow.forEach((cell, col) => {
    if (!cell || typeof cell !== 'string' || !cell.includes('PORT')) return;
    const nums = cell.match(/\d+/g);
    if (!nums) return;
    const connA = connRowA[col] ? String(connRowA[col]).trim() : null;
    const connB = connRowB[col] ? String(connRowB[col]).trim() : null;
    
    let p1 = parseInt(nums[0]);
    let p2 = nums[1] ? parseInt(nums[1]) : null;
    
    // Fix copy-paste errors in Excel headers (e.g. PORT 1&2 repeats after 47&48)
    if (seenPorts.has(p1)) {
      p1 = maxPort + 1;
      p2 = maxPort + 2;
    }
    
    if (p1) {
      ports.push({ port_number: p1, core_label: `Port ${p1}`, connection_label: connA });
      seenPorts.add(p1);
      if (p1 > maxPort) maxPort = p1;
    }
    if (p2) {
      ports.push({ port_number: p2, core_label: `Port ${p2}`, connection_label: connB });
      seenPorts.add(p2);
      if (p2 > maxPort) maxPort = p2;
    }
  });

  // Sort by port number
  ports.sort((a,b) => a.port_number - b.port_number);

  lines.push(`  -- ==============================`);
  lines.push(`  -- CISCO`);
  lines.push(`  -- ==============================`);
  lines.push(`  SELECT id INTO v_type_id FROM device_types WHERE name='CISCO' LIMIT 1;`);
  lines.push(`  IF v_type_id IS NULL THEN SELECT id INTO v_type_id FROM device_types LIMIT 1; END IF;`);
  lines.push(`  v_dev_id := gen_random_uuid();`);
  lines.push(`  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)`);
  lines.push(`  VALUES(v_dev_id,v_site_id,v_type_id,'CISCO',48,true);`);
  const ciscoVals = ports.map(p =>
    `    (v_dev_id,${p.port_number},${q(p.core_label)},${q(p.connection_label)},${p.connection_label ? "'filled'" : "'empty'"})`
  );
  lines.push(`  INSERT INTO port_connections(device_id,port_number,core_label,connection_label,status) VALUES`);
  lines.push(ciscoVals.join(',\n') + ';');
  lines.push(``);
}

// ================================================================
// HUAWEI
// ================================================================
{
  const sh = XLSX.utils.sheet_to_json(wb.Sheets['HUAWEI'], {header:1, defval:null});
  const portHeaderRow = sh[3] || [];
  const connRowA = sh[4] || [];
  const connRowB = sh[5] || [];

  const ports = [];
  let maxPort = 0;
  const seenPorts = new Set();
  portHeaderRow.forEach((cell, col) => {
    if (!cell || typeof cell !== 'string' || !cell.includes('PORT')) return;
    const nums = cell.match(/\d+/g);
    if (!nums) return;
    const connA = connRowA[col] ? String(connRowA[col]).trim() : null;
    const connB = connRowB[col] ? String(connRowB[col]).trim() : null;
    
    let p1 = parseInt(nums[0]);
    let p2 = nums[1] ? parseInt(nums[1]) : null;
    
    if (seenPorts.has(p1)) {
      p1 = maxPort + 1;
      p2 = maxPort + 2;
    }
    
    if (p1) {
      ports.push({ port_number: p1, core_label: `Port ${p1}`, connection_label: connA });
      seenPorts.add(p1);
      if (p1 > maxPort) maxPort = p1;
    }
    if (p2) {
      ports.push({ port_number: p2, core_label: `Port ${p2}`, connection_label: connB });
      seenPorts.add(p2);
      if (p2 > maxPort) maxPort = p2;
    }
  });

  ports.sort((a,b) => a.port_number - b.port_number);

  lines.push(`  -- ==============================`);
  lines.push(`  -- HUAWEI`);
  lines.push(`  -- ==============================`);
  lines.push(`  SELECT id INTO v_type_id FROM device_types WHERE name='HUAWEI' LIMIT 1;`);
  lines.push(`  IF v_type_id IS NULL THEN SELECT id INTO v_type_id FROM device_types LIMIT 1; END IF;`);
  lines.push(`  v_dev_id := gen_random_uuid();`);
  lines.push(`  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)`);
  lines.push(`  VALUES(v_dev_id,v_site_id,v_type_id,'HUAWEI',56,true);`);
  const hwVals = ports.map(p =>
    `    (v_dev_id,${p.port_number},${q(p.core_label)},${q(p.connection_label)},${p.connection_label ? "'filled'" : "'empty'"})`
  );
  lines.push(`  INSERT INTO port_connections(device_id,port_number,core_label,connection_label,status) VALUES`);
  lines.push(hwVals.join(',\n') + ';');
  lines.push(``);
}

// ================================================================
// GTGO / OLT — dari DATA PORT PERANGKAT kolom GTGTO (E)
// Layout: 8 baris x 16 kolom, mulai dari slot 3 (1/3/1 dst)
// ================================================================
{
  const sh = XLSX.utils.sheet_to_json(wb.Sheets['DATA PORT PERANGKAT'], {header:1, defval:null});
  
  const gtgoPorts = [];
  for (let i = 4; i < sh.length; i++) {
    const row = sh[i] || [];
    const gtgoLabel = row[4]; // col E = GTGTO
    const otbNum   = row[1];
    const coreNum  = row[2];
    const keterangan = row[3];
    if (!gtgoLabel || typeof gtgoLabel !== 'string') continue;
    if (!gtgoLabel.match(/\d+\/\d+\/\d+/)) continue;
    gtgoPorts.push({
      port_label: gtgoLabel.trim(),
      core_label: coreNum ? String(coreNum).trim() : null,
      connection_label: keterangan ? String(keterangan).trim() : null,
      notes: otbNum ? `OTB ${otbNum}` : null
    });
  }

  // Assign port_number based on slot/port layout
  // Format: 1/slot/port → we sort by slot then port
  gtgoPorts.sort((a,b) => {
    const [,sa,pa] = a.port_label.split('/').map(Number);
    const [,sb,pb] = b.port_label.split('/').map(Number);
    return sa !== sb ? sa - sb : pa - pb;
  });
  
  // Assign sequential port numbers
  gtgoPorts.forEach((p, idx) => { p.port_number = idx + 1; });

  lines.push(`  -- ==============================`);
  lines.push(`  -- GTGO / OLT`);
  lines.push(`  -- ==============================`);
  lines.push(`  SELECT id INTO v_type_id FROM device_types WHERE name='GTGO' LIMIT 1;`);
  lines.push(`  IF v_type_id IS NULL THEN`);
  lines.push(`    SELECT id INTO v_type_id FROM device_types WHERE name='OLT' LIMIT 1;`);
  lines.push(`  END IF;`);
  lines.push(`  IF v_type_id IS NULL THEN SELECT id INTO v_type_id FROM device_types LIMIT 1; END IF;`);
  lines.push(`  v_dev_id := gen_random_uuid();`);
  lines.push(`  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)`);
  lines.push(`  VALUES(v_dev_id,v_site_id,v_type_id,'GTGO OLT',${gtgoPorts.length},true);`);
  const gtgoVals = gtgoPorts.map(p =>
    `    (v_dev_id,${p.port_number},${q(p.port_label)},${q(p.core_label)},${q(p.connection_label)},${q(p.notes)},${p.connection_label && p.connection_label !== 'KOSONG' ? "'filled'" : "'empty'"})`
  );
  lines.push(`  INSERT INTO port_connections(device_id,port_number,port_label,core_label,connection_label,notes,status) VALUES`);
  lines.push(gtgoVals.join(',\n') + ';');
  lines.push(``);
}

lines.push(`END $$;`);
lines.push(`COMMIT;`);

const fs = require('fs');
fs.writeFileSync('import_banyumas_full.sql', lines.join('\n'), 'utf8');
console.log('Done! import_banyumas_full.sql generated.');
