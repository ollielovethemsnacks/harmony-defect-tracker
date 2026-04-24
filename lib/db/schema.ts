import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('defect_status', ['TODO', 'IN_PROGRESS', 'DONE']);

export const defects = pgTable('defects', {
  id: uuid('id').primaryKey().defaultRandom(),
  defectNumber: varchar('defect_number', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  standardReference: varchar('standard_reference', { length: 255 }),
  status: statusEnum('status').default('TODO').notNull(),
  images: text('images').array().default([]),
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
