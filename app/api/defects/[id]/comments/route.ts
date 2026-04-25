export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments, defects, NewComment } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for creating a comment
const createCommentSchema = z.object({
  text: z.string().min(1),
});

// Helper function to validate UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// GET /api/defects/[id]/comments - Get comments for a defect
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

    // Check if defect exists
    const defect = await db.query.defects.findFirst({
      where: eq(defects.id, id),
    });

    if (!defect) {
      return NextResponse.json(
        { success: false, error: 'Defect not found' },
        { status: 404 }
      );
    }

    const defectComments = await db.query.comments.findMany({
      where: eq(comments.defectId, id),
      orderBy: desc(comments.createdAt),
    });

    return NextResponse.json({ success: true, data: defectComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/defects/[id]/comments - Add comment to a defect
export async function POST(
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
    const validationResult = createCommentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Check if defect exists
    const defect = await db.query.defects.findFirst({
      where: eq(defects.id, id),
    });

    if (!defect) {
      return NextResponse.json(
        { success: false, error: 'Defect not found' },
        { status: 404 }
      );
    }

    const commentData: NewComment = {
      defectId: id,
      text: validationResult.data.text,
    };

    const [newComment] = await db.insert(comments).values(commentData).returning();

    return NextResponse.json({ success: true, data: newComment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
