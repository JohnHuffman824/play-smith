# Unify Linemen as Players Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert linemen from ephemeral computed positions to first-class players that persist with the play, while maintaining hash alignment behavior and adding thumbnail rendering.

**Architecture:** Add `isLineman: boolean` flag to Player type. On new canvas creation, auto-create 5 lineman players. Hash button repositions all `isLineman: true` players. Linemen are protected from deletion. PlayThumbnailSVG renders both drawings and players.

**Tech Stack:** React, TypeScript, PostgreSQL (JSONB), Bun

---

## Task 1: Add `isLineman` to Player Type

**Files:**
- Modify: `src/contexts/PlayContext.tsx:15-21`
- Modify: `src/types/play.types.ts` (if Player type is also defined there)

**Step 1: Update Player interface in PlayContext.tsx**

```typescript
interface Player {
	id: string
	x: number
	y: number
	label: string
	color: string
	isLineman?: boolean  // true for offensive linemen, undefined/false for skill players
}
```

**Step 2: Verify no type errors**

Run: `bun build src/contexts/PlayContext.tsx --outdir /tmp --target browser`
Expected: Successful build

**Step 3: Commit**

```bash
git add src/contexts/PlayContext.tsx
git commit -m "feat: add isLineman flag to Player type"
```

---

## Task 2: Create Default Linemen Generator Function

**Files:**
- Create: `src/utils/lineman.utils.ts`
- Modify: `src/constants/field.constants.ts` (export needed constants)

**Step 1: Create lineman utility file**

```typescript
// src/utils/lineman.utils.ts
import {
	LINEMAN_Y,
	SPACING_CENTER_TO_CENTER,
	LEFT_HASH_INNER_EDGE,
	RIGHT_HASH_INNER_EDGE,
	CENTER_X,
} from '../constants/field.constants'
import type { HashAlignment } from '../types/field.types'

interface Player {
	id: string
	x: number
	y: number
	label: string
	color: string
	isLineman: boolean
}

const LINEMAN_LABELS = ['LT', 'LG', 'C', 'RG', 'RT']
const DEFAULT_LINEMAN_COLOR = '#3b82f6'

/**
 * Get the center X position based on hash alignment
 */
export function getCenterXForHash(hashAlignment: HashAlignment): number {
	switch (hashAlignment) {
		case 'left':
			return LEFT_HASH_INNER_EDGE
		case 'right':
			return RIGHT_HASH_INNER_EDGE
		default:
			return CENTER_X
	}
}

/**
 * Create the default 5 offensive linemen for a new play
 */
export function createDefaultLinemen(hashAlignment: HashAlignment = 'middle'): Player[] {
	const centerX = getCenterXForHash(hashAlignment)
	const timestamp = Date.now()

	return LINEMAN_LABELS.map((label, index) => {
		const offsetFromCenter = (index - 2) * SPACING_CENTER_TO_CENTER
		return {
			id: `lineman-${label}-${timestamp}-${index}`,
			x: centerX + offsetFromCenter,
			y: LINEMAN_Y,
			label,
			color: DEFAULT_LINEMAN_COLOR,
			isLineman: true,
		}
	})
}

/**
 * Reposition all linemen to a new hash alignment
 * Returns updated players array with linemen moved
 */
export function repositionLinemenForHash(
	players: Player[],
	newHashAlignment: HashAlignment
): Player[] {
	const newCenterX = getCenterXForHash(newHashAlignment)

	return players.map((player) => {
		if (!player.isLineman) return player

		// Find lineman index from label to calculate offset
		const labelIndex = LINEMAN_LABELS.indexOf(player.label)
		if (labelIndex === -1) return player

		const offsetFromCenter = (labelIndex - 2) * SPACING_CENTER_TO_CENTER
		return {
			...player,
			x: newCenterX + offsetFromCenter,
		}
	})
}
```

**Step 2: Verify build**

Run: `bun build src/utils/lineman.utils.ts --outdir /tmp --target browser`
Expected: Successful build

**Step 3: Commit**

```bash
git add src/utils/lineman.utils.ts
git commit -m "feat: add lineman utility functions"
```

---

## Task 3: Update PlayContext to Handle Linemen on Hash Change

**Files:**
- Modify: `src/contexts/PlayContext.tsx`

**Step 1: Add REPOSITION_LINEMEN_FOR_HASH action type**

Add to PlayAction union (around line 43):

```typescript
| { type: 'REPOSITION_LINEMEN_FOR_HASH'; alignment: HashAlignment }
```

**Step 2: Import repositionLinemenForHash**

Add import at top:

```typescript
import { repositionLinemenForHash } from '../utils/lineman.utils'
```

**Step 3: Add reducer case**

Add new function before playReducer:

```typescript
function applyRepositionLinemenForHash(
	state: PlayState,
	action: { type: 'REPOSITION_LINEMEN_FOR_HASH'; alignment: HashAlignment }
): PlayState {
	return {
		...state,
		hashAlignment: action.alignment,
		players: repositionLinemenForHash(state.players, action.alignment),
	}
}
```

Add case to switch statement:

```typescript
case 'REPOSITION_LINEMEN_FOR_HASH':
	return applyRepositionLinemenForHash(state, action)
```

**Step 4: Update setHashAlignment to use new action**

Modify the `setHashAlignment` callback:

```typescript
const setHashAlignment = useCallback((alignment: HashAlignment) => {
	dispatch({ type: 'REPOSITION_LINEMEN_FOR_HASH', alignment })
}, [])
```

**Step 5: Verify build**

Run: `bun build src/contexts/PlayContext.tsx --outdir /tmp --target browser`
Expected: Successful build

**Step 6: Commit**

```bash
git add src/contexts/PlayContext.tsx
git commit -m "feat: reposition linemen when hash alignment changes"
```

---

## Task 4: Initialize Default Linemen on New Play Creation

**Files:**
- Modify: `src/pages/PlayEditorPage.tsx`

**Step 1: Find where play state is initialized**

Look for where `setPlayers` is called or where initial state is set up.

**Step 2: Import createDefaultLinemen**

```typescript
import { createDefaultLinemen } from '../utils/lineman.utils'
```

**Step 3: Initialize linemen when creating new play**

When initializing a new (empty) play, call:

```typescript
const defaultLinemen = createDefaultLinemen(hashAlignment)
setPlayers(defaultLinemen)
```

When loading existing play, the players array from API already includes linemen (they're persisted).

**Step 4: Verify in browser**

- Create new play → should see 5 linemen
- Reload page → linemen should persist (after Task 6)

**Step 5: Commit**

```bash
git add src/pages/PlayEditorPage.tsx
git commit -m "feat: initialize default linemen on new play creation"
```

---

## Task 5: Remove Separate Lineman Component from Canvas

**Files:**
- Modify: `src/components/canvas/Canvas.tsx`

**Step 1: Remove Lineman-specific state and functions**

Remove:
- `linemanPositions` state
- `computeInitialLinemanPositions` function
- `handleLinemanPositionChange` function
- `handleFillLineman` function
- The `{linemanPositions.map((pos) => <Lineman .../>)}` render block

**Step 2: Update Player component to handle lineman behavior**

Linemen should:
- Not be deletable (check `isLineman` in delete handler)
- Move together as a group (handle in position change)

**Step 3: Protect linemen from deletion**

In the Player component's delete handler (or Canvas), check:

```typescript
const handlePlayerDeleteById = (id: string) => {
	const player = players.find(p => p.id === id)
	if (player?.isLineman) return // Protected from deletion
	// ... existing delete logic
}
```

**Step 4: Handle lineman group movement**

When a lineman is dragged, move ALL linemen by the same offset:

```typescript
const handlePlayerPositionChange = (id: string, newX: number, newY: number) => {
	const player = players.find(p => p.id === id)

	if (player?.isLineman) {
		// Calculate offset from original position
		const offsetX = newX - player.x
		const offsetY = newY - player.y

		// Move all linemen by same offset
		const updatedPlayers = players.map(p => {
			if (!p.isLineman) return p
			return { ...p, x: p.x + offsetX, y: p.y + offsetY }
		})
		setPlayers(updatedPlayers)
	} else {
		// Normal single-player update
		dispatch({ type: 'UPDATE_PLAYER', id, updates: { x: newX, y: newY } })
	}
}
```

**Step 5: Verify build and functionality**

Run: `bun build src/components/canvas/Canvas.tsx --outdir /tmp --target browser`
Test: Drag lineman → all move together; try delete lineman → should be blocked

**Step 6: Commit**

```bash
git add src/components/canvas/Canvas.tsx
git commit -m "refactor: use Player component for linemen, remove Lineman component"
```

---

## Task 6: Update API to Include Players in List Endpoint

**Files:**
- Modify: `src/api/plays.ts`

**Step 1: Add custom_players to list query**

Update the SELECT in the `list` function to include `p.custom_players`:

```typescript
const rawPlays = await db`
	SELECT
		p.id,
		p.name,
		p.section_id,
		p.play_type,
		p.formation_id,
		p.personnel_id,
		p.defensive_formation_id,
		p.updated_at,
		p.custom_players,
		p.custom_drawings,
		...
```

**Step 2: Include players in response**

Update the post-processing to include players:

```typescript
const plays = rawPlays.map((p: any) => {
	const conceptDrawings = p.concept_drawings || []
	const customDrawings = (typeof p.custom_drawings === 'string'
		? JSON.parse(p.custom_drawings)
		: p.custom_drawings || [])
	const customPlayers = (typeof p.custom_players === 'string'
		? JSON.parse(p.custom_players)
		: p.custom_players || [])

	return {
		id: p.id,
		name: p.name,
		section_id: p.section_id,
		play_type: p.play_type,
		formation_id: p.formation_id,
		personnel_id: p.personnel_id,
		defensive_formation_id: p.defensive_formation_id,
		updated_at: p.updated_at,
		tags: p.tags,
		drawings: [...conceptDrawings, ...customDrawings],
		players: customPlayers,
	}
})
```

**Step 3: Run existing tests**

Run: `bun test src/api/plays.test.ts`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/api/plays.ts
git commit -m "feat: include players in plays list endpoint"
```

---

## Task 7: Update PlayCard to Pass Players to Thumbnail

**Files:**
- Modify: `src/components/playbook-editor/PlayCard.tsx`
- Modify: `src/hooks/usePlaybookData.ts`

**Step 1: Add players to Play type in usePlaybookData.ts**

```typescript
export interface Play {
	id: string
	name: string
	section_id: string | null
	formation: string
	personnel?: string
	playType: string
	defensiveFormation: string
	tags: string[]
	tagObjects?: { id: number; name: string; color: string }[]
	lastModified: string
	drawings?: Drawing[]
	players?: Player[]  // Add this
}
```

**Step 2: Transform players in usePlaybookData.ts**

Update `transformPlay`:

```typescript
players: apiPlay.players || []
```

**Step 3: Add players prop to PlayCardProps**

```typescript
type PlayCardProps = {
	// ... existing props
	players?: Player[]
}
```

**Step 4: Pass players to PlayCardThumbnail**

```typescript
<PlayCardThumbnail
	thumbnail={thumbnail}
	drawings={drawings}
	players={players}
	name={name}
	playType={playType}
	onOpen={() => onOpen(id)}
/>
```

**Step 5: Commit**

```bash
git add src/components/playbook-editor/PlayCard.tsx src/hooks/usePlaybookData.ts
git commit -m "feat: pass players data to PlayCard thumbnail"
```

---

## Task 8: Update PlayThumbnailSVG to Render Players

**Files:**
- Modify: `src/components/playbook-editor/PlayThumbnailSVG.tsx`

**Step 1: Add Player type and update props**

```typescript
interface ThumbnailPlayer {
	id: string
	x: number
	y: number
	label: string
	color: string
	isLineman?: boolean
}

type PlayThumbnailSVGProps = {
	drawings: Drawing[]
	players?: ThumbnailPlayer[]
	className?: string
}
```

**Step 2: Update constants for proper view window**

```typescript
// Field constants for thumbnail rendering
const FIELD_WIDTH_FEET = 160
const FIELD_VIEW_HEIGHT_FEET = 60  // Show 60 feet of vertical field
const FIELD_VIEW_Y_OFFSET = 15     // Start view at Y=15 (shifted down)
const PLAYER_RADIUS_FEET = 2.0     // Player circle radius
```

**Step 3: Update transformPoint to use Y offset**

```typescript
function transformPoint(
	point: Coordinate,
	viewBoxWidth: number,
	viewBoxHeight: number,
	padding: number
): Coordinate {
	const availableWidth = viewBoxWidth - 2 * padding
	const scale = availableWidth / FIELD_WIDTH_FEET

	const x = point.x * scale + padding

	// Shift Y by offset, then flip
	// Field Y=15 should map to bottom, Y=75 to top
	const adjustedY = point.y - FIELD_VIEW_Y_OFFSET
	const y = (FIELD_VIEW_HEIGHT_FEET - adjustedY) * scale + padding

	return { x, y }
}
```

**Step 4: Add player rendering in component**

```typescript
export function PlayThumbnailSVG({ drawings, players = [], className }: PlayThumbnailSVGProps) {
	const hasContent = hasValidDrawings(drawings) || players.length > 0
	if (!hasContent) {
		return null
	}

	const viewBoxWidth = 160
	const viewBoxHeight = 60
	const padding = 5
	const scale = (viewBoxWidth - 2 * padding) / FIELD_WIDTH_FEET

	return (
		<svg
			viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
			className={className}
			preserveAspectRatio="xMidYMid meet"
		>
			{/* Render players first (behind drawings) */}
			{players.map((player) => {
				const pos = transformPoint(
					{ x: player.x, y: player.y },
					viewBoxWidth,
					viewBoxHeight,
					padding
				)
				const radius = PLAYER_RADIUS_FEET * scale
				return (
					<circle
						key={player.id}
						cx={pos.x}
						cy={pos.y}
						r={radius}
						fill={player.color}
						stroke="white"
						strokeWidth={0.5}
					/>
				)
			})}

			{/* Render drawings on top */}
			{drawings.map((drawing, index) => {
				const pathString = buildPathString(
					drawing,
					viewBoxWidth,
					viewBoxHeight,
					padding
				)
				if (!pathString) return null

				const isDashed = drawing.style.lineStyle === 'dashed'
				return (
					<path
						key={index}
						d={pathString}
						stroke={drawing.style.color}
						strokeWidth={drawing.style.strokeWidth * 0.5}
						fill="none"
						strokeDasharray={isDashed ? '2,2' : undefined}
					/>
				)
			})}
		</svg>
	)
}
```

**Step 5: Verify build**

Run: `bun build src/components/playbook-editor/PlayThumbnailSVG.tsx --outdir /tmp --target browser`
Expected: Successful build

**Step 6: Commit**

```bash
git add src/components/playbook-editor/PlayThumbnailSVG.tsx
git commit -m "feat: render players including linemen in play thumbnails"
```

---

## Task 9: Clean Up - Remove Lineman Component (Optional)

**Files:**
- Delete: `src/components/player/Lineman.tsx`
- Modify: `src/components/player/index.ts` (remove export)
- Modify: `src/services/EventBus.ts` (remove lineman:fill if unused)

**Step 1: Check for remaining Lineman imports**

Run: `grep -r "Lineman" src/ --include="*.ts" --include="*.tsx"`

Remove any remaining imports/usages.

**Step 2: Delete Lineman.tsx if no longer used**

**Step 3: Update index.ts export**

Remove `export { Lineman } from './Lineman'`

**Step 4: Clean up EventBus if lineman:fill is unused**

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated Lineman component"
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/contexts/PlayContext.tsx` | Add `isLineman` to Player, add REPOSITION_LINEMEN_FOR_HASH action |
| `src/utils/lineman.utils.ts` | NEW - createDefaultLinemen, repositionLinemenForHash |
| `src/pages/PlayEditorPage.tsx` | Initialize linemen on new play |
| `src/components/canvas/Canvas.tsx` | Remove Lineman rendering, use Player for linemen |
| `src/api/plays.ts` | Include players in list endpoint |
| `src/hooks/usePlaybookData.ts` | Add players to Play type |
| `src/components/playbook-editor/PlayCard.tsx` | Pass players to thumbnail |
| `src/components/playbook-editor/PlayThumbnailSVG.tsx` | Render players, fix Y offset |
| `src/components/player/Lineman.tsx` | DELETE |

---

## Verification Checklist

- [ ] New play creates 5 linemen automatically
- [ ] Linemen persist when play is saved and reloaded
- [ ] Hash button moves all linemen together
- [ ] Dragging one lineman moves all linemen
- [ ] Linemen cannot be deleted (protected)
- [ ] Skill players can still be added, moved, deleted
- [ ] PlayThumbnailSVG shows players including linemen
- [ ] Thumbnail shows drawings right-side up
- [ ] Thumbnail view is shifted down ~15 feet
- [ ] All existing tests pass
