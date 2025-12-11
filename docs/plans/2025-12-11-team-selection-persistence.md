# Team Selection Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist the selected team across navigation so users don't lose their team selection when viewing playbooks and returning.

**Architecture:** Create a `TeamContext` (following the existing `ThemeContext` pattern) that stores `currentTeamId` in both React Context and localStorage. The existing `useTeamsData` hook will consume this context instead of managing local state.

**Tech Stack:** React Context, localStorage, TypeScript

---

## Task 1: Create TeamContext

**Files:**
- Create: `src/contexts/TeamContext.tsx`

**Step 1: Create the TeamContext file**

```tsx
import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface TeamContextType {
	currentTeamId: number | null
	setCurrentTeamId: (teamId: number | null) => void
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

const STORAGE_KEY = 'currentTeamId'

function getStoredTeamId(): number | null {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		return stored ? parseInt(stored, 10) : null
	} catch {
		return null
	}
}

function storeTeamId(teamId: number | null): void {
	if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
		try {
			if (teamId === null) {
				localStorage.removeItem(STORAGE_KEY)
			} else {
				localStorage.setItem(STORAGE_KEY, String(teamId))
			}
		} catch {
			// Silently fail if localStorage is not available
		}
	}
}

export function TeamProvider({ children }: { children: ReactNode }) {
	const [currentTeamId, setCurrentTeamIdState] = useState<number | null>(() =>
		getStoredTeamId()
	)

	const setCurrentTeamId = useCallback((teamId: number | null) => {
		setCurrentTeamIdState(teamId)
		storeTeamId(teamId)
	}, [])

	return (
		<TeamContext.Provider value={{ currentTeamId, setCurrentTeamId }}>
			{children}
		</TeamContext.Provider>
	)
}

export function useTeamContext() {
	const context = useContext(TeamContext)
	if (context === undefined) {
		throw new Error('useTeamContext must be used within a TeamProvider')
	}
	return context
}
```

**Step 2: Verify file created correctly**

Run: `bun run tsc --noEmit`
Expected: No errors related to TeamContext

**Step 3: Commit**

```bash
git add src/contexts/TeamContext.tsx
git commit -m "feat: add TeamContext for persisting team selection"
```

---

## Task 2: Add TeamProvider to App

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update App.tsx to include TeamProvider**

Add import at top:
```tsx
import { TeamProvider } from './contexts/TeamContext'
```

Wrap RouterProvider with TeamProvider (inside AuthProvider):
```tsx
export default function App() {
	return (
		<QueryProvider>
			<ThemeProvider>
				<AuthProvider>
					<TeamProvider>
						<RouterProvider router={router} />
					</TeamProvider>
				</AuthProvider>
			</ThemeProvider>
		</QueryProvider>
	)
}
```

**Step 2: Verify app still runs**

Run: `bun run dev`
Expected: App loads without errors

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add TeamProvider to app providers"
```

---

## Task 3: Update useTeamsData to use TeamContext

**Files:**
- Modify: `src/hooks/useTeamsData.ts`

**Step 1: Update useTeamsData to consume TeamContext**

Replace the local state with context:

```ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect } from 'react'
import { teamKeys, fetchTeams, type TeamWithRole } from '../api/queries/teamQueries'
import { useTeamContext } from '../contexts/TeamContext'

interface UseTeamsDataReturn {
	teams: TeamWithRole[]
	currentTeamId: number | null
	currentTeamRole: 'owner' | 'editor' | 'viewer' | null
	isLoading: boolean
	error: string | null
	switchTeam: (teamId: number) => void
	refetch: () => Promise<void>
}

export function useTeamsData(): UseTeamsDataReturn {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { currentTeamId, setCurrentTeamId } = useTeamContext()

	const handleUnauthorized = useCallback((error: Error) => {
		if (error.message === 'UNAUTHORIZED') {
			navigate('/login')
		}
	}, [navigate])

	const {
		data: teams = [],
		isLoading,
		error: queryError
	} = useQuery({
		queryKey: teamKeys.list(),
		queryFn: fetchTeams
	})

	// Handle unauthorized errors
	useEffect(() => {
		if (queryError) {
			handleUnauthorized(queryError as Error)
		}
	}, [queryError, handleUnauthorized])

	// Auto-select first team if none selected or if stored team doesn't exist
	useEffect(() => {
		if (teams.length > 0) {
			const storedTeamExists = teams.some(t => t.id === currentTeamId)
			if (currentTeamId === null || !storedTeamExists) {
				setCurrentTeamId(teams[0].id)
			}
		}
	}, [teams, currentTeamId, setCurrentTeamId])

	const switchTeam = useCallback((teamId: number) => {
		setCurrentTeamId(teamId)
	}, [setCurrentTeamId])

	const refetch = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: teamKeys.list() })
	}, [queryClient])

	const currentTeamRole = teams.find(t => t.id === currentTeamId)?.role || null

	return {
		teams,
		currentTeamId,
		currentTeamRole,
		isLoading,
		error: queryError?.message || null,
		switchTeam,
		refetch
	}
}
```

**Step 2: Verify types are correct**

Run: `bun run tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/hooks/useTeamsData.ts
git commit -m "refactor: use TeamContext in useTeamsData for persistence"
```

---

## Task 4: Manual Testing

**Step 1: Test the fix**

1. Run: `bun run dev`
2. Navigate to `/playbooks`
3. Switch from Team 2 to Team 1
4. Click on a playbook to enter it
5. Click "Back to Playbooks"
6. Verify Team 1 is still selected

**Step 2: Test localStorage persistence**

1. Switch to Team 1
2. Refresh the browser (F5)
3. Verify Team 1 is still selected

**Step 3: Test edge case - deleted team**

1. Select a team
2. (If possible) Delete that team via another means
3. Refresh page
4. Verify app doesn't crash and falls back to first available team

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/TeamContext.tsx` | Create | New context with localStorage persistence |
| `src/App.tsx` | Modify | Add TeamProvider wrapper |
| `src/hooks/useTeamsData.ts` | Modify | Use context instead of local state |
