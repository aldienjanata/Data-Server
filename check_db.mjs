import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envText.split('\n')
    .filter(line => line.includes('='))
    .map(line => { const i = line.indexOf('='); return [line.slice(0,i).trim(), line.slice(i+1).trim()]; })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  // Check existing device_types columns
  const { data: types, error: typesErr } = await supabase.from('device_types').select('*').limit(3);
  console.log('device_types error:', typesErr);
  console.log('device_types sample:', JSON.stringify(types, null, 2));

  // Check site Banyumas
  const { data: sites, error: siteErr } = await supabase.from('sites').select('id,name');
  console.log('sites:', JSON.stringify(sites));
  
  // Check existing devices in Banyumas
  if (sites && sites.length > 0) {
    const bms = sites.find(s => s.name === 'Banyumas');
    if (bms) {
      const { data: devs } = await supabase.from('devices').select('id,name').eq('site_id', bms.id);
      console.log('Existing Banyumas devices:', JSON.stringify(devs));
    }
  }
}
run().catch(console.error);
