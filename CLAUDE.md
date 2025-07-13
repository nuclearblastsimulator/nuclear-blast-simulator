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
- `npm run update-links` - Update article cross-references and links
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
1. **Pre-build**: Update article links and cross-references (`npm run update-links`)
2. **Astro Build**: Process all `.astro` files and content collections
3. **Tailwind CSS**: Process styles through Vite integration
4. **Static Assets**: Copy assets directly to `dist/`
5. **Post-build**: Test all links for deployment readiness (`npm run test:links`)
6. **Result**: Fully static site requiring no server runtime, optimized for CDN deployment

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

### General Content Principles
- **Dual-content structure**: Summary before `<!-- SUMMARY_END -->`, then full content
- **Educational focus**: Always prioritize learning and understanding
- **Authoritative sources**: Reference credible, recognized authorities
- **Neutral tone**: Maintain objectivity, especially on sensitive topics
- **Comprehensive coverage**: Provide both overview and detailed information
- **Clear progression**: From simple concepts to complex details