BEGIN;
DO $$
DECLARE
  v_site_id uuid;
  v_type_id uuid;
  v_dev_id  uuid;
  v_tube_id uuid;
BEGIN
  -- Cek/buat site Banyumas
  SELECT id INTO v_site_id FROM sites WHERE code = 'BMS' LIMIT 1;
  IF v_site_id IS NULL THEN
    v_site_id := gen_random_uuid();
    INSERT INTO sites (id,name,code,location,is_active)
    VALUES (v_site_id,'Banyumas','BMS','Jawa Tengah',true);
  END IF;

  -- Fix Schema Bug: Hapus SEMUA foreign key dari tabel log ke entitas utama
  ALTER TABLE IF EXISTS port_audit_log DROP CONSTRAINT IF EXISTS port_audit_log_port_id_fkey;
  ALTER TABLE IF EXISTS port_audit_log DROP CONSTRAINT IF EXISTS port_audit_log_device_id_fkey;
  ALTER TABLE IF EXISTS port_audit_log DROP CONSTRAINT IF EXISTS port_audit_log_site_id_fkey;
  ALTER TABLE IF EXISTS port_audit_log DROP CONSTRAINT IF EXISTS port_audit_log_tube_id_fkey;

  ALTER TABLE IF EXISTS device_audit_log DROP CONSTRAINT IF EXISTS device_audit_log_device_id_fkey;
  ALTER TABLE IF EXISTS device_audit_log DROP CONSTRAINT IF EXISTS device_audit_log_site_id_fkey;

  ALTER TABLE IF EXISTS tube_audit_log DROP CONSTRAINT IF EXISTS tube_audit_log_tube_id_fkey;
  ALTER TABLE IF EXISTS tube_audit_log DROP CONSTRAINT IF EXISTS tube_audit_log_device_id_fkey;

  -- Hapus data lama agar tidak duplicate key
  DELETE FROM devices 
  WHERE site_id = v_site_id 
    AND name IN ('OTB 1 96', 'OTB 2 96', 'OTB 3 144', 'CISCO', 'HUAWEI', 'GTGO OLT');

  -- ==============================
  -- OTB 1 96
  -- ==============================
  SELECT id INTO v_type_id FROM device_types WHERE name='OTB' LIMIT 1;
  v_dev_id := gen_random_uuid();
  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)
  VALUES(v_dev_id,v_site_id,v_type_id,'OTB 1 96',96,true);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,1,24);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,1,'CORE 1',NULL,'empty'),
    (v_dev_id,v_tube_id,2,'CORE 2',NULL,'empty'),
    (v_dev_id,v_tube_id,3,'CORE 3',NULL,'empty'),
    (v_dev_id,v_tube_id,4,'CORE 4',NULL,'empty'),
    (v_dev_id,v_tube_id,5,'CORE 5',NULL,'empty'),
    (v_dev_id,v_tube_id,6,'CORE 6',NULL,'empty'),
    (v_dev_id,v_tube_id,7,'CORE 7',NULL,'empty'),
    (v_dev_id,v_tube_id,8,'CORE 8','Adisana Mie Ayam 1/5/5','filled'),
    (v_dev_id,v_tube_id,9,'CORE 9','Adisana Cafe 1/4/4','filled'),
    (v_dev_id,v_tube_id,10,'CORE 10','Adisana BRI 1/4/5','filled'),
    (v_dev_id,v_tube_id,11,'CORE 11','Buntu Handoko 1/4/8','filled'),
    (v_dev_id,v_tube_id,12,'CORE 12','Sidamulya Tegong 1/6/3','filled'),
    (v_dev_id,v_tube_id,13,'CORE 13',NULL,'empty'),
    (v_dev_id,v_tube_id,14,'CORE 14',NULL,'empty'),
    (v_dev_id,v_tube_id,15,'CORE 15',NULL,'empty'),
    (v_dev_id,v_tube_id,16,'CORE 16',NULL,'empty'),
    (v_dev_id,v_tube_id,17,'CORE 17',NULL,'empty'),
    (v_dev_id,v_tube_id,18,'CORE 18',NULL,'empty'),
    (v_dev_id,v_tube_id,19,'CORE 19',NULL,'empty'),
    (v_dev_id,v_tube_id,20,'CORE 20',NULL,'empty'),
    (v_dev_id,v_tube_id,21,'CORE 21',NULL,'empty'),
    (v_dev_id,v_tube_id,22,'CORE 22','Puri Mujur 1/7/8','filled'),
    (v_dev_id,v_tube_id,23,'CORE 23',NULL,'empty'),
    (v_dev_id,v_tube_id,24,'CORE 24','Pecangakan 1/5/4','filled');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,2,24);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,25,'CORE 25','Karag 1 1/5/2','filled'),
    (v_dev_id,v_tube_id,26,'CORE 26','Mujur Cadar 1/5/3','filled'),
    (v_dev_id,v_tube_id,27,'CORE 27',NULL,'empty'),
    (v_dev_id,v_tube_id,28,'CORE 28',NULL,'empty'),
    (v_dev_id,v_tube_id,29,'CORE 29',NULL,'empty'),
    (v_dev_id,v_tube_id,30,'CORE 30',NULL,'empty'),
    (v_dev_id,v_tube_id,31,'CORE 31',NULL,'empty'),
    (v_dev_id,v_tube_id,32,'CORE 32',NULL,'empty'),
    (v_dev_id,v_tube_id,33,'CORE 33',NULL,'empty'),
    (v_dev_id,v_tube_id,34,'CORE 34',NULL,'empty'),
    (v_dev_id,v_tube_id,35,'CORE 35',NULL,'empty'),
    (v_dev_id,v_tube_id,36,'CORE 36',NULL,'empty'),
    (v_dev_id,v_tube_id,37,'CORE 37','Kaliontong 1/6/2','filled'),
    (v_dev_id,v_tube_id,38,'CORE 38','Kalisalak Jimat 1/4/3','filled'),
    (v_dev_id,v_tube_id,39,'CORE 39','Kalijaran 1/3/5','filled'),
    (v_dev_id,v_tube_id,40,'CORE 40','Karangtengah 1 1/3/2','filled'),
    (v_dev_id,v_tube_id,41,'CORE 41','Sawangan 1/6/1','filled'),
    (v_dev_id,v_tube_id,42,'CORE 42','Kalisalak Tugu 1/5/7','filled'),
    (v_dev_id,v_tube_id,43,'CORE 43','Karangjati 1 1/7/6','filled'),
    (v_dev_id,v_tube_id,44,'CORE 44','Kaliwedi 2 1/12/8','filled'),
    (v_dev_id,v_tube_id,45,'CORE 45','Paberasan 1/6/5','filled'),
    (v_dev_id,v_tube_id,46,'CORE 46','Gentasari Mumpuni 1/6/7','filled'),
    (v_dev_id,v_tube_id,47,'CORE 47','bentul 1','filled'),
    (v_dev_id,v_tube_id,48,'CORE 48','bentul 2','filled');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,3,24);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,49,'CORE 49','Sawangan Barat Rel 1/7/3','filled'),
    (v_dev_id,v_tube_id,50,'CORE 50','kebasen 1','filled'),
    (v_dev_id,v_tube_id,51,'CORE 51','kebasen 2','filled'),
    (v_dev_id,v_tube_id,52,'CORE 52','kebasen 3','filled'),
    (v_dev_id,v_tube_id,53,'CORE 53',NULL,'empty'),
    (v_dev_id,v_tube_id,54,'CORE 54',NULL,'empty'),
    (v_dev_id,v_tube_id,55,'CORE 55',NULL,'empty'),
    (v_dev_id,v_tube_id,56,'CORE 56','Kalisalak Apotek 1/15/8','filled'),
    (v_dev_id,v_tube_id,57,'CORE 57','RANDEGAN 1/15/3','filled'),
    (v_dev_id,v_tube_id,58,'CORE 58',NULL,'empty'),
    (v_dev_id,v_tube_id,59,'CORE 59',NULL,'empty'),
    (v_dev_id,v_tube_id,60,'CORE 60',NULL,'empty'),
    (v_dev_id,v_tube_id,61,'CORE 61','Grujugan 1/3/4','filled'),
    (v_dev_id,v_tube_id,62,'CORE 62','Grujugan 1/9/4','filled'),
    (v_dev_id,v_tube_id,63,'CORE 63','Grujugan 2 1/9/7','filled'),
    (v_dev_id,v_tube_id,64,'CORE 64',NULL,'empty'),
    (v_dev_id,v_tube_id,65,'CORE 65','Karag 2 1/13/2','filled'),
    (v_dev_id,v_tube_id,66,'CORE 66',NULL,'empty'),
    (v_dev_id,v_tube_id,67,'CORE 67',NULL,'empty'),
    (v_dev_id,v_tube_id,68,'CORE 68',NULL,'empty'),
    (v_dev_id,v_tube_id,69,'CORE 69',NULL,'empty'),
    (v_dev_id,v_tube_id,70,'CORE 70',NULL,'empty'),
    (v_dev_id,v_tube_id,71,'CORE 71',NULL,'empty'),
    (v_dev_id,v_tube_id,72,'CORE 72',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,4,24);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,73,'CORE 73','Bangsa Pos PP 2 1/8/1','filled'),
    (v_dev_id,v_tube_id,74,'CORE 74',NULL,'empty'),
    (v_dev_id,v_tube_id,75,'CORE 75','Bangsa Pos PP 1 1/5/8','filled'),
    (v_dev_id,v_tube_id,76,'CORE 76','Adisana Lampeng 2 1/13/3','filled'),
    (v_dev_id,v_tube_id,77,'CORE 77','Adisana Karagtalun 1/13/4','filled'),
    (v_dev_id,v_tube_id,78,'CORE 78','bangsa tugu','filled'),
    (v_dev_id,v_tube_id,79,'CORE 79',NULL,'empty'),
    (v_dev_id,v_tube_id,80,'CORE 80','Bangsa Tugu 1/4/2','filled'),
    (v_dev_id,v_tube_id,81,'CORE 81',NULL,'empty'),
    (v_dev_id,v_tube_id,82,'CORE 82','Adisana Lampeng 1/16/3','filled'),
    (v_dev_id,v_tube_id,83,'CORE 83',NULL,'empty'),
    (v_dev_id,v_tube_id,84,'CORE 84',NULL,'empty'),
    (v_dev_id,v_tube_id,85,'CORE 85',NULL,'empty'),
    (v_dev_id,v_tube_id,86,'CORE 86',NULL,'empty'),
    (v_dev_id,v_tube_id,87,'CORE 87',NULL,'empty'),
    (v_dev_id,v_tube_id,88,'CORE 88',NULL,'empty'),
    (v_dev_id,v_tube_id,89,'CORE 89',NULL,'empty'),
    (v_dev_id,v_tube_id,90,'CORE 90',NULL,'empty'),
    (v_dev_id,v_tube_id,91,'CORE 91',NULL,'empty'),
    (v_dev_id,v_tube_id,92,'CORE 92',NULL,'empty'),
    (v_dev_id,v_tube_id,93,'CORE 93',NULL,'empty'),
    (v_dev_id,v_tube_id,94,'CORE 94',NULL,'empty'),
    (v_dev_id,v_tube_id,95,'CORE 95',NULL,'empty'),
    (v_dev_id,v_tube_id,96,'CORE 96',NULL,'empty');

  -- ==============================
  -- OTB 2 96
  -- ==============================
  SELECT id INTO v_type_id FROM device_types WHERE name='OTB' LIMIT 1;
  v_dev_id := gen_random_uuid();
  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)
  VALUES(v_dev_id,v_site_id,v_type_id,'OTB 2 96',96,true);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,1,24);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,1,'CORE 1','Kebarongan 1/14/8','filled'),
    (v_dev_id,v_tube_id,2,'CORE 2','Sidamulya Bonjok 1/8/7','filled'),
    (v_dev_id,v_tube_id,3,'CORE 3',NULL,'empty'),
    (v_dev_id,v_tube_id,4,'CORE 4','Alasmalang 1/8/6','filled'),
    (v_dev_id,v_tube_id,5,'CORE 5','Kebarongan MWI 1/16/1','filled'),
    (v_dev_id,v_tube_id,6,'CORE 6',NULL,'empty'),
    (v_dev_id,v_tube_id,7,'CORE 7','Aris Tanggeran Port 18','filled'),
    (v_dev_id,v_tube_id,8,'CORE 8',NULL,'empty'),
    (v_dev_id,v_tube_id,9,'CORE 9','Up Link TIS Port 46','filled'),
    (v_dev_id,v_tube_id,10,'CORE 10',NULL,'empty'),
    (v_dev_id,v_tube_id,11,'CORE 11','Up Link TIS Port 47','filled'),
    (v_dev_id,v_tube_id,12,'CORE 12','Up Link TIS Huawei 46','filled'),
    (v_dev_id,v_tube_id,13,'CORE 13',NULL,'empty'),
    (v_dev_id,v_tube_id,14,'CORE 14',NULL,'empty'),
    (v_dev_id,v_tube_id,15,'CORE 15',NULL,'empty'),
    (v_dev_id,v_tube_id,16,'CORE 16',NULL,'empty'),
    (v_dev_id,v_tube_id,17,'CORE 17',NULL,'empty'),
    (v_dev_id,v_tube_id,18,'CORE 18',NULL,'empty'),
    (v_dev_id,v_tube_id,19,'CORE 19',NULL,'empty'),
    (v_dev_id,v_tube_id,20,'CORE 20',NULL,'empty'),
    (v_dev_id,v_tube_id,21,'CORE 21',NULL,'empty'),
    (v_dev_id,v_tube_id,22,'CORE 22',NULL,'empty'),
    (v_dev_id,v_tube_id,23,'CORE 23',NULL,'empty'),
    (v_dev_id,v_tube_id,24,'CORE 24',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,2,24);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,25,'CORE 25','Kedawung Line A 1/8/3','filled'),
    (v_dev_id,v_tube_id,26,'CORE 26',NULL,'empty'),
    (v_dev_id,v_tube_id,27,'CORE 27','Kedawung Line D 1/8/5','filled'),
    (v_dev_id,v_tube_id,28,'CORE 28','Kedawung Line C 1/8/4','filled'),
    (v_dev_id,v_tube_id,29,'CORE 29',NULL,'empty'),
    (v_dev_id,v_tube_id,30,'CORE 30','Kedawung Line B 1/9/3','filled'),
    (v_dev_id,v_tube_id,31,'CORE 31',NULL,'empty'),
    (v_dev_id,v_tube_id,32,'CORE 32',NULL,'empty'),
    (v_dev_id,v_tube_id,33,'CORE 33',NULL,'empty'),
    (v_dev_id,v_tube_id,34,'CORE 34',NULL,'empty'),
    (v_dev_id,v_tube_id,35,'CORE 35',NULL,'empty'),
    (v_dev_id,v_tube_id,36,'CORE 36',NULL,'empty'),
    (v_dev_id,v_tube_id,37,'CORE 37',NULL,'empty'),
    (v_dev_id,v_tube_id,38,'CORE 38','Nusawungu Romly Port 20','filled'),
    (v_dev_id,v_tube_id,39,'CORE 39','Nusawungu Iis Port 28','filled'),
    (v_dev_id,v_tube_id,40,'CORE 40','Rowokele Dokis Port 25','filled'),
    (v_dev_id,v_tube_id,41,'CORE 41','Kroya Ega Port 14','filled'),
    (v_dev_id,v_tube_id,42,'CORE 42',NULL,'empty'),
    (v_dev_id,v_tube_id,43,'CORE 43','Adipala Giman Port 24','filled'),
    (v_dev_id,v_tube_id,44,'CORE 44',NULL,'empty'),
    (v_dev_id,v_tube_id,45,'CORE 45',NULL,'empty'),
    (v_dev_id,v_tube_id,46,'CORE 46',NULL,'empty'),
    (v_dev_id,v_tube_id,47,'CORE 47','Up Link Nusawungu Port 12','filled'),
    (v_dev_id,v_tube_id,48,'CORE 48','Up Link Nusawungu Port 12','filled');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,3,24);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,49,'CORE 49','Pageralang 1 1/7/5','filled'),
    (v_dev_id,v_tube_id,50,'CORE 50','Pageralang 2 1/3/1','filled'),
    (v_dev_id,v_tube_id,51,'CORE 51','Karangrau Aris Port 17','filled'),
    (v_dev_id,v_tube_id,52,'CORE 52',NULL,'empty'),
    (v_dev_id,v_tube_id,53,'CORE 53',NULL,'empty'),
    (v_dev_id,v_tube_id,54,'CORE 54',NULL,'empty'),
    (v_dev_id,v_tube_id,55,'CORE 55',NULL,'empty'),
    (v_dev_id,v_tube_id,56,'CORE 56',NULL,'empty'),
    (v_dev_id,v_tube_id,57,'CORE 57',NULL,'empty'),
    (v_dev_id,v_tube_id,58,'CORE 58',NULL,'empty'),
    (v_dev_id,v_tube_id,59,'CORE 59',NULL,'empty'),
    (v_dev_id,v_tube_id,60,'CORE 60',NULL,'empty'),
    (v_dev_id,v_tube_id,61,'CORE 61','Pucung Lor 1','filled'),
    (v_dev_id,v_tube_id,62,'CORE 62','Pucung Lor 2','filled'),
    (v_dev_id,v_tube_id,63,'CORE 63',NULL,'empty'),
    (v_dev_id,v_tube_id,64,'CORE 64',NULL,'empty'),
    (v_dev_id,v_tube_id,65,'CORE 65',NULL,'empty'),
    (v_dev_id,v_tube_id,66,'CORE 66',NULL,'empty'),
    (v_dev_id,v_tube_id,67,'CORE 67',NULL,'empty'),
    (v_dev_id,v_tube_id,68,'CORE 68',NULL,'empty'),
    (v_dev_id,v_tube_id,69,'CORE 69',NULL,'empty'),
    (v_dev_id,v_tube_id,70,'CORE 70',NULL,'empty'),
    (v_dev_id,v_tube_id,71,'CORE 71',NULL,'empty'),
    (v_dev_id,v_tube_id,72,'CORE 72',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,4,24);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,73,'CORE 73',NULL,'empty'),
    (v_dev_id,v_tube_id,74,'CORE 74',NULL,'empty'),
    (v_dev_id,v_tube_id,75,'CORE 75',NULL,'empty'),
    (v_dev_id,v_tube_id,76,'CORE 76',NULL,'empty'),
    (v_dev_id,v_tube_id,77,'CORE 77',NULL,'empty'),
    (v_dev_id,v_tube_id,78,'CORE 78',NULL,'empty'),
    (v_dev_id,v_tube_id,79,'CORE 79',NULL,'empty'),
    (v_dev_id,v_tube_id,80,'CORE 80',NULL,'empty'),
    (v_dev_id,v_tube_id,81,'CORE 81',NULL,'empty'),
    (v_dev_id,v_tube_id,82,'CORE 82',NULL,'empty'),
    (v_dev_id,v_tube_id,83,'CORE 83',NULL,'empty'),
    (v_dev_id,v_tube_id,84,'CORE 84',NULL,'empty'),
    (v_dev_id,v_tube_id,85,'CORE 85',NULL,'empty'),
    (v_dev_id,v_tube_id,86,'CORE 86',NULL,'empty'),
    (v_dev_id,v_tube_id,87,'CORE 87',NULL,'empty'),
    (v_dev_id,v_tube_id,88,'CORE 88',NULL,'empty'),
    (v_dev_id,v_tube_id,89,'CORE 89',NULL,'empty'),
    (v_dev_id,v_tube_id,90,'CORE 90','Kebumen 1','filled'),
    (v_dev_id,v_tube_id,91,'CORE 91','Kebumen 2','filled'),
    (v_dev_id,v_tube_id,92,'CORE 92',NULL,'empty'),
    (v_dev_id,v_tube_id,93,'CORE 93',NULL,'empty'),
    (v_dev_id,v_tube_id,94,'CORE 94',NULL,'empty'),
    (v_dev_id,v_tube_id,95,'CORE 95',NULL,'empty'),
    (v_dev_id,v_tube_id,96,'CORE 96',NULL,'empty');

  -- ==============================
  -- OTB 3 144
  -- ==============================
  SELECT id INTO v_type_id FROM device_types WHERE name='OTB' LIMIT 1;
  v_dev_id := gen_random_uuid();
  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)
  VALUES(v_dev_id,v_site_id,v_type_id,'OTB 3 144',144,true);

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,1,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,1,'CORE 1 / 133','Backbone FS Port 1','filled'),
    (v_dev_id,v_tube_id,2,'CORE 2 / 134','Backbone FS Port 2','filled'),
    (v_dev_id,v_tube_id,3,'CORE 3 / 135',NULL,'empty'),
    (v_dev_id,v_tube_id,4,'CORE 4 / 136',NULL,'empty'),
    (v_dev_id,v_tube_id,5,'CORE 5 / 137',NULL,'empty'),
    (v_dev_id,v_tube_id,6,'CORE 6 / 138',NULL,'empty'),
    (v_dev_id,v_tube_id,7,'CORE 7 / 139',NULL,'empty'),
    (v_dev_id,v_tube_id,8,'CORE 8 / 140',NULL,'empty'),
    (v_dev_id,v_tube_id,9,'CORE 9 / 141',NULL,'empty'),
    (v_dev_id,v_tube_id,10,'CORE 10 / 142',NULL,'empty'),
    (v_dev_id,v_tube_id,11,'CORE 11 / 143',NULL,'empty'),
    (v_dev_id,v_tube_id,12,'CORE 12 / 144',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,2,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,13,'CORE 13 / 121',NULL,'empty'),
    (v_dev_id,v_tube_id,14,'CORE 14 / 122',NULL,'empty'),
    (v_dev_id,v_tube_id,15,'CORE 15 / 123',NULL,'empty'),
    (v_dev_id,v_tube_id,16,'CORE 16 / 124',NULL,'empty'),
    (v_dev_id,v_tube_id,17,'CORE 17 / 125','Jatilawang Gulit Port 16','filled'),
    (v_dev_id,v_tube_id,18,'CORE 18 / 126','Purwojati Rino Port 09','filled'),
    (v_dev_id,v_tube_id,19,'CORE 19 / 127',NULL,'empty'),
    (v_dev_id,v_tube_id,20,'CORE 20 / 128','Canduk Solechan Port 27','filled'),
    (v_dev_id,v_tube_id,21,'CORE 21 / 129','Amir Rawalo Port 16','filled'),
    (v_dev_id,v_tube_id,22,'CORE 22 / 130',NULL,'empty'),
    (v_dev_id,v_tube_id,23,'CORE 23 / 131','Ajibarang Jumadi Port 19','filled'),
    (v_dev_id,v_tube_id,24,'CORE 24 / 132','Lumbir Najib Port 26','filled');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,3,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,25,'CORE 25 / 109','Karangtengah 2 1/3/3','filled'),
    (v_dev_id,v_tube_id,26,'CORE 26 / 110','Paketingan 1 1/3/8','filled'),
    (v_dev_id,v_tube_id,27,'CORE 27 / 111','Paketingan 2 1/12/7','filled'),
    (v_dev_id,v_tube_id,28,'CORE 28 / 112','Nusajati 2 1/16/2','filled'),
    (v_dev_id,v_tube_id,29,'CORE 29 / 113',NULL,'empty'),
    (v_dev_id,v_tube_id,30,'CORE 30 / 114',NULL,'empty'),
    (v_dev_id,v_tube_id,31,'CORE 31 / 115',NULL,'empty'),
    (v_dev_id,v_tube_id,32,'CORE 32 / 116','Sampang Line D 1/9/2','filled'),
    (v_dev_id,v_tube_id,33,'CORE 33 / 117',NULL,'empty'),
    (v_dev_id,v_tube_id,34,'CORE 34 / 118',NULL,'empty'),
    (v_dev_id,v_tube_id,35,'CORE 35 / 119',NULL,'empty'),
    (v_dev_id,v_tube_id,36,'CORE 36 / 120','Sampang Line C 1/12/3','filled');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,4,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,37,'CORE 37 / 97',NULL,'empty'),
    (v_dev_id,v_tube_id,38,'CORE 38 / 98','Sampang Line A 1/9/1','filled'),
    (v_dev_id,v_tube_id,39,'CORE 39 / 99',NULL,'empty'),
    (v_dev_id,v_tube_id,40,'CORE 40 / 100','Sampang Line E 1/9/8','filled'),
    (v_dev_id,v_tube_id,41,'CORE 41 / 101',NULL,'empty'),
    (v_dev_id,v_tube_id,42,'CORE 42 / 102',NULL,'empty'),
    (v_dev_id,v_tube_id,43,'CORE 43 / 103',NULL,'empty'),
    (v_dev_id,v_tube_id,44,'CORE 44 / 104','Sikampuh 2 1/12/5','filled'),
    (v_dev_id,v_tube_id,45,'CORE 45 / 105','Sikampuh 1 1/12/6','filled'),
    (v_dev_id,v_tube_id,46,'CORE 46 / 106','Samppang Line D1 1/12/1','filled'),
    (v_dev_id,v_tube_id,47,'CORE 47 / 107','Sampang Line D2 1/12/2','filled'),
    (v_dev_id,v_tube_id,48,'CORE 48 / 108',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,5,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,49,'CORE 49 / 85','Pasar Bangsa 1 1/4/1','filled'),
    (v_dev_id,v_tube_id,50,'CORE 50 / 86','Bangsa Tugu 1/4/2','filled'),
    (v_dev_id,v_tube_id,51,'CORE 51 / 87','Pasar Bangsa 2 1/8/8','filled'),
    (v_dev_id,v_tube_id,52,'CORE 52 / 88',NULL,'empty'),
    (v_dev_id,v_tube_id,53,'CORE 53 / 89',NULL,'empty'),
    (v_dev_id,v_tube_id,54,'CORE 54 / 90',NULL,'empty'),
    (v_dev_id,v_tube_id,55,'CORE 55 / 91','Kedawung Line F 1/6/4','filled'),
    (v_dev_id,v_tube_id,56,'CORE 56 / 92','Kedawung Line F2 1/5/1','filled'),
    (v_dev_id,v_tube_id,57,'CORE 57 / 93',NULL,'empty'),
    (v_dev_id,v_tube_id,58,'CORE 58 / 94',NULL,'empty'),
    (v_dev_id,v_tube_id,59,'CORE 59 / 95',NULL,'empty'),
    (v_dev_id,v_tube_id,60,'CORE 60 / 96',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,6,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,61,'CORE 61 / 73','Gentasari Musium 1 1/7/7','filled'),
    (v_dev_id,v_tube_id,62,'CORE 62 / 74',NULL,'empty'),
    (v_dev_id,v_tube_id,63,'CORE 63 / 75','Bayeman Muhammadiyah 2 1/8/2','filled'),
    (v_dev_id,v_tube_id,64,'CORE 64 / 76','Gentasari Musium 2 1/13/1','filled'),
    (v_dev_id,v_tube_id,65,'CORE 65 / 77','bajing kulon 1/14/4','filled'),
    (v_dev_id,v_tube_id,66,'CORE 66 / 78',NULL,'empty'),
    (v_dev_id,v_tube_id,67,'CORE 67 / 79',NULL,'empty'),
    (v_dev_id,v_tube_id,68,'CORE 68 / 80',NULL,'empty'),
    (v_dev_id,v_tube_id,69,'CORE 69 /81',NULL,'empty'),
    (v_dev_id,v_tube_id,70,'CORE 70 / 82',NULL,'empty'),
    (v_dev_id,v_tube_id,71,'CORE 71 / 83',NULL,'empty'),
    (v_dev_id,v_tube_id,72,'CORE 72 / 84',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,7,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,73,'CORE 73 / 61',NULL,'empty'),
    (v_dev_id,v_tube_id,74,'CORE 74 / 62',NULL,'empty'),
    (v_dev_id,v_tube_id,75,'CORE 75 / 63',NULL,'empty'),
    (v_dev_id,v_tube_id,76,'CORE 76 / 64',NULL,'empty'),
    (v_dev_id,v_tube_id,77,'CORE 77 / 65',NULL,'empty'),
    (v_dev_id,v_tube_id,78,'CORE 78 / 66',NULL,'empty'),
    (v_dev_id,v_tube_id,79,'CORE 79 / 67',NULL,'empty'),
    (v_dev_id,v_tube_id,80,'CORE 80 / 68',NULL,'empty'),
    (v_dev_id,v_tube_id,81,'CORE 81 / 69',NULL,'empty'),
    (v_dev_id,v_tube_id,82,'CORE 82 / 70',NULL,'empty'),
    (v_dev_id,v_tube_id,83,'CORE 83 / 71',NULL,'empty'),
    (v_dev_id,v_tube_id,84,'CORE 84 / 72',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,8,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,85,'C0RE 85 / 49',NULL,'empty'),
    (v_dev_id,v_tube_id,86,'CORE 86 / 50',NULL,'empty'),
    (v_dev_id,v_tube_id,87,'CORE 87 / 51',NULL,'empty'),
    (v_dev_id,v_tube_id,88,'C0RE 88 /52',NULL,'empty'),
    (v_dev_id,v_tube_id,89,'CORE 89 / 53',NULL,'empty'),
    (v_dev_id,v_tube_id,90,'CORE 90 / 54',NULL,'empty'),
    (v_dev_id,v_tube_id,91,'C0RE 91 / 55',NULL,'empty'),
    (v_dev_id,v_tube_id,92,'CORE 92 / 56',NULL,'empty'),
    (v_dev_id,v_tube_id,93,'CORE 93 / 57',NULL,'empty'),
    (v_dev_id,v_tube_id,94,'C0RE 94 / 58',NULL,'empty'),
    (v_dev_id,v_tube_id,95,'CORE 95 / 59',NULL,'empty'),
    (v_dev_id,v_tube_id,96,'CORE 96 / 60',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,9,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,97,'CORE 97 / 37','Gunungnangka SD 1/6/6','filled'),
    (v_dev_id,v_tube_id,98,'CORE 98 / 38','Gunungnangka 2 1/5/6','filled'),
    (v_dev_id,v_tube_id,99,'CORE 99 / 39','Bayeman Lor 2 1/12/4','filled'),
    (v_dev_id,v_tube_id,100,'CORE 100 / 40',NULL,'empty'),
    (v_dev_id,v_tube_id,101,'CORE 101 / 41','Bayeman Lor 1/7/4','filled'),
    (v_dev_id,v_tube_id,102,'CORE 102 / 42',NULL,'empty'),
    (v_dev_id,v_tube_id,103,'CORE 103 / 43',NULL,'empty'),
    (v_dev_id,v_tube_id,104,'CORE 104 / 44','Bayeman Muhammadiyah 1/7/2','filled'),
    (v_dev_id,v_tube_id,105,'CORE 105 / 45','Karangjati 1/3/7','filled'),
    (v_dev_id,v_tube_id,106,'CORE 106 / 46','Karangasem 1/3/6','filled'),
    (v_dev_id,v_tube_id,107,'CORE 107 / 47',NULL,'empty'),
    (v_dev_id,v_tube_id,108,'CORE 108 / 48',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,10,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,109,'CORE 109 / 25',NULL,'empty'),
    (v_dev_id,v_tube_id,110,'CORE 110 / 26',NULL,'empty'),
    (v_dev_id,v_tube_id,111,'CORE 111 / 27',NULL,'empty'),
    (v_dev_id,v_tube_id,112,'CORE 112 / 28',NULL,'empty'),
    (v_dev_id,v_tube_id,113,'CORE 113 / 29',NULL,'empty'),
    (v_dev_id,v_tube_id,114,'CORE 114 / 30',NULL,'empty'),
    (v_dev_id,v_tube_id,115,'CORE 115 / 31',NULL,'empty'),
    (v_dev_id,v_tube_id,116,'CORE 116 / 32',NULL,'empty'),
    (v_dev_id,v_tube_id,117,'CORE 117 / 33',NULL,'empty'),
    (v_dev_id,v_tube_id,118,'CORE 118 / 34',NULL,'empty'),
    (v_dev_id,v_tube_id,119,'CORE 119 / 35',NULL,'empty'),
    (v_dev_id,v_tube_id,120,'CORE 120 / 36',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,11,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,121,'CORE 121 / 13','Randegan 1/4/6','filled'),
    (v_dev_id,v_tube_id,122,'CORE 122 / 14','Kaliwedi Baldes 1/7/1','filled'),
    (v_dev_id,v_tube_id,123,'CORE 123 / 15','Kaliwedi Diman 1/6/8','filled'),
    (v_dev_id,v_tube_id,124,'CORE 124 / 16',NULL,'empty'),
    (v_dev_id,v_tube_id,125,'CORE 125 / 17',NULL,'empty'),
    (v_dev_id,v_tube_id,126,'CORE 126 / 18',NULL,'empty'),
    (v_dev_id,v_tube_id,127,'CORE 127 / 19',NULL,'empty'),
    (v_dev_id,v_tube_id,128,'CORE 128 / 20',NULL,'empty'),
    (v_dev_id,v_tube_id,129,'CORE 129 / 21',NULL,'empty'),
    (v_dev_id,v_tube_id,130,'CORE 130 / 22',NULL,'empty'),
    (v_dev_id,v_tube_id,131,'CORE 131 / 23',NULL,'empty'),
    (v_dev_id,v_tube_id,132,'CORE 132 / 24',NULL,'empty');

  v_tube_id := gen_random_uuid();
  INSERT INTO otb_tubes(id,device_id,tube_number,total_cores)
  VALUES(v_tube_id,v_dev_id,12,12);
  INSERT INTO port_connections(device_id,tube_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,v_tube_id,133,'CORE 133 / 1','Karanganyar 1/9/5','filled'),
    (v_dev_id,v_tube_id,134,'CORE 134 / 2',NULL,'empty'),
    (v_dev_id,v_tube_id,135,'CORE 135 / 3','Sampang Brani 1/9/6','filled'),
    (v_dev_id,v_tube_id,136,'CORE 136 / 4','Maos Wasis Huawei  Port 17','filled'),
    (v_dev_id,v_tube_id,137,'CORE 137 / 5',NULL,'empty'),
    (v_dev_id,v_tube_id,138,'CORE 138 / 6',NULL,'empty'),
    (v_dev_id,v_tube_id,139,'CORE 139 / 7',NULL,'empty'),
    (v_dev_id,v_tube_id,140,'CORE 140/ 8',NULL,'empty'),
    (v_dev_id,v_tube_id,141,'CORE 141 / 9',NULL,'empty'),
    (v_dev_id,v_tube_id,142,'CORE 142 / 10',NULL,'empty'),
    (v_dev_id,v_tube_id,143,'CORE 143 / 11',NULL,'empty'),
    (v_dev_id,v_tube_id,144,'CORE 144 / 12',NULL,'empty');

  -- ==============================
  -- CISCO
  -- ==============================
  SELECT id INTO v_type_id FROM device_types WHERE name='CISCO' LIMIT 1;
  IF v_type_id IS NULL THEN SELECT id INTO v_type_id FROM device_types LIMIT 1; END IF;
  v_dev_id := gen_random_uuid();
  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)
  VALUES(v_dev_id,v_site_id,v_type_id,'CISCO',48,true);
  INSERT INTO port_connections(device_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,1,'Port 1','CWDM-KBM-1470','filled'),
    (v_dev_id,2,'Port 2','CWDM-KBM-1490','filled'),
    (v_dev_id,3,'Port 3','CWDM-KBM-1510','filled'),
    (v_dev_id,4,'Port 4','CWDM-KBM-1530','filled'),
    (v_dev_id,5,'Port 5','CWDM-KBM-1550','filled'),
    (v_dev_id,6,'Port 6','CWDM-KBM-1570','filled'),
    (v_dev_id,7,'Port 7',NULL,'empty'),
    (v_dev_id,8,'Port 8',NULL,'empty'),
    (v_dev_id,31,'Port 31',NULL,'empty'),
    (v_dev_id,32,'Port 32',NULL,'empty'),
    (v_dev_id,33,'Port 33',NULL,'empty'),
    (v_dev_id,34,'Port 34',NULL,'empty'),
    (v_dev_id,35,'Port 35',NULL,'empty'),
    (v_dev_id,36,'Port 36',NULL,'empty'),
    (v_dev_id,37,'Port 37',NULL,'empty'),
    (v_dev_id,38,'Port 38',NULL,'empty'),
    (v_dev_id,39,'Port 39',NULL,'empty'),
    (v_dev_id,40,'Port 40',NULL,'empty'),
    (v_dev_id,41,'Port 41',NULL,'empty'),
    (v_dev_id,42,'Port 42',NULL,'empty'),
    (v_dev_id,43,'Port 43',NULL,'empty'),
    (v_dev_id,44,'Port 44',NULL,'empty'),
    (v_dev_id,45,'Port 45',NULL,'empty'),
    (v_dev_id,46,'Port 46',NULL,'empty'),
    (v_dev_id,47,'Port 47',NULL,'empty'),
    (v_dev_id,48,'Port 48',NULL,'empty');

  -- ==============================
  -- HUAWEI
  -- ==============================
  SELECT id INTO v_type_id FROM device_types WHERE name='HUAWEI' LIMIT 1;
  IF v_type_id IS NULL THEN SELECT id INTO v_type_id FROM device_types LIMIT 1; END IF;
  v_dev_id := gen_random_uuid();
  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)
  VALUES(v_dev_id,v_site_id,v_type_id,'HUAWEI',56,true);
  INSERT INTO port_connections(device_id,port_number,core_label,connection_label,status) VALUES
    (v_dev_id,1,'Port 1','CWDM-KBM-1470','filled'),
    (v_dev_id,2,'Port 2','CWDM-KBM-1490','filled'),
    (v_dev_id,3,'Port 3','CWDM-KBM-1510','filled'),
    (v_dev_id,4,'Port 4','CWDM-KBM-1530','filled'),
    (v_dev_id,5,'Port 5','CWDM-KBM-1550','filled'),
    (v_dev_id,6,'Port 6','CWDM-KBM-1570','filled'),
    (v_dev_id,7,'Port 7','X86-DEDICATED-eth7','filled'),
    (v_dev_id,8,'Port 8','X86-FTTH-BMS-03','filled'),
    (v_dev_id,9,'Port 9','X86-DEDICATED-eth6','filled'),
    (v_dev_id,10,'Port 10','X86-FTTH-BMS-02-SFP1','filled'),
    (v_dev_id,11,'Port 11','X86-FTTH-BMS-02-SFP3','filled'),
    (v_dev_id,12,'Port 12',NULL,'empty'),
    (v_dev_id,13,'Port 13',NULL,'empty'),
    (v_dev_id,14,'Port 14',NULL,'empty'),
    (v_dev_id,15,'Port 15','CUST-ROMLI-PAGUBUGAN','filled'),
    (v_dev_id,16,'Port 16','CUST-ROSITA-KROYA (41-2)','filled'),
    (v_dev_id,17,'Port 17','CUST-WASIS-MAOS (','filled'),
    (v_dev_id,18,'Port 18','CUST-IISWARYANTO ( 39-2 )','filled'),
    (v_dev_id,19,'Port 19','CUST-FAUZI-SUMPIUH','filled'),
    (v_dev_id,20,'Port 20','CUST-GIMAN-ADIPALA','filled'),
    (v_dev_id,21,'Port 21','CUST-NAJIB-LUMBIR','filled'),
    (v_dev_id,22,'Port 22','CUST-GIMAN-via-MAOS','filled'),
    (v_dev_id,23,'Port 23','CUST-WASIS-via-ADPL','filled'),
    (v_dev_id,24,'Port 24',NULL,'empty'),
    (v_dev_id,25,'Port 25',NULL,'empty'),
    (v_dev_id,26,'Port 26',NULL,'empty'),
    (v_dev_id,27,'Port 27',NULL,'empty'),
    (v_dev_id,28,'Port 28',NULL,'empty'),
    (v_dev_id,29,'Port 29',NULL,'empty'),
    (v_dev_id,30,'Port 30',NULL,'empty'),
    (v_dev_id,31,'Port 31',NULL,'empty'),
    (v_dev_id,32,'Port 32',NULL,'empty'),
    (v_dev_id,33,'Port 33',NULL,'empty'),
    (v_dev_id,34,'Port 34',NULL,'empty'),
    (v_dev_id,35,'Port 35',NULL,'empty'),
    (v_dev_id,36,'Port 36',NULL,'empty'),
    (v_dev_id,37,'Port 37',NULL,'empty'),
    (v_dev_id,38,'Port 38',NULL,'empty'),
    (v_dev_id,39,'Port 39',NULL,'empty'),
    (v_dev_id,40,'Port 40',NULL,'empty'),
    (v_dev_id,41,'Port 41',NULL,'empty'),
    (v_dev_id,42,'Port 42',NULL,'empty'),
    (v_dev_id,43,'Port 43',NULL,'empty'),
    (v_dev_id,44,'Port 44',NULL,'empty'),
    (v_dev_id,45,'Port 45',NULL,'empty'),
    (v_dev_id,46,'Port 46','Up Link Padamara','filled'),
    (v_dev_id,47,'Port 47','Up Link Padamara','filled'),
    (v_dev_id,48,'Port 48','Up Link Padamara','filled'),
    (v_dev_id,49,'Port 49','MX204-et0','filled'),
    (v_dev_id,50,'Port 50','MX204-et1','filled'),
    (v_dev_id,51,'Port 51','MNA-ARISTA-09','filled'),
    (v_dev_id,52,'Port 52','NX3064-Eth1/52','filled'),
    (v_dev_id,53,'Port 53','Up Link Tis via Kebarongan','filled'),
    (v_dev_id,54,'Port 54',NULL,'empty'),
    (v_dev_id,55,'Port 55',NULL,'empty'),
    (v_dev_id,56,'Port 56',NULL,'empty');

  -- ==============================
  -- GTGO / OLT
  -- ==============================
  SELECT id INTO v_type_id FROM device_types WHERE name='GTGO' LIMIT 1;
  IF v_type_id IS NULL THEN
    SELECT id INTO v_type_id FROM device_types WHERE name='OLT' LIMIT 1;
  END IF;
  IF v_type_id IS NULL THEN SELECT id INTO v_type_id FROM device_types LIMIT 1; END IF;
  v_dev_id := gen_random_uuid();
  INSERT INTO devices(id,site_id,device_type_id,name,total_ports,is_active)
  VALUES(v_dev_id,v_site_id,v_type_id,'GTGO OLT',91,true);
  INSERT INTO port_connections(device_id,port_number,port_label,core_label,connection_label,notes,status) VALUES
    (v_dev_id,1,'1/3/1','CORE 50','Pageralang 2','OTB 2','filled'),
    (v_dev_id,2,'1/3/2','CORE 40','Karangtengah 1','OTB 1','filled'),
    (v_dev_id,3,'1/3/3','CORE 25','Karangtengah 2','OTB 3','filled'),
    (v_dev_id,4,'1/3/4','CORE 61','Grujugan','OTB 1','filled'),
    (v_dev_id,5,'1/3/5','CORE 39','Kalijaran','OTB 1','filled'),
    (v_dev_id,6,'1/3/6','CORE 106','Karangasem','OTB 3','filled'),
    (v_dev_id,7,'1/3/7','CORE 105','Karangjati','OTB 3','filled'),
    (v_dev_id,8,'1/3/8','CORE 26','Paketingan 1','OTB 3','filled'),
    (v_dev_id,9,'1/4/1','CORE 49','Pasar Bangsa 1','OTB 3','filled'),
    (v_dev_id,10,'1/4/2','CORE 80','Bangsa Tugu','OTB 1','filled'),
    (v_dev_id,11,'1/4/3','CORE 38','Kalisalak Jimat','OTB 1','filled'),
    (v_dev_id,12,'1/4/4','CORE 9','Adisana Cafe','OTB 1','filled'),
    (v_dev_id,13,'1/4/5','CORE 10','Adisana BRI','OTB 1','filled'),
    (v_dev_id,14,'1/4/6','CORE 121','Randegan','OTB 3','filled'),
    (v_dev_id,15,'1/4/7','CORE 74','KOSONG','OTB 1','empty'),
    (v_dev_id,16,'1/4/8','CORE 11','Buntu Handoko','OTB 1','filled'),
    (v_dev_id,17,'1/5/1','CORE 56','Kedawung Line F2','OTB 3','filled'),
    (v_dev_id,18,'1/5/2','CORE 25','Karag 1','OTB 1','filled'),
    (v_dev_id,19,'1/5/3','CORE 26','Mujur Cadar','OTB 1','filled'),
    (v_dev_id,20,'1/5/4','CORE 24','Pecangakan','OTB 1','filled'),
    (v_dev_id,21,'1/5/5','CORE 8','Adisana Mie Ayam','OTB 1','filled'),
    (v_dev_id,22,'1/5/6','CORE 98','Gunungnangka 2','OTB 3','filled'),
    (v_dev_id,23,'1/5/7','CORE 42','Kalisalak Tugu','OTB 1','filled'),
    (v_dev_id,24,'1/5/8','CORE 75','Bangsa Pos PP 1','OTB 1','filled'),
    (v_dev_id,25,'1/6/1','CORE 41','Kalisalak MTs','OTB 1','filled'),
    (v_dev_id,26,'1/6/2','CORE 37','Kaliontong','OTB 1','filled'),
    (v_dev_id,27,'1/6/3','CORE 12','Sidamulya Tegong','OTB 1','filled'),
    (v_dev_id,28,'1/6/4','CORE 55','Kedawung Line F','OTB 3','filled'),
    (v_dev_id,29,'1/6/5','CORE 45','Paberasan','OTB 1','filled'),
    (v_dev_id,30,'1/6/6','CORE 97','Gunungnangka SD','OTB 3','filled'),
    (v_dev_id,31,'1/6/7','CORE 46','Gentasari Mumpuni','OTB 1','filled'),
    (v_dev_id,32,'1/6/8','CORE 123','Kaliwedi Diman','OTB 3','filled'),
    (v_dev_id,33,'1/7/1','CORE 122','Kaliwedi Baldes','OTB 3','filled'),
    (v_dev_id,34,'1/7/2','CORE 104','Bayeman Muhammadiyah','OTB 3','filled'),
    (v_dev_id,35,'1/7/3','CORE 49','Sawangan Barat Rel','OTB 1','filled'),
    (v_dev_id,36,'1/7/4','CORE 101','Bayeman Lor','OTB 3','filled'),
    (v_dev_id,37,'1/7/5','CORE 49','Pageralang 1','OTB 2','filled'),
    (v_dev_id,38,'1/7/6','CORE 43','Karangjati 1','OTB 1','filled'),
    (v_dev_id,39,'1/7/7','CORE 61','Gentasari Musium 1','OTB 3','filled'),
    (v_dev_id,40,'1/7/8','CORE 22','Puri Mujur','OTB 1','filled'),
    (v_dev_id,41,'1/8/1','CORE 73','Bangsa Pos PP 2','OTB 1','filled'),
    (v_dev_id,42,'1/8/2','CORE 63','Bayeman Muhammadiyah 2','OTB 3','filled'),
    (v_dev_id,43,'1/8/3','CORE 25','Kedawung Line A','OTB 2','filled'),
    (v_dev_id,44,'1/8/4','CORE 28','Kedawung Line C','OTB 2','filled'),
    (v_dev_id,45,'1/8/5','CORE 27','Kedawung Line D','OTB 2','filled'),
    (v_dev_id,46,'1/8/6','CORE 4','Alasmalang','OTB 2','filled'),
    (v_dev_id,47,'1/8/7','CORE 2','Sidamulya Bonjok','OTB 2','filled'),
    (v_dev_id,48,'1/8/8','CORE 51','Pasar Bangsa 2','OTB 3','filled'),
    (v_dev_id,49,'1/9/1','CORE 31','Sampang Line A','OTB 3','filled'),
    (v_dev_id,50,'1/9/2','CORE 32','Sampang Line D','OTB 3','filled'),
    (v_dev_id,51,'1/9/3','CORE 30','Kedawung Line B','OTB 2','filled'),
    (v_dev_id,52,'1/9/4','CORE 62','Grujugan','OTB 1','filled'),
    (v_dev_id,53,'1/9/5','CORE 133 / 1','Karanganyar','OTB 3','filled'),
    (v_dev_id,54,'1/9/6','CORE 135 / 3','Sampang Brani','OTB 3','filled'),
    (v_dev_id,55,'1/9/7','CORE 63','Grujugan 2','OTB 1','filled'),
    (v_dev_id,56,'1/9/8','CORE 34','Sampang Line E','OTB 3','filled'),
    (v_dev_id,57,'1/12/1','CORE 33','Samppang Line D1','OTB 3','filled'),
    (v_dev_id,58,'1/12/2','CORE 35','Sampang Line D2','OTB 3','filled'),
    (v_dev_id,59,'1/12/3','CORE 36','Sampang Line C','OTB 3','filled'),
    (v_dev_id,60,'1/12/4','CORE 99','Bayeman Lor 2','OTB 3','filled'),
    (v_dev_id,61,'1/12/5','CORE 44','Sikampuh 2','OTB 3','filled'),
    (v_dev_id,62,'1/12/6','CORE 45','Sikampuh 1','OTB 3','filled'),
    (v_dev_id,63,'1/12/7','CORE 27','Paketingan 2','OTB 3','filled'),
    (v_dev_id,64,'1/12/8','CORE 44','Kaliwedi 2','OTB 1','filled'),
    (v_dev_id,65,'1/13/1','CORE 64','Gentasari Musium 2','OTB 3','filled'),
    (v_dev_id,66,'1/13/2','CORE 65','Karag 2','OTB 1','filled'),
    (v_dev_id,67,'1/13/3','CORE 76','Adisana Lampeng 2','OTB 1','filled'),
    (v_dev_id,68,'1/13/4','CORE 77','Adisana Karagtalun/BRI','OTB 1','filled'),
    (v_dev_id,69,'1/13/5','CORE 47','Bentul 1','OTB 1','filled'),
    (v_dev_id,70,'1/13/6','CORE 48','Bentul 2','OTB 1','filled'),
    (v_dev_id,71,'1/13/7','CORE 61','Pucung Lor Utr','OTB 2','filled'),
    (v_dev_id,72,'1/13/8','CORE 62','Pucur Lor Slt','OTB 2','filled'),
    (v_dev_id,73,'1/14/1','CORE 50','Kebasen 1','OTB 1','filled'),
    (v_dev_id,74,'1/14/2','CORE 51','Kebasen 2 Polsek','OTB 1','filled'),
    (v_dev_id,75,'1/14/3','CORE 52','Kebasen 3 Baldes','OTB 1','filled'),
    (v_dev_id,76,'1/14/4','CORE 65','Bajing Kulon','OTB 3','filled'),
    (v_dev_id,77,'1/14/5',NULL,'Kecila ( Line B )',NULL,'filled'),
    (v_dev_id,78,'1/14/6',NULL,'Kecila ( Line C )',NULL,'filled'),
    (v_dev_id,79,'1/14/7',NULL,'Kecila ( Line D )',NULL,'filled'),
    (v_dev_id,80,'1/14/8','Core 1','Kebarongan','OTB 2','filled'),
    (v_dev_id,81,'1/15/1',NULL,'Kecila ( Line E )',NULL,'filled'),
    (v_dev_id,82,'1/15/2',NULL,'Karangtengah 2 Maryono',NULL,'filled'),
    (v_dev_id,83,'1/15/3',NULL,'Randegan 2',NULL,'filled'),
    (v_dev_id,84,'1/15/4',NULL,'Pageralang 3',NULL,'filled'),
    (v_dev_id,85,'1/15/5',NULL,'Bangsa Tugu 2',NULL,'filled'),
    (v_dev_id,86,'1/15/6',NULL,'Kedawung Line Baru',NULL,'filled'),
    (v_dev_id,87,'1/15/7',NULL,'Puri Mujur New',NULL,'filled'),
    (v_dev_id,88,'1/15/8','CORE 56','Kalisalak Apotek','OTB 3','filled'),
    (v_dev_id,89,'1/16/1',NULL,'Kebarongan MWI',NULL,'filled'),
    (v_dev_id,90,'1/16/2','CORE 28 / 112','Nusajati 2','OTB 3','filled'),
    (v_dev_id,91,'1/16/3','CORE 82','Adisana Lampeng','OTB 1','filled');

END $$;
COMMIT;