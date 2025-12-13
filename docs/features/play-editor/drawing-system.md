# Drawing System

The drawing system enables coaches to create routes, blocking schemes, and annotations on the whiteboard. It includes advanced features like player linking for synchronized movement and flexible editing.

## Overview

Drawings are vector-based paths composed of segments and control points. They support various visual styles (solid/dashed lines, arrows, colors) and can be linked to players for coordinated movement.

## Drawing Creation

### Freehand Drawing

**Tool:** Draw (D)

**Process:**
1. Activate Draw tool
2. Click and hold on canvas
3. Drag to draw path
4. Release to complete drawing

**Control Point Generation:**
- Automatically created at significant direction changes
- Density controlled by drawing speed and angle changes
- Threshold: ~15-30 degree direction change triggers new point

### Drawing Properties

Set via drawing sub-dialog (opens when Draw tool is active):

**Line Style:**
- Solid (continuous line)
- Dashed (evenly spaced dashes)

**End Style:**
- None (line ends abruptly)
- Arrow (single arrowhead pointing forward)
- T-shape (flat perpendicular cap)

**Path Mode:**
- Sharp (angular corners, preserves exact control points)
- Curve (smoothed Bezier curves between control points)

**Line Thickness:**
- Thin: 1px
- Medium: 2px (default)
- Thick: 4px
- Extra Thick: 6px

**Color:**
- Selected via Color tool (C)
- Applied to entire drawing path
- Editable after creation

## Drawing Editing

### Select and Modify

**Tool:** Select (S)

**Click Drawing:**
- Properties dialog opens
- Edit color, style, end style, path mode, thickness
- Changes apply immediately (live preview)

**Drag Control Points:**
- Click and hold control point
- Drag to reshape drawing
- Segment curves/angles adjust dynamically

**Drag Segments:**
- Click and hold between control points
- Drag to move segment
- Adjacent segments adjust to maintain continuity

**Merge Control Points:**
- Drag one control point within snap distance of another
- Points merge into single point
- Simplifies drawing, reduces complexity

### Delete Drawing

**Methods:**
1. Select drawing, press Delete/Backspace
2. Use Erase tool (E), click drawing
3. Multi-select and delete

## Player Linking

**Status:** ✅ Implemented

Advanced feature that synchronizes drawing and player movement for route assignments.

### Linking Process

**Create Link:**
1. Use Select tool
2. Drag a drawing's control point inside a player's radius
3. Player glows when control point enters radius (visual feedback)
4. Release to create link
5. Control point hides (drawn behind player)

**Constraints:**
- One drawing per player
- One player per drawing (1:1 relationship)
- Cannot merge two drawings if both have player links

### Linked Behavior

**Bidirectional Lock:**
- Dragging the linked control point moves the player
- Dragging the player moves the linked control point
- Movement synchronized in lockstep

**Visual Feedback:**
- Linked control point hides behind player
- Drawing appears to start/end at player center
- Route follows player when player moves

### Unlinking

**Process:**
1. Select player (linked drawing must be selected)
2. Open player label dialog
3. Click "Unlink" button (appears beside custom text input)
4. Link removed

**Post-Unlink Behavior:**
- Control point reappears
- Position: ~5 feet along prior segment direction from player
- Drawing and player now independent
- Player can be deleted (if not a default lineman)

### Player Dialog with Link

**Layout Changes:**
- **Linked:** Unlink button appears beside custom text input
- **Not linked:** Custom text input spans full row

**Dialog Elements:**
- Custom text input (position label, player name)
- Unlink button (if linked)
- Delete button (if not a default lineman)
- Color picker (player circle color)

## Multi-Selection Overlay

**Status:** ✅ Implemented

Appears when 2+ objects (players, drawings) are selected.

### Overlay Actions

**Save Selection as Concept:**
- Opens concept creation dialog
- Saves relative positions of all selected elements
- Preserves player-drawing links
- Creates reusable concept (see [Concepts Overview](../concepts/overview.md))

**Duplicate Selection:**
- **Status:** 🔮 Future
- Creates copy of all selected elements
- Positioned offset from original (10 feet down-field)
- Maintains relative positions and links

**Delete Selection:**
- Removes all selected elements
- Cannot delete default offensive linemen
- Unlinks any player-drawing links
- Confirmation dialog if many elements selected

## Drawing Use Cases

### Routes

**Typical Workflow:**
1. Add player for receiver
2. Draw route path starting from player
3. Link route to player (drag route start inside player radius)
4. Adjust route depth/breaks via control points
5. Set arrow end style to show direction
6. Set color to differentiate from other routes

**Route Annotations:**
- Use T-shape end style for "plant and drive" breaks
- Use dashed line for option routes
- Use arrow for primary direction
- Color-code by route tree number (1-9)

### Blocking Schemes

**Typical Workflow:**
1. Default linemen already positioned
2. Draw blocking arrows from linemen to defenders/gaps
3. Use thick lines for emphasis
4. Use T-shape end style for "seal" blocks
5. Use arrow end style for "drive" blocks
6. Link blocks to linemen for adjustment flexibility

### Motion/Shifts

**Pre-Snap Movement:**
1. Draw path showing player motion
2. Use dashed line to indicate pre-snap (vs post-snap solid)
3. Link to player to show assignment
4. Use different color for motion vs routes

**Example:**
- Slot receiver motions across formation
- Dashed line shows motion path
- Solid line shows post-snap route
- Both linked to same player (two drawings)

## Technical Implementation

### Drawing Data Structure

**Database Schema:**
```json
{
  "id": "drawing-uuid",
  "playId": "play-uuid",
  "segments": [
    {
      "start": { "x": 240, "y": 360 },
      "end": { "x": 240, "y": 300 },
      "controlPoints": [
        { "x": 240, "y": 330 }
      ]
    }
  ],
  "style": "solid",
  "endStyle": "arrow",
  "pathMode": "curve",
  "thickness": 2,
  "color": "#FF0000",
  "linkedPlayerId": "player-uuid" // null if not linked
}
```

### Coordinate System

**Units:** Feet (converted to pixels via scale factor)

**Origin:** Top-left of field canvas
- X: 0 = left edge, 160 = right edge
- Y: 0 = top (end zone), 360 = bottom (opposite end zone)

**Scale Factor:** ~3 pixels per foot (see [Field Specifications](../whiteboard/field-specifications.md))

### Rendering

**SVG Paths:**
- Drawings rendered as SVG `<path>` elements
- Bezier curves for smooth path mode
- Straight lines for sharp path mode

**Control Point Handles:**
- Visible only when drawing selected
- Rendered as small circles
- Draggable via mouse

**Z-Index:**
- Drawings render above field markings
- Drawings render below players (when player linked)
- Selection handles render on top

## Performance Considerations

### Complex Plays

**Many Drawings:**
- SVG rendering efficient for dozens of drawings
- Control points hidden when drawing not selected (reduces DOM nodes)
- Bounding box culling for off-screen drawings (future)

**Long Routes:**
- Control point reduction algorithm (future)
- Simplify paths with many control points
- Preserve visual appearance while reducing data

## See Also

- [Toolbar Tools](./toolbar-tools.md) - Draw, Select, Erase tools
- [Player Management](./player-management.md) - Player components and linking
- [Concepts Overview](../concepts/overview.md) - Saving selections as concepts
- [Whiteboard Field Specifications](../whiteboard/field-specifications.md) - Coordinate system and scaling
