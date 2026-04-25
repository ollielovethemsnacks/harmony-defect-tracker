export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { defects, NewDefect } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for creating a defect (minimal - only fields that exist)
const createDefectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().max(255).optional(),
  standardReference: z.string().max(255).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  images: z.array(z.string()).optional(),
});

// Helper to generate next defect number
async function generateDefectNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
  return `DF-${year}-${randomSuffix}`;
}

// GET /api/defects - List all defects
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'defectNumber';
    const sortDir = searchParams.get('sortDir') || 'asc';

    let orderByClause;
    
    switch (sortBy) {
      case 'defectNumber':
        orderByClause = sortDir === 'desc' ? desc(defects.defectNumber) : asc(defects.defectNumber);
        break;
      case 'createdAt':
        orderByClause = sortDir === 'desc' ? desc(defects.createdAt) : asc(defects.createdAt);
        break;
      case 'updatedAt':
        orderByClause = sortDir === 'desc' ? desc(defects.updatedAt) : asc(defects.updatedAt);
        break;
      case 'title':
        orderByClause = sortDir === 'desc' ? desc(defects.title) : asc(defects.title);
        break;
      default:
        orderByClause = asc(defects.defectNumber);
    }

    const allDefects = await db.query.defects.findMany({
      orderBy: orderByClause,
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

    // Generate defect number
    const defectNumber = await generateDefectNumber();

    const defectData: NewDefect = {
      defectNumber,
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
