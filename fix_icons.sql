-- ============================================================
-- FIX ICON UPDATE (Beserta Fix Limit Karakter)
-- Copy paste di Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Perbesar batas karakter agar muat untuk icon SVG panjang
ALTER TABLE device_types ALTER COLUMN icon TYPE TEXT;

-- 2. Update icon
UPDATE device_types SET icon = '/logos/X86.jpg' WHERE name = 'X86';
UPDATE device_types SET icon = '/logos/Mikrotik.webp' WHERE name = 'Mikrotik';
UPDATE device_types SET icon = '<svg width="100%" height="100%" viewBox="0 0 100 40" fill="none" style="background:#f59e0b;border-radius:6px;display:flex;align-items:center;justify-content:center;"><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="monospace" font-size="28" font-weight="900">CWDM</text></svg>' WHERE name = 'CWDM';
UPDATE device_types SET icon = '/logos/Ericsson.webp' WHERE name = 'Ericsson';
UPDATE device_types SET icon = '/logos/Facebook.webp' WHERE name IN ('Server Facebook', 'Server');
UPDATE device_types SET icon = '/logos/Youtube.webp' WHERE name = 'Server YouTube';
UPDATE device_types SET icon = '/logos/Tiktok.webp' WHERE name = 'Server Tiktok';
UPDATE device_types SET icon = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22h20L12 2z"/></svg>' WHERE name = 'JUNIPER';
UPDATE device_types SET icon = '/logos/DELL.webp' WHERE name IN ('DELL Server', 'DELL Server Speedtest', 'DELL');

-- 3. Pastikan Server Facebook, YouTube, Tiktok, DELL memiliki type sendiri
INSERT INTO device_types (name, label, description, icon, color, port_style)
VALUES 
  ('Server Facebook', 'Facebook', 'Server FB', '/logos/Facebook.webp', '#0ea5e9', 'sequential'),
  ('Server YouTube', 'YouTube', 'Server YT', '/logos/Youtube.webp', '#ef4444', 'sequential'),
  ('Server Tiktok', 'Tiktok', 'Server TT', '/logos/Tiktok.webp', '#000000', 'sequential'),
  ('DELL Server Speedtest', 'DELL', 'Server DELL', '/logos/DELL.webp', '#06b6d4', 'sequential')
ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;

-- 4. Hubungkan perangkat ke typenya
UPDATE devices SET device_type_id = (SELECT id FROM device_types WHERE name = 'Server Facebook') WHERE name = 'Server Facebook';
UPDATE devices SET device_type_id = (SELECT id FROM device_types WHERE name = 'Server YouTube') WHERE name = 'Server YouTube';
UPDATE devices SET device_type_id = (SELECT id FROM device_types WHERE name = 'Server Tiktok') WHERE name = 'Server Tiktok';
UPDATE devices SET device_type_id = (SELECT id FROM device_types WHERE name = 'DELL Server Speedtest') WHERE name = 'DELL Server Speedtest';

SELECT name, icon FROM device_types;
