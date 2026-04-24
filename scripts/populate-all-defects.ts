import { getDb } from '../lib/db';
import { defects } from '../lib/db/schema';

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
    title: 'Stormwater Pipes Not Cleaned',
    description: 'AS 3500.3 Section 6.3.1.2 calls for stormwater pipes to be cleaned internally prior to installation and commissioning. Ensuring a functioning stormwater system that is clear from obstruction. Site stormwater pipes do not meet this requirement.',
    location: 'LHS',
    standardReference: 'AS 3500.3 Section 6.3.1.2',
    status: 'TODO' as const,
    images: []
  },
  {
    defectNumber: 'DEF-003',
    title: 'Slab Edge Damaged',
    description: 'QBCC Act Schedule 1B, Implied Warranties, sect. 20: The building contractor warrants that all materials supplied for use in the subject work will be good and unless stated otherwise shall be new. There are materials used that have not met this requirement.',
    location: 'Slab edge damaged LHS garage',
    standardReference: 'QBCC Act Schedule 1B, sect. 20',
    status: 'TODO' as const,
    images: []
  },
  {
    defectNumber: 'DEF-004',
    title: 'Retaining Wall Above FFL',
    description: 'The bottom edge of the retaining wall as well as the retaining wall footings finish above the Finished Floor Level (FFL) of the dwelling. The builder needs to explain how the home owner is expected to install concrete paths or landscaping that slopes away from the dwelling in order to comply with clause 3.1.3.3 of the NCC. Alternatively the builder needs to justify why the dwelling has been built at this height.',
    location: 'LHS, base of retaining wall higher than FFL',
    standardReference: 'QBCC Act Schedule 1B, NCC 3.1.3.3',
    status: 'TODO' as const,
    images: []
  },
  {
    defectNumber: 'DEF-005',
    title: 'Slab Cold Joints/Bony Finish',
    description: 'AS 2870; 6.4.7: The concrete shall be transported, placed, compacted, and cured with good building practice. Concrete in beams is to be mechanically vibrated. Engineering has noted this requirement. The dwellings slab presents with an amount of what is known as a bony finish to the edge beam of the home with cold joints. Cold joints are where the installation of concrete has had a lapse in time between filling sections. It is recommended that the builder seeks a professional opinion from the site engineers in relation to this item and rework accordingly.',
    location: 'Noted throughout',
    standardReference: 'AS 2870; 6.4.7',
    status: 'TODO' as const,
    images: []
  },
  {
    defectNumber: 'DEF-006',
    title: 'Open Concrete Voids - Exposed Reinforcement',
    description: 'NCC 2022; 4.2.11: There are areas of open concrete voids to the slab edge. These areas are now showing the exposed reinforcement bars. Steel was not installed with the minimum concrete coverage area as per the mandated requirements of the NCC. The builder must seek engineering process and design for rectification of this defect, document same, send the engineering to the site surveyor for approval, have the site surveyor witness the repair, and supply a copy to the client.',
    location: 'RHS',
    standardReference: 'NCC 2022; 4.2.11',
    status: 'TODO' as const,
    images: []
  },
  {
    defectNumber: 'DEF-007',
    title: 'Slotted Wall Brackets Fixed Incorrectly',
    description: 'NASH Standard Part 2, 3.3.3: For non-loadbearing walls, vertically slotted wall brackets shall be used to connect roof trusses and the like. Screws to these brackets have been fixed hard to the slots, and as such are preventing free, independent vertical movement of the members. The non-loadbearing walls have effectively been converted to loadbearing.',
    location: 'Brackets screwed to bottom of slot - Noted throughout',
    standardReference: 'NASH Standard Part 2, 3.3.3',
    status: 'TODO' as const,
    images: []
  },
  {
    defectNumber: 'DEF-008',
    title: 'Particle Board Fixings Too Deep',
    description: 'AS 1860.2; 10.3: Fixings used to fix particle board sheet flooring shall be driven flush or not more than 1mm below the sheet surface. This requirement has not been met. Fixings present as having been driven well below the sheet surface during installation.',
    location: 'Noted throughout 2nd floor',
    standardReference: 'AS 1860.2; 10.3',
    status: 'TODO' as const,
    images: []
  },
  {
    defectNumber: 'DEF-009',
    title: 'Steel Sections Not Corrosion Protected',
    description: 'NASH Standard Part 2; 8.2.2: Steel sections that are not built into a masonry wall must be protected from corrosion in accordance with Table 8.1 or AS/NZS 2312. This requirement has not been met where bottom plates have been cut out at doorways.',
    location: 'RHS',
    standardReference: 'NASH Standard Part 2; 8.2.2 / AS/NZS 2312',
    status: 'TODO' as const,
    images: []
  },
  {
    defectNumber: 'DEF-010',
    title: 'Cavity Width/Obstructions',
    description: 'AS 4773.2; 9.2 & AS 3700: Cavity issues identified during Frame & Slab Inspection. Cavity width and obstructions do not meet the required standards.',
    location: 'TBD',
    standardReference: 'AS 4773.2; 9.2 & AS 3700',
    status: 'TODO' as const,
    images: []
  }
];

async function populateDefects() {
  const db = getDb();
  
  console.log('📝 Populating database with', allDefects.length, 'defects...\n');
  
  for (const defect of allDefects) {
    try {
      await db.insert(defects).values(defect);
      console.log('✅ Added:', defect.defectNumber, '-', defect.title);
    } catch (e) {
      console.error('❌ Failed:', defect.defectNumber, e);
    }
  }
  
  console.log('\n🎉 Database populated successfully!');
  console.log('📊 Total defects:', allDefects.length);
}

populateDefects().catch(console.error);
