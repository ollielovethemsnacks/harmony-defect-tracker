import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared Zod Validation Schemas — 6 Harmony Street Defect Tracker
// Single source of truth for client + server validation
// ---------------------------------------------------------------------------

// Standard reference format regex: "AS 3500; 4.18.1"
export const STANDARD_REF_REGEX =
  /^AS\s+\d{4}(\.\d+)?(;\s+\d+(\.\d+)*)?$/;

// ---------------------------------------------------------------------------
// 1. DefectStatusSchema
// ---------------------------------------------------------------------------
export const DefectStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

// ---------------------------------------------------------------------------
// 2. DefectSeveritySchema
// ---------------------------------------------------------------------------
export const DefectSeveritySchema = z.enum([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
]);

// ---------------------------------------------------------------------------
// 3. CreateDefectSchema — full create form validation
// ---------------------------------------------------------------------------
export const CreateDefectSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters'),

  location: z
    .string()
    .min(1, 'Location is required')
    .max(200, 'Location must be at most 200 characters'),

  standardReference: z
    .string()
    // Empty string → undefined so .optional() takes effect
    .transform((v) => (v === '' ? undefined : v))
    .pipe(
      z
        .string()
        .max(200, 'Standard reference must be at most 200 characters')
        .regex(
          STANDARD_REF_REGEX,
          'Format: AS XXXX.X; X.X.X (e.g. AS 3500; 4.18.1)',
        )
        .optional(),
    ),

  severity: DefectSeveritySchema,

  status: DefectStatusSchema.default('TODO'),

  images: z
    .array(z.string().url('Each image must be a valid URL'))
    .max(5, 'Maximum 5 images allowed')
    .optional(),

  notes: z
    .string()
    .max(5000, 'Notes must be at most 5000 characters')
    .optional(),
});

// ---------------------------------------------------------------------------
// 4. UpdateDefectSchema — partial update validation
// ---------------------------------------------------------------------------
export const UpdateDefectSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters')
    .optional(),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),

  location: z
    .string()
    .max(200, 'Location must be at most 200 characters')
    .optional(),

  standardReference: z
    .string()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(
      z
        .string()
        .max(200, 'Standard reference must be at most 200 characters')
        .regex(
          STANDARD_REF_REGEX,
          'Format: AS XXXX.X; X.X.X (e.g. AS 3500; 4.18.1)',
        )
        .optional(),
    )
    .optional(),

  severity: DefectSeveritySchema.optional(),

  status: DefectStatusSchema.optional(),

  images: z
    .array(z.string().url('Each image must be a valid URL'))
    .max(5, 'Maximum 5 images allowed')
    .optional(),

  notes: z
    .string()
    .max(5000, 'Notes must be at most 5000 characters')
    .optional(),
});

// ---------------------------------------------------------------------------
// 5. DefectIdSchema — UUID validation
// ---------------------------------------------------------------------------
export const DefectIdSchema = z
  .string()
  .uuid('Defect ID must be a valid UUID');

// ---------------------------------------------------------------------------
// 6. NotesEntrySchema — append-only notes format
// ---------------------------------------------------------------------------
// ISO 8601 with timezone offset (e.g. 2026-04-24T14:30:00+10:00 or Z)
const ISO8601_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export const NotesEntrySchema = z.object({
  timestamp: z.string().regex(ISO8601_REGEX, 'Timestamp must be a valid ISO 8601 datetime (e.g. 2026-04-24T14:30:00+10:00)'),
  author: z
    .string()
    .min(1, 'Author is required')
    .max(100, 'Author must be at most 100 characters'),
  text: z
    .string()
    .min(1, 'Note text cannot be empty')
    .max(2000, 'Note text must be at most 2000 characters'),
});

// ---------------------------------------------------------------------------
// Type exports — inferred from schemas for use across API routes & components
// ---------------------------------------------------------------------------
export type DefectStatus = z.infer<typeof DefectStatusSchema>;
export type DefectSeverity = z.infer<typeof DefectSeveritySchema>;
export type CreateDefectInput = z.infer<typeof CreateDefectSchema>;
export type UpdateDefectInput = z.infer<typeof UpdateDefectSchema>;
export type DefectId = z.infer<typeof DefectIdSchema>;
export type NotesEntry = z.infer<typeof NotesEntrySchema>;

// ---------------------------------------------------------------------------
// Response envelope — consistent API error/success shape
// ---------------------------------------------------------------------------
export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: Record<string, string[]>;
}
