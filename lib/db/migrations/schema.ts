import { pgTable, foreignKey, uuid, text, timestamp, index, unique, varchar, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const defectSeverity = pgEnum("defect_severity", ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
export const defectStatus = pgEnum("defect_status", ['TODO', 'IN_PROGRESS', 'DONE'])


export const comments = pgTable("comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	defectId: uuid("defect_id").notNull(),
	text: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.defectId],
			foreignColumns: [defects.id],
			name: "comments_defect_id_defects_id_fk"
		}).onDelete("cascade"),
]);

export const defects = pgTable("defects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	defectNumber: varchar("defect_number", { length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	location: varchar({ length: 255 }),
	standardReference: varchar("standard_reference", { length: 255 }),
	status: defectStatus().default('TODO').notNull(),
	images: text().array().default([""]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	severity: defectSeverity().default('MEDIUM').notNull(),
	createdBy: varchar("created_by", { length: 100 }).default('system'),
	updatedBy: varchar("updated_by", { length: 100 }).default('system'),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: varchar("deleted_by", { length: 100 }),
	notes: text(),
}, (table) => [
	index("idx_defects_active").using("btree", table.status.asc().nullsLast().op("enum_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_defects_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	unique("defects_defect_number_unique").on(table.defectNumber),
]);

export const defectNumberSequences = pgTable("defect_number_sequences", {
	year: integer().primaryKey().notNull(),
	lastNumber: integer("last_number").default(0).notNull(),
});
