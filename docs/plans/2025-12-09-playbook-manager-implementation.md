# Playbook Manager Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate playbook manager UI from Figma with backend API, following TDD workflow and mako-review.md standards.

**Architecture:** Three-layer architecture with API endpoints, React contexts for state management, and migrated UI components. Backend-first approach ensures real data flow from the start.

**Tech Stack:** Bun, React, TypeScript, PostgreSQL, React Router, existing repositories

---

## Phase 1: Backend Foundation

### Task 1: Playbook API - List Endpoint

**Files:**
- Create: `src/api/playbooks.ts`
- Create: `src/api/playbooks.test.ts`
- Modify: `src/index.ts`

**Step 1: Write failing test for list endpoint**

Create `src/api/playbooks.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { UserRepository } from '../db/repositories/UserRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { PlaybookRepository } from '../db/repositories/PlaybookRepository'
import { SessionRepository } from '../db/repositories/SessionRepository'

describe('Playbooks API', () => {
	let userRepo: UserRepository
	let teamRepo: TeamRepository
	let playbookRepo: PlaybookRepository
	let sessionRepo: SessionRepository
	let testUserId: number
	let testTeamId: number
	let testSession: string

	beforeEach(async () => {
		userRepo = new UserRepository()
		teamRepo = new TeamRepository()
		playbookRepo = new PlaybookRepository()
		sessionRepo = new SessionRepository()

		// Create test user
		const user = await userRepo.create({
			email: 'test@example.com',
			name: 'Test User',
			password_hash: 'hash'
		})
		testUserId = user.id

		// Create test team
		const team = await teamRepo.create({ name: 'Test Team' })
		testTeamId = team.id

		// Add user to team
		await teamRepo.addMember({
			team_id: testTeamId,
			user_id: testUserId,
			role: 'owner'
		})

		// Create session
		const session = await sessionRepo.create(testUserId)
		testSession = session.token
	})

	afterEach(async () => {
		// Clean up test data
		await db`DELETE FROM playbooks WHERE team_id = ${testTeamId}`
		await db`DELETE FROM team_members WHERE team_id = ${testTeamId}`
		await db`DELETE FROM teams WHERE id = ${testTeamId}`
		await db`DELETE FROM sessions WHERE user_id = ${testUserId}`
		await db`DELETE FROM users WHERE id = ${testUserId}`
	})

	test('GET /api/playbooks returns user playbooks', async () => {
		// Create test playbooks
		const pb1 = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Playbook 1',
			created_by: testUserId
		})
		const pb2 = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Playbook 2',
			created_by: testUserId
		})

		// Make request
		const response = await fetch('http://localhost:3000/api/playbooks', {
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.playbooks).toBeArray()
		expect(data.playbooks.length).toBe(2)
		expect(data.playbooks[0].name).toBe('Playbook 2') // DESC order
		expect(data.playbooks[1].name).toBe('Playbook 1')
	})
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/api/playbooks.test.ts`
Expected: FAIL with "fetch failed" or "404 Not Found"

**Step 3: Write minimal implementation**

Create `src/api/playbooks.ts`:

```typescript
import { SessionRepository } from '../db/repositories/SessionRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { PlaybookRepository } from '../db/repositories/PlaybookRepository'

const sessionRepo = new SessionRepository()
const teamRepo = new TeamRepository()
const playbookRepo = new PlaybookRepository()

async function getSessionUser(req: Request) {
	const cookie = req.headers.get('Cookie')
	if (!cookie) return null

	const sessionMatch = cookie.match(/session=([^;]+)/)
	if (!sessionMatch) return null

	const session = await sessionRepo.findByToken(sessionMatch[1])
	if (!session) return null

	return session.user_id
}

export const playbooksAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get user's teams
		const teams = await teamRepo.getUserTeams(userId)

		// Get playbooks for all teams
		const allPlaybooks = []
		for (const team of teams) {
			const teamPlaybooks = await playbookRepo.getTeamPlaybooks(team.id)
			allPlaybooks.push(...teamPlaybooks)
		}

		return Response.json({ playbooks: allPlaybooks })
	}
}
```

**Step 4: Add route to server**

Modify `src/index.ts` - add after auth routes:

```typescript
import { playbooksAPI } from './api/playbooks'

// Add this route:
'/api/playbooks': {
	GET: playbooksAPI.list
},
```

**Step 5: Run test to verify it passes**

Run: `bun test src/api/playbooks.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/api/playbooks.ts src/api/playbooks.test.ts src/index.ts
git commit -m "feat: add GET /api/playbooks endpoint

- Returns all playbooks for user's teams
- Requires authentication
- Includes test coverage"
```

---

### Task 2: Playbook API - Get Single Playbook

**Files:**
- Modify: `src/api/playbooks.ts`
- Modify: `src/api/playbooks.test.ts`
- Modify: `src/index.ts`

**Step 1: Write failing test**

Add to `src/api/playbooks.test.ts`:

```typescript
test('GET /api/playbooks/:id returns single playbook', async () => {
	const pb = await playbookRepo.create({
		team_id: testTeamId,
		name: 'Test Playbook',
		description: 'Test description',
		created_by: testUserId
	})

	const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
		headers: {
			Cookie: `session=${testSession}`
		}
	})

	expect(response.status).toBe(200)
	const data = await response.json()
	expect(data.playbook.id).toBe(pb.id)
	expect(data.playbook.name).toBe('Test Playbook')
	expect(data.playbook.description).toBe('Test description')
})

test('GET /api/playbooks/:id returns 404 for non-existent playbook', async () => {
	const response = await fetch('http://localhost:3000/api/playbooks/99999', {
		headers: {
			Cookie: `session=${testSession}`
		}
	})

	expect(response.status).toBe(404)
	const data = await response.json()
	expect(data.error).toBe('Playbook not found')
})

test('GET /api/playbooks/:id returns 403 for unauthorized access', async () => {
	// Create another user and team
	const otherUser = await userRepo.create({
		email: 'other@example.com',
		name: 'Other User',
		password_hash: 'hash'
	})
	const otherTeam = await teamRepo.create({ name: 'Other Team' })
	await teamRepo.addMember({
		team_id: otherTeam.id,
		user_id: otherUser.id,
		role: 'owner'
	})

	// Create playbook in other team
	const pb = await playbookRepo.create({
		team_id: otherTeam.id,
		name: 'Other Playbook',
		created_by: otherUser.id
	})

	// Try to access with test user's session
	const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
		headers: {
			Cookie: `session=${testSession}`
		}
	})

	expect(response.status).toBe(403)
	const data = await response.json()
	expect(data.error).toBe('Access denied')

	// Cleanup
	await db`DELETE FROM playbooks WHERE id = ${pb.id}`
	await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
	await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
	await db`DELETE FROM users WHERE id = ${otherUser.id}`
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/api/playbooks.test.ts`
Expected: FAIL with "404 Not Found" or route not found

**Step 3: Implement get endpoint**

Add to `src/api/playbooks.ts`:

```typescript
export const playbooksAPI = {
	// ... existing list method

	get: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.id)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		const playbook = await playbookRepo.findById(playbookId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}

		// Check if user has access to this playbook's team
		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === playbook.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		return Response.json({ playbook })
	}
}
```

**Step 4: Add route**

Modify `src/index.ts`:

```typescript
'/api/playbooks/:id': {
	GET: playbooksAPI.get
},
```

**Step 5: Run tests to verify they pass**

Run: `bun test src/api/playbooks.test.ts`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/api/playbooks.ts src/api/playbooks.test.ts src/index.ts
git commit -m "feat: add GET /api/playbooks/:id endpoint

- Returns single playbook by ID
- Validates user has access to playbook's team
- Returns 404 if not found, 403 if no access"
```

---

### Task 3: Playbook API - Create Endpoint

**Files:**
- Modify: `src/api/playbooks.ts`
- Modify: `src/api/playbooks.test.ts`
- Modify: `src/index.ts`

**Step 1: Write failing test**

Add to `src/api/playbooks.test.ts`:

```typescript
test('POST /api/playbooks creates new playbook', async () => {
	const response = await fetch('http://localhost:3000/api/playbooks', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `session=${testSession}`
		},
		body: JSON.stringify({
			team_id: testTeamId,
			name: 'New Playbook',
			description: 'New description'
		})
	})

	expect(response.status).toBe(201)
	const data = await response.json()
	expect(data.playbook.name).toBe('New Playbook')
	expect(data.playbook.description).toBe('New description')
	expect(data.playbook.team_id).toBe(testTeamId)
	expect(data.playbook.created_by).toBe(testUserId)
})

test('POST /api/playbooks validates required fields', async () => {
	const response = await fetch('http://localhost:3000/api/playbooks', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `session=${testSession}`
		},
		body: JSON.stringify({
			team_id: testTeamId
			// Missing name
		})
	})

	expect(response.status).toBe(400)
	const data = await response.json()
	expect(data.error).toContain('name')
})

test('POST /api/playbooks requires team membership', async () => {
	const otherTeam = await teamRepo.create({ name: 'Other Team' })

	const response = await fetch('http://localhost:3000/api/playbooks', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `session=${testSession}`
		},
		body: JSON.stringify({
			team_id: otherTeam.id,
			name: 'Unauthorized Playbook'
		})
	})

	expect(response.status).toBe(403)
	const data = await response.json()
	expect(data.error).toBe('Not a member of this team')

	await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/api/playbooks.test.ts`
Expected: FAIL with method not found or 404

**Step 3: Implement create endpoint**

Modify `src/api/playbooks.ts`:

```typescript
export const playbooksAPI = {
	// ... existing methods

	create: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await req.json()
		const { team_id, name, description } = body

		// Validate required fields
		if (!team_id || !name) {
			return Response.json(
				{ error: 'team_id and name are required' },
				{ status: 400 }
			)
		}

		// Check user is member of team
		const teams = await teamRepo.getUserTeams(userId)
		const isMember = teams.some(team => team.id === team_id)

		if (!isMember) {
			return Response.json(
				{ error: 'Not a member of this team' },
				{ status: 403 }
			)
		}

		// Create playbook
		const playbook = await playbookRepo.create({
			team_id,
			name,
			description: description || null,
			created_by: userId
		})

		return Response.json({ playbook }, { status: 201 })
	}
}
```

**Step 4: Add route**

Modify `src/index.ts`:

```typescript
'/api/playbooks': {
	GET: playbooksAPI.list,
	POST: playbooksAPI.create
},
```

**Step 5: Run tests**

Run: `bun test src/api/playbooks.test.ts`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/api/playbooks.ts src/api/playbooks.test.ts src/index.ts
git commit -m "feat: add POST /api/playbooks endpoint

- Creates new playbook for team
- Validates required fields
- Checks user is team member"
```

---

### Task 4: Playbook API - Update Endpoint

**Files:**
- Modify: `src/api/playbooks.ts`
- Modify: `src/api/playbooks.test.ts`
- Modify: `src/index.ts`

**Step 1: Write failing test**

Add to `src/api/playbooks.test.ts`:

```typescript
test('PUT /api/playbooks/:id updates playbook', async () => {
	const pb = await playbookRepo.create({
		team_id: testTeamId,
		name: 'Original Name',
		created_by: testUserId
	})

	const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `session=${testSession}`
		},
		body: JSON.stringify({
			name: 'Updated Name',
			description: 'Updated description'
		})
	})

	expect(response.status).toBe(200)
	const data = await response.json()
	expect(data.playbook.name).toBe('Updated Name')
	expect(data.playbook.description).toBe('Updated description')
})

test('PUT /api/playbooks/:id requires team membership', async () => {
	const otherUser = await userRepo.create({
		email: 'other@example.com',
		name: 'Other',
		password_hash: 'hash'
	})
	const otherTeam = await teamRepo.create({ name: 'Other Team' })
	await teamRepo.addMember({
		team_id: otherTeam.id,
		user_id: otherUser.id,
		role: 'owner'
	})

	const pb = await playbookRepo.create({
		team_id: otherTeam.id,
		name: 'Other Playbook',
		created_by: otherUser.id
	})

	const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `session=${testSession}`
		},
		body: JSON.stringify({
			name: 'Hacked Name'
		})
	})

	expect(response.status).toBe(403)

	// Cleanup
	await db`DELETE FROM playbooks WHERE id = ${pb.id}`
	await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
	await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
	await db`DELETE FROM users WHERE id = ${otherUser.id}`
})
```

**Step 2: Run test**

Run: `bun test src/api/playbooks.test.ts`
Expected: FAIL

**Step 3: Implement update endpoint**

Modify `src/api/playbooks.ts`:

```typescript
export const playbooksAPI = {
	// ... existing methods

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.id)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		const playbook = await playbookRepo.findById(playbookId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}

		// Check user has access
		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === playbook.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()
		const updated = await playbookRepo.update(playbookId, body)

		return Response.json({ playbook: updated })
	}
}
```

**Step 4: Add route**

Modify `src/index.ts`:

```typescript
'/api/playbooks/:id': {
	GET: playbooksAPI.get,
	PUT: playbooksAPI.update
},
```

**Step 5: Run tests**

Run: `bun test src/api/playbooks.test.ts`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/api/playbooks.ts src/api/playbooks.test.ts src/index.ts
git commit -m "feat: add PUT /api/playbooks/:id endpoint

- Updates playbook name and description
- Validates user has access to playbook's team"
```

---

### Task 5: Playbook API - Delete Endpoint

**Files:**
- Modify: `src/api/playbooks.ts`
- Modify: `src/api/playbooks.test.ts`
- Modify: `src/index.ts`

**Step 1: Write failing test**

Add to `src/api/playbooks.test.ts`:

```typescript
test('DELETE /api/playbooks/:id deletes playbook', async () => {
	const pb = await playbookRepo.create({
		team_id: testTeamId,
		name: 'To Delete',
		created_by: testUserId
	})

	const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
		method: 'DELETE',
		headers: {
			Cookie: `session=${testSession}`
		}
	})

	expect(response.status).toBe(204)

	// Verify deleted
	const deleted = await playbookRepo.findById(pb.id)
	expect(deleted).toBeNull()
})

test('DELETE /api/playbooks/:id requires team membership', async () => {
	const otherUser = await userRepo.create({
		email: 'other@example.com',
		name: 'Other',
		password_hash: 'hash'
	})
	const otherTeam = await teamRepo.create({ name: 'Other Team' })
	await teamRepo.addMember({
		team_id: otherTeam.id,
		user_id: otherUser.id,
		role: 'owner'
	})

	const pb = await playbookRepo.create({
		team_id: otherTeam.id,
		name: 'Protected',
		created_by: otherUser.id
	})

	const response = await fetch(`http://localhost:3000/api/playbooks/${pb.id}`, {
		method: 'DELETE',
		headers: {
			Cookie: `session=${testSession}`
		}
	})

	expect(response.status).toBe(403)

	// Verify NOT deleted
	const exists = await playbookRepo.findById(pb.id)
	expect(exists).not.toBeNull()

	// Cleanup
	await db`DELETE FROM playbooks WHERE id = ${pb.id}`
	await db`DELETE FROM team_members WHERE team_id = ${otherTeam.id}`
	await db`DELETE FROM teams WHERE id = ${otherTeam.id}`
	await db`DELETE FROM users WHERE id = ${otherUser.id}`
})
```

**Step 2: Run test**

Run: `bun test src/api/playbooks.test.ts`
Expected: FAIL

**Step 3: Implement delete endpoint**

Modify `src/api/playbooks.ts`:

```typescript
export const playbooksAPI = {
	// ... existing methods

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.id)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		const playbook = await playbookRepo.findById(playbookId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}

		// Check user has access
		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === playbook.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		await playbookRepo.delete(playbookId)

		return new Response(null, { status: 204 })
	}
}
```

**Step 4: Add route**

Modify `src/index.ts`:

```typescript
'/api/playbooks/:id': {
	GET: playbooksAPI.get,
	PUT: playbooksAPI.update,
	DELETE: playbooksAPI.delete
},
```

**Step 5: Run tests**

Run: `bun test src/api/playbooks.test.ts`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/api/playbooks.ts src/api/playbooks.test.ts src/index.ts
git commit -m "feat: add DELETE /api/playbooks/:id endpoint

- Deletes playbook by ID
- Validates user has access to playbook's team
- Returns 204 No Content on success"
```

---

### Task 6: Team API - List User Teams

**Files:**
- Create: `src/api/teams.ts`
- Create: `src/api/teams.test.ts`
- Modify: `src/index.ts`

**Step 1: Write failing test**

Create `src/api/teams.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { UserRepository } from '../db/repositories/UserRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { SessionRepository } from '../db/repositories/SessionRepository'

describe('Teams API', () => {
	let userRepo: UserRepository
	let teamRepo: TeamRepository
	let sessionRepo: SessionRepository
	let testUserId: number
	let testSession: string

	beforeEach(async () => {
		userRepo = new UserRepository()
		teamRepo = new TeamRepository()
		sessionRepo = new SessionRepository()

		const user = await userRepo.create({
			email: 'test@example.com',
			name: 'Test User',
			password_hash: 'hash'
		})
		testUserId = user.id

		const session = await sessionRepo.create(testUserId)
		testSession = session.token
	})

	afterEach(async () => {
		await db`DELETE FROM team_members WHERE user_id = ${testUserId}`
		await db`DELETE FROM teams WHERE id IN (
			SELECT team_id FROM team_members WHERE user_id = ${testUserId}
		)`
		await db`DELETE FROM sessions WHERE user_id = ${testUserId}`
		await db`DELETE FROM users WHERE id = ${testUserId}`
	})

	test('GET /api/teams returns user teams', async () => {
		// Create teams
		const team1 = await teamRepo.create({ name: 'Team 1' })
		const team2 = await teamRepo.create({ name: 'Team 2' })

		await teamRepo.addMember({
			team_id: team1.id,
			user_id: testUserId,
			role: 'owner'
		})
		await teamRepo.addMember({
			team_id: team2.id,
			user_id: testUserId,
			role: 'editor'
		})

		const response = await fetch('http://localhost:3000/api/teams', {
			headers: {
				Cookie: `session=${testSession}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.teams).toBeArray()
		expect(data.teams.length).toBe(2)
	})
})
```

**Step 2: Run test**

Run: `bun test src/api/teams.test.ts`
Expected: FAIL

**Step 3: Implement teams list endpoint**

Create `src/api/teams.ts`:

```typescript
import { SessionRepository } from '../db/repositories/SessionRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'

const sessionRepo = new SessionRepository()
const teamRepo = new TeamRepository()

async function getSessionUser(req: Request) {
	const cookie = req.headers.get('Cookie')
	if (!cookie) return null

	const sessionMatch = cookie.match(/session=([^;]+)/)
	if (!sessionMatch) return null

	const session = await sessionRepo.findByToken(sessionMatch[1])
	if (!session) return null

	return session.user_id
}

export const teamsAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teams = await teamRepo.getUserTeams(userId)
		return Response.json({ teams })
	}
}
```

**Step 4: Add route**

Modify `src/index.ts`:

```typescript
import { teamsAPI } from './api/teams'

// Add route:
'/api/teams': {
	GET: teamsAPI.list
},
```

**Step 5: Run tests**

Run: `bun test src/api/teams.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/api/teams.ts src/api/teams.test.ts src/index.ts
git commit -m "feat: add GET /api/teams endpoint

- Returns all teams user belongs to
- Requires authentication"
```

---

## Phase 2: Context Layer

### Task 7: Extend ThemeContext

**Files:**
- Modify: `src/contexts/ThemeContext.tsx`
- Create: `src/contexts/ThemeContext.test.tsx`

**Step 1: Write failing test**

Create `src/contexts/ThemeContext.test.tsx`:

```typescript
import { describe, test, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'
import { act } from 'react'

function TestComponent() {
	const {
		theme,
		setTheme,
		positionNaming,
		setPositionNaming,
		fieldLevel,
		setFieldLevel
	} = useTheme()

	return (
		<div>
			<div data-testid="theme">{theme}</div>
			<div data-testid="position-naming">{positionNaming}</div>
			<div data-testid="field-level">{fieldLevel}</div>
			<button onClick={() => setTheme('dark')}>Set Dark</button>
			<button onClick={() => setPositionNaming('modern')}>Set Modern</button>
			<button onClick={() => setFieldLevel('college')}>Set College</button>
		</div>
	)
}

describe('ThemeContext', () => {
	test('provides default values', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		expect(screen.getByTestId('theme').textContent).toBe('light')
		expect(screen.getByTestId('position-naming').textContent).toBe('traditional')
		expect(screen.getByTestId('field-level').textContent).toBe('college')
	})

	test('allows updating theme', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		act(() => {
			screen.getByText('Set Dark').click()
		})

		expect(screen.getByTestId('theme').textContent).toBe('dark')
	})

	test('allows updating position naming', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		act(() => {
			screen.getByText('Set Modern').click()
		})

		expect(screen.getByTestId('position-naming').textContent).toBe('modern')
	})

	test('allows updating field level', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		act(() => {
			screen.getByText('Set College').click()
		})

		expect(screen.getByTestId('field-level').textContent).toBe('college')
	})
})
```

**Step 2: Run test**

Run: `bun test src/contexts/ThemeContext.test.tsx`
Expected: FAIL

**Step 3: Extend ThemeContext**

Modify `src/contexts/ThemeContext.tsx`:

```typescript
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type Theme = 'light' | 'dark'
type PositionNaming = 'traditional' | 'modern' | 'numeric'
type FieldLevel = 'high-school' | 'college' | 'pro'

interface ThemeContextType {
	theme: Theme
	setTheme: (theme: Theme) => void
	positionNaming: PositionNaming
	setPositionNaming: (naming: PositionNaming) => void
	fieldLevel: FieldLevel
	setFieldLevel: (level: FieldLevel) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getStoredValue<T>(key: string, defaultValue: T): T {
	if (typeof window === 'undefined') return defaultValue
	const stored = localStorage.getItem(key)
	return stored ? (JSON.parse(stored) as T) : defaultValue
}

function storeValue<T>(key: string, value: T): void {
	if (typeof window !== 'undefined') {
		localStorage.setItem(key, JSON.stringify(value))
	}
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() =>
		getStoredValue('theme', 'light')
	)
	const [positionNaming, setPositionNamingState] = useState<PositionNaming>(() =>
		getStoredValue('positionNaming', 'traditional')
	)
	const [fieldLevel, setFieldLevelState] = useState<FieldLevel>(() =>
		getStoredValue('fieldLevel', 'college')
	)

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme)
		storeValue('theme', newTheme)
	}

	const setPositionNaming = (naming: PositionNaming) => {
		setPositionNamingState(naming)
		storeValue('positionNaming', naming)
	}

	const setFieldLevel = (level: FieldLevel) => {
		setFieldLevelState(level)
		storeValue('fieldLevel', level)
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

**Step 4: Run tests**

Run: `bun test src/contexts/ThemeContext.test.tsx`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/contexts/ThemeContext.tsx src/contexts/ThemeContext.test.tsx
git commit -m "feat: extend ThemeContext with position naming and field level

- Add positionNaming: traditional, modern, numeric
- Add fieldLevel: high-school, college, pro
- Persist settings to localStorage
- Include test coverage"
```

---

### Task 8: Create TeamContext

**Files:**
- Create: `src/contexts/TeamContext.tsx`
- Create: `src/contexts/TeamContext.test.tsx`

**Step 1: Write failing test**

Create `src/contexts/TeamContext.test.tsx`:

```typescript
import { describe, test, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { TeamProvider, useTeam } from './TeamContext'
import { act } from 'react'

// Mock fetch
global.fetch = async (url: string) => {
	if (url.includes('/api/teams')) {
		return {
			ok: true,
			status: 200,
			json: async () => ({
				teams: [
					{ id: 1, name: 'Team 1', created_at: new Date(), updated_at: new Date() },
					{ id: 2, name: 'Team 2', created_at: new Date(), updated_at: new Date() }
				]
			})
		} as Response
	}
	return { ok: false, status: 404 } as Response
}

function TestComponent() {
	const { teams, currentTeamId, isLoading, switchTeam } = useTeam()

	if (isLoading) return <div>Loading...</div>

	return (
		<div>
			<div data-testid="team-count">{teams.length}</div>
			<div data-testid="current-team">{currentTeamId}</div>
			{teams.map(team => (
				<button key={team.id} onClick={() => switchTeam(team.id)}>
					{team.name}
				</button>
			))}
		</div>
	)
}

describe('TeamContext', () => {
	test('fetches and provides teams', async () => {
		render(
			<TeamProvider>
				<TestComponent />
			</TeamProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('team-count').textContent).toBe('2')
		})
	})

	test('allows switching teams', async () => {
		render(
			<TeamProvider>
				<TestComponent />
			</TeamProvider>
		)

		await waitFor(() => {
			expect(screen.getByText('Team 1')).toBeDefined()
		})

		act(() => {
			screen.getByText('Team 2').click()
		})

		expect(screen.getByTestId('current-team').textContent).toBe('2')
	})
})
```

**Step 2: Run test**

Run: `bun test src/contexts/TeamContext.test.tsx`
Expected: FAIL (TeamContext doesn't exist)

**Step 3: Implement TeamContext**

Create `src/contexts/TeamContext.tsx`:

```typescript
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { Team } from '../db/types'

interface TeamContextType {
	teams: Team[]
	currentTeamId: number | null
	isLoading: boolean
	error: string | null
	fetchTeams: () => Promise<void>
	switchTeam: (teamId: number) => void
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
	const [teams, setTeams] = useState<Team[]>([])
	const [currentTeamId, setCurrentTeamId] = useState<number | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchTeams = async () => {
		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/teams')

			if (!response.ok) {
				throw new Error('Failed to fetch teams')
			}

			const data = await response.json()
			setTeams(data.teams)

			// Set first team as current if none selected
			if (data.teams.length > 0 && !currentTeamId) {
				setCurrentTeamId(data.teams[0].id)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setIsLoading(false)
		}
	}

	const switchTeam = (teamId: number) => {
		setCurrentTeamId(teamId)
	}

	useEffect(() => {
		fetchTeams()
	}, [])

	return (
		<TeamContext.Provider
			value={{
				teams,
				currentTeamId,
				isLoading,
				error,
				fetchTeams,
				switchTeam
			}}
		>
			{children}
		</TeamContext.Provider>
	)
}

export function useTeam() {
	const context = useContext(TeamContext)
	if (context === undefined) {
		throw new Error('useTeam must be used within a TeamProvider')
	}
	return context
}
```

**Step 4: Run tests**

Run: `bun test src/contexts/TeamContext.test.tsx`
Expected: All tests PASS

**Step 5: Add TeamProvider to App**

Modify `src/App.tsx`:

```typescript
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { TeamProvider } from './contexts/TeamContext'
import { routes } from './router/routes'
import './index.css'

const router = createBrowserRouter(routes)

export default function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<TeamProvider>
					<RouterProvider router={router} />
				</TeamProvider>
			</AuthProvider>
		</ThemeProvider>
	)
}
```

**Step 6: Commit**

```bash
git add src/contexts/TeamContext.tsx src/contexts/TeamContext.test.tsx src/App.tsx
git commit -m "feat: add TeamContext for team management

- Fetches user's teams on mount
- Tracks current team selection
- Provides switchTeam function
- Includes loading and error states"
```

---

### Task 9: Create PlaybookContext

**Files:**
- Create: `src/contexts/PlaybookContext.tsx`
- Create: `src/contexts/PlaybookContext.test.tsx`

**Step 1: Write failing test**

Create `src/contexts/PlaybookContext.test.tsx`:

```typescript
import { describe, test, expect } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { PlaybookProvider, usePlaybook } from './PlaybookContext'
import { TeamProvider } from './TeamContext'
import { act } from 'react'

// Mock fetch
let mockPlaybooks = [
	{
		id: 1,
		team_id: 1,
		name: 'Playbook 1',
		description: null,
		created_by: 1,
		created_at: new Date(),
		updated_at: new Date()
	}
]

global.fetch = async (url: string, options?: any) => {
	if (url.includes('/api/teams')) {
		return {
			ok: true,
			json: async () => ({
				teams: [{ id: 1, name: 'Team 1' }]
			})
		} as Response
	}

	if (url.includes('/api/playbooks') && options?.method === 'POST') {
		const body = await options.body
		const data = JSON.parse(body)
		const newPlaybook = {
			id: Date.now(),
			...data,
			created_by: 1,
			created_at: new Date(),
			updated_at: new Date()
		}
		mockPlaybooks.push(newPlaybook)
		return {
			ok: true,
			status: 201,
			json: async () => ({ playbook: newPlaybook })
		} as Response
	}

	if (url.includes('/api/playbooks')) {
		return {
			ok: true,
			json: async () => ({ playbooks: mockPlaybooks })
		} as Response
	}

	return { ok: false, status: 404 } as Response
}

function TestComponent() {
	const { playbooks, isLoading, createPlaybook } = usePlaybook()

	if (isLoading) return <div>Loading...</div>

	return (
		<div>
			<div data-testid="playbook-count">{playbooks.length}</div>
			<button onClick={() => createPlaybook('New Playbook', 1)}>
				Create
			</button>
		</div>
	)
}

describe('PlaybookContext', () => {
	test('fetches and provides playbooks', async () => {
		render(
			<TeamProvider>
				<PlaybookProvider>
					<TestComponent />
				</PlaybookProvider>
			</TeamProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('playbook-count').textContent).toBe('1')
		})
	})

	test('allows creating playbooks', async () => {
		render(
			<TeamProvider>
				<PlaybookProvider>
					<TestComponent />
				</PlaybookProvider>
			</TeamProvider>
		)

		await waitFor(() => {
			expect(screen.getByText('Create')).toBeDefined()
		})

		await act(async () => {
			screen.getByText('Create').click()
		})

		await waitFor(() => {
			expect(screen.getByTestId('playbook-count').textContent).toBe('2')
		})
	})
})
```

**Step 2: Run test**

Run: `bun test src/contexts/PlaybookContext.test.tsx`
Expected: FAIL

**Step 3: Implement PlaybookContext**

Create `src/contexts/PlaybookContext.tsx`:

```typescript
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { Playbook } from '../db/types'
import { useTeam } from './TeamContext'

interface PlaybookContextType {
	playbooks: Playbook[]
	isLoading: boolean
	error: string | null
	fetchPlaybooks: () => Promise<void>
	createPlaybook: (name: string, teamId: number, description?: string) => Promise<Playbook>
	updatePlaybook: (id: number, updates: { name?: string; description?: string }) => Promise<void>
	deletePlaybook: (id: number) => Promise<void>
}

const PlaybookContext = createContext<PlaybookContextType | undefined>(undefined)

export function PlaybookProvider({ children }: { children: ReactNode }) {
	const { currentTeamId } = useTeam()
	const [playbooks, setPlaybooks] = useState<Playbook[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchPlaybooks = async () => {
		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/playbooks')

			if (!response.ok) {
				throw new Error('Failed to fetch playbooks')
			}

			const data = await response.json()
			setPlaybooks(data.playbooks)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setIsLoading(false)
		}
	}

	const createPlaybook = async (
		name: string,
		teamId: number,
		description?: string
	): Promise<Playbook> => {
		const response = await fetch('/api/playbooks', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ team_id: teamId, name, description })
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to create playbook')
		}

		const data = await response.json()
		setPlaybooks([data.playbook, ...playbooks])
		return data.playbook
	}

	const updatePlaybook = async (
		id: number,
		updates: { name?: string; description?: string }
	) => {
		const response = await fetch(`/api/playbooks/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updates)
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to update playbook')
		}

		const data = await response.json()
		setPlaybooks(playbooks.map(pb => (pb.id === id ? data.playbook : pb)))
	}

	const deletePlaybook = async (id: number) => {
		const response = await fetch(`/api/playbooks/${id}`, {
			method: 'DELETE'
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to delete playbook')
		}

		setPlaybooks(playbooks.filter(pb => pb.id !== id))
	}

	useEffect(() => {
		if (currentTeamId) {
			fetchPlaybooks()
		}
	}, [currentTeamId])

	return (
		<PlaybookContext.Provider
			value={{
				playbooks,
				isLoading,
				error,
				fetchPlaybooks,
				createPlaybook,
				updatePlaybook,
				deletePlaybook
			}}
		>
			{children}
		</PlaybookContext.Provider>
	)
}

export function usePlaybook() {
	const context = useContext(PlaybookContext)
	if (context === undefined) {
		throw new Error('usePlaybook must be used within a PlaybookProvider')
	}
	return context
}
```

**Step 4: Run tests**

Run: `bun test src/contexts/PlaybookContext.test.tsx`
Expected: All tests PASS

**Step 5: Add PlaybookProvider to App**

Modify `src/App.tsx`:

```typescript
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { TeamProvider } from './contexts/TeamContext'
import { PlaybookProvider } from './contexts/PlaybookContext'
import { routes } from './router/routes'
import './index.css'

const router = createBrowserRouter(routes)

export default function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<TeamProvider>
					<PlaybookProvider>
						<RouterProvider router={router} />
					</PlaybookProvider>
				</TeamProvider>
			</AuthProvider>
		</ThemeProvider>
	)
}
```

**Step 6: Commit**

```bash
git add src/contexts/PlaybookContext.tsx src/contexts/PlaybookContext.test.tsx src/App.tsx
git commit -m "feat: add PlaybookContext for playbook management

- Fetches playbooks when team changes
- Provides CRUD operations (create, update, delete)
- Manages loading and error states
- Refetches on team switch"
```

---

## Phase 3: Component Migration

### Task 10: Migrate Modal Component

**Files:**
- Create: `src/components/playbook-manager/Modal.tsx`

**Step 1: Copy and update Modal component**

Create `src/components/playbook-manager/Modal.tsx`:

```typescript
import { ReactNode } from 'react'

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	title: string
	children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold">{title}</h2>
					<button
						onClick={onClose}
						className="text-muted-foreground hover:text-foreground"
					>
						✕
					</button>
				</div>
				{children}
			</div>
		</div>
	)
}
```

**Step 2: Commit**

```bash
git add src/components/playbook-manager/Modal.tsx
git commit -m "feat: add Modal component for playbook manager

- Simple modal with backdrop
- Close on backdrop click or X button
- Accepts title and children"
```

---

### Task 11: Migrate Sidebar Component

**Files:**
- Create: `src/components/playbook-manager/Sidebar.tsx`

**Step 1: Copy and update Sidebar**

Create `src/components/playbook-manager/Sidebar.tsx`:

```typescript
interface SidebarProps {
	activeSection: string
	onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
	const sections = [
		{ id: 'all', label: 'All Playbooks', icon: '📚' },
		{ id: 'shared', label: 'Shared with me', icon: '👥' },
		{ id: 'starred', label: 'Starred', icon: '⭐' },
		{ id: 'recent', label: 'Recent', icon: '🕒' },
		{ id: 'trash', label: 'Trash', icon: '🗑️' }
	]

	return (
		<div className="w-64 bg-background border-r border-border h-full">
			<div className="p-4">
				<h2 className="text-lg font-semibold mb-4">Playbooks</h2>
				<nav className="space-y-1">
					{sections.map(section => (
						<button
							key={section.id}
							onClick={() => onSectionChange(section.id)}
							className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
								activeSection === section.id
									? 'bg-accent text-accent-foreground'
									: 'hover:bg-accent/50'
							}`}
						>
							<span className="mr-2">{section.icon}</span>
							{section.label}
						</button>
					))}
				</nav>
			</div>
		</div>
	)
}
```

**Step 2: Commit**

```bash
git add src/components/playbook-manager/Sidebar.tsx
git commit -m "feat: add Sidebar component for playbook manager

- Navigation sections (all, shared, starred, recent, trash)
- Active section highlighting
- Clean, simple design"
```

---

### Task 12: Migrate PlaybookCard Component

**Files:**
- Create: `src/components/playbook-manager/PlaybookCard.tsx`

**Step 1: Create PlaybookCard with real data**

Create `src/components/playbook-manager/PlaybookCard.tsx`:

```typescript
import { useNavigate } from 'react-router-dom'
import type { Playbook } from '../../db/types'

interface PlaybookCardProps {
	playbook: Playbook
	onRename: (id: number, newName: string) => void
	onDelete: (id: number) => void
	onDuplicate: (id: number) => void
}

export function PlaybookCard({
	playbook,
	onRename,
	onDelete,
	onDuplicate
}: PlaybookCardProps) {
	const navigate = useNavigate()

	const handleOpen = () => {
		navigate(`/playbooks/${playbook.id}`)
	}

	const handleRenameClick = () => {
		const newName = prompt('Rename playbook:', playbook.name)
		if (newName?.trim()) {
			onRename(playbook.id, newName.trim())
		}
	}

	const handleDeleteClick = () => {
		if (confirm(`Delete "${playbook.name}"?`)) {
			onDelete(playbook.id)
		}
	}

	return (
		<div
			className="p-4 bg-card rounded-lg border border-border hover:border-accent transition-colors cursor-pointer"
			onClick={handleOpen}
		>
			<div className="flex items-start justify-between mb-2">
				<h3 className="font-semibold truncate">{playbook.name}</h3>
				<button
					onClick={e => {
						e.stopPropagation()
					}}
					className="text-muted-foreground hover:text-foreground"
				>
					⋮
				</button>
			</div>

			{playbook.description && (
				<p className="text-sm text-muted-foreground mb-2 truncate">
					{playbook.description}
				</p>
			)}

			<div className="text-xs text-muted-foreground">
				Updated {new Date(playbook.updated_at).toLocaleDateString()}
			</div>

			{/* Context menu - simplified for now */}
			<div className="hidden group-hover:block">
				<button onClick={handleRenameClick}>Rename</button>
				<button onClick={() => onDuplicate(playbook.id)}>Duplicate</button>
				<button onClick={handleDeleteClick}>Delete</button>
			</div>
		</div>
	)
}
```

**Step 2: Commit**

```bash
git add src/components/playbook-manager/PlaybookCard.tsx
git commit -m "feat: add PlaybookCard component

- Displays playbook name, description, updated date
- Opens playbook on click using React Router
- Context menu for rename, duplicate, delete
- Uses real Playbook type from database"
```

---

## Phase 4: Page Integration

### Task 13: Update PlaybookManagerPage

**Files:**
- Modify: `src/pages/PlaybookManagerPage.tsx`

**Step 1: Replace placeholder with full implementation**

Modify `src/pages/PlaybookManagerPage.tsx`:

```typescript
import { useState, useMemo } from 'react'
import { usePlaybook } from '../contexts/PlaybookContext'
import { useTeam } from '../contexts/TeamContext'
import { Sidebar } from '../components/playbook-manager/Sidebar'
import { PlaybookCard } from '../components/playbook-manager/PlaybookCard'
import { Modal } from '../components/playbook-manager/Modal'

export function PlaybookManagerPage() {
	const { playbooks, isLoading, error, createPlaybook, updatePlaybook, deletePlaybook } = usePlaybook()
	const { currentTeamId } = useTeam()

	const [activeSection, setActiveSection] = useState('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [showNewPlaybookModal, setShowNewPlaybookModal] = useState(false)
	const [newPlaybookName, setNewPlaybookName] = useState('')

	const filteredPlaybooks = useMemo(() => {
		return playbooks.filter(pb =>
			pb.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	}, [playbooks, searchQuery])

	const handleCreatePlaybook = async () => {
		if (newPlaybookName.trim() && currentTeamId) {
			await createPlaybook(newPlaybookName, currentTeamId)
			setNewPlaybookName('')
			setShowNewPlaybookModal(false)
		}
	}

	const handleRename = async (id: number, newName: string) => {
		await updatePlaybook(id, { name: newName })
	}

	const handleDelete = async (id: number) => {
		await deletePlaybook(id)
	}

	const handleDuplicate = async (id: number) => {
		const original = playbooks.find(pb => pb.id === id)
		if (original && currentTeamId) {
			await createPlaybook(
				`${original.name} (Copy)`,
				currentTeamId,
				original.description || undefined
			)
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-lg">Loading playbooks...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-red-500">Error: {error}</div>
			</div>
		)
	}

	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar
				activeSection={activeSection}
				onSectionChange={setActiveSection}
			/>

			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Toolbar */}
				<div className="border-b border-border p-4">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold">My Playbooks</h1>
						<button
							onClick={() => setShowNewPlaybookModal(true)}
							className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
						>
							New Playbook
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{filteredPlaybooks.map(playbook => (
							<PlaybookCard
								key={playbook.id}
								playbook={playbook}
								onRename={handleRename}
								onDelete={handleDelete}
								onDuplicate={handleDuplicate}
							/>
						))}
					</div>

					{filteredPlaybooks.length === 0 && (
						<div className="text-center py-16">
							<p className="text-muted-foreground mb-4">No playbooks found</p>
							<button
								onClick={() => setShowNewPlaybookModal(true)}
								className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg"
							>
								Create Your First Playbook
							</button>
						</div>
					)}
				</div>
			</div>

			{/* New Playbook Modal */}
			<Modal
				isOpen={showNewPlaybookModal}
				onClose={() => {
					setShowNewPlaybookModal(false)
					setNewPlaybookName('')
				}}
				title="Create New Playbook"
			>
				<div className="space-y-4">
					<div>
						<label className="block mb-2">Playbook Name</label>
						<input
							type="text"
							value={newPlaybookName}
							onChange={e => setNewPlaybookName(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') {
									handleCreatePlaybook()
								}
							}}
							placeholder="Enter playbook name..."
							className="w-full px-4 py-2.5 bg-input rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20"
							autoFocus
						/>
					</div>
					<div className="flex justify-end gap-2">
						<button
							onClick={() => {
								setShowNewPlaybookModal(false)
								setNewPlaybookName('')
							}}
							className="px-4 py-2 hover:bg-accent rounded-lg"
						>
							Cancel
						</button>
						<button
							onClick={handleCreatePlaybook}
							disabled={!newPlaybookName.trim()}
							className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
						>
							Create
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
```

**Step 2: Test the page**

Run: `bun dev`
Navigate to: `http://localhost:3000/playbooks`
Expected: Page loads, shows playbooks, can create/delete

**Step 3: Commit**

```bash
git add src/pages/PlaybookManagerPage.tsx
git commit -m "feat: implement full PlaybookManagerPage

- Displays playbooks in grid layout
- Create, rename, delete, duplicate functionality
- Sidebar navigation
- New playbook modal
- Loading and error states
- Uses PlaybookContext and TeamContext"
```

---

## Phase 5: Polish & Testing

### Task 14: Integration Test

**Files:**
- Create: `tests/integration/playbook-manager.test.tsx`

**Step 1: Write integration test**

Create `tests/integration/playbook-manager.test.tsx`:

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { serve } from 'bun'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../src/App'

describe('Playbook Manager Integration', () => {
	let server: any

	beforeAll(() => {
		// Start test server
		server = serve({
			port: 3001,
			// ... server config
		})
	})

	afterAll(() => {
		server.stop()
	})

	test('user can create and view playbook', async () => {
		render(
			<MemoryRouter initialEntries={['/playbooks']}>
				<App />
			</MemoryRouter>
		)

		// Wait for playbooks to load
		await waitFor(() => {
			expect(screen.getByText('My Playbooks')).toBeDefined()
		})

		// Click new playbook
		const newButton = screen.getByText('New Playbook')
		newButton.click()

		// Enter name
		const input = screen.getByPlaceholderText('Enter playbook name...')
		input.value = 'Test Playbook'

		// Submit
		const createButton = screen.getByText('Create')
		createButton.click()

		// Verify appears in list
		await waitFor(() => {
			expect(screen.getByText('Test Playbook')).toBeDefined()
		})
	})
})
```

**Step 2: Run test**

Run: `bun test tests/integration/playbook-manager.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/integration/playbook-manager.test.tsx
git commit -m "test: add integration tests for playbook manager

- Test create playbook flow
- Test viewing playbooks
- Uses in-process test server"
```

---

### Task 15: Code Quality Review

**Files:**
- All migrated components

**Step 1: Review against mako-review.md**

Check all files for:
- No semicolons
- Single quotes
- Function keyword for named functions
- No commented code
- Lines ≤80 chars
- Tabs not spaces

**Step 2: Fix any violations**

Make necessary adjustments to meet standards.

**Step 3: Commit**

```bash
git add .
git commit -m "refactor: apply mako-review.md code quality standards

- Remove semicolons
- Convert to single quotes
- Use function keyword for named functions
- Ensure line length ≤80 chars"
```

---

### Task 16: Delete Figma Folder

**Files:**
- Delete: `playbookManagerFigma/`

**Step 1: Verify all components migrated**

Check that all needed components are in `src/components/playbook-manager/`

**Step 2: Delete Figma folder**

```bash
rm -rf playbookManagerFigma
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove playbookManagerFigma folder

All components have been migrated to src/components/playbook-manager/
with proper integration into the app architecture."
```

---

## Success Criteria

Implementation is complete when:

- ✅ All API endpoints functional and tested
- ✅ Contexts provide proper state management
- ✅ PlaybookManagerPage displays and manages playbooks
- ✅ Navigation works with React Router
- ✅ All code meets mako-review.md standards
- ✅ Integration tests pass
- ✅ No console errors
- ✅ playbookManagerFigma/ folder deleted

## Skills Reference

- @superpowers:test-driven-development - Use throughout for TDD workflow
- @superpowers:systematic-debugging - If bugs encountered
- @superpowers:verification-before-completion - Before marking complete
- @superpowers:requesting-code-review - Before final merge
