# Play Persistence Implementation Plan (Updated)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable saving and loading of custom plays with free-form player positions and drawings, while maintaining support for formation/concept-based plays.

**Architecture:** Add `custom_players` and `custom_drawings` JSONB columns to the plays table. Update API endpoints to save/load this data (including teamId via playbook join). Implement save/load handlers in the frontend. Support hybrid plays (both concepts AND custom data).

**Tech Stack:** PostgreSQL (JSONB), Bun, React Context, TypeScript

**Changes from original plan:**
- URL pattern: `/playbooks/:playbookId/plays/:playId` → `/playbooks/:playbookId/play/:playId`
- Removed `teamId` query parameter - GET /api/plays/:playId now returns teamId via playbook join
- PlayEditorPage loads teamId from play API response (single request)

---

## Task 0: URL Refactoring - Change Route Pattern and Remove teamId Query Param

**Files:**
- Modify: `src/router/routes.tsx:41-48`
- Modify: `src/pages/PlayEditorPage.tsx`
- Modify: `src/pages/PlaybookEditorPage.tsx:83-91`
- Modify: `src/components/PlayViewerModal.tsx:110`
- Modify: `tests/unit/pages/PlayEditorPage.test.tsx`

**Step 1: Update route definition**

In `src/router/routes.tsx`, change line 41 from:
```typescript
path: '/playbooks/:playbookId/plays/:playId',
```
to:
```typescript
path: '/playbooks/:playbookId/play/:playId',
```

**Step 2: Remove useSearchParams from PlayEditorPage**

In `src/pages/PlayEditorPage.tsx`:
- Remove `useSearchParams` from imports (line 2)
- Remove lines 29-30:
  ```typescript
  const [searchParams] = useSearchParams()
  const teamId = searchParams.get('teamId')
  ```
- Add state for teamId that will be populated from play API (Task 5):
  ```typescript
  const [teamId, setTeamId] = useState<string | null>(null)
  ```

**Step 3: Update navigation in PlaybookEditorPage**

In `src/pages/PlaybookEditorPage.tsx`, change `handleOpenPlay` function (lines 83-91):

```typescript
const handleOpenPlay = (playId: string) => {
    navigate(`/playbooks/${playbookId}/play/${playId}`)
}
```

**Step 4: Update navigation in PlayViewerModal**

In `src/components/PlayViewerModal.tsx`, change line 110:

```typescript
navigate(`/playbooks/${playbookId}/play/${currentMetadata.id}`)
```

**Step 5: Update tests**

In `tests/unit/pages/PlayEditorPage.test.tsx`, update route patterns from:
- `/playbooks/1/plays/42` → `/playbooks/1/play/42`
- `path='/playbooks/:playbookId/plays/:playId'` → `path='/playbooks/:playbookId/play/:playId'`

**Step 6: Commit**

```bash
git add src/router/routes.tsx src/pages/PlayEditorPage.tsx src/pages/PlaybookEditorPage.tsx src/components/PlayViewerModal.tsx tests/unit/pages/PlayEditorPage.test.tsx
git commit -m "refactor: change play editor URL to /playbooks/:playbookId/play/:playId and remove teamId query param"
```

---

## Task 1: Database Migration - Add Custom Data Columns

**Files:**
- Create: `src/db/migrations/011_add_custom_play_data.sql`

**Step 1: Write migration to add JSONB columns**

```sql
-- Add custom play data columns to support free-form editing

ALTER TABLE plays ADD COLUMN custom_players JSONB DEFAULT '[]'::jsonb;
ALTER TABLE plays ADD COLUMN custom_drawings JSONB DEFAULT '[]'::jsonb;

CREATE INDEX idx_plays_custom_players ON plays USING gin(custom_players);
CREATE INDEX idx_plays_custom_drawings ON plays USING gin(custom_drawings);

COMMENT ON COLUMN plays.custom_players IS 'Free-form player positions not derived from formations';
COMMENT ON COLUMN plays.custom_drawings IS 'Free-form drawings/routes not derived from concepts';
```

**Step 2: Run migration**

Run: `bun run migrate`

**Step 3: Verify migration**

Run: `psql $DATABASE_URL -c "\d plays"`

Expected: See `custom_players` and `custom_drawings` columns

**Step 4: Commit**

```bash
git add src/db/migrations/011_add_custom_play_data.sql
git commit -m "feat: add custom_players and custom_drawings columns to plays table"
```

---

## Task 2: Update API GET Endpoint - Load Custom Data + Return teamId

**Files:**
- Modify: `src/api/plays.ts` (the `get` function)
- Test: `src/api/plays.test.ts`

**Step 1: Write failing test**

Add to `src/api/plays.test.ts`:

```typescript
test('GET /api/plays/:playId returns custom players, drawings, and teamId', async () => {
    const [play] = await db`
        INSERT INTO plays (playbook_id, name, created_by, custom_players, custom_drawings)
        VALUES (
            ${testPlaybookId},
            'Custom Play',
            ${testUserId},
            ${JSON.stringify([{ id: 'p1', x: 100, y: 200, label: 'WR', color: '#ff0000' }])},
            ${JSON.stringify([{ id: 'd1', segments: [[{x: 100, y: 200}, {x: 150, y: 250}]], color: '#000000' }])}
        )
        RETURNING id
    `

    const response = await fetch(`http://localhost:${testPort}/api/plays/${play.id}`, {
        headers: { Cookie: sessionCookie }
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    // Verify teamId is returned (via playbook join)
    expect(data.play.teamId).toBeDefined()

    // Verify custom players
    expect(data.play.players).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: 'p1', x: 100, y: 200, label: 'WR' })
        ])
    )

    // Verify custom drawings
    expect(data.play.drawings).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: 'd1', color: '#000000' })
        ])
    )
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/api/plays.test.ts`

**Step 3: Update GET endpoint**

In `src/api/plays.ts`, modify the `get` function to:

1. Join with playbooks table to get team_id:
```typescript
const [play] = await db`
    SELECT p.*, pb.team_id
    FROM plays p
    JOIN playbooks pb ON p.playbook_id = pb.id
    WHERE p.id = ${playId}
`
```

2. Include teamId in response:
```typescript
return Response.json({
    play: {
        id: String(play.id),
        name: play.name || 'Untitled Play',
        teamId: play.team_id ? String(play.team_id) : null,  // NEW
        // ... rest of fields
        players,
        drawings,
    },
})
```

3. Merge custom players with formation-based players
4. Merge custom drawings with concept-based drawings

**Step 4: Run test to verify it passes**

Run: `bun test src/api/plays.test.ts`

**Step 5: Commit**

```bash
git add src/api/plays.ts src/api/plays.test.ts
git commit -m "feat: GET /api/plays/:playId returns teamId and custom data"
```

---

## Task 3: Update API PUT Endpoint - Save Custom Data

**Files:**
- Modify: `src/api/plays.ts` (the `update` function)
- Test: `src/api/plays.test.ts`

**Step 1: Write failing test**

Add to `src/api/plays.test.ts`:

```typescript
test('PUT /api/plays/:playId saves custom players and drawings', async () => {
    const [play] = await db`
        INSERT INTO plays (playbook_id, name, created_by)
        VALUES (${testPlaybookId}, 'Test Play', ${testUserId})
        RETURNING id
    `

    const customPlayers = [
        { id: 'p1', x: 100, y: 200, label: 'QB', color: '#0000ff' }
    ]
    const customDrawings = [
        { id: 'd1', segments: [[{x: 100, y: 200}, {x: 150, y: 250}]], color: '#000000' }
    ]

    const response = await fetch(`http://localhost:${testPort}/api/plays/${play.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({ custom_players: customPlayers, custom_drawings: customDrawings })
    })

    expect(response.status).toBe(200)

    const [saved] = await db`SELECT custom_players, custom_drawings FROM plays WHERE id = ${play.id}`
    expect(saved.custom_players).toEqual(customPlayers)
    expect(saved.custom_drawings).toEqual(customDrawings)
})
```

**Step 2: Run test to verify it fails**

**Step 3: Update PUT endpoint to handle custom_players and custom_drawings**

**Step 4: Run test to verify it passes**

**Step 5: Commit**

```bash
git add src/api/plays.ts src/api/plays.test.ts
git commit -m "feat: PUT /api/plays/:playId saves custom players and drawings"
```

---

## Task 4: Frontend - Implement Save Handler

**Files:**
- Modify: `src/pages/PlayEditorPage.tsx:75-89`

**Step 1: Replace TODO save handler**

Replace the fake save handler with:

```typescript
useEffect(() => {
    async function handleSave() {
        if (!playId) {
            console.error('No play ID - cannot save')
            eventBus.emit('canvas:save-complete')
            return
        }

        try {
            const response = await fetch(`/api/plays/${playId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: playState.play || 'Untitled Play',
                    custom_players: playState.players,
                    custom_drawings: playState.drawings,
                    hash_position: playState.hashAlignment,
                }),
            })

            if (!response.ok) {
                console.error('Save failed:', await response.json())
            } else {
                console.log('Play saved successfully')
            }
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

**Step 2: Commit**

```bash
git add src/pages/PlayEditorPage.tsx
git commit -m "feat: implement save handler to persist play state"
```

---

## Task 5: Frontend - Implement Load Handler (with teamId from API)

**Files:**
- Modify: `src/pages/PlayEditorPage.tsx`

**Step 1: Add load effect that sets teamId from API response**

```typescript
// Load play data on mount - also sets teamId for concept data
useEffect(() => {
    async function loadPlay() {
        if (!playId) return

        try {
            const response = await fetch(`/api/plays/${playId}`)
            if (!response.ok) {
                console.error('Failed to load play')
                return
            }

            const data = await response.json()
            const play = data.play

            // Set teamId from play response (via playbook join)
            if (play.teamId) {
                setTeamId(play.teamId)
            }

            if (play.name) {
                dispatch({ type: 'SET_PLAY', play: play.name })
            }
            if (play.hashAlignment) {
                dispatch({ type: 'SET_HASH_ALIGNMENT', alignment: play.hashAlignment })
            }
            if (play.players?.length > 0) {
                play.players.forEach((player: any) => {
                    dispatch({ type: 'ADD_PLAYER', player })
                })
            }
            if (play.drawings?.length > 0) {
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

**Step 2: Commit**

```bash
git add src/pages/PlayEditorPage.tsx
git commit -m "feat: load play data and teamId from API on mount"
```

---

## Task 6: Integration Testing

**Step 1: Test new URL pattern**
- Navigate to `/playbooks/{playbookId}/play/{playId}` (singular "play")
- Verify page loads without teamId query param
- Verify concept data loads correctly (teamId from API)

**Step 2: Test save flow**
- Add players and drawings
- Click Save
- Check console for "Play saved successfully"

**Step 3: Test load flow**
- Refresh page
- Verify players and drawings appear

**Step 4: Test navigation**
- From playbook page, click a play
- Verify URL is `/playbooks/{id}/play/{id}` (no teamId)

---

## Definition of Done

- [ ] URL pattern changed to `/playbooks/:playbookId/play/:playId`
- [ ] teamId query param removed from all navigation
- [ ] GET /api/plays/:playId returns teamId via playbook join
- [ ] Database migration applied
- [ ] API GET returns custom players and drawings
- [ ] API PUT saves custom players and drawings
- [ ] Save button persists play state
- [ ] Page load populates PlayContext from saved data
- [ ] Manual testing confirms save/load works
