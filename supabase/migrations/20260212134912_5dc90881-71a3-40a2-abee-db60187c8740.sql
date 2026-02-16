
-- Parties
CREATE TABLE public.parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job Work Types
CREATE TABLE public.job_work_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Work Orders
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_number TEXT NOT NULL,
  received_date DATE NOT NULL,
  party_id UUID NOT NULL REFERENCES public.parties(id),
  party_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Work Order Items
CREATE TABLE public.work_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  job_work_type_id UUID NOT NULL REFERENCES public.job_work_types(id),
  job_work_type_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  pending_quantity INTEGER NOT NULL DEFAULT 0
);

-- Delivery Challans
CREATE TABLE public.delivery_challans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dc_number TEXT NOT NULL,
  generated_date DATE NOT NULL,
  party_id UUID NOT NULL REFERENCES public.parties(id),
  party_name TEXT NOT NULL,
  transporter_name TEXT NOT NULL DEFAULT '',
  linked_work_order_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- DC Items
CREATE TABLE public.dc_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_challan_id UUID NOT NULL REFERENCES public.delivery_challans(id) ON DELETE CASCADE,
  job_work_type_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- Updated_at trigger for work_orders
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables (public access for internal tool - no auth needed)
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dc_items ENABLE ROW LEVEL SECURITY;

-- Public RLS policies (internal tool, no user auth)
CREATE POLICY "Allow full access to parties" ON public.parties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to job_work_types" ON public.job_work_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to work_orders" ON public.work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to work_order_items" ON public.work_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to delivery_challans" ON public.delivery_challans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to dc_items" ON public.dc_items FOR ALL USING (true) WITH CHECK (true);

-- Seed parties
INSERT INTO public.parties (name) VALUES ('Pati Saare Mandir'), ('Roja Silks'), ('Rathi International');

-- Seed job work types
INSERT INTO public.job_work_types (name, active) VALUES 
  ('Handloom', true), ('Polish', true), ('Lattan', true), 
  ('Folding', true), ('Faal', true), ('Latkan', true);
