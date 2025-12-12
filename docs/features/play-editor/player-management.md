# Player Management

Players are the fundamental components representing offensive and defensive personnel on the whiteboard. The system includes default offensive linemen that auto-populate on each play, plus the ability to add custom skill position players.

## Default Offensive Linemen

Every play automatically includes 5 offensive linemen that cannot be removed but can be repositioned.

### Linemen Specifications

**Visual Representation:**
- 2-foot radius circles (6 pixels at default zoom)
- Default color: Team color (customizable per player)
- Arranged horizontally with 1-foot spacing

**Positions (Left to Right):**
1. Left Tackle
2. Left Guard
3. Center (middle lineman)
4. Right Guard
5. Right Tackle

**Spacing:**
- 1 foot between each lineman (edge to edge, not center to center)
- Total formation width: ~14 feet (5 players × 2ft radius + 4 gaps × 1ft)

### Default Positioning

**Center Alignment:**
- Center (middle lineman) placed at field center by default
- Other linemen spaced evenly on either side
- Formation centered on chosen hash position

**Hash Alignment:**
- Default: Middle (field center at 80 feet from left edge)
- Adjustable via Ball on Hash tool (see [Toolbar Tools](./toolbar-tools.md))
- Entire line shifts together when hash changes

### Linemen Constraints

**Cannot Be Deleted:**
- All 5 linemen are permanent on each play
- Represents fundamental football requirement (must have offensive line)
- Can be moved individually, but not removed

**Can Be Modified:**
- Individual movement (drag with Select tool)
- Color customization (via player dialog)
- Custom labels (position names, player names)
- Link to blocking scheme drawings

## Hash Alignment System

Controls horizontal placement of the offensive line across the field width.

### Hash Positions

**Left Hash:**
- Center positioned at 60 feet from left edge
- Line shifted left, more space to right (field side)

**Middle (Default):**
- Center positioned at 80 feet from left edge (field center)
- Equal space to both sidelines
- Standard for neutral field position

**Right Hash:**
- Center positioned at 100 feet from left edge
- Line shifted right, more space to left (field side)

### Hash Change Behavior

**Ball on Hash Tool (H):**
1. Open hash dialog
2. Select Left, Middle, or Right
3. All 5 linemen shift together
4. Center moves to new hash position
5. Spacing maintained (1 foot between linemen)

**Skill Player Movement:**

Controlled by "Move Skills on Hash Change" setting:

**Setting: Yes (Default)**
- All players move with linemen
- Formation maintains shape and spacing
- Relative positions preserved

**Setting: No**
- Only linemen move
- Skill players stay at original field positions
- Formation shape changes

**Use Cases:**
- **Yes:** Formation-relative plays (trips, bunch, stack)
- **No:** Field-relative plays (boundary/field concepts, specific yard line targets)

## Adding Players

### Add Player Tool (A)

**Process:**
1. Activate Add Player tool (or press A)
2. Click canvas to place player at cursor position
3. Or activate tool without clicking to place at screen center

**Default Player Properties:**
- Radius: 2 feet (same as linemen)
- Color: Current selected color (or team default)
- Label: Empty (add via player dialog)
- Position: Offensive (defensive players - future)

### Player Placement Strategies

**Relative to Line:**
- Place receivers/backs relative to linemen position
- Accounts for hash alignment
- Maintains formation integrity on hash changes (if setting enabled)

**Absolute Field Position:**
- Place at specific yard line or hash mark
- Independent of linemen positioning
- Useful for defensive alignments (future)

## Player Customization

### Player Dialog

Opens when player selected with Select tool (click player twice).

**Dialog Elements:**

**Custom Text Input:**
- Position label (X, Y, Z, slot, etc.)
- Player name (#12, "Smith")
- Or blank (no label displayed)

**Color Picker:**
- Change player circle fill color
- Differentiate positions (WR, RB, TE)
- Match team color scheme

**Unlink Button (if linked to drawing):**
- Appears beside custom text input
- Removes player-drawing link
- See [Drawing System](./drawing-system.md) for linking details

**Delete Button (if not a default lineman):**
- Removes player from play
- Cannot delete 5 default offensive linemen
- Confirmation dialog if player linked to drawing

### Player Labels

**Display:**
- Text appears inside or beside player circle
- Font size scales with zoom level
- Color: Black or white (auto-contrast with player color)

**Common Labels:**
- Position letters: X, Y, Z, A, B, Q (West Coast)
- Position letters: X, Y, Z, F, T, Q (Air Raid)
- Position names: Split End, Slot, RB, TE
- Player numbers: #12, #7
- Custom terminology per team (see Role Terminology in [Toolbar Tools](./toolbar-tools.md))

## Player Movement

### Individual Movement

**Drag Player:**
1. Select tool (S)
2. Click and hold player
3. Drag to new position
4. Release to place

**Snap to Grid:**
- If snap distance > 0 (see Settings)
- Players snap to yard lines, hash marks
- Helps align formations precisely

### Linked Movement

**Player Linked to Drawing:**
- Dragging player moves linked drawing's control point
- Dragging linked control point moves player
- Bidirectional synchronization
- See [Drawing System](./drawing-system.md) for details

## Multi-Player Selection

### Selection Rectangle

1. Select tool (S)
2. Click and drag on canvas (not on player)
3. Rectangle appears
4. All players within rectangle selected
5. Release to complete selection

### Multi-Selection Actions

**Move Together:**
- Drag any selected player
- All selected players move maintaining relative positions

**Save as Concept:**
- Multi-selection overlay appears
- "Save selection as concept" button
- Creates formation or concept (see [Concepts Overview](../concepts/overview.md))

**Delete Selection:**
- Multi-selection overlay "Delete" button
- Removes all selected players except default linemen
- Confirmation dialog

## Player Component Data

### Database Schema

```json
{
  "id": "player-uuid",
  "playId": "play-uuid",
  "x": 240,  // feet from left edge
  "y": 360,  // feet from top
  "radius": 2,  // feet
  "color": "#FF0000",
  "label": "X",
  "isLineman": true,  // false for skill players
  "linemanPosition": "center",  // null for skill players
  "linkedDrawingId": "drawing-uuid"  // null if not linked
}
```

### Default Linemen Data

Generated automatically for each new play:

```json
[
  { "linemanPosition": "leftTackle", "x": 74, "isLineman": true },
  { "linemanPosition": "leftGuard", "x": 77, "isLineman": true },
  { "linemanPosition": "center", "x": 80, "isLineman": true },
  { "linemanPosition": "rightGuard", "x": 83, "isLineman": true },
  { "linemanPosition": "rightTackle", "x": 86, "isLineman": true }
]
```

**X Positions (Middle Hash):**
- Centered at 80 feet (field center)
- 3-foot spacing (radius + gap + radius)

## Future Enhancements

### Defensive Players
- Add defensive alignment tool
- Different visual style (squares vs circles)
- Separate movement/editing from offensive players
- Pre-set defensive fronts (4-3, 3-4, nickel, dime)

### Formation Templates
- Save custom formations (see [Team Libraries](../playbook/team-libraries.md))
- Quick formation application
- Formation-relative player positioning
- Auto-populate formation from library

### Player Roles
- Assign roles to players (WR1, WR2, RB, etc.)
- Role-based route assignments
- Concept application based on roles
- Formation validation (e.g., must have QB, cannot have 6 OL)

### Player Numbers
- Assign jersey numbers to players
- Display numbers on field
- Roster integration (future)

## See Also

- [Toolbar Tools](./toolbar-tools.md) - Add Player, Select, Ball on Hash tools
- [Drawing System](./drawing-system.md) - Player-drawing linking
- [Field Specifications](../whiteboard/field-specifications.md) - Hash positions and field dimensions
- [Team Libraries](../playbook/team-libraries.md) - Formation templates
