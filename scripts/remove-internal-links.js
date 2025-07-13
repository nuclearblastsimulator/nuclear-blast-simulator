#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

console.log('🔗 Starting internal link removal from terms and history articles...\n');

// Find all markdown files in terms and history folders
const termsFiles = await glob('src/content/terms/**/*.md');
const historyFiles = await glob('src/content/history/**/*.md');
const allFiles = [...termsFiles, ...historyFiles];

console.log(`Found ${termsFiles.length} terms articles`);
console.log(`Found ${historyFiles.length} history articles`);
console.log(`Total: ${allFiles.length} files to process\n`);

let totalLinksRemoved = 0;
let filesModified = 0;

// Process each file
allFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf-8');
  let modifiedContent = content;
  let linksInFile = 0;
  
  // Regular expression to match markdown links
  // Matches [text](/...) or [text](http://localhost...) or [text](https://nuclearsimulator...)
  const linkRegex = /\[([^\]]+)\]\((?:\/[^)]+|https?:\/\/(?:localhost|nuclearsimulator)[^)]+)\)/g;
  
  // Find all internal links
  const matches = content.match(linkRegex) || [];
  
  if (matches.length > 0) {
    // Replace each link with just the text
    matches.forEach(match => {
      const linkText = match.match(/\[([^\]]+)\]/)[1];
      modifiedContent = modifiedContent.replace(match, linkText);
      linksInFile++;
    });
    
    // Write the modified content back
    fs.writeFileSync(filePath, modifiedContent);
    
    console.log(`✓ ${path.relative('src/content', filePath)}: Removed ${linksInFile} links`);
    totalLinksRemoved += linksInFile;
    filesModified++;
  }
});

console.log('\n📊 Summary:');
console.log(`- Files modified: ${filesModified}`);
console.log(`- Total links removed: ${totalLinksRemoved}`);
console.log(`- Files unchanged: ${allFiles.length - filesModified}`);

// Create a backup record of what was done
const removalRecord = {
  timestamp: new Date().toISOString(),
  filesModified: filesModified,
  totalLinksRemoved: totalLinksRemoved,
  processedFiles: allFiles.length
};

fs.writeFileSync(
  'scripts/link-removal-record.json',
  JSON.stringify(removalRecord, null, 2)
);

console.log('\n✅ Internal link removal complete!');
console.log('📝 Removal record saved to scripts/link-removal-record.json');