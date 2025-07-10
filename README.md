# Nuclear Blast Simulator

An educational web application that visualizes the devastating effects of nuclear weapons on any location worldwide. This interactive tool helps users understand the scale and impact of nuclear detonations through realistic blast radius calculations, damage zone visualizations, and comprehensive educational content covering nuclear history, technology, and policy.

![Nuclear Blast Simulator](https://img.shields.io/github/package-json/v/nuclearblastsimulator/nuclear-blast-simulator)
![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![Astro](https://img.shields.io/badge/astro-v5.11-orange.svg)
![Articles](https://img.shields.io/badge/articles-extensive-green.svg)

## 🎯 Purpose

This simulator serves as an educational resource to help people understand:
- The immense destructive power of nuclear weapons
- The differences between various nuclear weapon yields
- The impact of air burst vs. surface burst detonations
- The multiple damage zones created by nuclear explosions

**⚠️ Educational Purpose Only**: This tool is designed to promote awareness and education about nuclear weapons effects. All calculations are based on publicly available information and simplified models.

## 🚀 Features

### Interactive Blast Simulator
- **Weapon Selection**: Dozens of weapons from TNT to Tsar Bomba
- **Detonation Options**: Air burst or surface burst
- **Real-time Visualization**: Interactive map with damage zones
- **Detailed Effects**: Click zones for casualty estimates and damage info

### Educational Content
- **Nuclear Terms Glossary**: Comprehensive articles covering:
  - Nuclear physics fundamentals
  - Reactor technology and power generation
  - Weapons systems and delivery methods
  - Treaties, policy, and international relations
- **Historical Articles**: Dozens of in-depth articles across multiple categories:
  - **Cold War Crises**: Major nuclear incidents and close calls
  - **Foundational Events**: Key moments in nuclear history
  - **Key Figures**: Important scientists, leaders, and policymakers
  - **Modern Developments**: Contemporary nuclear issues and policies
  - **Nuclear Programs**: National nuclear weapons programs
  - **Testing & Disasters**: Nuclear testing and major accidents
  - **Weapons Technology**: Nuclear weapons design and engineering
- **Dual-Content Structure**: Each article includes both summary and comprehensive full content

### Technical Features
- **Damage Zones**:
  1. Fireball (Red): Complete vaporization
  2. Heavy Blast (Orange): 5 psi overpressure
  3. Moderate Damage (Yellow-Orange): 1 psi overpressure
  4. Light Damage (Yellow): 0.25 psi overpressure
  5. Thermal Radiation (Light Yellow): 3rd degree burns
- **Mobile-responsive design**
- **Dark theme optimized for readability**
- **Fast static site generation with Astro**

## 🛠️ Technology Stack

- **Framework**: Astro v5.11 (Static Site Generator)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Tailwind CSS v4.1.11 with Typography plugin
- **Content**: Astro Content Collections with extensive Markdown articles
- **Mapping**: Leaflet.js with OpenStreetMap tiles
- **Fonts**: Inter (body text) and Rubik Mono One (headings)
- **Icons**: Custom SVG graphics and atomic-themed design
- **Build System**: Astro + Vite with automated link checking
- **Analytics**: Google Analytics integration
- **SEO**: Comprehensive meta tags, sitemap, and structured data

## 📦 Installation

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/nuclearblastsimulator/nuclear-blast-simulator.git
cd nuclear-blast-simulator
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## 🏗️ Project Structure

```
nuclear-blast-simulator/
├── src/
│   ├── pages/              # Astro pages (route-based)
│   │   ├── index.astro     # Homepage with hero, features, screenshots
│   │   ├── simulator/      # Interactive blast simulator
│   │   │   └── index.astro
│   │   ├── terms/          # Nuclear terminology articles
│   │   │   ├── index.astro # Terms listing page
│   │   │   └── [...slug].astro # Dynamic term pages
│   │   ├── history/        # Historical content articles
│   │   │   ├── index.astro # History listing page
│   │   │   └── [...slug].astro # Dynamic history pages
│   │   ├── timeline.astro  # Nuclear history timeline
│   │   ├── feedback.astro  # User feedback form
│   │   └── 404.astro      # Custom 404 page
│   ├── components/         # Reusable components
│   │   ├── AtomicLogo.astro
│   │   └── GoogleAnalytics.astro
│   ├── layouts/            # Page layouts
│   │   └── BaseLayout.astro # Base layout with navigation
│   ├── content/            # Content collections
│   │   ├── config.ts       # Content schema definitions
│   │   ├── terms/          # Nuclear terminology articles
│   │   └── history/        # Historical articles in multiple categories
│   │       ├── cold-war-crises/
│   │       ├── foundational-events/
│   │       ├── key-figures/
│   │       ├── modern-developments/
│   │       ├── nuclear-programs/
│   │       ├── testing-disasters/
│   │       └── weapons-technology/
│   └── data/              # Data files
│       └── article-links.js # Article cross-references
├── public/                 # Static assets
│   ├── assets/            # Images, CSS, JS, data files
│   │   ├── css/           # Compiled stylesheets
│   │   ├── js/            # Simulator JavaScript
│   │   ├── data/          # Nuclear weapons database
│   │   └── images/        # Screenshots and graphics
│   ├── manifest.json      # Progressive Web App manifest
│   └── robots.txt         # Search engine directives
├── scripts/               # Build and maintenance scripts
│   ├── build.js           # Legacy build script
│   ├── update-article-links.js # Update cross-references
│   └── test-links-deploy.js # Link validation
├── prompts/               # Development prompts and guides
├── astro.config.mjs       # Astro configuration
├── tailwind.config.cjs    # Tailwind CSS configuration
├── package.json           # Project dependencies and scripts
└── README.md             # This file
```

## 📜 Available Scripts

### Primary Development Commands
- `npm run dev` - Start Astro development server at http://localhost:4321
- `npm run dev:prod` - Start development server in production mode
- `npm start` - Alias for `npm run dev`
- `npm run build` - Build the Astro site for production
- `npm run preview` - Preview the production build locally
- `npm run astro` - Run Astro CLI commands directly

### Content Management
- `npm run update-links` - Update article cross-references and navigation
- `npm run reorganize-content` - Reorganize content structure (maintenance)

### Testing & Quality Assurance
- `npm run test:links` - Validate all internal and external links
- Link validation runs automatically during build process

### Legacy Support
- `npm run build:legacy` - Build using original build system
- `npm run serve:legacy` - Legacy development server
- `npm run serve:simple` - Simple HTTP server for testing

### Deployment
- `npm run deploy` - Deploy to Netlify (requires configuration)
- `npm run clean` - Clean the `dist/` folder before build

## 🚀 Deployment

The application is built with Astro and generates a static site that can be deployed anywhere.

### Netlify Deployment
1. Build the project: `npm run build`
2. Deploy: `npm run deploy`
3. Set build command to `npm run build` and publish directory to `dist`

### Vercel Deployment
1. Import your Git repository
2. Framework preset: Astro
3. Build command: `npm run build`
4. Output directory: `dist`

### Manual Deployment
1. Run `npm run build`
2. Upload contents of `dist/` folder to your web server

### Environment Requirements
- Node.js 14+ for building
- Static file hosting (no server-side runtime required)

## 📊 Technical Details

### Blast Calculation Formulas

The simulator uses scientifically-based scaling laws for nuclear weapons effects:

- **Fireball Radius**: R ∝ Y^0.4
- **Blast Damage**: R ∝ Y^0.33 (cube root law)
- **Thermal Radiation**: R ∝ Y^0.41

Where R is radius and Y is yield in kilotons.

### Surface Burst Adjustments
- Blast radii reduced by 15-20%
- Thermal effects reduced by 30%
- Additional fallout considerations

## 🎨 UI/UX Design Principles

### Visual Design
- **Dark Theme**: Optimized for extended viewing with reduced eye strain
- **Color System**: 
  - Primary (Blue): Interactive elements and CTAs
  - Secondary (Orange): Highlighting and accents
  - Warning (Yellow): Blast zones and cautions
  - Base colors: Neutral grays for content hierarchy
- **Typography**: 
  - Headers: Rubik Mono One for distinctive atomic-age branding
  - Body: Inter for optimal readability across devices
- **Spacing**: Consistent design system with Tailwind CSS utilities
- **Atomic Theme**: Visual elements inspired by atomic and nuclear imagery

### User Experience
- **Progressive Disclosure**: Complex information revealed as needed
- **Mobile-First**: Responsive design optimized for all screen sizes
- **Accessibility**: High contrast ratios, keyboard navigation, semantic HTML
- **Performance**: Static site generation for instant loading worldwide
- **Educational Focus**: Clear labeling, helpful tooltips, contextual warnings
- **Dual-Content Structure**: Summary and full article content for different reading preferences

### Interactive Elements
- **Feedback**: Smooth hover states, active states, and micro-interactions
- **Consistency**: Unified button styles, form controls, and navigation patterns
- **Hierarchy**: Clear visual distinction between primary and secondary actions
- **Error Prevention**: Form validation and helpful error messages
- **Touch-Friendly**: Optimized for mobile touch interactions

### Component Patterns
- **Cards**: Used for article previews and information grouping
- **Responsive Navigation**: Collapsible navigation that works on all devices
- **Modal-free Design**: Information stays in context for better user flow
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Content Cards**: Unified design for terms and history articles
- **Timeline Layout**: Visual timeline for nuclear history events

## 🤝 Contributing

We welcome contributions that improve the educational value and accuracy of this simulator. Please ensure all contributions:

1. Maintain the educational focus
2. Use publicly available information only
3. Follow the existing code style
4. Include appropriate documentation
5. Adhere to the UI/UX principles outlined above

## 📝 License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).

This means you are free to:
- **Share** — copy and redistribute the material
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — Give appropriate credit
- **NonCommercial** — Not for commercial purposes
- **ShareAlike** — Distribute contributions under the same license

## ⚖️ Disclaimer

This simulator is for **educational purposes only**. The calculations are based on publicly available information and simplified models. Actual nuclear weapons effects vary significantly based on numerous factors including altitude, weather conditions, terrain, and construction types.

This tool is designed to promote understanding of nuclear weapons effects and support education about their devastating humanitarian consequences.

## 🔗 Resources

### Technical References
- [Effects of Nuclear Weapons - Glasstone & Dolan](https://www.fourmilab.ch/etexts/www/effects/)
- [Nuclear Weapons FAQ](https://nuclearweaponarchive.org/)
- [Federation of American Scientists](https://www.fas.org/)
- [Nuclear Threat Initiative](https://www.nti.org/)

### Educational Organizations
- [International Campaign to Abolish Nuclear Weapons](https://www.icanw.org/)
- [Ploughshares Fund](https://www.ploughshares.org/)
- [Arms Control Association](https://www.armscontrol.org/)
- [Bulletin of the Atomic Scientists](https://thebulletin.org/)

### Development Resources
- [Astro Documentation](https://docs.astro.build/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Leaflet.js](https://leafletjs.com/)

## 👥 Credits

Made with ❤️ in Knoxville, TN

### Content Sources
All educational articles include authoritative sources and references from:
- Government agencies and national laboratories
- Academic institutions and research organizations
- International organizations and treaties
- Historical archives and primary documents

### Technical Acknowledgments
- Nuclear effects calculations based on publicly available scientific literature
- Map data courtesy of OpenStreetMap contributors
- Icons and graphics designed for educational clarity

---

**Remember**: The goal of this simulator is to educate about the devastating effects of nuclear weapons and promote peace through understanding.