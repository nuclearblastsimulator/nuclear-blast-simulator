#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bumpVersion(type = 'patch') {
  try {
    // Read package.json
    const packagePath = path.join(__dirname, '../package.json');
    const packageContent = await fs.readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    // Parse current version
    const [major, minor, patch] = packageJson.version.split('.').map(Number);
    
    // Bump version based on type
    let newVersion;
    switch(type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
    }
    
    // Update package.json
    packageJson.version = newVersion;
    await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    
    // Update README.md
    const readmePath = path.join(__dirname, '../README.md');
    let readmeContent = await fs.readFile(readmePath, 'utf-8');
    
    // Replace version badge
    readmeContent = readmeContent.replace(
      /!\[Nuclear Blast Simulator\]\(https:\/\/img\.shields\.io\/badge\/version-[\d\.]+-(blue|green)\.svg\)/,
      `![Nuclear Blast Simulator](https://img.shields.io/badge/version-${newVersion}-blue.svg)`
    );
    
    await fs.writeFile(readmePath, readmeContent);
    
    console.log(`✅ Version bumped to ${newVersion}`);
    console.log(`   Updated: package.json`);
    console.log(`   Updated: README.md`);
    console.log(`\nNext steps:`);
    console.log(`1. Review changes: git diff`);
    console.log(`2. Commit: git commit -am "Bump version to ${newVersion}"`);
    console.log(`3. Tag: git tag v${newVersion}`);
    console.log(`4. Push: git push && git push --tags`);
    
  } catch (error) {
    console.error('Error bumping version:', error);
    process.exit(1);
  }
}

// Get version type from command line
const versionType = process.argv[2] || 'patch';

if (!['major', 'minor', 'patch'].includes(versionType)) {
  console.error('Usage: node bump-version.js [major|minor|patch]');
  process.exit(1);
}

bumpVersion(versionType);