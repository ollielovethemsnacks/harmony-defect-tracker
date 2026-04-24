import { getDb } from '../lib/db';
import { defects, comments } from '../lib/db/schema';

async function clearAll() {
  const db = getDb();
  
  // Delete all comments first (foreign key constraint)
  const deletedComments = await db.delete(comments).returning();
  console.log('🗑️  Deleted', deletedComments.length, 'comments');
  
  // Delete all defects
  const deletedDefects = await db.delete(defects).returning();
  console.log('🗑️  Deleted', deletedDefects.length, 'defects');
  
  console.log('✅ Database cleared successfully');
}

clearAll().catch(console.error);
