-- שירותים וקטגוריות – Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor

-- Table: קטגוריות
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

-- Table: שירותים
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  price INT NOT NULL DEFAULT 0,
  price_is_min BOOLEAN NOT NULL DEFAULT false,
  duration_minutes SMALLINT NOT NULL DEFAULT 15,
  calendar_color TEXT DEFAULT '#6366f1',
  hidden_from_booking BOOLEAN NOT NULL DEFAULT false,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

-- Seed קטגוריות (à exécuter une fois)
INSERT INTO categories (id, name, sort_order) VALUES
  (1, 'לייזר', 1),
  (2, 'תספורות', 2),
  (3, 'שירותים אקסטרה', 3)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT COALESCE(MAX(id), 1) FROM categories));

-- Seed שירותים (à exécuter une fois)
INSERT INTO services (category_id, name, notes, price, price_is_min, duration_minutes, calendar_color, hidden_from_booking, sort_order) VALUES
-- לייזר
(1, 'הסרת שיער בלייזר מלא', '2 אזורים ומעלה', 30, true, 15, '#6366f1', false, 1),
(1, 'הסרת שיער בלייזר אזור 1', 'איזור אחד בלבד', 30, true, 10, '#6366f1', false, 2),
-- תספורות
(2, 'תספורת גבר/ילד', 'זקן בתוספת 10/20 ₪ (אם מדורג או לא)', 50, false, 20, '#6366f1', false, 1),
(2, 'תספורת ילד ללא דירוג (עד גיל 13)', '', 45, false, 15, '#6366f1', false, 2),
(2, 'תספורת מדורג מספר חצי ומטה', 'תספורת מקצועית עם תדלוק', 60, false, 20, '#6366f1', false, 3),
(2, 'תספורת גבר + זקן', 'תספורת וטיפול בזקן', 60, false, 25, '#6366f1', false, 4),
(2, 'תספורת אברך', '', 45, false, 15, '#6366f1', false, 5),
(2, 'תספורת אברך + זקן', '', 55, false, 20, '#6366f1', false, 6),
(2, '2 תספורות', '', 100, false, 40, '#6366f1', false, 7),
(2, '3 תספורות', '', 150, false, 50, '#6366f1', false, 8),
(2, 'תספורת 2 ילדים ללא דירוג', '', 90, false, 25, '#6366f1', false, 9),
(2, 'תספורת 3 ילדים ללא דירוג', '', 135, false, 35, '#6366f1', false, 10),
-- שירותים אקסטרה
(3, 'סידור זקן או פס', '', 20, false, 5, '#6366f1', false, 1),
(3, 'שעווה', 'לחיים, עורף, אף/אוזניים', 20, false, 10, '#6366f1', false, 2);

-- Optionnel: politiques RLS si ton projet utilise RLS sur ces tables
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for services" ON services FOR ALL USING (true) WITH CHECK (true);
