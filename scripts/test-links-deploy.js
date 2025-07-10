#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

class LinkTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checkedLinks = new Set();
    this.totalLinks = 0;
    this.validLinks = 0;
    this.brokenLinks = 0;
    this.externalLinks = 0;
    this.startTime = Date.now();
  }

  // Extract all links from HTML content
  extractLinks(htmlContent, filePath) {
    const links = [];
    
    // Match href attributes
    const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
    let match;
    while ((match = hrefRegex.exec(htmlContent)) !== null) {
      links.push(match[1]);
    }
    
    // Match src attributes for assets
    const srcRegex = /src\s*=\s*["']([^"']+)["']/gi;
    while ((match = srcRegex.exec(htmlContent)) !== null) {
      links.push(match[1]);
    }
    
    return links;
  }

  // Check if a link is external
  isExternalLink(link) {
    return link.startsWith('http://') || link.startsWith('https://') || link.startsWith('//');
  }

  // Check if a link is an anchor
  isAnchorLink(link) {
    return link.startsWith('#');
  }

  // Check if a link is a mailto
  isMailtoLink(link) {
    return link.startsWith('mailto:');
  }

  // Normalize a link path
  normalizePath(link, currentFile) {
    // Remove query strings and fragments
    let normalizedLink = link.split('?')[0].split('#')[0];
    
    // Handle absolute paths
    if (normalizedLink.startsWith('/')) {
      return path.join(distDir, normalizedLink);
    }
    
    // Handle relative paths
    const currentDir = path.dirname(currentFile);
    return path.join(currentDir, normalizedLink);
  }

  // Check if a file exists
  checkFileExists(filePath) {
    // If it's a directory, check for index.html
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        return fs.existsSync(indexPath);
      }
      return true;
    }
    
    // Check if adding .html works
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath)) {
      return true;
    }
    
    // Check if it's a directory with index.html
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return true;
    }
    
    return false;
  }

  // Progress indicator with details
  showProgress(current, total, currentFile, currentLink, status) {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(percentage);
    
    // Clear the current line and move cursor to beginning
    process.stdout.write('\r\x1b[K');
    
    // Build status message
    let statusSymbol = '';
    let statusColor = chalk.gray;
    
    switch(status) {
      case 'checking':
        statusSymbol = '🔍';
        statusColor = chalk.yellow;
        break;
      case 'valid':
        statusSymbol = '✓';
        statusColor = chalk.green;
        break;
      case 'broken':
        statusSymbol = '✗';
        statusColor = chalk.red;
        break;
      case 'external':
        statusSymbol = '🌐';
        statusColor = chalk.blue;
        break;
      case 'skipped':
        statusSymbol = '⏭';
        statusColor = chalk.gray;
        break;
    }
    
    const fileDisplay = path.relative(distDir, currentFile).substring(0, 30);
    const linkDisplay = currentLink.substring(0, 40);
    
    process.stdout.write(
      `${progressBar} ${percentage}% | ` +
      `${statusSymbol} ${statusColor(status.padEnd(8))} | ` +
      `${chalk.dim(fileDisplay.padEnd(32))} → ${chalk.dim(linkDisplay)}`
    );
  }

  // Create a visual progress bar
  createProgressBar(percentage) {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  // Test all links in a file
  async testFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const links = this.extractLinks(content, filePath);
    const fileRelative = path.relative(distDir, filePath);
    
    console.log(`\n${chalk.blue('📄 Testing:')} ${chalk.dim(fileRelative)}`);
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      this.totalLinks++;
      
      // Show checking status
      this.showProgress(this.totalLinks, this.totalLinks, filePath, link, 'checking');
      
      // Skip certain types of links
      if (this.isAnchorLink(link) || this.isMailtoLink(link)) {
        this.showProgress(this.totalLinks, this.totalLinks, filePath, link, 'skipped');
        continue;
      }
      
      // Handle external links
      if (this.isExternalLink(link)) {
        this.externalLinks++;
        this.warnings.push({
          file: fileRelative,
          link: link,
          type: 'external'
        });
        this.showProgress(this.totalLinks, this.totalLinks, filePath, link, 'external');
        continue;
      }
      
      // Check internal links
      const linkPath = this.normalizePath(link, filePath);
      const linkKey = `${filePath}:${link}`;
      
      if (!this.checkedLinks.has(linkKey)) {
        this.checkedLinks.add(linkKey);
        
        if (this.checkFileExists(linkPath)) {
          this.validLinks++;
          this.showProgress(this.totalLinks, this.totalLinks, filePath, link, 'valid');
        } else {
          this.brokenLinks++;
          this.errors.push({
            file: fileRelative,
            link: link,
            type: 'broken',
            expected: path.relative(distDir, linkPath)
          });
          this.showProgress(this.totalLinks, this.totalLinks, filePath, link, 'broken');
          
          // Brief pause to show the broken link
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  }

  // Display final results
  displayResults() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n\n' + chalk.bold('📊 Link Test Summary'));
    console.log('═'.repeat(50));
    
    // Statistics
    console.log(`${chalk.green('✓ Valid links:')}      ${this.validLinks}`);
    console.log(`${chalk.red('✗ Broken links:')}     ${this.brokenLinks}`);
    console.log(`${chalk.blue('🌐 External links:')}  ${this.externalLinks}`);
    console.log(`${chalk.gray('📎 Total links:')}     ${this.totalLinks}`);
    console.log(`${chalk.gray('⏱  Test duration:')}   ${duration}s`);
    console.log('═'.repeat(50));
    
    // Display errors
    if (this.errors.length > 0) {
      console.log(`\n${chalk.red.bold('❌ Broken Links Found:')}\n`);
      
      // Group errors by file
      const errorsByFile = {};
      this.errors.forEach(error => {
        if (!errorsByFile[error.file]) {
          errorsByFile[error.file] = [];
        }
        errorsByFile[error.file].push(error);
      });
      
      Object.entries(errorsByFile).forEach(([file, errors]) => {
        console.log(chalk.yellow(`\n📄 ${file}:`));
        errors.forEach(error => {
          console.log(`   ${chalk.red('✗')} ${error.link}`);
          console.log(`     ${chalk.dim('Expected:')} ${error.expected}`);
        });
      });
    }
    
    // Display warnings (external links)
    if (this.warnings.length > 0) {
      console.log(`\n${chalk.blue.bold('🌐 External Links (not validated):')}\n`);
      
      // Show first 10 external links as examples
      const externalSample = this.warnings.slice(0, 10);
      externalSample.forEach(warning => {
        console.log(`   ${chalk.blue('•')} ${warning.link} ${chalk.dim(`(in ${warning.file})`)}`);
      });
      
      if (this.warnings.length > 10) {
        console.log(chalk.dim(`   ... and ${this.warnings.length - 10} more`));
      }
    }
    
    // Final status
    if (this.errors.length === 0) {
      console.log(chalk.green.bold('\n✅ All internal links are valid! Safe to deploy.'));
      return true;
    } else {
      console.log(chalk.red.bold(`\n❌ Found ${this.errors.length} broken links. Please fix before deploying.`));
      return false;
    }
  }

  // Main test runner
  async run() {
    console.log(chalk.bold.blue('\n🔗 Nuclear Blast Simulator - Link Validation\n'));
    
    // Check if dist directory exists
    if (!fs.existsSync(distDir)) {
      console.error(chalk.red('❌ Error: dist directory not found. Please run "npm run build" first.'));
      process.exit(1);
    }
    
    // Find all HTML files
    const htmlFiles = await glob('**/*.html', { cwd: distDir });
    
    if (htmlFiles.length === 0) {
      console.error(chalk.red('❌ Error: No HTML files found in dist directory.'));
      process.exit(1);
    }
    
    console.log(chalk.dim(`Found ${htmlFiles.length} HTML files to test\n`));
    
    // Test each file
    for (const file of htmlFiles) {
      const filePath = path.join(distDir, file);
      await this.testFile(filePath);
    }
    
    // Display results
    const success = this.displayResults();
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  }
}

// Run the link tester
const tester = new LinkTester();
tester.run().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});