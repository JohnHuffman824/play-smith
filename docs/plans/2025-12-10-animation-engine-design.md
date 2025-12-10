# Play Animation Engine Design Document

**Created:** 2025-12-10
**Status:** Planning
**GitHub Issue:** #6

---

## 1. Executive Summary

This document outlines the design for Play Smith's animation engine - the #1 competitive differentiator that will allow coaches to visualize play execution in motion. Based on competitive analysis, animation is the most praised feature across all major platforms, dramatically improving player comprehension and learning speed.

---

## 2. Current Infrastructure Analysis

### 2.1 Existing Data Models

**Drawing Structure** (`src/types/drawing.types.ts`):
- Uses shared point pool architecture: `points: Record<string, ControlPoint>`
- Segments reference points by ID: `PathSegment { type, pointIds }`
- Segment types: `'line' | 'quadratic' | 'cubic'`
- Player linking via `playerId` and `linkedPointId`

**Coordinate System** (`src/utils/coordinates.ts`):
- Storage: Feet (origin bottom-left, Y increases upward)
- Rendering: Pixels (origin top-left, Y increases downward)
- Field: 160 ft width, 360 ft height
- Scale: `containerWidth / FIELD_WIDTH_FEET`

**Player Structure** (from PlayContext):
```typescript
interface Player {
  id: string
  x: number  // Feet
  y: number  // Feet
  label: string
  color: string
}
```

### 2.2 Existing Rendering Stack

1. **Canvas.tsx** - Main container, manages players/drawings state
2. **SVGCanvas.tsx** - Renders drawings as SVG paths
3. **PathRenderer.tsx** - Builds SVG path commands from segments
4. **Player.tsx** - Renders players as positioned circles

### 2.3 Event System

Type-safe EventBus for cross-component communication:
- `eventBus.emit('canvas:clear')`
- `eventBus.on('player:fill', handler)`

---

## 3. Animation Architecture Considerations

### 3.1 Key Questions to Resolve

1. **Viewing UX Separation**
   - Should animation viewing be separate from the play editor?
   - What triggers entering animation mode?
   - How do users navigate back to editing?

2. **Playbook Integration**
   - Where does animation viewing live in the playbook workflow?
   - Slideshow/presentation mode for cycling through plays?
   - Grid view for browsing, expanded view for animation?

3. **Permission-Based Navigation**
   - Viewers: Can browse grid, view animations, but no edit access
   - Editors: Same as viewers + can open play editor
   - How do we handle the transition between viewing and editing?

4. **Animation Data Storage**
   - Do we extend existing Drawing/Player types with timing metadata?
   - Where do ball events get stored?
   - How do we handle plays with no animation data yet?

---

## 4. Proposed UX Architecture

### 4.1 Two-Mode Approach

**View Mode** (for all users with playbook access):
- Grid view of play cards in playbook
- Click card → enlarged play view with animation controls
- Slideshow navigation (previous/next play)
- Animation playback controls (play, pause, speed, scrub)

**Edit Mode** (for users with edit permissions):
- Same as current PlayEditorPage
- Additional "Preview Animation" button
- Animation settings configuration

### 4.2 Playbook Page Enhancements

Current route: `/playbooks/:playbookId` → PlaybookEditor

Proposed additions:
- Play card click → opens **PlayViewerModal** (full-screen overlay)
- PlayViewerModal contains:
  - Enlarged play canvas (read-only)
  - Animation controls below
  - Navigation arrows for slideshow
  - Edit button (permission-gated)
  - Close button

### 4.3 Permission Flow

```
User clicks play card
    │
    ├── Has VIEW permission only
    │       └── Opens PlayViewerModal (animation only)
    │
    └── Has EDIT permission
            └── Opens PlayViewerModal
                    ├── Can animate
                    └── "Edit" button → navigates to PlayEditorPage
```

---

## 5. Animation Engine Technical Design

### 5.1 Core Components

```
src/
├── components/
│   └── animation/
│       ├── AnimationEngine.ts       # Core animation loop
│       ├── AnimationContext.tsx     # Animation state management
│       ├── AnimationControls.tsx    # Playback UI
│       ├── PlayViewer.tsx           # Read-only canvas with animation
│       └── PlayViewerModal.tsx      # Full-screen overlay
├── types/
│   └── animation.types.ts           # Animation-specific types
└── utils/
    └── animation.utils.ts           # Interpolation, timing utilities
```

### 5.2 Animation Types (from GitHub Issue)

```typescript
interface DrawingSegment {
  points: Point[]
  duration_ms: number
  start_delay_ms: number
  style: LineStyle
}

interface PlayAnimation {
  play_id: string
  snap_count_duration: number
  ball_start_player_id: string
  ball_events: BallEvent[]
}

interface BallEvent {
  type: 'handoff' | 'pitch' | 'pass'
  from_player_id: string
  to_player_id: string
  start_time_ms: number
}

interface AnimationState {
  status: 'ready' | 'snap_count' | 'execution' | 'complete'
  currentTime: number
  playbackSpeed: number  // 0.25, 0.5, 1, 1.5, 2
  isPlaying: boolean
  loopMode: boolean
}
```

### 5.3 Animation Loop

```typescript
class AnimationEngine {
  private animationFrameId: number | null = null
  private startTime: number = 0
  private state: AnimationState

  start() {
    this.state.status = 'snap_count'
    this.startTime = performance.now()
    this.tick()
  }

  private tick = () => {
    const elapsed = (performance.now() - this.startTime) * this.state.playbackSpeed

    // Update player positions along their paths
    this.updatePlayerPositions(elapsed)

    // Update ball position
    this.updateBallPosition(elapsed)

    // Check for state transitions
    this.checkStateTransitions(elapsed)

    if (this.state.isPlaying) {
      this.animationFrameId = requestAnimationFrame(this.tick)
    }
  }
}
```

### 5.4 Path Interpolation

Leverage existing segment types:
- **Line segments**: Linear interpolation between points
- **Quadratic curves**: De Casteljau's algorithm or parametric formula
- **Cubic curves**: Same, for smoother route breaks

```typescript
function getPositionAlongPath(
  drawing: Drawing,
  progress: number  // 0 to 1
): { x: number, y: number } {
  // Calculate total path length
  // Find which segment contains the target progress
  // Interpolate within that segment
}
```

---

## 6. Implementation Phases

### Phase 1: Core Animation Engine
- [ ] RequestAnimationFrame loop
- [ ] Path interpolation utilities (line, quadratic, cubic)
- [ ] AnimationContext for state management
- [ ] Basic AnimationControls UI (play/pause, speed)

### Phase 2: Play Viewer Component
- [ ] PlayViewer (read-only canvas)
- [ ] PlayViewerModal (full-screen overlay)
- [ ] Integration with PlaybookEditor (click card → open viewer)
- [ ] Permission-gated edit button

### Phase 3: Ball Movement
- [ ] Ball component
- [ ] Handoff detection (player intersection)
- [ ] Pitch arc calculation
- [ ] Pass projection at 60 ft/s
- [ ] Catch detection

### Phase 4: Advanced Playback
- [ ] Progress scrubber
- [ ] Step-through mode (frame-by-frame)
- [ ] Loop mode
- [ ] Ghost trail option
- [ ] Key moment markers

### Phase 5: Slideshow Navigation
- [ ] Previous/next play navigation
- [ ] Keyboard shortcuts (arrows)
- [ ] Touch swipe support
- [ ] Auto-play option for presentations

### Phase 6: Animation Data Persistence
- [ ] Extend database schema for animation metadata
- [ ] API endpoints for animation data
- [ ] Default animation generation for plays without explicit timing

---

## 7. Open Questions for Discussion

1. **Default Animation Behavior**
   - Should plays without explicit timing data auto-animate using defaults?
   - Default speed: 15 ft/s (configurable per player)?
   - Auto-detect snap count from play complexity?

2. **Entry Points**
   - Click play card → animation view?
   - Dedicated "Present" mode for team meetings?
   - Embed animations in exported materials?

3. **Mobile Experience**
   - Touch gestures for scrubbing?
   - Simplified controls for small screens?
   - Battery-saving 30 FPS mode?

4. **Collaborative Features**
   - Can viewers add comments/annotations during playback?
   - Share specific timestamps with team?

---

## 8. Files to Modify/Create

### New Files
- `src/types/animation.types.ts`
- `src/utils/animation.utils.ts`
- `src/components/animation/AnimationEngine.ts`
- `src/components/animation/AnimationContext.tsx`
- `src/components/animation/AnimationControls.tsx`
- `src/components/animation/PlayViewer.tsx`
- `src/components/animation/PlayViewerModal.tsx`

### Modified Files
- `src/types/drawing.types.ts` - Add timing metadata to segments
- `src/components/playbook-editor/PlayCard.tsx` - Add click handler for viewer
- `src/components/playbook-editor/PlaybookEditor.tsx` - Integrate modal
- `src/db/types.ts` - Animation database schema
- `src/api/` - Animation data endpoints

---

## 9. Performance Targets (from GitHub Issue)

- 60 FPS animation rendering
- <50ms to start from button press
- Smooth with 22 players on field
- Minimal battery drain on mobile

### Optimization Strategies
- Canvas rendering with layer caching
- Reuse player sprite instances
- Pre-calculate interpolation points
- Pause rendering when tab not visible

---

## 10. Next Steps

1. [ ] Review this document and clarify open questions
2. [ ] Finalize UX flow (viewer modal vs separate page)
3. [ ] Design animation data schema
4. [ ] Implement Phase 1 (core engine)
5. [ ] Iterate based on feedback
