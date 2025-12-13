# Play Animation System

**Status:** ✅ Implemented (December 2024)

The animation system allows coaches to view plays in motion, with players moving along their assigned routes in synchronized playback for teaching, film study, and presentation.

## Overview

Play animation transforms static play diagrams into dynamic visualizations, helping coaches teach concepts, explain assignments, and present game plans. The system animates players following their linked routes with configurable playback controls and visual effects.

## Animation Features

### Playback Controls

**Play/Pause Toggle:**
- Click play button to start animation
- Click pause button to stop animation
- Playback state persists (can resume from pause point)

**Speed Controls:**
- **0.5x:** Half speed for detailed coaching
- **1x:** Normal speed (default, represents real-time)
- **1.5x:** 50% faster for quick review
- **2x:** Double speed for rapid playback

**Speed Adjustment:**
- Click speed button to toggle through speeds
- Current speed highlighted
- Smooth transition between speeds (no jarring jumps)

**Timeline Scrubbing (Future):**
- Drag timeline slider to specific point in animation
- Click timeline to jump to that timestamp
- Visual markers for key events (snap, break points)

### Visual Effects

**Animated Players:**
- Players move along linked route paths
- Smooth interpolation between route control points
- Constant speed along route (unless route specifies tempo changes)
- Player circle maintains size during movement

**Ghost Trail:**
- Semi-transparent trail shows player's path history
- Fades as player moves forward
- Configurable trail length (1-3 seconds of movement)
- Helps visualize spacing and timing

**Route Progressive Drawing:**
- Route appears progressively as player moves
- Opacity gradient: solid behind player, fading ahead
- Shows "where the route goes" as player runs it
- Alternative: Full route visible throughout (user preference)

**Synchronized Animation:**
- All players start on "snap" (timestamp 0)
- Players reach route depths at realistic times
- Speed adjustments affect all players equally

### Animation Page

**Route:** `/playbooks/:playbookId/animate/:playId`

**Layout:**
- Full-screen animation canvas
- Field rendered at optimal zoom for viewing
- Playback controls at bottom
- Exit button returns to play editor or playbook

**Canvas Rendering:**
- Field markings visible (hash marks, yard lines, numbers)
- Players and routes rendered on top
- No editing controls (view-only mode)

**Navigation:**
- Access via "Animate" button on play card
- Or play editor menu → "Preview Animation"
- Exit returns to previous view

## Animation Timing

### Route Timing Calculation

**Default Timing:**
- Average player speed: 15 ft/second (~10 mph, realistic jog pace)
- Route duration = route length / player speed
- Example: 30-foot route takes 2 seconds

**Custom Timing (Future):**
- Per-player speed (WR faster than TE)
- Per-route tempo (go route vs curl route)
- Timed to music/metronome (for practice cadence)

### Synchronization

**Snap Count:**
- Animation starts at timestamp 0 (the snap)
- All players begin moving simultaneously
- Pre-snap motion handled separately (future)

**Route Completion:**
- Animation continues until longest route completes
- Or loops back to start (configurable)
- Or holds final positions (freeze frame)

### Animation Loop

**Loop Mode:**
- Play animates, then resets to start
- Seamless loop for continuous playback
- Useful for presentations and film study

**Single Play Mode:**
- Animate once, then pause at end
- Requires manual replay
- Useful for step-by-step coaching

## Technical Implementation

### Core Components

**AnimationContext:**
- **Location:** `src/contexts/AnimationContext.tsx`
- **State:** Playback status, speed, current time
- **Methods:** play(), pause(), setSpeed(), seek()

**AnimationCanvas:**
- **Location:** `src/components/animation/AnimationCanvas.tsx`
- **Renders:** Field, players, routes, trails
- **Updates:** 60fps via requestAnimationFrame

**AnimatedPlayer:**
- **Location:** `src/components/animation/AnimatedPlayer.tsx`
- **Position Interpolation:** Calculate current position based on timestamp
- **Rendering:** Player circle at interpolated position

**AnimatedRoute:**
- **Location:** `src/components/animation/AnimatedRoute.tsx`
- **Progressive Drawing:** Render route from start to player's current position
- **Styling:** Matches static route (color, thickness, end style)

**GhostTrail:**
- **Location:** `src/components/animation/GhostTrail.tsx`
- **Trail Effect:** Semi-transparent circles showing player history
- **Fade:** Opacity decreases with age (newest = 0.6, oldest = 0.1)

### Custom Hooks

**useAnimationEngine:**
- Manages animation loop (requestAnimationFrame)
- Calculates frame deltas
- Triggers re-renders

**useAnimationTiming:**
- Converts route geometry to timing data
- Calculates player positions at any timestamp
- Handles speed multipliers

### Animation Algorithm

**Position Interpolation:**

```typescript
function interpolatePosition(route, timestamp, speed) {
  // 1. Calculate total route length
  const totalLength = calculateRouteLength(route);

  // 2. Determine how far player has traveled
  const distance = timestamp * PLAYER_SPEED * speed;

  // 3. Clamp to route length (don't overshoot)
  const clampedDistance = Math.min(distance, totalLength);

  // 4. Find position along route at this distance
  return getPositionAtDistance(route, clampedDistance);
}
```

**Segment Traversal:**

```typescript
function getPositionAtDistance(route, targetDistance) {
  let accumulatedDistance = 0;

  for (const segment of route.segments) {
    const segmentLength = segment.length;

    if (accumulatedDistance + segmentLength >= targetDistance) {
      // Target is within this segment
      const segmentProgress = (targetDistance - accumulatedDistance) / segmentLength;
      return interpolateSegment(segment, segmentProgress);
    }

    accumulatedDistance += segmentLength;
  }

  // End of route
  return route.segments[route.segments.length - 1].end;
}
```

## Animation Performance

### Optimization Strategies

**Canvas Rendering:**
- Single canvas for all elements (no layering overhead)
- Dirty rectangle optimization (redraw only changed areas - future)
- Hardware acceleration via CSS transforms

**Frame Rate:**
- Target: 60fps
- Actual: Depends on play complexity (player count, route count)
- Fallback: Reduce trail length if fps drops below 30

**Memory Management:**
- Trail history limited to 60 frames (1 second at 60fps)
- Older frames discarded
- No memory leaks during long animations

### Performance Benchmarks

**Typical Play (11 players, 5 routes):**
- Frame time: ~8ms
- FPS: 120+ (capped at 60 for smoothness)

**Complex Play (22 players, 15 routes):**
- Frame time: ~14ms
- FPS: 70+

**Very Complex (30+ players, 20+ routes):**
- Frame time: ~20ms
- FPS: 50 (acceptable, still smooth)

## Use Cases

### Teaching New Plays

**Workflow:**
1. Open play in editor
2. Click "Animate" button
3. Play animation at 0.5x speed
4. Pause at key break points
5. Explain assignment to player
6. Resume animation to show result

**Benefits:**
- Players see route in motion, not just static diagram
- Timing relationships visible (who arrives when)
- Spacing concepts clearer

### Film Study Comparison

**Workflow:**
1. Animate designed play
2. Compare to game film of execution
3. Identify discrepancies (depth, spacing, timing)
4. Adjust play design or coaching points

**Future:** Side-by-side animation + film (split screen)

### Presentation Mode

**Workflow:**
1. Create presentation with multiple plays (see [Presentations](../presentations/presentation-system.md))
2. Animate each play in sequence
3. Use loop mode for continuous playback
4. Advance to next play when ready

**Benefits:**
- Dynamic slideshow for team meetings
- More engaging than static diagrams
- Emphasizes motion and timing

### Self-Paced Learning

**Workflow:**
1. Coach shares playbook with players
2. Players access plays on mobile/tablet
3. Animate plays at home for study
4. Scrub timeline to review specific points (future)

**Future:** Interactive quiz mode (pause, ask "where does X go?", resume)

## Animation Limitations

### Current Limitations

**No Pre-Snap Motion:**
- Animation starts at snap (timestamp 0)
- Pre-snap motion paths not animated (future enhancement)

**No Defensive Movement:**
- Only offensive players animated
- Defensive alignments static (future: animate coverage drops)

**Linear Speed:**
- Players move at constant speed along route
- No acceleration/deceleration at breaks (future: tempo curves)

**No Blocking Animation:**
- Blocking schemes shown as static arrows
- OL movement not animated (future)

### Future Enhancements

**Pre-Snap Motion:**
- Animate motion before snap
- Configurable pre-snap duration (2-5 seconds)
- Snap count trigger

**Defensive Animation:**
- Animate coverage drops (Cover 2, Cover 3, man)
- Show blitz paths
- QB read progression visualization

**Tempo Control:**
- Accelerate out of breaks
- Decelerate into curls/comebacks
- Variable speed per route segment

**Camera Angles:**
- Overhead (current default)
- Sideline view
- Endzone view
- Follow player (camera tracks specific player)

## Animation Export (Future)

### Video Export

**Format:** MP4, WebM
**Resolution:** 1080p, 4K
**Use Cases:**
- Share on social media
- Include in recruiting videos
- Embed in presentations

### GIF Export

**Format:** Animated GIF
**Use Cases:**
- Quick sharing (text message, email)
- Low file size
- No audio needed

### Integration with Film Software

**Export to Hudl, XOS, etc.:**
- Overlay animated play on film
- Side-by-side comparison
- Sync timing with actual play execution

## Accessibility

### Screen Reader Support

**Narration Mode (Future):**
- Text-to-speech describes player movements
- "X runs 12-yard post, breaks at 10 yards"
- Alternative to visual animation

### Keyboard Controls

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| Left Arrow | Rewind 1 second |
| Right Arrow | Fast forward 1 second |
| < | Decrease speed |
| > | Increase speed |
| R | Restart animation |
| Escape | Exit animation view |

## See Also

- [Play Editor Overview](../play-editor/overview.md) - Creating plays to animate
- [Drawing System](../play-editor/drawing-system.md) - Route creation and player linking
- [Presentations](../presentations/presentation-system.md) - Animating plays in presentations
- [Player Management](../play-editor/player-management.md) - Player components
