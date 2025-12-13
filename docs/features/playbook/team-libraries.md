# Team Libraries & Templates

Each team maintains libraries for formations, personnel packages, and route templates that can be reused across playbooks.

## Overview

Team libraries provide reusable building blocks for play creation. Instead of recreating common formations or routes from scratch, coaches can save and apply templates that maintain consistency across the playbook.

## Formation Libraries

### Formation Templates

**Definition:** Saved player alignments that can be applied to any play.

**Components:**
- Player positions (relative to hash)
- Player labels (X, Y, Z, etc.)
- Player colors (for position groups)
- Spacing measurements

### Creating Formation Templates

**Method 1: Save from Play**
1. Arrange players on field in desired formation
2. Select all players (multi-select)
3. Click "Save as Formation" from multi-selection overlay
4. Name formation (e.g., "Trips Right")
5. Formation saved to team library

**Method 2: Formation Library Manager**
1. Open team settings
2. Navigate to "Formations" tab
3. Click "New Formation"
4. Add players and arrange on mini-field
5. Name and save formation

### Formation Properties

**Metadata:**
- Name (e.g., "I-Formation", "Shotgun Spread")
- Description (optional)
- Personnel requirement (e.g., "11 personnel")
- Tags (run, pass, balanced)
- Preview thumbnail

**Relative Positioning:**
- All positions stored relative to center (middle lineman)
- Hash-agnostic (adapts to Left/Middle/Right hash)
- Formation maintains spacing when hash changes

### Applying Formations

**Method 1: Add Component Tool (G)**
1. Activate Add Component tool
2. Select "Formations" tab in dialog
3. Click desired formation
4. Formation players appear on field at current hash position

**Method 2: Unified Search**
1. Type formation name in unified search
2. Select from results
3. Drag formation chip onto canvas
4. Formation auto-applies

**Auto-Population:**
- Players placed relative to current hash alignment
- Default offensive linemen remain (formation adds skill players)
- If formation includes linemen spacing, adjust default line

### Formation Versioning (Future)

**Scenario:** Formation evolves over season

- Save formation variants (e.g., "Trips Right v1", "Trips Right v2")
- Track which plays use which version
- Update all plays using a formation (bulk update)

---

## Personnel Packages

### Predefined Personnel

**Standard Packages:**
- 11: 1 RB, 1 TE, 3 WR
- 10: 1 RB, 0 TE, 4 WR
- 12: 1 RB, 2 TE, 2 WR
- 13: 1 RB, 3 TE, 1 WR
- 21: 2 RB, 1 TE, 2 WR
- 22: 2 RB, 2 TE, 1 WR

**Visual Indicators:**
- Color coding by position type
- WR: Blue
- RB: Green
- TE: Red
- QB: Gold

### Custom Personnel Packages

**Creation:**
1. Open team settings → Personnel tab
2. Click "New Package"
3. Define package composition:
   - Number of RBs
   - Number of TEs
   - Number of WRs
   - Other positions (H-Back, Fullback, etc.)
4. Name package (e.g., "Jumbo", "Empty")
5. Save to team library

**Examples:**
- **Jumbo:** 2 RB, 3 TE, 0 WR (goal line package)
- **Empty:** 1 RB, 0 TE, 4 WR (RB in backfield, no tight end)
- **Wildcat:** 0 QB, 2 RB, 1 TE, 2 WR (direct snap to RB)

### Package Validation

**Formation-Personnel Compatibility:**
- Formation requires specific positions
- Warning if personnel package doesn't provide required positions
- Example: "Trips Right" requires 3 WRs, incompatible with 13 personnel (1 WR)

**Validation on Apply:**
1. User selects formation
2. System checks current personnel package
3. If incompatible, suggests compatible packages
4. Option to override (for custom/hybrid alignments)

---

## Route Templates

### Route Template Library

**Definition:** Pre-defined routes with exact geometry, depth, and styling.

**Components:**
- Route path (segments and control points)
- Depth markers (5 yards, 12 yards, etc.)
- Break angles (45°, 90°, etc.)
- Default styling (color, thickness, end style)

### Basic Route Tree Templates

Standard routes from the basic route tree (see [Toolbar Tools](../play-editor/toolbar-tools.md)):

| Number | Route | Depth | Break Angle | End Style |
|--------|-------|-------|-------------|-----------|
| 1 | Flat | 0-2 yards | Horizontal | Arrow |
| 2 | Slant | 5-7 yards | 45° inside | Arrow |
| 3 | Comeback | 12-15 yards | 180° to QB | T-shape |
| 4 | Curl | 10-12 yards | 180° to QB | T-shape |
| 5 | Out | 10-15 yards | 90° outside | Arrow |
| 6 | Dig | 12-15 yards | 90° inside | Arrow |
| 7 | Corner | 12-15 yards | 45° outside | Arrow |
| 8 | Post | 12-15 yards | 45° inside | Arrow |
| 9 | Go | 20+ yards | Vertical | Arrow |

### Custom Route Templates

**Creation:**
1. Draw route on field
2. Adjust control points for exact geometry
3. Set route properties (depth, break angle, styling)
4. Select route with Select tool
5. Click "Save as Route Template"
6. Name route and add to library

**Custom Route Examples:**
- **Wheel:** RB releases flat then vertical up sideline
- **Sail:** 3-level vertical stretch (flat, 12-yard, deep)
- **Mesh:** Shallow cross with traffic
- **Whip:** Quick out-and-up

### Route Depth Customization

**Problem:** Different offenses use different route depths

**Solution:** Team-specific route depth preferences

**Example:**
- Team A's "Curl" is 10 yards
- Team B's "Curl" is 12 yards
- Same route name, different template geometry

**Implementation:**
1. Override default route depths in team settings
2. Templates instantiate with team-preferred depths
3. Consistent play-to-play depth across playbook

### Instantiating Route Templates

**Method 1: Route Tool (R)**
1. Activate Route tool
2. Select route from route tree dialog
3. Click player to assign route
4. Template geometry applied
5. Route linked to player automatically

**Method 2: Drag from Library**
1. Open route library (future)
2. Drag route template onto field
3. Click player to link
4. Route appears with template geometry

**Customization After Instantiation:**
- Adjust control points to fit specific play
- Change depth (drag break point)
- Change styling (color, thickness)
- Original template unchanged

---

## Team Position Labels

### Role Terminology System

**Status:** ✅ Implemented (December 2024)

**Purpose:** Customize position labels to match team's coaching terminology.

**Default Systems:**

**West Coast:**
- X, Y, Z, A, B, Q

**Air Raid:**
- X, Y, Z, F, T, Q

**Custom:**
- Define your own labels

### Setting Up Role Terminology

**Location:** Team settings → Role Terminology

**Process:**
1. Choose base system (West Coast, Air Raid, Custom)
2. If custom, define labels for each role:
   - Outside WR: "Split End", "SE", "1", etc.
   - Slot WR: "Slot", "Inside", "2", etc.
   - TE: "Y", "Tight End", "TE", etc.
   - RB: "Tailback", "Running Back", "R", etc.
   - QB: "Quarterback", "Q", "QB", etc.
3. Save to team

**Persistence:**
- Applies to all playbooks in team
- Players labeled with custom terminology
- Formations use custom labels
- Concepts reference custom roles

### API Endpoints

#### Get Role Terminology
**Endpoint:** `GET /api/teams/:teamId/roles`

**Response:**
```json
[
  {
    "roleId": "x-receiver",
    "defaultLabel": "X",
    "customLabel": "Split End"
  },
  {
    "roleId": "y-receiver",
    "defaultLabel": "Y",
    "customLabel": "Slot"
  }
]
```

#### Update Role Terminology
**Endpoint:** `PUT /api/teams/:teamId/roles`

**Request Body:**
```json
[
  {
    "roleId": "x-receiver",
    "customLabel": "Split End"
  },
  {
    "roleId": "y-receiver",
    "customLabel": "Slot"
  }
]
```

**Response:** Updated role terminology

### Database Schema

```sql
CREATE TABLE role_terminology (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  role_id VARCHAR(50),
  custom_label VARCHAR(50),
  UNIQUE (team_id, role_id)
);
```

### Use Cases

**Alignment with Team Playbook:**
- Physical playbook uses "Split End" not "X"
- Match digital playbook to paper playbook
- Consistency for players learning plays

**Level-Appropriate Terminology:**
- Youth teams: "Wide Receiver 1" instead of "X"
- College/Pro: Position-specific codes

**Coaching Philosophy:**
- Different systems have different naming conventions
- Customize to match head coach's preferred terminology

---

## Library Management

### Team Library Access

**Permissions:**
- **Owners:** Full CRUD on all library items
- **Editors:** Can create, use, modify own items
- **Viewers:** Can view and use items, cannot modify

### Library Organization

**Categories:**
- Formations (personnel alignments)
- Routes (individual route templates)
- Concepts (multi-player route combinations)
- Personnel Packages (custom packages)
- Route Depths (team depth preferences)

**Search and Filter:**
- Search by name
- Filter by category (formations vs routes)
- Filter by personnel (11, 12, etc.)
- Filter by tags (run, pass, RPO)

### Library Sharing (Future)

**Cross-Team Libraries:**
- Share formation library with other teams
- Import community formations
- Export library for backup

**Version Control:**
- Track changes to formations/routes
- Revert to previous versions
- Branch libraries for experimentation

---

## Technical Implementation

### Repository Pattern

**FormationRepository:** `src/db/repositories/FormationRepository.ts`

**Methods:**
- `create(teamId, formationData)` - Save new formation
- `findByTeam(teamId)` - List team formations
- `update(formationId, data)` - Update formation
- `delete(formationId)` - Remove formation

**RouteTemplateRepository:** `src/db/repositories/RouteTemplateRepository.ts`

**Methods:**
- `create(teamId, routeData)` - Save route template
- `findByTeam(teamId)` - List team routes
- `instantiate(routeId, playerId)` - Create route from template

**RoleTerminologyRepository:** `src/db/repositories/RoleTerminologyRepository.ts`

**Methods:**
- `findByTeam(teamId)` - Get custom terminology
- `upsert(teamId, roleId, customLabel)` - Update terminology

### Database Schema

**formations Table:**
```sql
CREATE TABLE formations (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  name VARCHAR(255),
  description TEXT,
  personnel VARCHAR(10),
  player_positions JSONB,  -- Array of {x, y, label, color}
  preview_thumbnail TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**route_templates Table:**
```sql
CREATE TABLE route_templates (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  name VARCHAR(255),
  route_number INTEGER,  -- 1-9 for basic routes
  geometry JSONB,  -- Path segments and control points
  default_style JSONB,  -- Color, thickness, end style
  depth INTEGER,  -- In yards
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Future Enhancements

### Concept Groups
- Save multi-route concepts (e.g., "Mesh Concept")
- Include multiple players and routes
- Apply entire concept to formation

### Formation Validation
- Check formation legality (7 on line, etc.)
- Warn if formation violates rules
- Auto-adjust to legal alignment

### Route Combination Templates
- Save common route combinations (e.g., "Levels", "Flood")
- Apply to specific positions (X runs post, Y runs dig)
- Concept library built from route templates

### Import/Export Libraries
- Export team library as JSON
- Import formations from other teams
- Community library marketplace

---

## See Also

- [Management](./management.md) - Playbook CRUD operations
- [Toolbar Tools](../play-editor/toolbar-tools.md) - Route tool and component tool
- [Concepts Overview](../concepts/overview.md) - Concept system and application
- [Player Management](../play-editor/player-management.md) - Player positioning
