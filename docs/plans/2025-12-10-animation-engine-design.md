# Play Animation Engine Design Document

**Created:** 2025-12-10
**Status:** Ready for Implementation
**GitHub Issue:** #6

---

## 1. Executive Summary

This document outlines the design for Play Smith's animation engine - the #1 competitive differentiator that will allow coaches to visualize play execution in motion. Based on competitive analysis, animation is the most praised feature across all major platforms, dramatically improving player comprehension and learning speed.

---

## 2. Confirmed Design Decisions

### 2.1 UX Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **View Location** | Modal overlay on playbook page | Click play card → full-screen modal. Close returns to grid. |
| **Navigation** | Slideshow arrows + keyboard | Previous/next arrows, arrow keys, swipe for mobile |
| **Viewer Behavior** | Opens animation viewer directly | One click to view/animate - simple for players |
| **Collaboration** | View-only initially | Focus on solid animation first, add comments later |

### 2.2 Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Default Timing** | Auto-generate from route length | 15 ft/s default speed, no manual config required |
| **Rendering** | SVG-based (match current editor) | Reuse PathRenderer, optimize to Canvas later if needed |
| **Ball Movement** | Phase 2 feature | Get player movement solid first |
| **Offline Support** | Not initial priority | Focus on online experience first |

---

## 3. Current Infrastructure Analysis

### 3.1 Existing Data Models

**Drawing Structure** (`src/types/drawing.types.ts`):
```typescript
interface Drawing {
  id: string
  points: Record<string, ControlPoint>  // Shared point pool
  playerId?: string                      // Link to player
  linkedPointId?: string
  segments: PathSegment[]               // References points by ID
  style: PathStyle
  annotations: Annotation[]
}

interface PathSegment {
  type: 'line' | 'quadratic' | 'cubic'
  pointIds: string[]
}

interface ControlPoint extends Coordinate {
  id: string
  type: 'start' | 'end' | 'corner' | 'curve'
  handleIn?: Coordinate
  handleOut?: Coordinate
}
```

**Coordinate System** (`src/utils/coordinates.ts`):
- Storage: Feet (origin bottom-left, Y increases upward)
- Rendering: Pixels (origin top-left, Y increases downward)
- Field: 160 ft width, 360 ft height
- Scale: `containerWidth / FIELD_WIDTH_FEET`

### 3.2 Existing Rendering Stack

1. **Canvas.tsx** - Main container, manages players/drawings state
2. **SVGCanvas.tsx** - Renders drawings as SVG paths
3. **PathRenderer.tsx** - Builds SVG path commands from segments
4. **Player.tsx** - Renders players as positioned circles

### 3.3 Event System

Type-safe EventBus for cross-component communication:
```typescript
eventBus.emit('canvas:clear')
eventBus.on('player:fill', handler)
```

---

## 4. Animation Architecture

### 4.1 Component Structure

```
src/
├── components/
│   └── animation/
│       ├── PlayViewerModal.tsx      # Full-screen modal container
│       ├── AnimationCanvas.tsx      # SVG canvas for animation
│       ├── AnimationControls.tsx    # Playback controls bar
│       ├── AnimatedPlayer.tsx       # Moving player marker
│       ├── AnimatedRoute.tsx        # Route with progress indicator
│       └── GhostTrail.tsx           # Optional ghost trail overlay
├── contexts/
│   └── AnimationContext.tsx         # Animation state management
├── hooks/
│   ├── useAnimationEngine.ts        # Core RAF loop logic
│   ├── useAnimationTiming.ts        # Route length calculation
│   └── useSwipeNavigation.ts        # Mobile swipe gestures
├── utils/
│   ├── animation.utils.ts           # Path interpolation math
│   └── bezier.utils.ts              # Bezier curve calculations
└── types/
    └── animation.types.ts           # Animation type definitions
```

### 4.2 Animation State (AnimationContext)

```typescript
type AnimationPhase = 'ready' | 'snapCount' | 'execution' | 'complete'

interface AnimationState {
  // Playback
  phase: AnimationPhase
  isPlaying: boolean
  currentTime: number        // ms since execution start
  totalDuration: number      // ms for full animation
  playbackSpeed: number      // 0.25, 0.5, 1, 1.5, 2

  // Data
  playId: string | null
  players: PlayerAnimationState[]
  routes: AnimatedRoute[]

  // Options
  showGhostTrail: boolean
  loopMode: boolean
  routeTimings: Map<string, RouteTiming>
}

interface RouteTiming {
  drawingId: string
  playerId: string | null
  totalLength: number        // feet
  duration: number           // ms at 15 ft/s
  segments: SegmentTiming[]
}
```

### 4.3 Path Interpolation Functions

```typescript
// Line: Linear interpolation
function interpolateLine(p0: Coordinate, p1: Coordinate, t: number): Coordinate

// Quadratic Bezier: Q(t) = (1-t)² P0 + 2(1-t)t P1 + t² P2
function interpolateQuadratic(p0, p1, p2, t: number): Coordinate

// Cubic Bezier: C(t) = (1-t)³ P0 + 3(1-t)²t P1 + 3(1-t)t² P2 + t³ P3
function interpolateCubic(p0, p1, p2, p3, t: number): Coordinate

// Get position along entire route at progress (0-1)
function getPositionAlongRoute(drawing, routeTiming, progress): Coordinate
```

### 4.4 Animation Engine (RAF Loop)

```typescript
function useAnimationEngine(state, dispatch) {
  useEffect(() => {
    if (!state.isPlaying) return

    function animate(timestamp: number) {
      const deltaTime = (timestamp - lastTime) * state.playbackSpeed
      dispatch({ type: 'TICK', deltaTime })

      if (state.currentTime < state.totalDuration) {
        requestAnimationFrame(animate)
      } else if (state.loopMode) {
        dispatch({ type: 'RESET' })
      } else {
        dispatch({ type: 'SET_PHASE', phase: 'complete' })
      }
    }

    requestAnimationFrame(animate)
  }, [state.isPlaying, state.playbackSpeed])
}
```

---

## 5. Integration Points

### 5.1 PlaybookEditor Integration

Modify `PlaybookEditor.tsx` to open modal on card click:

```typescript
// Add state
const [showPlayViewer, setShowPlayViewer] = useState(false)
const [viewingPlayId, setViewingPlayId] = useState<string | null>(null)

// Handler for animation
function handleAnimatePlay(playId: string) {
  setViewingPlayId(playId)
  setShowPlayViewer(true)
}

// Render modal
{showPlayViewer && viewingPlayId && (
  <PlayViewerModal
    isOpen={showPlayViewer}
    onClose={() => setShowPlayViewer(false)}
    playbookId={playbookId}
    initialPlayId={viewingPlayId}
    plays={allPlays}
  />
)}
```

### 5.2 PlayCard Modification

Add animation trigger to `PlayCard.tsx`:

```typescript
interface PlayCardProps {
  // ... existing props
  onAnimate?: (id: string) => void  // NEW
}

// In thumbnail click handler, trigger animation instead of edit
onClick={() => onAnimate?.(id) ?? onOpen(id)}
```

### 5.3 Permission Flow

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

## 6. Implementation Phases

### Phase 1: Foundation (2-3 days)
**Deliverables:**
- `src/types/animation.types.ts` - Type definitions
- `src/utils/animation.utils.ts` - Path interpolation functions
- `src/utils/bezier.utils.ts` - Bezier math utilities
- Unit tests for interpolation accuracy

### Phase 2: Context and Engine (2-3 days)
**Deliverables:**
- `src/contexts/AnimationContext.tsx` - Full context implementation
- `src/hooks/useAnimationEngine.ts` - RAF loop
- `src/hooks/useAnimationTiming.ts` - Route timing calculation

### Phase 3: Animation Components (3-4 days)
**Deliverables:**
- `src/components/animation/AnimatedPlayer.tsx`
- `src/components/animation/AnimatedRoute.tsx`
- `src/components/animation/AnimationCanvas.tsx`
- `src/components/animation/GhostTrail.tsx`

### Phase 4: Controls and UI (2-3 days)
**Deliverables:**
- `src/components/animation/AnimationControls.tsx`
- Speed selector, scrubber, step buttons
- Keyboard shortcuts (Space, arrows)

### Phase 5: Modal Integration (2-3 days)
**Deliverables:**
- `src/components/animation/PlayViewerModal.tsx`
- `src/hooks/useSwipeNavigation.ts` - Mobile swipe
- PlaybookEditor integration
- PlayCard modification

### Phase 6: Polish and Testing (2-3 days)
**Deliverables:**
- Performance optimization
- 22-player stress test
- Accessibility (ARIA labels, focus management)
- Integration tests

---

## 7. Performance Targets

- 60 FPS animation rendering
- <50ms to start from button press
- Smooth with 22 players on field
- Minimal battery drain on mobile

### Optimization Strategies
- SVG-based rendering (Canvas later if needed)
- Reuse player sprite instances
- Pre-calculate interpolation points
- Pause rendering when tab not visible

---

## 8. Files Summary

### New Files (15)
```
src/types/animation.types.ts
src/utils/animation.utils.ts
src/utils/bezier.utils.ts
src/contexts/AnimationContext.tsx
src/hooks/useAnimationEngine.ts
src/hooks/useAnimationTiming.ts
src/hooks/useSwipeNavigation.ts
src/components/animation/PlayViewerModal.tsx
src/components/animation/AnimationCanvas.tsx
src/components/animation/AnimationControls.tsx
src/components/animation/AnimatedPlayer.tsx
src/components/animation/AnimatedRoute.tsx
src/components/animation/GhostTrail.tsx
src/utils/animation.utils.test.ts
src/contexts/AnimationContext.test.tsx
```

### Modified Files (3)
```
src/components/playbook-editor/PlayCard.tsx - Add onAnimate prop
src/components/playbook-editor/PlaybookEditor.tsx - Add modal state & render
src/services/EventBus.ts - Add animation events
```

---

## 9. Future Enhancements (Phase 2+)

- **Ball Movement**: Handoffs, pitches, passes with collision detection
- **Collaborative Features**: Timestamped comments, share links
- **Offline Support**: Cache viewed plays for game day
- **Mobile Optimization**: Battery-saving 30 FPS mode
- **Export**: Animated GIFs, video export
