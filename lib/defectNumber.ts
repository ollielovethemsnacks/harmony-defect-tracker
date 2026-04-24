import { getDb } from '@/lib/db';
import { defectNumberSequences } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Generate a unique defect number in format DF-YYYY-NNNN.
 *
 * Uses atomic upsert on the defect_number_sequences table to prevent
 * race conditions under concurrent requests. The sequence resets
 * automatically when the year changes.
 *
 * Examples: DF-2026-0001, DF-2026-0002, ... DF-2027-0001
 *
 * @returns Formatted defect number string (e.g. "DF-2026-0001")
 */
export async function generateDefectNumber(): Promise<string> {
  const db = getDb();
  const year = new Date().getFullYear();

  // Atomic upsert: insert the year with lastNumber=1, or increment existing.
  // The onConflictDoUpdate with sql`${defectNumberSequences.lastNumber} + 1`
  // guarantees atomicity at the database level even under concurrent requests.
  let sequence: number;
  try {
    const result = await db
      .insert(defectNumberSequences)
      .values({ year, lastNumber: 1 })
      .onConflictDoUpdate({
        target: defectNumberSequences.year,
        set: {
          lastNumber: sql`${defectNumberSequences.lastNumber} + 1`,
        },
      })
      .returning({ lastNumber: defectNumberSequences.lastNumber });

    sequence = result[0].lastNumber;
  } catch {
    // Fallback: if the upsert fails for any reason, do a manual
    // read-increment-write cycle. Not ideal for concurrency but prevents
    // total failure.
    const fallback = await db
      .select({ lastNumber: defectNumberSequences.lastNumber })
      .from(defectNumberSequences)
      .where(eq(defectNumberSequences.year, year));

    sequence = (fallback[0]?.lastNumber ?? 0) + 1;

    await db
      .update(defectNumberSequences)
      .set({ lastNumber: sequence })
      .where(eq(defectNumberSequences.year, year));
  }

  return `DF-${year}-${String(sequence).padStart(4, '0')}`;
}
