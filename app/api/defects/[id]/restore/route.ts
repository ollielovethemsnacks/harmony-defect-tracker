export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { defects } from '@/lib/db/schema';
import { eq, isNotNull } from 'drizzle-orm';

// Helper function to validate UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// PATCH /api/defects/[id]/restore - Restore a soft-deleted defect
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid defect ID format' },
        { status: 400 }
      );
    }

    // Check if defect exists and is deleted
    const existingDefect = await db.query.defects.findFirst({
      where: eq(defects.id, id),
    });

    if (!existingDefect) {
      return NextResponse.json(
        { success: false, error: 'Defect not found' },
        { status: 404 }
      );
    }

    if (!existingDefect.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Defect is not deleted' },
        { status: 400 }
      );
    }

    // Restore the defect by clearing deletedAt and deletedBy
    const [restoredDefect] = await db
      .update(defects)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(defects.id, id))
      .returning();

    return NextResponse.json({ success: true, data: restoredDefect });
  } catch (error) {
    console.error('Error restoring defect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore defect' },
      { status: 500 }
    );
  }
}
