-- Migration 003: Create defect_number_sequences table
-- Task F-01: Database Schema Migration

CREATE TABLE "defect_number_sequences" (
  "year" INTEGER PRIMARY KEY,
  "last_number" INTEGER NOT NULL DEFAULT 0
);

-- Seed current year with max existing defect number sequence
INSERT INTO "defect_number_sequences" ("year", "last_number")
VALUES (
  2026,
  COALESCE(
    (SELECT MAX(CAST(SPLIT_PART("defect_number", '-', 3) AS INTEGER))
     FROM "defects"
     WHERE "defect_number" ~ '^DF-2026-'),
    0
  )
)
ON CONFLICT ("year") DO NOTHING;
