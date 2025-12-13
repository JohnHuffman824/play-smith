# Canvas Zoom & Pan Controls

**Status:** ✅ Implemented (December 2024)

Advanced viewport controls for navigating large field diagrams with precision and ease.

## Overview

The canvas zoom and pan system provides fluid navigation across the whiteboard, enabling coaches to focus on specific areas of the field while maintaining spatial awareness. The system uses transform-based rendering for smooth performance even with complex plays.

## Features

### Mouse Wheel Zoom

**Cursor-Centered Zooming:**
- Scroll wheel up: Zoom in
- Scroll wheel down: Zoom out
- Zoom center point: Current cursor position

**Behavior:**
- The point under the cursor remains stationary during zoom
- Surrounding field area expands/contracts around cursor position
- Enables precise zooming to specific players or route details

**Use Cases:**
- Zoom in on route detail to adjust break points
- Zoom out for full field view during formation setup
- Focus on specific player assignments

### Spacebar + Drag Pan

**Primary panning method:**
1. Hold spacebar
2. Click and drag with mouse
3. Canvas pans in direction of drag
4. Release spacebar to return to normal tool interaction

**Cursor Indication:**
- Cursor changes to "grab" hand when spacebar is held
- Visual feedback that pan mode is active
- Prevents accidental tool activation while panning

### Middle Mouse Button Pan

**Alternative panning method:**
- Hold middle mouse button (scroll wheel click)
- Drag to pan canvas
- Release to return to normal interaction

**Use Cases:**
- Quick panning without keyboard
- Multi-monitor setups where spacebar may trigger OS shortcuts
- User preference for mouse-only navigation

### Zoom Limits

**Configurable Boundaries:**
- **Minimum zoom:** Prevents zooming out beyond field visibility
- **Maximum zoom:** Prevents excessive zoom that loses field context

**Default Values:**
```typescript
const ZOOM_MIN = 0.5;  // 50% - shows full field plus margin
const ZOOM_MAX = 3.0;  // 300% - detail view for route precision
```

**Rationale:**
- Min zoom ensures field markings remain visible
- Max zoom prevents pixel-level confusion
- Range covers all practical use cases

## Technical Implementation

### CanvasViewportContext

**Location:** `src/contexts/CanvasViewportContext.tsx`

**State Management:**
```typescript
interface ViewportState {
  zoom: number;           // Current zoom level (1.0 = 100%)
  panX: number;           // Horizontal pan offset (pixels)
  panY: number;           // Vertical pan offset (pixels)
}
```

**Context Provider:**
- Global viewport state accessible to all canvas components
- Persisted within editor session (reset on page reload)
- Synchronized across all canvas elements (players, drawings, field markings)

### Transform-Based Rendering

**Rendering Strategy:**
- CSS transform applied to canvas container
- `transform: scale(${zoom}) translate(${panX}px, ${panY}px)`
- Hardware-accelerated via GPU
- No DOM manipulation during pan/zoom operations

**Performance Benefits:**
- Smooth 60fps animation
- No re-rendering of individual canvas elements
- Efficient for plays with many players and complex routes

### Interaction Prevention During Pan

**Tool Interaction Blocking:**
- Mouse events suppressed while spacebar is held
- Prevents accidental drawing/selection during pan
- Tool cursors hidden during pan mode

**State Management:**
```typescript
const [isPanning, setIsPanning] = useState(false);

// Suppress tool interactions when panning
if (isPanning) return; // Early exit from tool handlers
```

## User Experience

### Zoom Behavior

**Progressive Zoom Levels:**
- Each scroll increment: ~10% zoom change
- Smooth acceleration for rapid zoom gestures
- Deceleration near zoom limits

**Zoom Persistence:**
- Zoom level persists during play editing session
- Reset to 100% on page reload
- Per-play zoom state (future consideration)

### Pan Constraints

**Boundary Checking:**
- Canvas can be panned beyond field edges for margin
- Maximum pan distance prevents losing field entirely
- "Snap back" animation if panned too far (future)

**Field Centering:**
- Double-click whiteboard background: Re-center and reset zoom to 100% (future)
- Keyboard shortcut: `Cmd+0` / `Ctrl+0` to reset viewport (future)

## Keyboard Shortcuts

| Action | Shortcut | Status |
|--------|----------|--------|
| Pan mode | Hold Spacebar | ✅ Implemented |
| Zoom in | `Cmd/Ctrl +` | 🔮 Future |
| Zoom out | `Cmd/Ctrl -` | 🔮 Future |
| Reset zoom | `Cmd/Ctrl 0` | 🔮 Future |
| Fit to screen | `Cmd/Ctrl 9` | 🔮 Future |

## Accessibility Considerations

### Alternative Controls
- Mouse wheel zoom: Standard, widely understood
- Middle mouse button: Accessible on most mice
- Spacebar pan: Keyboard accessible, no modifier keys required

### Future Enhancements
- Touch gesture support for tablets (pinch to zoom, two-finger pan)
- Zoom controls in toolbar for users without scroll wheels
- Pan controls (arrow buttons) for keyboard-only users

## Common Use Cases

### Route Detail Work
1. Use Draw tool to create route
2. Mouse wheel zoom into route break point (cursor over break)
3. Spacebar + drag to adjust view angle
4. Fine-tune control points at higher zoom level
5. Mouse wheel zoom out to see full route context

### Formation Setup
1. Start at 100% zoom (default)
2. Add players using Add Player tool
3. Spacebar + drag to center view on formation area
4. Zoom out slightly to see full formation spread

### Multi-Player Adjustment
1. Select multiple players (Select tool + drag rectangle)
2. Zoom out for full field view
3. Drag selection to new position
4. Zoom in to verify spacing and alignment

## Implementation Files

**Core Components:**
- `src/contexts/CanvasViewportContext.tsx` - Global viewport state
- `src/components/Whiteboard.tsx` - Transform application to canvas
- `src/hooks/useCanvasZoom.ts` - Zoom event handlers
- `src/hooks/useCanvasPan.ts` - Pan event handlers

**Related Components:**
- All canvas elements (players, drawings, field markings) render within transformed viewport
- Tool components check viewport state to prevent interaction during pan

## See Also

- [Field Specifications](./field-specifications.md) - Canvas dimensions and field layout
- [Toolbar Tools](../play-editor/toolbar-tools.md) - Select and Draw tools that interact with viewport
- [Drawing System](../play-editor/drawing-system.md) - How drawing coordinates interact with zoom/pan transforms
