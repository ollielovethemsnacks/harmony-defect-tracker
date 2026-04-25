export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { defects, NewDefect, statusEnum } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for creating a defect
const createDefectSchema = z.object({
  defectNumber: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().max(255).optional(),
  standardReference: z.string().max(255).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  images: z.array(z.string()).optional(),
});

// GET /api/defects - List all defects
export async function GET(): Promise<NextResponse> {
  try {
    const allDefects = await db.query.defects.findMany({
      orderBy: desc(defects.createdAt),
    });

    return NextResponse.json({ success: true, data: allDefects });
  } catch (error) {
    console.error('Error fetching defects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch defects' },
      { status: 500 }
    );
  }
}

// POST /api/defects - Create new defect
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = createDefectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const defectData: NewDefect = {
      defectNumber: validationResult.data.defectNumber,
      title: validationResult.data.title,
      description: validationResult.data.description ?? null,
      location: validationResult.data.location ?? null,
      standardReference: validationResult.data.standardReference ?? null,
      status: validationResult.data.status ?? 'TODO',
      images: validationResult.data.images ?? [],
    };

    const [newDefect] = await db.insert(defects).values(defectData).returning();

    return NextResponse.json({ success: true, data: newDefect }, { status: 201 });
  } catch (error) {
    console.error('Error creating defect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create defect' },
      { status: 500 }
    );
  }
}
