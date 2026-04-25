export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { defects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Helper function to validate UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// PATCH /api/defects/[id]/restore - Restore endpoint (disabled - no soft delete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Restore is not supported without soft delete columns
  return NextResponse.json(
    { success: false, error: 'Restore not available - soft delete not implemented' },
    { status: 501 }
  );
}
