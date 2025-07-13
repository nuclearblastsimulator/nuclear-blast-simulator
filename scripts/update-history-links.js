#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
const redirectMap = JSON.parse(readFileSync(new URL('./history-redirect-map.json', import.meta.url), 'utf8'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert redirect map to a more efficient lookup structure
const redirectLookup = {};
redirectMap.forEach(redirect => {
  redirectLookup[redirect.from] = redirect.to;
  // Also handle trailing slashes
  redirectLookup[redirect.from + '/'] = redirect.to + '/';
});

// Function to update links in content
function updateLinksInContent(content, filePath) {
  let updatedContent = content;
  let changesMade = false;
  
  // Pattern to match markdown links
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  updatedContent = updatedContent.replace(linkPattern, (match, text, url) => {
    // Check if it's an internal history link
    if (url.startsWith('/history/')) {
      // Check if this URL needs to be updated
      for (const [oldPath, newPath] of Object.entries(redirectLookup)) {
        if (url === oldPath || url.startsWith(oldPath + '#')) {
          const anchor = url.includes('#') ? url.substring(url.indexOf('#')) : '';
          const newUrl = newPath + anchor;
          console.log(`  Updating markdown link in ${path.basename(filePath)}: ${url} -> ${newUrl}`);
          changesMade = true;
          return `[${text}](${newUrl})`;
        }
      }
    }
    return match;
  });
  
  // Pattern to match URLs in quotes (for JS/Astro files)
  const quotedUrlPattern = /["']((\/history\/(cold-war-crises|foundational-events|key-figures|modern-developments|nuclear-programs|testing-disasters|weapons-technology)\/[^"']+))/g;
  
  updatedContent = updatedContent.replace(quotedUrlPattern, (match, url, category) => {
    for (const [oldPath, newPath] of Object.entries(redirectLookup)) {
      if (url === oldPath || url === oldPath + '/') {
        const quote = match[0];
        const newUrl = url.endsWith('/') ? newPath + '/' : newPath;
        console.log(`  Updating quoted URL in ${path.basename(filePath)}: ${url} -> ${newUrl}`);
        changesMade = true;
        return quote + newUrl;
      }
    }
    return match;
  });
  
  // Also check for any references in frontmatter or plain text (for markdown files)
  if (filePath.endsWith('.md')) {
    const urlPattern = /(?<!\]\()\/history\/(cold-war-crises|foundational-events|key-figures|modern-developments|nuclear-programs|testing-disasters|weapons-technology)\/[\w-]+/g;
    
    updatedContent = updatedContent.replace(urlPattern, (match) => {
      for (const [oldPath, newPath] of Object.entries(redirectLookup)) {
        if (match === oldPath) {
          console.log(`  Updating reference in ${path.basename(filePath)}: ${match} -> ${newPath}`);
          changesMade = true;
          return newPath;
        }
      }
      return match;
    });
  }
  
  return { content: updatedContent, changed: changesMade };
}

// Function to process a single file
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { content: updatedContent, changed } = updateLinksInContent(content, filePath);
  
  if (changed) {
    fs.writeFileSync(filePath, updatedContent);
    return true;
  }
  return false;
}

// Function to recursively process all files in a directory
function processDirectory(dirPath, extensions = ['.md', '.astro', '.js']) {
  let totalFilesUpdated = 0;
  let totalFilesProcessed = 0;
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      const { filesUpdated, filesProcessed } = processDirectory(itemPath, extensions);
      totalFilesUpdated += filesUpdated;
      totalFilesProcessed += filesProcessed;
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      totalFilesProcessed++;
      if (processFile(itemPath)) {
        totalFilesUpdated++;
      }
    }
  }
  
  return { filesUpdated: totalFilesUpdated, filesProcessed: totalFilesProcessed };
}

// Main execution
console.log('Starting history links update...\n');

const projectRoot = path.join(__dirname, '..');
const dirsToProcess = [
  { path: path.join(projectRoot, 'src', 'content', 'history'), name: 'History content' },
  { path: path.join(projectRoot, 'src', 'content', 'terms'), name: 'Terms content' },
  { path: path.join(projectRoot, 'src', 'pages'), name: 'Pages' },
  { path: path.join(projectRoot, 'src', 'data'), name: 'Data files' }
];

console.log('Using redirect map with', redirectMap.length, 'redirects\n');

let totalUpdated = 0;
let totalProcessed = 0;

for (const dir of dirsToProcess) {
  if (fs.existsSync(dir.path)) {
    console.log(`Processing ${dir.name} in: ${dir.path}`);
    const { filesUpdated, filesProcessed } = processDirectory(dir.path);
    totalUpdated += filesUpdated;
    totalProcessed += filesProcessed;
    console.log(`  Processed: ${filesProcessed} files, Updated: ${filesUpdated} files\n`);
  } else {
    console.log(`Skipping ${dir.name} (directory not found): ${dir.path}\n`);
  }
}

console.log('=== Summary ===');
console.log(`Total files processed: ${totalProcessed}`);
console.log(`Total files updated: ${totalUpdated}`);

if (totalUpdated > 0) {
  console.log('\nLinks have been successfully updated!');
} else {
  console.log('\nNo links needed updating.');
}