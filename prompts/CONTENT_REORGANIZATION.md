# Content Reorganization Plan

## Overview
Reorganizing content from 9 terms categories and 12 history categories into exactly 7 categories each for better navigation and user experience.

## Terms Section (7 Categories)

### 1. Nuclear Physics (10 articles)
Core physics concepts that underpin nuclear technology
- alpha-decay
- binding-energy
- critical-mass
- enrichment (moved from nuclear-technology)
- fission
- fusion
- half-life
- neutron-cross-section
- nuclear-fallout (moved from nuclear-effects)
- plutonium

### 2. Nuclear Effects (7 articles)
Effects and measurements of nuclear weapons
- electromagnetic-pulse
- emp-weapons
- ground-zero
- megaton
- nuclear-winter
- yield
- yield-comparison

### 3. Reactor Technology (9 articles)
All reactor-related technology and components
- boiling-water-reactor
- control-rods (from reactor-components)
- coolant (from reactor-components)
- generation-iv
- moderator (from reactor-components)
- pressurized-water-reactor
- small-modular-reactors
- thorium-cycle
- tokamak

### 4. Safety Systems (4 articles)
Safety systems and principles
- alara-principle
- containment
- defense-in-depth
- scram

### 5. Weapons Delivery (4 articles)
Weapons delivery systems and strategies
- first-strike
- icbm
- nuclear-triad
- tactical-nuclear-weapons

### 6. Nuclear Strategy (2 articles)
Strategic concepts and doctrines
- mutual-assured-destruction
- nuclear-deterrence

### 7. Treaties & Agreements (2 articles)
International agreements and treaties
- non-proliferation-treaty
- start-treaty

## History Section (7 Categories)

### 1. Foundational Events (8 articles)
Scientific discoveries and early nuclear development
- atoms-for-peace
- chicago-met-lab (from nuclear-facilities)
- chicago-pile-1
- discovery-of-radioactivity
- los-alamos (from nuclear-facilities)
- neutron-discovery
- nuclear-fission-discovery
- oak-ridge (from nuclear-facilities)

### 2. Key Figures (5 articles)
Important personalities in nuclear history
- andrei-sakharov
- edward-teller
- hyman-rickover
- klaus-fuchs
- oppenheimer

### 3. Cold War Crises (9 articles)
Major crises and incidents during the Cold War
- able-archer-83
- broken-arrows (new article)
- cuban-missile-crisis
- kargil-conflict
- moscow-nuclear-program (from nuclear-command)
- norwegian-rocket-incident
- nuclear-close-calls (new article)
- stanislav-petrov-incident
- washington-dc (from nuclear-command)

### 4. Weapons Technology (13 articles)
Technical aspects of nuclear weapons development
- b83
- fission-weapons
- fusion-weapons
- gbu-57-mop
- miniaturization (new article)
- moab
- nuclear-materials
- nuclear-testing
- nuclear-weapon-effects
- nuclear-weapons-design
- w87
- w88
- weapons-manufacturing

### 5. Nuclear Programs (15 articles)
National nuclear programs and delivery systems
- china
- france
- india
- intercontinental-ballistic-missiles (from delivery-systems)
- iran-nuclear-program (from modern-developments)
- israel
- missile-defense-systems (from delivery-systems)
- nautilus-submarine (from delivery-systems)
- nuclear-proliferation-21st-century (from modern-developments)
- nuclear-submarines (from delivery-systems)
- nuclear-triad (from delivery-systems)
- nuclear-weapons-by-country (from overview)
- pakistan
- strategic-bombers (from delivery-systems)
- united-kingdom

### 6. Testing & Disasters (12 articles)
Nuclear testing sites and disasters
- bikini-atoll
- castle-bravo (from medical-environmental)
- chernobyl-disaster (from medical-environmental)
- fukushima-daiichi (from medical-environmental)
- hibakusha (from medical-environmental)
- lop-nur
- nevada-test-site
- novaya-zemlya
- nuclear-testing-health-effects (from medical-environmental)
- overview (testing sites overview)
- semipalatinsk-test-site
- three-mile-island (from medical-environmental)

### 7. Modern Developments (14 articles)
Modern nuclear technology, treaties, and ethical considerations
- comprehensive-test-ban-treaty (from treaties-diplomacy)
- intermediate-range-nuclear-forces-treaty (from treaties-diplomacy)
- non-proliferation-treaty (from treaties-diplomacy)
- nuclear-abolition (from philosophical-ethical)
- nuclear-deterrence-theory (from philosophical-ethical)
- nuclear-ethics (from philosophical-ethical)
- nuclear-fusion
- nuclear-modernization-programs
- nuclear-terrorism
- nuclear-weapons-free-zones (from treaties-diplomacy)
- obninsk-reactor
- shippingport
- small-modular-reactors
- start-treaties (from treaties-diplomacy)

## Benefits of This Organization

1. **User-Friendly Navigation**: 7 categories are easier to scan than 9-12
2. **Logical Grouping**: Related articles are now together (e.g., all reactor content in one place)
3. **Balanced Distribution**: More even distribution of articles across categories
4. **Clear Hierarchy**: Each category has a clear theme and purpose
5. **Future-Proof**: Room to add new articles within existing categories

## How to Execute

Run the reorganization script:
```bash
npm run reorganize-content
```

Then update the article links:
```bash
npm run update-links
```

This will:
1. Move all files to their new category folders
2. Clean up empty directories
3. Update all internal links to match the new structure