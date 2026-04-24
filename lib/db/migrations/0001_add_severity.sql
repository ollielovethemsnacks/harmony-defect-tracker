-- Migration 001: Add severity enum and severity column to defects table
-- Task F-01: Database Schema Migration

-- Add severity enum type
CREATE TYPE "defect_severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- Add severity column with default MEDIUM (safe for existing rows)
ALTER TABLE "defects" ADD COLUMN "severity" "defect_severity" NOT NULL DEFAULT 'MEDIUM';
