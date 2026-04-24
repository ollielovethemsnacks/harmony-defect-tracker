import { getDb } from '../lib/db';
import { defects } from '../lib/db/schema';

const initialDefects = [
  {
    defectNumber: 'DEF-001',
    title: 'Stormwater Drain System - Damaged Riser',
    description: 'The stormwater drain system is to be protected against damage. A stormwater riser point has been noted as damaged and rock and soil is restricting the installation. The system is not functioning as intended. The current installation has not met the AS 3500.5; 4.18.1 requirement.',
    location: 'Front LHS',
    standardReference: 'AS 3500.5; 4.18.1',
    status: 'TODO' as const,
    images: []
  }
];

async function seed() {
  const db = getDb();
  
  for (const defect of initialDefects) {
    await db.insert(defects).values(defect);
  }
  
  console.log('✅ Seeded', initialDefects.length, 'defects');
}

seed().catch(console.error);
