import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envText.split('\n')
    .filter(line => line.includes('='))
    .map(line => { const i = line.indexOf('='); return [line.slice(0,i).trim(), line.slice(i+1).trim()]; })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const SITE_ID = '9b9cb380-5d3c-429c-9fd1-57d2ba5322da'; // Banyumas

async function getOrCreateType(typeMap, name, fallbackName) {
  if (typeMap[name]) return typeMap[name];
  
  // Try to insert with full required fields
  const { data, error } = await supabase.from('device_types').insert([{
    name,
    label: name,
    description: name,
    icon: 'server',
    color: '#6366f1',
    port_style: 'sequential'
  }]).select();
  
  if (error || !data || data.length === 0) {
    console.log(`  Type '${name}' insert failed (${error?.message}), using fallback '${fallbackName}'`);
    return typeMap[fallbackName];
  }
  
  console.log(`  Created type '${name}' with ID ${data[0].id}`);
  typeMap[name] = data[0].id;
  return data[0].id;
}

const newDevices = [
  {
    name: 'X86 Jadul BMS-01', typeName: 'CISCO', sort_order: 10, total_ports: 2,
    desc: JSON.stringify([{ label: "Ports", ports: [1,2] }]),
    portLabels: {}
  },
  {
    name: 'X86 BMS-02', typeName: 'CISCO', sort_order: 11, total_ports: 8,
    desc: JSON.stringify([{ label: "SFP+", ports: [1,2,3,4] }, { label: "Ethernet", ports: [5,6,7,8] }]),
    portLabels: {1:"SFP+ 1", 2:"SFP+ 2", 3:"SFP+ 3", 4:"SFP+ 4", 5:"ETH 1", 6:"ETH 2", 7:"ETH 3", 8:"ETH 4"}
  },
  {
    name: 'X86 BMS-03', typeName: 'CISCO', sort_order: 12, total_ports: 12,
    desc: JSON.stringify([{ label: "SFP+", ports: [1,2,3,4] }, { label: "ETH", ports: [5,6,7,8,9,10,11,12] }]),
    portLabels: {1:"SFP+ 1", 2:"SFP+ 2", 3:"SFP+ 3", 4:"SFP+ 4", 5:"ETH 1", 6:"ETH 2", 7:"ETH 3", 8:"ETH 4", 9:"ETH 5", 10:"ETH 6", 11:"ETH 7", 12:"ETH 8"}
  },
  {
    name: 'CCR2116-12S-4S+', typeName: 'CISCO', sort_order: 13, total_ports: 16,
    desc: JSON.stringify([{ label: "SFP+", ports: [1,2,3,4] }, { label: "GIGABIT ETHERNET", ports: Array.from({length:12},(_,i)=>i+5) }]),
    portLabels: Object.fromEntries([...Array.from({length:4},(_,i)=>[i+1,`SFP+ ${i+1}`]),...Array.from({length:12},(_,i)=>[i+5,`ETH ${i+1}`])])
  },
  {
    name: 'CWDM MUX DEMUX 8CH', typeName: 'CISCO', sort_order: 14, total_ports: 10,
    desc: JSON.stringify([{ label: "TX", ports: [1,2,3,4,5] }, { label: "RX", ports: [6,7,8,9,10] }]),
    portLabels: { 1:"TX 1470", 2:"TX 1510", 3:"TX 1550", 4:"TX 1590", 5:"TX RX", 6:"RX 1490", 7:"RX 1530", 8:"RX 1570", 9:"RX 1610", 10:"RX TX" }
  },
  {
    name: 'Ericsson 70060CX-32S', typeName: 'CISCO', sort_order: 15, total_ports: 32,
    desc: JSON.stringify([{ label: "Baris A (Atas)", ports: Array.from({length:16},(_,i)=>i*2+1) }, { label: "Baris B (Bawah)", ports: Array.from({length:16},(_,i)=>i*2+2) }]),
    portLabels: {}
  },
  {
    name: 'Server Facebook', typeName: 'CISCO', sort_order: 16, total_ports: 1,
    desc: JSON.stringify([{label:"Ports", ports:[1]}]),
    portLabels: {}
  },
  {
    name: 'Server YouTube', typeName: 'CISCO', sort_order: 17, total_ports: 1,
    desc: JSON.stringify([{label:"Ports", ports:[1]}]),
    portLabels: {}
  },
  {
    name: 'Server Tiktok', typeName: 'CISCO', sort_order: 18, total_ports: 1,
    desc: JSON.stringify([{label:"Ports", ports:[1]}]),
    portLabels: {}
  },
  {
    name: 'X86 Server Speedtest', typeName: 'CISCO', sort_order: 19, total_ports: 14,
    desc: JSON.stringify(Array.from({length:7}, (_,i) => ({ label: `Slot ${i+1}`, ports: [i*2+1, i*2+2] }))),
    portLabels: Object.fromEntries(Array.from({length:14}, (_,i) => [i+1, `Port ${(i%2)+1}`]))
  },
  {
    name: 'Server Proxmox', typeName: 'CISCO', sort_order: 20, total_ports: 2,
    desc: JSON.stringify([{label:"Ports", ports:[1,2]}]),
    portLabels: {}
  },
  {
    name: 'CCR1036-8G-2S+', typeName: 'CISCO', sort_order: 21, total_ports: 10,
    desc: JSON.stringify([{ label: "SFP+", ports: [1,2] }, { label: "ETH", ports: Array.from({length:8},(_,i)=>i+3) }]),
    portLabels: Object.fromEntries([...Array.from({length:2},(_,i)=>[i+1,`SFP+ ${i+1}`]),...Array.from({length:8},(_,i)=>[i+3,`ETH ${i+1}`])])
  },
  {
    name: 'DELL Server Speedtest', typeName: 'CISCO', sort_order: 22, total_ports: 2,
    desc: JSON.stringify([{label:"Ports", ports:[1,2]}]),
    portLabels: {}
  },
  {
    name: 'JUNIPER MX204', typeName: 'CISCO', sort_order: 23, total_ports: 6,
    desc: JSON.stringify([{ label: "Ports", ports: [1,2,3,4] }, { label: "Special", ports: [5,6] }]),
    portLabels: { 1:"Port 0", 2:"Port 1", 3:"Port 2", 4:"Port 3", 5:"MGMT Port", 6:"Bits" }
  },
  {
    name: 'X86 RO Dedicated', typeName: 'CISCO', sort_order: 24, total_ports: 7,
    desc: JSON.stringify([{ label: "SFP+", ports: [1,2] }, { label: "SFP++", ports: [3,4] }, { label: "Ethernet", ports: [5,6,7] }]),
    portLabels: { 1:"SFP+ 1", 2:"SFP+ 2", 3:"SFP++ 1", 4:"SFP++ 2", 5:"ETH 1", 6:"ETH 2", 7:"ETH 3" }
  }
];

async function run() {
  console.log('=== Seed Banyumas Devices ===');
  console.log('Site ID:', SITE_ID);

  // Get existing device_types
  const { data: existingTypes, error: typeErr } = await supabase.from('device_types').select('*');
  if (typeErr) { console.error('Cannot read device_types:', typeErr.message); return; }
  
  const typeMap = {};
  existingTypes.forEach(t => typeMap[t.name] = t.id);
  console.log('Known types:', Object.keys(typeMap).join(', '));

  // Get existing devices in Banyumas to skip duplicates
  const { data: existingDevs } = await supabase.from('devices').select('name').eq('site_id', SITE_ID);
  const existingNames = new Set((existingDevs || []).map(d => d.name));
  console.log('Existing devices:', [...existingNames].join(', ') || 'none');

  let created = 0;
  let skipped = 0;

  for (const dev of newDevices) {
    if (existingNames.has(dev.name)) {
      console.log(`SKIP (exists): ${dev.name}`);
      skipped++;
      continue;
    }

    const typeId = typeMap[dev.typeName];
    if (!typeId) {
      console.error(`ERROR: Type '${dev.typeName}' not found in DB! Skipping ${dev.name}`);
      continue;
    }

    console.log(`Creating: ${dev.name} (${dev.typeName})`);
    const { data: createdDev, error: devErr } = await supabase.from('devices').insert([{
      site_id: SITE_ID,
      device_type_id: typeId,
      name: dev.name,
      total_ports: dev.total_ports,
      description: dev.desc,
      sort_order: dev.sort_order,
      is_active: true
    }]).select();

    if (devErr || !createdDev || createdDev.length === 0) {
      console.error(`  ERROR inserting device '${dev.name}':`, devErr?.message || 'no data returned');
      continue;
    }

    const deviceId = createdDev[0].id;
    const portLabelKeys = Object.keys(dev.portLabels || {});
    const totalPorts = portLabelKeys.length > 0
      ? Math.max(...portLabelKeys.map(Number))
      : dev.total_ports;

    const ports = [];
    for (let i = 1; i <= totalPorts; i++) {
      ports.push({
        device_id: deviceId,
        port_number: i,
        status: 'empty',
        port_label: dev.portLabels[i] || null,
        updated_at: new Date().toISOString()
      });
    }

    if (ports.length > 0) {
      const { error: portErr } = await supabase.from('port_connections').insert(ports);
      if (portErr) {
        console.error(`  ERROR inserting ports for '${dev.name}':`, portErr.message);
      } else {
        console.log(`  Created ${ports.length} ports OK`);
      }
    }

    created++;
  }

  console.log(`\n=== DONE: ${created} devices created, ${skipped} skipped ===`);
}

run().catch(err => console.error('FATAL:', err.message));
