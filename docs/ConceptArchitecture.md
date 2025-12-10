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
- Example: Change "X" � "Split End" and all concepts automatically update
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
� Dropdown shows: "Twins Right", "Twins Left", "Twins Bunch"
� Coach selects "Twins Right"
� Canvas populates with Twins Right formation
� Chip appears in search bar: [Twins Right]

Coach continues typing: "Slice"
� Dropdown shows: "Slice" (saved concept)
� Coach selects "Slice"
� Canvas adds Slice concept routes
� Another chip appears: [Twins Right] [Slice]

Coach types: "Lookie"
� No match found
� Appears as plain text: [Twins Right] [Slice] Lookie
� Coach can later save "Lookie" as a new concept
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
- The concept should work in both cases without modification

This flexibility is essential for coaches who run multiple formations but want consistent route concepts across them.

---

### Three Player Targeting Modes

Base concepts support three different ways to target players. When creating a concept, the coach selects which mode to use for each player assignment.

#### Mode 1: Absolute Role (Position-Specific)

**Purpose:** Target specific roles by their exact name

**How it works:**
- Concept specifies roles explicitly: "X", "Y", "RB", "LT", etc.
- System finds the player assigned to that role in the formation
- If role doesn't exist in formation, concept cannot be applied

**Examples:**
- "X-Post" - X receiver always runs a post route
- "RB-Flat" - Running back always runs a flat route
- "Power-Blocking" - LG and LT always pull left

**Best for:**
- Concepts tied to specific position responsibilities
- Plays that only work with certain personnel
- Formation-specific concepts (e.g., "I-Form FB Dive")

**Edge case handling:**
```
Formation: Spread (no FB)
Concept: "FB-Dive" (requires FB role)
Result: ❌ Cannot apply - "FB-Dive requires FB role, not found in Spread formation"
```

---

#### Mode 2: Relative Selector (Alignment-Specific)

**Purpose:** Target players based on their field position/alignment

**How it works:**
- Concept uses field-relative selectors instead of role names
- System resolves selectors dynamically based on where players are positioned
- Works across different formations as long as matching players exist

**Available Selectors:**

**Lateral (Left-Right):**
- `leftmost receiver` - Furthest receiver to field left
- `rightmost receiver` - Furthest receiver to field right
- `second receiver from left` - Second-leftmost receiver
- `second receiver from right` - Second-rightmost receiver
- `inside receivers` - All receivers between tackles
- `outside receivers` - All receivers outside tackles

**Directional (Relative to Play):**
- `playside receiver` - Receiver on same side as run/roll direction
- `backside receiver` - Receiver opposite run/roll direction
- `playside tackle` - Tackle on play direction side
- `backside tackle` - Tackle opposite play direction

**Strength-Based:**
- `strong side receivers` - Receivers on side with more eligible receivers
- `weak side receivers` - Receivers on side with fewer eligible receivers
- `strong side TE` - Tight end on strength side (if multiple TEs)

**Depth-Based:**
- `deepest receiver` - Receiver furthest from line of scrimmage
- `shallow receivers` - Receivers within 5 yards of LOS
- `deep receivers` - Receivers beyond 5 yards of LOS

**Numeric:**
- `leftmost N receivers` - e.g., "leftmost 2 receivers"
- `rightmost N receivers` - e.g., "rightmost 3 receivers"

**Examples:**
- "Lookie" = `leftmost 2 receivers run 9 routes`
- "Flood-Weak" = `weak side receivers run corner + out + flat`
- "Backside-Post" = `backside receiver runs post route`

**Best for:**
- Concepts that work across multiple formations
- Field-side dependent plays (e.g., "always attack left side")
- Strength/weakness exploiting plays

**Edge case handling:**

```
Formation: Trips Right (3 receivers right, 1 left)
Concept: "leftmost 2 receivers run 9s"
Result: ⚠️ Warning - "Only 1 receiver found on left, expected 2"
        Applies route to the 1 receiver found
        Coach can manually adjust or change formation

Formation: Balanced (2 receivers each side)
Concept: "strong side receivers run flood"
Result: ✓ System calculates: Right side has TE + 2 WR = "strong side"
        Applies flood concept to right side receivers
```

---

#### Mode 3: Conditional Rules (Advanced Pattern Matching)

**Purpose:** Define complex, adaptive concepts with logic

**How it works:**
- Concept includes IF-THEN rules that system evaluates
- Multiple conditions can be combined with AND/OR logic
- Allows concepts to adapt based on formation characteristics

**Rule Syntax:**
```
IF <condition> THEN <assignment>
```

**Available Conditions:**

**Role Checks:**
- `player is <role>` - e.g., "player is X"
- `player is receiver` - Any receiver role
- `player is back` - RB or FB
- `player is lineman` - Any O-line role

**Position Checks:**
- `player on left side`
- `player on right side`
- `player on strong side`
- `player on weak side`
- `player inside tackles`
- `player outside tackles`

**Count Checks:**
- `formation has N receivers on <side>`
- `formation has <role>`

**Compound Conditions:**
- `player is receiver AND player on weak side`
- `formation has 2 receivers on left OR player is backside receiver`

**Examples:**

```
Concept: "Adaptive Flood"
Rules:
  IF player is receiver AND player on weak side THEN run corner route
  IF player is TE AND player on weak side THEN run out route
  IF player is RB THEN run flat route to weak side
```

```
Concept: "RPO Alert"
Rules:
  IF formation has 3 receivers on right THEN X runs slant
  IF formation has 2 receivers on right THEN X runs out
```

**Best for:**
- Concepts with built-in adjustments
- RPO/option plays with multiple reads
- Coaching systems with complex rules

**Edge case handling:**

```
Formation: Unbalanced Right (all receivers right)
Concept: "Weak-Side-Flood" (requires weak side receivers)
Rules: IF player on weak side AND player is receiver THEN run flood concept
Result: ⚠️ No players match conditions
        Concept not applied
        Message: "Weak-Side-Flood requires receivers on weak side, none found"
```

---

### Field Reference System

For all lateral selectors (left/right), the system needs a consistent reference point.

**Standard Reference: Absolute Field Position**
- "Left" = Left side of field (from offensive perspective)
- "Right" = Right side of field (from offensive perspective)
- Hash marks serve as the fixed reference point
- Consistent regardless of formation balance

**Alternative: Hash-Relative Reference**
- Coach can optionally use hash-relative positioning
- "Field side" = Wide side of hash marks (more field to work with)
- "Boundary side" = Short side of hash marks (sideline closer)
- Useful for hash-dependent play calling

**Setting:** Team-level setting controls default reference system. Concepts can override on per-concept basis.

---

### Edge Cases and Failure Modes

#### 1. Insufficient Players

**Scenario:** Concept requires more players than formation has

**Example:**
```
Formation: Empty (5 receivers, no backs)
Concept: "I-Form Power" (requires FB and RB)
```

**Handling:**
- ❌ Concept blocked from being applied
- Error message: "I-Form Power requires FB and RB roles, not found in Empty formation"
- Suggestion: "Try 'Spread Power' concept instead" (if available)

---

#### 2. Ambiguous Selectors

**Scenario:** Formation is symmetric, no clear "strong" or "weak" side

**Example:**
```
Formation: Balanced Twins (2 WR each side, 1 RB)
Concept: "Strong-Flood" (requires strong side determination)
```

**Handling:**
- System defaults to **right side** as strong side (or team setting)
- ⚠️ Warning shown: "Formation is balanced, defaulting to right side as strong side"
- Coach can manually override or adjust formation

---

#### 3. Partial Matches

**Scenario:** Concept can be partially applied (some players match, others don't)

**Example:**
```
Formation: Trips Left (3 receivers left, 1 right)
Concept: "Four Verticals" (requires 4 receivers to run 9 routes)
```

**Handling:**
- ✓ Concept applied to 4 available receivers
- ⚠️ Warning: "Four Verticals expects 4 receivers, found 4 - all matched"
- If only 3 receivers: Applies to 3, warns about missing 4th

---

#### 4. Conflicting Conditions

**Scenario:** Multiple rules could apply to same player

**Example:**
```
Concept: "Confusion"
Rules:
  IF player is receiver THEN run post
  IF player on left side THEN run corner
(Left receiver matches both conditions)
```

**Handling:**
- **First rule wins** - Rules evaluated in order
- Left receiver runs post (first rule)
- ⚠️ Design-time validation warns coach about conflicting rules
- Recommend restructuring with more specific conditions

---

#### 5. Dynamic Formation Changes

**Scenario:** Formation shifts or motion after concept is applied

**Example:**
```
Formation: Trips Right (initially)
Concept: "Trips Flood" (targets trips side)
Motion: Z receiver motions from right to left
```

**Handling:**
- **Concepts resolve at snap moment** (after all motion complete)
- System re-evaluates selectors after motion
- If motion invalidates concept (no longer 3 receivers on one side):
  - ⚠️ Warning: "Trips Flood concept no longer valid after motion"
  - Coach must adjust or change concept

**Alternative:** Coach can specify "pre-snap" vs "post-snap" concept evaluation timing

---

#### 6. Missing Play Direction

**Scenario:** Playside/backside selectors used but play direction not set

**Example:**
```
Concept: "Backside-Post" (requires play direction)
Play direction: Not specified
```

**Handling:**
- Concept grayed out/disabled until direction set
- Tooltip: "This concept requires play direction - use direction tool to set"
- Once direction set, concept evaluates and applies

---

### Validation and Feedback

**Real-time validation:**
- As coach types in search bar or builds concepts, system validates continuously
- Show immediate feedback about conflicts or missing requirements
- Color coding:
  - ✅ Green: Concept applies cleanly
  - ⚠️ Yellow: Concept applies with warnings
  - ❌ Red: Concept cannot be applied (blocked)

**Helpful error messages:**
- Explain WHY concept can't apply
- Suggest alternatives when available
- Link to concept editor if coach wants to modify rules

**Example validation messages:**
```
✓ "Lookie applied to X and Y receivers"
⚠️ "Lookie expects 2 left receivers, found 1 - partially applied"
❌ "Lookie requires 2 left receivers, found 0 - cannot apply"
   → Try: "Single-Deep" concept or add receiver to formation
```

---

## Conflict Detection and Validation

### Conflict Prevention Rules

1. **No duplicate player assignments** - Two concepts cannot both affect the same player
2. **First-in wins** - If conflict detected, first concept is applied, second is blocked
3. **Error indication** - Show clear error icon/message explaining the conflict
4. **Validation before application** - System checks all composition rules before applying concepts to canvas

### Example Conflict

```
[Twins Right] [Slice]  � X runs a slant (from Slice)
Coach tries to add: [Z-Post]  � Z runs a post

If Z and X are the same player in this formation:
� Show error: "L Z-Post conflicts with Slice (both affect Z receiver)"
� Block Z-Post from being applied
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

- Formations � Players (position data)
- Base Concepts � Roles + Drawings (role reference + drawing data)
- Play Concepts � Formation + Base Concepts (composition)
- Drawings � Concepts (linkage for reuse)

---

## Open Questions

1. ~~**Position-agnostic implementation**~~ - ✅ RESOLVED: Three targeting modes (Absolute Role, Relative Selector, Conditional Rules)
2. **Toolbar changes** - What new toolbar buttons/tools are needed for linking and concept creation?
   - "Save as Concept" button (with dropdown: Formation / Base Concept / Play Concept)
   - "Link Players" tool for creating concept associations
   - "Set Play Direction" tool (for playside/backside concepts)
3. **Dialog designs** - What do the concept builder and settings dialogs look like?
   - Concept Builder: Name, targeting mode selector, player assignments, route drawing area
   - Settings: Role terminology editor, field reference system selector
4. **Search ranking** - How should autocomplete prioritize results (recency, frequency, alphabetical)?
   - Proposed: Frecency algorithm (frequency + recency weighted)
   - Most recently used concepts bubble to top
   - Alphabetical within tiers
5. **Concept versioning** - What happens if coach edits a concept that's used in multiple plays?
   - Option A: Update all plays using that concept (with confirmation)
   - Option B: Create new version, keep old plays unchanged
   - Option C: Hybrid - warn coach and let them choose per-edit
6. **Import/export** - Can coaches share concept libraries between teams?
   - Format: JSON export of formations + concepts
   - Import workflow: Review concepts, resolve role name conflicts, import
7. **Defensive concepts** - Does this same system work for defensive formations and schemes?
   - Yes, same architecture applies
   - Defensive roles: DT, DE, MLB, OLB, CB, S, etc.
   - Concepts: Coverage schemes, blitz packages, gap responsibilities

---

## Next Steps

1. Refine position-agnostic concept design
2. Design toolbar integration (new buttons/tools)
3. Design dialog interfaces (concept builder, settings)
4. Define database schema in detail
5. Create implementation plan
