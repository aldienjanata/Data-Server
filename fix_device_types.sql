-- ============================================================
-- FIX LENGKAP: Buat device_types baru + Update semua device Banyumas
-- Jalankan di Supabase Dashboard > SQL Editor > New Query
-- ============================================================

DO $$
DECLARE
  v_x86_id      UUID;
  v_mikrotik_id UUID;
  v_cwdm_id     UUID;
  v_ericsson_id UUID;
  v_server_id   UUID;
  v_juniper_id  UUID;
  v_dell_id     UUID;
BEGIN

-- ============================================================
-- STEP 1: Insert device_types baru
-- ============================================================

-- X86
INSERT INTO device_types (name, label, description, icon, color, port_style)
VALUES ('X86', 'X86 Server', 'Server X86', 'server', '#10b981', 'sequential')
ON CONFLICT (name) DO UPDATE SET label='X86 Server', port_style='sequential'
RETURNING id INTO v_x86_id;

-- Mikrotik
INSERT INTO device_types (name, label, description, icon, color, port_style)
VALUES ('Mikrotik', 'Mikrotik Router', 'Router Mikrotik', 'router', '#3b82f6', 'sequential')
ON CONFLICT (name) DO UPDATE SET label='Mikrotik Router', port_style='sequential'
RETURNING id INTO v_mikrotik_id;

-- CWDM
INSERT INTO device_types (name, label, description, icon, color, port_style)
VALUES ('CWDM', 'CWDM MUX/DEMUX', 'Wavelength Division Multiplexer', 'network', '#f59e0b', 'sequential')
ON CONFLICT (name) DO UPDATE SET label='CWDM MUX/DEMUX', port_style='sequential'
RETURNING id INTO v_cwdm_id;

-- Ericsson
INSERT INTO device_types (name, label, description, icon, color, port_style)
VALUES ('Ericsson', 'Ericsson Switch', 'Switch Ericsson 32S', 'router', '#6366f1', 'paired')
ON CONFLICT (name) DO UPDATE SET label='Ericsson Switch', port_style='paired'
RETURNING id INTO v_ericsson_id;

-- Server
INSERT INTO device_types (name, label, description, icon, color, port_style)
VALUES ('Server', 'Server', 'Server generik', 'server', '#64748b', 'sequential')
ON CONFLICT (name) DO UPDATE SET label='Server', port_style='sequential'
RETURNING id INTO v_server_id;

-- JUNIPER
INSERT INTO device_types (name, label, description, icon, color, port_style)
VALUES ('JUNIPER', 'Juniper Router', 'Router Juniper MX204', 'router', '#8b5cf6', 'sequential')
ON CONFLICT (name) DO UPDATE SET label='Juniper Router', port_style='sequential'
RETURNING id INTO v_juniper_id;

-- DELL
INSERT INTO device_types (name, label, description, icon, color, port_style)
VALUES ('DELL', 'DELL Server', 'Server DELL', 'server', '#06b6d4', 'sequential')
ON CONFLICT (name) DO UPDATE SET label='DELL Server', port_style='sequential'
RETURNING id INTO v_dell_id;

-- ============================================================
-- STEP 2: Update devices ke tipe yang benar
-- ============================================================

UPDATE devices SET device_type_id = v_x86_id
WHERE name IN ('X86 Jadul BMS-01','X86 BMS-02','X86 BMS-03','X86 Server Speedtest','X86 RO Dedicated');

UPDATE devices SET device_type_id = v_mikrotik_id
WHERE name IN ('CCR2116-12S-4S+','CCR1036-8G-2S+');

UPDATE devices SET device_type_id = v_cwdm_id
WHERE name = 'CWDM MUX DEMUX 8CH';

UPDATE devices SET device_type_id = v_ericsson_id
WHERE name = 'Ericsson 70060CX-32S';

UPDATE devices SET device_type_id = v_server_id
WHERE name IN ('Server Facebook','Server YouTube','Server Tiktok','Server Proxmox');

UPDATE devices SET device_type_id = v_juniper_id
WHERE name = 'JUNIPER MX204';

UPDATE devices SET device_type_id = v_dell_id
WHERE name = 'DELL Server Speedtest';

RAISE NOTICE '=== SELESAI UPDATE DEVICE ===';
END $$;

-- ============================================================
-- Verifikasi hasil (akan muncul sebagai tabel di bawah)
-- ============================================================
SELECT 
  d.sort_order,
  d.name as device_name,
  dt.name as type_name,
  dt.port_style,
  d.total_ports
FROM devices d
JOIN device_types dt ON d.device_type_id = dt.id
WHERE d.site_id = '9b9cb380-5d3c-429c-9fd1-57d2ba5322da'
ORDER BY d.sort_order;
