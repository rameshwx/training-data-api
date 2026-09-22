-- Application data snapshot extracted from db_cluster-25-08-2026@22-34-26.backup.gz.
-- image_url is stored as a local route; the API expands it using PUBLIC_BASE_URL.

insert into grocery_categories (id, slug, name, created_at) values
  ('00000000-0000-0000-0000-000000000001', 'fresh-produce', 'Fresh Produce', '2026-08-18 08:36:49.650457+00'),
  ('00000000-0000-0000-0000-000000000002', 'dairy-eggs', 'Dairy & Eggs', '2026-08-18 08:36:49.650457+00'),
  ('00000000-0000-0000-0000-000000000003', 'bakery', 'Bakery', '2026-08-18 08:36:49.650457+00'),
  ('00000000-0000-0000-0000-000000000004', 'pantry', 'Pantry', '2026-08-18 08:36:49.650457+00');

insert into grocery_items
  (id, category_id, sku, name, description, unit, price_cents, image_path, image_url, is_active, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PRO-APPLE-001', 'Royal Gala Apples', 'Crisp, sweet apples selected for everyday snacking.', '1 kg bag', 690, 'royal-gala-apples.png', '/assets/grocery-images/royal-gala-apples.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'PRO-BANANA-001', 'Cavendish Bananas', 'Naturally sweet ripe bananas in a family bunch.', '1 kg', 420, 'cavendish-bananas.png', '/assets/grocery-images/cavendish-bananas.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'PRO-AVOCADO-001', 'Hass Avocados', 'Creamy ready-to-ripen avocados.', 'pack of 2', 850, 'hass-avocados.png', '/assets/grocery-images/hass-avocados.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'PRO-CARROT-001', 'Garden Carrots', 'Washed orange carrots with leafy freshness.', '500 g', 360, 'garden-carrots.png', '/assets/grocery-images/garden-carrots.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'DAI-MILK-001', 'Fresh Whole Milk', 'Pasteurized whole milk for tea, cereal, and cooking.', '1 L', 580, 'fresh-whole-milk.png', '/assets/grocery-images/fresh-whole-milk.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'DAI-YOGURT-001', 'Greek Yogurt', 'Thick plain Greek yogurt with a creamy finish.', '400 g', 790, 'greek-yogurt.png', '/assets/grocery-images/greek-yogurt.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'DAI-EGGS-001', 'Free-range Eggs', 'Large free-range eggs from local farms.', 'pack of 12', 990, 'free-range-eggs.png', '/assets/grocery-images/free-range-eggs.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'BAK-BREAD-001', 'Sourdough Loaf', 'Slow-fermented crusty artisan sourdough.', '800 g loaf', 760, 'sourdough-loaf.png', '/assets/grocery-images/sourdough-loaf.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'BAK-CROISSANT-001', 'Butter Croissants', 'All-butter flaky croissants baked fresh.', 'pack of 4', 950, 'butter-croissants.png', '/assets/grocery-images/butter-croissants.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', 'PAN-RICE-001', 'Basmati Rice', 'Fragrant long-grain basmati rice.', '1 kg', 1150, 'basmati-rice.png', '/assets/grocery-images/basmati-rice.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004', 'PAN-PASTA-001', 'Penne Pasta', 'Durum wheat penne pasta for quick dinners.', '500 g', 640, 'penne-pasta.png', '/assets/grocery-images/penne-pasta.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000004', 'PAN-COFFEE-001', 'Ground Coffee', 'Medium-roast Arabica ground coffee.', '250 g', 1380, 'ground-coffee.png', '/assets/grocery-images/ground-coffee.png', true, '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00');

insert into inventory (grocery_item_id, quantity_available, reorder_level, updated_at) values
  ('10000000-0000-0000-0000-000000000001', 40, 10, '2026-08-18 10:07:02.936745+00'),
  ('10000000-0000-0000-0000-000000000002', 55, 12, '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000003', 18, 6, '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000004', 33, 8, '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000005', 28, 8, '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000006', 21, 6, '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000007', 16, 6, '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000008', 12, 4, '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000009', 20, 6, '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000010', 37, 10, '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000011', 44, 10, '2026-08-18 08:36:49.650457+00'),
  ('10000000-0000-0000-0000-000000000012', 14, 5, '2026-08-18 08:36:49.650457+00');

insert into delivery_riders (id, display_name, vehicle_type, service_area, availability, created_at, updated_at) values
  ('20000000-0000-0000-0000-000000000001', 'Asha Perera', 'motorbike', 'Colombo Central', 'available', '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('20000000-0000-0000-0000-000000000002', 'Nimal Fernando', 'scooter', 'Colombo North', 'available', '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('20000000-0000-0000-0000-000000000003', 'Kavindi Silva', 'bicycle', 'Colombo South', 'on_delivery', '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('20000000-0000-0000-0000-000000000004', 'Ruwan Jayasuriya', 'motorbike', 'Colombo East', 'on_delivery', '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00'),
  ('20000000-0000-0000-0000-000000000005', 'Mala Wijesinghe', 'van', 'Colombo West', 'offline', '2026-08-18 08:36:49.650457+00', '2026-08-18 08:36:49.650457+00');

insert into order_quotes (id, grocery_item_id, quantity, unit_price_cents, total_cents, available_quantity, expires_at, consumed_at, created_at) values
  ('ca98729b-44e7-4be4-8957-cc5b4c5a02db', '10000000-0000-0000-0000-000000000001', 2, 690, 1380, 42, '2026-08-18 10:05:48.296239+00', null, '2026-08-18 09:55:48.296239+00'),
  ('4aa44063-8b14-473d-846c-fc649bc5b7d9', '10000000-0000-0000-0000-000000000001', 2, 690, 1380, 42, '2026-08-18 10:05:57.184952+00', null, '2026-08-18 09:55:57.184952+00'),
  ('72061b49-74e7-4800-85de-949580d05cc7', '10000000-0000-0000-0000-000000000001', 2, 690, 1380, 42, '2026-08-18 10:16:48.595141+00', '2026-08-18 10:07:02.936745+00', '2026-08-18 10:06:48.595141+00');

insert into delivery_orders
  (id, order_reference, grocery_item_id, rider_id, quantity, unit_price_cents, total_cents, customer_name, delivery_address, customer_note, status, created_at, updated_at, delivered_at, quote_id)
values
  ('30000000-0000-0000-0000-000000000001', 'GRO-DEMO-001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 2, 690, 1380, 'Leela De Silva', '28 Flower Road, Colombo 7', 'Leave with reception', 'dispatched', '2026-08-18 08:11:49.650457+00', '2026-08-18 08:36:49.650457+00', null, null),
  ('30000000-0000-0000-0000-000000000002', 'GRO-DEMO-002', '10000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000004', 1, 760, 760, 'Kamal Dias', '102 Park Lane, Colombo 5', null, 'dispatched', '2026-08-18 08:24:49.650457+00', '2026-08-18 08:36:49.650457+00', null, null),
  ('30000000-0000-0000-0000-000000000003', 'GRO-DEMO-003', '10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', 1, 990, 990, 'Nadeesha Peris', '8 Lake Drive, Colombo 3', null, 'delivered', '2026-08-18 05:36:49.650457+00', '2026-08-18 08:36:49.650457+00', '2026-08-18 06:16:49.650457+00', null),
  ('32a5387d-73a6-4574-b8f4-0297db3427b2', 'GRO-260818-B8AA7D', '10000000-0000-0000-0000-000000000001', null, 2, 690, 1380, 'Sam Taylor', '42 Palm Grove, Colombo 3', 'Please ring the bell', 'pending_dispatch', '2026-08-18 10:07:02.936745+00', '2026-08-18 10:07:02.936745+00', null, '72061b49-74e7-4800-85de-949580d05cc7');
