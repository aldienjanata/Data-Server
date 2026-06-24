import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envText.split('\n')
    .filter(line => line.includes('='))
    .map(line => { const i = line.indexOf('='); return [line.slice(0,i).trim(), line.slice(i+1).trim()]; })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const updates = [
    { name: 'X86', icon: '/logos/X86.jpg' },
    { name: 'Mikrotik', icon: '/logos/Mikrotik.webp' },
    { name: 'CWDM', icon: '<svg width="100%" height="100%" viewBox="0 0 100 40" fill="none" style="background:#f59e0b;border-radius:6px;display:flex;align-items:center;justify-content:center;"><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="monospace" font-size="28" font-weight="900">CWDM</text></svg>' },
    { name: 'Ericsson', icon: '/logos/Ericsson.webp' },
    { name: 'Server Facebook', icon: '/logos/Facebook.webp' },
    { name: 'Server YouTube', icon: '/logos/Youtube.webp' },
    { name: 'Server Tiktok', icon: '/logos/Tiktok.webp' },
    { name: 'Server Proxmox', icon: '/logos/X86.jpg' },
    { name: 'JUNIPER', icon: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22h20L12 2z"/></svg>' },
    { name: 'DELL Server', icon: '/logos/DELL.webp' },
    { name: 'DELL', icon: '/logos/DELL.webp' },
    { name: 'Server', icon: '/logos/X86.jpg' }
  ];

  for (const t of updates) {
    const { data, error } = await supabase
      .from('device_types')
      .update({ icon: t.icon })
      .eq('name', t.name);
    if (error) console.log(`Error updating ${t.name}:`, error.message);
    else console.log(`Updated icon for ${t.name}`);
  }

  // Set the specific devices to use their custom logos if they were mapped to generic types
  const devicesToUpdate = [
    { name: 'Server Facebook', icon: '/logos/Facebook.webp' },
    { name: 'Server YouTube', icon: '/logos/Youtube.webp' },
    { name: 'Server Tiktok', icon: '/logos/Tiktok.webp' },
    { name: 'DELL Server Speedtest', icon: '/logos/DELL.webp' }
  ];
  
  // Wait, devices don't have an icon column, only device_types does.
  // We need to ensure device_types for Facebook/YouTube/Tiktok exist.
  // Because my SQL merged them to 'Server' and 'DELL'.
  // If we want different logos, we need different device_types!
  
  const ensureTypes = [
    { name: 'Server Facebook', label: 'Facebook', port_style: 'sequential', color: '#0ea5e9', icon: '/logos/Facebook.webp' },
    { name: 'Server YouTube', label: 'YouTube', port_style: 'sequential', color: '#ef4444', icon: '/logos/Youtube.webp' },
    { name: 'Server Tiktok', label: 'Tiktok', port_style: 'sequential', color: '#000000', icon: '/logos/Tiktok.webp' },
    { name: 'DELL Server Speedtest', label: 'DELL', port_style: 'sequential', color: '#06b6d4', icon: '/logos/DELL.webp' }
  ];

  for (const t of ensureTypes) {
    let { data: type } = await supabase.from('device_types').select('id').eq('name', t.name).single();
    if (!type) {
      const res = await supabase.from('device_types').insert([{ name: t.name, label: t.label, port_style: t.port_style, color: t.color, icon: t.icon }]).select().single();
      type = res.data;
      console.log(`Created new type ${t.name}`);
    } else {
      await supabase.from('device_types').update({ icon: t.icon }).eq('id', type.id);
    }
    
    // Update the device to use this specific type
    if (type) {
      await supabase.from('devices').update({ device_type_id: type.id }).eq('name', t.name);
      console.log(`Mapped device ${t.name} to its specific type`);
    }
  }

}

run().catch(console.error);
