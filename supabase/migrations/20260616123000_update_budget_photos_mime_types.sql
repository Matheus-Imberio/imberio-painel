-- Garante suporte a fotos HEIC/HEIF em buckets ja criados.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
WHERE id = 'budget-photos';
