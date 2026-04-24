import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('defect_status', ['TODO', 'IN_PROGRESS', 'DONE']);
export const severityEnum = pgEnum('defect_severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const defects = pgTable('defects', {
  id: uuid('id').primaryKey().defaultRandom(),
  defectNumber: varchar('defect_number', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  standardReference: varchar('standard_reference', { length: 255 }),
  status: statusEnum('status').default('TODO').notNull(),
  severity: severityEnum('severity'),
  notes: text('notes'),
  images: text('images').array().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: varchar('deleted_by', { length: 255 }),
  updatedBy: varchar('updated_by', { length: 255 }),
});

// Defect number sequences table
export const defectNumberSequences = pgTable('defect_number_sequences', {
  id: uuid('id').primaryKey().defaultRandom(),
  year: integer('year').notNull(),
  lastNumber: integer('last_number').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  defectId: uuid('defect_id').references(() => defects.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Defect = typeof defects.$inferSelect;
export type NewDefect = typeof defects.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type DefectNumberSequence = typeof defectNumberSequences.$inferSelect;
