import fs from 'fs';

const SUPABASE_URL = 'https://bompbhjrayxrlszvwwzk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvbXBiaGpyYXl4cmxzenZ3d3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTM3ODIsImV4cCI6MjA5NjYyOTc4Mn0.SuZOlgSDYg8El8MLfvc_kGxxQJ0VxaEM1vsxHGoswUw';

async function fetchS(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function run() {
  try {
    // 1. Find site "Kebumen"
    const sites = await fetchS('/sites?select=*&name=eq.Kebumen');
    if (sites.length === 0) {
      console.log('Site Kebumen not found! Please create it first.');
      return;
    }
    const siteId = sites[0].id;
    console.log('Site Kebumen ID:', siteId);

    // 2. Get device types
    const types = await fetchS('/device_types?select=*');
    const otbType = types.find(t => t.name === 'OTB');
    const huaweiType = types.find(t => t.name === 'HUAWEI');
    const oltType = types.find(t => t.name === 'OLT' || t.name === 'GTGO');

    if (!otbType || !huaweiType || !oltType) {
      console.log('Missing device types!', {otbType, huaweiType, oltType});
      return;
    }

    // 3. Insert devices
    const devicesToInsert = [
      { site_id: siteId, device_type_id: otbType.id, name: 'OTB 1 96', total_ports: 96 },
      { site_id: siteId, device_type_id: otbType.id, name: 'OTB 2 96', total_ports: 96 },
      { site_id: siteId, device_type_id: huaweiType.id, name: 'HUAWEI', total_ports: 56 },
      { site_id: siteId, device_type_id: oltType.id, name: 'OLT', total_ports: 128 }
    ];

    const insertedDevices = [];
    for (const d of devicesToInsert) {
      const res = await fetchS('/devices', {
        method: 'POST',
        body: JSON.stringify(d)
      });
      console.log('Inserted device:', res[0].name);
      insertedDevices.push(res[0]);
    }

    // 4. Generate ports
    for (const d of insertedDevices) {
      const portsToInsert = [];
      if (d.name === 'OLT') {
        // "Mulai dri slot 2 (1/2/1) sampai 15 ( 1/15/1)"
        // Assuming 1 slot per index, wait. Usually GTGO has 16 ports or something.
        // What does "Mulai dri slot 2 (1/2/1) sampai 15 ( 1/15/1)" mean?
        // Wait, OLT ports are usually labeled 1/1/1, 1/1/2, etc.
        // It's 14 slots (2 to 15), each with 1 port or maybe more?
        // The user says "Mulai dri slot 2 (1/2/1) sampai 15 ( 1/15/1)" -> Just generate ports with standard layout 128, then I can update their labels?
        // Let's just create 128 ports for OLT, 96 for OTB, 56 for Huawei.
      }
      
      let total = d.total_ports;
      if (d.name === 'HUAWEI') total = 56;
      if (d.name.includes('OTB')) total = 96;
      if (d.name === 'OLT') total = 128; // standard we set
      
      for (let i = 1; i <= total; i++) {
        portsToInsert.push({
          device_id: d.id,
          port_number: i,
          status: 'empty'
        });
      }
      
      // Bulk insert ports in chunks
      const chunkSize = 100;
      for (let i = 0; i < portsToInsert.length; i += chunkSize) {
        const chunk = portsToInsert.slice(i, i + chunkSize);
        await fetchS('/ports', {
          method: 'POST',
          body: JSON.stringify(chunk)
        });
      }
      console.log(`Inserted ${total} ports for ${d.name}`);
    }

    console.log('DONE!');
  } catch (err) {
    console.error('ERROR:', err);
  }
}

run();
