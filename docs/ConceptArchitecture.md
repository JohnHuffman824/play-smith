# Concept Architecture - Formations and Custom Concepts

**Status:** Brainstorming in progress
**Date:** 2025-12-09

## Overview

Play Smith needs a comprehensive, modular system for coaches to define their playbook language using formations, concepts, and concept groups. Coaches should be able to articulate their scheme in their own terminology and have it directly appear in the UI.

## Core Requirements

1. **Formations** - Predefined player alignments (positions only, no routes)
2. **Base Concepts** - Reusable route/assignment patterns tied to player roles
3. **Concept Groups** - Bundled combinations of formation + multiple base concepts
4. **Unified Search** - Single search bar with autocomplete for all saved items
5. **Modularity** - Coaches can compose plays from primitives to complex bundles
6. **Customization** - Team-level terminology that coaches can modify
7. **Validation** - Intelligent system to prevent conflicts and validate composition rules
8. **Scope Flexibility** - Concepts can be saved at team level or playbook level

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

### 3. Concept Groups (Bundles)

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
   - **Categorized results:** Sections for "Formations", "Base Concepts", "Concept Groups"
   - **Metadata display:** Shows tags, usage count, and type icons for each result
   - **Scrollable:** Shows top 10-15 results with scroll for more
2. **Visual chips/bubbles** - Selected items appear as distinct chips in the search bar
   - **Type-specific styling:** Different colors/icons for Formations (blue), Base Concepts (green), Concept Groups (purple)
   - **Reorderable:** Drag chips to change application order
   - **Removable:** X button appears on hover to remove individual chips
3. **Auto-population** - Selecting a formation/concept immediately updates the canvas
4. **Plain text fallback** - Unmatched text appears as regular text (can save as concept later)
5. **Progressive enhancement** - Coach can later convert plain text into saved concepts

### Smart Parsing (On-the-Fly Composition)

The unified search bar intelligently parses role + concept patterns and auto-composes them.

**Pattern Recognition:**

```
Coach types: "X Post"
� System recognizes:
   - "X" = player role
   - "Post" = preset route concept (from route tree)
� Auto-composes: Apply "Post" route to "X" player
� Creates temporary concept on-the-fly
� Appears as: [X Post]
```

**How it works:**
1. Tokenize input: Split on spaces
2. Check each token against:
   - Known player roles (X, Y, Z, RB, etc.)
   - Known concepts (formations, base concepts, preset routes)
3. If pattern matches `<role> <concept>`, compose automatically
4. Apply composition to canvas
5. Coach can optionally save composition as named concept

**Examples:**
- `"X Post"` � X receiver runs post route
- `"RB Flat"` � Running back runs flat route
- `"Y Corner"` � Y receiver runs corner route

**Route Tree as Position-Agnostic Concepts:**
- All routes from route tree (1-Flat, 2-Slant, ... 9-Go) are treated as position-agnostic concepts
- Can be applied to any player role via smart parsing
- Stored in `preset_routes` table (seeded on setup)

---

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

Coach types: "X Post"
� System recognizes role + concept pattern
� Auto-composes: X runs post route
� Chip appears: [Twins Right] [Slice] [X Post]
� Coach can save "X Post" as named concept later

Coach types: "Lookie"
� No match found
� Appears as plain text: [Twins Right] [Slice] [X Post] Lookie
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

## UI Integration and Workflows

### Overview

The concept system integrates into both the Play Editor (toolbar) and Playbook Manager. Canvas components are reused with configurable parameters to maintain consistency while adapting to different contexts.

---

### Toolbar Integration (Play Editor)

The left-side toolbar includes an **"Add Concept"** button that **replaces** the existing "Add Component" (G) button.

**Toolbar Button:**
- **Icon:** Plus (+) (reuses Add Component icon)
- **Label:** "Add Concept"
- **Shortcut:** G
- **Action:** Opens **Concept Selection Sub-Dialog**

**Concept Selection Sub-Dialog:**

When "Add Concept" button is clicked, a sub-dialog appears listing:

```
┌────────────────────────────────────────┐
│  Add Concept to Play                   │
├────────────────────────────────────────┤
│                                        │
│  Available Concepts:                   │
│  ☐ Twins Right (Formation)             │
│  ☐ I-Form (Formation)                  │
│  ☐ Slice (Base Concept)                │
│  ☐ Lookie (Base Concept)               │
│  ☐ Roger (Concept Group)               │
│                                        │
│  [search filter...]                    │
│                                        │
│  ─────────────────────────────────────│
│                                        │
│  [+ Create New Concept]                │
│                                        │
└────────────────────────────────────────┘
```

**Behavior:**
- Selecting existing concept → applies to canvas, closes dialog
- "[+ Create New Concept]" → opens full Concept Dialog
- Search filter narrows list (same autocomplete as unified search)

**NOT in toolbar:**
- No "Save as Concept" button in toolbar
- This action is only available via multi-selection context menu (see Selection-Based Workflow below)

**Rationale:**
- "Add Concept" consolidates concept application and creation
- "Add Component" concept deprecated in favor of formations/concepts system
- Single toolbar button keeps UI clean

---

### Selection-Based Workflow (Save as Concept)

Coaches can convert existing canvas elements into concepts using a selection-based workflow.

**Steps:**

1. **Multi-select objects:**
   - Use Select tool (toolbar)
   - Hold Shift and click multiple objects (players, drawings)
   - Selected items highlighted with blue border

2. **Sub-dialog appears:**
   - When 2+ objects selected, sub-dialog appears **across top of canvas** (overlay)
   - Dialog includes: "Save as Concept" button (and possibly Delete, Duplicate actions)
   - Positioned horizontally centered at top of canvas area

3. **Click "Save as Concept":**
   - Opens full Concept Dialog (modal, center screen)
   - Dialog pre-populated with selected objects:
     - Players → automatically mapped to their roles
     - Drawings → linked to respective players (if applicable)
     - Canvas mini-preview shows selected elements
   - Coach can refine, name, and save

**Example:**
```
Coach draws routes for X (post) and Y (corner)
→ Shift-selects both player+drawing pairs
→ Sub-dialog appears across top of canvas: [Save as Concept] [Delete] [Duplicate]
→ Clicks "Save as Concept"
→ Full Concept Dialog opens (modal, center screen) with:
   - Name: "" (empty, ready to fill)
   - Players: X (post route), Y (corner route)
   - Mini canvas shows the two routes
   - Targeting mode: Absolute Role (default)
→ Coach names it "Y-Corner" and saves
```

---

### Concept Dialog Design

The Concept Dialog is the central interface for creating and editing concepts. It appears when:
- "Add Concept" toolbar button clicked (empty dialog)
- "Save as Concept" context menu clicked (pre-populated)
- Editing existing concept from search or concept library

**Dialog Layout (Canvas-Centric Design):**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Create New Concept                                      [X] Close   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Name: [________________________]   Scope: ○ Team  ○ Playbook       │
│                                                                      │
│  ┌──────┬─────────────────────────────────────────────────────────┐ │
│  │      │                                                          │ │
│  │  T   │                                                          │ │
│  │  O   │                                                          │ │
│  │  O   │                  CANVAS (FULL-SIZE)                     │ │
│  │  L   │                                                          │ │
│  │  B   │          (Reused Canvas component from Play Editor)     │ │
│  │  A   │          (Same toolbar buttons: Select, Draw, etc.)     │ │
│  │  R   │                                                          │ │
│  │      │                                                          │ │
│  │      │                                                          │ │
│  └──────┴─────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Targeting:  ○ Absolute Role    ○ Relative Selector                 │
│  Ball Pos:   ○ Left  ○ Center  ○ Right    [Flip Vertical]          │
│                                                                      │
│           [Cancel]    [Save as New]    [Save Concept]               │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Design Principles:**

1. **Canvas is Central** - Full-size canvas dominates the dialog (not a small preview)
2. **Reused Toolbar** - Left sidebar toolbar from Play Editor is reused inside dialog
3. **Minimal Controls** - Settings (name, targeting, ball position) are compact at top/bottom
4. **Save Options** - Two save buttons for different workflows

**Save Button Behavior:**

- **"Save Concept"** - Updates existing concept (if editing) OR saves new concept (if creating)
- **"Save as New"** - Always creates new copy, even when editing existing concept
- **Use case:** Edit "Twins Right" → flip vertical → "Save as New" → name it "Twins Left"

---

### Dialog Components

#### 1. Name Field
- **Type:** Text input
- **Placeholder:** "Enter concept name (e.g., 'Y-Corner', 'Power', 'Lookie')"
- **Validation:** Required, must be unique within team/playbook scope
- **Auto-suggestions:** As coach types, show similar existing concepts to avoid duplicates

#### 2. Targeting Mode Selector
- **Type:** Radio buttons (mutually exclusive)
- **Options (Phase 1):**
  - **Absolute Role:** "Target specific positions (X, Y, RB, etc.)"
  - **Relative Selector:** "Target by alignment (leftmost receiver, playside, etc.)"
- **Default:** Absolute Role (simplest)
- **Behavior:** Switching modes changes Player Assignments UI below
- **Phase 2:** "Conditional Rules" option will be added later

---

#### 3. Player Assignments UI (Mode-Specific)

**Mode 1: Absolute Role**
```
┌─────────────────────────────────────────────────┐
│ Player Assignments                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Role: [X ▼]        Route: [Post ▼] (or draw)  │
│  Role: [Y ▼]        Route: [Corner ▼]          │
│                                                 │
│  [+ Add Player]                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```
- Each row: Dropdown for role + dropdown for preset route OR custom draw
- "Add Player" button adds another row
- Preset roles from team settings (X, Y, Z, RB, etc.)

**Mode 2: Relative Selector**
```
┌─────────────────────────────────────────────────┐
│ Player Assignments                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Selector: [Leftmost 2 receivers ▼]            │
│  Route: [9 route (go) ▼] (or draw)             │
│                                                 │
│  Selector: [Strong side TE ▼]                  │
│  Route: [Out route ▼]                          │
│                                                 │
│  [+ Add Selector]                               │
│                                                 │
└─────────────────────────────────────────────────┘
```
- Dropdown with relative selectors (leftmost, playside, etc.)
- Numeric input for "N receivers" selectors

**Mode 3: Conditional Rules** ⏸️ **PHASE 2**

This mode is deferred to Phase 2. When implemented, it will support IF-THEN rules for adaptive concepts.

---

#### 4. Ball Position Setting + Flip Feature
- **Type:** Radio buttons + Button
- **Options:** Left | Center | Right | [Flip Vertical]
- **Purpose:** For mirroring concepts when applied to plays
- **Example:** Concept created with ball on left automatically mirrors when applied to play with ball on right
- **Default:** Center (no mirroring needed)

**Flip Vertical Button:**
- **Action:** Mirrors all player positions and routes across vertical axis (left ↔ right)
- **Use case:** Create "Twins Right" → click [Flip Vertical] → save as "Twins Left"
- **Behavior:**
  - Flips player X positions (multiply by -1)
  - Flips route drawings (mirror geometry)
  - Updates ball position automatically (Left ↔ Right, Center stays Center)
  - Coach can then click "Save as New" to create mirrored concept

#### 5. Play Direction Setting
- **Type:** Radio buttons
- **Options:** Left | Right | N/A
- **Purpose:** For directional concepts (playside/backside selectors)
- **Behavior:** If N/A, playside/backside selectors disabled (validation error)
- **Default:** N/A

#### 6. Save Scope
- **Type:** Radio buttons
- **Options:** Team Level | Playbook Level
- **Purpose:** Determines concept visibility and reusability
  - **Team Level:** Available across all playbooks for this team
  - **Playbook Level:** Only available in current playbook
- **Default:** Team Level (broader reusability)
- **Use cases:**
  - Team Level: Core offensive concepts used across multiple playbooks
  - Playbook Level: Situational concepts specific to one opponent/game plan

---

#### 7. Mini Canvas (Route Preview)
- **Component:** Reused Canvas component from Play Editor
- **Parameters:**
  - `backgroundColor`: Configurable (e.g., lighter shade for dialog context)
  - `size`: Smaller dimensions (e.g., 400x300px vs full screen)
  - `readonly`: Optional - can be editable or preview-only
  - `showGrid`: Optional - show/hide field markings
  - `zoomLevel`: Fit concept elements within visible area
- **Purpose:** Visual preview of routes and player positions
- **Interaction:**
  - If from "Save as Concept" → shows selected elements (preview mode)
  - If from "Add Concept" → drawing area (editable mode, coach draws routes)
  - Coach can click on mini canvas to draw routes for assigned players

**Rationale for reusability:**
- Same Canvas component logic (players, drawings, linking)
- Different context-specific parameters
- Consistent UX between dialog and main editor
- Reduces code duplication

---

### Access Points

The concept system is accessible from two main areas:

#### 1. Play Editor (Primary)
- **Location:** Left sidebar toolbar
- **Button:** "Add Concept" (opens empty dialog)
- **Context Menu:** Shift-select objects → "Save as Concept" (opens pre-populated dialog)
- **Search Bar:** Type to search/apply existing concepts

#### 2. Playbook Manager (Secondary)
- **Location:** TBD (e.g., sidebar, top menu, or dedicated "Concept Library" view)
- **Purpose:** Manage team-level and playbook-level concepts
- **Actions:**
  - Browse all saved concepts (filterable by type, scope)
  - Edit existing concepts (opens dialog)
  - Delete concepts (with usage warning if concept is used in plays)
  - Create new concepts (opens dialog)
  - Export/import concept libraries

**Use case:**
- Coach wants to review all "power" concepts across playbooks
- Navigate to Playbook Manager → Concept Library → filter by "power"
- Edit "Power-Left" concept → all plays using it update (with confirmation)

---

### Canvas Reusability Strategy

**Existing Canvas Component:**
- Path: `src/components/canvas/Canvas.tsx`
- Purpose: Full-screen play editor canvas with field markings, players, drawings

**Configurable Parameters:**
```typescript
interface CanvasProps {
  // Existing props
  width: number;
  height: number;

  // New configurable props for reusability
  backgroundColor?: string;        // Default: #f2f2f2, Dialog: #ffffff
  showFieldMarkings?: boolean;     // Default: true, Dialog: optional
  showToolbar?: boolean;           // Default: true, Dialog: false
  zoomLevel?: number;              // Default: 1.0, Dialog: auto-fit
  readonly?: boolean;              // Default: false, Preview: true
  scale?: number;                  // Pixels per foot scaling factor
}
```

**Reuse scenarios:**
- **Play Editor:** Full-size, field markings, editable, all tools
- **Concept Dialog:** Smaller, optional markings, editable/preview, no toolbar
- **Playbook Manager (thumbnails):** Tiny, no markings, readonly, auto-fit zoom
- **Print/Export:** Custom size, high DPI, field markings, readonly

**Benefits:**
- Single source of truth for canvas rendering logic
- Consistent player/drawing behavior across contexts
- Easy to maintain and extend
- Parameter-driven customization vs code duplication

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

### Visual Feedback

**Conflict indication:**
- **Red highlight** on conflicting chips in search bar
- **Red highlight** on affected players/drawings on canvas
- **Error tooltip** appears on hover explaining the conflict
- Example: "❌ Z-Post conflicts with Slice (both affect Z receiver)"

**Validation states:**
- ✅ **Green checkmark** on chip = concept applied successfully
- ⚠️ **Yellow warning icon** on chip = partial application or warning
- ❌ **Red X icon** on chip = blocked, cannot apply

---

## Implementation Phases

### Phase 1: Core Concept System (Priority)

**Targeting Modes:**
- ✅ **Absolute Role** - Target specific player roles (X, Y, RB, etc.)
- ✅ **Relative Selector** - Position-agnostic targeting (leftmost receiver, playside, etc.)
- ⏸️ **Conditional Rules** - IF-THEN logic (DEFERRED to Phase 2)

**Features:**
- Formations (player positions only, no routes)
- Base Concepts (Absolute + Relative modes)
- Concept Groups (bundled formation + concepts)
- Unified search bar with smart parsing (role + concept composition)
- Preset routes (route tree 1-9) as position-agnostic concepts
- Role terminology customization
- Concept Dialog with canvas-centric design
- Save vs Save as New workflows
- Vertical flip for mirroring concepts
- Frecency-based search ranking

**Database Tables (Phase 1):**
- `formations`
- `formation_player_positions`
- `base_concepts` (targeting_mode: absolute_role, relative_selector only)
- `concept_player_assignments`
- `concept_groups`
- `concept_group_concepts`
- `concept_applications`
- `role_terminology`
- `preset_routes`

---

### Phase 2: Advanced Features (Future)

**Targeting Modes:**
- ⏸️ **Conditional Rules** - IF-THEN logic for adaptive concepts

**Features:**
- Conditional rule builder UI
- Advanced pattern matching
- Route classification (AI/ML - see Future Features below)

**Database Tables (Phase 2):**
- `concept_targeting_rules`

---

### Future Features (Low Priority)

#### Route Classification

**Goal:** Automatically recognize hand-drawn routes and suggest matching concepts

**How it works:**
1. Coach draws route for player on canvas
2. System analyzes route geometry (path, angles, distance)
3. Compare against known concept library using pattern matching or ML
4. Suggest: "This looks like a Post route - link to Post concept?"
5. Coach can accept → links drawing to existing concept
6. Or coach can reject → save as custom drawing

**Implementation approach:**
- **Simple:** Rule-based pattern matching (angle thresholds, distance checks)
- **Advanced:** ML model trained on route examples (TensorFlow.js or similar)
- **Hybrid:** Rule-based for common routes (9 basic routes), ML for complex concepts

**Benefits:**
- Faster concept creation (draw once, auto-tag)
- Consistency across playbook (all posts look the same)
- Learning tool for new coaches (system shows route names)

**Not a priority** - Focus on Phase 1 manual workflow first

---

## Database Schema

### Overview

The concept system requires 9 new tables to support formations, base concepts, concept groups, player assignments, targeting rules, and terminology customization. All tables use UUIDs for primary keys and include timestamps for audit trails.

**Implementation Priority:**
- **Phase 1 (8 tables):** Core system with Absolute Role and Relative Selector modes
- **Phase 2 (1 table):** `concept_targeting_rules` for Conditional Rules mode (deferred)

All tables below are Phase 1 except `concept_targeting_rules` which is marked as Phase 2.

---

### Table: `formations`

Stores saved formation templates (player alignments only, no routes).

```sql
CREATE TABLE formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT formations_name_team_unique UNIQUE (team_id, name)
);

CREATE INDEX idx_formations_team ON formations(team_id);
CREATE INDEX idx_formations_name ON formations(name);
```

**Fields:**
- `team_id` - Formation belongs to specific team
- `name` - "I-Form", "Twins Right", "Spread" (unique per team)
- `description` - Optional notes about formation usage
- `created_by` - User who created the formation

---

### Table: `formation_player_positions`

Stores individual player positions within a formation.

```sql
CREATE TABLE formation_player_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- "X", "Y", "RB", "LT", etc.
  position_x NUMERIC(10,2) NOT NULL, -- X coordinate in feet (field position)
  position_y NUMERIC(10,2) NOT NULL, -- Y coordinate in feet
  hash_relative BOOLEAN NOT NULL DEFAULT false, -- Adjust position based on hash
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT formation_positions_unique UNIQUE (formation_id, role)
);

CREATE INDEX idx_formation_positions_formation ON formation_player_positions(formation_id);
```

**Fields:**
- `formation_id` - Links to parent formation
- `role` - Player role (references team's role terminology)
- `position_x`, `position_y` - Field position in feet (e.g., center = 0,0)
- `hash_relative` - If true, position adjusts when ball moves between hashes

**Example data:**
```
Formation: "Twins Right"
- X: position_x=80, position_y=20, hash_relative=false
- Y: position_x=60, position_y=15, hash_relative=false
- Z: position_x=-60, position_y=15, hash_relative=false
```

---

### Table: `base_concepts`

Stores reusable route/assignment patterns for player roles.

```sql
CREATE TABLE base_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- NULL = system concept
  playbook_id UUID REFERENCES playbooks(id) ON DELETE CASCADE, -- NULL = team-level
  name TEXT NOT NULL,
  description TEXT,
  targeting_mode TEXT NOT NULL CHECK (targeting_mode IN ('absolute_role', 'relative_selector', 'conditional_rules')),
  ball_position TEXT NOT NULL DEFAULT 'center' CHECK (ball_position IN ('left', 'center', 'right')),
  play_direction TEXT NOT NULL DEFAULT 'na' CHECK (play_direction IN ('left', 'right', 'na')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  usage_count INTEGER NOT NULL DEFAULT 0, -- For search ranking (frecency)
  last_used_at TIMESTAMP, -- For search ranking (frecency)

  CONSTRAINT base_concepts_name_scope_unique UNIQUE NULLS NOT DISTINCT (team_id, playbook_id, name)
);

CREATE INDEX idx_base_concepts_team ON base_concepts(team_id);
CREATE INDEX idx_base_concepts_playbook ON base_concepts(playbook_id);
CREATE INDEX idx_base_concepts_name ON base_concepts(name);
CREATE INDEX idx_base_concepts_usage ON base_concepts(usage_count DESC, last_used_at DESC);
```

**Fields:**
- `team_id` - NULL for system concepts, UUID for team-specific
- `playbook_id` - NULL for team-level, UUID for playbook-level
- `targeting_mode` - Determines how players are targeted (absolute/relative/conditional)
- `ball_position` - For mirroring concepts (left/right/center)
- `play_direction` - For directional concepts (playside/backside)
- `usage_count`, `last_used_at` - For frecency-based search ranking

**Scope resolution:**
- System: `team_id=NULL, playbook_id=NULL`
- Team: `team_id=UUID, playbook_id=NULL`
- Playbook: `team_id=UUID, playbook_id=UUID`

---

### Table: `concept_player_assignments`

Stores player assignments for concepts (absolute role and relative selector modes).

```sql
CREATE TABLE concept_player_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES base_concepts(id) ON DELETE CASCADE,

  -- For absolute_role mode
  role TEXT, -- "X", "Y", "RB" (NULL if relative_selector mode)

  -- For relative_selector mode
  selector_type TEXT, -- "leftmost_receiver", "playside_tackle", etc. (NULL if absolute_role)
  selector_params JSONB, -- {"count": 2} for "leftmost 2 receivers"

  -- Drawing data (full Drawing object from drawing.types.ts)
  drawing_data JSONB NOT NULL,

  order_index INTEGER NOT NULL DEFAULT 0, -- Display/evaluation order
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CHECK (
    (role IS NOT NULL AND selector_type IS NULL) OR
    (role IS NULL AND selector_type IS NOT NULL)
  )
);

CREATE INDEX idx_concept_assignments_concept ON concept_player_assignments(concept_id);
CREATE INDEX idx_concept_assignments_order ON concept_player_assignments(concept_id, order_index);
```

**Fields:**
- `role` - For absolute mode: "X", "Y", "RB"
- `selector_type` - For relative mode: "leftmost_receiver", "strong_side_receivers", etc.
- `selector_params` - JSON params like `{"count": 2}` for numeric selectors
- `drawing_data` - Full Drawing object serialized as JSONB
- `order_index` - Order for display/evaluation

**Constraint:** Exactly one of `role` or `selector_type` must be set (mutually exclusive)

**Example data (absolute mode):**
```json
{
  "concept_id": "uuid-123",
  "role": "X",
  "selector_type": null,
  "drawing_data": {
    "id": "drawing-1",
    "points": {...},
    "segments": [...],
    "style": {"color": "#000", "lineStyle": "solid", "endStyle": "arrow"}
  }
}
```

**Example data (relative mode):**
```json
{
  "concept_id": "uuid-456",
  "role": null,
  "selector_type": "leftmost_receivers",
  "selector_params": {"count": 2},
  "drawing_data": {...}
}
```

---

### Table: `concept_targeting_rules` ⏸️ **PHASE 2**

Stores conditional rules for concepts (conditional_rules mode only).

**Note:** This table is deferred to Phase 2. Phase 1 focuses on Absolute Role and Relative Selector modes only.

```sql
CREATE TABLE concept_targeting_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES base_concepts(id) ON DELETE CASCADE,
  rule_order INTEGER NOT NULL, -- Evaluation order (first match wins)

  -- Conditions (array of condition objects)
  conditions JSONB NOT NULL,
  -- Example: [
  --   {"type": "player_is", "value": "receiver"},
  --   {"type": "player_on", "value": "weak_side"}
  -- ]

  condition_operator TEXT NOT NULL DEFAULT 'AND' CHECK (condition_operator IN ('AND', 'OR')),

  -- Drawing to apply if conditions match
  drawing_data JSONB NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT targeting_rules_order_unique UNIQUE (concept_id, rule_order)
);

CREATE INDEX idx_targeting_rules_concept ON concept_targeting_rules(concept_id);
CREATE INDEX idx_targeting_rules_order ON concept_targeting_rules(concept_id, rule_order);
```

**Fields:**
- `rule_order` - Rules evaluated in order, first match wins
- `conditions` - Array of condition objects
- `condition_operator` - How to combine conditions (AND/OR)
- `drawing_data` - Drawing to apply if rule matches

**Example data:**
```json
{
  "concept_id": "uuid-789",
  "rule_order": 1,
  "conditions": [
    {"type": "player_is", "value": "receiver"},
    {"type": "player_on", "value": "weak_side"}
  ],
  "condition_operator": "AND",
  "drawing_data": {
    "id": "drawing-3",
    "segments": [/* corner route */]
  }
}
```

---

### Table: `concept_groups`

Stores bundled combinations of formation + multiple base concepts.

```sql
CREATE TABLE concept_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  playbook_id UUID REFERENCES playbooks(id) ON DELETE CASCADE, -- NULL = team-level
  name TEXT NOT NULL, -- "Roger", "I-Form Power Left"
  description TEXT,
  formation_id UUID REFERENCES formations(id) ON DELETE SET NULL, -- Optional formation
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP,

  CONSTRAINT concept_groups_name_scope_unique UNIQUE NULLS NOT DISTINCT (team_id, playbook_id, name)
);

CREATE INDEX idx_concept_groups_team ON concept_groups(team_id);
CREATE INDEX idx_concept_groups_playbook ON concept_groups(playbook_id);
CREATE INDEX idx_concept_groups_name ON concept_groups(name);
CREATE INDEX idx_concept_groups_usage ON concept_groups(usage_count DESC, last_used_at DESC);
```

**Fields:**
- `formation_id` - Optional formation to apply with this group
- Scope resolution same as `base_concepts` (team vs playbook level)

---

### Table: `concept_group_concepts`

Join table linking concept groups to their base concepts.

```sql
CREATE TABLE concept_group_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_group_id UUID NOT NULL REFERENCES concept_groups(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES base_concepts(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0, -- Application order
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT group_concepts_unique UNIQUE (concept_group_id, concept_id)
);

CREATE INDEX idx_group_concepts_group ON concept_group_concepts(concept_group_id);
CREATE INDEX idx_group_concepts_order ON concept_group_concepts(concept_group_id, order_index);
```

**Fields:**
- `order_index` - Order in which concepts are applied (for conflict detection)

**Example:** Concept Group "Roger" = Twins Right + Slice + Lookie + Option
```
concept_group_id: uuid-roger
- concept_id: uuid-slice, order_index: 1
- concept_id: uuid-lookie, order_index: 2
- concept_id: uuid-option, order_index: 3
```

---

### Table: `concept_applications`

Tracks which concepts/groups are applied to which plays (for usage stats and versioning).

```sql
CREATE TABLE concept_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,

  -- Either concept OR concept_group (mutually exclusive)
  concept_id UUID REFERENCES base_concepts(id) ON DELETE CASCADE,
  concept_group_id UUID REFERENCES concept_groups(id) ON DELETE CASCADE,

  order_index INTEGER NOT NULL DEFAULT 0, -- Order in unified search bar
  applied_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CHECK (
    (concept_id IS NOT NULL AND concept_group_id IS NULL) OR
    (concept_id IS NULL AND concept_group_id IS NOT NULL)
  )
);

CREATE INDEX idx_concept_applications_play ON concept_applications(play_id);
CREATE INDEX idx_concept_applications_concept ON concept_applications(concept_id);
CREATE INDEX idx_concept_applications_group ON concept_applications(concept_group_id);
CREATE INDEX idx_concept_applications_order ON concept_applications(play_id, order_index);
```

**Purpose:**
- Track concept usage for search ranking (frecency)
- Enable "show all plays using this concept" queries
- Support future versioning (know which plays are affected by concept edits)

---

### Table: `role_terminology`

Stores team-level customization of player role names.

```sql
CREATE TABLE role_terminology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  standard_role TEXT NOT NULL, -- "X", "Y", "RB", "LT", etc.
  custom_name TEXT NOT NULL, -- "Split End", "Flanker", "Tailback"
  position_type TEXT NOT NULL CHECK (position_type IN ('receiver', 'back', 'line', 'tight_end')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT role_terminology_team_role_unique UNIQUE (team_id, standard_role)
);

CREATE INDEX idx_role_terminology_team ON role_terminology(team_id);
```

**Fields:**
- `standard_role` - System role name (X, Y, RB)
- `custom_name` - Team's preferred name (Split End, Tailback)
- `position_type` - Category for grouping/filtering

**Example data:**
```
team_id: uuid-team-1
- standard_role: "X", custom_name: "Split End", position_type: "receiver"
- standard_role: "Y", custom_name: "Flanker", position_type: "receiver"
- standard_role: "RB", custom_name: "Tailback", position_type: "back"
```

**Retroactive updates:**
- When custom_name changes, all concept references to `role="X"` automatically display new name
- No migration needed - concepts still reference standard_role internally

---

### Table: `preset_routes`

Stores system and team-defined route templates.

```sql
CREATE TABLE preset_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- NULL = system route
  name TEXT NOT NULL, -- "Post", "Corner", "Slant"
  route_number INTEGER, -- 1-9 from route tree (NULL for custom)
  drawing_template JSONB NOT NULL, -- Drawing object template
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT preset_routes_name_team_unique UNIQUE NULLS NOT DISTINCT (team_id, name)
);

CREATE INDEX idx_preset_routes_team ON preset_routes(team_id);
CREATE INDEX idx_preset_routes_number ON preset_routes(route_number);
```

**Fields:**
- `team_id` - NULL for system routes (1-Flat, 2-Slant, etc.), UUID for team custom routes
- `route_number` - Maps to route tree (1-9), NULL for non-standard routes
- `drawing_template` - Drawing object with default path/style

**System routes (seeded on setup):**
```
- route_number: 1, name: "Flat", drawing_template: {...}
- route_number: 2, name: "Slant", drawing_template: {...}
- route_number: 9, name: "Go", drawing_template: {...}
```

---

### Summary of Relationships

```
formations
├── formation_player_positions (1:N)

base_concepts
├── concept_player_assignments (1:N) [absolute_role or relative_selector modes]
├── concept_targeting_rules (1:N) [conditional_rules mode only]
└── concept_applications (1:N) [usage tracking]

concept_groups
├── concept_group_concepts (1:N) [links to base_concepts]
└── concept_applications (1:N) [usage tracking]

plays
└── concept_applications (1:N) [tracks formations/concepts applied to this play]

teams
├── formations (1:N)
├── base_concepts (1:N)
├── concept_groups (1:N)
└── role_terminology (1:N)

playbooks
├── base_concepts (1:N) [playbook-scoped concepts]
└── concept_groups (1:N) [playbook-scoped groups]
```

---

### Migration Strategy

1. **Phase 1:** Create tables in order (formations → base_concepts → assignments/rules → groups → applications)
2. **Phase 2:** Seed system preset routes (route tree 1-9)
3. **Phase 3:** Seed default role terminology for existing teams
4. **Phase 4:** Add indexes for performance (frecency queries, search autocomplete)

---

### Search Query Example (Frecency-based Autocomplete)

```sql
-- Find concepts matching "slice" ordered by frecency
SELECT
  id,
  name,
  'base_concept' AS type,
  usage_count,
  EXTRACT(EPOCH FROM (NOW() - last_used_at)) / 86400 AS days_since_use,
  -- Frecency score: usage_count / (days_since_use + 1)
  usage_count / (EXTRACT(EPOCH FROM (NOW() - COALESCE(last_used_at, created_at))) / 86400 + 1) AS frecency_score
FROM base_concepts
WHERE
  (team_id = $1 OR team_id IS NULL) -- System or team concepts
  AND (playbook_id = $2 OR playbook_id IS NULL) -- Playbook or team-level
  AND name ILIKE '%slice%'
ORDER BY frecency_score DESC
LIMIT 10;
```

---

## Open Questions

1. ~~**Position-agnostic implementation**~~ - ✅ RESOLVED: Three targeting modes (Absolute Role, Relative Selector, Conditional Rules)
2. ~~**Toolbar changes**~~ - ✅ RESOLVED: "Add Concept" button in toolbar, "Save as Concept" via context menu, no separate linking tool needed
3. ~~**Dialog designs**~~ - ✅ RESOLVED: Comprehensive Concept Dialog with targeting modes, ball position, play direction, save scope, and mini canvas
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

1. ~~Refine position-agnostic concept design~~ - ✅ COMPLETED
2. ~~Design toolbar integration (new buttons/tools)~~ - ✅ COMPLETED
3. ~~Design dialog interfaces (concept builder, settings)~~ - ✅ COMPLETED
4. **Define database schema in detail** - Design tables for formations, concepts, concept groups, applications
5. **Clarify concept versioning approach** - Decide behavior when editing concepts used in multiple plays
6. **Finalize search/autocomplete UX** - Search ranking algorithm, visual design of chips/bubbles
7. **Create implementation plan** - Break down into phases with database → backend → frontend flow
