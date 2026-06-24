import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envText.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(p => p.trim()))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const newTypes = [
  { name: 'X86', icon: '/logos/X86.jpg', color: '#10b981' },
  { name: 'Mikrotik', icon: '/logos/Mikrotik.webp', color: '#3b82f6' },
  { name: 'CWDM', icon: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 6l4 6 4-6M8 18l4-6 4 6"/></svg>', color: '#f59e0b' },
  { name: 'Ericsson', icon: '/logos/Ericsson.webp', color: '#6366f1' },
  { name: 'Server Facebook', icon: '/logos/Facebook.webp', color: '#0ea5e9' },
  { name: 'Server YouTube', icon: '/logos/Youtube.webp', color: '#ef4444' },
  { name: 'Server Tiktok', icon: '/logos/Tiktok.webp', color: '#000000' },
  { name: 'Server Proxmox', icon: '/logos/X86.jpg', color: '#f97316' },
  { name: 'DELL Server', icon: '/logos/DELL.webp', color: '#06b6d4' },
  { name: 'JUNIPER', icon: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22h20L12 2z"/></svg>', color: '#8b5cf6' },
];

const newDevices = [
  // 1.X86 Jadul BMS-01 : 2 Port
  { 
    name: 'X86 Jadul BMS-01', type: 'X86', sort_order: 10, total_ports: 2, 
    desc: JSON.stringify([{ label: "Ports", ports: [1,2] }])
  },
  // 2.X86 BMS-02 : SFP+ 1-4, Ethernet 1-4
  { 
    name: 'X86 BMS-02', type: 'X86', sort_order: 11, total_ports: 8, 
    desc: JSON.stringify([
      { label: "SFP+", ports: [1,2,3,4] },
      { label: "Ethernet", ports: [5,6,7,8] }
    ]),
    portLabels: {1:"SFP+ 1", 2:"SFP+ 2", 3:"SFP+ 3", 4:"SFP+ 4", 5:"ETH 1", 6:"ETH 2", 7:"ETH 3", 8:"ETH 4"}
  },
  // 3.X86 BMS-03 : Port SFP+ 4 port 1-4, ETH 8 port 1-8
  { 
    name: 'X86 BMS-03', type: 'X86', sort_order: 12, total_ports: 12, 
    desc: JSON.stringify([
      { label: "SFP+", ports: [1,2,3,4] },
      { label: "ETH", ports: [5,6,7,8,9,10,11,12] }
    ]),
    portLabels: {1:"SFP+ 1", 2:"SFP+ 2", 3:"SFP+ 3", 4:"SFP+ 4", 5:"ETH 1", 6:"ETH 2", 7:"ETH 3", 8:"ETH 4", 9:"ETH 5", 10:"ETH 6", 11:"ETH 7", 12:"ETH 8"}
  },
  // 4.Mikrotik CCR2116-12S-4S+ : SFP+ 4 port 1-4, GIGABIT ETHERNET 12 port 1-12
  {
    name: 'CCR2116-12S-4S+', type: 'Mikrotik', sort_order: 13, total_ports: 16,
    desc: JSON.stringify([
      { label: "SFP+", ports: [1,2,3,4] },
      { label: "GIGABIT ETHERNET", ports: Array.from({length:12},(_,i)=>i+5) }
    ]),
    portLabels: Object.fromEntries([
      ...Array.from({length:4}, (_,i)=> [i+1, `SFP+ ${i+1}`]),
      ...Array.from({length:12}, (_,i)=> [i+5, `ETH ${i+1}`])
    ])
  },
  // 5.CWDM MUX DEMUX 8CH ( 1470nm-1610nm )
  // 8 port (TX 1470 1510 1550 1590 RX, RX 1490 1530 1570 1610 TX) -> Actually 8 channels.
  // We can represent as 8 ports.
  {
    name: 'CWDM MUX DEMUX 8CH', type: 'CWDM', sort_order: 14, total_ports: 8,
    desc: JSON.stringify([
      { label: "TX", ports: [1,2,3,4,5] }, // 1470, 1510, 1550, 1590, RX
      { label: "RX", ports: [6,7,8,9,10] }  // 1490, 1530, 1570, 1610, TX
    ]),
    portLabels: {
      1: "TX 1470", 2: "TX 1510", 3: "TX 1550", 4: "TX 1590", 5: "TX RX",
      6: "RX 1490", 7: "RX 1530", 8: "RX 1570", 9: "RX 1610", 10: "RX TX"
    } // Wait, I will use 10 ports based on labels. 
  },
  // 6.Ericsson 70060CX-32S: 32 port
  {
    name: 'Ericsson 70060CX-32S', type: 'Ericsson', sort_order: 15, total_ports: 32,
    desc: JSON.stringify([
      { label: "Baris A (Atas)", ports: Array.from({length:16}, (_,i) => i*2+1) },
      { label: "Baris B (Bawah)", ports: Array.from({length:16}, (_,i) => i*2+2) }
    ])
  },
  // 7.Server Facebook: Port 1
  { name: 'Server Facebook', type: 'Server Facebook', sort_order: 16, total_ports: 1, desc: JSON.stringify([{label:"Ports", ports:[1]}]) },
  // 8.Server YouTube: Port 1
  { name: 'Server YouTube', type: 'Server YouTube', sort_order: 17, total_ports: 1, desc: JSON.stringify([{label:"Ports", ports:[1]}]) },
  // 9.Server Tiktok: Port 1
  { name: 'Server Tiktok', type: 'Server Tiktok', sort_order: 18, total_ports: 1, desc: JSON.stringify([{label:"Ports", ports:[1]}]) },
  // 10.X86 Server Speedtest: 7 Slot setiap slot berisi 2 Port
  {
    name: 'X86 Server Speedtest', type: 'X86', sort_order: 19, total_ports: 14,
    desc: JSON.stringify(Array.from({length:7}, (_,i) => ({ label: `Slot ${i+1}`, ports: [i*2+1, i*2+2] }))),
    portLabels: Object.fromEntries(Array.from({length:14}, (_,i) => [i+1, `Port ${(i%2)+1}`]))
  },
  // 11.Server Proxmox: 2 Port
  { name: 'Server Proxmox', type: 'Server Proxmox', sort_order: 20, total_ports: 2, desc: JSON.stringify([{label:"Ports", ports:[1,2]}]) },
  // 12.CCR1036-8G-2S+: SFP+ 2 PORT 1-2, ETH 8 PORT 1-8
  {
    name: 'CCR1036-8G-2S+', type: 'Mikrotik', sort_order: 21, total_ports: 10,
    desc: JSON.stringify([
      { label: "SFP+", ports: [1,2] },
      { label: "ETH", ports: Array.from({length:8},(_,i)=>i+3) }
    ]),
    portLabels: Object.fromEntries([
      ...Array.from({length:2}, (_,i)=> [i+1, `SFP+ ${i+1}`]),
      ...Array.from({length:8}, (_,i)=> [i+3, `ETH ${i+1}`])
    ])
  },
  // 13.DELL Server Speedtest : 2 Port 1-2
  { name: 'DELL Server Speedtest', type: 'DELL Server', sort_order: 22, total_ports: 2, desc: JSON.stringify([{label:"Ports", ports:[1,2]}]) },
  // 14.JUNIPER MX204: 4 port dimulai dari 0-3, MGMT Port 1 port, Bits satu port
  {
    name: 'JUNIPER MX204', type: 'JUNIPER', sort_order: 23, total_ports: 6,
    desc: JSON.stringify([
      { label: "Ports", ports: [1,2,3,4] },
      { label: "Special", ports: [5,6] }
    ]),
    portLabels: { 1:"Port 0", 2:"Port 1", 3:"Port 2", 4:"Port 3", 5:"MGMT Port", 6:"Bits" }
  },
  // 15.X86 RO Dedicated: SFP+ 2 Port 1-2, SFP++ 2 Port 1-2, Ethernet 3 Port 1-3
  {
    name: 'X86 RO Dedicated', type: 'X86', sort_order: 24, total_ports: 7,
    desc: JSON.stringify([
      { label: "SFP+", ports: [1,2] },
      { label: "SFP++", ports: [3,4] },
      { label: "Ethernet", ports: [5,6,7] }
    ]),
    portLabels: { 1:"SFP+ 1", 2:"SFP+ 2", 3:"SFP++ 1", 4:"SFP++ 2", 5:"ETH 1", 6:"ETH 2", 7:"ETH 3" }
  }
];

async function run() {
  const { data: sites } = await supabase.from('sites').select('*').eq('name', 'Banyumas');
  const siteId = sites[0].id;
  console.log('Site ID:', siteId);

  // Sync types
  const { data: existingTypes } = await supabase.from('device_types').select('*');
  const typeMap = {};
  existingTypes.forEach(t => typeMap[t.name] = t.id);

  for (const nt of newTypes) {
    if (!typeMap[nt.name]) {
      console.log('Creating type:', nt.name);
      const { data } = await supabase.from('device_types').insert([{ name: nt.name, icon: nt.icon, color: nt.color }]).select();
      typeMap[nt.name] = data[0].id;
    }
  }

  // Create devices
  for (const dev of newDevices) {
    console.log('Creating device:', dev.name);
    const { data: createdDev, error: devErr } = await supabase.from('devices').insert([{
      site_id: siteId,
      device_type_id: typeMap[dev.type],
      name: dev.name,
      total_ports: dev.total_ports,
      description: dev.desc,
      sort_order: dev.sort_order,
      is_active: true
    }]).select();
    
    if (devErr) {
      console.error(devErr);
      continue;
    }

    const deviceId = createdDev[0].id;
    const totalPorts = Object.keys(dev.portLabels || {}).length > 0 ? Math.max(...Object.keys(dev.portLabels).map(Number)) : dev.total_ports;
    
    const ports = [];
    for (let i = 1; i <= totalPorts; i++) {
      ports.push({
        device_id: deviceId,
        port_number: i,
        status: 'empty',
        port_label: dev.portLabels ? dev.portLabels[i] : null,
        updated_at: new Date().toISOString()
      });
    }

    if (ports.length > 0) {
      await supabase.from('port_connections').insert(ports);
      console.log(`Created ${ports.length} ports for ${dev.name}`);
    }
  }
  
  console.log('Done!');
}
run();
