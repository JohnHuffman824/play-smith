# Playbook Manager Integration Design

**Date:** 2025-12-09
**Status:** Approved
**Author:** AI Assistant with Jack Huffman

## Overview

This document describes the integration of the playbook manager UI components
(copied from Figma) into the Play Smith application. The integration connects
the frontend components to the existing backend infrastructure, implements real
data flows, and ensures code quality per mako-review.md standards.

## Architecture

### Overall Structure

The playbook manager follows a three-layer architecture:

```
Backend Layer:
- /api/playbooks/* endpoints (new)
- /api/teams/* endpoints (new)
- PlaybookRepository (exists)
- TeamRepository (exists)

State Management:
- ThemeContext (extended with positionNaming, fieldLevel)
- AuthContext (exists, provides current user)
- TeamContext (new, manages team data & operations)
- PlaybookContext (new, manages playbook data & operations)

UI Layer:
- src/components/playbook-manager/* (Figma components, migrated)
- src/pages/PlaybookManagerPage.tsx (updated)
- src/components/ui/* (existing shadcn/ui, no duplicates)
```

### Component Organization

```
src/
├── api/
│   ├── playbooks.ts (new - playbook API client)
│   └── teams.ts (new - team API client)
├── components/
│   ├── playbook-manager/
│   │   ├── Toolbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── PlaybookCard.tsx
│   │   ├── ListView.tsx
│   │   ├── TeamSelector.tsx
│   │   ├── TeamManagement.tsx
│   │   ├── ShareDialog.tsx
│   │   ├── SettingsDialog.tsx
│   │   ├── Modal.tsx
│   │   └── CustomSelect.tsx
│   └── ui/ (existing - no changes)
├── contexts/
│   ├── ThemeContext.tsx (extend with new settings)
│   ├── TeamContext.tsx (new)
│   └── PlaybookContext.tsx (new)
└── pages/
    └── PlaybookManagerPage.tsx (replace placeholder)
```

### Key Architectural Decisions

1. **Single source of truth**: All data comes from backend API, no client-side
   mock data
2. **Separation of concerns**: API layer handles requests, contexts manage
   state, components handle UI
3. **Reusability**: Components designed to work with real data
4. **Consistency**: Follow existing patterns from auth system
5. **Maximize reuse**: Use existing infrastructure (Navigation, ProtectedRoute,
   routing patterns)

## Backend API Design

### New API Routes

```typescript
// Playbook endpoints
GET    /api/playbooks              // List user's playbooks across all teams
POST   /api/playbooks              // Create new playbook
GET    /api/playbooks/:id          // Get single playbook
PUT    /api/playbooks/:id          // Update playbook (name, description)
DELETE /api/playbooks/:id          // Delete playbook
POST   /api/playbooks/:id/share    // Share playbook with team
POST   /api/playbooks/:id/duplicate // Duplicate a playbook

// Team endpoints
GET    /api/teams                  // List user's teams
POST   /api/teams                  // Create new team
GET    /api/teams/:id/playbooks    // List team's playbooks
```

### API Client Structure

Following the pattern from `auth.ts`:

**src/api/playbooks.ts**
```typescript
export const playbooksAPI = {
	list: async (req) => {
		// Returns: Playbook[] with team info, play counts
	},

	get: async (req) => {
		// Returns: Playbook with full details
	},

	create: async (req) => {
		// Body: { team_id, name, description? }
		// Returns: Created playbook
	},

	update: async (req) => {
		// Body: { name?, description? }
		// Returns: Updated playbook
	},

	delete: async (req) => {
		// Returns: 204 No Content
	},

	duplicate: async (req) => {
		// Returns: New playbook (copy)
	},

	share: async (req) => {
		// Body: { team_id, permission: 'view' | 'edit' }
		// Returns: PlaybookShare record
	}
}
```

### Authentication & Authorization

- All endpoints require authentication (check session)
- Users can only access playbooks from teams they belong to
- Only team owners/editors can create/update/delete playbooks
- Viewers can only read playbooks

### Data Enrichment

API enriches playbook data beyond database fields:
- Play count (count from plays table)
- Team name/info
- Shared status (if playbook is shared with user's team)
- Formatted dates for display

## Context Management

### Extended ThemeContext

Add playbook-specific settings to existing ThemeContext:

```typescript
type Theme = 'light' | 'dark'
type PositionNaming = 'traditional' | 'modern' | 'numeric'
type FieldLevel = 'high-school' | 'college' | 'pro'

interface ThemeContextType {
	// Existing
	theme: Theme
	setTheme: (theme: Theme) => void

	// New settings
	positionNaming: PositionNaming
	setPositionNaming: (naming: PositionNaming) => void
	fieldLevel: FieldLevel
	setFieldLevel: (level: FieldLevel) => void
}
```

Settings persist in localStorage and apply globally across the app.

### New TeamContext

Manages team data and operations:

```typescript
interface TeamContextType {
	teams: Team[]
	currentTeamId: number | null
	isLoading: boolean
	error: string | null

	fetchTeams: () => Promise<void>
	createTeam: (name: string) => Promise<Team>
	switchTeam: (teamId: number) => void
	leaveTeam: (teamId: number) => Promise<void>
}
```

### New PlaybookContext

Manages playbook data and operations:

```typescript
interface PlaybookContextType {
	playbooks: Playbook[]
	currentTeamId: number | null
	isLoading: boolean
	error: string | null

	fetchPlaybooks: (teamId?: number) => Promise<void>
	createPlaybook: (name: string, teamId: number) => Promise<Playbook>
	updatePlaybook: (id: number, updates: {name?: string, description?: string}) => Promise<void>
	deletePlaybook: (id: number) => Promise<void>
	duplicatePlaybook: (id: number) => Promise<Playbook>
	sharePlaybook: (id: number, teamId: number, permission: 'view' | 'edit') => Promise<void>
	switchTeam: (teamId: number) => void
}
```

### Context Usage Pattern

```typescript
function PlaybookManagerPage() {
	const { user } = useAuth()
	const { theme, positionNaming, fieldLevel } = useTheme()
	const { teams, currentTeamId, switchTeam } = useTeam()
	const { playbooks, createPlaybook, deletePlaybook } = usePlaybook()

	// Component logic...
}
```

### Data Flow

1. User logs in → AuthContext provides user
2. PlaybookManagerPage mounts → TeamContext fetches user's teams
3. TeamContext sets default currentTeamId → PlaybookContext fetches playbooks
4. User switches teams → TeamContext updates, PlaybookContext refetches
5. User creates/updates/deletes → PlaybookContext calls API, updates state
6. User changes settings → ThemeContext updates, components reflect changes

### Error Handling

Contexts handle:
- Network errors (API unreachable)
- Auth errors (session expired → redirect to login)
- Validation errors (show error message to user)
- Not found errors (playbook doesn't exist)

## Component Migration & Cleanup

### Migration Steps

Move components from `playbookManagerFigma/` to `src/components/playbook-manager/`:

- Toolbar.tsx
- Sidebar.tsx
- PlaybookCard.tsx
- ListView.tsx
- TeamSelector.tsx
- TeamManagement.tsx
- ShareDialog.tsx
- SettingsDialog.tsx
- Modal.tsx
- CustomSelect.tsx

### Components to Delete

- `playbookManagerFigma/ui/*` (all shadcn/ui duplicates)
- `playbookManagerFigma/App.tsx` (logic goes into PlaybookManagerPage)
- `playbookManagerFigma/ConfigContext.tsx` (empty, using ThemeContext)
- `playbookManagerFigma/figma/*` (if not needed)

### Required Code Changes

Each migrated component needs:

1. **Import paths** - Update UI component imports:
   ```typescript
   // Before: import { Button } from './ui/button'
   // After:  import { Button } from '../ui/button'
   ```

2. **Remove ConfigContext** - Replace with ThemeContext:
   ```typescript
   // Before: const { theme } = useConfig()
   // After:  const { theme } = useTheme()
   ```

3. **Remove mock data** - Components receive data via props
4. **Navigation integration** - Use React Router's `useNavigate()`
5. **Replace alerts/prompts** - Use proper modal dialogs

### Code Quality Fixes (per mako-review.md)

During migration, fix:
- Remove semicolons (TypeScript/React rule)
- Use single quotes instead of double quotes
- Use `function` keyword for named functions (not arrow functions)
- Remove any commented code
- Ensure consistent naming (no `$` prefix)
- Fix any double negatives in conditionals
- Ensure lines ≤80 chars
- Use tabs not spaces

## PlaybookManagerPage Integration

### Page Structure

```typescript
export function PlaybookManagerPage() {
	const { user } = useAuth()
	const { theme, positionNaming, fieldLevel } = useTheme()
	const { teams, currentTeamId, switchTeam } = useTeam()
	const {
		playbooks,
		isLoading,
		error,
		createPlaybook,
		updatePlaybook,
		deletePlaybook,
		duplicatePlaybook,
		sharePlaybook
	} = usePlaybook()

	// UI state
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
	const [searchQuery, setSearchQuery] = useState('')
	const [activeSection, setActiveSection] = useState('all')

	// Filtering logic
	const filteredPlaybooks = useMemo(() => {
		return playbooks
			.filter(pb => pb.name.toLowerCase().includes(searchQuery.toLowerCase()))
			.filter(pb => {
				if (activeSection === 'shared') return pb.is_shared
				if (activeSection === 'all') return !pb.is_shared
				return true
			})
	}, [playbooks, searchQuery, activeSection])

	// Event handlers
	const handleOpen = (id: number) => {
		navigate(`/playbooks/${id}`)
	}

	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

			<div className="flex-1 flex flex-col overflow-hidden">
				<Toolbar
					viewMode={viewMode}
					searchQuery={searchQuery}
					currentTeamId={currentTeamId}
					onSwitchTeam={switchTeam}
					// ... other props
				/>

				<div className="flex-1 overflow-auto bg-background">
					{isLoading ? <LoadingState /> :
					 error ? <ErrorState message={error} /> :
					 viewMode === 'grid' ? <PlaybookGrid playbooks={filteredPlaybooks} /> :
					 <ListView playbooks={filteredPlaybooks} />}
				</div>
			</div>
		</div>
	)
}
```

### Data Flow Example: Creating a Playbook

1. User clicks "New Playbook" → `setShowNewPlaybookModal(true)`
2. User enters name, clicks "Create" → `handleCreatePlaybook(name)`
3. Handler calls → `createPlaybook(name, currentTeamId)` (context)
4. Context calls → `POST /api/playbooks`
5. API validates auth → `playbookRepository.create(...)`
6. Database returns new playbook
7. Context updates → `setPlaybooks([newPlaybook, ...playbooks])`
8. UI re-renders → New playbook appears in grid

## Team Management & Sharing

### Team Selector Component

Allows users to:
- View current team
- Switch between teams
- Create new teams
- Access team management

When user switches team:
```
onSwitchTeam(newTeamId) → TeamContext.switchTeam() → PlaybookContext refetches
```

### Team Management Dialog

Features:
- List all teams user belongs to
- Show role (owner/editor/viewer) for each team
- Create new team (user becomes owner)
- View team members (if owner/editor)
- Leave team (if not owner)

### Share Dialog

Allows sharing playbooks with other teams:
- Search/select team to share with
- Choose permission level (view/edit)
- View existing shares
- Revoke shares

### Sharing Rules

- Only team owners/editors can share playbooks
- Can share with any team
- Shared playbooks appear in "Shared with me" section
- View permission: can see plays, cannot edit
- Edit permission: can modify plays, cannot delete playbook
- Original team retains full ownership

### Database Integration

Uses existing `playbook_shares` table:

```typescript
// When sharing:
POST /api/playbooks/:id/share
Body: { team_id: number, permission: 'view' | 'edit' }

// Creates record in playbook_shares table
```

When listing playbooks, API returns:
- User's team playbooks
- Playbooks shared with user's teams (marked `is_shared: true`)

## Navigation & Routing

### Route Structure

```
/                                          → LandingPage
/login                                     → LoginPage
/playbooks                                 → PlaybookManagerPage ⭐ (implementing)
/playbooks/:playbookId                     → PlaybookEditorPage
/playbooks/:playbookId/plays/:playId       → PlayEditorPage
```

### Navigation Flow

```
PlaybookManagerPage
  ↓ (click playbook)
/playbooks/:playbookId (PlaybookEditorPage)
  ↓ (click play)
/playbooks/:playbookId/plays/:playId (PlayEditorPage)
  ↓ (breadcrumb back)
/playbooks/:playbookId
  ↓ (breadcrumb back)
/playbooks
```

### Opening Playbooks

```typescript
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
const handleOpenPlaybook = (playbookId: number) => {
	navigate(`/playbooks/${playbookId}`)
}
```

### Return Navigation

After login, ProtectedRoute already handles return URLs:
```typescript
const returnUrl = encodeURIComponent(location.pathname + location.search)
return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />
```

### Deep Linking

Users can bookmark or share:
- `/playbooks` - All playbooks
- `/playbooks/123` - Specific playbook
- `/playbooks/123/plays/456` - Specific play

### Error Handling

```typescript
// API returns 404/403
if (!playbook) {
	return Response.json({ error: 'Playbook not found' }, { status: 404 })
}

if (!userHasAccess(user, playbook)) {
	return Response.json({ error: 'Access denied' }, { status: 403 })
}

// Page handles errors
if (error === 'Playbook not found') {
	return <NotFoundPage />
}
```

## Testing Strategy

### Backend Tests

1. **Repository Tests** - Already exist, no changes needed
   - `PlaybookRepository.test.ts`
   - `TeamRepository.test.ts`

2. **API Endpoint Tests** - New, following `auth.test.ts` pattern
   - `src/api/playbooks.test.ts`
   - `src/api/teams.test.ts`
   - Use actual database (not mocks, per mako-review.md)

Example:
```typescript
import { describe, test, expect, beforeEach } from 'bun:test'

describe('Playbooks API', () => {
	beforeEach(async () => {
		// Setup test database
	})

	test('GET /api/playbooks returns user playbooks', async () => {
		// Test implementation
	})

	test('POST /api/playbooks creates playbook', async () => {
		// Test implementation
	})

	test('DELETE requires ownership', async () => {
		// Test authorization
	})
})
```

### Frontend Tests

1. **Context Tests** - New
   - `ThemeContext.test.tsx` - Test extended settings
   - `TeamContext.test.tsx` - Test team operations
   - `PlaybookContext.test.tsx` - Test playbook operations

2. **Component Unit Tests** - New, focus on logic-heavy components
   - `PlaybookCard.test.tsx` - Context menu actions
   - `Toolbar.test.tsx` - Search, filters, view switching
   - `TeamSelector.test.tsx` - Team switching
   - Skip trivial rendering tests (per mako-review.md)

3. **Integration Tests** - New
   - `tests/integration/playbook-manager.test.tsx`
   - Test full user flows with in-process server
   - Example: User creates playbook → appears in list → deletes → removed

### TDD Workflow

Per mako-review.md and superpowers:test-driven-development skill:

1. **Red**: Write failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up, apply mako-review.md standards
4. **Verify**: Run all tests

For bug fixes:
1. Write failing test that reproduces bug
2. Fix the bug
3. Verify test passes
4. Commit both test and fix together

### Coverage Priorities

**High priority (must test):**
- API authentication/authorization
- Playbook CRUD operations
- Team switching functionality
- Sharing permissions

**Low priority (can skip):**
- UI styling/layout
- Simple getters/setters
- Framework features

## Implementation Phases

### Phase 1: Backend Foundation

- Create playbook API endpoints (`src/api/playbooks.ts`)
- Create team API endpoints (`src/api/teams.ts`)
- Add routes to `src/index.ts`
- **Use TDD**: Write failing tests first, then implement

### Phase 2: Context Layer

- Extend ThemeContext with new settings
- Create TeamContext for team management
- Create PlaybookContext for playbook operations
- **Use TDD**: Test contexts with mock API responses

### Phase 3: Component Migration

- Move components from `playbookManagerFigma/` to `src/components/playbook-manager/`
- Fix import paths, remove ConfigContext references
- Update to use ThemeContext, TeamContext, PlaybookContext
- Remove mock data, use real props
- Apply mako-review.md code quality fixes
- Delete `playbookManagerFigma/ui/` and unused files

### Phase 4: Page Integration

- Replace PlaybookManagerPage placeholder with full implementation
- Wire up all components with contexts
- Implement navigation with React Router
- Add loading/error states
- **Use TDD**: Integration tests for user flows

### Phase 5: Polish & Testing

- Add comprehensive error handling
- Test all user workflows end-to-end
- Fix bugs using TDD (failing test first)
- Performance optimization if needed
- Code review against mako-review.md checklist

### Development Workflow

For each feature:
1. **Red**: Write failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up, apply standards
4. **Verify**: Run all tests, ensure nothing broke

### Skill Usage During Implementation

- `superpowers:test-driven-development` - For all implementation work
- `superpowers:systematic-debugging` - If bugs encountered
- `superpowers:verification-before-completion` - Before marking tasks complete
- `superpowers:requesting-code-review` - Before final integration

### Implementation Order Rationale

1. Backend first ensures UI has real data from start
2. Contexts next provide state management layer
3. Components can then be migrated with proper data flow
4. Page integration ties everything together
5. Polish ensures quality and user experience

## Success Criteria

The integration is complete when:

1. ✅ All playbook API endpoints functional and tested
2. ✅ Team API endpoints functional and tested
3. ✅ ThemeContext extended with new settings
4. ✅ TeamContext and PlaybookContext implemented and tested
5. ✅ All Figma components migrated to proper locations
6. ✅ PlaybookManagerPage fully functional with real data
7. ✅ Navigation works seamlessly with React Router
8. ✅ Team switching updates playbook list correctly
9. ✅ Sharing functionality works as designed
10. ✅ All code passes mako-review.md quality checks
11. ✅ Comprehensive test coverage for critical paths
12. ✅ No console errors or warnings
13. ✅ Loading and error states handle edge cases gracefully
14. ✅ `playbookManagerFigma/` folder can be deleted

## Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Context management | Extend ThemeContext, create TeamContext & PlaybookContext | Separation of concerns, clearer responsibilities |
| UI components | Use existing src/components/ui | Avoid duplication, maintain consistency |
| API approach | Build endpoints first | Ensures clean integration with real data from start |
| File structure | src/components/playbook-manager/ | Organized, separate from play editor components |
| Navigation | Use existing React Router patterns | Maximize reuse of existing infrastructure |
| Team management | Separate TeamContext | Better separation of concerns |
| Testing | TDD with actual database | Follow mako-review.md and existing patterns |

## Next Steps

After design approval:
1. Use `superpowers:writing-plans` to create detailed implementation plan
2. Use `superpowers:using-git-worktrees` to create isolated workspace
3. Execute implementation following TDD workflow
4. Use `superpowers:requesting-code-review` before merging
