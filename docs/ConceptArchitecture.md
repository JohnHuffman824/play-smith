# Concept Architecture - Formations and Custom Concepts

**Status:** Brainstorming in progress
**Date:** 2025-12-09

## Overview

Play Smith needs a comprehensive, modular system for coaches to define their playbook language using formations, concepts, and concept groups. Coaches should be able to articulate their scheme in their own terminology and have it directly appear in the UI.

## Core Requirements

1. **Formations** - Predefined player alignments (positions only, no routes)
2. **Base Concepts** - Reusable route/assignment patterns tied to player roles
3. **Play Concepts** - Bundled combinations of formation + multiple base concepts
4. **Unified Search** - Single search bar with autocomplete for all saved items
5. **Modularity** - Coaches can compose plays from primitives to complex bundles
6. **Customization** - Team-level terminology that coaches can modify
7. **Validation** - Intelligent system to prevent conflicts and validate composition rules

---

## Hierarchy

### 1. Formations (Position Templates)

**Purpose:** Define where players line up, without specifying what they do

**Examples:**
- "I-Form" - QB under center, FB behind QB, RB behind FB
- "Twins Right" - Two receivers on the right side
- "Spread" - Shotgun with receivers spread wide

**Key Properties:**
- Formations are **purely positional** - no routes or assignments
- Each team can define formations differently (e.g., "I-Form" means different alignments for different coaches)
- Saved at team level
- When selected, automatically populates canvas with player positions

### 2. Base Concepts (Role + Drawing)

**Purpose:** Reusable route/assignment patterns for specific player roles

**Examples:**
- "X-Post" - X receiver runs a post route
- "RB-Flat" - Running back runs a flat route
- "Power" - Offensive line blocking scheme for power run

**Key Properties:**
- **Role-based** - References abstract positions like X, Y, Z, RB, H-Back, etc.
- **Drawing included** - Each concept stores the actual route/path drawing
- Can be **position-specific** (absolute: "X runs this") OR **alignment-specific** (relative: "left two receivers run this")
- Saved at team level
- Reusable across different formations

### 3. Play Concepts (Bundles)

**Purpose:** Named combinations of formation + multiple base concepts

**Examples:**
- "Roger" = Twins Right + Slice + Lookie + Option
- "I-Form Power Left" = I-Form + Power blocking + RB-Dive-Left

**Key Properties:**
- Bundles a formation with one or more base concepts
- Has a custom name that coaches can search for
- When selected, applies everything at once (formation + all concepts)
- Can have tags attached for categorization
- Saved at team level

---

## Player Roles and Terminology

### Preset Roles

System ships with standard football terminology:
- **Receivers:** X, Y, Z, H-Back, Slot
- **Backs:** QB, RB, FB
- **Line:** LT, LG, C, RG, RT, TE

### Team-Level Customization

- Team admins can modify role names in settings
- Changes apply **retroactively** to all existing formations/concepts
- Example: Change "X" í "Split End" and all concepts automatically update
- Allows coaches to use their preferred terminology while maintaining consistency

---

## Unified Search Bar

### Current State

PlayHeader has three separate text inputs:
1. Formation
2. Play
3. Defensive Formation

### Proposed Change

**Consolidate into one smart search bar** that handles formations, base concepts, and play concepts uniformly.

### Behavior

1. **Autocomplete dropdown** - Shows matching formations/concepts as you type
2. **Visual chips/bubbles** - Selected items appear as distinct chips in the search bar
3. **Auto-population** - Selecting a formation/concept immediately updates the canvas
4. **Plain text fallback** - Unmatched text appears as regular text (can save as concept later)
5. **Progressive enhancement** - Coach can later convert plain text into saved concepts

### Example Workflow

```
Coach types: "Twins "
í Dropdown shows: "Twins Right", "Twins Left", "Twins Bunch"
í Coach selects "Twins Right"
í Canvas populates with Twins Right formation
í Chip appears in search bar: [Twins Right]

Coach continues typing: "Slice"
í Dropdown shows: "Slice" (saved concept)
í Coach selects "Slice"
í Canvas adds Slice concept routes
í Another chip appears: [Twins Right] [Slice]

Coach types: "Lookie"
í No match found
í Appears as plain text: [Twins Right] [Slice] Lookie
í Coach can later save "Lookie" as a new concept
```

---

## Concept Creation Workflows

### Hybrid Approach

Coaches can create concepts in two ways:

#### A) Draw-then-Save (Organic)

1. Coach draws routes for players on canvas
2. Selects specific drawings
3. Clicks toolbar button "Save as Concept"
4. Names it (e.g., "Power")
5. System saves the player+route combinations as a reusable concept

#### B) Structured Builder (Systematic)

1. Coach opens "Concept Builder" dialog
2. Names the concept (e.g., "Slice")
3. Defines which player roles it affects (e.g., "X" and "Y")
4. Draws routes for each role
5. Saves concept for reuse

Both methods create the same underlying concept structure.

---

## Position-Agnostic Concepts

### The Challenge

Some concepts need to work **relative to alignment** rather than absolute roles.

**Example:** "Lookie" means "left two receivers run 9 routes"
- In Twins Right: X and Y are the left receivers
- In Trips Left: Z and H-Back are the left receivers
- The concept should work in both cases

### Proposed Solution (To Be Refined)

When creating a concept, coach specifies:
- **Position-specific mode:** Concept always affects specific roles (e.g., "X runs slant")
- **Alignment-specific mode:** Concept affects players based on field alignment (e.g., "leftmost two receivers run 9s")

**Questions to resolve:**
- How does coach define "leftmost two receivers" vs "X and Y"?
- Should we use relative selectors ("leftmost", "second from left")?
- Or conditional rules ("IF receiver on left side THEN run 9")?
- Or pattern matching (draw on generic formation, define match criteria)?
- What about "weak side" vs "strong side" concepts?

**Edge cases to consider:**
- What if formation doesn't have two receivers on the left?
- What if concept requires 3 receivers but formation only has 2?
- How do we handle unbalanced formations (not clear which side is "left")?

---

## Conflict Detection and Validation

### Conflict Prevention Rules

1. **No duplicate player assignments** - Two concepts cannot both affect the same player
2. **First-in wins** - If conflict detected, first concept is applied, second is blocked
3. **Error indication** - Show clear error icon/message explaining the conflict
4. **Validation before application** - System checks all composition rules before applying concepts to canvas

### Example Conflict

```
[Twins Right] [Slice]  ê X runs a slant (from Slice)
Coach tries to add: [Z-Post]  ê Z runs a post

If Z and X are the same player in this formation:
í Show error: "L Z-Post conflicts with Slice (both affect Z receiver)"
í Block Z-Post from being applied
```

### Validation System

When applying concepts:
1. Check formation has all required player roles
2. Check no two concepts affect the same player
3. Validate alignment-specific concepts can find matching players
4. Show warnings if concept cannot be fully applied

---

## Database Schema Considerations

### Tables Needed

- `formations` - Saved formation templates
- `base_concepts` - Role + drawing combinations
- `play_concepts` - Bundled formation + concepts
- `concept_applications` - Which concepts are used in which plays
- `role_terminology` - Team-level role name customization

### Key Relationships

- Formations í Players (position data)
- Base Concepts í Roles + Drawings (role reference + drawing data)
- Play Concepts í Formation + Base Concepts (composition)
- Drawings í Concepts (linkage for reuse)

---

## Open Questions

1. **Position-agnostic implementation** - How exactly do coaches define "leftmost two receivers"? (See section above)
2. **Toolbar changes** - What new toolbar buttons/tools are needed for linking and concept creation?
3. **Dialog designs** - What do the concept builder and settings dialogs look like?
4. **Search ranking** - How should autocomplete prioritize results (recency, frequency, alphabetical)?
5. **Concept versioning** - What happens if coach edits a concept that's used in multiple plays?
6. **Import/export** - Can coaches share concept libraries between teams?
7. **Defensive concepts** - Does this same system work for defensive formations and schemes?

---

## Next Steps

1. Refine position-agnostic concept design
2. Design toolbar integration (new buttons/tools)
3. Design dialog interfaces (concept builder, settings)
4. Define database schema in detail
5. Create implementation plan
