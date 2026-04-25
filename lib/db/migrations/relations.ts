import { relations } from "drizzle-orm/relations";
import { defects, comments } from "./schema";

export const commentsRelations = relations(comments, ({one}) => ({
	defect: one(defects, {
		fields: [comments.defectId],
		references: [defects.id]
	}),
}));

export const defectsRelations = relations(defects, ({many}) => ({
	comments: many(comments),
}));