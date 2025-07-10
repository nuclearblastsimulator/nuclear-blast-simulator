#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content');

class InternalLinkAnalyzer {
  constructor() {
    this.articles = new Map();
    this.keywordIndex = new Map();
    this.linkSuggestions = [];
    this.stats = {
      totalArticles: 0,
      totalSuggestions: 0,
      articlesByType: {},
      topKeywords: []
    };
  }

  async analyze() {
    console.log('🔍 Starting internal link analysis v2...\n');
    
    // Load all articles
    await this.loadArticles();
    
    // Build keyword index
    this.buildKeywordIndex();
    
    // Find linking opportunities
    this.findLinkingOpportunities();
    
    // Generate report
    this.generateReport();
  }

  async loadArticles() {
    const types = ['terms', 'history'];
    
    for (const type of types) {
      const typeDir = path.join(CONTENT_DIR, type);
      await this.loadArticlesFromDir(typeDir, type);
    }
    
    console.log(`✅ Loaded ${this.articles.size} articles\n`);
  }

  async loadArticlesFromDir(dir, type, subdir = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        await this.loadArticlesFromDir(itemPath, type, path.join(subdir, item));
      } else if (item.endsWith('.md')) {
        const content = fs.readFileSync(itemPath, 'utf-8');
        const slug = path.join(subdir, item.replace('.md', ''));
        const article = this.parseArticle(content, type, slug);
        
        if (article) {
          const id = `${type}/${slug}`;
          this.articles.set(id, article);
          this.stats.articlesByType[type] = (this.stats.articlesByType[type] || 0) + 1;
        }
      }
    }
  }

  parseArticle(content, type, slug) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;
    
    const frontmatter = {};
    frontmatterMatch[1].split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        frontmatter[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      }
    });
    
    const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    const summaryEndIndex = bodyContent.indexOf('<!-- SUMMARY_END -->');
    const summary = summaryEndIndex > -1 ? bodyContent.slice(0, summaryEndIndex) : bodyContent;
    
    // Extract text content without markdown, excluding headers
    const textContent = this.extractTextFromMarkdown(bodyContent);
    
    // Extract body-only content (no headers)
    const bodyOnlyContent = this.extractBodyText(bodyContent);
    
    return {
      type,
      slug,
      title: frontmatter.title || slug,
      description: frontmatter.description || '',
      content: bodyContent,
      summary,
      textContent,
      bodyOnlyContent,
      keywords: this.extractKeywords(frontmatter.title, textContent),
      category: this.determineCategory(type, slug)
    };
  }

  extractBodyText(markdown) {
    // Remove headers (h1-h6)
    let text = markdown.replace(/^#{1,6}\s+.*$/gm, '');
    
    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, '');
    
    // Remove inline code
    text = text.replace(/`[^`]+`/g, '');
    
    // Remove images
    text = text.replace(/!\[.*?\]\(.*?\)/g, '');
    
    // Remove links but keep link text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, '');
    
    // Remove markdown formatting (but keep list markers for context)
    text = text.replace(/[*_~]/g, '');
    
    // Remove sources section
    text = text.replace(/## Sources[\s\S]*$/m, '');
    
    // Keep list items intact (don't remove list markers)
    // This allows linking within list items
    
    return text.trim();
  }

  extractTextFromMarkdown(markdown) {
    // Remove code blocks
    let text = markdown.replace(/```[\s\S]*?```/g, '');
    
    // Remove inline code
    text = text.replace(/`[^`]+`/g, '');
    
    // Remove images
    text = text.replace(/!\[.*?\]\(.*?\)/g, '');
    
    // Remove links but keep link text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, '');
    
    // Remove markdown formatting
    text = text.replace(/[*_~#]/g, '');
    
    // Remove sources section
    text = text.replace(/## Sources[\s\S]*$/m, '');
    
    return text.trim();
  }

  determineCategory(type, slug) {
    if (type === 'history') {
      const category = slug.split('/')[0];
      return category;
    }
    return type;
  }

  extractKeywords(title, content) {
    const keywords = new Set();
    
    // Add title words (excluding common words)
    const titleWords = title.toLowerCase().split(/\s+/)
      .filter(word => word.length > 3 && !this.isCommonWord(word));
    titleWords.forEach(word => keywords.add(word));
    
    // Extract important phrases and terms
    const phrases = this.extractImportantPhrases(content);
    phrases.forEach(phrase => keywords.add(phrase.toLowerCase()));
    
    // Extract capitalized terms (likely proper nouns)
    const properNouns = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    properNouns.forEach(noun => {
      if (noun.length > 3 && !this.isCommonWord(noun.toLowerCase())) {
        keywords.add(noun.toLowerCase());
      }
    });
    
    // Extract technical terms (words with numbers, hyphens, etc.)
    const technicalTerms = content.match(/\b\w*\d+\w*\b|\b\w+-\w+\b/g) || [];
    technicalTerms.forEach(term => {
      if (term.length > 2) {
        keywords.add(term.toLowerCase());
      }
    });
    
    return Array.from(keywords);
  }

  extractImportantPhrases(content) {
    const phrases = [];
    
    // Nuclear-specific terms
    const nuclearPatterns = [
      /\b(?:nuclear|atomic|thermonuclear|fission|fusion)\s+\w+/gi,
      /\b\w+\s+(?:bomb|weapon|warhead|missile|reactor|test|treaty)/gi,
      /\b(?:uranium|plutonium|tritium|deuterium)-?\d*/gi,
      /\b(?:ICBM|SLBM|MIRV|ABM|MAD|NPT|START|SALT|INF|CTBT)\b/g
    ];
    
    nuclearPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        if (match.length > 3) {
          phrases.push(match.trim());
        }
      });
    });
    
    return phrases;
  }

  isCommonWord(word) {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
      'those', 'it', 'its', 'they', 'them', 'their', 'what', 'which',
      'when', 'where', 'why', 'how', 'all', 'some', 'any', 'both', 'each',
      'more', 'most', 'other', 'such', 'only', 'own', 'same', 'so', 'than',
      'too', 'very', 'just', 'now', 'during', 'about'
    ]);
    
    return commonWords.has(word.toLowerCase());
  }

  buildKeywordIndex() {
    console.log('📚 Building keyword index...');
    
    for (const [id, article] of this.articles) {
      for (const keyword of article.keywords) {
        if (!this.keywordIndex.has(keyword)) {
          this.keywordIndex.set(keyword, []);
        }
        this.keywordIndex.get(keyword).push(id);
      }
    }
    
    // Calculate top keywords
    const keywordCounts = Array.from(this.keywordIndex.entries())
      .map(([keyword, articles]) => ({ keyword, count: articles.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    this.stats.topKeywords = keywordCounts;
    console.log(`✅ Indexed ${this.keywordIndex.size} unique keywords\n`);
  }

  findLinkingOpportunities() {
    console.log('🔗 Finding linking opportunities...');
    
    let processed = 0;
    for (const [sourceId, sourceArticle] of this.articles) {
      const suggestions = this.findSuggestionsForArticle(sourceId, sourceArticle);
      
      if (suggestions.length > 0) {
        this.linkSuggestions.push({
          source: sourceId,
          sourceTitle: sourceArticle.title,
          suggestions: suggestions.slice(0, 5) // Top 5 suggestions per article
        });
        this.stats.totalSuggestions += Math.min(suggestions.length, 5);
      }
      
      processed++;
      if (processed % 10 === 0) {
        process.stdout.write(`\r🔗 Processing article ${processed}/${this.articles.size}...`);
      }
    }
    
    console.log(`\r✅ Found ${this.stats.totalSuggestions} linking opportunities\n`);
  }

  findSuggestionsForArticle(sourceId, sourceArticle) {
    const suggestions = [];
    const scoredTargets = new Map();
    
    // Use body-only content for matching
    const sourceText = sourceArticle.bodyOnlyContent.toLowerCase();
    
    // Score potential targets based on keyword matches
    for (const [targetId, targetArticle] of this.articles) {
      if (targetId === sourceId) continue;
      
      // Apply context-aware filtering
      if (!this.isContextuallyRelevant(sourceArticle, targetArticle)) continue;
      
      let score = 0;
      const matches = [];
      
      // Quick title check first
      const titleLower = targetArticle.title.toLowerCase();
      if (sourceText.includes(titleLower) && titleLower.length > 4) {
        const titleRegex = new RegExp(`\\b${this.escapeRegex(targetArticle.title)}\\b`, 'gi');
        const titleMatches = sourceArticle.bodyOnlyContent.match(titleRegex) || [];
        if (titleMatches.length > 0) {
          score += titleMatches.length * 10; // Higher weight for title matches
          matches.push({
            keyword: targetArticle.title,
            count: titleMatches.length,
            contexts: this.findContexts(sourceArticle.bodyOnlyContent, targetArticle.title, 1),
            isTitle: true
          });
        }
      }
      
      // Check for contextually relevant keywords only
      const relevantKeywords = this.filterRelevantKeywords(targetArticle.keywords, targetArticle);
      
      for (const keyword of relevantKeywords.slice(0, 5)) { // Limit keywords checked
        if (keyword.length < 4) continue;
        
        const keywordLower = keyword.toLowerCase();
        if (sourceText.includes(keywordLower)) {
          const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'gi');
          const contentMatches = sourceArticle.bodyOnlyContent.match(regex) || [];
          
          if (contentMatches.length > 0) {
            score += contentMatches.length * 2;
            matches.push({
              keyword,
              count: contentMatches.length,
              contexts: this.findContexts(sourceArticle.bodyOnlyContent, keyword, 1)
            });
          }
        }
      }
      
      if (score > 0) {
        scoredTargets.set(targetId, {
          target: targetArticle,
          score,
          matches
        });
      }
    }
    
    // Sort by score and create suggestions
    const sortedTargets = Array.from(scoredTargets.entries())
      .sort((a, b) => b[1].score - a[1].score);
    
    for (const [targetId, data] of sortedTargets) {
      suggestions.push({
        targetId,
        targetTitle: data.target.title,
        targetType: data.target.type,
        targetCategory: data.target.category,
        score: data.score,
        matches: data.matches,
        reason: this.generateLinkReason(data.matches)
      });
    }
    
    return suggestions;
  }

  isContextuallyRelevant(sourceArticle, targetArticle) {
    // Avoid linking between completely unrelated topics
    const targetCategory = targetArticle.category;
    
    // Don't link generic terms to specific country programs
    if (targetCategory === 'nuclear-programs' && 
        targetArticle.slug.match(/\/(india|pakistan|china|france|israel|united-kingdom)$/)) {
      // Only link if source specifically mentions the country
      const countryName = targetArticle.slug.split('/').pop();
      const countryRegex = new RegExp(`\\b${countryName}\\b`, 'i');
      if (!sourceArticle.textContent.match(countryRegex)) {
        return false;
      }
    }
    
    // Avoid linking generic "weapons" to specific country programs
    if (targetArticle.title.match(/^(India|Pakistan|China|France|Israel|United Kingdom)$/)) {
      const countryRegex = new RegExp(`\\b${targetArticle.title}\\b`, 'i');
      if (!sourceArticle.textContent.match(countryRegex)) {
        return false;
      }
    }
    
    return true;
  }

  filterRelevantKeywords(keywords, targetArticle) {
    // Filter out overly generic keywords when linking to specific articles
    const genericTerms = ['weapons', 'nuclear', 'atomic', 'bomb', 'missile', 'test'];
    
    if (targetArticle.category === 'nuclear-programs' && 
        targetArticle.slug.match(/\/(india|pakistan|china|france|israel|united-kingdom)$/)) {
      // For country-specific articles, prioritize country name and specific terms
      const countryName = targetArticle.slug.split('/').pop();
      return keywords.filter(k => 
        k.toLowerCase().includes(countryName) || 
        !genericTerms.includes(k.toLowerCase())
      );
    }
    
    return keywords;
  }

  findContexts(text, keyword, maxContexts = 2) {
    const contexts = [];
    const regex = new RegExp(`(.{0,50})\\b${this.escapeRegex(keyword)}\\b(.{0,50})`, 'gi');
    let match;
    let count = 0;
    
    while ((match = regex.exec(text)) !== null && count < maxContexts) {
      contexts.push({
        before: match[1].trim(),
        keyword: match[0].replace(match[1], '').replace(match[2], '').trim(),
        after: match[2].trim()
      });
      count++;
    }
    
    return contexts;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  generateLinkReason(matches) {
    const titleMatch = matches.find(m => m.isTitle);
    if (titleMatch) {
      return `Article title mentioned ${titleMatch.count} time(s)`;
    }
    
    const topMatch = matches[0];
    return `"${topMatch.keyword}" mentioned ${topMatch.count} time(s)`;
  }

  generateReport() {
    console.log('📊 Generating report...\n');
    
    // Create output directory
    const outputDir = path.join(ROOT_DIR, 'link-analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    // Generate detailed suggestions file
    this.generateSuggestionsFile(outputDir);
    
    // Generate summary report
    this.generateSummaryReport(outputDir);
    
    // Generate implementation guide
    this.generateImplementationGuide(outputDir);
    
    console.log(`\n✅ Analysis complete! Check the link-analysis/ directory for results.`);
  }

  generateSuggestionsFile(outputDir) {
    const suggestionsPath = path.join(outputDir, 'link-suggestions.json');
    const suggestions = {
      metadata: {
        generated: new Date().toISOString(),
        totalArticles: this.articles.size,
        totalSuggestions: this.stats.totalSuggestions,
        version: '2.0'
      },
      suggestions: this.linkSuggestions
    };
    
    fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2));
    console.log(`📄 Created link-suggestions.json`);
  }

  generateSummaryReport(outputDir) {
    const reportPath = path.join(outputDir, 'summary-report.md');
    let report = '# Internal Link Analysis Report\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    report += '## Overview\n\n';
    report += `- Total articles analyzed: ${this.articles.size}\n`;
    report += `- Total linking opportunities found: ${this.stats.totalSuggestions}\n`;
    report += `- Average suggestions per article: ${(this.stats.totalSuggestions / this.articles.size).toFixed(1)}\n\n`;
    
    report += '## Articles by Type\n\n';
    for (const [type, count] of Object.entries(this.stats.articlesByType)) {
      report += `- ${type}: ${count} articles\n`;
    }
    
    report += '\n## Top Keywords\n\n';
    report += '| Keyword | Appears in # Articles |\n';
    report += '|---------|----------------------|\n';
    for (const { keyword, count } of this.stats.topKeywords) {
      report += `| ${keyword} | ${count} |\n`;
    }
    
    report += '\n## Top Linking Opportunities\n\n';
    const topOpportunities = this.linkSuggestions
      .flatMap(item => item.suggestions.map(s => ({
        source: item.sourceTitle,
        target: s.targetTitle,
        score: s.score,
        reason: s.reason
      })))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    
    report += '| Source Article | Target Article | Score | Reason |\n';
    report += '|----------------|----------------|-------|--------|\n';
    for (const opp of topOpportunities) {
      report += `| ${opp.source} | ${opp.target} | ${opp.score} | ${opp.reason} |\n`;
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Created summary-report.md`);
  }

  generateImplementationGuide(outputDir) {
    const guidePath = path.join(outputDir, 'implementation-guide.md');
    let guide = '# Internal Link Implementation Guide\n\n';
    
    guide += '## Overview\n\n';
    guide += 'This guide helps you implement the suggested internal links in your content.\n\n';
    
    guide += '## Implementation Options\n\n';
    guide += '### Option 1: Manual Implementation\n\n';
    guide += '1. Review `link-suggestions.json` for linking opportunities\n';
    guide += '2. For each suggestion, locate the matching text in the source article\n';
    guide += '3. Add markdown links: `[matched text](/type/path-to-target)`\n\n';
    
    guide += '### Option 2: Semi-Automated Implementation\n\n';
    guide += 'Use the provided script to generate link updates:\n\n';
    guide += '```bash\nnpm run implement-links -- --preview  # Preview changes\n';
    guide += 'npm run implement-links -- --apply    # Apply changes\n```\n\n';
    
    guide += '## Best Practices\n\n';
    guide += '1. **Link naturally** - Only link where it makes sense in context\n';
    guide += '2. **Avoid over-linking** - 2-3 links per article section is usually enough\n';
    guide += '3. **Use descriptive anchor text** - Link meaningful phrases, not just single words\n';
    guide += '4. **Prioritize first mentions** - Link the first occurrence of a term\n';
    guide += '5. **Cross-type linking** - Link between history and terms articles for best discovery\n';
    guide += '6. **Context matters** - Ensure links are contextually relevant\n\n';
    
    guide += '## Example Implementations\n\n';
    
    // Find some good examples
    const examples = this.linkSuggestions.slice(0, 3);
    for (const example of examples) {
      if (example.suggestions.length > 0) {
        const suggestion = example.suggestions[0];
        const context = suggestion.matches[0].contexts[0];
        
        guide += `### ${example.sourceTitle}\n\n`;
        guide += `**Original text:**\n\`\`\`\n${context.before} ${context.keyword} ${context.after}\n\`\`\`\n\n`;
        guide += `**With link:**\n\`\`\`\n${context.before} [${context.keyword}](/${suggestion.targetType}/${suggestion.targetId.split('/')[1]}) ${context.after}\n\`\`\`\n\n`;
      }
    }
    
    fs.writeFileSync(guidePath, guide);
    console.log(`📄 Created implementation-guide.md`);
  }
}

// Run the analyzer
const analyzer = new InternalLinkAnalyzer();
analyzer.analyze().catch(console.error);