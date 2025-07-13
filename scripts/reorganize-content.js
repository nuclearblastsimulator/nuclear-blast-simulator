#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping of old paths to new paths based on SEO recommendations
const reorganizationMap = {
  // Nuclear Effects -> effects/
  'src/content/terms/nuclear-effects/blast-effects.md': 'src/content/terms/effects/blast-effects.md',
  'src/content/terms/nuclear-effects/thermal-radiation.md': 'src/content/terms/effects/thermal-radiation.md',
  'src/content/terms/nuclear-effects/electromagnetic-pulse.md': 'src/content/terms/effects/electromagnetic-pulse.md',
  'src/content/terms/nuclear-effects/nuclear-winter.md': 'src/content/terms/effects/nuclear-winter.md',
  'src/content/terms/nuclear-effects/ground-zero.md': 'src/content/terms/effects/ground-zero.md',
  'src/content/terms/radiation-sickness.md': 'src/content/terms/effects/radiation-sickness.md',
  
  // Yield-related to weapons/
  'src/content/terms/nuclear-effects/yield.md': 'src/content/terms/weapons/yield.md',
  'src/content/terms/nuclear-effects/megaton.md': 'src/content/terms/weapons/megaton.md',
  'src/content/terms/nuclear-effects/yield-comparison.md': 'src/content/terms/weapons/yield-comparison.md',
  'src/content/terms/nuclear-physics/critical-mass.md': 'src/content/terms/weapons/critical-mass.md',
  'src/content/terms/nuclear-physics/fission.md': 'src/content/terms/weapons/fission-weapons.md',
  'src/content/terms/nuclear-physics/fusion.md': 'src/content/terms/weapons/fusion-weapons.md',
  'src/content/terms/nuclear-physics/plutonium.md': 'src/content/terms/weapons/plutonium.md',
  'src/content/terms/nuclear-physics/enrichment.md': 'src/content/terms/weapons/enrichment.md',
  
  // Weapons Delivery -> delivery/
  'src/content/terms/weapons-delivery/icbm.md': 'src/content/terms/delivery/icbm.md',
  'src/content/terms/weapons-delivery/nuclear-triad.md': 'src/content/terms/delivery/nuclear-triad.md',
  'src/content/terms/weapons-delivery/first-strike.md': 'src/content/terms/delivery/first-strike.md',
  'src/content/terms/weapons-delivery/tactical-nuclear-weapons.md': 'src/content/terms/delivery/tactical-nuclear-weapons.md',
  'src/content/terms/nuclear-effects/emp-weapons.md': 'src/content/terms/delivery/emp-weapons.md',
  
  // Nuclear Physics -> physics/
  'src/content/terms/nuclear-physics/alpha-decay.md': 'src/content/terms/physics/alpha-decay.md',
  'src/content/terms/nuclear-physics/half-life.md': 'src/content/terms/physics/half-life.md',
  'src/content/terms/nuclear-physics/binding-energy.md': 'src/content/terms/physics/binding-energy.md',
  'src/content/terms/nuclear-physics/neutron-cross-section.md': 'src/content/terms/physics/neutron-cross-section.md',
  'src/content/terms/nuclear-physics/nuclear-fallout.md': 'src/content/terms/effects/fallout.md',
  
  // Reactor Technology -> power/
  'src/content/terms/reactor-technology/pressurized-water-reactor.md': 'src/content/terms/power/pressurized-water-reactor.md',
  'src/content/terms/reactor-technology/boiling-water-reactor.md': 'src/content/terms/power/boiling-water-reactor.md',
  'src/content/terms/reactor-technology/small-modular-reactors.md': 'src/content/terms/power/small-modular-reactors.md',
  'src/content/terms/reactor-technology/control-rods.md': 'src/content/terms/power/control-rods.md',
  'src/content/terms/reactor-technology/coolant.md': 'src/content/terms/power/coolant.md',
  'src/content/terms/reactor-technology/moderator.md': 'src/content/terms/power/moderator.md',
  'src/content/terms/reactor-technology/generation-iv.md': 'src/content/terms/power/generation-iv.md',
  'src/content/terms/reactor-technology/thorium-cycle.md': 'src/content/terms/power/thorium-cycle.md',
  'src/content/terms/reactor-technology/tokamak.md': 'src/content/terms/power/tokamak.md',
  
  // Safety Systems -> power/
  'src/content/terms/safety-systems/containment.md': 'src/content/terms/power/containment.md',
  'src/content/terms/safety-systems/scram.md': 'src/content/terms/power/scram.md',
  'src/content/terms/safety-systems/defense-in-depth.md': 'src/content/terms/power/defense-in-depth.md',
  'src/content/terms/safety-systems/alara-principle.md': 'src/content/terms/power/alara-principle.md',
  
  // Nuclear Strategy -> strategy/
  'src/content/terms/nuclear-strategy/nuclear-deterrence.md': 'src/content/terms/strategy/nuclear-deterrence.md',
  'src/content/terms/nuclear-strategy/mutual-assured-destruction.md': 'src/content/terms/strategy/mutual-assured-destruction.md',
  'src/content/terms/treaties-agreements/non-proliferation-treaty.md': 'src/content/terms/strategy/non-proliferation-treaty.md',
  'src/content/terms/treaties-agreements/start-treaty.md': 'src/content/terms/strategy/start-treaty.md',
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
console.log('Starting content reorganization...\n');

Object.entries(reorganizationMap).forEach(([oldPath, newPath]) => {
  moveFile(oldPath, newPath);
});

// Clean up empty directories
const dirsToCheck = [
  'src/content/terms/nuclear-effects',
  'src/content/terms/nuclear-physics',
  'src/content/terms/nuclear-strategy',
  'src/content/terms/reactor-technology',
  'src/content/terms/safety-systems',
  'src/content/terms/treaties-agreements',
  'src/content/terms/weapons-delivery'
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
  'scripts/redirect-map.json',
  JSON.stringify(movedFiles, null, 2)
);

console.log('\nReorganization complete!');
console.log(`Moved ${movedFiles.length} files`);
console.log('Redirect map saved to scripts/redirect-map.json');