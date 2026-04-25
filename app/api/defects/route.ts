export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { defects, NewDefect, statusEnum } from '@/lib/db/schema';
import { eq, desc, isNull } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for creating a defect
const createDefectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().max(255).optional(),
  standardReference: z.string().max(255).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  images: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Helper to generate next defect number
async function generateDefectNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { defectNumberSequences } = await import('@/lib/db/schema');
  
  // Try to get existing sequence for this year
  let sequence = await db.query.defectNumberSequences.findFirst({
    where: (seq, { eq }) => eq(seq.year, year),
  });
  
  if (!sequence) {
    // Create new sequence for this year
    const [newSeq] = await db.insert(defectNumberSequences)
      .values({ year, lastNumber: 1 })
      .returning();
    sequence = newSeq;
    return `DF-${year}-0001`;
  }
  
  // Increment sequence
  const nextNumber = sequence.lastNumber + 1;
  await db.update(defectNumberSequences)
    .set({ lastNumber: nextNumber, updatedAt: new Date() })
    .where(eq(defectNumberSequences.id, sequence.id));
  
  const paddedNumber = nextNumber.toString().padStart(4, '0');
  return `DF-${year}-${paddedNumber}`;
}

// GET /api/defects - List all non-deleted defects
export async function GET(): Promise<NextResponse> {
  try {
    const allDefects = await db.query.defects.findMany({
      where: isNull(defects.deletedAt),
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
