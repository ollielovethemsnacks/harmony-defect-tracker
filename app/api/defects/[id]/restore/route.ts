export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { defects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * PATCH /api/defects/[id]/restore
 * Restore a soft-deleted defect by clearing deletedAt and deletedBy.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid defect ID' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check defect exists and IS soft-deleted
    const [existing] = await db
      .select()
      .from(defects)
      .where(eq(defects.id, id));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Defect not found' },
        { status: 404 }
      );
    }

    if (!existing.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Defect is not deleted' },
        { status: 409 }
      );
    }

    const now = new Date();
    const [restored] = await db
      .update(defects)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: now,
        updatedBy: 'system',
      })
      .where(eq(defects.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: restored,
      message: 'Defect restored successfully',
    });
  } catch (error) {
    console.error('Error restoring defect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore defect' },
      { status: 500 }
    );
  }
}
