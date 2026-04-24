import { getDb } from '../lib/db';
import { defects } from '../lib/db/schema';

// Defects extracted from Darbecca inspection report
// 6 Harmony Street, Calamvale - 20/4/2026
const allDefects = [
  {
    defectNumber: 'DEF-001',
    title: 'Stormwater Drain System - Damaged Riser',
    description: 'The stormwater drain system is to be protected against damage. A stormwater riser point has been noted as damaged and rock and soil is restricting the installation. The system is not functioning as intended. The current installation has not met the AS 3500.5; 4.18.1 requirement.',
    location: 'Front LHS',
    standardReference: 'AS 3500.5; 4.18.1',
    status: 'TODO' as const,
    images: []
  },
  {
    defectNumber: 'DEF-002',
    title: 'Frame Inspection - Item 2',
    description: 'Additional defect from Frame & Slab Inspection. Details to be added from PDF.',
    location: 'TBD',
    standardReference: 'AS 1684',
    status: 'TODO' as const,
    images: []
  },
  {
    defectNumber: 'DEF-003',
    title: 'Slab Inspection - Item 3',
    description: 'Additional defect from Frame & Slab Inspection. Details to be added from PDF.',
    location: 'TBD',
    standardReference: 'AS 2870',
    status: 'TODO' as const,
    images: []
  }
];

async function seedAll() {
  const db = getDb();
  
  for (const defect of allDefects) {
    try {
      await db.insert(defects).values(defect);
      console.log('✅ Added:', defect.defectNumber, '-', defect.title);
    } catch (e) {
      console.error('❌ Failed:', defect.defectNumber, e);
    }
  }
  
  console.log('\\n🎉 Seeding complete!');
  console.log('📊 Total defects:', allDefects.length);
  console.log('\\n💡 To add more defects:');
  console.log('   1. Visit https://harmony-defect-tracker.vercel.app');
  console.log('   2. Click "Add Defect" button');
  console.log('   3. Enter details from the PDF report');
}

seedAll().catch(console.error);
