-- שעות פתיחה – Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor

-- Table: horaires par jour (0=א', 6=שבת)
CREATE TABLE IF NOT EXISTS operating_hours (
  id SERIAL PRIMARY KEY,
  day_of_week SMALLINT NOT NULL UNIQUE CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_closed BOOLEAN NOT NULL DEFAULT true,
  start_time TEXT,
  end_time TEXT
);

-- Données initiales : tous les jours fermés
INSERT INTO operating_hours (day_of_week, is_closed, start_time, end_time)
VALUES
  (0, true, NULL, NULL),
  (1, true, NULL, NULL),
  (2, true, NULL, NULL),
  (3, true, NULL, NULL),
  (4, true, NULL, NULL),
  (5, true, NULL, NULL),
  (6, true, NULL, NULL)
ON CONFLICT (day_of_week) DO NOTHING;
