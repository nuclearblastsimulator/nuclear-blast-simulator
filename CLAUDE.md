# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Nuclear Blast Simulator - an educational web application that visualizes the effects of nuclear weapons. It's built as a static site using Astro v5.11 with interactive features powered by vanilla JavaScript and Leaflet.js maps. The project includes comprehensive educational content with extensive history articles and nuclear terminology articles, all enhanced with detailed summaries and full-length content.

## Commands

### Development
- `npm run dev` - Start Astro development server on port 4321
- `npm run dev:prod` - Start development server in production mode
- `npm run start` - Alias for `npm run dev`
- `npm run build` - Build production site to `dist/` directory
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands

### Content Management
- `npm run reorganize-content` - Reorganize content structure (maintenance)

### Testing & Quality
- `npm run test:links` - Test all links for deployment readiness
- Link validation runs automatically during build process

### Legacy Support
- `npm run build:legacy` - Build using legacy build system
- `npm run serve:legacy` - Legacy development server
- `npm run serve:simple` - Simple HTTP server for testing

### Deployment
- `npm run deploy` - Deploy to Netlify (requires configuration)
- `npm run clean` - Clean dist directory before build

### Version Management
- `npm run version:patch` - Bump patch version (e.g., 2.1.0 → 2.1.1)
- `npm run version:minor` - Bump minor version (e.g., 2.1.0 → 2.2.0)
- `npm run version:major` - Bump major version (e.g., 2.1.0 → 3.0.0)

## Architecture

The project uses Astro's static site generation with a clear separation between content and presentation:

### Core Structure
- **Astro Pages** (`/src/pages/`): Route-based pages that generate static HTML
  - `index.astro` - Homepage with hero section, features, and screenshots
  - `simulator/index.astro` - Interactive blast simulator
  - `terms/[...slug].astro` - Dynamic routes for nuclear terminology articles
  - `history/[...slug].astro` - Dynamic routes for history articles
  - `timeline.astro` - Nuclear history timeline
  - `feedback.astro` - User feedback form
  - `404.astro` - Custom 404 error page

- **Content Collections** (`/src/content/`): Educational markdown content managed by Astro
  - `/terms/` - Nuclear terminology articles with comprehensive definitions
  - `/history/` - Historical articles organized in subcategories:
    - `/cold-war-crises/` - Major nuclear crises and close calls
    - `/foundational-events/` - Key events in nuclear history
    - `/key-figures/` - Important figures in nuclear development
    - `/modern-developments/` - Contemporary nuclear issues
    - `/nuclear-programs/` - National nuclear programs
    - `/testing-disasters/` - Nuclear testing and disasters
    - `/weapons-technology/` - Nuclear weapons technology

- **Components** (`/src/components/`): Reusable Astro components
  - `AtomicLogo.astro` - Site logo component
  - `GoogleAnalytics.astro` - Analytics integration

- **Layouts** (`/src/layouts/`): Page layout templates
  - `BaseLayout.astro` - Base layout with navigation, SEO, and analytics

- **Static Assets** (`/public/`): Served as-is without processing
  - `/assets/js/app.js` - Main simulator logic with Leaflet.js integration
  - `/assets/data/nuclear-weapons.json` - Database of nuclear weapons
  - `/assets/css/` - Compiled stylesheets
  - `/assets/images/` - Images and screenshots
  - `/manifest.json` - Progressive Web App manifest

### Key Technical Decisions
1. **Static Generation**: All pages are pre-built at compile time for optimal performance
2. **No Frontend Framework**: Vanilla JavaScript for interactivity to minimize bundle size
3. **Content Collections**: Astro's content system for managing educational articles
4. **Dual-Content Structure**: Each article has both summary and full content separated by `<!-- SUMMARY_END -->` marker
5. **Dark Theme**: Optimized for readability with nuclear subject matter
6. **Mobile-First Design**: Responsive design that works across all devices
7. **SEO Optimized**: Comprehensive meta tags, sitemap, and structured data
8. **Progressive Web App**: Manifest for app-like experience

### Simulator Architecture
The blast simulator (`/public/assets/js/app.js`) implements:
- Weapon selection with yield data
- Air burst vs surface burst calculations
- Five damage zones with scientific scaling laws
- Interactive Leaflet map with custom circle overlays
- Click handlers for zone-specific information

### Build Process
1. **Astro Build**: Process all `.astro` files and content collections
2. **Tailwind CSS**: Process styles through Vite integration
3. **Static Assets**: Copy assets directly to `dist/`
4. **Post-build**: Test all links for deployment readiness (`npm run test:links`)
5. **Result**: Fully static site requiring no server runtime, optimized for CDN deployment

### Backend Architecture
The project uses **Netlify Edge Functions** (Deno runtime) with **Turso database** (SQLite-based distributed database):

#### Edge Functions (`/netlify/edge-functions/`)
- **`detonate-optimized.ts`**: Records nuclear detonations with 99% reduced database load
  - Batch transactions for atomic operations
  - Incremental counter updates instead of recalculations
  - ~50 row reads per request (down from ~5,000)
- **`counter.ts`**: Returns aggregated statistics from pre-computed `running_totals` table
  - Single row lookup instead of full table scans
  - Cached aggregations updated hourly
- **`analytics.ts`**: Provides detailed analytics data for stats page
  - Multiple query types: live, cities, weapons, timeline, heatmap
  - Optimized queries with proper indexes
- **`update-stats.ts`**: Background job to refresh aggregated statistics
  - Updates `running_totals` table
  - Runs hourly via GitHub Actions cron job
  - Protected by optional API key

#### Database Optimization
- **`running_totals` table**: Single-row table with pre-aggregated statistics
- **Composite indexes**: On frequently queried columns (timestamp, city_name, weapon_name)
- **Batch operations**: Multiple database operations in single transaction
- **Background aggregation**: Heavy calculations moved to scheduled jobs

#### Performance Metrics
- **Before optimization**: ~5,000 row reads per detonation
- **After optimization**: ~50 row reads per detonation
- **Capacity improvement**: Can handle 100x more concurrent users
- **Response time**: 20-50ms (down from 200-500ms)

#### Monitoring & Debugging
- **Structured logging**: All edge functions include `[function-name]` prefixed logs
- **Performance tracking**: Query times and total response times logged
- **Success/error indicators**: Visual indicators (✅/❌/⚠️) in logs
- **Netlify logs**: Available in Netlify dashboard for troubleshooting

## Edge Function Configuration

### Environment Variables (set in Netlify dashboard)
- `TURSO_DATABASE_URL`: Turso database connection URL
- `TURSO_AUTH_TOKEN`: Authentication token for Turso
- `STATS_API_KEY`: (Optional) API key for protecting stats update endpoint
- `URL`: (Automatically set by Netlify) Site URL for internal API calls

### GitHub Actions Secrets (for cron jobs)
- `STATS_UPDATE_URL`: Full URL to update-stats endpoint (e.g., `https://www.nuclearblastsimulator.com/api/update-stats`)
- `STATS_API_KEY`: Same as Netlify environment variable for authentication

### Cron Job Setup
- **GitHub Actions**: Configured in `.github/workflows/update-stats.yml`
- **Schedule**: Runs hourly at the top of each hour (`0 * * * *`)
- **Purpose**: Updates aggregated statistics in `running_totals` table
- **Monitoring**: Check GitHub Actions tab for execution history

## Important Considerations

1. **Educational Purpose**: All features should promote understanding of nuclear weapons effects for educational purposes only
2. **Scientific Accuracy**: Blast calculations use established scaling laws (R ∝ Y^0.33 for blast, etc.)
3. **No External APIs**: All data is bundled locally for privacy and reliability
4. **Responsive Design**: Must work on mobile devices for accessibility
5. **Performance**: Keep JavaScript minimal as users may be on slower connections
6. **Content Quality**: All articles include comprehensive summaries and detailed full content
7. **Link Integrity**: Automated link checking ensures all references work correctly
8. **SEO & Accessibility**: Proper semantic HTML, alt text, and meta descriptions throughout
9. **Avoid Specific Counts**: Don't mention specific numbers of articles, weapons, or other content items as these change over time. Use general terms like "extensive", "comprehensive", or "numerous" instead
10. **UI Component Styling**: When creating UI sections or cards, use the standard card setup: `<div class="card bg-base-100 border border-base-300 overflow-hidden h-full flex flex-col"><div class="card-body">...</div></div>`. This ensures consistent styling across the site
11. **Database Performance**: Always use the optimized edge functions (`detonate-optimized`, not `detonate`) to stay within Turso free tier limits
12. **Git Commits**: When committing optimization work, be selective with files - avoid adding docs, prompts, or schema files unless specifically needed
13. **Production URL**: The production site is at `https://www.nuclearblastsimulator.com` (note the www subdomain)

## Content Creation Guidelines

When creating or editing educational content, follow these style guides:

### History Articles
Follow the comprehensive style guide at `/guides/HISTORY_ARTICLE_STYLE_GUIDE.md` which covers:
- Article structure and frontmatter requirements
- Writing style (professional, objective, engaging)
- Content organization patterns
- Cross-referencing and linking standards
- Emphasis on human stories and specific details
- Proper source attribution

### Terms Articles
Follow the detailed style guide at `/guides/TERMS_ARTICLE_STYLE_GUIDE.md` which covers:
- Technical terminology standards
- Definition and explanation patterns
- Balance between technical accuracy and accessibility
- Mathematical formulas and specifications formatting
- Article length guidelines by complexity
- Cross-referencing within the terms collection

### Article Structure & SEO Hierarchy
- **Pillar Pages (Root Articles)**: Articles in the root folder of content collections (e.g., `/terms/fission`, `/history/cuban-missile-crisis`) are content clusters and high-value SEO articles
- **Supporting Articles**: Articles in subdirectories (e.g., `/terms/physics/half-life`, `/history/cold-war-crises/able-archer`) are supporting content that enhances the pillar pages
- **Content Hierarchy**: Pillar pages should be comprehensive and link to supporting articles, while supporting articles provide depth on specific topics and link back to relevant pillar pages
- **Internal Linking**: All articles must include 5-10 link entries in their frontmatter to identify INBOUND link opportunities
  - Pillar/root articles: 8-10 link entries
  - Supporting articles: 5-8 link entries
  - Each link identifies how OTHER articles should link TO this article
  - The targetURL must ALWAYS be the current article's own path
  - Links help create a robust internal linking network for SEO
  - Think: "What terms would other articles use when they want to link to THIS article?"

### General Content Principles
- **Dual-content structure**: Summary before `<!-- SUMMARY_END -->`, then full content
- **Educational focus**: Always prioritize learning and understanding
- **Authoritative sources**: Reference credible, recognized authorities
- **Neutral tone**: Maintain objectivity, especially on sensitive topics
- **Comprehensive coverage**: Provide both overview and detailed information
- **Clear progression**: From simple concepts to complex details

## Troubleshooting

### Common Issues
1. **Running totals not updating**:
   - Check if `running_totals` table exists and has a row with id=1
   - Verify edge function path configuration matches netlify.toml
   - Ensure GitHub Actions cron job is running hourly

2. **High database row reads**:
   - Ensure using `detonate-optimized` endpoint, not `detonate`
   - Check that `running_totals` table is being updated
   - Verify indexes exist on frequently queried columns

3. **Edge function 404 errors**:
   - Check that the `export const config = { path: "/api/[endpoint-name]" }` matches the intended URL
   - Verify netlify.toml has correct edge function configuration

### Database Commands
- View databases: `turso db list`
- Connect to production: `turso db shell nuclear-blast-simulator-prod "[SQL]"`
- Check running totals: `SELECT * FROM running_totals WHERE id = 1;`
- Sync totals manually: `UPDATE running_totals SET total_detonations = (SELECT COUNT(*) FROM detonations) WHERE id = 1;`