# Toolbar Tools Reference

Complete documentation of all tools available in the play editor toolbar. Tools are accessed via the left sidebar and controlled through mouse interaction or keyboard shortcuts.

## Tool Layout

Tools appear vertically in the left toolbar in the following order:

1. Select
2. Add Player
3. Draw
4. Erase
5. Fill Color
6. Color
7. Route
8. Add Component
9. Ball on Hash
10. Hide/Show Play Bar
11. Settings

---

## Select Tool

| Property | Value |
|----------|-------|
| Icon | Cursor |
| Shortcut | S |
| Cursor | Default arrow |

### Function
Enables selection of existing components for interaction (move, resize, edit properties, delete).

### Behavior

**Single Selection:**
- Click any canvas element (player, drawing, field marking)
- Element highlights with selection outline
- Selection handles appear (for resizable elements)
- Properties dialog appears (context-dependent)

**Multi-Selection:**
- Click and drag to create selection rectangle
- All elements within rectangle become selected
- Multi-selection overlay appears with actions:
  - Save selection as concept
  - Duplicate selection (future)
  - Delete selection

**Dragging Selected Elements:**
- Click and drag selected element(s)
- Elements move together maintaining relative positions
- Snap to grid/alignment guides (if snap distance > 0)

### Selection Interactions

**Player Selected:**
- Drag to move player
- Click player again to open label dialog (custom text, position, delete, unlink)

**Drawing Selected:**
- Drag control points to reshape
- Drag segments to move entire drawing
- Click drawing to open properties dialog (color, style, thickness, ends)

---

## Add Player Tool

| Property | Value |
|----------|-------|
| Icon | Stick figure human |
| Shortcut | A |
| Cursor | Circle (in drawing area) |

### Function
Adds a new player component to the canvas.

### Behavior

**Tool Activation:**
1. Click Add Player tool or press A
2. Cursor changes to circle indicating player placement size
3. Canvas becomes click target for player placement

**Player Placement:**
- Click anywhere on canvas to place player
- Player appears as 2-foot radius circle (6 pixels at default zoom)
- Player placed at center of visible screen if tool activated without click

**Default Player Properties:**
- Radius: 2 feet (6 pixels)
- Color: Default team color (customizable)
- Label: Empty (can add position label via dialog)
- Position: Offensive player (defensive players - future)

### Player Component Features

**Movable:**
- Drag player with Select tool
- Maintains hash alignment if linked to linemen group (future)

**Customizable:**
- Click with Select tool to open player dialog
- Set custom text label (position, name, etc.)
- Change color
- Link/unlink to drawings
- Delete player

**Not Removable (Offensive Linemen Only):**
- The 5 default offensive linemen cannot be deleted
- They can be moved individually
- See [Player Management](./player-management.md) for linemen details

---

## Draw Tool

| Property | Value |
|----------|-------|
| Icon | Pencil (tip bottom-left, eraser top-right, 45° angle) |
| Shortcut | D |
| Cursor | Pencil tip indicates drawing position (canvas only) |

### Function
Allows freehand drawing of lines and shapes representing routes, blocking schemes, or annotations.

### Drawing Sub-Dialog

Opens adjacent to Draw tool icon when tool is activated. Provides real-time customization of drawing properties.

**Line Style:**
- Solid (default)
- Dashed

**End Style:**
- None (default)
- Arrow (single arrowhead at end)
- T-shape (flat cap)

**Path Mode:**
- Sharp (angular corners, preserves exact control points)
- Curve (smoothed Bezier curves between control points)

**Line Thickness:**
- Thin (1px)
- Medium (2px, default)
- Thick (4px)
- Extra Thick (6px)

### Drawing Process

1. Click and hold on canvas
2. Drag to draw path
3. Release to complete drawing
4. Drawing becomes selectable component

**Control Points:**
- Generated automatically at significant direction changes
- Adjustable via Select tool (drag control points)
- Merge when within snap distance (see Settings)

### Drawing Properties Dialog

**Post-Creation Editing:**
- Select drawing with Select tool
- Properties dialog opens
- Edit:
  - Color (from color wheel)
  - Line style (solid/dashed)
  - End style (none/arrow/T-shape)
  - Path mode (sharp/curve)
  - Line thickness

**Live Preview:**
- Changes apply immediately to drawing
- No "Apply" button needed

---

## Erase Tool

| Property | Value |
|----------|-------|
| Icon | Rubber eraser |
| Shortcut | E |
| Cursor | Eraser icon |

### Function
Removes canvas elements by clicking them.

### Behavior

**Erasable Elements:**
- Drawings (routes, annotations)
- Players (except 5 default offensive linemen)
- Custom components (future)

**Not Erasable:**
- Field markings (hash marks, yard lines, numbers)
- Default offensive linemen (can be moved, not deleted)

**Erase Action:**
1. Click element to erase
2. Element disappears immediately
3. No confirmation dialog (undo via Cmd+Z)

**Alternative:**
- Select element with Select tool
- Press Delete/Backspace key
- Same result as Erase tool

---

## Fill Color Tool

| Property | Value |
|----------|-------|
| Icon | Paint bucket |
| Shortcut | F |
| Cursor | Paint bucket |

### Function
Applies the currently selected color from the color wheel to clicked elements.

### Workflow

1. Open Color tool (C) to select color
2. Activate Fill Color tool (F)
3. Click element to apply color
4. Element changes to selected color

**Colorable Elements:**
- Players (circle fill color)
- Drawings (line/path color)

**Current Color Indicator:**
- Fill tool icon shows currently selected color
- Helps user confirm color before applying

---

## Color Tool

| Property | Value |
|----------|-------|
| Icon | Color wheel |
| Shortcut | C |
| Cursor | Default arrow |

### Function
Opens a color selector dialog to choose drawing and player colors.

### Color Selector Dialog

**Color Selection Methods:**

1. **Preset Palette:**
   - Common team colors (red, blue, green, black, white, etc.)
   - Quick selection via color swatches

2. **Color Wheel:**
   - Full HSL color picker
   - Drag to select hue and saturation
   - Slider for lightness

3. **Hex Input:**
   - Direct hex code entry (#RRGGBB)
   - Useful for exact team color matching

**Recent Colors:**
- Last 5-10 colors used
- Quick access to team color scheme

### Color Application

**Direct Application:**
- Select color from dialog
- Use Fill Color tool (F) to apply to elements

**New Elements:**
- Newly created drawings use current color
- Newly added players use current color (or team default)

---

## Route Tool

| Property | Value |
|----------|-------|
| Icon | Route tree (TBD design) |
| Shortcut | R |
| Cursor | Default arrow |

### Function
Opens a dialog with pre-defined routes from the basic route tree for quick route creation.

### Route Tree Dialog

**Basic Route Tree:**

| Number | Route | Description |
|--------|-------|-------------|
| 1 | Flat | 0-2 yard depth, horizontal |
| 2 | Slant | 5-7 yard depth, inside angle |
| 3 | Comeback | 12-15 yard depth, break back to QB |
| 4 | Curl | 10-12 yard depth, curl back to QB |
| 5 | Out | 10-15 yard depth, break to sideline |
| 6 | Dig | 12-15 yard depth, break inside |
| 7 | Corner | 12-15 yard depth, break to corner |
| 8 | Post | 12-15 yard depth, break to post |
| 9 | Go | Vertical, 20+ yards |

### Route Creation Process

1. Open Route dialog (R)
2. Click route number or name
3. Click canvas to place route start point
4. Route draws with preset geometry
5. Customize depth/angle via control points (Select tool)

**Route Customization:**
- Routes created as normal drawings
- Editable via Select tool
- Properties adjustable (color, style, thickness)

**Future Enhancements:**
- Route templates per team terminology
- Custom route library
- Route depth presets (e.g., "12-yard out" vs "15-yard out")

---

## Add Component Tool

| Property | Value |
|----------|-------|
| Icon | Plus (+) |
| Shortcut | G |
| Cursor | Default arrow |

### Function
Adds a saved component (formation, concept, or concept group) to the field.

### Component Selection Dialog

Opens when tool is activated, showing:

1. **Formations:**
   - Team-defined player alignments
   - Example: "Trips Right", "I-Formation"

2. **Concepts:**
   - Saved route combinations
   - Example: "Mesh", "Smash"

3. **Concept Groups:**
   - Collections of concepts
   - Example: "West Coast Passing", "Zone Run Concepts"

### Component Application

**Selection Process:**
1. Click component from dialog
2. Component highlighted
3. Click canvas to place
4. Component players/routes appear on field

**Component Behavior:**
- Players placed relative to current hash alignment
- Routes maintain relative positions
- All elements editable after placement
- Original component unchanged (instance created)

**Related Feature:**
- See [Unified Search](../concepts/unified-search.md) for alternative component application method
- See [Concepts Overview](../concepts/overview.md) for concept system details

---

## Ball on Hash Tool

| Property | Value |
|----------|-------|
| Icon | Hash marker (three dashed lines stacked vertically) |
| Shortcut | H (future: 1=Left, 2=Middle, 3=Right) |
| Cursor | Default arrow |

### Function
Controls ball placement on field, shifting offensive linemen to align on left hash, field center, or right hash.

### Hash Position Dialog

**Options:**
- Left (60 feet from left edge)
- Middle (field center, default)
- Right (60 feet from right edge)

**Visual Indicators:**
- Current hash position highlighted in dialog
- Hash marks on field may highlight current position (future)

### Linemen Adjustment

**Default Behavior:**
1. Select new hash position
2. All 5 offensive linemen shift together
3. Center (middle lineman) moves to new hash
4. Other linemen maintain 1-foot spacing
5. Relative positions preserved

**Skill Player Behavior:**
- Controlled by "Move Skills on Hash Change" setting (see Settings tool)
- **Yes:** All players move with linemen (maintain formation)
- **No:** Only linemen move, skill players stay in place

### Use Cases

**Hash-Specific Plays:**
- Boundary/field plays designed for specific hash positions
- Route depths adjust based on sideline proximity

**Formation Variety:**
- Same formation looks different from different hashes
- Critical for college football (40-foot hash spacing)

---

## Hide/Show Play Bar Tool

| Property | Value |
|----------|-------|
| Icon | Open eye (visible) / Closed eye (hidden) |
| Shortcut | None |
| Cursor | Default arrow |

### Function
Toggles the play bar visibility below the whiteboard for distraction-free editing or quick play access.

### Show Animation (800ms ease-in-out)

**Visual Sequence:**
1. Container height animates from 0px to 340px
2. Play cards drift up onto screen from bottom
3. Whiteboard canvas contracts from top
4. All canvas elements (players, routes) move down smoothly
5. New space appears from top of whiteboard

**User Benefit:**
- Quick access to other plays in playbook
- See play thumbnails while editing
- Fast play switching without leaving editor

### Hide Animation (800ms ease-in-out)

**Visual Sequence:**
1. Container height animates from 340px to 0px
2. Play cards drift down off screen
3. Whiteboard canvas expands from top
4. All canvas elements move up smoothly
5. More whiteboard space for complex plays

**User Benefit:**
- Maximize canvas space for detailed route work
- Reduce visual clutter
- Focus on single play without distractions

### Animation Details

**Smooth Transitions:**
- All whiteboard elements move with canvas expansion/contraction
- No jarring jumps or position resets
- Players and routes maintain field positions (not screen positions)

**Technical Note:**
- See [Overview](./overview.md) for implementation details
- Delayed unmount for performance optimization

---

## Settings Tool

| Property | Value |
|----------|-------|
| Icon | Cog wheel |
| Shortcut | None |
| Cursor | Default arrow |

### Function
Opens settings dialog with user and team preferences that persist across all plays and playbooks.

### Settings Categories

#### Position Naming System

**Options:**
- (X, Y, Z, A, B, Q) - Default West Coast
- (X, Y, Z, F, T, Q) - Air Raid
- Custom - Define your own labels

**Function:**
- Defines letters representing offensive skill positions
- Affects player labels, formations, and concept terminology
- Example: "X" vs "Split End" vs "Wide Receiver 1"

#### Competition Level

**Options:**
- High School
- College (default)
- Pro (NFL)

**Function:**
- Changes hash mark distances (see [Field Specifications](../whiteboard/field-specifications.md))
- Adjusts field dimensions
- Affects default formations and spacing

**Hash Mark Distances:**
- High School: 53 feet 4 inches apart
- College: 40 feet apart
- Pro: 18 feet 6 inches apart

#### Appearance

**Options:**
- Light Mode (default)
- Dark Mode

**Function:**
- Toggles between light and dark color schemes
- Affects UI chrome, not field background
- Field remains `#f2f2f2` in both modes for consistency

#### Snap Distance

**Range:** 10–50 px (default 20 px)

**Function:**
- Sets snap threshold for merging control points
- Affects drawing alignment and player positioning
- Higher values: More aggressive snapping
- Lower values: More precise control

**Use Cases:**
- Align route break points
- Merge drawing segments
- Snap players to yard lines or hash marks

#### Move Skills on Hash Change

**Options:**
- Yes (default)
- No

**Function:**
- Determines whether skill position players move with linemen when hash position changes
- **Yes:** Entire formation shifts (maintains spacing)
- **No:** Only linemen shift (skill positions stay at original field positions)

**Strategic Consideration:**
- Yes: Formation-relative plays (trips, bunches)
- No: Field-relative plays (boundary/field concepts)

#### Role Terminology

**Status:** ✅ Implemented (December 2024)

**Scope:** Team-level setting (not user-specific)

**Function:**
- Customize position labels per team
- Example: "X" vs "Split End" vs "SE" vs "Wide Receiver"
- Persists across all playbooks in the team

**API Endpoints:**
- `GET /api/teams/:teamId/roles` - List team role terminology
- `PUT /api/teams/:teamId/roles` - Update/upsert role terminology

**Database:**
- `role_terminology` table with team_id, role_id, custom_label

**Use Case:**
- Different teams use different terminology
- College vs high school vs pro naming conventions
- Align with team playbook and coaching staff preferences

---

## Tool Interaction Patterns

### Tool Selection
- Click tool icon in toolbar
- Or press keyboard shortcut
- Previous tool deactivates automatically
- One tool active at a time (except Select + temporary tools)

### Temporary Tools
- Hold keyboard shortcut to activate temporarily
- Release to return to previous tool
- Example: Hold C to pick color, release to return to Draw tool

### Tool Cursors
- Each tool has distinct cursor for visual feedback
- Cursors only appear on canvas (not on UI chrome)
- Cursor indicates tool function and interaction point

### Tool State Persistence
- Last selected tool remembered within editing session
- Default tool on page load: Select
- Tool state resets on page reload

## See Also

- [Overview](./overview.md) - Editor layout and structure
- [Drawing System](./drawing-system.md) - Drawing mechanics and player linking
- [Player Management](./player-management.md) - Default linemen and positioning
- [Keyboard Shortcuts](./keyboard-shortcuts.md) - Complete shortcut reference
- [Field Specifications](../whiteboard/field-specifications.md) - Field dimensions and competition levels
