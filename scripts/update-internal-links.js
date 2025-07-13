#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the redirect map
const redirectMap = JSON.parse(fs.readFileSync('scripts/redirect-map.json', 'utf8'));

// Create a map for easier lookup
const redirectLookup = {};
redirectMap.forEach(({ from, to }) => {
  redirectLookup[from] = to;
});

// Function to update links in a file
function updateLinksInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Pattern to match markdown links [text](/terms/...)
    const linkPattern = /\[([^\]]+)\]\(\/terms\/[^)]+\)/g;
    
    content = content.replace(linkPattern, (match, linkText) => {
      // Extract the URL from the match
      const urlMatch = match.match(/\(([^)]+)\)/);
      if (!urlMatch) return match;
      
      const oldUrl = urlMatch[1];
      const newUrl = redirectLookup[oldUrl];
      
      if (newUrl) {
        hasChanges = true;
        console.log(`  ${oldUrl} -> ${newUrl}`);
        return `[${linkText}](${newUrl})`;
      }
      
      return match;
    });
    
    // Also update related frontmatter arrays
    if (filePath.endsWith('.md')) {
      const relatedPattern = /related:\s*\[(.*?)\]/s;
      const relatedMatch = content.match(relatedPattern);
      
      if (relatedMatch) {
        const relatedItems = relatedMatch[1].split(',').map(item => item.trim().replace(/['"]/g, ''));
        const updatedItems = relatedItems.map(item => {
          // Convert short names to full paths and check redirects
          const possiblePaths = [
            `/terms/${item}`,
            `/terms/nuclear-effects/${item}`,
            `/terms/nuclear-physics/${item}`,
            `/terms/weapons-delivery/${item}`,
            `/terms/reactor-technology/${item}`,
            `/terms/safety-systems/${item}`,
            `/terms/nuclear-strategy/${item}`,
            `/terms/treaties-agreements/${item}`
          ];
          
          for (const path of possiblePaths) {
            if (redirectLookup[path]) {
              const newPath = redirectLookup[path];
              const newItem = newPath.split('/').pop();
              hasChanges = true;
              console.log(`  Related: ${item} -> ${newItem}`);
              return newItem;
            }
          }
          
          return item;
        });
        
        if (hasChanges) {
          const newRelated = `related: [${updatedItems.map(item => `"${item}"`).join(', ')}]`;
          content = content.replace(relatedPattern, newRelated);
        }
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to find all files to update
function findFilesToUpdate(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        findFilesToUpdate(filePath, fileList);
      }
    } else if (file.endsWith('.md') || file.endsWith('.astro') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main execution
console.log('Updating internal links...\n');

const filesToUpdate = findFilesToUpdate('src');
let updatedCount = 0;

filesToUpdate.forEach(file => {
  if (updateLinksInFile(file)) {
    console.log(`Updated: ${file}`);
    updatedCount++;
  }
});

console.log(`\nLink update complete!`);
console.log(`Updated ${updatedCount} files`);