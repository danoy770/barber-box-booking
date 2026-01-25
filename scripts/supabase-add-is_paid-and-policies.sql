-- À exécuter dans Supabase → SQL Editor (ton projet → SQL Editor)
-- https://supabase.com/dashboard

-- 1. Colonnes pour le statut de paiement et le prix
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT true;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

-- 2. Mettre à jour les lignes existantes (NULL → true / 0)
UPDATE appointments SET is_paid = true WHERE is_paid IS NULL;
UPDATE appointments SET price = 0 WHERE price IS NULL;

-- 3. Si tu as toujours "permission denied" ou "row-level security" lors du clic שולם/לא שולם,
--    exécute aussi ceci (autorise UPDATE sur appointments pour l'API) :

-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow update appointments" ON public.appointments;
-- CREATE POLICY "Allow update appointments" ON public.appointments
--   FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
