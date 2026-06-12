BEGIN;
DO $$
DECLARE
  v_site_id uuid;
  v_type_id uuid;
  v_dev_id uuid;
  v_tube_id uuid;
BEGIN
  SELECT id INTO v_site_id FROM sites WHERE code = 'BMS' LIMIT 1;
  IF v_site_id IS NULL THEN
    v_site_id := gen_random_uuid();
    INSERT INTO sites (id, name, code, location) VALUES (v_site_id, 'Banyumas', 'BMS', 'Jawa Tengah');
  END IF;

  -- ==========================================
  -- DEVICE: DATA GTGO-CISCO-HW
  -- ==========================================
  SELECT id INTO v_type_id FROM device_types WHERE name = 'CISCO' LIMIT 1;
  IF v_type_id IS NULL THEN
     v_type_id := (SELECT id FROM device_types LIMIT 1); 
  END IF;
  
  v_dev_id := gen_random_uuid();
  INSERT INTO devices (id, site_id, device_type_id, name, total_ports) 
  VALUES (v_dev_id, v_site_id, v_type_id, 'DATA GTGO-CISCO-HW', 48);
  INSERT INTO port_connections (device_id, port_number, status) VALUES 
    (v_dev_id, 1, 'empty'),
    (v_dev_id, 2, 'empty'),
    (v_dev_id, 3, 'empty'),
    (v_dev_id, 4, 'empty'),
    (v_dev_id, 5, 'empty'),
    (v_dev_id, 6, 'empty'),
    (v_dev_id, 7, 'empty'),
    (v_dev_id, 8, 'empty'),
    (v_dev_id, 9, 'empty'),
    (v_dev_id, 10, 'empty'),
    (v_dev_id, 11, 'empty'),
    (v_dev_id, 12, 'empty'),
    (v_dev_id, 13, 'empty'),
    (v_dev_id, 14, 'empty'),
    (v_dev_id, 15, 'empty'),
    (v_dev_id, 16, 'empty'),
    (v_dev_id, 17, 'empty'),
    (v_dev_id, 18, 'empty'),
    (v_dev_id, 19, 'empty'),
    (v_dev_id, 20, 'empty'),
    (v_dev_id, 21, 'empty'),
    (v_dev_id, 22, 'empty'),
    (v_dev_id, 23, 'empty'),
    (v_dev_id, 24, 'empty'),
    (v_dev_id, 25, 'empty'),
    (v_dev_id, 26, 'empty'),
    (v_dev_id, 27, 'empty'),
    (v_dev_id, 28, 'empty'),
    (v_dev_id, 29, 'empty'),
    (v_dev_id, 30, 'empty'),
    (v_dev_id, 31, 'empty'),
    (v_dev_id, 32, 'empty'),
    (v_dev_id, 33, 'empty'),
    (v_dev_id, 34, 'empty'),
    (v_dev_id, 35, 'empty'),
    (v_dev_id, 36, 'empty'),
    (v_dev_id, 37, 'empty'),
    (v_dev_id, 38, 'empty'),
    (v_dev_id, 39, 'empty'),
    (v_dev_id, 40, 'empty'),
    (v_dev_id, 41, 'empty'),
    (v_dev_id, 42, 'empty'),
    (v_dev_id, 43, 'empty'),
    (v_dev_id, 44, 'empty'),
    (v_dev_id, 45, 'empty'),
    (v_dev_id, 46, 'empty'),
    (v_dev_id, 47, 'empty'),
    (v_dev_id, 48, 'empty');

  -- ==========================================
  -- DEVICE: OTB 1 96
  -- ==========================================
  SELECT id INTO v_type_id FROM device_types WHERE name = 'OTB' LIMIT 1;
  IF v_type_id IS NULL THEN
     v_type_id := (SELECT id FROM device_types LIMIT 1); 
  END IF;
  
  v_dev_id := gen_random_uuid();
  INSERT INTO devices (id, site_id, device_type_id, name, total_ports) 
  VALUES (v_dev_id, v_site_id, v_type_id, 'OTB 1 96', 96);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 1, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 2, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 3, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 4, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 5, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 6, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 7, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 8, 12);
  INSERT INTO port_connections (device_id, tube_id, port_number, status) VALUES 
    (v_dev_id, v_tube_id, 1, 'empty'),
    (v_dev_id, v_tube_id, 2, 'empty'),
    (v_dev_id, v_tube_id, 3, 'empty'),
    (v_dev_id, v_tube_id, 4, 'empty'),
    (v_dev_id, v_tube_id, 5, 'empty'),
    (v_dev_id, v_tube_id, 6, 'empty'),
    (v_dev_id, v_tube_id, 7, 'empty'),
    (v_dev_id, v_tube_id, 8, 'empty'),
    (v_dev_id, v_tube_id, 9, 'empty'),
    (v_dev_id, v_tube_id, 10, 'empty'),
    (v_dev_id, v_tube_id, 11, 'empty'),
    (v_dev_id, v_tube_id, 12, 'empty'),
    (v_dev_id, v_tube_id, 13, 'empty'),
    (v_dev_id, v_tube_id, 14, 'empty'),
    (v_dev_id, v_tube_id, 15, 'empty'),
    (v_dev_id, v_tube_id, 16, 'empty'),
    (v_dev_id, v_tube_id, 17, 'empty'),
    (v_dev_id, v_tube_id, 18, 'empty'),
    (v_dev_id, v_tube_id, 19, 'empty'),
    (v_dev_id, v_tube_id, 20, 'empty'),
    (v_dev_id, v_tube_id, 21, 'empty'),
    (v_dev_id, v_tube_id, 22, 'empty'),
    (v_dev_id, v_tube_id, 23, 'empty'),
    (v_dev_id, v_tube_id, 24, 'empty'),
    (v_dev_id, v_tube_id, 25, 'empty'),
    (v_dev_id, v_tube_id, 26, 'empty'),
    (v_dev_id, v_tube_id, 27, 'empty'),
    (v_dev_id, v_tube_id, 28, 'empty'),
    (v_dev_id, v_tube_id, 29, 'empty'),
    (v_dev_id, v_tube_id, 30, 'empty'),
    (v_dev_id, v_tube_id, 31, 'empty'),
    (v_dev_id, v_tube_id, 32, 'empty'),
    (v_dev_id, v_tube_id, 33, 'empty'),
    (v_dev_id, v_tube_id, 34, 'empty'),
    (v_dev_id, v_tube_id, 35, 'empty'),
    (v_dev_id, v_tube_id, 36, 'empty'),
    (v_dev_id, v_tube_id, 37, 'empty'),
    (v_dev_id, v_tube_id, 38, 'empty'),
    (v_dev_id, v_tube_id, 39, 'empty'),
    (v_dev_id, v_tube_id, 40, 'empty'),
    (v_dev_id, v_tube_id, 41, 'empty'),
    (v_dev_id, v_tube_id, 42, 'empty'),
    (v_dev_id, v_tube_id, 43, 'empty'),
    (v_dev_id, v_tube_id, 44, 'empty'),
    (v_dev_id, v_tube_id, 45, 'empty'),
    (v_dev_id, v_tube_id, 46, 'empty'),
    (v_dev_id, v_tube_id, 47, 'empty'),
    (v_dev_id, v_tube_id, 48, 'empty'),
    (v_dev_id, v_tube_id, 49, 'empty'),
    (v_dev_id, v_tube_id, 50, 'empty'),
    (v_dev_id, v_tube_id, 51, 'empty'),
    (v_dev_id, v_tube_id, 52, 'empty'),
    (v_dev_id, v_tube_id, 53, 'empty'),
    (v_dev_id, v_tube_id, 54, 'empty'),
    (v_dev_id, v_tube_id, 55, 'empty'),
    (v_dev_id, v_tube_id, 56, 'empty'),
    (v_dev_id, v_tube_id, 57, 'empty'),
    (v_dev_id, v_tube_id, 58, 'empty'),
    (v_dev_id, v_tube_id, 59, 'empty'),
    (v_dev_id, v_tube_id, 60, 'empty'),
    (v_dev_id, v_tube_id, 61, 'empty'),
    (v_dev_id, v_tube_id, 62, 'empty'),
    (v_dev_id, v_tube_id, 63, 'empty'),
    (v_dev_id, v_tube_id, 64, 'empty'),
    (v_dev_id, v_tube_id, 65, 'empty'),
    (v_dev_id, v_tube_id, 66, 'empty'),
    (v_dev_id, v_tube_id, 67, 'empty'),
    (v_dev_id, v_tube_id, 68, 'empty'),
    (v_dev_id, v_tube_id, 69, 'empty'),
    (v_dev_id, v_tube_id, 70, 'empty'),
    (v_dev_id, v_tube_id, 71, 'empty'),
    (v_dev_id, v_tube_id, 72, 'empty'),
    (v_dev_id, v_tube_id, 73, 'empty'),
    (v_dev_id, v_tube_id, 74, 'empty'),
    (v_dev_id, v_tube_id, 75, 'empty'),
    (v_dev_id, v_tube_id, 76, 'empty'),
    (v_dev_id, v_tube_id, 77, 'empty'),
    (v_dev_id, v_tube_id, 78, 'empty'),
    (v_dev_id, v_tube_id, 79, 'empty'),
    (v_dev_id, v_tube_id, 80, 'empty'),
    (v_dev_id, v_tube_id, 81, 'empty'),
    (v_dev_id, v_tube_id, 82, 'empty'),
    (v_dev_id, v_tube_id, 83, 'empty'),
    (v_dev_id, v_tube_id, 84, 'empty'),
    (v_dev_id, v_tube_id, 85, 'empty'),
    (v_dev_id, v_tube_id, 86, 'empty'),
    (v_dev_id, v_tube_id, 87, 'empty'),
    (v_dev_id, v_tube_id, 88, 'empty'),
    (v_dev_id, v_tube_id, 89, 'empty'),
    (v_dev_id, v_tube_id, 90, 'empty'),
    (v_dev_id, v_tube_id, 91, 'empty'),
    (v_dev_id, v_tube_id, 92, 'empty'),
    (v_dev_id, v_tube_id, 93, 'empty'),
    (v_dev_id, v_tube_id, 94, 'empty'),
    (v_dev_id, v_tube_id, 95, 'empty'),
    (v_dev_id, v_tube_id, 96, 'empty');

  -- ==========================================
  -- DEVICE: OTB 2 96
  -- ==========================================
  SELECT id INTO v_type_id FROM device_types WHERE name = 'OTB' LIMIT 1;
  IF v_type_id IS NULL THEN
     v_type_id := (SELECT id FROM device_types LIMIT 1); 
  END IF;
  
  v_dev_id := gen_random_uuid();
  INSERT INTO devices (id, site_id, device_type_id, name, total_ports) 
  VALUES (v_dev_id, v_site_id, v_type_id, 'OTB 2 96', 96);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 1, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 2, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 3, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 4, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 5, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 6, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 7, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 8, 12);
  INSERT INTO port_connections (device_id, tube_id, port_number, status) VALUES 
    (v_dev_id, v_tube_id, 1, 'empty'),
    (v_dev_id, v_tube_id, 2, 'empty'),
    (v_dev_id, v_tube_id, 3, 'empty'),
    (v_dev_id, v_tube_id, 4, 'empty'),
    (v_dev_id, v_tube_id, 5, 'empty'),
    (v_dev_id, v_tube_id, 6, 'empty'),
    (v_dev_id, v_tube_id, 7, 'empty'),
    (v_dev_id, v_tube_id, 8, 'empty'),
    (v_dev_id, v_tube_id, 9, 'empty'),
    (v_dev_id, v_tube_id, 10, 'empty'),
    (v_dev_id, v_tube_id, 11, 'empty'),
    (v_dev_id, v_tube_id, 12, 'empty'),
    (v_dev_id, v_tube_id, 13, 'empty'),
    (v_dev_id, v_tube_id, 14, 'empty'),
    (v_dev_id, v_tube_id, 15, 'empty'),
    (v_dev_id, v_tube_id, 16, 'empty'),
    (v_dev_id, v_tube_id, 17, 'empty'),
    (v_dev_id, v_tube_id, 18, 'empty'),
    (v_dev_id, v_tube_id, 19, 'empty'),
    (v_dev_id, v_tube_id, 20, 'empty'),
    (v_dev_id, v_tube_id, 21, 'empty'),
    (v_dev_id, v_tube_id, 22, 'empty'),
    (v_dev_id, v_tube_id, 23, 'empty'),
    (v_dev_id, v_tube_id, 24, 'empty'),
    (v_dev_id, v_tube_id, 25, 'empty'),
    (v_dev_id, v_tube_id, 26, 'empty'),
    (v_dev_id, v_tube_id, 27, 'empty'),
    (v_dev_id, v_tube_id, 28, 'empty'),
    (v_dev_id, v_tube_id, 29, 'empty'),
    (v_dev_id, v_tube_id, 30, 'empty'),
    (v_dev_id, v_tube_id, 31, 'empty'),
    (v_dev_id, v_tube_id, 32, 'empty'),
    (v_dev_id, v_tube_id, 33, 'empty'),
    (v_dev_id, v_tube_id, 34, 'empty'),
    (v_dev_id, v_tube_id, 35, 'empty'),
    (v_dev_id, v_tube_id, 36, 'empty'),
    (v_dev_id, v_tube_id, 37, 'empty'),
    (v_dev_id, v_tube_id, 38, 'empty'),
    (v_dev_id, v_tube_id, 39, 'empty'),
    (v_dev_id, v_tube_id, 40, 'empty'),
    (v_dev_id, v_tube_id, 41, 'empty'),
    (v_dev_id, v_tube_id, 42, 'empty'),
    (v_dev_id, v_tube_id, 43, 'empty'),
    (v_dev_id, v_tube_id, 44, 'empty'),
    (v_dev_id, v_tube_id, 45, 'empty'),
    (v_dev_id, v_tube_id, 46, 'empty'),
    (v_dev_id, v_tube_id, 47, 'empty'),
    (v_dev_id, v_tube_id, 48, 'empty'),
    (v_dev_id, v_tube_id, 49, 'empty'),
    (v_dev_id, v_tube_id, 50, 'empty'),
    (v_dev_id, v_tube_id, 51, 'empty'),
    (v_dev_id, v_tube_id, 52, 'empty'),
    (v_dev_id, v_tube_id, 53, 'empty'),
    (v_dev_id, v_tube_id, 54, 'empty'),
    (v_dev_id, v_tube_id, 55, 'empty'),
    (v_dev_id, v_tube_id, 56, 'empty'),
    (v_dev_id, v_tube_id, 57, 'empty'),
    (v_dev_id, v_tube_id, 58, 'empty'),
    (v_dev_id, v_tube_id, 59, 'empty'),
    (v_dev_id, v_tube_id, 60, 'empty'),
    (v_dev_id, v_tube_id, 61, 'empty'),
    (v_dev_id, v_tube_id, 62, 'empty'),
    (v_dev_id, v_tube_id, 63, 'empty'),
    (v_dev_id, v_tube_id, 64, 'empty'),
    (v_dev_id, v_tube_id, 65, 'empty'),
    (v_dev_id, v_tube_id, 66, 'empty'),
    (v_dev_id, v_tube_id, 67, 'empty'),
    (v_dev_id, v_tube_id, 68, 'empty'),
    (v_dev_id, v_tube_id, 69, 'empty'),
    (v_dev_id, v_tube_id, 70, 'empty'),
    (v_dev_id, v_tube_id, 71, 'empty'),
    (v_dev_id, v_tube_id, 72, 'empty'),
    (v_dev_id, v_tube_id, 73, 'empty'),
    (v_dev_id, v_tube_id, 74, 'empty'),
    (v_dev_id, v_tube_id, 75, 'empty'),
    (v_dev_id, v_tube_id, 76, 'empty'),
    (v_dev_id, v_tube_id, 77, 'empty'),
    (v_dev_id, v_tube_id, 78, 'empty'),
    (v_dev_id, v_tube_id, 79, 'empty'),
    (v_dev_id, v_tube_id, 80, 'empty'),
    (v_dev_id, v_tube_id, 81, 'empty'),
    (v_dev_id, v_tube_id, 82, 'empty'),
    (v_dev_id, v_tube_id, 83, 'empty'),
    (v_dev_id, v_tube_id, 84, 'empty'),
    (v_dev_id, v_tube_id, 85, 'empty'),
    (v_dev_id, v_tube_id, 86, 'empty'),
    (v_dev_id, v_tube_id, 87, 'empty'),
    (v_dev_id, v_tube_id, 88, 'empty'),
    (v_dev_id, v_tube_id, 89, 'empty'),
    (v_dev_id, v_tube_id, 90, 'empty'),
    (v_dev_id, v_tube_id, 91, 'empty'),
    (v_dev_id, v_tube_id, 92, 'empty'),
    (v_dev_id, v_tube_id, 93, 'empty'),
    (v_dev_id, v_tube_id, 94, 'empty'),
    (v_dev_id, v_tube_id, 95, 'empty'),
    (v_dev_id, v_tube_id, 96, 'empty');

  -- ==========================================
  -- DEVICE: OTB 3 144
  -- ==========================================
  SELECT id INTO v_type_id FROM device_types WHERE name = 'OTB' LIMIT 1;
  IF v_type_id IS NULL THEN
     v_type_id := (SELECT id FROM device_types LIMIT 1); 
  END IF;
  
  v_dev_id := gen_random_uuid();
  INSERT INTO devices (id, site_id, device_type_id, name, total_ports) 
  VALUES (v_dev_id, v_site_id, v_type_id, 'OTB 3 144', 144);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 1, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 2, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 3, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 4, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 5, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 6, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 7, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 8, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 9, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 10, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 11, 12);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes (id, device_id, tube_number, total_cores) VALUES (v_tube_id, v_dev_id, 12, 12);
  INSERT INTO port_connections (device_id, tube_id, port_number, status) VALUES 
    (v_dev_id, v_tube_id, 133, 'empty'),
    (v_dev_id, v_tube_id, 134, 'empty'),
    (v_dev_id, v_tube_id, 135, 'empty'),
    (v_dev_id, v_tube_id, 136, 'empty'),
    (v_dev_id, v_tube_id, 137, 'empty'),
    (v_dev_id, v_tube_id, 138, 'empty'),
    (v_dev_id, v_tube_id, 139, 'empty'),
    (v_dev_id, v_tube_id, 140, 'empty'),
    (v_dev_id, v_tube_id, 141, 'empty'),
    (v_dev_id, v_tube_id, 142, 'empty'),
    (v_dev_id, v_tube_id, 143, 'empty'),
    (v_dev_id, v_tube_id, 144, 'empty'),
    (v_dev_id, v_tube_id, 121, 'empty'),
    (v_dev_id, v_tube_id, 122, 'empty'),
    (v_dev_id, v_tube_id, 123, 'empty'),
    (v_dev_id, v_tube_id, 124, 'empty'),
    (v_dev_id, v_tube_id, 125, 'empty'),
    (v_dev_id, v_tube_id, 126, 'empty'),
    (v_dev_id, v_tube_id, 127, 'empty'),
    (v_dev_id, v_tube_id, 128, 'empty'),
    (v_dev_id, v_tube_id, 129, 'empty'),
    (v_dev_id, v_tube_id, 130, 'empty'),
    (v_dev_id, v_tube_id, 131, 'empty'),
    (v_dev_id, v_tube_id, 132, 'empty'),
    (v_dev_id, v_tube_id, 109, 'empty'),
    (v_dev_id, v_tube_id, 110, 'empty'),
    (v_dev_id, v_tube_id, 111, 'empty'),
    (v_dev_id, v_tube_id, 112, 'empty'),
    (v_dev_id, v_tube_id, 113, 'empty'),
    (v_dev_id, v_tube_id, 114, 'empty'),
    (v_dev_id, v_tube_id, 115, 'empty'),
    (v_dev_id, v_tube_id, 116, 'empty'),
    (v_dev_id, v_tube_id, 117, 'empty'),
    (v_dev_id, v_tube_id, 118, 'empty'),
    (v_dev_id, v_tube_id, 119, 'empty'),
    (v_dev_id, v_tube_id, 120, 'empty'),
    (v_dev_id, v_tube_id, 97, 'empty'),
    (v_dev_id, v_tube_id, 98, 'empty'),
    (v_dev_id, v_tube_id, 99, 'empty'),
    (v_dev_id, v_tube_id, 100, 'empty'),
    (v_dev_id, v_tube_id, 101, 'empty'),
    (v_dev_id, v_tube_id, 102, 'empty'),
    (v_dev_id, v_tube_id, 103, 'empty'),
    (v_dev_id, v_tube_id, 104, 'empty'),
    (v_dev_id, v_tube_id, 105, 'empty'),
    (v_dev_id, v_tube_id, 106, 'empty'),
    (v_dev_id, v_tube_id, 107, 'empty'),
    (v_dev_id, v_tube_id, 108, 'empty'),
    (v_dev_id, v_tube_id, 85, 'empty'),
    (v_dev_id, v_tube_id, 86, 'empty'),
    (v_dev_id, v_tube_id, 87, 'empty'),
    (v_dev_id, v_tube_id, 88, 'empty'),
    (v_dev_id, v_tube_id, 89, 'empty'),
    (v_dev_id, v_tube_id, 90, 'empty'),
    (v_dev_id, v_tube_id, 91, 'empty'),
    (v_dev_id, v_tube_id, 92, 'empty'),
    (v_dev_id, v_tube_id, 93, 'empty'),
    (v_dev_id, v_tube_id, 94, 'empty'),
    (v_dev_id, v_tube_id, 95, 'empty'),
    (v_dev_id, v_tube_id, 96, 'empty'),
    (v_dev_id, v_tube_id, 73, 'empty'),
    (v_dev_id, v_tube_id, 74, 'empty'),
    (v_dev_id, v_tube_id, 75, 'empty'),
    (v_dev_id, v_tube_id, 76, 'empty'),
    (v_dev_id, v_tube_id, 77, 'empty'),
    (v_dev_id, v_tube_id, 78, 'empty'),
    (v_dev_id, v_tube_id, 79, 'empty'),
    (v_dev_id, v_tube_id, 80, 'empty'),
    (v_dev_id, v_tube_id, 81, 'empty'),
    (v_dev_id, v_tube_id, 82, 'empty'),
    (v_dev_id, v_tube_id, 83, 'empty'),
    (v_dev_id, v_tube_id, 84, 'empty'),
    (v_dev_id, v_tube_id, 61, 'empty'),
    (v_dev_id, v_tube_id, 62, 'empty'),
    (v_dev_id, v_tube_id, 63, 'empty'),
    (v_dev_id, v_tube_id, 64, 'empty'),
    (v_dev_id, v_tube_id, 65, 'empty'),
    (v_dev_id, v_tube_id, 66, 'empty'),
    (v_dev_id, v_tube_id, 67, 'empty'),
    (v_dev_id, v_tube_id, 68, 'empty'),
    (v_dev_id, v_tube_id, 69, 'empty'),
    (v_dev_id, v_tube_id, 70, 'empty'),
    (v_dev_id, v_tube_id, 71, 'empty'),
    (v_dev_id, v_tube_id, 72, 'empty'),
    (v_dev_id, v_tube_id, 49, 'empty'),
    (v_dev_id, v_tube_id, 50, 'empty'),
    (v_dev_id, v_tube_id, 51, 'empty'),
    (v_dev_id, v_tube_id, 52, 'empty'),
    (v_dev_id, v_tube_id, 53, 'empty'),
    (v_dev_id, v_tube_id, 54, 'empty'),
    (v_dev_id, v_tube_id, 55, 'empty'),
    (v_dev_id, v_tube_id, 56, 'empty'),
    (v_dev_id, v_tube_id, 57, 'empty'),
    (v_dev_id, v_tube_id, 58, 'empty'),
    (v_dev_id, v_tube_id, 59, 'empty'),
    (v_dev_id, v_tube_id, 60, 'empty'),
    (v_dev_id, v_tube_id, 37, 'empty'),
    (v_dev_id, v_tube_id, 38, 'empty'),
    (v_dev_id, v_tube_id, 39, 'empty'),
    (v_dev_id, v_tube_id, 40, 'empty'),
    (v_dev_id, v_tube_id, 41, 'empty'),
    (v_dev_id, v_tube_id, 42, 'empty'),
    (v_dev_id, v_tube_id, 43, 'empty'),
    (v_dev_id, v_tube_id, 44, 'empty'),
    (v_dev_id, v_tube_id, 45, 'empty'),
    (v_dev_id, v_tube_id, 46, 'empty'),
    (v_dev_id, v_tube_id, 47, 'empty'),
    (v_dev_id, v_tube_id, 48, 'empty'),
    (v_dev_id, v_tube_id, 25, 'empty'),
    (v_dev_id, v_tube_id, 26, 'empty'),
    (v_dev_id, v_tube_id, 27, 'empty'),
    (v_dev_id, v_tube_id, 28, 'empty'),
    (v_dev_id, v_tube_id, 29, 'empty'),
    (v_dev_id, v_tube_id, 30, 'empty'),
    (v_dev_id, v_tube_id, 31, 'empty'),
    (v_dev_id, v_tube_id, 32, 'empty'),
    (v_dev_id, v_tube_id, 33, 'empty'),
    (v_dev_id, v_tube_id, 34, 'empty'),
    (v_dev_id, v_tube_id, 35, 'empty'),
    (v_dev_id, v_tube_id, 36, 'empty'),
    (v_dev_id, v_tube_id, 13, 'empty'),
    (v_dev_id, v_tube_id, 14, 'empty'),
    (v_dev_id, v_tube_id, 15, 'empty'),
    (v_dev_id, v_tube_id, 16, 'empty'),
    (v_dev_id, v_tube_id, 17, 'empty'),
    (v_dev_id, v_tube_id, 18, 'empty'),
    (v_dev_id, v_tube_id, 19, 'empty'),
    (v_dev_id, v_tube_id, 20, 'empty'),
    (v_dev_id, v_tube_id, 21, 'empty'),
    (v_dev_id, v_tube_id, 22, 'empty'),
    (v_dev_id, v_tube_id, 23, 'empty'),
    (v_dev_id, v_tube_id, 24, 'empty'),
    (v_dev_id, v_tube_id, 1, 'empty'),
    (v_dev_id, v_tube_id, 2, 'empty'),
    (v_dev_id, v_tube_id, 3, 'empty'),
    (v_dev_id, v_tube_id, 4, 'empty'),
    (v_dev_id, v_tube_id, 5, 'empty'),
    (v_dev_id, v_tube_id, 6, 'empty'),
    (v_dev_id, v_tube_id, 7, 'empty'),
    (v_dev_id, v_tube_id, 8, 'empty'),
    (v_dev_id, v_tube_id, 9, 'empty'),
    (v_dev_id, v_tube_id, 10, 'empty'),
    (v_dev_id, v_tube_id, 11, 'empty'),
    (v_dev_id, v_tube_id, 12, 'empty');

  -- ==========================================
  -- DEVICE: CISCO
  -- ==========================================
  SELECT id INTO v_type_id FROM device_types WHERE name = 'CISCO' LIMIT 1;
  IF v_type_id IS NULL THEN
     v_type_id := (SELECT id FROM device_types LIMIT 1); 
  END IF;
  
  v_dev_id := gen_random_uuid();
  INSERT INTO devices (id, site_id, device_type_id, name, total_ports) 
  VALUES (v_dev_id, v_site_id, v_type_id, 'CISCO', 48);
  INSERT INTO port_connections (device_id, port_number, status) VALUES 
    (v_dev_id, 1, 'empty'),
    (v_dev_id, 2, 'empty'),
    (v_dev_id, 3, 'empty'),
    (v_dev_id, 4, 'empty'),
    (v_dev_id, 5, 'empty'),
    (v_dev_id, 6, 'empty'),
    (v_dev_id, 7, 'empty'),
    (v_dev_id, 8, 'empty'),
    (v_dev_id, 9, 'empty'),
    (v_dev_id, 10, 'empty'),
    (v_dev_id, 11, 'empty'),
    (v_dev_id, 12, 'empty'),
    (v_dev_id, 13, 'empty'),
    (v_dev_id, 14, 'empty'),
    (v_dev_id, 15, 'empty'),
    (v_dev_id, 16, 'empty'),
    (v_dev_id, 17, 'empty'),
    (v_dev_id, 18, 'empty'),
    (v_dev_id, 19, 'empty'),
    (v_dev_id, 20, 'empty'),
    (v_dev_id, 21, 'empty'),
    (v_dev_id, 22, 'empty'),
    (v_dev_id, 23, 'empty'),
    (v_dev_id, 24, 'empty'),
    (v_dev_id, 25, 'empty'),
    (v_dev_id, 26, 'empty'),
    (v_dev_id, 27, 'empty'),
    (v_dev_id, 28, 'empty'),
    (v_dev_id, 29, 'empty'),
    (v_dev_id, 30, 'empty'),
    (v_dev_id, 31, 'empty'),
    (v_dev_id, 32, 'empty'),
    (v_dev_id, 33, 'empty'),
    (v_dev_id, 34, 'empty'),
    (v_dev_id, 35, 'empty'),
    (v_dev_id, 36, 'empty'),
    (v_dev_id, 37, 'empty'),
    (v_dev_id, 38, 'empty'),
    (v_dev_id, 39, 'empty'),
    (v_dev_id, 40, 'empty'),
    (v_dev_id, 41, 'empty'),
    (v_dev_id, 42, 'empty'),
    (v_dev_id, 43, 'empty'),
    (v_dev_id, 44, 'empty'),
    (v_dev_id, 45, 'empty'),
    (v_dev_id, 46, 'empty'),
    (v_dev_id, 47, 'empty'),
    (v_dev_id, 48, 'empty');

  -- ==========================================
  -- DEVICE: HUAWEI
  -- ==========================================
  SELECT id INTO v_type_id FROM device_types WHERE name = 'HUAWEI' LIMIT 1;
  IF v_type_id IS NULL THEN
     v_type_id := (SELECT id FROM device_types LIMIT 1); 
  END IF;
  
  v_dev_id := gen_random_uuid();
  INSERT INTO devices (id, site_id, device_type_id, name, total_ports) 
  VALUES (v_dev_id, v_site_id, v_type_id, 'HUAWEI', 48);
  INSERT INTO port_connections (device_id, port_number, status) VALUES 
    (v_dev_id, 1, 'empty'),
    (v_dev_id, 2, 'empty'),
    (v_dev_id, 3, 'empty'),
    (v_dev_id, 4, 'empty'),
    (v_dev_id, 5, 'empty'),
    (v_dev_id, 6, 'empty'),
    (v_dev_id, 7, 'empty'),
    (v_dev_id, 8, 'empty'),
    (v_dev_id, 9, 'empty'),
    (v_dev_id, 10, 'empty'),
    (v_dev_id, 11, 'empty'),
    (v_dev_id, 12, 'empty'),
    (v_dev_id, 13, 'empty'),
    (v_dev_id, 14, 'empty'),
    (v_dev_id, 15, 'empty'),
    (v_dev_id, 16, 'empty'),
    (v_dev_id, 17, 'empty'),
    (v_dev_id, 18, 'empty'),
    (v_dev_id, 19, 'empty'),
    (v_dev_id, 20, 'empty'),
    (v_dev_id, 21, 'empty'),
    (v_dev_id, 22, 'empty'),
    (v_dev_id, 23, 'empty'),
    (v_dev_id, 24, 'empty'),
    (v_dev_id, 25, 'empty'),
    (v_dev_id, 26, 'empty'),
    (v_dev_id, 27, 'empty'),
    (v_dev_id, 28, 'empty'),
    (v_dev_id, 29, 'empty'),
    (v_dev_id, 30, 'empty'),
    (v_dev_id, 31, 'empty'),
    (v_dev_id, 32, 'empty'),
    (v_dev_id, 33, 'empty'),
    (v_dev_id, 34, 'empty'),
    (v_dev_id, 35, 'empty'),
    (v_dev_id, 36, 'empty'),
    (v_dev_id, 37, 'empty'),
    (v_dev_id, 38, 'empty'),
    (v_dev_id, 39, 'empty'),
    (v_dev_id, 40, 'empty'),
    (v_dev_id, 41, 'empty'),
    (v_dev_id, 42, 'empty'),
    (v_dev_id, 43, 'empty'),
    (v_dev_id, 44, 'empty'),
    (v_dev_id, 45, 'empty'),
    (v_dev_id, 46, 'empty'),
    (v_dev_id, 47, 'empty'),
    (v_dev_id, 48, 'empty');
END $$;
COMMIT;
