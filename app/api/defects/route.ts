export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { defects, NewDefect, defectNumberSequences } from '@/lib/db/schema';
import { eq, desc, asc, isNull, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for creating a defect
const createDefectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().max(255).optional(),
  standardReference: z.string().max(255).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  images: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Helper to generate sequential defect number (DEF-001, DEF-002, etc.)
async function generateDefectNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Get or create sequence for this year
  const sequence = await db.query.defectNumberSequences.findFirst({
    where: eq(defectNumberSequences.year, year),
  });
  
  let nextNumber: number;
  
  if (!sequence) {
    // First defect of the year - start at 1
    nextNumber = 1;
    await db.insert(defectNumberSequences).values({
      year,
      lastNumber: 1,
    });
  } else {
    // Increment existing sequence
    nextNumber = sequence.lastNumber + 1;
    await db.update(defectNumberSequences)
      .set({ lastNumber: nextNumber })
      .where(eq(defectNumberSequences.year, year));
  }
  
  // Format as DEF-XXX (padded to 3 digits)
  return `DEF-${String(nextNumber).padStart(3, '0')}`;
}

// GET /api/defects - List all active (non-deleted) defects
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'defectNumber';
    const sortDir = searchParams.get('sortDir') || 'asc';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

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
      case 'severity':
        orderByClause = sortDir === 'desc' ? desc(defects.severity) : asc(defects.severity);
        break;
      default:
        orderByClause = asc(defects.defectNumber);
    }

    // Build where clause - exclude soft-deleted by default
    const whereClause = includeDeleted 
      ? undefined 
      : isNull(defects.deletedAt);

    const allDefects = await db.query.defects.findMany({
      where: whereClause,
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
      severity: validationResult.data.severity ?? 'MEDIUM',
      images: validationResult.data.images ?? [],
      notes: validationResult.data.notes ?? null,
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
