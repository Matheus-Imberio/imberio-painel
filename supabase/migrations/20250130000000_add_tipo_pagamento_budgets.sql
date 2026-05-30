-- Adiciona a coluna tipo_pagamento na tabela budgets quando ela existir.

DO $$
BEGIN
  IF to_regclass('public.budgets') IS NOT NULL THEN
    ALTER TABLE public.budgets
    ADD COLUMN IF NOT EXISTS tipo_pagamento text;

    COMMENT ON COLUMN public.budgets.tipo_pagamento IS 'Tipo de pagamento ao marcar orçamento como baixado: dinheiro, pix, cartao_credito, cartao_debito, transferencia, boleto, outro';
  END IF;
END $$;
