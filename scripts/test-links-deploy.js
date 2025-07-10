#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import chalk from 'chalk';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

class LinkTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checkedInternalLinks = new Map(); // Map of link -> result
    this.checkedExternalLinks = new Map(); // Map of URL -> status code
    this.totalLinks = 0;
    this.validLinks = 0;
    this.brokenLinks = 0;
    this.externalLinks = 0;
    this.validExternalLinks = 0;
    this.brokenExternalLinks = 0;
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

  // Check external link status
  async checkExternalLink(url) {
    // Check cache first
    if (this.checkedExternalLinks.has(url)) {
      return this.checkedExternalLinks.get(url);
    }

    return new Promise((resolve) => {
      try {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
          method: 'HEAD',
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Nuclear-Blast-Simulator-Link-Checker/1.0)'
          }
        };

        const req = protocol.request(url, options, (res) => {
          const status = res.statusCode;
          this.checkedExternalLinks.set(url, status);
          
          // Handle redirects
          if (status >= 300 && status < 400 && res.headers.location) {
            // For redirects, we'll consider them valid
            resolve({ valid: true, status, redirect: res.headers.location });
          } else if (status >= 200 && status < 300) {
            resolve({ valid: true, status });
          } else {
            resolve({ valid: false, status });
          }
        });

        req.on('error', (err) => {
          this.checkedExternalLinks.set(url, 0);
          resolve({ valid: false, status: 0, error: err.message });
        });

        req.on('timeout', () => {
          req.destroy();
          this.checkedExternalLinks.set(url, 0);
          resolve({ valid: false, status: 0, error: 'Timeout' });
        });

        req.end();
      } catch (err) {
        this.checkedExternalLinks.set(url, 0);
        resolve({ valid: false, status: 0, error: err.message });
      }
    });
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
    let statusText = status;
    
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
      case 'external-valid':
        statusSymbol = '🌐✓';
        statusColor = chalk.green;
        statusText = 'ext-ok';
        break;
      case 'external-broken':
        statusSymbol = '🌐✗';
        statusColor = chalk.red;
        statusText = 'ext-404';
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
      `${statusSymbol} ${statusColor(statusText.padEnd(8))} | ` +
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
      
      // Skip external links
      if (this.isExternalLink(link)) {
        this.showProgress(this.totalLinks, this.totalLinks, filePath, link, 'skipped');
        continue;
      }
      
      // Check internal links
      const normalizedLink = this.normalizePath(link, filePath);
      
      // Check cache first
      if (this.checkedInternalLinks.has(link)) {
        const isValid = this.checkedInternalLinks.get(link);
        if (isValid) {
          this.validLinks++;
          this.showProgress(this.totalLinks, this.totalLinks, filePath, link, 'valid');
        } else {
          this.brokenLinks++;
          this.errors.push({
            file: fileRelative,
            link: link,
            type: 'broken',
            expected: path.relative(distDir, normalizedLink)
          });
          this.showProgress(this.totalLinks, this.totalLinks, filePath, link, 'broken');
        }
      } else {
        // Test internal link
        const exists = this.checkFileExists(normalizedLink);
        this.checkedInternalLinks.set(link, exists);
        
        if (exists) {
          this.validLinks++;
          this.showProgress(this.totalLinks, this.totalLinks, filePath, link, 'valid');
        } else {
          this.brokenLinks++;
          this.errors.push({
            file: fileRelative,
            link: link,
            type: 'broken',
            expected: path.relative(distDir, normalizedLink)
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
    console.log(`${chalk.green('✓ Valid internal links:')}     ${this.validLinks}`);
    console.log(`${chalk.red('✗ Broken internal links:')}    ${this.brokenLinks}`);
    console.log(`${chalk.gray('📎 Total links tested:')}      ${this.totalLinks}`);
    console.log(`${chalk.gray('⏱  Test duration:')}          ${duration}s`);
    console.log('═'.repeat(50));
    
    // Display errors
    if (this.errors.length > 0) {
      console.log(`\n${chalk.red.bold('❌ Broken Links Found:')}\n`);
      
      // Display internal broken links
      console.log(chalk.red.bold('Internal Broken Links:'));
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
    
    
    // Final status
    if (this.errors.length === 0) {
      console.log(chalk.green.bold('\n✅ All links are valid! Safe to deploy.'));
      return true;
    } else {
      console.log(chalk.red.bold(`\n❌ Found ${this.errors.length} broken internal links.`));
      console.log(chalk.yellow('Please fix these issues before deploying.'));
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