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
  const { data: dev } = await supabase.from('devices').select('id').eq('name', 'CWDM MUX DEMUX 8CH').single();
  if (!dev) return console.log('Device not found');

  const devId = dev.id;

  // Delete ports 5 and 10
  await supabase.from('port_connections').delete().eq('device_id', devId).in('port_number', [5, 10]);

  // Update port numbers: shift 6->5, 7->6, 8->7, 9->8
  await supabase.from('port_connections').update({ port_number: 8 }).eq('device_id', devId).eq('port_number', 9);
  await supabase.from('port_connections').update({ port_number: 7 }).eq('device_id', devId).eq('port_number', 8);
  await supabase.from('port_connections').update({ port_number: 6 }).eq('device_id', devId).eq('port_number', 7);
  await supabase.from('port_connections').update({ port_number: 5 }).eq('device_id', devId).eq('port_number', 6);

  // Update device layout and total_ports
  const newLayout = '[{"label":"TX","ports":[1,2,3,4]},{"label":"RX","ports":[5,6,7,8]}]';
  await supabase.from('devices').update({ 
    total_ports: 8,
    description: newLayout 
  }).eq('id', devId);

  console.log('Fixed CWDM layout and ports');
}

run().catch(console.error);
