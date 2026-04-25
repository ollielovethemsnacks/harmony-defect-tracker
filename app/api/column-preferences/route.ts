export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';

// Default sort preferences (no database storage yet)
const defaultPreferences = {
  TODO: { columnStatus: 'TODO', sortField: 'defectNumber', sortDirection: 'asc' },
  IN_PROGRESS: { columnStatus: 'IN_PROGRESS', sortField: 'defectNumber', sortDirection: 'asc' },
  DONE: { columnStatus: 'DONE', sortField: 'defectNumber', sortDirection: 'asc' },
};

// GET /api/column-preferences - Get all column sort preferences
export async function GET(): Promise<NextResponse> {
  // Return defaults (no database table yet)
  return NextResponse.json({ success: true, data: defaultPreferences });
}

// POST /api/column-preferences - Save or update a column sort preference
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { columnStatus, sortField, sortDirection } = body;

    // Just return success (no database table yet, client should use localStorage)
    return NextResponse.json({ 
      success: true, 
      message: 'Preference saved (client-side only)',
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
