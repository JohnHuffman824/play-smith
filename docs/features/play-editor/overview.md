# Play Editor Overview

The play editor is the main workspace for creating and editing individual football plays. It provides a comprehensive interface combining the whiteboard canvas, toolbar, input fields, and organizational features.

## Layout Structure

### Spatial Organization

```
+------------------------------------------------------+
|  Unified Search (Formations/Concepts/Groups)         |
+------------------------------------------------------+
|  [Formation] [Play] [Personnel ▼] [Def Formation]   |
+------------------------------------------------------+
|  Tags: [Short Yardage] [Redzone] [+ Add Tag]        |
+------------------------------------------------------+
| T |                                                   |
| o |           Whiteboard Canvas                      |
| o |           (with field markings,                  |
| l |            players, routes)                      |
| b |                                                   |
| a |                                                   |
| r |                                                   |
+---+--------------------------------------------------+
|  Play Cards (horizontal scroll) [+ Add Play]        |
+------------------------------------------------------+
```

### Component Zones

**Left Side:** Toolbar with tool icons (vertical)
**Top:** Unified search bar for formations/concepts/groups
**Above Whiteboard:** Four input fields + tags row
**Center:** Whiteboard canvas (primary workspace)
**Below Whiteboard:** Play cards section (scrollable, collapsible)

## Input Fields

Four text inputs positioned above the whiteboard provide metadata for each play:

### 1. Formation
**Purpose:** Identifies offensive player alignment
**Placeholder:** "Formation"
**Initial State:** Empty
**Examples:** "Trips Right", "I-Formation", "Shotgun Spread"

### 2. Play
**Purpose:** Name or identifier for the play
**Placeholder:** "Play"
**Initial State:** Empty
**Examples:** "Z Post", "Power Left", "Y Shallow Cross"

### 3. Personnel (Dropdown)
**Purpose:** Defines offensive personnel package
**Default:** "Any"
**Preset Options:**
- Any (default - play works with any package)
- 11 (1 RB, 1 TE, 3 WR)
- 10 (1 RB, 0 TE, 4 WR)
- 12 (1 RB, 2 TE, 2 WR)
- 13 (1 RB, 3 TE, 1 WR)
- 21 (2 RB, 1 TE, 2 WR)
- 22 (2 RB, 2 TE, 1 WR)

**Custom Packages:**
- Users can create custom personnel packages
- Custom packages persist per team
- Example: "Jumbo" (3 TE, 2 RB, 0 WR)

### 4. Defensive Formation
**Purpose:** Expected or targeted defensive alignment
**Placeholder:** "Defensive Formation"
**Initial State:** Empty
**Examples:** "Cover 2", "4-3 Under", "Nickel Blitz"

### Input Behavior

**Auto-Save:**
- All inputs auto-save on blur (when user clicks away)
- No manual save button required
- Changes persist immediately to database

**Validation:**
- Formation: Optional, free text
- Play: Optional, free text
- Personnel: Must select from dropdown or create custom
- Defensive Formation: Optional, free text

## Tags System

Tags are color-coded labels used to categorize plays by situation, down-and-distance, or custom groupings.

### Visual Behavior

**Horizontal Flow:**
- Tags fill left to right as colored rounded rectangles
- "Add Tag" button appears at the end
- Tooltip below "Add Tag" button provides context

**Tag Interaction:**
- **Click tag:** No action (tags are labels, not filters in this context)
- **Hover tag:** Reveals X button to remove
- **Click X:** Removes tag from play

### Preset Tags

Pre-defined tags available to all teams:

| Tag Name | Color | Use Case |
|----------|-------|----------|
| Short Yardage | Green | 3rd/4th and short situations |
| Mid Yardage | Yellow | Moderate distance (4-7 yards) |
| Long Yardage | Orange | Long distance (8+ yards) |
| Redzone | Red | Inside opponent's 20-yard line |

### Custom Tags

**Creation Process:**
1. Click "Add Tag" button
2. Dialog opens with:
   - Preset tags (quick select)
   - Custom tag creation section
3. For custom tags:
   - Color picker (HSL or preset palette)
   - Name input field
4. Click "Create" or select preset

**Persistence:**
- Preset tags: Global across all teams
- Custom tags: Team-specific
- Custom tags appear in tag selector for all playbooks in the team

**Use Cases:**
- Situation-specific: "Goal Line", "Two Minute", "Trick Play"
- Game plan: "Week 1 vs Eagles", "Opponent Weakness"
- Practice: "Install Priority", "Needs Reps"

### Tag Display on Play Cards

Tags appear as colored chips on play cards in:
- Play cards section (below whiteboard)
- Playbook manager grid/list view
- Search results

**Visual Consistency:**
- Same colors across all views
- Same rounded rectangle style
- Abbreviated on small cards, full text on hover

## Play Cards Section

**Status:** ✅ Implemented (December 2024)

The play cards section provides quick access to all plays in the current playbook while editing.

### Layout

**Position:** Below whiteboard canvas
**Orientation:** Horizontal scroll (no vertical scroll)
**Height:** 340px when visible, 0px when hidden
**Content:** All plays in playbook except currently open play

### Play Card Components

**Card Appearance:**
- Thumbnail of play (field with routes rendered)
- Play name
- Formation and personnel
- Tags (color-coded chips)
- Last modified date

**Interaction:**
- **Click card:** Auto-save current play, load clicked play
- **Hover card:** Subtle elevation/shadow effect
- **Right-click card:** Context menu (duplicate, delete, etc.) - future

### Add Play Button

**Position:** Far right of play cards (after last card)
**Height:** 283px (matches card height)
**Icon:** Plus (+) symbol

**Behavior:**
1. Click "Add Play"
2. Current play auto-saves
3. New blank play created
4. Editor switches to new play
5. New play card appears in play cards section

### Visibility Toggle

Controlled by Hide/Show Play Bar tool (see [Toolbar Tools](./toolbar-tools.md)).

**Show Animation (800ms ease-in-out):**
1. Container height animates from 0px to 340px
2. Play cards drift up onto screen from bottom
3. Whiteboard canvas contracts from top
4. All canvas elements (players, routes) move down smoothly

**Hide Animation (800ms ease-in-out):**
1. Container height animates from 340px to 0px
2. Play cards drift down off screen
3. Whiteboard canvas expands from top
4. All canvas elements move up smoothly

### Technical Implementation

**Height Calculation:**
```css
.whiteboard-canvas {
  height: calc(100vh - Xpx);
}

/* X = toolbar + inputs + tags + (play cards if visible) */
/* Play cards visible: X = ~200px + 340px = 540px */
/* Play cards hidden: X = ~200px */
```

**Performance Optimization:**

**Delayed Unmount:**
- Content stays rendered during hide animation
- 800ms delay before unmounting
- Ensures smooth visual transition

**Unmount After Animation:**
- Content unmounts after animation completes
- Reduces computational load for plays with many players/routes
- Re-renders when play cards become visible again

**Rendering Strategy:**
```typescript
const [isVisible, setIsVisible] = useState(true);
const [shouldRender, setShouldRender] = useState(true);

// On hide: animate first, unmount after
const handleHide = () => {
  setIsVisible(false);
  setTimeout(() => setShouldRender(false), 800);
};

// On show: render immediately, then animate
const handleShow = () => {
  setShouldRender(true);
  setTimeout(() => setIsVisible(true), 0);
};
```

## Canvas Height Adjustment

The whiteboard canvas dynamically adjusts height based on UI state:

**Components Affecting Height:**
- Top bar (unified search): ~60px
- Input fields row: ~50px
- Tags row: ~40px
- Play cards section: 340px (when visible) or 0px (when hidden)
- Toolbar: Full viewport height (doesn't affect canvas height)

**Calculation:**
```
Canvas Height = 100vh - (top bar + inputs + tags + play cards)
Canvas Height (cards visible) = 100vh - (60px + 50px + 40px + 340px) = calc(100vh - 490px)
Canvas Height (cards hidden) = 100vh - (60px + 50px + 40px + 0px) = calc(100vh - 150px)
```

**Animation Transition:**
- Smooth 800ms ease-in-out on height change
- Whiteboard content scales proportionally during transition
- Field markings and elements maintain relative positions

## Persistence

### Load Play
**Endpoint:** `GET /api/plays/{id}`

**Response:**
```json
{
  "id": "play-uuid",
  "name": "Z Post",
  "formation": "Trips Right",
  "personnel": "11",
  "defensiveFormation": "Cover 2",
  "hashAlignment": "middle",
  "tags": ["short-yardage", "redzone"],
  "players": [...],
  "drawings": [...]
}
```

### Save Play
**Endpoint:** `PUT /api/plays/{id}`

**Request Body:**
```json
{
  "name": "Z Post",
  "formation": "Trips Right",
  "personnel": "11",
  "defensiveFormation": "Cover 2",
  "hashAlignment": "middle",
  "tags": ["short-yardage", "redzone"],
  "players": [...],
  "drawings": [...]
}
```

**Auto-Save Triggers:**
- Input field blur
- Tag add/remove
- Hash alignment change
- Player add/move/delete
- Drawing create/modify/delete
- Before switching plays (via play cards or navigation)

### Delete Play
**Endpoint:** `DELETE /api/plays/{id}`

**Post-Delete Behavior:**
1. Play deleted from database
2. Navigate to playbook manager
3. Show confirmation toast
4. Undo option (30-second window) - future

## See Also

- [Toolbar Tools](./toolbar-tools.md) - Complete tool reference
- [Drawing System](./drawing-system.md) - Drawing mechanics and player linking
- [Player Management](./player-management.md) - Default linemen and positioning
- [Keyboard Shortcuts](./keyboard-shortcuts.md) - Editor keyboard shortcuts
- [Playbook Management](../playbook/management.md) - Playbook-level operations
