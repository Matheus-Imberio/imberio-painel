-- Adiciona a coluna tipo_pagamento na tabela budgets (para orçamentos com status "baixado")
-- Execute este SQL no Supabase: SQL Editor > New query > Cole e rode

ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS tipo_pagamento text;

COMMENT ON COLUMN public.budgets.tipo_pagamento IS 'Tipo de pagamento ao marcar orçamento como baixado: dinheiro, pix, cartao_credito, cartao_debito, transferencia, boleto, outro';
