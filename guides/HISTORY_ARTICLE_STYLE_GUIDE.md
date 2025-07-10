# History Article Style Guide for Nuclear Blast Simulator

This document defines the writing style and structure for history articles in the Nuclear Blast Simulator project. Follow these guidelines when creating or editing historical content.

## Article Structure

### 1. Front Matter
```yaml
---
title: "Article Title"
description: "A compelling 1-2 sentence description that summarizes the historical event and its significance..."
---
```

### 2. Title Section
- Main heading using `#` 
- Followed by a thematic subtitle using `##` that captures the essence of the event

Example:
```markdown
# Able Archer 83

## When Exercise Became Reality
```

### 3. Opening Paragraph
- A narrative introduction that sets the scene
- Should be engaging and accessible
- Explains the significance in 2-3 sentences
- Written in past tense

### 4. Content Organization

#### Summary Section (Before `<!-- SUMMARY_END -->`)
The summary section uses a **hierarchical outline format** with bullet points:

- **Main sections**: Use `##` headings
- **Subsections**: Use `###` headings
- **Bullet points**: Each point follows the pattern:
  - **Bold key phrase**: Brief explanatory text
  - Keep explanations concise (5-10 words typically)
  - Use colons to separate key phrase from explanation

Example:
```markdown
### Cold War Tensions (1983)
- **Reagan administration**: Aggressive anti-Soviet rhetoric and military buildup
- **Soviet paranoia**: Deep Soviet fears of U.S. first strike
```

#### Full Article Section (After `<!-- SUMMARY_END -->`)
The full article expands the outline into comprehensive prose:

- **Narrative style**: Tell the story with context and detail
- **Paragraph structure**: Each major point becomes a full paragraph
- **Academic tone**: Authoritative but accessible
- **Evidence-based**: Include specific dates, names, and verifiable facts
- **Multiple perspectives**: Present different viewpoints where relevant

### 5. Standard Sections Pattern

Most articles follow this section progression:

1. **Background** - Historical context leading to the event
2. **The [Main Event]** - Detailed description of what happened
3. **Key Figures/Personalities** - Important people involved
4. **Impact/Consequences** - Short and long-term effects
5. **Historical Significance** - Why this matters in nuclear history
6. **Connection to Nuclear Weapons** - Explicit link to nuclear topics
7. **Sources** - Credible references

### 6. Writing Style Guidelines

#### Tone and Voice
- **Objective**: Present facts without bias
- **Educational**: Explain complex concepts clearly
- **Serious**: Appropriate gravity for nuclear topics
- **Accessible**: Avoid jargon without explanation

#### Language Patterns
- **Active voice** preferred
- **Past tense** for historical events
- **Present tense** for ongoing implications
- **Specific dates** rather than vague timeframes
- **Full names on first mention**, then last names

#### Formatting Conventions
- **Bold** for key terms in bullet points
- **Italics** sparingly for emphasis
- **Numbers**: Spell out one through nine, use digits for 10+
- **Dates**: "November 8, 1983" format
- **Acronyms**: Define on first use

### 7. Content Requirements

#### Factual Accuracy
- Only include verifiable historical facts
- No speculation or conspiracy theories
- Multiple sources preferred for controversial claims
- Acknowledge uncertainty where it exists

#### Nuclear Connection
Every article must explicitly connect to nuclear weapons through:
- Direct involvement of nuclear weapons
- Nuclear policy implications
- Crisis escalation dynamics
- Deterrence theory examples
- Arms control relevance

#### Sources Section
Always include authoritative sources:
```markdown
## Sources

**Authoritative Sources:**

- [National Security Archive](https://nsarchive.gwu.edu) - Declassified documents and analysis
- [Institution Name](URL) - Brief description of relevance
```

## Summary vs. Full Article Split

### Summary (Outline) Characteristics
- **Purpose**: Quick reference and overview
- **Format**: Hierarchical bullet points
- **Length**: 200-300 lines typically
- **Content**: Key facts and timeline
- **Style**: Telegraph-like brevity

### Full Article Characteristics
- **Purpose**: In-depth educational content
- **Format**: Narrative prose with sections
- **Length**: 1500-3000 words
- **Content**: Context, analysis, and interpretation
- **Style**: Engaging storytelling with academic rigor

### Marker Usage
Place `<!-- SUMMARY_END -->` between the outline and full article:
```markdown
[Summary content ends here]

<!-- SUMMARY_END -->

## Full Article

### [First full article section]
```

## Examples of Good Practices

### Effective Opening
"In the early hours of November 8, 1983, Lieutenant Colonel Stanislav Petrov had already prevented nuclear war once..."

### Clear Timeline References
"The exercise was scheduled to run from November 2-11, 1983..."

### Multiple Perspectives
"While NATO viewed the exercise as routine, Soviet intelligence interpreted these indicators as potential evidence of genuine war planning."

### Connecting to Themes
"The incident demonstrated how nuclear weapons create hair-trigger situations where misunderstandings can rapidly escalate..."

## Common Pitfalls to Avoid

1. **Speculation**: Don't write "might have" or "possibly" without evidence
2. **Dramatization**: Avoid Hollywood-style embellishment
3. **Technical jargon**: Define all military/technical terms
4. **Bias**: Present all sides of controversial events
5. **Incomplete citations**: Always provide verifiable sources

## File Organization

Place articles in appropriate subdirectories:
- `/content/history/cold-war-crises/` - Cold War incidents
- `/content/history/foundational-events/` - Early nuclear history
- `/content/history/nuclear-accidents/` - Accidents and close calls
- `/content/history/treaties-agreements/` - Arms control history

## Review Checklist

Before submitting an article, verify:
- [ ] Front matter is complete and accurate
- [ ] Opening paragraph hooks the reader
- [ ] Summary section uses consistent bullet format
- [ ] `<!-- SUMMARY_END -->` marker is present
- [ ] Full article expands all outline points
- [ ] Nuclear weapons connection is explicit
- [ ] Sources are authoritative and linked
- [ ] No speculation or unverified claims
- [ ] Dates and names are accurate
- [ ] Writing is clear and accessible