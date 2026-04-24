-- Migration 004: Add indexes for soft-delete query performance
-- Task F-01: Database Schema Migration

-- Partial index for active defects (most common query: WHERE deleted_at IS NULL)
CREATE INDEX "idx_defects_active" ON "defects" ("status") WHERE "deleted_at" IS NULL;

-- Index for archive/deleted queries
CREATE INDEX "idx_defects_deleted_at" ON "defects" ("deleted_at");
