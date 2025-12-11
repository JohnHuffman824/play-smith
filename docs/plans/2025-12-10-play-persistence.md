# Play Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable saving and loading of custom plays with free-form player positions and drawings, while maintaining support for formation/concept-based plays.

**Architecture:** Add `custom_players` and `custom_drawings` JSONB columns to the plays table to store raw play data. Update API endpoints to save/load this data. Implement save/load handlers in the frontend to persist PlayContext state. Support hybrid plays (both concepts AND custom data).

**Tech Stack:** PostgreSQL (JSONB), Bun, React Context, TypeScript

---

## Root Cause Summary

**Problem:** Save button does nothing - it's a TODO stub in `PlayEditorPage.tsx:72-86` that fakes success without calling any API.

**Secondary Issue:** Database schema only supports template-based plays (formations + concepts), not free-form custom plays.

**Solution:** Add JSONB columns for custom data + implement save/load API + connect frontend handlers.

---

## Task 1: Database Migration - Add Custom Data Columns

**Files:**
- Create: `src/db/migrations/011_add_custom_play_data.sql`

**Step 1: Write migration to add JSONB columns**

Create the migration file with:

```sql
-- Add custom play data columns to support free-form editing
-- These columns store raw player positions and drawings that aren't based on formations/concepts

ALTER TABLE plays ADD COLUMN custom_players JSONB DEFAULT '[]'::jsonb;
ALTER TABLE plays ADD COLUMN custom_drawings JSONB DEFAULT '[]'::jsonb;

-- Add indexes for JSONB queries (optional but recommended for performance)
CREATE INDEX idx_plays_custom_players ON plays USING gin(custom_players);
CREATE INDEX idx_plays_custom_drawings ON plays USING gin(custom_drawings);

COMMENT ON COLUMN plays.custom_players IS 'Free-form player positions not derived from formations';
COMMENT ON COLUMN plays.custom_drawings IS 'Free-form drawings/routes not derived from concepts';
```

**Step 2: Run migration**

Run: `bun run migrate` or manually apply the migration to your database

Expected: Migration succeeds, columns added to plays table

**Step 3: Verify migration**

Run: `psql $DATABASE_URL -c "\d plays"` (if database is accessible)

Expected: See `custom_players` and `custom_drawings` columns of type `jsonb`

**Step 4: Commit**

```bash
git add src/db/migrations/011_add_custom_play_data.sql
git commit -m "feat: add custom_players and custom_drawings columns to plays table"
```

---

## Task 2: Update API GET Endpoint - Load Custom Data

**Files:**
- Modify: `src/api/plays.ts:42-137` (the `get` function)
- Test: `src/api/plays.test.ts` (will add test later)

**Step 1: Write failing test for loading custom play data**

Add to `src/api/plays.test.ts` after existing tests:

```typescript
test('GET /api/plays/:playId returns custom players and drawings', async () => {
	// Create a play with custom data
	const [play] = await db`
		INSERT INTO plays (playbook_id, name, created_by, custom_players, custom_drawings)
		VALUES (
			${testPlaybookId},
			'Custom Play',
			${testUserId},
			${JSON.stringify([
				{ id: 'p1', x: 100, y: 200, label: 'WR', color: '#ff0000' }
			])},
			${JSON.stringify([
				{ id: 'd1', segments: [[{x: 100, y: 200}, {x: 150, y: 250}]], color: '#000000' }
			])}
		)
		RETURNING id
	`

	const response = await fetch(`http://localhost:${testPort}/api/plays/${play.id}`, {
		headers: { Cookie: sessionCookie }
	})

	expect(response.status).toBe(200)
	const data = await response.json()

	expect(data.play.players).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ id: 'p1', x: 100, y: 200, label: 'WR' })
		])
	)
	expect(data.play.drawings).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ id: 'd1', color: '#000000' })
		])
	)
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/api/plays.test.ts`

Expected: Test fails because custom players/drawings aren't returned yet

**Step 3: Update GET endpoint to include custom data**

In `src/api/plays.ts`, modify the `get` function (around line 42-137):

```typescript
get: async (req: Request) => {
	const userId = await getSessionUser(req)
	if (!userId) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const playId = parseInt(req.params.playId)
	if (isNaN(playId)) {
		return Response.json({ error: 'Invalid play ID' }, { status: 400 })
	}

	const [play] = await db`SELECT * FROM plays WHERE id = ${playId}`
	if (!play) {
		return Response.json({ error: 'Play not found' }, { status: 404 })
	}

	const { hasAccess } = await checkPlaybookAccess(play.playbook_id, userId)
	if (!hasAccess) {
		return Response.json({ error: 'Access denied' }, { status: 403 })
	}

	let players: PlayerData[] = []

	// Load players from formation (existing logic)
	if (play.formation_id) {
		const positions: FormationPosition[] = await db`
			SELECT id, role, position_x, position_y
			FROM formation_player_positions
			WHERE formation_id = ${play.formation_id}
		`
		players = positions.map((pos) => ({
			id: `player-${pos.role}-${pos.id}`,
			x: Number(pos.position_x),
			y: Number(pos.position_y),
			label: pos.role,
			color: '#000000',
		}))
	}

	// Add custom players (NEW)
	const customPlayers = (play.custom_players || []) as PlayerData[]
	players = [...players, ...customPlayers]

	// Load drawings from concepts (existing logic)
	const conceptApplications: ConceptApplication[] = await db`
		SELECT ca.concept_id, ca.concept_group_id, ca.order_index
		FROM concept_applications ca
		WHERE ca.play_id = ${playId}
		ORDER BY ca.order_index
	`

	const directConceptIds = conceptApplications
		.filter((ca) => ca.concept_id !== null)
		.map((ca) => ca.concept_id as number)

	const conceptGroupIds = conceptApplications
		.filter((ca) => ca.concept_group_id !== null)
		.map((ca) => ca.concept_group_id as number)

	let groupConceptIds: number[] = []
	if (conceptGroupIds.length > 0) {
		const groupConcepts: GroupConcept[] = await db`
			SELECT concept_id
			FROM concept_group_concepts
			WHERE concept_group_id = ANY(${conceptGroupIds})
		`
		groupConceptIds = groupConcepts.map((gc) => gc.concept_id)
	}

	const allConceptIds = [...directConceptIds, ...groupConceptIds]

	let drawings: Record<string, unknown>[] = []
	if (allConceptIds.length > 0) {
		const assignments: ConceptAssignment[] = await db`
			SELECT id, concept_id, role, drawing_data, order_index
			FROM concept_player_assignments
			WHERE concept_id = ANY(${allConceptIds})
			ORDER BY order_index
		`

		drawings = assignments
			.filter((a) => a.drawing_data !== null)
			.map((a) => {
				const drawingData = a.drawing_data as Record<string, unknown>
				const linkedPlayer = players.find((p) => p.label === a.role)
				return {
					...drawingData,
					id: drawingData.id ?? `drawing-${a.id}`,
					playerId: linkedPlayer?.id ?? null,
				}
			})
	}

	// Add custom drawings (NEW)
	const customDrawings = (play.custom_drawings || []) as Record<string, unknown>[]
	drawings = [...drawings, ...customDrawings]

	return Response.json({
		play: {
			id: String(play.id),
			name: play.name || 'Untitled Play',
			formation: play.formation_id ? String(play.formation_id) : '',
			defensiveFormation: play.defensive_formation_id ? String(play.defensive_formation_id) : '',
			hashAlignment: play.hash_position || 'middle',
			players,
			drawings,
		},
	})
},
```

**Step 4: Run test to verify it passes**

Run: `bun test src/api/plays.test.ts`

Expected: New test passes

**Step 5: Commit**

```bash
git add src/api/plays.ts src/api/plays.test.ts
git commit -m "feat: GET /api/plays/:playId returns custom players and drawings"
```

---

## Task 3: Update API PUT Endpoint - Save Custom Data

**Files:**
- Modify: `src/api/plays.ts:227-292` (the `update` function)
- Test: `src/api/plays.test.ts`

**Step 1: Write failing test for saving custom data**

Add to `src/api/plays.test.ts`:

```typescript
test('PUT /api/plays/:playId saves custom players and drawings', async () => {
	const [play] = await db`
		INSERT INTO plays (playbook_id, name, created_by)
		VALUES (${testPlaybookId}, 'Test Play', ${testUserId})
		RETURNING id
	`

	const customPlayers = [
		{ id: 'p1', x: 100, y: 200, label: 'QB', color: '#0000ff' },
		{ id: 'p2', x: 150, y: 250, label: 'WR', color: '#ff0000' }
	]

	const customDrawings = [
		{ id: 'd1', segments: [[{x: 100, y: 200}, {x: 150, y: 250}]], color: '#000000', lineStyle: 'solid' }
	]

	const response = await fetch(`http://localhost:${testPort}/api/plays/${play.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Cookie: sessionCookie
		},
		body: JSON.stringify({
			custom_players: customPlayers,
			custom_drawings: customDrawings
		})
	})

	expect(response.status).toBe(200)

	// Verify data was saved
	const [saved] = await db`
		SELECT custom_players, custom_drawings
		FROM plays
		WHERE id = ${play.id}
	`

	expect(saved.custom_players).toEqual(customPlayers)
	expect(saved.custom_drawings).toEqual(customDrawings)
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/api/plays.test.ts`

Expected: Test fails because PUT doesn't accept custom_players/custom_drawings yet

**Step 3: Update PUT endpoint to accept custom data**

In `src/api/plays.ts`, modify the `update` function (around line 227-292):

```typescript
update: async (req: Request) => {
	const userId = await getSessionUser(req)
	if (!userId) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const playId = parseInt(req.params.playId)
	if (isNaN(playId)) {
		return Response.json({ error: 'Invalid play ID' }, { status: 400 })
	}

	// Get play and check it exists
	const [play] = await db`
		SELECT id, playbook_id
		FROM plays
		WHERE id = ${playId}
	`
	if (!play) {
		return Response.json({ error: 'Play not found' }, { status: 404 })
	}

	const { hasAccess } = await checkPlaybookAccess(play.playbook_id, userId)

	if (!hasAccess) {
		return Response.json({ error: 'Access denied' }, { status: 403 })
	}

	const body = await req.json()

	// Build dynamic UPDATE based on provided fields
	const updates: string[] = []
	const values: any[] = []

	if (body.name !== undefined) {
		updates.push('name')
		values.push(body.name)
	}
	if (body.section_id !== undefined) {
		updates.push('section_id')
		values.push(body.section_id)
	}
	if (body.play_type !== undefined) {
		updates.push('play_type')
		values.push(body.play_type)
	}
	// NEW: Add custom_players
	if (body.custom_players !== undefined) {
		updates.push('custom_players')
		values.push(JSON.stringify(body.custom_players))
	}
	// NEW: Add custom_drawings
	if (body.custom_drawings !== undefined) {
		updates.push('custom_drawings')
		values.push(JSON.stringify(body.custom_drawings))
	}
	// NEW: Add hash_position
	if (body.hash_position !== undefined) {
		updates.push('hash_position')
		values.push(body.hash_position)
	}

	if (updates.length === 0) {
		return Response.json({ error: 'No fields to update' }, { status: 400 })
	}

	// Build UPDATE query dynamically
	const setClause = updates.map((col, i) => `${col} = $${i + 1}`).join(', ')
	const query = `
		UPDATE plays
		SET ${setClause}
		WHERE id = $${updates.length + 1}
		RETURNING id, playbook_id, name, section_id, play_type,
				  formation_id, personnel_id, defensive_formation_id,
				  hash_position, notes, display_order, created_by,
				  created_at, updated_at, custom_players, custom_drawings
	`

	const [updated] = await db.unsafe(query, [...values, playId])

	return Response.json({ play: updated })
},
```

**Step 4: Run test to verify it passes**

Run: `bun test src/api/plays.test.ts`

Expected: Test passes

**Step 5: Commit**

```bash
git add src/api/plays.ts src/api/plays.test.ts
git commit -m "feat: PUT /api/plays/:playId saves custom players and drawings"
```

---

## Task 4: Frontend - Implement Save Handler

**Files:**
- Modify: `src/pages/PlayEditorPage.tsx:72-86`
- Test: Manual testing (integration test in Task 6)

**Step 1: Identify what needs to be saved**

The PlayContext state contains:
- `players: Player[]` - Custom player positions
- `drawings: Drawing[]` - Custom drawings/routes
- `formation: string` - Formation name (metadata)
- `play: string` - Play name (metadata)
- `defensiveFormation: string` - Defensive formation (metadata)
- `hashAlignment: HashAlignment` - Ball position

**Step 2: Add play ID tracking to PlayEditorPage**

First, we need to track which play we're editing. Modify `PlayEditorPage.tsx`:

```typescript
function PlayEditorContent() {
	const { theme } = useTheme()
	const { playbookId } = useParams<{ playbookId?: string }>()
	const { playId } = useParams<{ playId?: string }>() // NEW: Get playId from URL
	const [searchParams] = useSearchParams()
	const teamId = searchParams.get('teamId')
	const navigate = useNavigate()

	// ... rest of component
```

**Step 3: Replace the TODO save handler**

Replace the save handler (lines 72-86) with actual implementation:

```typescript
// Listen for save event from toolbar
useEffect(() => {
	async function handleSave() {
		if (!playId) {
			console.error('No play ID - cannot save')
			eventBus.emit('canvas:save-complete')
			return
		}

		try {
			// Prepare data to save
			const saveData = {
				name: playState.play || 'Untitled Play',
				custom_players: playState.players,
				custom_drawings: playState.drawings,
				hash_position: playState.hashAlignment,
			}

			// Call API to save
			const response = await fetch(`/api/plays/${playId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(saveData),
			})

			if (!response.ok) {
				const error = await response.json()
				console.error('Save failed:', error)
				// TODO: Show error to user
				eventBus.emit('canvas:save-complete') // Still emit to reset button state
				return
			}

			console.log('Play saved successfully')
			eventBus.emit('canvas:save-complete')
		} catch (error) {
			console.error('Save error:', error)
			eventBus.emit('canvas:save-complete')
		}
	}

	eventBus.on('canvas:save', handleSave)
	return () => eventBus.off('canvas:save', handleSave)
}, [playId, playState.players, playState.drawings, playState.play, playState.hashAlignment])
```

**Step 4: Update route to include playId**

We need to ensure the route includes the playId parameter. Check `src/index.ts` for routing:

If the route doesn't include `:playId`, we need to add it. Look for the PlayEditorPage route and update it to:

```typescript
'/playbooks/:playbookId/plays/:playId/edit': PlayEditorPage
```

Or similar pattern depending on your routing setup.

**Step 5: Commit**

```bash
git add src/pages/PlayEditorPage.tsx src/index.ts
git commit -m "feat: implement save handler to persist play state"
```

---

## Task 5: Frontend - Implement Load Handler

**Files:**
- Modify: `src/pages/PlayEditorPage.tsx`

**Step 1: Add load effect to fetch play data on mount**

Add this effect after the save handler in `PlayEditorPage.tsx`:

```typescript
// Load play data on mount
useEffect(() => {
	async function loadPlay() {
		if (!playId) {
			console.log('No playId - starting with empty play')
			return
		}

		try {
			const response = await fetch(`/api/plays/${playId}`)

			if (!response.ok) {
				console.error('Failed to load play')
				return
			}

			const data = await response.json()
			const play = data.play

			// Populate PlayContext with loaded data
			if (play.name) {
				dispatch({ type: 'SET_PLAY', play: play.name })
			}

			if (play.hashAlignment) {
				dispatch({ type: 'SET_HASH_ALIGNMENT', alignment: play.hashAlignment })
			}

			if (play.players && play.players.length > 0) {
				// Clear existing players first
				dispatch({ type: 'CLEAR_CANVAS' })

				// Add loaded players
				play.players.forEach((player: any) => {
					dispatch({ type: 'ADD_PLAYER', player })
				})
			}

			if (play.drawings && play.drawings.length > 0) {
				dispatch({ type: 'SET_DRAWINGS', drawings: play.drawings })
			}

			console.log('Play loaded successfully')
		} catch (error) {
			console.error('Load error:', error)
		}
	}

	loadPlay()
}, [playId, dispatch])
```

**Step 2: Handle the case where CLEAR_CANVAS clears drawings too**

Looking at `PlayContext.tsx:271-273`, `CLEAR_CANVAS` clears both players AND drawings. We need to be careful about the order of operations. Update the load handler:

```typescript
// Load play data on mount
useEffect(() => {
	async function loadPlay() {
		if (!playId) {
			console.log('No playId - starting with empty play')
			return
		}

		try {
			const response = await fetch(`/api/plays/${playId}`)

			if (!response.ok) {
				console.error('Failed to load play')
				return
			}

			const data = await response.json()
			const play = data.play

			console.log('Loaded play data:', play)

			// Populate PlayContext with loaded data
			if (play.name) {
				dispatch({ type: 'SET_PLAY', play: play.name })
			}

			if (play.hashAlignment) {
				dispatch({ type: 'SET_HASH_ALIGNMENT', alignment: play.hashAlignment })
			}

			// Load players and drawings together to avoid clearing one after loading the other
			if (play.players && play.players.length > 0) {
				play.players.forEach((player: any) => {
					dispatch({ type: 'ADD_PLAYER', player })
				})
			}

			if (play.drawings && play.drawings.length > 0) {
				dispatch({ type: 'SET_DRAWINGS', drawings: play.drawings })
			}

		} catch (error) {
			console.error('Load error:', error)
		}
	}

	loadPlay()
}, [playId, dispatch])
```

**Step 3: Commit**

```bash
git add src/pages/PlayEditorPage.tsx
git commit -m "feat: implement load handler to populate play state from API"
```

---

## Task 6: Integration Testing

**Files:**
- Manual testing in browser
- Optional: `tests/integration/play-persistence.test.ts`

**Step 1: Create a test play in the database**

Run the app and create a new play, or use an existing play ID.

**Step 2: Test save flow**

1. Open play editor: `/playbooks/{playbookId}/plays/{playId}/edit?teamId={teamId}`
2. Add some players using Add Player button
3. Draw some routes using Draw tool
4. Click Save button
5. Check browser console - should see "Play saved successfully"
6. Check network tab - should see PUT request to `/api/plays/{playId}` with 200 status

**Step 3: Test load flow**

1. Refresh the page
2. Check browser console - should see "Play loaded successfully" and "Loaded play data: {...}"
3. Verify players and drawings appear on canvas
4. Verify they match what you drew before

**Step 4: Test persistence across navigation**

1. Navigate away to playbook view
2. Navigate back to play editor
3. Verify everything is still there

**Step 5: Test hybrid plays (concepts + custom)**

1. Apply a concept using the Create Concept button
2. Add additional custom players/drawings
3. Save
4. Reload
5. Verify both concept-based and custom elements are present

**Step 6: Document any issues found**

If any issues are found during testing:
- Document the exact steps to reproduce
- Check browser console for errors
- Check network tab for failed requests
- Fix issues and re-test

**Step 7: Final commit**

```bash
git add -A
git commit -m "test: verify play persistence works end-to-end"
```

---

## Testing Strategy

**Unit Tests:**
- ✅ API GET endpoint returns custom data
- ✅ API PUT endpoint saves custom data

**Integration Tests:**
- Manual browser testing (documented in Task 6)
- Optional: Write automated integration test

**Test Data:**
- Use simple test cases: 1-2 players, 1-2 drawings
- Test empty plays (no custom data)
- Test hybrid plays (formations + custom data)

---

## Rollback Plan

If something breaks:

1. Revert migration: Drop columns `custom_players` and `custom_drawings`
2. Revert API changes: Git revert commits from Tasks 2-3
3. Revert frontend changes: Git revert commits from Tasks 4-5

---

## Future Enhancements

**Not in this plan (YAGNI):**
- ❌ Auto-save (add later if needed)
- ❌ Undo/redo across sessions (requires more complex state tracking)
- ❌ Play versioning (out of scope)
- ❌ Conflict resolution (single user editing for now)

**May add later:**
- Error toasts for save failures
- Loading states during save/load
- Optimistic updates
- Play thumbnails generation

---

## Definition of Done

- [x] Database migration applied
- [x] API GET returns custom players and drawings
- [x] API PUT saves custom players and drawings
- [x] Save button persists play state to database
- [x] Page load populates PlayContext from saved data
- [x] Manual testing confirms save/load works
- [x] Hybrid plays (concepts + custom) work correctly
- [x] All code committed with descriptive messages
