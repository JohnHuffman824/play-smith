---
name: playsmith-core-architecture
overview: Full-stack Bun + React implementation plan for the Play Smith whiteboard, including frontend layout, domain model, Bun-based API, and persistence architecture for plays and playbooks.
todos:
  - id: task-1-app-shell
    content: Implement Play Smith app shell layout with sidebar and whiteboard area and verify with frontend layout tests
    status: pending
  - id: task-2-field-component
    content: Extract and integrate reusable college-spec `FootballField` component inside a `FieldContainer` with tests
    status: pending
    dependencies:
      - task-1-app-shell
  - id: task-3-domain-models
    content: Create shared domain model and serialization helpers for plays, playbooks, users, and components with round-trip tests
    status: pending
    dependencies:
      - task-1-app-shell
  - id: task-4-http-api
    content: Add Bun HTTP API server and basic plays/playbooks routes with handler unit tests
    status: pending
    dependencies:
      - task-3-domain-models
  - id: task-5-persistence-layer
    content: Implement SQLite-backed repositories for plays and playbooks and wire routes to use them, with repository tests
    status: pending
    dependencies:
      - task-4-http-api
  - id: task-6-whiteboard-state
    content: Implement frontend whiteboard state management for components and integrate with layout, with state tests
    status: pending
    dependencies:
      - task-2-field-component
      - task-3-domain-models
  - id: task-7-toolbar-tools
    content: Create toolbar tools skeleton (Select, Add Player, Draw, Route, Add Component) and tools store, with tests
    status: pending
    dependencies:
      - task-6-whiteboard-state
  - id: task-8-api-client
    content: Implement API client to connect frontend whiteboard state to Bun API for saving/loading plays, with client tests
    status: pending
    dependencies:
      - task-4-http-api
      - task-6-whiteboard-state
  - id: task-9-mysql-support
    content: Add MySQL-backed repositories, env-driven DB selection, and documentation for running against self-hosted or cloud MySQL, deferring detailed cloud migration steps
    status: pending
    dependencies:
      - task-5-persistence-layer
  - id: task-10-playbook-manager
    content: Implement playbook manager UI, playbook CRUD API, and integrate with sidebar navigation
    status: pending
    dependencies:
      - task-5-persistence-layer
      - task-8-api-client
  - id: task-11-login-auth
    content: Implement login page, user persistence, and basic email/password authentication wired through Bun API and guarded frontend routing
    status: pending
    dependencies:
      - task-5-persistence-layer
      - task-9-mysql-support
---

# Play Smith Core Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack Bun + React application for designing American football plays and playbooks, with a college-accurate field whiteboard, tool-based editing, a playbook manager, and a Bun-backed API with authentication and persistence.

**Architecture:** A single-page React frontend (served by Bun) renders the field and whiteboard, backed by a Bun HTTP JSON API that manages plays, playbooks, and reusable components. Domain models are shared between frontend and backend via a common TypeScript module, with a repository layer abstracting the underlying database so we can start with SQLite via `bun:sqlite` and then add a swappable MySQL-backed implementation that works against either a self-hosted MySQL instance (e.g., on your own PC server) or a cloud-hosted database like Amazon RDS. An authenticated user/session layer gates access to personal playbooks and plays, and the playbook manager UI provides a Drive-style overview and organization surface on top of the same API, while full cloud migration is explicitly deferred to a later deployment-focused phase.

**Tech Stack:** Bun, TypeScript, React, Tailwind CSS, `bun:sqlite` (for initial persistence), MySQL (for production-ready persistence), Bun test runner (`bun:test`) for both backend and frontend unit tests, and basic REST-style JSON APIs.

---

### Task 1: Replace demo UI with Play Smith shell

**Files:**

- Modify: `src/App.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Toolbar.tsx`
- Test: `tests/frontend/layout/app-shell.test.tsx`

**Step 1: Write failing layout test**

Use `bun:test` with a simple React DOM environment (e.g., `@testing-library/react` if desired) to assert that the root layout renders a sidebar and a whiteboard area.

```ts
import { test, expect } from 'bun:test'
import React from 'react'
import { render } from '@testing-library/react'
import { AppShell } from '../../../src/components/layout/AppShell'

test('AppShell shows sidebar and whiteboard', () => {
	const { getByTestId } = render(<AppShell />)

	expect(getByTestId('playsmith-sidebar')).toBeTruthy()
	expect(getByTestId('playsmith-whiteboard')).toBeTruthy()
})
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/frontend/layout/app-shell.test.tsx`

Expected: FAIL because `AppShell` and the `data-testid` hooks do not exist yet.

**Step 3: Implement minimal layout components**

Create `AppShell`, `Sidebar`, and `Toolbar` components using Tailwind for layout and the required `data-testid` attributes.

```tsx
// src/components/layout/AppShell.tsx
import React from 'react'
import { Sidebar } from './Sidebar'

export function AppShell() {
	return (
		<div className='flex h-screen bg-[#f2f2f2]'>
			<aside
				className='w-64 border-r bg-white/90'
				data-testid='playsmith-sidebar'
			>
				<Sidebar />
			</aside>
			<main
				className='flex-1 relative overflow-hidden'
				data-testid='playsmith-whiteboard'
			>
				{/* Whiteboard and field will go here */}
			</main>
		</div>
	)
}
```

Wire `AppShell` into `src/App.tsx` so that it renders only the new shell.

**Step 4: Run tests and verify they pass**

Run: `bun test tests/frontend/layout/app-shell.test.tsx`

Expected: PASS with both sidebar and whiteboard test IDs found.

---

### Task 2: Integrate accurate college field as reusable component

**Files:**

- Modify: `TestFootballField.tsx` (if needed for extraction)
- Create: `src/components/field/FootballField.tsx`
- Create: `src/components/field/FieldContainer.tsx`
- Test: `tests/frontend/field/football-field.test.tsx`

**Step 1: Write failing field rendering test**

Create a test that renders the new `FieldContainer` inside the whiteboard area and asserts that the SVG background uses `#f2f2f2` and contains hash marks.

```ts
import { test, expect } from 'bun:test'
import React from 'react'
import { render } from '@testing-library/react'
import { FieldContainer } from '../../../src/components/field/FieldContainer'

test('FieldContainer renders football field SVG', () => {
	const { container } = render(<FieldContainer />)
	const svg = container.querySelector('svg')

	expect(svg).toBeTruthy()
	expect(svg?.getAttribute('style') ?? '').toContain('#f2f2f2')
})
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/frontend/field/football-field.test.tsx`

Expected: FAIL because `FieldContainer` and the new `FootballField` do not exist.

**Step 3: Extract and adapt `FootballField`**

Move the existing `FootballField` logic from `TestFootballField.tsx` into `src/components/field/FootballField.tsx`, preserving the college-spec dimensions and background color. Wrap it in `FieldContainer` that fits within the `AppShell` whiteboard area.

```tsx
// src/components/field/FieldContainer.tsx
import React from 'react'
import { FootballField } from './FootballField'

export function FieldContainer() {
	return (
		<div className='w-full h-full flex items-center justify-center'>
			<FootballField />
		</div>
	)
}
```

Update `AppShell` to render `FieldContainer` inside the whiteboard `main` area.

**Step 4: Run tests and verify they pass**

Run: `bun test tests/frontend/field/football-field.test.tsx`

Expected: PASS with SVG present and styled.

---

### Task 3: Define shared domain models and component types

**Files:**

- Create: `src/domain/types.ts`
- Create: `src/domain/serialization.ts`
- Test: `tests/domain/types.test.ts`

**Step 1: Write failing domain model tests**

Define the core types: `PlayComponent`, `PlayerComponent`, `DrawComponent`, `RouteComponent`, `Play`, and `Playbook`. Add tests that verify basic invariants (e.g., IDs, type tags, serialization round-trips).

```ts
import { test, expect } from 'bun:test'
import {
	createEmptyPlay,
	serializePlay,
	deserializePlay
} from '../../src/domain/serialization'

test('createEmptyPlay creates play with no components', () => {
	const play = createEmptyPlay('Test')

	expect(play.name).toBe('Test')
	expect(play.components.length).toBe(0)
})

test('serialize and deserialize play are inverse', () => {
	const play = createEmptyPlay('Test')
	const json = serializePlay(play)
	const restored = deserializePlay(json)

	expect(restored.name).toBe(play.name)
	expect(restored.components.length).toBe(play.components.length)
})
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/domain/types.test.ts`

Expected: FAIL because domain functions and types do not exist.

**Step 3: Implement minimal domain models**

Create `src/domain/types.ts` with shared interfaces and type tags, and `src/domain/serialization.ts` with simple JSON-based serialization helpers.

```ts
// src/domain/types.ts
export type ComponentKind = 'player' | 'draw' | 'route'

export interface BaseComponent {
	id: string
	kind: ComponentKind
	x: number
	y: number
}

export interface PlayerComponent extends BaseComponent {
	kind: 'player'
	label: string
}

export interface DrawComponent extends BaseComponent {
	kind: 'draw'
	points: { x: number; y: number }[]
}

export interface RouteComponent extends BaseComponent {
	kind: 'route'
	routeKey: string
}

export interface Play {
	id: string
	name: string
	components: BaseComponent[]
}

export interface Playbook {
	id: string
	name: string
	playIds: string[]
	ownerUserId?: string
}

export interface UserAccount {
	id: string
	email: string
	passwordHash: string
}
```
```ts
// src/domain/serialization.ts
import { Play } from './types'

export function createEmptyPlay(name: string): Play {
	return {
		id: crypto.randomUUID(),
		name,
		components: []
	}
}

export function serializePlay(play: Play): string {
	return JSON.stringify(play)
}

export function deserializePlay(json: string): Play {
	return JSON.parse(json) as Play
}
```

**Step 4: Run tests and verify they pass**

Run: `bun test tests/domain/types.test.ts`

Expected: PASS with round-trip and empty play tests succeeding.

---

### Task 4: Introduce Bun HTTP API server and routing

**Files:**

- Modify: `index.ts`
- Create: `src/server/http.ts`
- Create: `src/server/routes/plays.ts`
- Create: `src/server/routes/playbooks.ts`
- Test: `tests/server/http/plays-routes.test.ts`

**Step 1: Write failing HTTP route tests**

Write tests using `bun:test` that call the route handlers directly (without spinning up the whole server) and assert correct status codes and JSON shapes for basic `GET /api/plays` and `POST /api/plays` operations.

```ts
import { test, expect } from 'bun:test'
import { handleGetPlays, handleCreatePlay } from '../../../src/server/routes/plays'

test('handleGetPlays returns empty list initially', async () => {
	const res = await handleGetPlays()
	const body = await res.json()

	expect(res.status).toBe(200)
	expect(Array.isArray(body)).toBe(true)
})

test('handleCreatePlay returns created play', async () => {
	const reqBody = { name: 'Test Play' }
	const res = await handleCreatePlay(reqBody)
	const body = await res.json()

	expect(res.status).toBe(201)
	expect(body.name).toBe('Test Play')
})
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/server/http/plays-routes.test.ts`

Expected: FAIL because route handlers do not exist.

**Step 3: Implement minimal HTTP server and handlers**

Create minimal route handler functions that currently use an in-memory store (to be replaced by a repository in the next task) and integrate them into `Bun.serve` in `index.ts`.

```ts
// src/server/routes/plays.ts
import { Play } from '../../domain/types'
import { createEmptyPlay } from '../../domain/serialization'

const plays: Play[] = []

export async function handleGetPlays(): Promise<Response> {
	return new Response(JSON.stringify(plays), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	})
}

export async function handleCreatePlay(body: { name: string }): Promise<Response> {
	const play = createEmptyPlay(body.name)
	plays.push(play)

	return new Response(JSON.stringify(play), {
		status: 201,
		headers: { 'Content-Type': 'application/json' }
	})
}
```

In `src/server/http.ts`, add a router that dispatches `Request` objects to these handlers based on `method` and `url`, and call it from `index.ts` via `Bun.serve`.

**Step 4: Run tests and verify they pass**

Run: `bun test tests/server/http/plays-routes.test.ts`

Expected: PASS with correct status codes and shapes.

---

### Task 5: Add repository and persistence layer with `bun:sqlite`

**Files:**

- Create: `src/server/db/connection.ts`
- Create: `src/server/db/schema.sql`
- Create: `src/server/db/plays-repository.sqlite.ts`
- Create: `src/server/db/playbooks-repository.sqlite.ts`
- Modify: `src/server/routes/plays.ts`
- Modify: `src/server/routes/playbooks.ts`
- Test: `tests/server/db/plays-repository-sqlite.test.ts`

**Step 1: Write failing repository tests (SQLite)**

Define tests that use a temporary SQLite database (via `bun:sqlite`) to verify basic CRUD operations on plays and playbooks.

```ts
import { test, expect } from 'bun:test'
import { createTestDb } from '../../../src/server/db/connection'
import { PlaysRepositorySqlite } from '../../../src/server/db/plays-repository.sqlite'

test('PlaysRepositorySqlite can create and load a play', () => {
	const db = createTestDb()
	const repo = new PlaysRepositorySqlite(db)
	const created = repo.createPlay('Test')
	const loaded = repo.getPlayById(created.id)

	expect(loaded?.name).toBe('Test')
})
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/server/db/plays-repository-sqlite.test.ts`

Expected: FAIL because repository and DB helpers do not exist.

**Step 3: Implement minimal SQLite connection and schema**

Use `bun:sqlite` to open a database file (e.g., `playsmith.db`) and create tables for `plays`, `playbooks`, and `components` using a simple schema that keeps column names and types compatible with both SQLite and MySQL (e.g., `TEXT` vs `VARCHAR`, `INTEGER` primary keys, and JSON blobs stored as text).

```ts
// src/server/db/connection.ts
import { Database } from 'bun:sqlite'
import { readFileSync } from 'node:fs'

export function createDb(): Database {
	const db = new Database('playsmith.db')
	const schema = readFileSync('src/server/db/schema.sql', 'utf8')
	db.exec(schema)
	return db
}

export function createTestDb(): Database {
	const db = new Database(':memory:')
	const schema = readFileSync('src/server/db/schema.sql', 'utf8')
	db.exec(schema)
	return db
}
```

Create `schema.sql` with straightforward `CREATE TABLE` statements for the three core tables, using SQL that has clear analogues in MySQL (no SQLite-only extensions).

**Step 4: Implement SQLite repository classes and wire routes**

Implement `PlaysRepositorySqlite` and `PlaybooksRepositorySqlite` with methods like `createPlay`, `getPlayById`, `listPlays`, `createPlaybook`, and `listPlaybooks`. Update `handleGetPlays` / `handleCreatePlay` and the playbook routes to use the repositories instead of in-memory arrays.

**Step 5: Run tests and verify they pass**

Run: `bun test tests/server/db/plays-repository-sqlite.test.ts`

Expected: PASS with repository operations working against SQLite.

---

### Task 6: Frontend whiteboard state management and selection

**Files:**

- Create: `src/state/whiteboard-store.ts`
- Modify: `src/components/field/FieldContainer.tsx`
- Modify: `src/components/layout/AppShell.tsx`
- Test: `tests/frontend/state/whiteboard-store.test.ts`

**Step 1: Write failing store tests**

Create tests for a simple store or reducer that manages components on the current play: adding a player at the center, selecting a component, and clearing selection.

```ts
import { test, expect } from 'bun:test'
import {
	createWhiteboardStore,
	WhiteboardState
} from '../../src/state/whiteboard-store'

test('addPlayer adds a player component', () => {
	const store = createWhiteboardStore()
	store.addPlayer({ x: 50, y: 50, label: 'X' })
	const state: WhiteboardState = store.getState()

	expect(state.components.length).toBe(1)
	expect(state.components[0].kind).toBe('player')
})
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/frontend/state/whiteboard-store.test.ts`

Expected: FAIL because the store does not exist.

**Step 3: Implement minimal whiteboard store**

Implement a simple custom store (or Zustand-like pattern) that keeps state in memory and exposes methods `addPlayer`, `setSelectedComponent`, and `clearSelection`. Inject this store into `AppShell` via React context or hook.

```ts
// src/state/whiteboard-store.ts
import { PlayerComponent, Play } from '../domain/types'

export interface WhiteboardState {
	play: Play | null
	components: PlayerComponent[]
	selectedId: string | null
}

export function createWhiteboardStore() {
	let state: WhiteboardState = {
		play: null,
		components: [],
		selectedId: null
	}

	return {
		getState() {
			return state
		},
		addPlayer(input: { x: number; y: number; label: string }) {
			const comp: PlayerComponent = {
				id: crypto.randomUUID(),
				kind: 'player',
				x: input.x,
				y: input.y,
				label: input.label
			}
			state = {
				...state,
				components: [...state.components, comp]
			}
		}
	}
}
```

Connect this store to the whiteboard UI so that later tools (Select, Draw, Route) can interact with it.

**Step 4: Run tests and verify they pass**

Run: `bun test tests/frontend/state/whiteboard-store.test.ts`

Expected: PASS with store operations mutating state as expected.

---

### Task 7: Implement toolbar tools skeletons (Select, Add Player, Draw, Route, Add Component)

**Files:**

- Modify: `src/components/layout/Toolbar.tsx`
- Create: `src/components/tools/SelectTool.tsx`
- Create: `src/components/tools/AddPlayerTool.tsx`
- Create: `src/components/tools/DrawTool.tsx`
- Create: `src/components/tools/RouteTool.tsx`
- Create: `src/components/tools/AddComponentTool.tsx`
- Create: `src/state/tools-store.ts`
- Test: `tests/frontend/tools/tools-store.test.ts`

**Step 1: Write failing tools store tests**

Define a simple tools store that tracks the active tool and ensures only one is active at a time.

```ts
import { test, expect } from 'bun:test'
import { createToolsStore } from '../../src/state/tools-store'

test('only one active tool at a time', () => {
	const store = createToolsStore()
	store.setActive('add-player')
	store.setActive('draw')
	const state = store.getState()

	expect(state.activeTool).toBe('draw')
})
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/frontend/tools/tools-store.test.ts`

Expected: FAIL because tools store does not exist.

**Step 3: Implement tools store and toolbar components**

Create `createToolsStore` with an `activeTool` string and `setActive` method. Implement `Toolbar` to render buttons with icons (placeholder text or simple Unicode for now) that call `setActive` when clicked. Each tool component can be a thin wrapper around specific behavior (e.g., `AddPlayerTool` calls into `whiteboard-store.addPlayer` when user clicks on the field), but for this stage you can wire only the activation and visible highlighting.

```ts
// src/state/tools-store.ts
export type ToolId = 'select' | 'add-player' | 'draw' | 'route' | 'add-component'

export interface ToolsState {
	activeTool: ToolId
}

export function createToolsStore() {
	let state: ToolsState = { activeTool: 'select' }

	return {
		getState() {
			return state
		},
		setActive(tool: ToolId) {
			state = { activeTool: tool }
		}
	}
}
```

Update `Toolbar` to use this store (via context or props) and render buttons for the five tools, with CSS class changes based on `activeTool`.

**Step 4: Run tests and verify they pass**

Run: `bun test tests/frontend/tools/tools-store.test.ts`

Expected: PASS with `activeTool` switching correctly.

---

### Task 8: Connect frontend to backend API for saving and loading plays

**Files:**

- Create: `src/api/client.ts`
- Modify: `src/state/whiteboard-store.ts`
- Modify: `src/server/routes/plays.ts`
- Test: `tests/frontend/api/client.test.ts`

**Step 1: Write failing API client tests**

Add tests that mock `fetch` at a low level (or call handlers directly) and ensure `saveCurrentPlay` and `loadPlay` functions in `src/api/client.ts` return `Play` objects shaped according to the domain models.

```ts
import { test, expect } from 'bun:test'
import { makeApiClient } from '../../src/api/client'

test('makeApiClient can save and load a play', async () => {
	const client = makeApiClient('/api')
	const created = await client.savePlay({ name: 'Test' })
	const loaded = await client.getPlay(created.id)

	expect(loaded?.name).toBe('Test')
})
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/frontend/api/client.test.ts`

Expected: FAIL because `makeApiClient` and endpoints do not exist.

**Step 3: Implement API client and wire to routes**

Implement `makeApiClient` using `fetch` and the Bun server routes created earlier. Use JSON serialization helpers from `src/domain/serialization.ts` to keep shapes consistent.

```ts
// src/api/client.ts
import { Play } from '../domain/types'

export function makeApiClient(baseUrl: string) {
	return {
		async savePlay(input: { name: string }): Promise<Play> {
			const res = await fetch(`${baseUrl}/plays`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input)
			})
			return (await res.json()) as Play
		},
		async getPlay(id: string): Promise<Play | null> {
			const res = await fetch(`${baseUrl}/plays/${id}`)
			if (res.status !== 200) return null
			return (await res.json()) as Play
		}
	}
}
```

Update `whiteboard-store` to use this client when persisting or loading the current play, and adjust the server routes to support `/api/plays/:id` in addition to the collection endpoints.

**Step 4: Run tests and verify they pass**

Run: `bun test tests/frontend/api/client.test.ts`

Expected: PASS with save-and-load behavior working via the API client.

---

### Task 9: Implement MySQL support and cloud-ready database configuration

**Files:**

- Create: `src/server/db/plays-repository.mysql.ts`
- Create: `src/server/db/playbooks-repository.mysql.ts`
- Create: `src/server/db/mysql-connection.ts`
- Modify: `src/server/db/connection.ts`
- Modify: `src/server/db/schema.sql` (if needed for MySQL compatibility notes)
- Modify: `src/server/routes/plays.ts`
- Modify: `src/server/routes/playbooks.ts`
- Modify: `README.md` (documenting DB configuration and deployment expectations)
- Test: `tests/server/db/plays-repository-mysql.test.ts`

**Step 1: Write failing repository tests (MySQL abstraction)**

Add tests that exercise a database-agnostic repository interface using a fake or in-memory MySQL client abstraction so that the same tests can be run against SQLite and MySQL implementations by swapping the concrete class. Focus tests on behavior (CRUD semantics) rather than specific SQL dialect.

```ts
import { test, expect } from 'bun:test'
import { PlaysRepositorySqlite } from '../../../src/server/db/plays-repository.sqlite'
import { PlaysRepositoryMysql } from '../../../src/server/db/plays-repository.mysql'
import { createTestDb } from '../../../src/server/db/connection'

function exerciseRepo(factory: () => { create: (name: string) => any; load: (id: string) => any }) {
	const repo = factory()
	const created = repo.create('Test MySQL')
	const loaded = repo.load(created.id)
	expect(loaded?.name).toBe('Test MySQL')
}

test('SQLite implementation satisfies repository contract', () => {
	exerciseRepo(() => {
		const db = createTestDb()
		const sqlite = new PlaysRepositorySqlite(db)
		return {
			create: (name: string) => sqlite.createPlay(name),
			load: (id: string) => sqlite.getPlayById(id)
		}
	})
})

// For MySQL, tests can be structured to run only when env vars indicate a test DB is available.
test('MySQL implementation satisfies repository contract (if configured)', () => {
	if (!process.env.MYSQL_TEST_URL) return
	const mysqlRepo = new PlaysRepositoryMysql({ url: process.env.MYSQL_TEST_URL })
	const created = mysqlRepo.createPlay('Test MySQL')
	const loaded = mysqlRepo.getPlayById(created.id)
	expect(loaded?.name).toBe('Test MySQL')
})
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/server/db/plays-repository-mysql.test.ts`

Expected: FAIL because MySQL repositories and connection helpers do not exist.

**Step 3: Implement MySQL connection helpers and repositories**

Implement `mysql-connection.ts` with a thin wrapper over a MySQL client library that reads configuration from environment variables suitable for both self-hosted MySQL and cloud providers (e.g., `DB_ENGINE=mysql`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). The wrapper should expose a minimal query interface compatible with the repository needs.

```ts
// src/server/db/mysql-connection.ts
export interface MysqlConfig {
	host: string
	port: number
	user: string
	password: string
	database: string
}

export function createMysqlConfigFromEnv(): MysqlConfig {
	return {
		host: process.env.DB_HOST ?? 'localhost',
		port: Number(process.env.DB_PORT ?? '3306'),
		user: process.env.DB_USER ?? 'playsmith',
		password: process.env.DB_PASSWORD ?? '',
		database: process.env.DB_NAME ?? 'playsmith'
	}
}
```

Create `PlaysRepositoryMysql` and `PlaybooksRepositoryMysql` using SQL that is valid for MySQL, mirroring the semantics of the SQLite repositories but using parameterized queries and appropriate column types. Ensure that schema differences between SQLite and MySQL are documented in comments or a separate `schema.mysql.sql` if necessary.

**Step 4: Make repository selection environment-driven and deployment-flexible**

Update `connection.ts` and the route wiring so the application can select the repository implementation based on an environment variable such as `DB_ENGINE` (`sqlite` by default, `mysql` when pointed at a self-hosted or cloud MySQL instance). This keeps the core application code unchanged whether you point it at a MySQL server running on your own PC, a LAN server, or a future Amazon RDS instance.

**Step 5: Update documentation for MySQL deployment (self-hosted first, cloud later)**

In `README.md`, add a section describing how to:

- Run with local SQLite (default, no extra configuration).
- Switch to MySQL on a self-hosted server (for example, a spare PC on your network) by setting `DB_ENGINE=mysql` and the necessary `DB_*` environment variables pointing at that machine.
- Optionally, later switch those same environment variables to point at a managed MySQL service such as Amazon RDS, with the understanding that RDS provisioning and networking is a separate operational task and intentionally out of scope for this implementation plan.

**Step 6: Run tests and verify they pass**

Run: `bun test tests/server/db/plays-repository-mysql.test.ts`

Expected: PASS for SQLite-backed contract tests; MySQL tests pass when a test MySQL instance (self-hosted or cloud) is configured via environment variables.

---

### Task 10: Implement playbook manager UI and API integration

**Files:**

- Create: `src/components/playbooks/PlaybookGrid.tsx`
- Create: `src/components/playbooks/PlaybookListItem.tsx`
- Create: `src/components/playbooks/PlaybookManagerPage.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/api/client.ts`
- Modify: `src/server/routes/playbooks.ts`
- Test: `tests/frontend/playbooks/playbook-manager.test.tsx`
- Test: `tests/server/http/playbooks-routes.test.ts`

**Step 1: Write failing backend tests for playbooks**

Create tests for `GET /api/playbooks` and `POST /api/playbooks` that call playbook route handlers directly and assert that they return collections of playbooks and can create new ones.

```ts
import { test, expect } from 'bun:test'
import {
	handleGetPlaybooks,
	handleCreatePlaybook
} from '../../../src/server/routes/playbooks'

test('handleGetPlaybooks returns empty list initially', async () => {
	const res = await handleGetPlaybooks()
	const body = await res.json()

	expect(res.status).toBe(200)
	expect(Array.isArray(body)).toBe(true)
})

test('handleCreatePlaybook returns created playbook', async () => {
	const res = await handleCreatePlaybook({ name: 'Install 1' })
	const body = await res.json()

	expect(res.status).toBe(201)
	expect(body.name).toBe('Install 1')
})
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/server/http/playbooks-routes.test.ts`

Expected: FAIL because handlers may not exist or may not use repositories yet.

**Step 3: Implement playbook routes using repositories**

Wire `PlaybooksRepositorySqlite` / `PlaybooksRepositoryMysql` into `playbooks.ts` to back `GET`, `POST`, and later `DELETE` / `PATCH` operations. Ensure each playbook can reference associated play IDs and an optional owner user ID.

**Step 4: Write failing frontend tests for playbook manager UI**

Add a test that renders `PlaybookManagerPage` and asserts that it shows an empty-state message when there are no playbooks, and renders cards/grid items when the API returns data (mock the API client for this test).

```ts
import { test, expect } from 'bun:test'
import React from 'react'
import { render } from '@testing-library/react'
import { PlaybookManagerPage } from '../../../src/components/playbooks/PlaybookManagerPage'

test('PlaybookManagerPage shows empty state when no playbooks', () => {
	const { getByText } = render(
		<PlaybookManagerPage
			playbooks={[]}
			onCreatePlaybook={() => {}}
		/>
	)

	expect(getByText('No playbooks yet')).toBeTruthy()
})
```

**Step 5: Implement playbook manager components and sidebar navigation**

Implement `PlaybookGrid` and `PlaybookListItem` to render a Drive-inspired grid/list of playbooks with name and metadata. Implement `PlaybookManagerPage` as a top-level page component that can be navigated to from the sidebar (e.g., a "Playbooks" nav item). Update `Sidebar` to include a link or button that switches the main content between the whiteboard and the playbook manager.

**Step 6: Wire UI to API client**

Extend `src/api/client.ts` with `listPlaybooks` and `createPlaybook` functions that talk to the playbook routes. In `PlaybookManagerPage`, call these functions on mount / on create to populate and update the grid.

**Step 7: Run tests and verify they pass**

Run:

- `bun test tests/server/http/playbooks-routes.test.ts`
- `bun test tests/frontend/playbooks/playbook-manager.test.tsx`

Expected: PASS, with both backend and frontend behaviors satisfying tests.

---

### Task 11: Implement login page and basic authentication

**Files:**

- Create: `src/server/routes/auth.ts`
- Create: `src/server/auth/session-store.ts`
- Create: `src/server/db/users-repository.sqlite.ts`
- Create: `src/server/db/users-repository.mysql.ts`
- Modify: `src/server/db/schema.sql`
- Modify: `src/server/db/mysql-connection.ts`
- Modify: `src/server/http.ts`
- Create: `src/components/auth/LoginPage.tsx`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/api/client.ts`
- Test: `tests/server/http/auth-routes.test.ts`
- Test: `tests/frontend/auth/login-page.test.tsx`

**Step 1: Write failing backend auth tests**

Create tests that hit `login` and `logout` route handlers directly, asserting that valid credentials return a `Set-Cookie` header and `401` is returned for invalid credentials.

```ts
import { test, expect } from 'bun:test'
import { handleLogin } from '../../../src/server/routes/auth'

test('handleLogin rejects invalid credentials', async () => {
	const res = await handleLogin({ email: 'x@example.com', password: 'bad' })
	expect(res.status).toBe(401)
})
```

Add a second test that uses a known test user inserted via `UsersRepositorySqlite` and expects a `200` plus an auth cookie for valid credentials.

**Step 2: Run tests to verify they fail**

Run: `bun test tests/server/http/auth-routes.test.ts`

Expected: FAIL because auth routes and user repositories do not exist.

**Step 3: Implement user repository, schema, and session store**

Update `schema.sql` to create a `users` table with `id`, `email` (unique), and `password_hash`. Implement `UsersRepositorySqlite` / `UsersRepositoryMysql` to create and lookup users.

Create `session-store.ts` to manage simple server-side sessions keyed by secure random tokens stored in cookies (e.g., `playsmith_session`). The store maps tokens to user IDs and expiry times in memory for now; later this can be moved into the database or a cache.

**Step 4: Implement auth routes and middleware-style helpers**

Implement `auth.ts` with handlers for:

- `POST /api/auth/login` (validate credentials, create session, set cookie).
- `POST /api/auth/logout` (delete session, clear cookie).
- `GET /api/auth/me` (return basic user info if session is valid).

Add helper functions in `http.ts` to extract the current user from the session for routes that require authentication (e.g., playbook and play operations that should be per-user).

**Step 5: Write failing frontend login tests**

Write a test for `LoginPage` that asserts it renders email/password fields and calls a passed-in `onLogin` handler when the form is submitted.

```ts
import { test, expect } from 'bun:test'
import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { LoginPage } from '../../../src/components/auth/LoginPage'

test('LoginPage submits credentials', () => {
	let submitted = false
	const { getByLabelText, getByText } = render(
		<LoginPage
			onLogin={() => {
				submitted = true
			}}
		/>
	)

	fireEvent.change(getByLabelText('Email'), {
		target: { value: 'coach@example.com' }
	})
	fireEvent.change(getByLabelText('Password'), {
		target: { value: 'secret' }
	})
	fireEvent.click(getByText('Log in'))

	expect(submitted).toBe(true)
})
```

**Step 6: Implement login page and API client auth helpers**

Implement `LoginPage` with a centered card-style form (aligned with the overall Tailwind design) that accepts email/password, shows inline validation errors, and calls an injected `onLogin` prop. Extend `api/client.ts` with `login`, `logout`, and `getCurrentUser` functions that hit the auth routes.

Update `AppShell` (or a higher-level router) to:

- Show `LoginPage` when no user is logged in.
- Show the main application (whiteboard and playbook manager) when a session is present.

**Step 7: Run tests and verify they pass**

Run:

- `bun test tests/server/http/auth-routes.test.ts`
- `bun test tests/frontend/auth/login-page.test.tsx`

Expected: PASS with auth routes and login page behavior meeting the tests.

---

## Remember

- Keep methods and functions short and focused, following the repository coding standards.
- Use TDD: always write a failing test first, then minimal implementation, then refactor.
- Keep all code TypeScript-first, with shared domain modules used by both client and server.
- Use Bun tooling for development (`bun --hot index.ts`) and testing (`bun test`).
- This plan should be saved as `docs/plans/2025-12-08-playsmith-core-architecture.md` in the repository when executed.