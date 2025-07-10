import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// New organization structure
const termsReorganization = {
  'nuclear-physics': [
    'nuclear-physics/alpha-decay',
    'nuclear-physics/binding-energy',
    'nuclear-physics/critical-mass',
    'nuclear-physics/fission',
    'nuclear-physics/fusion',
    'nuclear-physics/half-life',
    'nuclear-physics/neutron-cross-section',
    'nuclear-physics/plutonium',
    'nuclear-technology/enrichment',
    'nuclear-effects/nuclear-fallout'
  ],
  'nuclear-effects': [
    'nuclear-effects/electromagnetic-pulse',
    'nuclear-effects/emp-weapons',
    'nuclear-effects/ground-zero',
    'nuclear-effects/megaton',
    'nuclear-effects/nuclear-winter',
    'nuclear-effects/yield-comparison',
    'nuclear-effects/yield'
  ],
  'reactor-technology': [
    'reactor-types/boiling-water-reactor',
    'reactor-types/generation-iv',
    'reactor-types/pressurized-water-reactor',
    'reactor-types/small-modular-reactors',
    'reactor-types/thorium-cycle',
    'reactor-types/tokamak',
    'reactor-components/control-rods',
    'reactor-components/coolant',
    'reactor-components/moderator'
  ],
  'safety-systems': [
    'safety-systems/alara-principle',
    'safety-systems/containment',
    'safety-systems/defense-in-depth',
    'safety-systems/scram'
  ],
  'weapons-delivery': [
    'weapons-delivery-systems/first-strike',
    'weapons-delivery-systems/icbm',
    'weapons-delivery-systems/nuclear-triad',
    'weapons-delivery-systems/tactical-nuclear-weapons'
  ],
  'nuclear-strategy': [
    'strategy-policy/mutual-assured-destruction',
    'strategy-policy/nuclear-deterrence'
  ],
  'treaties-agreements': [
    'treaties-agreements/non-proliferation-treaty',
    'treaties-agreements/start-treaty'
  ]
};

const historyReorganization = {
  'foundational-events': [
    'historical-events/discovery-of-radioactivity',
    'historical-events/neutron-discovery',
    'historical-events/nuclear-fission-discovery',
    'historical-events/chicago-pile-1',
    'historical-events/atoms-for-peace',
    'nuclear-facilities/chicago-met-lab',
    'nuclear-facilities/los-alamos',
    'nuclear-facilities/oak-ridge'
  ],
  'key-figures': [
    'key-figures/andrei-sakharov',
    'key-figures/edward-teller',
    'key-figures/hyman-rickover',
    'key-figures/klaus-fuchs',
    'key-figures/oppenheimer'
  ],
  'cold-war-crises': [
    'historical-events/cuban-missile-crisis',
    'historical-events/able-archer-83',
    'historical-events/kargil-conflict',
    'historical-events/norwegian-rocket-incident',
    'historical-events/stanislav-petrov-incident',
    'historical-events/nuclear-close-calls',
    'historical-events/broken-arrows',
    'nuclear-command/moscow-nuclear-program',
    'nuclear-command/washington-dc'
  ],
  'weapons-technology': [
    'weapons-technology/fission-weapons',
    'weapons-technology/fusion-weapons',
    'weapons-technology/nuclear-weapons-design',
    'weapons-technology/nuclear-materials',
    'weapons-technology/weapons-manufacturing',
    'weapons-technology/nuclear-weapon-effects',
    'weapons-technology/nuclear-testing',
    'weapons-technology/miniaturization',
    'weapons-technology/b83',
    'weapons-technology/w87',
    'weapons-technology/w88',
    'weapons-technology/gbu-57-mop',
    'weapons-technology/moab'
  ],
  'nuclear-programs': [
    'nuclear-programs/china',
    'nuclear-programs/france',
    'nuclear-programs/india',
    'nuclear-programs/israel',
    'nuclear-programs/pakistan',
    'nuclear-programs/united-kingdom',
    'overview/nuclear-weapons-by-country',
    'modern-developments/nuclear-proliferation-21st-century',
    'modern-developments/iran-nuclear-program',
    'delivery-systems/intercontinental-ballistic-missiles',
    'delivery-systems/missile-defense-systems',
    'delivery-systems/nautilus-submarine',
    'delivery-systems/nuclear-submarines',
    'delivery-systems/nuclear-triad',
    'delivery-systems/strategic-bombers'
  ],
  'testing-disasters': [
    'testing-sites/bikini-atoll',
    'testing-sites/lop-nur',
    'testing-sites/nevada-test-site',
    'testing-sites/novaya-zemlya',
    'testing-sites/semipalatinsk-test-site',
    'testing-sites/overview',
    'medical-environmental/castle-bravo',
    'medical-environmental/chernobyl-disaster',
    'medical-environmental/fukushima-daiichi',
    'medical-environmental/three-mile-island',
    'medical-environmental/hibakusha',
    'medical-environmental/nuclear-testing-health-effects'
  ],
  'modern-developments': [
    'modern-developments/nuclear-fusion',
    'modern-developments/nuclear-modernization-programs',
    'modern-developments/nuclear-terrorism',
    'modern-developments/obninsk-reactor',
    'modern-developments/shippingport',
    'modern-developments/small-modular-reactors',
    'treaties-diplomacy/comprehensive-test-ban-treaty',
    'treaties-diplomacy/intermediate-range-nuclear-forces-treaty',
    'treaties-diplomacy/non-proliferation-treaty',
    'treaties-diplomacy/nuclear-weapons-free-zones',
    'treaties-diplomacy/start-treaties',
    'philosophical-ethical/nuclear-abolition',
    'philosophical-ethical/nuclear-deterrence-theory',
    'philosophical-ethical/nuclear-ethics'
  ]
};

async function moveFile(oldPath, newPath) {
  try {
    // Ensure the target directory exists
    await fs.mkdir(path.dirname(newPath), { recursive: true });
    
    // Move the file
    await fs.rename(oldPath, newPath);
    console.log(`✓ Moved: ${oldPath} → ${newPath}`);
  } catch (error) {
    console.error(`✗ Error moving ${oldPath}: ${error.message}`);
  }
}

async function reorganizeContent() {
  console.log('🔄 Starting content reorganization...\n');
  
  // Process terms
  console.log('📚 Reorganizing Terms...');
  const termsBase = path.join(__dirname, '../src/content/terms');
  
  for (const [newCategory, files] of Object.entries(termsReorganization)) {
    console.log(`\n  Category: ${newCategory}`);
    
    for (const file of files) {
      const oldPath = path.join(termsBase, `${file}.md`);
      const fileName = path.basename(file);
      const newPath = path.join(termsBase, newCategory, `${fileName}.md`);
      
      // Skip if it's already in the right place
      if (oldPath === newPath) {
        console.log(`    ✓ Already in place: ${fileName}`);
        continue;
      }
      
      await moveFile(oldPath, newPath);
    }
  }
  
  // Process history
  console.log('\n\n📜 Reorganizing History...');
  const historyBase = path.join(__dirname, '../src/content/history');
  
  for (const [newCategory, files] of Object.entries(historyReorganization)) {
    console.log(`\n  Category: ${newCategory}`);
    
    for (const file of files) {
      const oldPath = path.join(historyBase, `${file}.md`);
      const fileName = path.basename(file);
      const newPath = path.join(historyBase, newCategory, `${fileName}.md`);
      
      // Skip if it's already in the right place
      if (oldPath === newPath) {
        console.log(`    ✓ Already in place: ${fileName}`);
        continue;
      }
      
      await moveFile(oldPath, newPath);
    }
  }
  
  // Clean up empty directories
  console.log('\n\n🧹 Cleaning up empty directories...');
  await cleanEmptyDirs(termsBase);
  await cleanEmptyDirs(historyBase);
  
  console.log('\n\n✅ Reorganization complete!');
  console.log('\n📊 Summary:');
  console.log('  Terms: 7 categories, 38 articles');
  console.log('  History: 7 categories, 76 articles');
}

async function cleanEmptyDirs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      await cleanEmptyDirs(fullPath);
      
      // Check if directory is empty after recursive cleaning
      const contents = await fs.readdir(fullPath);
      if (contents.length === 0) {
        await fs.rmdir(fullPath);
        console.log(`  ✓ Removed empty directory: ${entry.name}`);
      }
    }
  }
}

// Add confirmation prompt
console.log('⚠️  This script will reorganize all content files!');
console.log('Make sure you have committed your changes first.');
console.log('\nNew structure:');
console.log('\nTerms (7 categories):');
console.log('  - nuclear-physics');
console.log('  - nuclear-effects');
console.log('  - reactor-technology');
console.log('  - safety-systems');
console.log('  - weapons-delivery');
console.log('  - nuclear-strategy');
console.log('  - treaties-agreements');
console.log('\nHistory (7 categories):');
console.log('  - foundational-events');
console.log('  - key-figures');
console.log('  - cold-war-crises');
console.log('  - weapons-technology');
console.log('  - nuclear-programs');
console.log('  - testing-disasters');
console.log('  - modern-developments');
console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(() => {
  reorganizeContent();
}, 5000);