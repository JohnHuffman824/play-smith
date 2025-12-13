# Modifier Overrides

**Status:** ✅ Implemented (December 2024)

Modifier overrides allow formation-specific adjustments to modifier concept behavior, enabling fine-tuned control over how pre-snap adjustments (motion, shifts, tags) apply differently based on formation context.

## Overview

Modifiers are concept types that adjust or enhance base formations and route concepts. Examples include:

- **Motion:** Pre-snap player movement
- **Shifts:** Formation-wide position changes
- **Tags:** RPO reads, hot routes, alerts
- **Protection Adjustments:** Slide protection, max protect

The modifier override system recognizes that the **same modifier means different things in different formations**.

## The Problem

### Example: Jet Motion

**Scenario:** Coach calls "Jet Motion Left"

**In Trips Right Formation:**
- Middle receiver (#2) motions across
- Creates bunch look on left side
- Spacing: receivers compressed

**In Doubles Formation:**
- Slot receiver motions across
- Creates trips look on opposite side
- Spacing: receivers spread

**Without Overrides:**
- Must create separate modifiers: "Jet Motion (Trips)", "Jet Motion (Doubles)"
- Duplication, confusion, maintenance burden

**With Overrides:**
- One "Jet Motion" modifier
- Formation-specific rules define which player moves
- Automatic application based on detected formation

## Modifier Override Features

### Formation-Specific Rules

**Define Override for Each Formation:**

**Base Modifier:** "Jet Motion"
- Default: Slot receiver (#2) motions across formation

**Override for "Trips Right":**
- Player: Middle receiver (#2 in trips)
- Motion path: Shallow crossing route
- End position: Offset slot on opposite side

**Override for "Doubles":**
- Player: Slot receiver (#1 slot)
- Motion path: Flat to opposite side
- End position: Third receiver in trips look

**Override for "I-Formation":**
- Player: Tailback
- Motion path: Jet sweep path
- End position: Slot position wide

### Context-Aware Application

**Formation Detection:**
1. User applies formation concept (e.g., "Trips Right")
2. Formation stored in play metadata
3. When modifier applied, system checks formation
4. If override exists for formation, use override rules
5. Otherwise, use default modifier behavior

**Automatic Override Selection:**
- No manual selection required
- System automatically picks correct override
- Transparent to user (just works)

## API Endpoints

### List Overrides for Modifier

**Endpoint:** `GET /api/modifiers/:modifierId/overrides`

**Response:**
```json
{
  "modifierId": "jet-motion-uuid",
  "modifierName": "Jet Motion",
  "overrides": [
    {
      "id": "override-uuid-1",
      "formationId": "trips-right-uuid",
      "formationName": "Trips Right",
      "rules": {
        "playerRole": "slot-2",
        "motionPath": {
          "type": "crossing",
          "depth": 5,
          "direction": "left"
        },
        "endPosition": { "x": -15, "y": 0 }
      },
      "createdAt": "2024-12-01T10:00:00Z"
    },
    {
      "id": "override-uuid-2",
      "formationId": "doubles-uuid",
      "formationName": "Doubles",
      "rules": {
        "playerRole": "slot-1",
        "motionPath": {
          "type": "flat",
          "depth": 2,
          "direction": "left"
        },
        "endPosition": { "x": -20, "y": 0 }
      },
      "createdAt": "2024-12-01T10:05:00Z"
    }
  ]
}
```

### Create Override

**Endpoint:** `POST /api/modifiers/:modifierId/overrides`

**Request Body:**
```json
{
  "formationId": "trips-right-uuid",
  "rules": {
    "playerRole": "slot-2",
    "motionPath": {
      "type": "crossing",
      "depth": 5,
      "direction": "left"
    },
    "endPosition": { "x": -15, "y": 0 }
  }
}
```

**Response:** Created override object

**Validation:**
- Formation must exist
- One override per formation per modifier
- Rules must be valid JSON structure

### Update Override

**Endpoint:** `PUT /api/modifier-overrides/:id`

**Request Body:**
```json
{
  "rules": {
    "playerRole": "slot-2",
    "motionPath": {
      "type": "orbit",
      "depth": 8,
      "direction": "left"
    },
    "endPosition": { "x": -12, "y": -3 }
  }
}
```

**Response:** Updated override object

### Delete Override

**Endpoint:** `DELETE /api/modifier-overrides/:id`

**Response:** 204 No Content

**Behavior:**
- Override deleted
- Modifier reverts to default behavior for that formation
- Plays using override: modifier still applies (uses default, not override)

## Database Schema

### modifier_overrides Table

```sql
CREATE TABLE modifier_overrides (
  id UUID PRIMARY KEY,
  modifier_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  formation_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  rules JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (modifier_id, formation_id)
);
```

**Indexes:**
- `modifier_id` for listing overrides by modifier
- `formation_id` for finding modifiers with overrides for a formation
- Unique constraint prevents duplicate overrides

**Cascade Behavior:**
- Delete modifier → all overrides deleted
- Delete formation → overrides for that formation deleted

### Rules JSONB Structure

**Flexible Schema for Different Modifier Types:**

**Motion Modifiers:**
```json
{
  "playerRole": "slot-2",
  "motionPath": {
    "type": "crossing" | "flat" | "orbit" | "sweep",
    "depth": 5,
    "direction": "left" | "right"
  },
  "endPosition": { "x": -15, "y": 0 },
  "timing": "pre-snap"
}
```

**Shift Modifiers:**
```json
{
  "affectedPlayers": ["slot-1", "slot-2", "x-receiver"],
  "shiftDirection": "left",
  "shiftDistance": 5,
  "timing": "on-cadence"
}
```

**Tag Modifiers (RPO, Hot Route):**
```json
{
  "triggerRole": "quarterback",
  "readKey": "outside-linebacker",
  "hotRoute": {
    "playerRole": "x-receiver",
    "routeChange": "slant" | "fade" | "stop"
  }
}
```

## Technical Implementation

### ModifierOverrideRepository

**Location:** `src/db/repositories/ModifierOverrideRepository.ts`

**Key Methods:**

```typescript
class ModifierOverrideRepository {
  // Create new override
  async create(modifierId: string, formationId: string, rules: object): Promise<ModifierOverride>

  // Find override for specific modifier-formation pair
  async findByModifierAndFormation(modifierId: string, formationId: string): Promise<ModifierOverride | null>

  // List all overrides for a modifier
  async findByModifier(modifierId: string): Promise<ModifierOverride[]>

  // Update override rules
  async update(overrideId: string, rules: object): Promise<ModifierOverride>

  // Delete override
  async delete(overrideId: string): Promise<void>
}
```

### Concept Application Engine

**Override Resolution Logic:**

```typescript
async function applyModifier(play, modifier) {
  // 1. Detect current formation
  const currentFormation = play.formation;

  // 2. Check for override
  const override = await ModifierOverrideRepository.findByModifierAndFormation(
    modifier.id,
    currentFormation.id
  );

  // 3. Apply override rules or default
  if (override) {
    applyOverrideRules(play, modifier, override.rules);
  } else {
    applyDefaultModifier(play, modifier);
  }
}
```

**Rule Application:**

```typescript
function applyOverrideRules(play, modifier, rules) {
  // Find player by role
  const player = play.players.find(p => p.role === rules.playerRole);

  // Create motion path
  const motionPath = createMotionPath(
    player.position,
    rules.motionPath,
    rules.endPosition
  );

  // Add motion to play
  play.motions.push({
    playerId: player.id,
    path: motionPath,
    timing: rules.timing || 'pre-snap'
  });
}
```

## Creating Overrides

### UI Workflow

**Location:** Team Settings → Modifiers Tab

**Process:**

1. **Select Modifier:**
   - List of team modifiers
   - Click modifier to view/edit overrides

2. **View Existing Overrides:**
   - Table showing formation-override pairs
   - Preview of override rules
   - Edit/Delete actions

3. **Create New Override:**
   - Click "Add Override"
   - Select formation from dropdown
   - Define rules:
     - Which player to affect (role selector)
     - How to modify (motion path, shift, tag)
     - Positioning (visual editor or coordinates)
   - Save override

4. **Visual Editor (Future):**
   - Mini-field showing formation
   - Drag player to show motion path
   - Path auto-converts to override rules

### Rule Definition

**Motion Path Editor:**
- Start position (player's current position)
- Path type (crossing, flat, orbit, sweep)
- End position (visual or coordinate input)
- Depth/timing controls

**Shift Editor:**
- Select affected players (multi-select)
- Direction and distance sliders
- Preview shift on mini-field

**Tag Editor:**
- Define read key (player or defender)
- Define conditional route changes
- Set priority (primary read, secondary read)

## Use Cases

### West Coast Offense Example

**Base Concept:** "Y-Cross"

**In "Doubles" Formation:**
- Y (TE) crosses at 5-7 yards
- Flat route by Z (slot) underneath

**In "Trips" Formation:**
- Y (TE) crosses at 10-12 yards (deeper to clear traffic)
- Flat route by #3 receiver (instead of slot)

**Override:**
- Formation: "Trips"
- Rule: Increase Y-Cross depth to 10-12 yards, assign flat to #3

### RPO Example

**Base Modifier:** "RPO Slant Alert"

**In "Shotgun Spread":**
- Read: Playside linebacker
- Hot route: X runs slant if LB crashes

**In "Pistol":**
- Read: Safety (different alignment)
- Hot route: Slot runs slant (not X)

**Override:**
- Formation: "Pistol"
- Rule: Change read key to safety, change hot route to slot

### Motion Example

**Base Modifier:** "Orbit Motion"

**In "Empty" Formation:**
- RB orbits from backfield to slot
- End position: Wide slot

**In "Trips":**
- #3 receiver orbits behind trips
- End position: Opposite slot

**Override:**
- Formation: "Trips"
- Rule: Player = #3 receiver, orbit path behind trips, end opposite side

## Benefits

### Reduced Duplication

**Before Overrides:**
- "Jet Motion (Trips)"
- "Jet Motion (Doubles)"
- "Jet Motion (I-Formation)"
- 3 separate modifiers, 3× maintenance

**With Overrides:**
- 1 "Jet Motion" modifier
- 3 overrides (one per formation)
- Single source of truth, easier maintenance

### Improved Clarity

**Coach's Perspective:**
- Call "Jet Motion" regardless of formation
- System handles formation-specific adjustments
- Consistent terminology across formations

**Player's Perspective:**
- Learn one concept name
- Execution varies by formation (as coached)
- Natural mapping to on-field coaching

### Flexibility

**Easy Adjustments:**
- Change motion depth for one formation
- Doesn't affect other formations
- No risk of breaking unrelated plays

**Experimentation:**
- Try different motion paths in different formations
- A/B test override variations
- Roll back if not effective

## Future Enhancements

### Automatic Override Suggestions

**AI-Powered Recommendations:**
- Detect repeated manual adjustments
- Suggest creating override
- Example: "You've changed slot-2 to slot-3 motion in Trips 5 times. Create override?"

### Override Templates

**Common Patterns:**
- "Motion Outside Receiver" template
- "Shift to Trips" template
- "Max Protect" template
- One-click apply, customize as needed

### Conditional Overrides

**Multiple Conditions:**
- Formation + Personnel + Down-and-Distance
- Example: "Jet Motion" in "Trips Right" + "11 personnel" + "3rd & Long"
- More specific overrides take precedence

### Override Analytics

**Track Effectiveness:**
- Success rate by override
- Compare default vs override performance
- Data-driven override refinement

---

## See Also

- [Concepts Overview](./overview.md) - Concept system fundamentals
- [Unified Search](./unified-search.md) - Applying modifiers via search
- [Team Libraries](../playbook/team-libraries.md) - Formation templates
- [Play Editor Overview](../play-editor/overview.md) - Modifier application in editor
