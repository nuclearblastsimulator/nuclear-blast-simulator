#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping of old paths to new paths based on SEO recommendations
const reorganizationMap = {
  // Cold War Crises -> events/
  'src/content/history/cold-war-crises/cuban-missile-crisis.md': 'src/content/history/events/cuban-missile-crisis.md',
  'src/content/history/cold-war-crises/able-archer-83.md': 'src/content/history/events/able-archer-83.md',
  'src/content/history/cold-war-crises/stanislav-petrov-incident.md': 'src/content/history/events/stanislav-petrov-incident.md',
  'src/content/history/cold-war-crises/norwegian-rocket-incident.md': 'src/content/history/events/norwegian-rocket-incident.md',
  'src/content/history/cold-war-crises/kargil-conflict.md': 'src/content/history/events/kargil-conflict.md',
  'src/content/history/cold-war-crises/nuclear-close-calls.md': 'src/content/history/events/nuclear-close-calls.md',
  'src/content/history/cold-war-crises/broken-arrows.md': 'src/content/history/events/broken-arrows.md',
  
  // Testing & Disasters -> testing/
  'src/content/history/testing-disasters/castle-bravo.md': 'src/content/history/testing/castle-bravo.md',
  'src/content/history/testing-disasters/bikini-atoll.md': 'src/content/history/testing/bikini-atoll.md',
  'src/content/history/testing-disasters/nevada-test-site.md': 'src/content/history/testing/nevada-test-site.md',
  'src/content/history/testing-disasters/semipalatinsk-test-site.md': 'src/content/history/testing/semipalatinsk-test-site.md',
  'src/content/history/testing-disasters/novaya-zemlya.md': 'src/content/history/testing/novaya-zemlya.md',
  'src/content/history/testing-disasters/lop-nur.md': 'src/content/history/testing/lop-nur.md',
  'src/content/history/testing-disasters/nuclear-testing-health-effects.md': 'src/content/history/testing/nuclear-testing-health-effects.md',
  'src/content/history/testing-disasters/hibakusha.md': 'src/content/history/testing/hibakusha.md',
  
  // Nuclear Accidents -> events/
  'src/content/history/testing-disasters/chernobyl-disaster.md': 'src/content/history/events/chernobyl-disaster.md',
  'src/content/history/testing-disasters/fukushima-daiichi.md': 'src/content/history/events/fukushima-daiichi.md',
  'src/content/history/testing-disasters/three-mile-island.md': 'src/content/history/events/three-mile-island.md',
  
  // Key Figures -> people/
  'src/content/history/key-figures/oppenheimer.md': 'src/content/history/people/oppenheimer.md',
  'src/content/history/key-figures/edward-teller.md': 'src/content/history/people/edward-teller.md',
  'src/content/history/key-figures/andrei-sakharov.md': 'src/content/history/people/andrei-sakharov.md',
  'src/content/history/key-figures/klaus-fuchs.md': 'src/content/history/people/klaus-fuchs.md',
  'src/content/history/key-figures/hyman-rickover.md': 'src/content/history/people/hyman-rickover.md',
  
  // National Programs -> programs/
  'src/content/history/nuclear-programs/china.md': 'src/content/history/programs/china-nuclear-program.md',
  'src/content/history/nuclear-programs/france.md': 'src/content/history/programs/france-nuclear-program.md',
  'src/content/history/nuclear-programs/india.md': 'src/content/history/programs/india-nuclear-program.md',
  'src/content/history/nuclear-programs/israel.md': 'src/content/history/programs/israel-nuclear-program.md',
  'src/content/history/nuclear-programs/pakistan.md': 'src/content/history/programs/pakistan-nuclear-program.md',
  'src/content/history/nuclear-programs/united-kingdom.md': 'src/content/history/programs/uk-nuclear-program.md',
  'src/content/history/nuclear-programs/iran-nuclear-program.md': 'src/content/history/programs/iran-nuclear-program.md',
  'src/content/history/nuclear-programs/north-korea-first-test.md': 'src/content/history/programs/north-korea-nuclear-program.md',
  'src/content/history/nuclear-programs/nuclear-weapons-by-country.md': 'src/content/history/programs/nuclear-weapons-by-country.md',
  
  // Treaties -> treaties/
  'src/content/history/modern-developments/non-proliferation-treaty.md': 'src/content/history/treaties/non-proliferation-treaty.md',
  'src/content/history/modern-developments/comprehensive-test-ban-treaty.md': 'src/content/history/treaties/comprehensive-test-ban-treaty.md',
  'src/content/history/modern-developments/start-treaties.md': 'src/content/history/treaties/start-treaties.md',
  'src/content/history/modern-developments/intermediate-range-nuclear-forces-treaty.md': 'src/content/history/treaties/inf-treaty.md',
  'src/content/history/modern-developments/nuclear-weapons-free-zones.md': 'src/content/history/treaties/nuclear-weapons-free-zones.md',
  
  // Foundational Events -> events/
  'src/content/history/foundational-events/chicago-pile-1.md': 'src/content/history/events/chicago-pile-1.md',
  'src/content/history/foundational-events/discovery-of-radioactivity.md': 'src/content/history/events/discovery-of-radioactivity.md',
  'src/content/history/foundational-events/nuclear-fission-discovery.md': 'src/content/history/events/nuclear-fission-discovery.md',
  'src/content/history/foundational-events/neutron-discovery.md': 'src/content/history/events/neutron-discovery.md',
  'src/content/history/foundational-events/atoms-for-peace.md': 'src/content/history/events/atoms-for-peace.md',
  
  // Manhattan Project sites -> events/
  'src/content/history/foundational-events/los-alamos.md': 'src/content/history/events/manhattan-project-los-alamos.md',
  'src/content/history/foundational-events/oak-ridge.md': 'src/content/history/events/manhattan-project-oak-ridge.md',
  'src/content/history/foundational-events/chicago-met-lab.md': 'src/content/history/events/manhattan-project-chicago.md',
  
  // Weapons Technology - mixed destinations
  'src/content/history/weapons-technology/nuclear-weapons-design.md': 'src/content/history/programs/nuclear-weapons-design.md',
  'src/content/history/weapons-technology/nuclear-testing.md': 'src/content/history/testing/nuclear-testing-overview.md',
  'src/content/history/weapons-technology/nuclear-weapon-effects.md': 'src/content/history/events/nuclear-weapon-effects-studies.md',
  'src/content/history/weapons-technology/weapons-manufacturing.md': 'src/content/history/programs/weapons-manufacturing.md',
  
  // Military Programs
  'src/content/history/nuclear-programs/nuclear-submarines.md': 'src/content/history/programs/nuclear-submarines.md',
  'src/content/history/nuclear-programs/nautilus-submarine.md': 'src/content/history/programs/nautilus-submarine.md',
  'src/content/history/nuclear-programs/strategic-bombers.md': 'src/content/history/programs/strategic-bombers.md',
  'src/content/history/nuclear-programs/intercontinental-ballistic-missiles.md': 'src/content/history/programs/icbm-development.md',
  'src/content/history/nuclear-programs/nuclear-triad.md': 'src/content/history/programs/nuclear-triad.md',
  'src/content/history/nuclear-programs/missile-defense-systems.md': 'src/content/history/programs/missile-defense-systems.md',
  
  // Modern Developments - mixed destinations
  'src/content/history/modern-developments/nuclear-deterrence-theory.md': 'src/content/history/events/nuclear-deterrence-theory.md',
  'src/content/history/modern-developments/nuclear-ethics.md': 'src/content/history/events/nuclear-ethics-debate.md',
  'src/content/history/modern-developments/nuclear-abolition.md': 'src/content/history/events/nuclear-abolition-movement.md',
  'src/content/history/modern-developments/nuclear-terrorism.md': 'src/content/history/events/nuclear-terrorism-concerns.md',
  'src/content/history/modern-developments/nuclear-modernization-programs.md': 'src/content/history/programs/nuclear-modernization.md',
  
  // Power reactors -> events/
  'src/content/history/modern-developments/obninsk-reactor.md': 'src/content/history/events/obninsk-first-power-reactor.md',
  'src/content/history/modern-developments/shippingport.md': 'src/content/history/events/shippingport-reactor.md',
  
  // Keep some at root level as overview articles
  // 'src/content/history/trinity-test.md' stays at root
  // 'src/content/history/hiroshima-nagasaki.md' stays at root
  // 'src/content/history/testing-disasters/overview.md' -> delete (redundant)
};

// Track moved files for redirect creation
const movedFiles = [];

// Function to move files
function moveFile(oldPath, newPath) {
  try {
    // Ensure the destination directory exists
    const newDir = path.dirname(newPath);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }
    
    // Check if source file exists
    if (fs.existsSync(oldPath)) {
      // Read the file content
      const content = fs.readFileSync(oldPath, 'utf8');
      
      // Write to new location
      fs.writeFileSync(newPath, content);
      
      // Delete old file
      fs.unlinkSync(oldPath);
      
      // Track for redirects
      const oldUrl = oldPath.replace('src/content', '').replace('.md', '');
      const newUrl = newPath.replace('src/content', '').replace('.md', '');
      movedFiles.push({ from: oldUrl, to: newUrl });
      
      console.log(`Moved: ${oldPath} -> ${newPath}`);
    } else {
      console.log(`Skipping (not found): ${oldPath}`);
    }
  } catch (error) {
    console.error(`Error moving ${oldPath}:`, error.message);
  }
}

// Execute the reorganization
console.log('Starting history content reorganization...\n');

Object.entries(reorganizationMap).forEach(([oldPath, newPath]) => {
  moveFile(oldPath, newPath);
});

// Delete the overview file
try {
  if (fs.existsSync('src/content/history/testing-disasters/overview.md')) {
    fs.unlinkSync('src/content/history/testing-disasters/overview.md');
    console.log('Deleted redundant overview.md');
  }
} catch (error) {
  console.error('Error deleting overview.md:', error.message);
}

// Move remaining files that weren't explicitly mapped but need reorganization
const remainingMoves = [
  // Remaining cold-war-crises
  { from: 'src/content/history/cold-war-crises/moscow-nuclear-program.md', to: 'src/content/history/programs/soviet-nuclear-program.md' },
  { from: 'src/content/history/cold-war-crises/washington-dc.md', to: 'src/content/history/events/washington-nuclear-policy.md' },
  
  // Remaining weapons-technology  
  { from: 'src/content/history/weapons-technology/fission-weapons.md', to: 'src/content/history/events/fission-weapons-development.md' },
  { from: 'src/content/history/weapons-technology/fusion-weapons.md', to: 'src/content/history/events/fusion-weapons-development.md' },
  { from: 'src/content/history/weapons-technology/miniaturization.md', to: 'src/content/history/programs/warhead-miniaturization.md' },
  { from: 'src/content/history/weapons-technology/nuclear-materials.md', to: 'src/content/history/programs/nuclear-materials-production.md' },
  { from: 'src/content/history/weapons-technology/b83.md', to: 'src/content/history/programs/b83-nuclear-bomb.md' },
  { from: 'src/content/history/weapons-technology/w87.md', to: 'src/content/history/programs/w87-warhead.md' },
  { from: 'src/content/history/weapons-technology/w88.md', to: 'src/content/history/programs/w88-warhead.md' },
  { from: 'src/content/history/weapons-technology/moab.md', to: 'src/content/history/programs/moab-conventional-weapon.md' },
  { from: 'src/content/history/weapons-technology/gbu-57-mop.md', to: 'src/content/history/programs/bunker-buster-weapons.md' },
  
  // Remaining modern-developments
  { from: 'src/content/history/modern-developments/nuclear-fusion.md', to: 'src/content/history/programs/fusion-energy-research.md' },
  { from: 'src/content/history/modern-developments/small-modular-reactors.md', to: 'src/content/history/programs/small-modular-reactors.md' },
  { from: 'src/content/history/nuclear-programs/nuclear-proliferation-21st-century.md', to: 'src/content/history/events/nuclear-proliferation-21st-century.md' },
];

remainingMoves.forEach(({ from, to }) => {
  moveFile(from, to);
});

// Clean up empty directories
const dirsToCheck = [
  'src/content/history/cold-war-crises',
  'src/content/history/foundational-events',
  'src/content/history/key-figures',
  'src/content/history/modern-developments',
  'src/content/history/nuclear-programs',
  'src/content/history/testing-disasters',
  'src/content/history/weapons-technology'
];

dirsToCheck.forEach(dir => {
  try {
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
      console.log(`Removed empty directory: ${dir}`);
    }
  } catch (error) {
    console.error(`Error removing directory ${dir}:`, error.message);
  }
});

// Save redirect map for later use
fs.writeFileSync(
  'scripts/history-redirect-map.json',
  JSON.stringify(movedFiles, null, 2)
);

console.log('\nHistory reorganization complete!');
console.log(`Moved ${movedFiles.length} files`);
console.log('Redirect map saved to scripts/history-redirect-map.json');