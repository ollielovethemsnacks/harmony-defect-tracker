export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { defects } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for updating a defect
const updateDefectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  location: z.string().max(255).optional(),
  standardReference: z.string().max(255).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  images: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Helper function to validate UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// GET /api/defects/[id] - Get single defect
export async function GET(
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

    const defect = await db.query.defects.findFirst({
      where: eq(defects.id, id),
    });

    if (!defect) {
      return NextResponse.json(
        { success: false, error: 'Defect not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: defect });
  } catch (error) {
    console.error('Error fetching defect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch defect' },
      { status: 500 }
    );
  }
}

// PATCH /api/defects/[id] - Update defect
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

    const body = await request.json();
    
    // Validate request body
    const validationResult = updateDefectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Check if defect exists
    const existingDefect = await db.query.defects.findFirst({
      where: eq(defects.id, id),
    });

    if (!existingDefect) {
      return NextResponse.json(
        { success: false, error: 'Defect not found' },
        { status: 404 }
      );
    }

    const updateData = {
      ...validationResult.data,
      updatedAt: new Date(),
    };

    const [updatedDefect] = await db
      .update(defects)
      .set(updateData)
      .where(eq(defects.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedDefect });
  } catch (error) {
    console.error('Error updating defect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update defect' },
      { status: 500 }
    );
  }
}

// DELETE /api/defects/[id] - Soft delete defect
export async function DELETE(
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

    // Check if defect exists
    const existingDefect = await db.query.defects.findFirst({
      where: eq(defects.id, id),
    });

    if (!existingDefect) {
      return NextResponse.json(
        { success: false, error: 'Defect not found' },
        { status: 404 }
      );
    }

    // Soft delete - set deletedAt timestamp
    await db
      .update(defects)
      .set({ 
        deletedAt: new Date(),
        deletedBy: 'system', // TODO: Use actual user when auth is implemented
      })
      .where(eq(defects.id, id));

    return NextResponse.json({ 
      success: true, 
      message: 'Defect deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting defect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete defect' },
      { status: 500 }
    );
  }
}
