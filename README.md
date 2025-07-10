# Nuclear Blast Simulator

An educational web application that visualizes the devastating effects of nuclear weapons on any location worldwide. This interactive tool helps users understand the scale and impact of nuclear detonations through realistic blast radius calculations and damage zone visualizations.

![Nuclear Blast Simulator](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)

## 🎯 Purpose

This simulator serves as an educational resource to help people understand:
- The immense destructive power of nuclear weapons
- The differences between various nuclear weapon yields
- The impact of air burst vs. surface burst detonations
- The multiple damage zones created by nuclear explosions

**⚠️ Educational Purpose Only**: This tool is designed to promote awareness and education about nuclear weapons effects. All calculations are based on publicly available information and simplified models.

## 🚀 Features

### Interactive Blast Simulator
- **Weapon Selection**: 40+ weapons from TNT to Tsar Bomba
- **Detonation Options**: Air burst or surface burst
- **Real-time Visualization**: Interactive map with damage zones
- **Detailed Effects**: Click zones for casualty estimates and damage info

### Educational Content
- **Nuclear Terms Glossary**: Comprehensive articles covering:
  - Nuclear physics fundamentals
  - Reactor technology
  - Weapons systems
  - Treaties and policy
- **Historical Articles**: In-depth articles including:
  - Scientific discoveries
  - Crisis events and close calls
  - Environmental impacts
  - Key figures in nuclear history

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
- **Mapping**: Leaflet.js with OpenStreetMap
- **Content**: Markdown with frontmatter (40+ educational articles)
- **Styling**: Custom CSS with Inter and Rubik Mono One fonts
- **Icons**: Custom SVG graphics
- **Build System**: Astro + Node.js-based build scripts

## 📦 Installation

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/nuclear-blast-simulator/nuclear-blast-simulator.git
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
│   ├── pages/              # Astro pages
│   │   ├── index.astro     # Homepage
│   │   ├── terms/          # Glossary pages
│   │   ├── history/        # History articles
│   │   └── simulator/      # Blast simulator
│   ├── layouts/            # Page layouts
│   │   └── BaseLayout.astro
│   ├── content/            # Content collections config
│   │   └── config.ts
│   └── styles/             # Global styles
├── content/                # Educational content (preserved)
│   ├── terms/              # Nuclear terminology articles
│   └── history/            # Historical articles
├── public/                 # Static assets
│   ├── assets/             # Images, fonts, etc.
│   ├── simulator.html      # Original simulator
│   └── manifest.json       # PWA manifest
├── scripts/                # Legacy build scripts
├── astro.config.mjs        # Astro configuration
├── package.json            # Project configuration
└── README.md              # This file
```

## 📜 Available Scripts

### Astro Commands (Primary)
- `npm run dev` - Start Astro development server at http://localhost:3000
- `npm run build` - Build the Astro site for production
- `npm run preview` - Preview the production build locally
- `npm start` - Alias for `npm run dev`

### Legacy Commands
- `npm run build:legacy` - Run original build script
- `npm run serve:legacy` - Original development server
- `npm run clean` - Remove the `dist/` folder
- `npm run deploy` - Deploy to Netlify (requires configuration)

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
  - Headers: Rubik Mono One for distinctive branding
  - Body: Inter for optimal readability
- **Spacing**: Consistent 8px grid system for alignment

### User Experience
- **Progressive Disclosure**: Complex information revealed as needed
- **Mobile-First**: Responsive design that works on all devices
- **Accessibility**: High contrast ratios, keyboard navigation support
- **Performance**: Static site generation for instant loading
- **Educational Focus**: Clear labeling, helpful tooltips, contextual warnings

### Interactive Elements
- **Feedback**: Hover states, active states, and transitions
- **Consistency**: Unified button styles, form controls, and navigation
- **Hierarchy**: Clear visual distinction between primary and secondary actions
- **Error Prevention**: Validation and helpful error messages

### Component Patterns
- **Cards**: Used for article previews and information grouping
- **Collapsible Sidebars**: Organize complex navigation without overwhelming
- **Modal-free Design**: Information stays in context
- **Progressive Enhancement**: Core functionality works without JavaScript

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

- [Effects of Nuclear Weapons - Glasstone & Dolan](https://www.fourmilab.ch/etexts/www/effects/)
- [Nuclear Weapons FAQ](https://nuclearweaponarchive.org/)
- [International Campaign to Abolish Nuclear Weapons](https://www.icanw.org/)

## 👥 Credits

Made with ❤️ in Knoxville, TN

---

**Remember**: The goal of this simulator is to educate about the devastating effects of nuclear weapons and promote peace through understanding.