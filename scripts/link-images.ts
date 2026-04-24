import { getDb } from '../lib/db';
import { defects } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

// Map defects to their image files based on page numbers
const defectImageMap: Record<string, string[]> = {
  'DEF-001': [ // Page 4 - Stormwater drain
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p4_img1.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p4_img2.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p4_img3.jpeg',
  ],
  'DEF-002': [ // Page 5 - Stormwater pipes
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p5_img1.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p5_img2.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p5_img3.jpeg',
  ],
  'DEF-003': [ // Page 6 - Slab edge
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p6_img1.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p6_img2.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p6_img3.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p6_img4.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p6_img5.jpeg',
  ],
  'DEF-004': [ // Page 8 - Retaining wall
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p8_img1.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p8_img2.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p8_img3.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p8_img4.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p8_img5.jpeg',
  ],
  'DEF-005': [ // Page 9 - Slab cold joints
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p9_img1.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p9_img2.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p9_img3.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p9_img4.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p9_img5.jpeg',
  ],
  'DEF-006': [ // Page 11-12 - Concrete voids
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p11_img1.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p12_img1.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p12_img2.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p12_img3.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p12_img4.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p12_img5.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p12_img6.jpeg',
  ],
  'DEF-007': [ // Page 15 - Wall brackets
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p15_img1.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p15_img2.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p15_img3.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p15_img4.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p15_img5.jpeg',
  ],
  'DEF-008': [ // Page 17 - Particle board
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p17_img1.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p17_img2.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p17_img3.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p17_img4.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p17_img5.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p17_img6.jpeg',
  ],
  'DEF-009': [ // Page 19 - Steel sections
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p19_img1.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p19_img2.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p19_img3.jpeg',
  ],
  'DEF-010': [ // Page 21-22 - Cavity
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p21_img1.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p21_img2.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p21_img3.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p22_img1.png',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p22_img2.jpeg',
    '/defect-images/0f3bb99b-226d-4aff-a2c5-b603046e2bee_p22_img3.jpeg',
  ],
};

async function linkImages() {
  const db = getDb();
  
  console.log('🔗 Linking images to defects...\n');
  
  for (const [defectNumber, images] of Object.entries(defectImageMap)) {
    try {
      await db.update(defects)
        .set({ images })
        .where(eq(defects.defectNumber, defectNumber));
      console.log(`✅ ${defectNumber}: Linked ${images.length} images`);
    } catch (e) {
      console.error(`❌ ${defectNumber}: Failed to link images`, e);
    }
  }
  
  console.log('\n🎉 Image linking complete!');
}

linkImages().catch(console.error);
