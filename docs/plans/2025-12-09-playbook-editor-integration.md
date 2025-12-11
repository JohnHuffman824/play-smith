# Playbook Editor Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate playbook editor UI from Figma export into Play Smith, connecting playbook manager → playbook editor → play editor with full CRUD operations for sections and plays.

**Architecture:** Three-layer system - database migrations (sections table, play_type), API layer (nested RESTful endpoints), UI layer (migrated components with navigation). Following TDD, DRY, YAGNI principles with code quality fixes before migration.

**Tech Stack:** Bun, React 19, TypeScript, React Router v6, PostgreSQL, Tailwind CSS

**Design Document:** See `docs/plans/2025-12-09-playbook-editor-integration-design.md` for full context.

---

## Task 1: Create Database Migration for Sections and Play Type

**Files:**
- Create: `src/db/migrations/006_add_sections_and_play_type.sql`

**Step 1: Create migration file**

Create `src/db/migrations/006_add_sections_and_play_type.sql`:

```sql
-- Create sections table for organizing plays within playbooks
CREATE TABLE sections (
	id BIGSERIAL PRIMARY KEY,
	playbook_id BIGINT NOT NULL,
	name VARCHAR(255) NOT NULL,
	display_order INTEGER NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
	UNIQUE (playbook_id, display_order)
);

CREATE INDEX idx_sections_playbook_id ON sections(playbook_id);

CREATE TRIGGER update_sections_updated_at
	BEFORE UPDATE ON sections
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

-- Add play type enum and column to plays table
CREATE TYPE play_type AS ENUM ('pass', 'run');

ALTER TABLE plays ADD COLUMN play_type play_type;
ALTER TABLE plays ADD COLUMN section_id BIGINT REFERENCES sections(id) ON DELETE SET NULL;

CREATE INDEX idx_plays_section ON plays(section_id);
```

**Step 2: Run migration**

```bash
bun run migrate
```

Expected: Migration runs successfully, tables created

**Step 3: Verify migration**

```bash
bun run db:check
```

Expected: sections table exists, plays table has new columns

**Step 4: Commit**

```bash
git add src/db/migrations/006_add_sections_and_play_type.sql
git commit -m "db: add sections table and play_type to plays"
```

---

## Task 2: Create Shared Types for Playbook Editor

**Files:**
- Create: `src/types/playbook.ts`

**Step 1: Create types file**

Create `src/types/playbook.ts`:

```typescript
export interface Play {
	id: string
	name: string
	formation: string
	playType: string
	defensiveFormation: string
	tags: string[]
	lastModified: string
	thumbnail?: string
	personnel?: string
	sectionId?: string
}

export interface Section {
	id: string
	name: string
	plays: Play[]
}

export interface PlaybookDetails {
	id: string
	name: string
	description?: string
	teamId: string
	createdAt: string
	updatedAt: string
}
```

**Step 2: Commit**

```bash
git add src/types/playbook.ts
git commit -m "types: add playbook editor type definitions"
```

---

## Task 3: Extend ThemeContext with Field Settings

**Files:**
- Modify: `src/contexts/ThemeContext.tsx`
- Create: `src/contexts/ThemeContext.test.tsx`

**Step 1: Write failing test**

Create `src/contexts/ThemeContext.test.tsx`:

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'

describe('ThemeContext', () => {
	beforeEach(() => {
		localStorage.clear()
	})

	afterEach(() => {
		localStorage.clear()
	})

	test('provides default field settings', () => {
		const { result } = renderHook(() => useTheme(), {
			wrapper: ThemeProvider
		})

		expect(result.current.positionNaming).toBe('XYZABQ')
		expect(result.current.fieldLevel).toBe('College')
	})

	test('persists position naming to localStorage', () => {
		const { result } = renderHook(() => useTheme(), {
			wrapper: ThemeProvider
		})

		act(() => {
			result.current.setPositionNaming('XYZFTQ')
		})

		expect(result.current.positionNaming).toBe('XYZFTQ')
		expect(localStorage.getItem('positionNaming')).toBe('XYZFTQ')
	})

	test('persists field level to localStorage', () => {
		const { result } = renderHook(() => useTheme(), {
			wrapper: ThemeProvider
		})

		act(() => {
			result.current.setFieldLevel('Pro')
		})

		expect(result.current.fieldLevel).toBe('Pro')
		expect(localStorage.getItem('fieldLevel')).toBe('Pro')
	})

	test('loads settings from localStorage on mount', () => {
		localStorage.setItem('positionNaming', 'XYZFTQ')
		localStorage.setItem('fieldLevel', 'High School')

		const { result } = renderHook(() => useTheme(), {
			wrapper: ThemeProvider
		})

		expect(result.current.positionNaming).toBe('XYZFTQ')
		expect(result.current.fieldLevel).toBe('High School')
	})
})
```

**Step 2: Run test to verify it fails**

```bash
bun test src/contexts/ThemeContext.test.tsx
```

Expected: FAIL - positionNaming and fieldLevel don't exist on ThemeContext

**Step 3: Extend ThemeContext implementation**

Modify `src/contexts/ThemeContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ThemeContextType {
	theme: 'light' | 'dark'
	setTheme: (theme: 'light' | 'dark') => void
	positionNaming: string
	setPositionNaming: (naming: string) => void
	fieldLevel: string
	setFieldLevel: (level: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const DEFAULT_POSITION_NAMING = 'XYZABQ'
const DEFAULT_FIELD_LEVEL = 'College'

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
		const stored = localStorage.getItem('theme')
		return (stored === 'dark' ? 'dark' : 'light')
	})

	const [positionNaming, setPositionNamingState] = useState(() => {
		return localStorage.getItem('positionNaming') || DEFAULT_POSITION_NAMING
	})

	const [fieldLevel, setFieldLevelState] = useState(() => {
		return localStorage.getItem('fieldLevel') || DEFAULT_FIELD_LEVEL
	})

	function setTheme(newTheme: 'light' | 'dark') {
		setThemeState(newTheme)
		localStorage.setItem('theme', newTheme)
	}

	function setPositionNaming(naming: string) {
		setPositionNamingState(naming)
		localStorage.setItem('positionNaming', naming)
	}

	function setFieldLevel(level: string) {
		setFieldLevelState(level)
		localStorage.setItem('fieldLevel', level)
	}

	useEffect(() => {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [theme])

	return (
		<ThemeContext.Provider
			value={{
				theme,
				setTheme,
				positionNaming,
				setPositionNaming,
				fieldLevel,
				setFieldLevel
			}}
		>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider')
	}
	return context
}
```

**Step 4: Run test to verify it passes**

```bash
bun test src/contexts/ThemeContext.test.tsx
```

Expected: PASS - All tests pass

**Step 5: Commit**

```bash
git add src/contexts/ThemeContext.tsx src/contexts/ThemeContext.test.tsx
git commit -m "feat: extend ThemeContext with position naming and field level settings"
```

---

## Task 4: Create SectionRepository

**Files:**
- Create: `src/db/repositories/SectionRepository.ts`
- Create: `src/db/repositories/SectionRepository.test.ts`

**Step 1: Write failing test**

Create `src/db/repositories/SectionRepository.test.ts`:

```typescript
import { describe, test, expect, beforeEach } from 'bun:test'
import { SectionRepository } from './SectionRepository'
import { db } from '../index'

describe('SectionRepository', () => {
	let sectionRepo: SectionRepository
	let testPlaybookId: number

	beforeEach(async () => {
		sectionRepo = new SectionRepository(db)

		// Create test playbook (assumes playbook creation works)
		const result = await db.query(
			'INSERT INTO playbooks (team_id, name, created_by) VALUES ($1, $2, $3) RETURNING id',
			[1, 'Test Playbook', 1]
		)
		testPlaybookId = result.rows[0].id
	})

	test('create section', async () => {
		const section = await sectionRepo.create({
			playbookId: testPlaybookId,
			name: 'Opening Drive',
			displayOrder: 0
		})

		expect(section.id).toBeDefined()
		expect(section.name).toBe('Opening Drive')
		expect(section.playbookId).toBe(testPlaybookId)
		expect(section.displayOrder).toBe(0)
	})

	test('list sections for playbook', async () => {
		await sectionRepo.create({
			playbookId: testPlaybookId,
			name: 'Opening Drive',
			displayOrder: 0
		})
		await sectionRepo.create({
			playbookId: testPlaybookId,
			name: 'Red Zone',
			displayOrder: 1
		})

		const sections = await sectionRepo.listByPlaybook(testPlaybookId)

		expect(sections.length).toBe(2)
		expect(sections[0].name).toBe('Opening Drive')
		expect(sections[1].name).toBe('Red Zone')
	})

	test('update section', async () => {
		const section = await sectionRepo.create({
			playbookId: testPlaybookId,
			name: 'Opening Drive',
			displayOrder: 0
		})

		const updated = await sectionRepo.update(section.id, {
			name: 'First Drive',
			displayOrder: 1
		})

		expect(updated.name).toBe('First Drive')
		expect(updated.displayOrder).toBe(1)
	})

	test('delete section', async () => {
		const section = await sectionRepo.create({
			playbookId: testPlaybookId,
			name: 'Opening Drive',
			displayOrder: 0
		})

		await sectionRepo.delete(section.id)

		const sections = await sectionRepo.listByPlaybook(testPlaybookId)
		expect(sections.length).toBe(0)
	})
})
```

**Step 2: Run test to verify it fails**

```bash
bun test src/db/repositories/SectionRepository.test.ts
```

Expected: FAIL - "Cannot find module './SectionRepository'"

**Step 3: Implement SectionRepository**

Create `src/db/repositories/SectionRepository.ts`:

```typescript
import { Database } from 'bun:sqlite'

interface Section {
	id: number
	playbookId: number
	name: string
	displayOrder: number
	createdAt: Date
	updatedAt: Date
}

interface CreateSectionInput {
	playbookId: number
	name: string
	displayOrder: number
}

interface UpdateSectionInput {
	name?: string
	displayOrder?: number
}

export class SectionRepository {
	constructor(private db: Database) {}

	async create(input: CreateSectionInput): Promise<Section> {
		const result = await this.db.query(
			`INSERT INTO sections (playbook_id, name, display_order)
			 VALUES ($1, $2, $3)
			 RETURNING id, playbook_id, name, display_order, created_at, updated_at`
		).get(input.playbookId, input.name, input.displayOrder)

		return this.mapRow(result)
	}

	async listByPlaybook(playbookId: number): Promise<Section[]> {
		const results = await this.db.query(
			`SELECT id, playbook_id, name, display_order, created_at, updated_at
			 FROM sections
			 WHERE playbook_id = $1
			 ORDER BY display_order ASC`
		).all(playbookId)

		return results.map(row => this.mapRow(row))
	}

	async getById(id: number): Promise<Section | null> {
		const result = await this.db.query(
			`SELECT id, playbook_id, name, display_order, created_at, updated_at
			 FROM sections
			 WHERE id = $1`
		).get(id)

		return result ? this.mapRow(result) : null
	}

	async update(id: number, input: UpdateSectionInput): Promise<Section> {
		const updates: string[] = []
		const values: any[] = []
		let paramCount = 1

		if (input.name !== undefined) {
			updates.push(`name = $${paramCount++}`)
			values.push(input.name)
		}

		if (input.displayOrder !== undefined) {
			updates.push(`display_order = $${paramCount++}`)
			values.push(input.displayOrder)
		}

		values.push(id)

		const result = await this.db.query(
			`UPDATE sections
			 SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
			 WHERE id = $${paramCount}
			 RETURNING id, playbook_id, name, display_order, created_at, updated_at`
		).get(...values)

		return this.mapRow(result)
	}

	async delete(id: number): Promise<void> {
		await this.db.query('DELETE FROM sections WHERE id = $1').run(id)
	}

	private mapRow(row: any): Section {
		return {
			id: row.id,
			playbookId: row.playbook_id,
			name: row.name,
			displayOrder: row.display_order,
			createdAt: new Date(row.created_at),
			updatedAt: new Date(row.updated_at)
		}
	}
}
```

**Step 4: Run test to verify it passes**

```bash
bun test src/db/repositories/SectionRepository.test.ts
```

Expected: PASS - All tests pass

**Step 5: Commit**

```bash
git add src/db/repositories/SectionRepository.ts src/db/repositories/SectionRepository.test.ts
git commit -m "feat: add SectionRepository for managing playbook sections"
```

---

## Task 5: Create Sections API Endpoints

**Files:**
- Create: `src/api/sections.ts`
- Create: `src/api/sections.test.ts`
- Modify: `src/index.ts`

**Step 1: Write failing API test**

Create `src/api/sections.test.ts`:

```typescript
import { describe, test, expect, beforeEach } from 'bun:test'
import { serve } from 'bun'

describe('Sections API', () => {
	let server: ReturnType<typeof serve>
	let testPlaybookId: number
	let authCookie: string

	beforeEach(async () => {
		// Setup test server, auth, and playbook
		// (Implementation depends on existing test setup)
	})

	test('GET /api/playbooks/:playbookId/sections returns sections', async () => {
		const response = await fetch(
			`${server.url}/api/playbooks/${testPlaybookId}/sections`,
			{ headers: { Cookie: authCookie } }
		)

		expect(response.status).toBe(200)
		const sections = await response.json()
		expect(Array.isArray(sections)).toBe(true)
	})

	test('POST /api/playbooks/:playbookId/sections creates section', async () => {
		const response = await fetch(
			`${server.url}/api/playbooks/${testPlaybookId}/sections`,
			{
				method: 'POST',
				headers: {
					Cookie: authCookie,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: 'Opening Drive' })
			}
		)

		expect(response.status).toBe(201)
		const section = await response.json()
		expect(section.name).toBe('Opening Drive')
	})

	test('PUT /api/sections/:sectionId updates section', async () => {
		// Create section first
		const createResponse = await fetch(
			`${server.url}/api/playbooks/${testPlaybookId}/sections`,
			{
				method: 'POST',
				headers: {
					Cookie: authCookie,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: 'Opening Drive' })
			}
		)
		const section = await createResponse.json()

		// Update it
		const response = await fetch(
			`${server.url}/api/sections/${section.id}`,
			{
				method: 'PUT',
				headers: {
					Cookie: authCookie,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: 'First Drive' })
			}
		)

		expect(response.status).toBe(200)
		const updated = await response.json()
		expect(updated.name).toBe('First Drive')
	})

	test('DELETE /api/sections/:sectionId deletes section', async () => {
		// Create section first
		const createResponse = await fetch(
			`${server.url}/api/playbooks/${testPlaybookId}/sections`,
			{
				method: 'POST',
				headers: {
					Cookie: authCookie,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: 'Opening Drive' })
			}
		)
		const section = await createResponse.json()

		// Delete it
		const response = await fetch(
			`${server.url}/api/sections/${section.id}`,
			{
				method: 'DELETE',
				headers: { Cookie: authCookie }
			}
		)

		expect(response.status).toBe(204)
	})
})
```

**Step 2: Run test to verify it fails**

```bash
bun test src/api/sections.test.ts
```

Expected: FAIL - Endpoints don't exist yet

**Step 3: Implement sections API**

Create `src/api/sections.ts`:

```typescript
import { SectionRepository } from '../db/repositories/SectionRepository'
import { db } from '../db'

const sectionRepo = new SectionRepository(db)

export async function listSections(req: Request): Promise<Response> {
	const playbookId = parseInt(req.params.playbookId)

	// TODO: Add authorization check (user has access to playbook)

	const sections = await sectionRepo.listByPlaybook(playbookId)

	return Response.json(sections)
}

export async function createSection(req: Request): Promise<Response> {
	const playbookId = parseInt(req.params.playbookId)
	const body = await req.json()

	// TODO: Add authorization check (user can edit playbook)

	// Get next display_order
	const existing = await sectionRepo.listByPlaybook(playbookId)
	const displayOrder = existing.length

	const section = await sectionRepo.create({
		playbookId,
		name: body.name,
		displayOrder
	})

	return Response.json(section, { status: 201 })
}

export async function updateSection(req: Request): Promise<Response> {
	const sectionId = parseInt(req.params.sectionId)
	const body = await req.json()

	// TODO: Add authorization check (user can edit playbook)

	const section = await sectionRepo.update(sectionId, body)

	return Response.json(section)
}

export async function deleteSection(req: Request): Promise<Response> {
	const sectionId = parseInt(req.params.sectionId)

	// TODO: Add authorization check (user can edit playbook)

	await sectionRepo.delete(sectionId)

	return new Response(null, { status: 204 })
}
```

**Step 4: Add routes to server**

Modify `src/index.ts` to add section routes:

```typescript
// Add to routes object
"/api/playbooks/:playbookId/sections": {
	GET: listSections,
	POST: createSection
},
"/api/sections/:sectionId": {
	PUT: updateSection,
	DELETE: deleteSection
}
```

**Step 5: Run test to verify it passes**

```bash
bun test src/api/sections.test.ts
```

Expected: PASS - All tests pass

**Step 6: Commit**

```bash
git add src/api/sections.ts src/api/sections.test.ts src/index.ts
git commit -m "feat: add sections CRUD API endpoints"
```

---

## Task 6: Enhance Plays API for Playbook Editor

**Files:**
- Create: `src/api/plays.ts`
- Create: `src/api/plays.test.ts`
- Modify: `src/index.ts`

**Step 1: Write failing test**

Create `src/api/plays.test.ts`:

```typescript
import { describe, test, expect, beforeEach } from 'bun:test'

describe('Plays API', () => {
	test('GET /api/playbooks/:playbookId/plays returns all plays', async () => {
		// Test implementation
	})

	test('POST /api/playbooks/:playbookId/plays creates play', async () => {
		// Test implementation
	})

	test('PUT /api/plays/:playId updates play', async () => {
		// Test implementation
	})

	test('DELETE /api/plays/:playId deletes play', async () => {
		// Test implementation
	})

	test('POST /api/plays/:playId/duplicate creates copy', async () => {
		// Test implementation
	})
})
```

**Step 2: Run test to verify it fails**

```bash
bun test src/api/plays.test.ts
```

Expected: FAIL - Endpoints don't exist

**Step 3: Implement plays API**

Create `src/api/plays.ts`:

```typescript
import { PlayRepository } from '../db/repositories/PlayRepository'
import { db } from '../db'

const playRepo = new PlayRepository(db)

export async function listPlays(req: Request): Promise<Response> {
	const playbookId = parseInt(req.params.playbookId)

	// TODO: Add authorization check

	const plays = await playRepo.listByPlaybook(playbookId)

	return Response.json(plays)
}

export async function createPlay(req: Request): Promise<Response> {
	const playbookId = parseInt(req.params.playbookId)
	const body = await req.json()

	// TODO: Add authorization check

	const play = await playRepo.create({
		playbookId,
		name: body.name,
		sectionId: body.sectionId,
		createdBy: req.user.id // From auth middleware
	})

	return Response.json(play, { status: 201 })
}

export async function updatePlay(req: Request): Promise<Response> {
	const playId = parseInt(req.params.playId)
	const body = await req.json()

	// TODO: Add authorization check

	const play = await playRepo.update(playId, body)

	return Response.json(play)
}

export async function deletePlay(req: Request): Promise<Response> {
	const playId = parseInt(req.params.playId)

	// TODO: Add authorization check

	await playRepo.delete(playId)

	return new Response(null, { status: 204 })
}

export async function duplicatePlay(req: Request): Promise<Response> {
	const playId = parseInt(req.params.playId)

	// TODO: Add authorization check

	const original = await playRepo.getById(playId)
	if (!original) {
		return Response.json({ error: 'Play not found' }, { status: 404 })
	}

	const duplicate = await playRepo.create({
		playbookId: original.playbookId,
		sectionId: original.sectionId,
		name: `${original.name} (Copy)`,
		playType: original.playType,
		formationId: original.formationId,
		personnelId: original.personnelId,
		defensiveFormationId: original.defensiveFormationId,
		createdBy: req.user.id
	})

	return Response.json(duplicate, { status: 201 })
}
```

**Step 4: Add routes to server**

Modify `src/index.ts`:

```typescript
"/api/playbooks/:playbookId/plays": {
	GET: listPlays,
	POST: createPlay
},
"/api/plays/:playId": {
	PUT: updatePlay,
	DELETE: deletePlay
},
"/api/plays/:playId/duplicate": {
	POST: duplicatePlay
}
```

**Step 5: Run test to verify it passes**

```bash
bun test src/api/plays.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/api/plays.ts src/api/plays.test.ts src/index.ts
git commit -m "feat: add plays CRUD API endpoints for playbook editor"
```

---

## Task 7: Fix Code Quality Issues in playbookEditorInterface

**Files:**
- Modify: All files in `playbookEditorInterface/`

**Step 1: Extract shared Play interface**

Remove duplicate `Play` interface from:
- `playbookEditorInterface/PlaybookEditor.tsx:30`
- `playbookEditorInterface/components/PlayListView.tsx:17`

Update both files to import from types:

```typescript
import { Play, Section } from '../types/playbook'
```

**Step 2: Replace alert() calls with Modal usage**

In `playbookEditorInterface/PlaybookEditor.tsx`:

Replace line 244:
```typescript
// Before:
alert(`Opening play editor for: ${newPlay.name}`)

// After:
// Will be handled by navigation in integration
```

Replace line 272 (rename prompt):
```typescript
// Before:
const newName = prompt('Rename play:', play.name)

// After:
// Add state for rename modal
const [showRenameModal, setShowRenameModal] = useState(false)
const [renamePlayId, setRenamePlayId] = useState<string | null>(null)

// Update handleRenamePlay to use modal instead
function handleRenamePlay(playId: string) {
	setRenamePlayId(playId)
	setShowRenameModal(true)
}
```

**Step 3: Fix line lengths**

Break long className strings into multiple lines (example):

```typescript
// Before:
<input className="w-full pl-11 pr-4 py-2.5 bg-input-background text-foreground placeholder:text-muted-foreground rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200" />

// After:
<input
	className="w-full pl-11 pr-4 py-2.5 bg-input-background
		text-foreground placeholder:text-muted-foreground
		rounded-lg border-0 outline-none focus:ring-2
		focus:ring-ring/20 transition-all duration-200"
/>
```

**Step 4: Remove hardcoded URL in ShareDialog**

In `playbookEditorInterface/components/ShareDialog.tsx:70`:

```typescript
// Before:
const shareLink = `https://playsmith.app/shared/${playbookName.toLowerCase().replace(/\s+/g, '-')}`

// After:
const shareLink = `${window.location.origin}/playbooks/${playbookId}`
```

**Step 5: Fix incomplete "Move Skills on Hash Change" toggle**

In `playbookEditorInterface/components/SettingsDialog.tsx:155-168`:

Either implement or remove. For now, remove since not in MVP:

```typescript
// Remove this entire section or implement properly
```

**Step 6: Commit**

```bash
git add playbookEditorInterface/
git commit -m "refactor: fix code quality issues in playbook editor interface"
```

---

## Task 8: Migrate Components to src/

**Files:**
- Move: `playbookEditorInterface/components/PlaybookEditorToolbar.tsx` → `src/components/playbook-editor/`
- Move: `playbookEditorInterface/components/PlayCard.tsx` → `src/components/playbook-editor/`
- Move: `playbookEditorInterface/components/PlayListView.tsx` → `src/components/playbook-editor/`
- Move: `playbookEditorInterface/components/Modal.tsx` → `src/components/shared/`
- Move: `playbookEditorInterface/components/SettingsDialog.tsx` → `src/components/shared/`
- Move: `playbookEditorInterface/components/ShareDialog.tsx` → `src/components/shared/`

**Step 1: Create directories**

```bash
mkdir -p src/components/playbook-editor
mkdir -p src/components/shared
```

**Step 2: Move files**

```bash
mv playbookEditorInterface/components/PlaybookEditorToolbar.tsx src/components/playbook-editor/
mv playbookEditorInterface/components/PlayCard.tsx src/components/playbook-editor/
mv playbookEditorInterface/components/PlayListView.tsx src/components/playbook-editor/
mv playbookEditorInterface/components/Modal.tsx src/components/shared/
mv playbookEditorInterface/components/SettingsDialog.tsx src/components/shared/
mv playbookEditorInterface/components/ShareDialog.tsx src/components/shared/
```

**Step 3: Update imports in moved files**

Update all imports to use correct paths from `src/`:

```typescript
// Example in PlayCard.tsx
import { Play } from '../../types/playbook'
import { useTheme } from '../../contexts/ThemeContext'
```

**Step 4: Delete ConfigContext**

```bash
rm -rf playbookEditorInterface/contexts/
```

**Step 5: Update all components to use ThemeContext**

Replace `useConfig()` with `useTheme()` in all migrated files:

```typescript
// Before:
import { useConfig } from '../contexts/ConfigContext'
const { theme } = useConfig()

// After:
import { useTheme } from '../../contexts/ThemeContext'
const { theme } = useTheme()
```

**Step 6: Commit**

```bash
git add src/components/
git rm -r playbookEditorInterface/contexts/
git commit -m "refactor: migrate playbook editor components to src/"
```

---

## Task 9: Implement PlaybookEditorPage

**Files:**
- Modify: `src/pages/PlaybookEditorPage.tsx`
- Create: `src/pages/PlaybookEditorPage.test.tsx`

**Step 1: Write failing test**

Create `src/pages/PlaybookEditorPage.test.tsx`:

```typescript
import { describe, test, expect } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PlaybookEditorPage } from './PlaybookEditorPage'

describe('PlaybookEditorPage', () => {
	test('fetches and displays playbook data', async () => {
		// Mock API responses
		global.fetch = jest.fn((url) => {
			if (url.includes('/api/playbooks/1')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({
						id: 1,
						name: 'Test Playbook',
						description: 'Test'
					})
				})
			}
			if (url.includes('/api/playbooks/1/sections')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve([])
				})
			}
			if (url.includes('/api/playbooks/1/plays')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve([])
				})
			}
		})

		render(
			<MemoryRouter initialEntries={['/playbooks/1']}>
				<Routes>
					<Route path="/playbooks/:playbookId" element={<PlaybookEditorPage />} />
				</Routes>
			</MemoryRouter>
		)

		await waitFor(() => {
			expect(screen.getByText('Test Playbook')).toBeDefined()
		})
	})
})
```

**Step 2: Run test to verify it fails**

```bash
bun test src/pages/PlaybookEditorPage.test.tsx
```

Expected: FAIL - Page doesn't fetch or display data

**Step 3: Implement PlaybookEditorPage**

Replace `src/pages/PlaybookEditorPage.tsx`:

```typescript
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { Play, Section, PlaybookDetails } from '../types/playbook'
import { PlaybookEditorToolbar } from '../components/playbook-editor/PlaybookEditorToolbar'
import { PlayCard } from '../components/playbook-editor/PlayCard'
import { PlayListView } from '../components/playbook-editor/PlayListView'
import { Modal } from '../components/shared/Modal'
import { SettingsDialog } from '../components/shared/SettingsDialog'
import { ShareDialog } from '../components/shared/ShareDialog'
import {
	ArrowLeft,
	Search,
	LayoutGrid,
	List,
	Settings,
	Upload,
	Download,
	Share2
} from 'lucide-react'

const VIEW_MODE_GRID = 'grid'
const VIEW_MODE_LIST = 'list'

export function PlaybookEditorPage() {
	const { playbookId } = useParams()
	const navigate = useNavigate()
	const {
		theme,
		setTheme,
		positionNaming,
		setPositionNaming,
		fieldLevel,
		setFieldLevel
	} = useTheme()

	const [playbook, setPlaybook] = useState<PlaybookDetails | null>(null)
	const [sections, setSections] = useState<Section[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [viewMode, setViewMode] = useState<'grid' | 'list'>(VIEW_MODE_GRID)
	const [searchQuery, setSearchQuery] = useState('')
	const [showNewPlayModal, setShowNewPlayModal] = useState(false)
	const [showNewSectionModal, setShowNewSectionModal] = useState(false)
	const [showSettingsDialog, setShowSettingsDialog] = useState(false)
	const [showShareDialog, setShowShareDialog] = useState(false)
	const [newItemName, setNewItemName] = useState('')
	const [selectedPlays, setSelectedPlays] = useState<Set<string>>(new Set())
	const [activeSectionFilter, setActiveSectionFilter] = useState<string | null>(null)

	useEffect(() => {
		fetchPlaybookData()
	}, [playbookId])

	async function fetchPlaybookData() {
		try {
			setIsLoading(true)

			const [playbookRes, sectionsRes, playsRes] = await Promise.all([
				fetch(`/api/playbooks/${playbookId}`),
				fetch(`/api/playbooks/${playbookId}/sections`),
				fetch(`/api/playbooks/${playbookId}/plays`)
			])

			if (!playbookRes.ok) {
				throw new Error('Failed to fetch playbook')
			}

			const playbookData = await playbookRes.json()
			const sectionsData = await sectionsRes.json()
			const playsData = await playsRes.json()

			setPlaybook(playbookData)

			// Group plays by section
			const sectionsWithPlays = sectionsData.map((section: any) => ({
				id: section.id,
				name: section.name,
				plays: playsData.filter((play: any) => play.sectionId == section.id)
			}))

			setSections(sectionsWithPlays)
		} catch (err) {
			setError(err.message)
		} finally {
			setIsLoading(false)
		}
	}

	function handleBack() {
		navigate('/playbooks')
	}

	function handleOpenPlay(playId: string) {
		navigate(`/playbooks/${playbookId}/plays/${playId}`)
	}

	async function handleNewPlay() {
		if (!newItemName.trim()) return

		try {
			const response = await fetch(`/api/playbooks/${playbookId}/plays`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newItemName })
			})

			if (response.ok) {
				const newPlay = await response.json()
				handleOpenPlay(newPlay.id)
			}
		} catch (err) {
			console.error('Failed to create play:', err)
		}

		setNewItemName('')
		setShowNewPlayModal(false)
	}

	async function handleNewSection() {
		if (!newItemName.trim()) return

		try {
			const response = await fetch(`/api/playbooks/${playbookId}/sections`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newItemName })
			})

			if (response.ok) {
				await fetchPlaybookData()
			}
		} catch (err) {
			console.error('Failed to create section:', err)
		}

		setNewItemName('')
		setShowNewSectionModal(false)
	}

	async function handleRenamePlay(playId: string) {
		const play = sections
			.flatMap(s => s.plays)
			.find(p => p.id == playId)

		if (!play) return

		const newName = prompt('Rename play:', play.name)
		if (newName?.trim()) {
			try {
				await fetch(`/api/plays/${playId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newName })
				})
				await fetchPlaybookData()
			} catch (err) {
				console.error('Failed to rename play:', err)
			}
		}
	}

	async function handleDeletePlay(playId: string) {
		const play = sections
			.flatMap(s => s.plays)
			.find(p => p.id == playId)

		if (play && confirm(`Delete play "${play.name}"?`)) {
			try {
				await fetch(`/api/plays/${playId}`, { method: 'DELETE' })
				await fetchPlaybookData()
			} catch (err) {
				console.error('Failed to delete play:', err)
			}
		}
	}

	async function handleDuplicatePlay(playId: string) {
		try {
			await fetch(`/api/plays/${playId}/duplicate`, { method: 'POST' })
			await fetchPlaybookData()
		} catch (err) {
			console.error('Failed to duplicate play:', err)
		}
	}

	const filteredSections = useMemo(() => {
		return sections.map(section => ({
			...section,
			plays: section.plays.filter(
				play =>
					play.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					play.formation.toLowerCase().includes(searchQuery.toLowerCase()) ||
					play.tags.some(tag =>
						tag.toLowerCase().includes(searchQuery.toLowerCase())
					)
			)
		})).filter(section => section.plays.length > 0)
	}, [sections, searchQuery])

	const displayedSections = activeSectionFilter
		? filteredSections.filter(section => section.id == activeSectionFilter)
		: filteredSections

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-lg">Loading...</div>
			</div>
		)
	}

	if (error || !playbook) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-red-500">Error: {error || 'Playbook not found'}</div>
			</div>
		)
	}

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Header */}
				<div className="border-b border-border bg-card px-6 py-4">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							<button onClick={handleBack} className="p-2 hover:bg-accent rounded-lg">
								<ArrowLeft className="w-5 h-5" />
							</button>
							<div>
								<h1 className="mb-1">{playbook.name}</h1>
								<p className="text-muted-foreground">
									{sections.flatMap(s => s.plays).length} plays across{' '}
									{sections.length} sections
								</p>
							</div>

							<div className="w-px self-stretch bg-border ml-2" />

							<div className="relative min-w-[400px]">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
								<input
									type="text"
									placeholder="Search plays, formations, tags..."
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
									className="w-full pl-11 pr-4 py-2.5 bg-input-background
										text-foreground placeholder:text-muted-foreground
										rounded-lg border-0 outline-none focus:ring-2
										focus:ring-ring/20"
								/>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{/* Action buttons */}
							<div className="flex items-center bg-muted rounded-lg p-1">
								<button
									onClick={() => setViewMode(VIEW_MODE_GRID)}
									className={`p-2 rounded ${
										viewMode == VIEW_MODE_GRID
											? 'bg-card shadow-sm'
											: 'hover:bg-accent/50'
									}`}
								>
									<LayoutGrid className="w-4 h-4" />
								</button>
								<button
									onClick={() => setViewMode(VIEW_MODE_LIST)}
									className={`p-2 rounded ${
										viewMode == VIEW_MODE_LIST
											? 'bg-card shadow-sm'
											: 'hover:bg-accent/50'
									}`}
								>
									<List className="w-4 h-4" />
								</button>
							</div>

							<button
								onClick={() => setShowSettingsDialog(true)}
								className="p-2 hover:bg-accent rounded-lg"
							>
								<Settings className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>

				{/* Toolbar */}
				<PlaybookEditorToolbar
					onNewPlay={() => setShowNewPlayModal(true)}
					onNewSection={() => setShowNewSectionModal(true)}
					sections={sections.map(s => ({ id: s.id, name: s.name }))}
					activeSectionFilter={activeSectionFilter}
					onSectionFilterChange={setActiveSectionFilter}
				/>

				{/* Content */}
				<div className="flex-1 overflow-auto p-6">
					{displayedSections.length > 0 ? (
						<div className="space-y-8">
							{displayedSections.map(section => (
								<div key={section.id}>
									<div className="flex items-center justify-between mb-4">
										<h2>{section.name}</h2>
										<p className="text-muted-foreground">
											{section.plays.length} plays
										</p>
									</div>

									{viewMode == VIEW_MODE_GRID ? (
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
											{section.plays.map(play => (
												<PlayCard
													key={play.id}
													{...play}
													onOpen={handleOpenPlay}
													onRename={handleRenamePlay}
													onDelete={handleDeletePlay}
													onDuplicate={handleDuplicatePlay}
												/>
											))}
										</div>
									) : (
										<PlayListView
											plays={section.plays}
											onOpen={handleOpenPlay}
											onRename={handleRenamePlay}
											onDelete={handleDeletePlay}
											onDuplicate={handleDuplicatePlay}
										/>
									)}
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-16">
							<p className="text-muted-foreground">No plays found</p>
						</div>
					)}
				</div>
			</div>

			{/* Modals */}
			<Modal
				isOpen={showNewPlayModal}
				onClose={() => {
					setShowNewPlayModal(false)
					setNewItemName('')
				}}
				title="Create New Play"
			>
				<div className="space-y-4">
					<input
						type="text"
						value={newItemName}
						onChange={e => setNewItemName(e.target.value)}
						onKeyDown={e => e.key == 'Enter' && handleNewPlay()}
						placeholder="Play name..."
						className="w-full px-4 py-2.5 rounded-lg"
						autoFocus
					/>
					<div className="flex justify-end gap-2">
						<button
							onClick={() => setShowNewPlayModal(false)}
							className="px-4 py-2 hover:bg-accent rounded-lg"
						>
							Cancel
						</button>
						<button
							onClick={handleNewPlay}
							disabled={!newItemName.trim()}
							className="px-4 py-2 bg-primary text-primary-foreground
								rounded-lg disabled:opacity-50"
						>
							Create
						</button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={showNewSectionModal}
				onClose={() => {
					setShowNewSectionModal(false)
					setNewItemName('')
				}}
				title="Create New Section"
			>
				<div className="space-y-4">
					<input
						type="text"
						value={newItemName}
						onChange={e => setNewItemName(e.target.value)}
						onKeyDown={e => e.key == 'Enter' && handleNewSection()}
						placeholder="Section name..."
						className="w-full px-4 py-2.5 rounded-lg"
						autoFocus
					/>
					<div className="flex justify-end gap-2">
						<button
							onClick={() => setShowNewSectionModal(false)}
							className="px-4 py-2 hover:bg-accent rounded-lg"
						>
							Cancel
						</button>
						<button
							onClick={handleNewSection}
							disabled={!newItemName.trim()}
							className="px-4 py-2 bg-primary text-primary-foreground
								rounded-lg disabled:opacity-50"
						>
							Create
						</button>
					</div>
				</div>
			</Modal>

			<SettingsDialog
				isOpen={showSettingsDialog}
				onClose={() => setShowSettingsDialog(false)}
				theme={theme}
				onThemeChange={setTheme}
				positionNaming={positionNaming}
				onPositionNamingChange={setPositionNaming}
				fieldLevel={fieldLevel}
				onFieldLevelChange={setFieldLevel}
			/>

			<ShareDialog
				isOpen={showShareDialog}
				onClose={() => setShowShareDialog(false)}
				playbookName={playbook.name}
				onShare={() => {}}
			/>
		</div>
	)
}
```

**Step 4: Run test to verify it passes**

```bash
bun test src/pages/PlaybookEditorPage.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/PlaybookEditorPage.tsx src/pages/PlaybookEditorPage.test.tsx
git commit -m "feat: implement PlaybookEditorPage with API integration"
```

---

## Task 10: Integration Testing and Cleanup

**Files:**
- Create: `tests/integration/playbook-editor-flow.test.tsx`
- Delete: `playbookEditorInterface/`

**Step 1: Write integration test**

Create `tests/integration/playbook-editor-flow.test.tsx`:

```typescript
import { describe, test, expect } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../src/App'

describe('Playbook Editor Flow', () => {
	test('complete flow: manager -> editor -> play editor', async () => {
		// Mock auth and data

		render(<App />)

		// Navigate to playbooks page
		// Click a playbook card
		// Verify playbook editor loads
		// Click a play card
		// Verify play editor loads
		// Click back
		// Verify back at playbook editor
		// Click back again
		// Verify back at playbook manager
	})
})
```

**Step 2: Run integration test**

```bash
bun test tests/integration/playbook-editor-flow.test.tsx
```

Expected: PASS - Full flow works

**Step 3: Delete playbookEditorInterface folder**

```bash
rm -rf playbookEditorInterface/
```

**Step 4: Run all tests**

```bash
bun test
```

Expected: All tests pass

**Step 5: Final commit**

```bash
git add .
git rm -r playbookEditorInterface/
git commit -m "test: add integration tests and remove old playbook editor interface"
```

---

## Success Checklist

Verify all criteria:

- [ ] Database migration applied (sections table, play_type)
- [ ] API endpoints functional and tested
- [ ] ThemeContext extended with field settings
- [ ] All code quality issues fixed
- [ ] Components migrated to src/
- [ ] PlaybookEditorPage functional with real data
- [ ] Navigation works: Manager → Editor → Play Editor
- [ ] Back navigation returns to manager
- [ ] Settings persist globally
- [ ] All tests pass
- [ ] No console errors
- [ ] UI matches Figma design
- [ ] playbookEditorInterface/ deleted

---

## Next Steps

After implementation:
1. Manual testing in browser
2. Code review against mako-review.md checklist
3. Create pull request
4. Deploy to staging
