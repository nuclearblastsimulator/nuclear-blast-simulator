#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateHistoryRedirects() {
  try {
    // Read the redirect map
    const redirectMapPath = path.join(__dirname, 'history-redirect-map.json');
    const redirectMapContent = await fs.readFile(redirectMapPath, 'utf8');
    const redirectMap = JSON.parse(redirectMapContent);

    // Generate redirects with both slash and non-slash versions
    const redirects = [];
    
    // Add header comment
    redirects.push('\n# History article redirects (generated from reorganization)');
    redirects.push('# Both with and without trailing slashes are handled\n');

    // Sort redirects by source path for easier maintenance
    const sortedRedirects = redirectMap.sort((a, b) => a.from.localeCompare(b.from));

    // Generate redirect entries
    for (const redirect of sortedRedirects) {
      // Without trailing slash
      redirects.push(`${redirect.from} ${redirect.to} 301`);
      // With trailing slash
      redirects.push(`${redirect.from}/ ${redirect.to} 301`);
    }

    // Read existing redirects file
    const redirectsFilePath = path.join(__dirname, '..', 'public', '_redirects');
    const existingContent = await fs.readFile(redirectsFilePath, 'utf8');

    // Check if history redirects already exist
    if (existingContent.includes('# History article redirects')) {
      console.log('History redirects already exist in _redirects file. Skipping...');
      return;
    }

    // Append new redirects
    const newContent = existingContent.trimEnd() + '\n' + redirects.join('\n') + '\n';
    
    // Write back to file
    await fs.writeFile(redirectsFilePath, newContent);

    console.log(`✅ Successfully generated ${sortedRedirects.length * 2} history redirects`);
    console.log(`   (${sortedRedirects.length} paths × 2 for trailing slash variants)`);
    console.log(`📝 Appended to: ${redirectsFilePath}`);

  } catch (error) {
    console.error('❌ Error generating history redirects:', error);
    process.exit(1);
  }
}

// Run the script
generateHistoryRedirects();