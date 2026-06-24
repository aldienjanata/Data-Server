-- ============================================================
-- FIX CWDM PORTS (HAPUS TX RX & RX TX)
-- Copy paste di Supabase Dashboard > SQL Editor > New Query
-- ============================================================

DO $$
DECLARE
  v_dev_id UUID;
BEGIN
  -- Cari ID CWDM
  SELECT id INTO v_dev_id FROM devices WHERE name = 'CWDM MUX DEMUX 8CH' LIMIT 1;
  
  IF v_dev_id IS NOT NULL THEN
    -- Hapus port ke 5 (TX RX) dan 10 (RX TX)
    DELETE FROM port_connections WHERE device_id = v_dev_id AND port_number IN (5, 10);
    
    -- Geser nomor port agar tidak bolong (6 jadi 5, 7 jadi 6, dst)
    UPDATE port_connections SET port_number = 8 WHERE device_id = v_dev_id AND port_number = 9;
    UPDATE port_connections SET port_number = 7 WHERE device_id = v_dev_id AND port_number = 8;
    UPDATE port_connections SET port_number = 6 WHERE device_id = v_dev_id AND port_number = 7;
    UPDATE port_connections SET port_number = 5 WHERE device_id = v_dev_id AND port_number = 6;
    
    -- Update layout dan total port di perangkat CWDM
    UPDATE devices 
    SET 
      total_ports = 8,
      description = '[{"label":"TX","ports":[1,2,3,4]},{"label":"RX","ports":[5,6,7,8]}]'
    WHERE id = v_dev_id;
  END IF;
END $$;
