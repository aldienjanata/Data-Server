const XLSX = require('xlsx');
const fs = require('fs');

const EXCEL_FILE = 'Data Otb-Gtgo-Cisco Banyumas.xlsx';
const OUTPUT_SQL = 'insert_banyumas.sql';

const wb = XLSX.readFile(EXCEL_FILE);

let sql = `BEGIN;
DO $$
DECLARE
  v_site_id uuid;
  v_type_id uuid;
  v_dev_id uuid;
  v_tube_id uuid;
BEGIN
  SELECT id INTO v_site_id FROM sites WHERE code = 'BMS' LIMIT 1;
  IF v_site_id IS NULL THEN
    v_site_id := gen_random_uuid();
    INSERT INTO sites (id, name, code, location) VALUES (v_site_id, 'Banyumas', 'BMS', 'Jawa Tengah');
  END IF;
`;

wb.SheetNames.forEach(sheetName => {
  const name = sheetName.trim();
  const up = name.toUpperCase();
  
  let typeCode = 'OTHER';
  if (up.includes('OTB')) typeCode = 'OTB';
  else if (up.includes('CISCO')) typeCode = 'CISCO';
  else if (up.includes('HUAWEI')) typeCode = 'HUAWEI';
  else if (up.includes('GTGO') || up.includes('OLT')) typeCode = 'OLT';

  let totalPorts = 48;
  if (up.includes('144')) totalPorts = 144;
  else if (up.includes('96')) totalPorts = 96;

  sql += `
  -- ==========================================
  -- DEVICE: ${name}
  -- ==========================================
  SELECT id INTO v_type_id FROM device_types WHERE name = '${typeCode}' LIMIT 1;
  IF v_type_id IS NULL THEN
     v_type_id := (SELECT id FROM device_types LIMIT 1); 
  END IF;
  
  v_dev_id := gen_random_uuid();
  INSERT INTO devices (id, site_id, device_type_id, name, total_ports) 
  VALUES (v_dev_id, v_site_id, v_type_id, '${name.replace(/'/g, "''")}', ${totalPorts});
`;

  let vals = [];
  
  if (typeCode === 'OTB') {
    const numTubes = totalPorts / 12;
    for (let t = 1; t <= numTubes; t++) {
      sql += `
  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, ${t}, 12);
`;
      for (let c = 1; c <= 12; c++) {
        // Port mapping depends on layout. 
        // We will just insert them sequentially, but the UI handles the visual layout based on port_number.
        // Wait! The UI maps by port_number.
        // OTB 96: Port 1 = Core 1, Tube 1.
        // OTB 144: Port 133 = Core 1, Tube 1.
        
        let coreNum = (t - 1) * 12 + c;
        let portNum = coreNum;
        
        if (totalPorts === 144) {
          // In 144, Tube 1 (Cores 1-12) are on ports 133-144.
          // row = 11 (bottom). 
          // So coreNum 1-12 => row 11 => port 133-144
          // Math: port = 144 - ((Math.ceil(coreNum/12)-1) * 24) ... actually let's just use the inverse of the UI logic.
          // The UI logic:
          // r = Math.floor((p - 1) / 12)
          // c = (p - 1) % 12
          // coreNumber = (11 - r) * 12 + c + 1
          // Solving for p:
          // coreNumber - 1 = (11 - r) * 12 + c
          // c = (coreNumber - 1) % 12
          // 11 - r = Math.floor((coreNumber - 1) / 12)  =>  r = 11 - Math.floor((coreNumber - 1) / 12)
          // p = r * 12 + c + 1
          
          let col = (coreNum - 1) % 12;
          let row = 11 - Math.floor((coreNum - 1) / 12);
          portNum = row * 12 + col + 1;
        }

        vals.push(`(v_dev_id, v_tube_id, ${portNum}, 'empty')`);
      }
    }
    sql += `  INSERT INTO port_connections (device_id, tube_id, port_number, status) VALUES \n    `;
    sql += vals.join(',\n    ') + ';\n';

  } else {
    for (let i = 1; i <= totalPorts; i++) {
      vals.push(`(v_dev_id, ${i}, 'empty')`);
    }
    sql += `  INSERT INTO port_connections (device_id, port_number, status) VALUES \n    `;
    sql += vals.join(',\n    ') + ';\n';
  }
});

sql += `END $$;\nCOMMIT;\n`;

fs.writeFileSync(OUTPUT_SQL, sql, 'utf8');
console.log('SQL Generated: ' + OUTPUT_SQL);
