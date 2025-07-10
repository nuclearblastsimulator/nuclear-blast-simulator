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

### Weapon Selection
- **Non-Nuclear Reference**: TNT, Tomahawk Missile, MOAB
- **Historical Weapons**: Little Boy (Hiroshima), Fat Man (Nagasaki)
- **Modern Arsenal**: W88 Warhead, B83 Strategic Bomb
- **Test Weapons**: Castle Bravo, Tsar Bomba

### Detonation Options
- **Air Burst**: Maximizes blast damage area (default)
- **Surface Burst**: Creates radioactive fallout and crater

### Interactive Visualization
- Real-time blast radius calculations on interactive map
- Multiple damage zones with distinct visual representation
- Click on any zone for detailed information
- Toggle individual zones on/off

### Damage Zones
1. **Fireball** (Red): Complete vaporization
2. **Heavy Blast** (Orange): 5 psi overpressure
3. **Moderate Damage** (Yellow-Orange): 1 psi overpressure
4. **Light Damage** (Yellow): 0.25 psi overpressure
5. **Thermal Radiation** (Light Yellow): 3rd degree burns

### Additional Features
- Search any global location or select from major cities
- Detailed effects panel with comprehensive blast data
- Mobile-responsive design
- Dark theme optimized for contrast

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Mapping**: Leaflet.js with OpenStreetMap
- **Styling**: Custom CSS with Inter and Rubik Mono One fonts
- **Icons**: Custom SVG graphics
- **Build System**: Node.js-based build scripts

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
npm run serve
```

4. Open your browser to `http://localhost:8080`

## 🏗️ Project Structure

```
nuclear-blast-simulator/
├── index.html              # Main HTML file
├── assets/
│   ├── css/
│   │   └── styles.css     # Main stylesheet
│   ├── js/
│   │   └── app.js         # Application logic
│   ├── logo/
│   │   └── logo.png       # Application logo
│   └── favicon/           # Favicon files
├── scripts/
│   ├── build.js           # Build script
│   └── watch.js           # Development server with hot reload
├── dist/                  # Production build output (generated)
├── manifest.json          # Web app manifest
├── package.json           # Project configuration
└── README.md             # This file
```

## 📜 Available Scripts

- `npm run build` - Build the project to `dist/` folder
- `npm run serve` - Start development server with hot reload
- `npm run serve:simple` - Build and serve with simple HTTP server
- `npm run clean` - Remove the `dist/` folder
- `npm run deploy` - Deploy to Netlify (requires configuration)

## 🚀 Deployment

The application is designed to be deployed as a static site. The build process creates a `dist/` folder with all necessary files.

### Netlify Deployment
1. Build the project: `npm run build`
2. Deploy: `npm run deploy`

### Manual Deployment
1. Run `npm run build`
2. Upload contents of `dist/` folder to your web server

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

## 🤝 Contributing

We welcome contributions that improve the educational value and accuracy of this simulator. Please ensure all contributions:

1. Maintain the educational focus
2. Use publicly available information only
3. Follow the existing code style
4. Include appropriate documentation

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