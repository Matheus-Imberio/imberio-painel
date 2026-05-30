-- Adiciona colunas Partida e Trabalho na tabela motors quando ela existir.

DO $$
BEGIN
  IF to_regclass('public.motors') IS NOT NULL THEN
    ALTER TABLE public.motors
    ADD COLUMN IF NOT EXISTS partida text,
    ADD COLUMN IF NOT EXISTS trabalho text;

    COMMENT ON COLUMN public.motors.partida IS 'Tipo de partida do motor monofásico (ex: Capacitor)';
    COMMENT ON COLUMN public.motors.trabalho IS 'Tipo de trabalho do motor monofásico (ex: Permanente)';
  END IF;
END $$;
