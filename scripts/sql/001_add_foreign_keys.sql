DO $$
BEGIN
  -- orders.user_id -> profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey'
  ) THEN
    EXECUTE $stmt$
      ALTER TABLE public.orders
      ADD CONSTRAINT orders_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE SET NULL
    $stmt$;
  END IF;

  -- order_items.order_id -> orders.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey'
  ) THEN
    EXECUTE $stmt$
      ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id)
      ON DELETE CASCADE
    $stmt$;
  END IF;

  -- order_items.product_id -> products.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_id_fkey'
  ) THEN
    EXECUTE $stmt$
      ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id)
      ON DELETE SET NULL
    $stmt$;
  END IF;
END
$$ LANGUAGE plpgsql;