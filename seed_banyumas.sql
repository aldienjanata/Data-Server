-- ============================================================
-- SQL SEED: 13 Perangkat Banyumas
-- Jalankan di: https://supabase.com/dashboard → SQL Editor
-- Site Banyumas ID: 9b9cb380-5d3c-429c-9fd1-57d2ba5322da
-- CISCO type ID:    5d9a49d7-b41a-4790-8e2a-f28c1662d228
-- ============================================================

DO $$
DECLARE
  v_site_id   UUID := '9b9cb380-5d3c-429c-9fd1-57d2ba5322da';
  v_cisco_id  UUID := '5d9a49d7-b41a-4790-8e2a-f28c1662d228';
  v_dev_id    UUID;
BEGIN

-- ====================
-- 1. X86 Jadul BMS-01
-- ====================
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'X86 Jadul BMS-01', 2,
  '[{"label":"Ports","ports":[1,2]}]', 10, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='X86 Jadul BMS-01')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, port_label, updated_at) VALUES
  (v_dev_id, 1, 'empty', 'Port 1', NOW()),
  (v_dev_id, 2, 'empty', 'Port 2', NOW());
END IF;

-- ====================
-- 2. X86 BMS-02
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'X86 BMS-02', 8,
  '[{"label":"SFP+","ports":[1,2,3,4]},{"label":"Ethernet","ports":[5,6,7,8]}]', 11, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='X86 BMS-02')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, port_label, updated_at) VALUES
  (v_dev_id, 1, 'empty', 'SFP+ 1', NOW()),
  (v_dev_id, 2, 'empty', 'SFP+ 2', NOW()),
  (v_dev_id, 3, 'empty', 'SFP+ 3', NOW()),
  (v_dev_id, 4, 'empty', 'SFP+ 4', NOW()),
  (v_dev_id, 5, 'empty', 'ETH 1', NOW()),
  (v_dev_id, 6, 'empty', 'ETH 2', NOW()),
  (v_dev_id, 7, 'empty', 'ETH 3', NOW()),
  (v_dev_id, 8, 'empty', 'ETH 4', NOW());
END IF;

-- ====================
-- 3. X86 BMS-03
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'X86 BMS-03', 12,
  '[{"label":"SFP+","ports":[1,2,3,4]},{"label":"ETH","ports":[5,6,7,8,9,10,11,12]}]', 12, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='X86 BMS-03')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, port_label, updated_at) VALUES
  (v_dev_id, 1, 'empty', 'SFP+ 1', NOW()),
  (v_dev_id, 2, 'empty', 'SFP+ 2', NOW()),
  (v_dev_id, 3, 'empty', 'SFP+ 3', NOW()),
  (v_dev_id, 4, 'empty', 'SFP+ 4', NOW()),
  (v_dev_id, 5, 'empty', 'ETH 1', NOW()),
  (v_dev_id, 6, 'empty', 'ETH 2', NOW()),
  (v_dev_id, 7, 'empty', 'ETH 3', NOW()),
  (v_dev_id, 8, 'empty', 'ETH 4', NOW()),
  (v_dev_id, 9, 'empty', 'ETH 5', NOW()),
  (v_dev_id, 10, 'empty', 'ETH 6', NOW()),
  (v_dev_id, 11, 'empty', 'ETH 7', NOW()),
  (v_dev_id, 12, 'empty', 'ETH 8', NOW());
END IF;

-- ====================
-- 4. CCR2116-12S-4S+
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'CCR2116-12S-4S+', 16,
  '[{"label":"SFP+","ports":[1,2,3,4]},{"label":"GIGABIT ETHERNET","ports":[5,6,7,8,9,10,11,12,13,14,15,16]}]', 13, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='CCR2116-12S-4S+')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, port_label, updated_at) VALUES
  (v_dev_id, 1, 'empty', 'SFP+ 1', NOW()),
  (v_dev_id, 2, 'empty', 'SFP+ 2', NOW()),
  (v_dev_id, 3, 'empty', 'SFP+ 3', NOW()),
  (v_dev_id, 4, 'empty', 'SFP+ 4', NOW()),
  (v_dev_id, 5, 'empty', 'ETH 1', NOW()),
  (v_dev_id, 6, 'empty', 'ETH 2', NOW()),
  (v_dev_id, 7, 'empty', 'ETH 3', NOW()),
  (v_dev_id, 8, 'empty', 'ETH 4', NOW()),
  (v_dev_id, 9, 'empty', 'ETH 5', NOW()),
  (v_dev_id, 10, 'empty', 'ETH 6', NOW()),
  (v_dev_id, 11, 'empty', 'ETH 7', NOW()),
  (v_dev_id, 12, 'empty', 'ETH 8', NOW()),
  (v_dev_id, 13, 'empty', 'ETH 9', NOW()),
  (v_dev_id, 14, 'empty', 'ETH 10', NOW()),
  (v_dev_id, 15, 'empty', 'ETH 11', NOW()),
  (v_dev_id, 16, 'empty', 'ETH 12', NOW());
END IF;

-- ====================
-- 5. CWDM MUX DEMUX 8CH
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'CWDM MUX DEMUX 8CH', 10,
  '[{"label":"TX","ports":[1,2,3,4,5]},{"label":"RX","ports":[6,7,8,9,10]}]', 14, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='CWDM MUX DEMUX 8CH')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, port_label, updated_at) VALUES
  (v_dev_id, 1, 'empty', 'TX 1470', NOW()),
  (v_dev_id, 2, 'empty', 'TX 1510', NOW()),
  (v_dev_id, 3, 'empty', 'TX 1550', NOW()),
  (v_dev_id, 4, 'empty', 'TX 1590', NOW()),
  (v_dev_id, 5, 'empty', 'TX RX', NOW()),
  (v_dev_id, 6, 'empty', 'RX 1490', NOW()),
  (v_dev_id, 7, 'empty', 'RX 1530', NOW()),
  (v_dev_id, 8, 'empty', 'RX 1570', NOW()),
  (v_dev_id, 9, 'empty', 'RX 1610', NOW()),
  (v_dev_id, 10, 'empty', 'RX TX', NOW());
END IF;

-- ====================
-- 6. Ericsson 70060CX-32S
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'Ericsson 70060CX-32S', 32,
  '[{"label":"Baris A (Atas)","ports":[1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31]},{"label":"Baris B (Bawah)","ports":[2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32]}]',
  15, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='Ericsson 70060CX-32S')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, updated_at)
  SELECT v_dev_id, gs, 'empty', NOW() FROM generate_series(1,32) gs;
END IF;

-- ====================
-- 7. Server Facebook
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'Server Facebook', 1,
  '[{"label":"Ports","ports":[1]}]', 16, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='Server Facebook')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, updated_at) VALUES (v_dev_id, 1, 'empty', NOW());
END IF;

-- ====================
-- 8. Server YouTube
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'Server YouTube', 1,
  '[{"label":"Ports","ports":[1]}]', 17, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='Server YouTube')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, updated_at) VALUES (v_dev_id, 1, 'empty', NOW());
END IF;

-- ====================
-- 9. Server Tiktok
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'Server Tiktok', 1,
  '[{"label":"Ports","ports":[1]}]', 18, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='Server Tiktok')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, updated_at) VALUES (v_dev_id, 1, 'empty', NOW());
END IF;

-- ====================
-- 10. X86 Server Speedtest (7 slot x 2 port)
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'X86 Server Speedtest', 14,
  '[{"label":"Slot 1","ports":[1,2]},{"label":"Slot 2","ports":[3,4]},{"label":"Slot 3","ports":[5,6]},{"label":"Slot 4","ports":[7,8]},{"label":"Slot 5","ports":[9,10]},{"label":"Slot 6","ports":[11,12]},{"label":"Slot 7","ports":[13,14]}]',
  19, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='X86 Server Speedtest')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, port_label, updated_at) VALUES
  (v_dev_id, 1, 'empty', 'Port 1', NOW()), (v_dev_id, 2, 'empty', 'Port 2', NOW()),
  (v_dev_id, 3, 'empty', 'Port 1', NOW()), (v_dev_id, 4, 'empty', 'Port 2', NOW()),
  (v_dev_id, 5, 'empty', 'Port 1', NOW()), (v_dev_id, 6, 'empty', 'Port 2', NOW()),
  (v_dev_id, 7, 'empty', 'Port 1', NOW()), (v_dev_id, 8, 'empty', 'Port 2', NOW()),
  (v_dev_id, 9, 'empty', 'Port 1', NOW()), (v_dev_id, 10, 'empty', 'Port 2', NOW()),
  (v_dev_id, 11, 'empty', 'Port 1', NOW()), (v_dev_id, 12, 'empty', 'Port 2', NOW()),
  (v_dev_id, 13, 'empty', 'Port 1', NOW()), (v_dev_id, 14, 'empty', 'Port 2', NOW());
END IF;

-- ====================
-- 11. Server Proxmox
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'Server Proxmox', 2,
  '[{"label":"Ports","ports":[1,2]}]', 20, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='Server Proxmox')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, updated_at) VALUES
  (v_dev_id, 1, 'empty', NOW()), (v_dev_id, 2, 'empty', NOW());
END IF;

-- ====================
-- 12. CCR1036-8G-2S+
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'CCR1036-8G-2S+', 10,
  '[{"label":"SFP+","ports":[1,2]},{"label":"ETH","ports":[3,4,5,6,7,8,9,10]}]', 21, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='CCR1036-8G-2S+')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, port_label, updated_at) VALUES
  (v_dev_id, 1, 'empty', 'SFP+ 1', NOW()),
  (v_dev_id, 2, 'empty', 'SFP+ 2', NOW()),
  (v_dev_id, 3, 'empty', 'ETH 1', NOW()),
  (v_dev_id, 4, 'empty', 'ETH 2', NOW()),
  (v_dev_id, 5, 'empty', 'ETH 3', NOW()),
  (v_dev_id, 6, 'empty', 'ETH 4', NOW()),
  (v_dev_id, 7, 'empty', 'ETH 5', NOW()),
  (v_dev_id, 8, 'empty', 'ETH 6', NOW()),
  (v_dev_id, 9, 'empty', 'ETH 7', NOW()),
  (v_dev_id, 10, 'empty', 'ETH 8', NOW());
END IF;

-- ====================
-- 13. DELL Server Speedtest
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'DELL Server Speedtest', 2,
  '[{"label":"Ports","ports":[1,2]}]', 22, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='DELL Server Speedtest')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, updated_at) VALUES
  (v_dev_id, 1, 'empty', NOW()), (v_dev_id, 2, 'empty', NOW());
END IF;

-- ====================
-- 14. JUNIPER MX204
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'JUNIPER MX204', 6,
  '[{"label":"Ports","ports":[1,2,3,4]},{"label":"Special","ports":[5,6]}]', 23, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='JUNIPER MX204')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, port_label, updated_at) VALUES
  (v_dev_id, 1, 'empty', 'Port 0', NOW()),
  (v_dev_id, 2, 'empty', 'Port 1', NOW()),
  (v_dev_id, 3, 'empty', 'Port 2', NOW()),
  (v_dev_id, 4, 'empty', 'Port 3', NOW()),
  (v_dev_id, 5, 'empty', 'MGMT Port', NOW()),
  (v_dev_id, 6, 'empty', 'Bits', NOW());
END IF;

-- ====================
-- 15. X86 RO Dedicated
-- ====================
v_dev_id := NULL;
INSERT INTO devices (site_id, device_type_id, name, total_ports, description, sort_order, is_active)
SELECT v_site_id, v_cisco_id, 'X86 RO Dedicated', 7,
  '[{"label":"SFP+","ports":[1,2]},{"label":"SFP++","ports":[3,4]},{"label":"Ethernet","ports":[5,6,7]}]', 24, true
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE site_id=v_site_id AND name='X86 RO Dedicated')
RETURNING id INTO v_dev_id;

IF v_dev_id IS NOT NULL THEN
  INSERT INTO port_connections (device_id, port_number, status, port_label, updated_at) VALUES
  (v_dev_id, 1, 'empty', 'SFP+ 1', NOW()),
  (v_dev_id, 2, 'empty', 'SFP+ 2', NOW()),
  (v_dev_id, 3, 'empty', 'SFP++ 1', NOW()),
  (v_dev_id, 4, 'empty', 'SFP++ 2', NOW()),
  (v_dev_id, 5, 'empty', 'ETH 1', NOW()),
  (v_dev_id, 6, 'empty', 'ETH 2', NOW()),
  (v_dev_id, 7, 'empty', 'ETH 3', NOW());
END IF;

RAISE NOTICE 'Seed Banyumas selesai!';
END $$;
