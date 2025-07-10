# Add External Educational Resources

## Resources to Add
- https://nuclearweaponsedproj.mit.edu/nuclear-weapons-blast-effects-calculator/
- https://nuclearweaponsedproj.mit.edu/
- https://nuclearsecrecy.com/nukemap/

## Implementation Plan

### 1. Footer Links Section
Add to the footer component (likely in a layout file) under a "Educational Resources" or "Related Tools" section:
- MIT Nuclear Weapons Education Project (main site)
- MIT Blast Effects Calculator
- NUKEMAP

### 2. Simulator Page Enhancement
On `/src/pages/simulator/index.astro`, add an "Additional Resources" section below the main simulator interface with:
- MIT Nuclear Weapons Education Project (main site) - comprehensive educational resource
- MIT Blast Effects Calculator (as alternative tool) - different calculation approach
- NUKEMAP (as comparison reference) - widely used reference tool

### 3. New Resources/Links Page
Create `/src/pages/resources.astro` with categorized external links:

#### Interactive Tools
- NUKEMAP - Interactive nuclear weapons effects simulator
- MIT Blast Effects Calculator - Academic blast effects tool

#### Educational Sites
- MIT Nuclear Weapons Education Project - Comprehensive educational resource

#### Academic Resources
- (space for future additions)

## Implementation Notes
- Ensure all external links open in new tabs (`target="_blank"`)
- Add appropriate `rel="noopener noreferrer"` for security
- Consider adding brief descriptions for each resource
- Maintain consistent styling with existing site design
- Add navigation link to resources page in main navigation if appropriate