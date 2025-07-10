# History Article Style Guide for Nuclear Blast Simulator

This document defines the writing style and structure for history articles in the Nuclear Blast Simulator project. Follow these guidelines when creating or editing historical content.

## Article Structure

### 1. Front Matter

```yaml
---
title: 'Article Title'
description: 'A compelling one-sentence description that summarizes the historical event and its significance, ending with ellipsis to create intrigue...'
---
```

### 2. Title Section

- Main heading using `#` (exact copy of front matter title)
- Followed by a thematic, engaging subtitle using `##` that captures the essence of the event
- Subtitle should be memorable and create emotional impact

Example:

```markdown
# Cuban Missile Crisis

## Thirteen Days That Nearly Ended the World
```

### 3. Opening Paragraph

- A vivid, scene-setting paragraph that immediately places the reader in the moment
- Uses specific dates, times, and locations
- Emphasizes the dramatic nature and significance of the event
- Typically 3-5 sentences that build tension and establish stakes
- May use present tense for dramatic effect before shifting to past tense
- Should hook the reader emotionally

### 4. Content Organization

#### Summary Section (Before `<!-- SUMMARY_END -->`)

The summary section provides comprehensive coverage using a **hierarchical outline format**:

- **Main sections**: Use `##` headings (Background, The Event, Impact, etc.)
- **Subsections**: Use `###` headings for detailed breakdowns
- **Bullet points**: Extensive use for clarity and facts
  - Each subsection typically contains 4-5 bullet points
  - Points contain concise, factual information
  - Use dashes to separate labels from content
  - Include specific dates, names, and numbers
- **Word count**: Typically 2,000-4,000 words for the summary alone

Example:

```markdown
### Cold War Tensions (1983)

- **Reagan administration** - Aggressive anti-Soviet rhetoric and military buildup
- **Soviet paranoia** - Deep Soviet fears of U.S. first strike capabilities
- **Operation RYAN** - Soviet intelligence operation to detect surprise attack
- **SS-20 deployment** - Soviet intermediate-range missiles in Eastern Europe
```

#### Full Article Section (After `<!-- SUMMARY_END -->`)

The full article provides an extensive, literary treatment of the topic:

- **Deep Dive header**: Always starts with `## Deep Dive`
- **Narrative style**: Engaging storytelling with comprehensive detail
- **Extended coverage**: Often 3,000-5,000 words for the full section
- **Literary quality**: Uses vivid descriptions and scene-setting
- **Human elements**: Integrates personal stories throughout
- **Technical balance**: Complex topics explained without dumbing down
- **Multiple perspectives**: International viewpoints and various stakeholders
- **Philosophical depth**: Explores moral and ethical dimensions
- **Circular structure**: Often returns to opening imagery in conclusion

### 5. Standard Sections Pattern

Most articles follow this section progression:

1. **Background** - Historical context with multiple subsections:

   - Political/social environment
   - Key players and motivations
   - Technical/military context
   - Precipitating events

2. **The [Main Event]** - Chronological account with:

   - Critical moments highlighted
   - Human stories integrated
   - Technical details explained
   - Multiple perspectives

3. **Immediate Response/Impact** - How the world reacted:

   - Government responses
   - Public reaction
   - International implications
   - Emergency measures

4. **Key Figures** - Important people with context

5. **Long-term Consequences** - Lasting effects and changes

6. **Connection to Nuclear Weapons** - Explicit section before summary ends:

   - 4-5 bullet points
   - Clear nuclear relevance
   - Deterrence implications
   - Policy impacts

7. **Sources** - Authoritative references with descriptions

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

- **Bold** for emphasis and key terms throughout
- **No italics** - avoid italic formatting
- **Dashes** to separate labels from content in bullets
- **Parentheses** for clarifications and dates
- **Numbers**: Use digits for all numbers for clarity
- **Dates**: "October 16, 1962" format (month day, year)
- **Acronyms**: Define on first use with acronym in parentheses
- **Quotes**: Use double quotes for direct quotations

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

Always include authoritative sources with horizontal rule:

```markdown
---

## Sources

**Authoritative Sources:**

- [National Security Archive](https://nsarchive.gwu.edu) - Declassified documents and analysis
- [Institution Name](URL) - Brief description of relevance
- [Institution Name](URL) - Brief description of relevance
```

Include 3-5 sources from:

- Government agencies and archives
- International organizations (UN, IAEA)
- Academic institutions
- Specialized nuclear/military organizations
- Official government reports

## Summary vs. Full Article Split

### Summary (Outline) Characteristics

- **Purpose**: Comprehensive reference covering all aspects
- **Format**: Hierarchical sections with extensive bullet points
- **Length**: 2,000-4,000 words (much longer than previously)
- **Content**: Complete coverage of background, event, impact, and significance
- **Style**: Factual and detailed while remaining accessible
- **Structure**: Multiple H2 and H3 sections with 4-5 bullets each

### Full Article Characteristics

- **Purpose**: Literary, comprehensive historical account
- **Format**: Extended narrative prose with deep analysis
- **Length**: 8,000-15,000 words (total article often 10,000-20,000 words)
- **Content**: Vivid storytelling, human elements, technical depth, philosophical reflection
- **Style**: Literary quality with academic rigor
- **Opening**: Always begins with "## Deep Dive"

### Marker Usage

Place `<!-- SUMMARY_END -->` after the Connection to Nuclear Weapons section:

```markdown
## Connection to Nuclear Weapons

[Event name] directly relates to nuclear weapons:

- **[Key aspect]** - How it relates to nuclear weapons
- **[Key aspect]** - Nuclear policy implications
- **[Key aspect]** - Deterrence or proliferation impact
- **[Key aspect]** - Arms control relevance

<!-- SUMMARY_END -->

## Deep Dive

### [First narrative section]
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

- `/content/history/cold-war-crises/` - Major nuclear crises and close calls
- `/content/history/foundational-events/` - Key events in nuclear history
- `/content/history/key-figures/` - Important figures in nuclear development
- `/content/history/modern-developments/` - Contemporary nuclear issues
- `/content/history/nuclear-programs/` - National nuclear programs
- `/content/history/testing-disasters/` - Nuclear testing and disasters
- `/content/history/weapons-technology/` - Nuclear weapons technology

## Review Checklist

Before submitting an article, verify:

- [ ] Front matter uses single quotes and ends description with ellipsis
- [ ] Title matches H1 exactly
- [ ] Dramatic subtitle captures essence of event
- [ ] Opening paragraph creates immediate emotional engagement
- [ ] Summary section is comprehensive (2,000-4,000 words)
- [ ] All sections use consistent H2/H3 hierarchy
- [ ] Bullets use dashes between labels and content
- [ ] Connection to Nuclear Weapons section present before marker
- [ ] `<!-- SUMMARY_END -->` marker placed correctly
- [ ] Deep Dive section starts full article
- [ ] Full article is extensive (8,000-15,000 words)
- [ ] Human stories integrated throughout
- [ ] Technical concepts explained clearly
- [ ] Multiple perspectives included
- [ ] Sources section has horizontal rule and 3-5 authorities
- [ ] No italics used in formatting
- [ ] All numbers use digits
- [ ] Dates follow "Month Day, Year" format
