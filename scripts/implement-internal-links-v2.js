#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content');
const ANALYSIS_DIR = path.join(ROOT_DIR, 'link-analysis');

class InternalLinkImplementer {
  constructor(options = {}) {
    this.preview = options.preview || false;
    this.apply = options.apply || false;
    this.maxLinksPerArticle = options.maxLinksPerArticle || 10;
    this.maxLinksPerSection = options.maxLinksPerSection || 3;
    this.minScore = options.minScore || 5;
    
    this.changes = [];
    this.stats = {
      articlesModified: 0,
      linksAdded: 0,
      skipped: 0
    };
  }

  async implement() {
    console.log('🔗 Starting internal link implementation v2...\n');
    
    if (!this.preview && !this.apply) {
      console.error('❌ Please specify --preview or --apply');
      process.exit(1);
    }
    
    // Load suggestions
    const suggestions = this.loadSuggestions();
    if (!suggestions) {
      console.error('❌ No link suggestions found. Run analyze-internal-links.js first.');
      process.exit(1);
    }
    
    // Process each article
    for (const articleSuggestions of suggestions.suggestions) {
      await this.processArticle(articleSuggestions);
    }
    
    // Show results
    this.showResults();
    
    // Apply changes if requested
    if (this.apply) {
      await this.applyChanges();
    }
  }

  loadSuggestions() {
    const suggestionsPath = path.join(ANALYSIS_DIR, 'link-suggestions.json');
    if (!fs.existsSync(suggestionsPath)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(suggestionsPath, 'utf-8'));
  }

  async processArticle(articleSuggestions) {
    const { source, sourceTitle, suggestions } = articleSuggestions;
    const [type, ...slugParts] = source.split('/');
    const slug = slugParts.join('/');
    const filePath = path.join(CONTENT_DIR, type, `${slug}.md`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const { processedContent, linksAdded } = this.addLinksToContent(
      content,
      suggestions.filter(s => s.score >= this.minScore)
    );
    
    if (linksAdded > 0) {
      this.changes.push({
        filePath,
        originalContent: content,
        processedContent,
        linksAdded,
        sourceTitle
      });
      
      this.stats.articlesModified++;
      this.stats.linksAdded += linksAdded;
    }
  }

  addLinksToContent(content, suggestions) {
    // Split content into frontmatter and body
    const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n/);
    if (!frontmatterMatch) {
      return { processedContent: content, linksAdded: 0 };
    }
    
    const frontmatter = frontmatterMatch[0];
    let body = content.slice(frontmatter.length);
    
    // Track what we've already linked
    const linkedTargets = new Set();
    const linkedPhrases = new Set();
    let linksAdded = 0;
    let linksInCurrentSection = 0;
    
    // Sort suggestions by score
    const sortedSuggestions = suggestions.sort((a, b) => b.score - a.score);
    
    // Process each suggestion
    for (const suggestion of sortedSuggestions) {
      if (linksAdded >= this.maxLinksPerArticle) break;
      if (linkedTargets.has(suggestion.targetId)) continue;
      
      // Find the best match to link
      const bestMatch = this.findBestMatch(body, suggestion, linkedPhrases);
      if (!bestMatch) continue;
      
      // Check section limits
      const sectionCheck = this.checkSectionLimit(body, bestMatch.index, linksInCurrentSection);
      if (!sectionCheck.canAdd) {
        if (sectionCheck.newSection) {
          linksInCurrentSection = 0;
        } else {
          continue;
        }
      }
      
      // Create the link
      const linkPath = `/${suggestion.targetType}/${suggestion.targetId.split('/').slice(1).join('/')}`;
      const linkedText = `[${bestMatch.text}](${linkPath})`;
      
      // Replace in body
      body = body.slice(0, bestMatch.index) + 
             linkedText + 
             body.slice(bestMatch.index + bestMatch.text.length);
      
      // Track what we've done
      linkedTargets.add(suggestion.targetId);
      linkedPhrases.add(bestMatch.text.toLowerCase());
      linksAdded++;
      linksInCurrentSection++;
      
      // Adjust future indices
      const lengthDiff = linkedText.length - bestMatch.text.length;
      sortedSuggestions.forEach(s => {
        if (s.matches) {
          s.matches.forEach(m => {
            if (m.index && m.index > bestMatch.index) {
              m.index += lengthDiff;
            }
          });
        }
      });
    }
    
    return {
      processedContent: frontmatter + body,
      linksAdded
    };
  }

  findBestMatch(body, suggestion, linkedPhrases) {
    // Split body into lines to track headers
    const lines = body.split('\n');
    let currentPosition = 0;
    
    // Try to find exact title match first (not in headers)
    const titleRegex = new RegExp(`\\b${this.escapeRegex(suggestion.targetTitle)}\\b`, 'gi');
    const titleMatches = [...body.matchAll(titleRegex)];
    
    for (const match of titleMatches) {
      if (!this.isInsideLink(body, match.index) && 
          !this.isInsideCodeBlock(body, match.index) &&
          !this.isInsideHeader(body, match.index) &&
          !linkedPhrases.has(match[0].toLowerCase())) {
        return {
          text: match[0],
          index: match.index
        };
      }
    }
    
    // Try keyword matches (not in headers)
    for (const matchData of suggestion.matches) {
      const keyword = matchData.keyword;
      if (linkedPhrases.has(keyword.toLowerCase())) continue;
      
      const keywordRegex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'gi');
      const keywordMatches = [...body.matchAll(keywordRegex)];
      
      for (const match of keywordMatches) {
        if (!this.isInsideLink(body, match.index) && 
            !this.isInsideCodeBlock(body, match.index) &&
            !this.isInsideHeader(body, match.index)) {
          return {
            text: match[0],
            index: match.index
          };
        }
      }
    }
    
    return null;
  }

  isInsideHeader(content, index) {
    // Find the line containing this index
    const before = content.slice(0, index);
    const lineStart = before.lastIndexOf('\n') + 1;
    const lineEnd = content.indexOf('\n', index);
    const line = content.slice(lineStart, lineEnd > -1 ? lineEnd : content.length);
    
    // Check if this line is a header (h1-h6)
    return /^#{1,6}\s/.test(line);
  }

  isInsideLink(content, index) {
    // Check if the index is inside an existing markdown link
    const before = content.slice(Math.max(0, index - 100), index);
    const after = content.slice(index, index + 100);
    
    // Check for [text](url) pattern
    const linkStart = before.lastIndexOf('[');
    const linkEnd = after.indexOf(')');
    
    if (linkStart !== -1 && linkEnd !== -1) {
      const potentialLink = before.slice(linkStart) + after.slice(0, linkEnd + 1);
      if (potentialLink.match(/\[.*?\]\(.*?\)/)) {
        return true;
      }
    }
    
    return false;
  }

  isInsideCodeBlock(content, index) {
    // Check if inside code block or inline code
    const before = content.slice(0, index);
    
    // Count backticks before index
    const codeBlocks = before.match(/```/g) || [];
    if (codeBlocks.length % 2 !== 0) {
      return true; // Inside code block
    }
    
    // Check for inline code
    const lineStart = before.lastIndexOf('\n') + 1;
    const line = content.slice(lineStart, content.indexOf('\n', index));
    const beforeInLine = line.slice(0, index - lineStart);
    
    const inlineCodeBefore = (beforeInLine.match(/`/g) || []).length;
    if (inlineCodeBefore % 2 !== 0) {
      return true; // Inside inline code
    }
    
    return false;
  }

  checkSectionLimit(body, index, currentCount) {
    // Find the current section
    const before = body.slice(0, index);
    const lastSectionHeader = before.lastIndexOf('\n##');
    const prevSectionHeader = lastSectionHeader > 0 ? 
      before.lastIndexOf('\n##', lastSectionHeader - 1) : -1;
    
    // Check if we're in a new section
    const newSection = prevSectionHeader === -1 || 
      (currentCount > 0 && lastSectionHeader > prevSectionHeader);
    
    return {
      canAdd: currentCount < this.maxLinksPerSection,
      newSection
    };
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  showResults() {
    console.log('\n📊 Implementation Summary\n');
    console.log(`Articles to modify: ${this.stats.articlesModified}`);
    console.log(`Links to add: ${this.stats.linksAdded}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    
    if (this.preview && this.changes.length > 0) {
      console.log('\n📝 Preview of changes:\n');
      
      for (const change of this.changes.slice(0, 5)) {
        console.log(`\n${change.sourceTitle} (${change.linksAdded} links)`);
        console.log(`File: ${change.filePath.replace(ROOT_DIR, '.')}`);
        
        // Show a sample of the changes
        const diffs = this.findDifferences(change.originalContent, change.processedContent);
        for (const diff of diffs.slice(0, 2)) {
          console.log(`\n  Before: ...${diff.before}...`);
          console.log(`  After:  ...${diff.after}...`);
        }
      }
      
      if (this.changes.length > 5) {
        console.log(`\n... and ${this.changes.length - 5} more files`);
      }
    }
  }

  findDifferences(original, processed) {
    const diffs = [];
    let lastIndex = 0;
    
    // Simple diff finder for preview
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    let match;
    
    while ((match = linkRegex.exec(processed)) !== null) {
      const linkText = match[0];
      const plainText = match[1];
      
      // Check if this is a new link
      const originalSubstring = original.slice(lastIndex, lastIndex + 1000);
      if (originalSubstring.includes(plainText) && !originalSubstring.includes(linkText)) {
        const contextStart = Math.max(0, match.index - 30);
        const contextEnd = Math.min(processed.length, match.index + linkText.length + 30);
        
        diffs.push({
          before: processed.slice(contextStart, contextEnd).replace(linkText, plainText),
          after: processed.slice(contextStart, contextEnd)
        });
      }
      
      lastIndex = match.index + linkText.length;
    }
    
    return diffs;
  }

  async applyChanges() {
    console.log('\n✏️  Applying changes...\n');
    
    for (const change of this.changes) {
      fs.writeFileSync(change.filePath, change.processedContent);
      console.log(`✅ Updated ${change.filePath.replace(ROOT_DIR, '.')}`);
    }
    
    console.log(`\n🎉 Successfully added ${this.stats.linksAdded} links to ${this.stats.articlesModified} articles!`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  preview: args.includes('--preview'),
  apply: args.includes('--apply'),
  maxLinksPerArticle: 10,
  maxLinksPerSection: 3,
  minScore: 5
};

// Custom options parsing
const maxLinksIndex = args.indexOf('--max-links');
if (maxLinksIndex !== -1 && args[maxLinksIndex + 1]) {
  options.maxLinksPerArticle = parseInt(args[maxLinksIndex + 1]);
}

const minScoreIndex = args.indexOf('--min-score');
if (minScoreIndex !== -1 && args[minScoreIndex + 1]) {
  options.minScore = parseInt(args[minScoreIndex + 1]);
}

// Run the implementer
const implementer = new InternalLinkImplementer(options);
implementer.implement().catch(console.error);