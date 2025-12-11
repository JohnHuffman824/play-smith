# Smooth Drawing Architecture

## Overview

This document explains how smooth curve rendering works in the Play Smith drawing system. The implementation uses **Chaikin's corner-cutting algorithm** with **render-time smoothing** to achieve visually smooth curves while maintaining a simple, efficient data model.

---

## The Problem

When users draw routes or movements on the field, raw mouse input creates hundreds of coordinate points. Without processing, this leads to three major issues:

1. **Jagged lines** - Mouse jitter creates visually unappealing paths
2. **Data bloat** - Storing hundreds of points per drawing is inefficient
3. **Editing difficulty** - Too many control points makes dragging/editing cumbersome

### Initial Approach: Catmull-Rom Splines

The first attempt used:
- **RDP (Ramer-Douglas-Peucker) simplification** to reduce points
- **Catmull-Rom splines** to calculate bezier handle directions
- **Cubic bezier curves** for rendering

**Problem:** Catmull-Rom calculates handle directions as:
```typescript
tangent = (next.x - prev.x, next.y - prev.y)
```

This creates handles pointing toward the "average" direction, which often didn't match the user's actual stroke curvature, causing **direction artifacts** (lines coming out of nodes in wrong directions).

---

## The Solution: Render-Time Chaikin Smoothing

### Architecture Philosophy

**Separate the data model from the visual representation:**

```
┌─────────────────────┐
│   DATA MODEL        │  ← Simple, few points (~5-15)
│   (What we store)   │  ← Easy to edit/drag
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  RENDER PIPELINE    │  ← Apply Chaikin smoothing
│  (What we draw)     │  ← Many points for smooth visuals
└─────────────────────┘
```

### Why Chaikin's Algorithm?

**Advantages:**
- ✅ **Simple math** - Just linear interpolation at 1/4 and 3/4 positions
- ✅ **No handle calculations** - No bezier control points = no direction artifacts
- ✅ **Predictable results** - Always follows the control polygon shape
- ✅ **Efficient** - Fast computation, easy to understand
- ✅ **Adjustable smoothness** - More iterations = smoother curves

**Comparison to alternatives:**

| Approach | Complexity | Artifacts | Data Size | Performance |
|----------|-----------|-----------|-----------|-------------|
| **Chaikin (chosen)** | Simple | None | Small | Excellent |
| Catmull-Rom | Medium | Direction issues | Small | Good |
| B-Splines | High | None | Small | Good |
| Raw points | None | Jagged | Large | Poor |

---

## How Chaikin's Algorithm Works

### Basic Principle

For each pair of consecutive points, create two new points at **1/4** and **3/4** positions along the line segment.

```
Original:    A ──────────── B ──────────── C

After 1 iteration:
             A   Q₁ ─ R₁    B   Q₂ ─ R₂    C

Where:
  Q₁ = 0.75·A + 0.25·B  (1/4 from A to B)
  R₁ = 0.25·A + 0.75·B  (3/4 from A to B)
  Q₂ = 0.75·B + 0.25·C  (1/4 from B to C)
  R₂ = 0.25·B + 0.75·C  (3/4 from B to C)
```

### Visual Progression

```
Original (3 points):
   A ────────── B ────────── C

After 1 iteration (4 points):
   Q₁ ─── R₁ ── Q₂ ─── R₂

After 2 iterations (8 points):
   ●─●─●──●─●──●─●──●

After 3 iterations (16 points):
   ●●●●●●●●●●●●●●●●   ← Looks smooth!
```

### Mathematical Formula

```typescript
// For points P₀ and P₁, create:
Q = {
  x: 0.75 * P₀.x + 0.25 * P₁.x,
  y: 0.75 * P₀.y + 0.25 * P₁.y
}

R = {
  x: 0.25 * P₀.x + 0.75 * P₁.x,
  y: 0.25 * P₀.y + 0.75 * P₁.y
}
```

---

## Implementation Details

### Two-Stage Pipeline

#### Stage 1: Data Model (smooth-path.utils.ts)

**Purpose:** Simplify raw input to a few control points for storage.

```typescript
export function processSmoothPath(
  coords: Coordinate[]
): { points: Record<string, ControlPoint>; segments: PathSegment[] } {
  // Use RDP to simplify to ~5-15 control points
  const simplified = simplifyRDP(coords, SIMPLIFICATION_TOLERANCE)

  // Store as simple line segments (no bezier handles!)
  const segments: PathSegment[] = []
  for (let i = 0; i < simplified.length - 1; i++) {
    segments.push({
      type: 'line',
      pointIds: [`p-${i}`, `p-${i + 1}`]
    })
  }

  return { points, segments }
}
```

**Key constant:**
```typescript
const SIMPLIFICATION_TOLERANCE = 0.3  // feet
```
- Lower value = more control points (follows path more closely)
- Higher value = fewer control points (more simplification)

#### Stage 2: Render Time (PathRenderer.tsx)

**Purpose:** Apply Chaikin smoothing only when drawing to SVG.

```typescript
function buildPath(drawing: Drawing, coordSystem: FieldCoordinateSystem) {
  // Check if this should be smoothed
  const isAllLineSegments = drawing.segments.every(s => s.type === 'line')
  const shouldSmooth = isAllLineSegments && drawing.style.pathMode === 'curve'

  if (shouldSmooth) {
    // Collect control points in pixel coordinates
    const allPixelPoints: PixelPoint[] = /* ... */

    // Apply Chaikin smoothing (3 iterations)
    const smoothed = applyChaikin(allPixelPoints, CHAIKIN_ITERATIONS)

    // Build SVG path from smoothed points
    commands.push(`M ${smoothed[0].x} ${smoothed[0].y}`)
    for (let i = 1; i < smoothed.length; i++) {
      commands.push(`L ${smoothed[i].x} ${smoothed[i].y}`)
    }
  }

  return { d: commands.join(' '), endPoints }
}
```

**Key constant:**
```typescript
const CHAIKIN_ITERATIONS = 3
```
- More iterations = smoother but more points
- 3 iterations is the sweet spot (original × 2³ = 8× points)

---

## Endpoint Preservation

### The Problem

Standard Chaikin replaces **all** points, including endpoints:

```
Before:  ●────────●────────●
          ↑                 ↑
        Start              End

After:      ●──●──●──●──●──●
         (gap!)        (gap!)
```

Users see gaps between the smooth curve and their control nodes.

### The Solution

**Modified Chaikin with endpoint preservation:**

```typescript
function chaikinSubdivide(
  points: PixelPoint[],
  preserveEndpoints: boolean = false
): PixelPoint[] {
  const result: PixelPoint[] = []

  // Keep original first point
  if (preserveEndpoints) {
    result.push(points[0])
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]

    if (preserveEndpoints && i === 0) {
      // First segment: only add R point (skip Q)
      result.push({
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
      })
    } else if (preserveEndpoints && i === points.length - 2) {
      // Last segment: only add Q point (skip R)
      result.push({
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
      })
    } else {
      // Middle segments: add both Q and R
      result.push(
        { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y },
        { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y }
      )
    }
  }

  // Keep original last point
  if (preserveEndpoints) {
    result.push(points[points.length - 1])
  }

  return result
}
```

### Visual Result

```
With endpoint preservation:

Iteration 0:  ●────────●────────●
              ↑                 ↑
            Start              End

Iteration 1:  ●──○──○──●──○──○──●
              ↑                 ↑
            (preserved!)   (preserved!)

Iteration 2:  ●○○○○○○○○●○○○○○○○○●
              ↑                 ↑
           Perfect!         Perfect!
```

---

## Performance Characteristics

### Memory Usage

**Example: Drawing a semi-circle**

| Stage | Points | Memory |
|-------|--------|--------|
| Raw mouse input | ~200 points | ~3.2 KB |
| After RDP simplification | ~7 points | ~112 bytes |
| **Stored in database** | **7 points** | **112 bytes** |
| After Chaikin (render only) | ~56 points | ~896 bytes (transient) |

**Savings:** 28× reduction in stored data!

### Computation Cost

**Per drawing render:**
1. Convert 7 points from feet → pixels: **O(n)** where n ≈ 7
2. Apply Chaikin 3 times: **O(n × 2^iterations)** = O(7 × 8) = **O(56)**
3. Build SVG path: **O(56)**

**Total: ~140 operations per drawing** - imperceptible even with 100+ drawings.

### Why Render-Time vs Pre-Computed?

| Approach | Data Size | Flexibility | Edit Experience |
|----------|-----------|-------------|-----------------|
| **Pre-compute Chaikin** | Large (56 points) | Poor (can't adjust smoothness) | Bad (56 nodes to drag) |
| **Render-time Chaikin** | Small (7 points) | Excellent (change iterations) | Great (7 nodes to drag) |

Render-time is clearly superior for interactive editing.

---

## Code Organization

### File Structure

```
src/
├── utils/
│   └── smooth-path.utils.ts     # RDP simplification (data model)
├── components/
│   └── canvas/
│       └── PathRenderer.tsx      # Chaikin smoothing (render)
└── types/
    └── drawing.types.ts          # PathSegment, ControlPoint types
```

### Key Functions

**smooth-path.utils.ts:**
- `processSmoothPath()` - Main entry point
- `simplifyRDP()` - Recursive point reduction
- `perpendicularDistance()` - RDP distance calculation

**PathRenderer.tsx:**
- `buildPath()` - Detects smooth mode, applies Chaikin
- `chaikinSubdivide()` - Single iteration with endpoint preservation
- `applyChaikin()` - Multi-iteration wrapper

---

## Tuning Parameters

### SIMPLIFICATION_TOLERANCE (smooth-path.utils.ts)

```typescript
const SIMPLIFICATION_TOLERANCE = 0.3  // feet
```

**Effect on control points:**
- `0.1` = ~15-20 points (very faithful to original)
- `0.3` = ~5-10 points (balanced) ← **current**
- `0.5` = ~3-5 points (aggressive simplification)

**Trade-off:** Fewer points = simpler edits but less precise path following.

### CHAIKIN_ITERATIONS (PathRenderer.tsx)

```typescript
const CHAIKIN_ITERATIONS = 3
```

**Effect on smoothness:**
- `1` = 2× points, slightly smooth
- `2` = 4× points, moderately smooth
- `3` = 8× points, very smooth ← **current**
- `4` = 16× points, extremely smooth (diminishing returns)

**Trade-off:** More iterations = smoother curves but more render computation.

---

## Usage Examples

### Drawing Mode Toggle

Users can switch between **sharp** and **curve** modes:

```typescript
// In PathStyle
interface PathStyle {
  pathMode: 'sharp' | 'curve'
  // ... other properties
}
```

**Sharp mode:**
- Draws straight lines between control points
- No Chaikin smoothing applied
- Shows exact control polygon

**Curve mode:**
- Applies Chaikin smoothing at render time
- Smooth flowing curves
- Same control points, different visual

### Editing Behavior

**When user drags a control point:**
1. Update point position in data model (7 points)
2. React re-renders PathRenderer component
3. `buildPath()` detects changes
4. Applies Chaikin to new positions
5. SVG path updates smoothly

**No lag** - Chaikin on 7 points is instant.

---

## Edge Cases & Handling

### 1. Single Point Drawing

```typescript
if (coords.length === 1) {
  return {
    points: { 'p-0': { ...coords[0], type: 'start' } },
    segments: []  // No segments to draw
  }
}
```

**Result:** Just a dot at the point location.

### 2. Two Point Drawing

```typescript
if (coords.length === 2) {
  return {
    points: { 'p-0': ..., 'p-1': ... },
    segments: [{ type: 'line', pointIds: ['p-0', 'p-1'] }]
  }
}
```

**Result:** Straight line (Chaikin needs 3+ points for curves).

### 3. Straight Line After RDP

```typescript
const simplified = simplifyRDP(coords, SIMPLIFICATION_TOLERANCE)
if (simplified.length === 2) {
  // User drew essentially straight - no smoothing needed
  return straightLine(simplified)
}
```

**Result:** Preserves intentional straight lines.

### 4. Mixed Segment Types

```typescript
const isAllLineSegments = drawing.segments.every(s => s.type === 'line')
const shouldSmooth = isAllLineSegments && drawing.style.pathMode === 'curve'
```

**Result:** Only smooth drawings that came from smooth-path processing. Existing cubic/quadratic curves use their original rendering.

---

## Future Improvements

### Potential Optimizations

1. **Memoization** - Cache Chaikin results per drawing ID
   ```typescript
   const smoothCache = new Map<string, PixelPoint[]>()
   ```
   Re-compute only when control points change.

2. **Web Workers** - Offload Chaikin computation for 100+ drawings
   ```typescript
   const worker = new Worker('chaikin-worker.ts')
   ```

3. **Adaptive Iterations** - Fewer iterations for short paths
   ```typescript
   const iterations = points.length < 5 ? 2 : 3
   ```

### Alternative Algorithms

If Chaikin proves insufficient:

1. **Cubic B-Splines** - Better mathematical properties
2. **Hermite Splines** - More local control
3. **Subdivision Surfaces** - Limit surfaces theory

---

## References

### Academic Papers

- **Chaikin, G.** (1974). "An algorithm for high speed curve generation." *Computer Graphics and Image Processing*, 3(4), 346-349.
- **Ramer, U.** (1972). "An iterative procedure for the polygonal approximation of plane curves." *Computer Graphics and Image Processing*, 1(3), 244-256.
- **Douglas, D. & Peucker, T.** (1973). "Algorithms for the reduction of the number of points required to represent a digitized line or its caricature." *Cartographica*, 10(2), 112-122.

### Useful Links

- [Chaikin's Algorithm Visualization](https://observablehq.com/@infowantstobefierce/chaikins-algorithm)
- [RDP Algorithm Explained](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm)
- [SVG Path Commands](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths)

---

## Testing & Validation

### Visual Tests

1. **Semi-circle** - Should be smooth, no sharp corners
2. **S-curve** - Should flow naturally
3. **Sharp angles** - Should round appropriately
4. **Endpoint alignment** - No gaps at control nodes

### Performance Tests

```typescript
// Benchmark: 100 drawings with 7 points each
const start = performance.now()
for (let i = 0; i < 100; i++) {
  const smoothed = applyChaikin(points, 3)
  buildSVGPath(smoothed)
}
const duration = performance.now() - start
console.log(`Render time: ${duration}ms`)
// Expected: < 16ms (60 FPS)
```

### Unit Tests

```typescript
describe('chaikinSubdivide', () => {
  it('preserves endpoints when flag is true', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 }
    ]
    const result = chaikinSubdivide(points, true)
    expect(result[0]).toEqual(points[0])  // First preserved
    expect(result[result.length - 1]).toEqual(points[2])  // Last preserved
  })
})
```

---

## Troubleshooting

### Issue: Curves still look jagged

**Possible causes:**
1. `CHAIKIN_ITERATIONS` too low → Increase to 4
2. `SIMPLIFICATION_TOLERANCE` too high → Decrease to 0.2
3. Drawing in sharp mode → Check `pathMode === 'curve'`

### Issue: Control points don't align with curve

**Cause:** Endpoint preservation disabled.

**Fix:** Ensure `chaikinSubdivide(points, true)` in all iterations.

### Issue: Performance lag with many drawings

**Solutions:**
1. Implement memoization cache
2. Reduce `CHAIKIN_ITERATIONS` to 2
3. Use Web Workers for parallel processing

---

## Conclusion

The render-time Chaikin smoothing architecture provides:
- ✅ **Smooth visuals** - No artifacts, natural curves
- ✅ **Small data** - 28× reduction in storage
- ✅ **Easy editing** - Few control points to drag
- ✅ **High performance** - Fast enough for real-time
- ✅ **Simple code** - Easy to understand and maintain

This approach separates **what we store** (simple control polygon) from **what we show** (smooth subdivision curve), giving us the best of both worlds.

---

*Document Version: 1.0*
*Last Updated: 2025-12-10*
*Author: Claude (with Jack Huffman)*
