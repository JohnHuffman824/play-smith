# Whiteboard Field Specifications

The whiteboard serves as the primary canvas for play creation, rendering an exact representation of a college football field with precise measurements and markings.

## Overview

The whiteboard must match exact college football field specifications to ensure plays created in Play Smith translate accurately to real-world field conditions. All measurements are recorded in feet with a scaling factor applied for pixel rendering (approximately 1 foot = 3 pixels).

## Background

| Property | Value |
|----------|-------|
| Background color | `#f2f2f2` (grey/white) |

The neutral grey-white background provides optimal contrast for players, routes, and field markings while reducing eye strain during extended editing sessions.

## Field Dimensions

### Total Field Width
**160 feet** - Full width from sideline to sideline

### Hash Mark Positioning

The field uses the college football hash mark system:

| Property | Value |
|----------|-------|
| Edge to innermost hash | 60 feet (both sides) |
| Space between hashes | 40 feet |
| Hash mark spacing | 3 feet apart (vertical) |

**Hash Mark System:**
- Left hash: 60 feet from left edge
- Center: 80 feet from left edge (field center)
- Right hash: 100 feet from left edge (60 feet from right edge)

This differs from NFL hash marks (18 feet 6 inches apart) and high school hash marks (aligned with goal posts).

## Field Markings

### Yard Lines

**5-Yard Markings:**
- Every 5th hash mark has a line extending the full width of the field
- These represent 5-yard intervals (5, 10, 15, 20, etc.)
- Lines should have relatively low opacity so they don't obscure drawings

**10-Yard Markings:**
- Every 10 yards displays numbers straddling the width-spanning lines
- Numbers appear at: 10, 20, 30, 40, 50, 40, 30, 20, 10 (both directions)

### Yard Numbers

| Property | Value |
|----------|-------|
| Height | 6 feet tall |
| Character | Hashtag (#) representation |
| Top position | 15 feet from field edge |
| Orientation | "On their side" (tops closer to edge, bottoms closer to center) |

**Number Positioning:**
- Numbers appear on both sides of each 10-yard line
- Oriented perpendicular to sidelines (lying down)
- Tops point toward sidelines, bottoms point toward field center
- This orientation matches real football field markings

### Visual Styling

**Opacity Guidelines:**
- Field markings should use relatively low opacity
- Hash marks, yard lines, and numbers must not obscure:
  - Player circles
  - Route drawings
  - Annotations
  - Custom formations

**Recommended Opacity Values:**
- Hash marks: 0.2-0.3
- Yard lines: 0.3-0.4
- Numbers: 0.25-0.35

## Competition Level Variations

The field specifications can be adjusted based on competition level (configurable in Settings):

### High School
- Hash marks aligned with goal posts (wider spacing)
- Hash marks: 53 feet 4 inches apart

### College (Default)
- Hash marks: 40 feet apart
- Specifications as documented above

### Pro (NFL)
- Hash marks: 18 feet 6 inches apart (much narrower)
- All other dimensions remain the same

## Scaling and Rendering

### Pixel Scale Factor
**Approximately 1 foot = 3 pixels**

This scaling factor provides:
- Adequate detail for precise route drawing
- Reasonable canvas size for common screen resolutions
- Clear visibility of 2-foot radius player circles (6 pixels diameter)

### Canvas Size Calculation

```
Field width: 160 feet × 3 px/ft = 480 pixels
Field length: 120 yards × 3 feet/yard × 3 px/ft = 1080 pixels
```

Actual canvas size may vary based on:
- Zoom level (see [Canvas Controls](./canvas-controls.md))
- Viewport dimensions
- UI chrome (toolbar, input fields, play cards)

## Default Ball Position

### Initial Placement
- **Default hash:** Middle (field center)
- **Default yard line:** 50-yard line (field center)

### Adjustable via Hash Tool
The Ball on Hash tool allows repositioning to:
- Left hash
- Middle (center)
- Right hash

See [Player Management](../play-editor/player-management.md) for details on how linemen adjust when hash position changes.

## Implementation Notes

### Rendering Performance
- Field markings rendered as static SVG layer
- Low opacity prevents need for z-index management with dynamic elements
- Hash marks and lines drawn once on canvas initialization

### Responsive Behavior
The whiteboard canvas adjusts height based on UI state:
- Play cards visible: `calc(100vh - Xpx)` where X includes play bar height (340px)
- Play cards hidden: Full viewport height minus toolbar and inputs

See [Overview](../play-editor/overview.md) for complete layout specifications.

## See Also

- [Canvas Controls](./canvas-controls.md) - Zoom, pan, and viewport management
- [Player Management](../play-editor/player-management.md) - Default linemen positioning and hash alignment
- [Toolbar Tools](../play-editor/toolbar-tools.md) - Ball on Hash tool specification
