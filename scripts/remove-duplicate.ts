import { getDb } from '../lib/db';
import { defects } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function removeDuplicate() {
  const db = getDb();
  
  // Find all defects with DEF-001
  const allDefects = await db.query.defects.findMany({
    where: eq(defects.defectNumber, 'DEF-001')
  });
  
  console.log('Found', allDefects.length, 'DEF-001 defects');
  
  if (allDefects.length > 1) {
    // Keep the first one, delete the rest
    const toDelete = allDefects.slice(1);
    for (const defect of toDelete) {
      await db.delete(defects).where(eq(defects.id, defect.id));
      console.log('Deleted duplicate DEF-001 with ID:', defect.id);
    }
    console.log('✅ Removed', toDelete.length, 'duplicate(s)');
  } else {
    console.log('No duplicates found');
  }
}

removeDuplicate().catch(console.error);
