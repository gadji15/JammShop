-- Index pour accélérer les jointures et filtres

-- orders.user_id
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- orders.created_at
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- order_items.order_id
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- order_items.product_id
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- products.slug (unique pour /products/[slug])
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_products_slug'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX idx_products_slug ON public.products(slug)';
  END IF;
END
$$ LANGUAGE plpgsql;

-- products.category_id, products.supplier_id
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);