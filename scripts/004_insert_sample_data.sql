-- Insert sample categories
INSERT INTO public.categories (name, slug, description, is_active) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories', true),
('Clothing', 'clothing', 'Fashion and apparel', true),
('Home & Garden', 'home-garden', 'Home improvement and garden supplies', true),
('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', true),
('Books', 'books', 'Books and educational materials', true);

-- Insert sample suppliers
INSERT INTO public.suppliers (name, type, contact_email, is_active) VALUES
('Internal Warehouse', 'internal', 'warehouse@company.com', true),
('Alibaba Supplier', 'alibaba', 'supplier@alibaba.com', true),
('Jumia Partner', 'jumia', 'partner@jumia.com', true);

-- Insert sample products
INSERT INTO public.products (
  name, slug, description, short_description, sku, category_id, supplier_id,
  price, compare_price, stock_quantity, images, is_active, is_featured
) VALUES
(
  'Smartphone Pro Max',
  'smartphone-pro-max',
  'Latest flagship smartphone with advanced features and premium build quality.',
  'Premium smartphone with cutting-edge technology',
  'PHONE-001',
  (SELECT id FROM public.categories WHERE slug = 'electronics' LIMIT 1),
  (SELECT id FROM public.suppliers WHERE type = 'internal' LIMIT 1),
  999.99,
  1199.99,
  50,
  '["https://example.com/phone1.jpg", "https://example.com/phone2.jpg"]',
  true,
  true
),
(
  'Wireless Headphones',
  'wireless-headphones',
  'High-quality wireless headphones with noise cancellation.',
  'Premium wireless headphones',
  'AUDIO-001',
  (SELECT id FROM public.categories WHERE slug = 'electronics' LIMIT 1),
  (SELECT id FROM public.suppliers WHERE type = 'internal' LIMIT 1),
  199.99,
  249.99,
  100,
  '["https://example.com/headphones1.jpg"]',
  true,
  false
),
(
  'Cotton T-Shirt',
  'cotton-t-shirt',
  'Comfortable 100% cotton t-shirt available in multiple colors.',
  'Comfortable cotton t-shirt',
  'SHIRT-001',
  (SELECT id FROM public.categories WHERE slug = 'clothing' LIMIT 1),
  (SELECT id FROM public.suppliers WHERE type = 'alibaba' LIMIT 1),
  29.99,
  39.99,
  200,
  '["https://example.com/tshirt1.jpg"]',
  true,
  false
);

-- Insert sample coupons
INSERT INTO public.coupons (code, type, value, minimum_amount, usage_limit, is_active) VALUES
('WELCOME10', 'percentage', 10.00, 50.00, 100, true),
('SAVE20', 'fixed', 20.00, 100.00, 50, true);
