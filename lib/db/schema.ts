import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('defect_status', ['TODO', 'IN_PROGRESS', 'DONE']);
export const severityEnum = pgEnum('defect_severity', ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

// Schema matching the actual production database
export const defects = pgTable('defects', {
  id: uuid('id').primaryKey().defaultRandom(),
  defectNumber: varchar('defect_number', { length: 50 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  standardReference: varchar('standard_reference', { length: 255 }),
  status: statusEnum('status').default('TODO').notNull(),
  severity: severityEnum('severity').default('MEDIUM').notNull(),
  images: text('images').array().default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: varchar('created_by', { length: 100 }).default('system'),
  updatedBy: varchar('updated_by', { length: 100 }).default('system'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: varchar('deleted_by', { length: 100 }),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  defectId: uuid('defect_id').references(() => defects.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const defectNumberSequences = pgTable('defect_number_sequences', {
  year: integer('year').primaryKey().notNull(),
  lastNumber: integer('last_number').default(0).notNull(),
});

export type Defect = typeof defects.$inferSelect;
export type NewDefect = typeof defects.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type DefectNumberSequence = typeof defectNumberSequences.$inferSelect;
export type NewDefectNumberSequence = typeof defectNumberSequences.$inferInsert;

// Placeholder types for features not yet in database
export type ColumnSortPreference = any;
export type NewColumnSortPreference = any;
