export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { columnSortPreferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updatePreferenceSchema = z.object({
  columnStatus: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  sortField: z.enum(['defectNumber', 'createdAt', 'updatedAt', 'severity', 'title', 'sortOrder']),
  sortDirection: z.enum(['asc', 'desc']),
});

// GET /api/column-preferences - Get all column sort preferences
export async function GET(): Promise<NextResponse> {
  try {
    const preferences = await db.query.columnSortPreferences.findMany();
    
    // Return defaults if no preferences exist
    const defaults = {
      TODO: { columnStatus: 'TODO', sortField: 'defectNumber', sortDirection: 'asc' },
      IN_PROGRESS: { columnStatus: 'IN_PROGRESS', sortField: 'defectNumber', sortDirection: 'asc' },
      DONE: { columnStatus: 'DONE', sortField: 'defectNumber', sortDirection: 'asc' },
    };

    // Merge with defaults
    const result = { ...defaults };
    for (const pref of preferences) {
      result[pref.columnStatus] = pref;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching column preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch column preferences' },
      { status: 500 }
    );
  }
}

// POST /api/column-preferences - Save or update a column sort preference
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const validationResult = updatePreferenceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { columnStatus, sortField, sortDirection } = validationResult.data;

    // Check if preference already exists for this column
    const existing = await db.query.columnSortPreferences.findFirst({
      where: eq(columnSortPreferences.columnStatus, columnStatus),
    });

    if (existing) {
      // Update existing
      await db
        .update(columnSortPreferences)
        .set({ sortField, sortDirection, updatedAt: new Date() })
        .where(eq(columnSortPreferences.id, existing.id));
    } else {
      // Create new
      await db.insert(columnSortPreferences).values({
        columnStatus,
        sortField,
        sortDirection,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Preference saved',
      data: { columnStatus, sortField, sortDirection }
    });
  } catch (error) {
    console.error('Error saving column preference:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save column preference' },
      { status: 500 }
    );
  }
}
