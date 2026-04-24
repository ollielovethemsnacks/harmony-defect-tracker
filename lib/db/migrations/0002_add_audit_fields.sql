-- Migration 002: Add audit fields, notes, and unique constraint
-- Task F-01: Database Schema Migration

-- Audit fields
ALTER TABLE "defects" ADD COLUMN "created_by" VARCHAR(100) DEFAULT 'system';
ALTER TABLE "defects" ADD COLUMN "updated_by" VARCHAR(100) DEFAULT 'system';
ALTER TABLE "defects" ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "defects" ADD COLUMN "deleted_by" VARCHAR(100);

-- Notes field (append-only format)
ALTER TABLE "defects" ADD COLUMN "notes" TEXT;

-- Unique constraint on defect_number (for auto-generation safety)
ALTER TABLE "defects" ADD CONSTRAINT "defects_defect_number_unique" UNIQUE("defect_number");
