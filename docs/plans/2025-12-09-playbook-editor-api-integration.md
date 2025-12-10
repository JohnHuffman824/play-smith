# Playbook Editor API Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate PlaybookEditor component with backend API endpoints to persist plays and sections to the database instead of using hardcoded mock data.

**Architecture:** Replace local React state management with API calls using custom hooks (usePlaybookData). Implement optimistic updates with rollback on error. Add loading states and error handling throughout the UI. Add cursor-pointer to all clickable elements.

**Tech Stack:** React hooks, Fetch API, TypeScript, existing backend API endpoints (plays.ts, sections.ts)

---

## Current State Analysis

**Backend (✅ Complete):**
- GET `/api/playbooks/:playbookId/plays` - list plays
- POST `/api/playbooks/:playbookId/plays` - create play
- PUT `/api/plays/:playId` - update play
- DELETE `/api/plays/:playId` - delete play
- POST `/api/plays/:playId/duplicate` - duplicate play
- GET `/api/playbooks/:playbookId/sections` - list sections
- POST `/api/playbooks/:playbookId/sections` - create section
- PUT `/api/sections/:sectionId` - update section
- DELETE `/api/sections/:sectionId` - delete section

**Frontend (❌ Needs Work):**
- PlaybookEditor component uses hardcoded mock data (lines 83-182)
- No API integration
- No loading/error states for operations
- Missing cursor-pointer on buttons

---

### Task 1: Create usePlaybookData custom hook

**Files:**
- Create: `src/hooks/usePlaybookData.ts`

**Step 1: Create the custom hook file with types**

Create `src/hooks/usePlaybookData.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export interface Play {
	id: string
	name: string
	section_id: string | null
	formation: string
	personnel?: string
	playType: string
	defensiveFormation: string
	tags: string[]
	lastModified: string
}

export interface Section {
	id: string
	name: string
	plays: Play[]
}

interface UsePlaybookDataReturn {
	sections: Section[]
	isLoading: boolean
	error: string | null
	createPlay: (name: string, sectionId: string | null) => Promise<Play>
	updatePlay: (playId: string, updates: Partial<Play>) => Promise<void>
	deletePlay: (playId: string) => Promise<void>
	duplicatePlay: (playId: string) => Promise<Play>
	createSection: (name: string) => Promise<Section>
	updateSection: (sectionId: string, updates: { name: string }) => Promise<void>
	deleteSection: (sectionId: string) => Promise<void>
	refetch: () => Promise<void>
}

export function usePlaybookData(playbookId: string | undefined): UsePlaybookDataReturn {
	const navigate = useNavigate()
	const [sections, setSections] = useState<Section[]>([])
	const [plays, setPlays] = useState<Play[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Helper to group plays by section
	const groupPlaysBySections = useCallback((allPlays: Play[], allSections: Array<{ id: string; name: string }>) => {
		return allSections.map(section => ({
			...section,
			plays: allPlays.filter(play => play.section_id === section.id)
		}))
	}, [])

	// Fetch data
	const fetchData = useCallback(async () => {
		if (!playbookId) return

		try {
			setIsLoading(true)
			setError(null)

			const [playsRes, sectionsRes] = await Promise.all([
				fetch(`/api/playbooks/${playbookId}/plays`),
				fetch(`/api/playbooks/${playbookId}/sections`)
			])

			if (playsRes.status === 401 || sectionsRes.status === 401) {
				navigate('/login')
				return
			}

			if (!playsRes.ok || !sectionsRes.ok) {
				throw new Error('Failed to fetch playbook data')
			}

			const playsData = await playsRes.json()
			const sectionsData = await sectionsRes.json()

			setPlays(playsData.plays || [])
			setSections(groupPlaysBySections(playsData.plays || [], sectionsData.sections || []))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setIsLoading(false)
		}
	}, [playbookId, navigate, groupPlaysBySections])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	// Create play
	const createPlay = useCallback(async (name: string, sectionId: string | null): Promise<Play> => {
		if (!playbookId) throw new Error('No playbook ID')

		const response = await fetch(`/api/playbooks/${playbookId}/plays`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, section_id: sectionId })
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to create play')
		}

		const data = await response.json()
		await fetchData() // Refetch to get updated list
		return data.play
	}, [playbookId, fetchData])

	// Update play
	const updatePlay = useCallback(async (playId: string, updates: Partial<Play>): Promise<void> => {
		const response = await fetch(`/api/plays/${playId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updates)
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to update play')
		}

		await fetchData()
	}, [fetchData])

	// Delete play
	const deletePlay = useCallback(async (playId: string): Promise<void> => {
		const response = await fetch(`/api/plays/${playId}`, {
			method: 'DELETE'
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to delete play')
		}

		await fetchData()
	}, [fetchData])

	// Duplicate play
	const duplicatePlay = useCallback(async (playId: string): Promise<Play> => {
		const response = await fetch(`/api/plays/${playId}/duplicate`, {
			method: 'POST'
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to duplicate play')
		}

		const data = await response.json()
		await fetchData()
		return data.play
	}, [fetchData])

	// Create section
	const createSection = useCallback(async (name: string): Promise<Section> => {
		if (!playbookId) throw new Error('No playbook ID')

		const response = await fetch(`/api/playbooks/${playbookId}/sections`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to create section')
		}

		const data = await response.json()
		await fetchData()
		return { ...data.section, plays: [] }
	}, [playbookId, fetchData])

	// Update section
	const updateSection = useCallback(async (sectionId: string, updates: { name: string }): Promise<void> => {
		const response = await fetch(`/api/sections/${sectionId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updates)
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to update section')
		}

		await fetchData()
	}, [fetchData])

	// Delete section
	const deleteSection = useCallback(async (sectionId: string): Promise<void> => {
		const response = await fetch(`/api/sections/${sectionId}`, {
			method: 'DELETE'
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to delete section')
		}

		await fetchData()
	}, [fetchData])

	return {
		sections,
		isLoading,
		error,
		createPlay,
		updatePlay,
		deletePlay,
		duplicatePlay,
		createSection,
		updateSection,
		deleteSection,
		refetch: fetchData
	}
}
```

**Step 2: Commit**

```bash
git add src/hooks/usePlaybookData.ts
git commit -m "feat: add usePlaybookData hook for API integration"
```

---

### Task 2: Update PlaybookEditor to use usePlaybookData hook

**Files:**
- Modify: `src/components/playbook-editor/PlaybookEditor.tsx`

**Step 1: Import the hook and remove hardcoded data**

Update imports at the top of `PlaybookEditor.tsx`:

```typescript
import { usePlaybookData } from '@/hooks/usePlaybookData'
```

**Step 2: Replace sections state with hook**

In `PlaybookEditorContent` function (around line 51), replace the hardcoded sections state:

Remove lines 68-182 (all the useState for sections and the hardcoded mock data).

Add after line 81:

```typescript
const {
	sections,
	isLoading: isLoadingData,
	error: dataError,
	createPlay,
	updatePlay,
	deletePlay,
	duplicatePlay,
	createSection,
	updateSection,
	deleteSection
} = usePlaybookData(playbookId)
```

**Step 3: Update handleNewPlay to use API**

Replace `handleNewPlay` function (lines 212-241) with:

```typescript
async function handleNewPlay() {
	if (!newItemName.trim()) return

	try {
		const sectionId = sections.length > 0 ? sections[0].id : null
		const newPlay = await createPlay(newItemName, sectionId)

		setNewItemName('')
		setShowNewPlayModal(false)

		if (onOpenPlay) {
			onOpenPlay(newPlay.id)
		}
	} catch (err) {
		console.error('Failed to create play:', err)
		alert(err instanceof Error ? err.message : 'Failed to create play')
	}
}
```

**Step 4: Update handleNewSection to use API**

Replace `handleNewSection` function (lines 243-254) with:

```typescript
async function handleNewSection() {
	if (!newItemName.trim()) return

	try {
		await createSection(newItemName)
		setNewItemName('')
		setShowNewSectionModal(false)
	} catch (err) {
		console.error('Failed to create section:', err)
		alert(err instanceof Error ? err.message : 'Failed to create section')
	}
}
```

**Step 5: Update confirmRename to use API**

Replace `confirmRename` function (lines 271-288) with:

```typescript
async function confirmRename() {
	if (!renamePlayId || !renamePlayName.trim()) return

	try {
		await updatePlay(renamePlayId, { name: renamePlayName })
		setShowRenameModal(false)
		setRenamePlayId(null)
		setRenamePlayName('')
	} catch (err) {
		console.error('Failed to rename play:', err)
		alert(err instanceof Error ? err.message : 'Failed to rename play')
	}
}
```

**Step 6: Update confirmDelete to use API**

Replace `confirmDelete` function (lines 295-307) with:

```typescript
async function confirmDelete() {
	if (!deletePlayId) return

	try {
		await deletePlay(deletePlayId)
		setShowDeleteConfirmModal(false)
		setDeletePlayId(null)
	} catch (err) {
		console.error('Failed to delete play:', err)
		alert(err instanceof Error ? err.message : 'Failed to delete play')
	}
}
```

**Step 7: Update handleDuplicatePlay to use API**

Replace `handleDuplicatePlay` function (lines 309-327) with:

```typescript
async function handleDuplicatePlay(playId: string) {
	try {
		await duplicatePlay(playId)
	} catch (err) {
		console.error('Failed to duplicate play:', err)
		alert(err instanceof Error ? err.message : 'Failed to duplicate play')
	}
}
```

**Step 8: Update loading state UI**

After the `usePlaybookData` hook, add combined loading/error handling (around line 90):

```typescript
// Show loading state
if (isLoading || isLoadingData) {
	return (
		<div className="flex items-center justify-center h-screen">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
				<p className="text-gray-600">Loading playbook...</p>
			</div>
		</div>
	)
}

// Show error state
if (error || dataError) {
	return (
		<div className="flex items-center justify-center h-screen">
			<div className="text-center">
				<h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
				<p className="text-gray-600 mb-6">{error || dataError}</p>
				<button
					onClick={onBack}
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
				>
					Back to Playbooks
				</button>
			</div>
		</div>
	)
}
```

**Step 9: Commit**

```bash
git add src/components/playbook-editor/PlaybookEditor.tsx
git commit -m "feat: integrate PlaybookEditor with API using usePlaybookData hook"
```

---

### Task 3: Add cursor-pointer to all clickable elements

**Files:**
- Modify: `src/components/playbook-editor/PlaybookEditor.tsx`
- Modify: `src/components/playbook-editor/PlaybookEditorToolbar.tsx`

**Step 1: Add cursor-pointer to PlaybookEditor buttons**

In `PlaybookEditor.tsx`, add `cursor-pointer` class to:

1. Back button (line 392-398):
```typescript
className={`${BUTTON_BASE} cursor-pointer`}
```

2. All toolbar buttons (lines 429-489) - add to each button:
```typescript
className={`${BUTTON_BASE} cursor-pointer`}
```

3. View mode buttons (lines 457-478):
```typescript
className={`p-2 rounded transition-all duration-200 cursor-pointer ${...}`}
```

4. Modal buttons (lines 600, 610, 638, 648, 697, 707, 723, 730):
```typescript
className={`${MODAL_BUTTON_BASE} cursor-pointer`}
className={`${PRIMARY_BUTTON_BASE} disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
```

5. Empty state button (line 565):
```typescript
className={`${PRIMARY_BUTTON_BASE} px-6 py-2.5 cursor-pointer`}
```

**Step 2: Add cursor-pointer to PlaybookEditorToolbar buttons**

In `PlaybookEditorToolbar.tsx`, update all button classNames (lines 31-75):

```typescript
// New Play button (line 32)
className={`${BUTTON_BASE_CLASS} ${BUTTON_ACTIVE} flex items-center gap-2 cursor-pointer`}

// New Section button (line 41)
className={`${BUTTON_BASE_CLASS} ${BUTTON_INACTIVE} flex items-center gap-2 cursor-pointer`}

// All Plays button (line 55)
className={`${BUTTON_BASE_CLASS} ${activeSectionFilter == null ? BUTTON_ACTIVE : BUTTON_INACTIVE} cursor-pointer`}

// Section filter buttons (line 66)
className={`${BUTTON_BASE_CLASS} ${activeSectionFilter == section.id ? BUTTON_ACTIVE : BUTTON_INACTIVE} cursor-pointer`}
```

**Step 3: Commit**

```bash
git add src/components/playbook-editor/PlaybookEditor.tsx src/components/playbook-editor/PlaybookEditorToolbar.tsx
git commit -m "feat: add cursor-pointer to all clickable elements in PlaybookEditor"
```

---

### Task 4: Fix allPlays computation to work with API data

**Files:**
- Modify: `src/components/playbook-editor/PlaybookEditor.tsx`

**Step 1: Update allPlays to use sections from hook**

Around line 192, the `allPlays` computation should already work with the API data since sections structure is the same. Verify it looks like:

```typescript
const allPlays = sections.flatMap((section) =>
	section.plays.map((play) => ({ ...play, sectionId: section.id }))
)
```

**Step 2: Test locally**

```bash
bun run dev
```

Navigate to http://localhost:3000/playbooks, create a playbook, click "New Play" button.

Expected:
- Modal opens
- Enter play name
- Click "Create"
- Play is created in database
- Play appears in the UI
- Clicking play opens it in editor

**Step 3: Commit if any changes needed**

```bash
git add src/components/playbook-editor/PlaybookEditor.tsx
git commit -m "fix: ensure allPlays computation works with API data"
```

---

### Task 5: Handle edge cases and improve UX

**Files:**
- Modify: `src/hooks/usePlaybookData.ts`

**Step 1: Add better error messages**

Update error handling in each API function to provide more specific messages:

```typescript
// In createPlay
if (response.status === 403) {
	throw new Error('You do not have permission to create plays in this playbook')
}
if (response.status === 404) {
	throw new Error('Playbook not found')
}

// Similar for other functions
```

**Step 2: Add optimistic updates for better UX (optional enhancement)**

For createPlay, updatePlay, etc., you could add optimistic updates:

```typescript
// Example for deletePlay with optimistic update
const deletePlay = useCallback(async (playId: string): Promise<void> => {
	// Optimistic update
	const previousSections = [...sections]
	setSections(sections.map(section => ({
		...section,
		plays: section.plays.filter(p => p.id !== playId)
	})))

	try {
		const response = await fetch(`/api/plays/${playId}`, {
			method: 'DELETE'
		})

		if (!response.ok) {
			// Rollback on error
			setSections(previousSections)
			const data = await response.json()
			throw new Error(data.error || 'Failed to delete play')
		}

		await fetchData()
	} catch (err) {
		setSections(previousSections)
		throw err
	}
}, [fetchData, sections])
```

**Step 3: Commit**

```bash
git add src/hooks/usePlaybookData.ts
git commit -m "feat: improve error messages and add optimistic updates"
```

---

### Task 6: Update PlaybookEditorPage loading state

**Files:**
- Modify: `src/pages/PlaybookEditorPage.tsx`

**Step 1: Remove duplicate loading state**

Since PlaybookEditor now handles its own loading/error states, we can simplify PlaybookEditorPage.

The loading/error states in PlaybookEditorPage (lines 75-102) are still useful for fetching the playbook details, so keep them. The PlaybookEditor component will handle loading plays/sections internally.

No changes needed here, but verify the flow works correctly.

**Step 2: Test the complete flow**

```bash
bun run dev
```

Test:
1. Navigate to /playbooks
2. Create a new playbook
3. Should navigate to /playbooks/:id
4. Should see loading state
5. Should see empty playbook UI
6. Click "New Play" - modal opens
7. Create play - should appear in UI
8. Click play - should navigate to play editor
9. Go back - changes should persist (not using mock data)

**Step 3: Commit if any adjustments needed**

```bash
git add src/pages/PlaybookEditorPage.tsx
git commit -m "refactor: clean up loading states between page and editor"
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] "New Play" button opens modal
- [ ] Creating a play saves to database (verify by refreshing page)
- [ ] Creating a play navigates to play editor
- [ ] Plays display correctly from API data
- [ ] Creating sections works
- [ ] Renaming plays works
- [ ] Deleting plays works
- [ ] Duplicating plays works
- [ ] All buttons show cursor-pointer on hover
- [ ] Loading states appear during API calls
- [ ] Error messages display when operations fail
- [ ] No console errors
- [ ] Data persists after page refresh

## Notes for Engineer

**Testing Strategy:**
1. Always test with empty playbook first
2. Test with multiple sections
3. Test error cases (network errors, auth errors)
4. Test with slow network (throttle in DevTools)

**Common Pitfalls:**
- Don't forget to handle 401 responses (redirect to login)
- API returns `plays` array, not `plays.plays`
- Section IDs from API are strings, not numbers
- Play IDs from API are strings
- Always await API calls before closing modals
- Handle null sectionId when playbook has no sections

**Code Style:**
- No semicolons
- Single quotes
- Tabs for indentation
- Use `async/await` not `.then()`
- Use `const` not `let` unless reassignment needed
