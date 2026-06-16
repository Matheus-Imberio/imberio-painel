-- Fotos vinculadas aos orcamentos, com uma foto marcada como capa.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'budget-photos',
  'budget-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.budget_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  is_cover boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS budget_photos_single_cover
ON public.budget_photos (budget_id)
WHERE is_cover;

ALTER TABLE public.budget_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_photos_authenticated_all" ON public.budget_photos;
CREATE POLICY "budget_photos_authenticated_all"
ON public.budget_photos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "budget_photos_storage_select" ON storage.objects;
CREATE POLICY "budget_photos_storage_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'budget-photos');

DROP POLICY IF EXISTS "budget_photos_storage_insert" ON storage.objects;
CREATE POLICY "budget_photos_storage_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'budget-photos');

DROP POLICY IF EXISTS "budget_photos_storage_update" ON storage.objects;
CREATE POLICY "budget_photos_storage_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'budget-photos')
WITH CHECK (bucket_id = 'budget-photos');

DROP POLICY IF EXISTS "budget_photos_storage_delete" ON storage.objects;
CREATE POLICY "budget_photos_storage_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'budget-photos');

GRANT ALL ON TABLE public.budget_photos TO authenticated;
