-- Cria o schema base do painel IMBERIO quando o projeto ainda estiver vazio.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  endereco text,
  telefone text,
  celular text,
  observacoes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text,
  valor numeric NOT NULL,
  unidade text,
  observacoes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.motors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo text,
  cv text,
  tensao text,
  rpm text,
  espiras text,
  fios text,
  ligacao text,
  diametro_externo text,
  comprimento_externo text,
  numero_serie text,
  marca text,
  original boolean,
  created_at timestamp with time zone DEFAULT now(),
  tipo text,
  equipamento text,
  passe text,
  partida text,
  trabalho text
);

CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  operador_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  motor_id uuid REFERENCES public.motors(id) ON DELETE SET NULL,
  data timestamp with time zone DEFAULT now(),
  valor_total numeric,
  observacoes text,
  laudo_tecnico text,
  status text DEFAULT 'pendente'::text,
  desconto_percentual numeric DEFAULT NULL::numeric,
  tipo_pagamento text
);

CREATE TABLE IF NOT EXISTS public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE,
  part_id uuid REFERENCES public.parts(id) ON DELETE SET NULL,
  quantidade integer NOT NULL,
  valor_unitario numeric NOT NULL,
  subtotal numeric
);

CREATE OR REPLACE FUNCTION public.set_budget_item_subtotal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.subtotal := COALESCE(NEW.quantidade, 0) * COALESCE(NEW.valor_unitario, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_budget_item_subtotal ON public.budget_items;
CREATE TRIGGER trg_set_budget_item_subtotal
BEFORE INSERT OR UPDATE OF quantidade, valor_unitario
ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION public.set_budget_item_subtotal();

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND role = 'admin'
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "profiles_admin_write" ON public.profiles;
CREATE POLICY "profiles_admin_write"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "clients_authenticated_all" ON public.clients;
CREATE POLICY "clients_authenticated_all"
ON public.clients
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "parts_authenticated_select" ON public.parts;
CREATE POLICY "parts_authenticated_select"
ON public.parts
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "parts_admin_write" ON public.parts;
CREATE POLICY "parts_admin_write"
ON public.parts
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "motors_authenticated_select_insert_update" ON public.motors;
CREATE POLICY "motors_authenticated_select_insert_update"
ON public.motors
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "budgets_authenticated_select_insert_update" ON public.budgets;
CREATE POLICY "budgets_authenticated_select_insert_update"
ON public.budgets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "budget_items_authenticated_all" ON public.budget_items;
CREATE POLICY "budget_items_authenticated_all"
ON public.budget_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.parts TO authenticated;
GRANT ALL ON TABLE public.motors TO authenticated;
GRANT ALL ON TABLE public.budgets TO authenticated;
GRANT ALL ON TABLE public.budget_items TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
