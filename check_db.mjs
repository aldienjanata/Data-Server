import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envText.split('\n')
    .filter(line => line.includes('='))
    .map(line => { const i = line.indexOf('='); return [line.slice(0,i).trim(), line.slice(i+1).trim()]; })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const SITE_ID = '9b9cb380-5d3c-429c-9fd1-57d2ba5322da';

async function run() {
  // Check device types
  const { data: types } = await supabase.from('device_types').select('id,name,port_style,color');
  console.log('\n=== DEVICE TYPES ===');
  types.forEach(t => console.log(`  [${t.id}] ${t.name} | port_style: ${t.port_style} | color: ${t.color}`));

  // Check Banyumas devices with their types
  const { data: devs } = await supabase
    .from('devices')
    .select('id,name,total_ports,sort_order,device_types(name,port_style)')
    .eq('site_id', SITE_ID)
    .order('sort_order');
  
  console.log('\n=== BANYUMAS DEVICES ===');
  devs?.forEach(d => console.log(`  sort:${d.sort_order} | ${d.name} | type:${d.device_types?.name} | style:${d.device_types?.port_style} | ports:${d.total_ports}`));

  // Check port counts per device
  console.log('\n=== PORT COUNTS ===');
  for (const d of devs || []) {
    const { count } = await supabase.from('port_connections').select('*', { count: 'exact', head: true }).eq('device_id', d.id);
    if (count !== d.total_ports) {
      console.log(`  ⚠️  ${d.name}: total_ports=${d.total_ports}, actual ports in DB=${count}`);
    } else {
      console.log(`  ✅ ${d.name}: ${count} ports`);
    }
  }
}
run().catch(console.error);
