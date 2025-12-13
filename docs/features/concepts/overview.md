# Concepts Overview

Concepts are reusable collections of players, routes, and formations that can be saved and applied to multiple plays. They provide consistency and efficiency in playbook development.

## What Are Concepts?

### Definition

A **concept** is a saved collection of:
- Player positions (relative to formation)
- Route assignments (which player runs which route)
- Player labels and roles
- Optional: blocking schemes, motion paths

### Concept Types

**Formation Concepts:**
- Player alignments only (no routes)
- Example: "Trips Right" - 3 receivers aligned to the right
- Reusable across many different route combinations

**Route Concepts:**
- Specific route combinations for specific positions
- Example: "Mesh" - two receivers cross at 5 yards
- Can apply to different formations

**Play Concepts:**
- Full plays including formation, routes, and blocking
- Example: "Power O" - complete run play concept
- Most comprehensive concept type

**Modifier Concepts:**
- Adjustments to base concepts (motion, shifts, tags)
- Example: "Jet Motion" - motion player across formation pre-snap
- Applied on top of base formation/route concepts
- Support formation-specific overrides (see [Modifiers](./modifiers.md))

## Why Use Concepts?

### Consistency

**Problem:** Recreating the same route combination from scratch leads to:
- Inconsistent spacing between plays
- Different route depths on same concept
- Players confused by slight variations

**Solution:** Concepts ensure identical geometry every time
- "Mesh" concept always has exact same spacing
- "Levels" concept always has same vertical distribution
- Players learn one route combination, run it from different formations

### Efficiency

**Without Concepts:**
1. Create play
2. Add 5 skill players
3. Draw 5 routes individually
4. Link routes to players
5. Repeat for next play with similar concept

**With Concepts:**
1. Create play
2. Apply "Mesh" concept
3. Players and routes appear instantly
4. Customize if needed

**Time Savings:** 5-10 minutes per play → 30 seconds per play

### Flexibility

**Concept Reusability:**
- Same route concept from different formations
- Same formation with different route concepts
- Mix and match concepts for play variations

**Example Workflow:**
1. Apply "Trips Right" formation concept
2. Apply "Levels" route concept to trips side
3. Apply "Stick" route concept to backside
4. Complete play in seconds, not minutes

## Concept Hierarchy

### Base Concepts

**Formations:**
- Starting point for most plays
- Define player alignment (trips, doubles, etc.)
- No route information

**Routes:**
- Individual route templates (post, corner, slant)
- See [Team Libraries](../playbook/team-libraries.md) for route templates

### Composite Concepts

**Route Combinations:**
- Multiple routes designed to work together
- "Mesh" - crossing routes at shallow depth
- "Flood" - 3-level vertical stretch to one side
- "Stick" - horizontal stretch with safety valve

**Full Plays:**
- Formation + routes + blocking
- "Power O" - I-formation + RB path + OL blocking scheme
- "Four Verticals" - Spread formation + 4 deep routes

### Modifier Concepts

**Adjustments to Base Concepts:**
- Motion (shift player pre-snap)
- Shifts (entire formation shifts)
- Tags (RPO tags, alerts)
- Protection adjustments

**Stacked Application:**
1. Base formation ("Trips Right")
2. Route concept ("Mesh")
3. Modifier ("Jet Motion")
4. Result: Complete play with pre-snap motion

## Creating Concepts

### From Existing Play

**Method 1: Multi-Selection**
1. Select players and routes on field
2. Multi-selection overlay appears
3. Click "Save as Concept"
4. Name concept and categorize
5. Concept saved to team library

**Method 2: Save Entire Play**
1. Complete play design
2. File menu → "Save as Concept"
3. Choose what to include:
   - Formation only
   - Routes only
   - Formation + routes (full play)
4. Name and save

### From Concept Library

**Method:** Create new concept from scratch

1. Open team settings → Concepts tab
2. Click "New Concept"
3. Choose type (formation, route combination, full play)
4. Add players and routes on mini-field
5. Name and save

### Concept Metadata

**Required Fields:**
- Name (e.g., "Mesh", "Trips Right")
- Type (formation, route, play, modifier)

**Optional Fields:**
- Description (coaching points, when to use)
- Tags (pass, run, RPO)
- Personnel requirement (11, 12, etc.)
- Down-and-distance recommendations

## Applying Concepts

### Add Component Tool (G)

**Process:**
1. Activate Add Component tool
2. Dialog opens with concept categories
3. Select concept
4. Click field to place
5. Concept players/routes appear

**Behavior:**
- Players placed relative to current hash position
- Routes linked to players automatically
- Editable after placement (customize as needed)

### Unified Search

**Status:** ✅ Implemented (December 2024)

**Process:**
1. Type concept name in unified search bar
2. Results appear (formations, concepts, groups ranked by frecency)
3. Select concept from results
4. Concept added as draggable chip
5. Chip automatically applies concept to canvas

See [Unified Search](./unified-search.md) for details.

### Drag and Drop (Future)

**Concept Palette:**
- Sidebar with frequently used concepts
- Drag concept onto field
- Drop to apply at current hash position

## Concept Groups

**Definition:** Collections of related concepts for organizing large libraries.

### Group Types

**By System:**
- "West Coast Passing" group
- "Air Raid Concepts" group
- "Zone Run Concepts" group

**By Situation:**
- "Red Zone Plays" group
- "Third Down Conversions" group
- "Two Minute Drill" group

**By Week:**
- "Week 1 Game Plan" group
- "Install Priorities" group

### Group Management

**Create Group:**
1. Select multiple concepts in library
2. Click "Create Group"
3. Name group
4. Group appears in concept library

**Apply Group:**
- Applying a group shows all concepts in group
- Quick access to related concepts
- Example: Apply "Red Zone Plays" group, see all red zone concepts

---

## Concept Storage

### Database Schema

**concepts Table:**
```sql
CREATE TABLE concepts (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  name VARCHAR(255),
  type VARCHAR(50),  -- formation, route, play, modifier
  description TEXT,
  personnel VARCHAR(10),
  data JSONB,  -- Players, routes, geometry
  preview_thumbnail TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**concept_groups Table:**
```sql
CREATE TABLE concept_groups (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**concept_group_members Table:**
```sql
CREATE TABLE concept_group_members (
  group_id UUID REFERENCES concept_groups(id),
  concept_id UUID REFERENCES concepts(id),
  sort_order INTEGER,
  PRIMARY KEY (group_id, concept_id)
);
```

### Data Structure

**Concept Data (JSONB):**
```json
{
  "players": [
    {
      "role": "x-receiver",
      "position": { "x": 10, "y": 0 },  // Relative to center
      "label": "X",
      "color": "#0000FF"
    }
  ],
  "routes": [
    {
      "playerRole": "x-receiver",
      "geometry": {
        "segments": [...],
        "style": "solid",
        "endStyle": "arrow"
      }
    }
  ],
  "blocking": [  // Optional, for run concepts
    {
      "from": "leftGuard",
      "to": { "x": 5, "y": 3 },
      "type": "drive"
    }
  ]
}
```

---

## Concept Customization

### After Application

**Problem:** Concept is 90% correct, needs small tweaks for specific play

**Solution:** Edit after application

**Workflow:**
1. Apply "Mesh" concept
2. Concept appears on field
3. Adjust depth of one route (drag control point)
4. Adjust player position (drag player)
5. Changes apply to this play only, original concept unchanged

### Save Variant

**Scenario:** Customized version useful for future plays

**Workflow:**
1. Apply base concept
2. Customize for specific situation
3. Save as new concept ("Mesh - Reduced Split")
4. Now have two variants in library

### Concept Inheritance (Future)

**Parent-Child Relationships:**
- "Mesh" is parent concept
- "Mesh - Reduced Split" is child variant
- Update parent, option to cascade to children

---

## Concept Validation

### Personnel Compatibility

**Check:** Does current personnel package support concept requirements?

**Example:**
- "Trips Right" requires 3 WRs
- Current personnel: 13 (1 WR)
- Validation: Warning - "Concept requires 3 WRs, current personnel has 1 WR"

**Resolution Options:**
- Change personnel package
- Modify concept (use TEs in WR positions)
- Override warning (for hybrid alignments)

### Formation Compatibility (Modifier Concepts)

**Check:** Does modifier have formation-specific override rules?

**Example:**
- "Jet Motion" modifier concept
- Formations: "Trips Right" vs "Doubles"
- Override: In "Trips Right", middle receiver motions; in "Doubles", slot motions

**See:** [Modifiers](./modifiers.md) for formation-specific override system

---

## Use Cases

### Install New Offense

**Traditional Method:**
1. Draw 50 plays from scratch
2. Teach players 50 different route combinations
3. Players confused by slight variations

**With Concepts:**
1. Define 8-10 core route concepts
2. Apply concepts to different formations
3. 50 plays built from same 10 concepts
4. Players learn 10 concepts, run from any formation

### Game Planning

**Scenario:** Opponent weak against flood concept

**Workflow:**
1. Search for "Flood" concept in library
2. Apply to multiple formations (trips, doubles, stack)
3. Create 5-6 variations in minutes
4. Teach players one concept, multiple looks

### Practice Planning

**Scenario:** Install "Mesh" concept this week

**Workflow:**
1. Create "Week 3 Install" concept group
2. Add all "Mesh" variations to group
3. Filter practice playbook to group
4. Practice all mesh plays in sequence

---

## Future Enhancements

### AI-Powered Concept Generation
- Describe concept in natural language
- AI generates route geometry
- Example: "Create 3-level vertical stretch with clearout route"

### Concept Analytics
- Track success rate of concepts
- Compare variants (which "Mesh" variant gains more yards?)
- Recommend concepts based on down-and-distance

### Community Concept Library
- Share concepts with other teams/coaches
- Download popular concepts from community
- Rate and review concepts

### Concept Versioning
- Track changes to concepts over time
- Revert to previous versions
- Branch concepts for experimentation

---

## See Also

- [Unified Search](./unified-search.md) - Searching and applying concepts
- [Modifiers](./modifiers.md) - Formation-specific modifier overrides
- [Team Libraries](../playbook/team-libraries.md) - Formation and route templates
- [Play Editor Overview](../play-editor/overview.md) - Concept application in editor
