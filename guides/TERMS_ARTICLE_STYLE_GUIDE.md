# Nuclear Terms Article Style Guide

This guide defines the standards for writing nuclear terminology articles in the Nuclear Blast Simulator project. Follow these guidelines to ensure consistency and quality across all terms content.

## Article Structure

### Frontmatter Requirements

```yaml
---
title: "Precise Technical Term"  # Required: The exact technical term
description: "One-sentence description capturing the essence of the term (15-25 words)"  # Required: Clear, concise definition
date: 2024-01-15  # Optional: Date the article was generated or written (YYYY-MM-DD format)
category: "category-name"  # Optional: e.g., 'core', 'effects', 'weapons', 'strategy'
keywords: ["keyword1", "keyword2", "keyword3"]  # Optional: For SEO and discoverability (5-10 keywords)
related: ["term1", "term2", "term3", "term4"]  # Optional: Related term slugs without path
links:  # Required for ALL articles
  - anchorText: "primary term"
    targetURL: "/terms/article-slug"
    contextQuote: "Example sentence showing how this anchor text would naturally appear in another article about this topic."
    valueProp: "Brief explanation of what value users get from clicking this link."
  # Include 8-10 link entries for pillar pages, covering:
  # - Primary technical term
  # - Common variations or abbreviations
  # - Effects or consequences
  # - Technical specifications
  # - Comparative phrases
---
```

**Frontmatter Field Details:**
- **title** (required): Must match the H1 heading exactly; use proper capitalization
- **description** (required): SEO-optimized technical definition that appears in search results
- **date** (optional): Date the article was generated or written; used for tracking content freshness
- **category** (optional): Helps organize terms by type; use existing categories when possible
- **keywords** (optional): Include technical terms, abbreviations, related concepts, applications
- **related** (optional): Creates network of related terms; use just the slug (not full path)
- **links** (required for ALL articles):
  - Every article must include 5-10 link entries
  - Pillar/root articles should have 8-10 entries
  - Supporting articles should have 5-8 entries
  - Each link entry helps identify natural anchor texts for internal linking
  - Include technical variations, common usage, effects, measurements

### Standard Section Template

1. **H1 Title** - Must match frontmatter title exactly
2. **Opening Paragraph** - Clear definition and immediate context (2-3 sentences)
3. **Detailed Sections** - Comprehensive coverage using H2/H3 headings
4. **Relevance to Nuclear Weapons** - Connect to broader context
5. **Sources** - Authoritative references

## Writing Style Guidelines

### Voice and Tone

- **Educational but accessible**: Technical accuracy without overwhelming jargon
- **Authoritative yet engaging**: Confident expertise with approachable explanations
- **Descriptive and vivid**: Use concrete examples and memorable descriptions
- **Neutral and factual**: Objective presentation without political bias

### Opening Patterns

Start with one of these approaches:
- Direct definition: "X is the Y that Z..."
- Quantitative hook: "At temperatures exceeding 100 million degrees..."
- Contextual opening: "In nuclear weapons design, X represents..."

Include in opening:
- Clear, concise definition
- Key quantitative metrics (ranges, sizes, speeds)
- Immediate significance or application
- Compelling hook when appropriate

## Technical Language Usage

### Technical Detail Balance

- **Define technical terms** on first use
- **Use parenthetical explanations** for complex concepts: "fissile material (material capable of sustaining a chain reaction)"
- **Include specific numbers** with units: "5,500 kilometers (3,400 miles)"
- **Provide formulas** in code blocks when relevant
- **Mix technical and lay terms** for clarity

### Common Technical Patterns

```markdown
- Full name with abbreviation: "Intercontinental Ballistic Missile (ICBM)"
- Dual units: "20 kilotons (20,000 tons of TNT equivalent)"
- Technical specifications: "Power output: 77 MWe per module"
- Ranges: "Blast radius: 1.5-3.0 kilometers"
```

## Content Organization

### Information Hierarchy by Article Type

#### Physics/Effects Articles
1. Definition and fundamental principles
2. Mathematical relationships or formulas
3. Physical mechanisms
4. Measurable effects or parameters
5. Real-world applications
6. Safety/protection considerations

#### Technology/Systems Articles
1. Technical definition and purpose
2. Key specifications or capabilities
3. System components and operation
4. Types or variants
5. Current implementations
6. Development status or future prospects

#### Strategy/Policy Articles
1. Conceptual definition
2. Historical development
3. Key principles or doctrines
4. International perspectives
5. Current relevance
6. Implications or debates

### List Formatting Standards

- **Bullet points** for related items without hierarchy
- **Numbered lists** for sequential processes
- **Nested bullets** with proper indentation for subcategories
- **Bold lead-ins** for emphasized list items:
  ```markdown
  - **Zone 1**: Complete destruction (0-1 km)
  - **Zone 2**: Heavy damage (1-3 km)
  ```

## Length Guidelines

### Article Length by Complexity

- **Simple Terms** (60-80 lines): Basic concepts, single definitions
- **Standard Terms** (100-150 lines): Most technical terms
- **Complex Topics** (150-250 lines): Multi-faceted concepts, systems

### Content Distribution

- **Summary section**: 15-20% of total content
- **Core technical content**: 60-70%
- **Context and relevance**: 10-15%
- **Sources and references**: 5-10%

## Cross-Referencing

### Internal Linking Rules

- Link on first meaningful mention
- Use descriptive link text: `[nuclear chain reaction](/terms/nuclear-physics/fission)`
- Avoid over-linking the same term
- Prefer linking to terms over history articles within terms content

### Common Link Patterns

```markdown
- Physics concepts: [critical mass](/terms/nuclear-physics/critical-mass)
- Weapons technology: [nuclear weapons design](/history/weapons-technology/nuclear-weapons-design)
- Effects: [blast effects](/terms/nuclear-effects/blast-effects)
- Systems: [nuclear triad](/terms/weapons-delivery/nuclear-triad)
```

## Special Elements

### Mathematical Formulas

Present in code blocks:
```
Blast radius formula:
R = C × Y^(1/3)

Where:
- R = radius in meters
- C = constant for effect type
- Y = yield in kilotons
```

### Technical Specifications

Format consistently:
```markdown
**Specifications:**
- Range: 10,000+ kilometers
- Speed: Mach 20+ during reentry
- Accuracy: CEP of 90-120 meters
- Payload: Up to 10 MIRVs
```

### Measurement Standards

- Always provide dual units (metric and imperial)
- Use consistent precision (typically 2 significant figures)
- Include uncertainty when relevant: "±10%"

## Sources Section

### Required Format

```markdown
---

## Sources

**Authoritative Sources:**

- [International Atomic Energy Agency](https://www.iaea.org/) - Nuclear safety and security standards
- [Federation of American Scientists](https://fas.org/) - Nuclear weapons analysis and policy
- [U.S. Department of Energy](https://www.energy.gov/) - Nuclear technology and research
- [Nuclear Threat Initiative](https://www.nti.org/) - Nuclear security resources
```

### Source Selection Criteria

- Government agencies and national laboratories
- International organizations (IAEA, UN)
- Recognized academic institutions
- Established defense/security think tanks
- Peer-reviewed scientific publications

## Quality Checklist

Before submitting a terms article, verify:

- [ ] **Title and description** are precise and informative
- [ ] **Opening paragraph** provides clear definition
- [ ] **Summary section** captures essential information
- [ ] **Technical accuracy** is maintained throughout
- [ ] **Appropriate depth** for topic complexity
- [ ] **Cross-references** enhance understanding
- [ ] **Sources** are authoritative and current
- [ ] **Formatting** follows all guidelines
- [ ] **Language** balances technical precision with accessibility
- [ ] **Nuclear weapons relevance** is clearly established

## Common Pitfalls to Avoid

1. **Over-simplification** of complex physics
2. **Excessive jargon** without explanation
3. **Missing context** for technical specifications
4. **Inconsistent units** or measurements
5. **Inadequate safety** or risk information
6. **Political bias** in technical descriptions
7. **Outdated information** without noting historical context
8. **Poor organization** of multi-faceted topics
9. **Insufficient sources** for controversial topics
10. **Forgetting dual-use** technology implications

## Examples of Excellence

Study these articles as models:
- `/terms/nuclear-physics/critical-mass` - Clear physics explanation
- `/terms/nuclear-effects/blast-effects` - Vivid effects description
- `/terms/weapons-delivery/icbm` - Comprehensive technology overview
- `/terms/reactor-technology/small-modular-reactors` - Balanced technical assessment

This style guide ensures consistency while allowing flexibility for different types of nuclear terminology content. When in doubt, prioritize clarity and educational value.