-- EcoMaterial Market Database Seed Data
-- Version: 1.0

USE ecomaterial_db;

-- ============================================
-- ADMIN USER
-- Password: Admin123! (hashed with bcrypt)
-- ============================================
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@ecomaterial.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqxqZ', 'Admin', 'User', 'admin');

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (name, description) VALUES
('Refined Plastic', 'HDPE, PET, and PP pellets ready for injection molding and extrusion processes.'),
('Metal Scraps', 'Sorted aluminum, copper wire, and heavy melting steel ready for smelting.'),
('Discarded Fabrics', 'Pre-consumer cotton off-cuts, denim scraps, and synthetic fiber waste.'),
('Industrial Plastics', 'Industrial grade plastic sheets, pipes, and components.'),
('Copper Alloys', 'Copper and brass scrap materials.'),
('Aluminum Products', 'Aluminum scrap and recycled aluminum products.'),
('Steel & Iron', 'Steel beams, iron scraps, and heavy metals.'),
('Textile Waste', 'Fabric remnants, thread waste, and textile byproducts.');

-- Add subcategories
INSERT INTO categories (name, description, parent_category_id) VALUES
('HDPE Pellets', 'High-density polyethylene pellets', 1),
('PET Flakes', 'Polyethylene terephthalate flakes', 1),
('PP Granules', 'Polypropylene granules', 1),
('Copper Wire', 'Clean copper wire scrap', 2),
('Aluminum Scraps', 'Mixed aluminum scrap', 2),
('Steel Beams', 'Recycled steel structural elements', 2);

-- ============================================
-- SAMPLE PRODUCTS
-- ============================================
INSERT INTO products (name, description, price, stock_quantity, category_id, sku, weight_kg, material_type, `condition`) VALUES
('Dustbin', 'High-quality HDPE blue regrind suitable for extrusion and molding applications. Clean, contamination-free material.', 60.00, 20, 9, 'HDPE-BLU-001', NULL, 'plastic', 'recycled'),
('Shoe', 'Clean, uncoated copper wire scrap. 99% copper content. Ideal for smelting and electrical applications.', 120.00, 5000, 11, 'COP-WIR-001', 5000, 'metal', 'scrap'),
('Tot Bag', 'Pre-consumer denim fabric waste. Clean and sorted by color. Perfect for insulation or recycled textile products.', 90.00, 50, 3, 'DEN-OFF-001', NULL, 'fabric', 'used'),
('Seedling Pot', 'Recycled PET clear flakes from post-consumer bottles. Hot-washed and dried. Suitable for fiber production.', 20.00, 50, 10, 'PET-CLR-001', NULL, 'plastic', 'recycled'),
('Aluminum Scraps Mixed', 'Mixed aluminum scrap, clean and dry. Suitable for melting and casting applications.', 1200.00, 8000, 5, 'ALU-MIX-001', 8000, 'metal', 'scrap'),
('Pencil collector', 'Natural polypropylene granules from industrial waste. High melt flow index. Injection molding grade.', 15.00, 45, 11, 'PP-NAT-001', NULL, 'plastic', 'recycled'),
('Shoe', 'Clean cotton fabric off-cuts from textile manufacturing. Natural fiber, unbleached.', 200.00, 20, 3, 'COT-WST-001', NULL, 'fabric', 'used'),
('Pillow', 'Recycled fabric pillow cover and stuffing components suitable for home decor and textile reuse.', 70.00, 20, 3, 'PIL-FAB-001', NULL, 'fabric', 'used'),
('Bedsheet', 'Recycled fabric bedsheet material suitable for home linen reuse and textile upcycling.', 120.00, 10, 3, 'BED-FAB-001', NULL, 'fabric', 'used'),
('Button', 'Recycled fabric button components suitable for garment finishing and craft production.', 50.00, 50, 3, 'BTN-FAB-001', NULL, 'fabric', 'used'),
('Steel Beams Grade A', 'Recycled steel structural beams. Grade A quality. Suitable for construction and fabrication.', 450.00, 50000, 6, 'STL-BEM-001', 50000, 'metal', 'recycled'),
('ABS Black Regrind', 'ABS plastic black regrind. High impact resistance. Suitable for automotive parts manufacturing.', 520.00, 10000, 1, 'ABS-BLK-001', 10000, 'plastic', 'recycled'),
('Brass Turnings', 'Clean brass turnings from machining operations. High copper/zinc content. Ideal for foundries.', 3500.00, 3000, 5, 'BRS-TRN-001', 3000, 'metal', 'scrap');

-- ============================================
-- SAMPLE USERS
-- ============================================
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('buyer@ecoplast.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqxqZ', 'John', 'Buyer', 'user'),
('supplier@metalworks.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqxqZ', 'Jane', 'Supplier', 'user'),
('info@greentextiles.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqxqZ', 'Mike', 'Green', 'user');

-- ============================================
-- SAMPLE ADDRESSES
-- ============================================
INSERT INTO addresses (user_id, address_line1, city, state_province, postal_code, country, is_default_shipping, is_default_billing) VALUES
(2, '123 Industrial Park', 'Berlin', 'Berlin', '10115', 'Germany', TRUE, TRUE),
(3, '456 Metal Works Blvd', 'Houston', 'Texas', '77001', 'USA', TRUE, TRUE),
(4, '789 Textile Lane', 'Mumbai', 'Maharashtra', '400001', 'India', TRUE, TRUE);

-- ============================================
-- SAMPLE PRODUCT IMAGES (placeholder paths)
-- ============================================
INSERT INTO product_images (product_id, image_path, alt_text, display_order) VALUES
(1, '/Dustbin.jpg', 'Dustbin', 0),
(2, '/Shoe.jpg', 'Shoe', 0),
(3, '/bag.jpg', 'Tot Bag', 0),
(4, '/pot.jpg', 'Seedling Pot', 0),
(5, '/uploads/products/2024/aluminum-scraps.jpg', 'Aluminum Scraps Mixed - Clean aluminum scrap', 0),
(6, '/case.jpg', 'Pencil collector', 0),
(7, '/Shoe.jpg', 'Shoe', 0),
(11, '/dom.jpg', 'Button', 0),
(12, '/pillow.jpg', 'Pillow', 0),
(13, '/bedsheet.jpg', 'Bedsheet', 0);

-- ============================================
-- SAMPLE ORDERS (for testing)
-- ============================================
INSERT INTO orders (user_id, total_amount, status, shipping_address_id, billing_address_id, payment_status, payment_method) VALUES
(2, 4250.00, 'pending', 1, 1, 'pending', 'Credit Card'),
(2, 7200.00, 'processing', 1, 1, 'paid', 'Bank Transfer'),
(3, 1200.00, 'shipped', 2, 2, 'paid', 'Credit Card');

-- ============================================
-- SAMPLE ORDER ITEMS
-- ============================================
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 1, 5, 450.00, 2250.00),
(1, 3, 10, 180.00, 1800.00),
(2, 2, 1, 7200.00, 7200.00),
(3, 5, 1, 1200.00, 1200.00);

-- ============================================
-- SAMPLE REVIEWS
-- ============================================
INSERT INTO reviews (product_id, user_id, rating, comment) VALUES
(1, 2, 5, 'Excellent quality HDPE. Perfect for our extrusion needs. Will order again.'),
(2, 3, 4, 'Good quality copper wire. Delivery was fast. Price competitive.'),
(3, 2, 5, 'Clean and well-sorted denim waste. Exactly as described.');
