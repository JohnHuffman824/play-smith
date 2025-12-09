# Database Architecture Phase 1: Core Setup

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up MySQL database with core tables (users, teams, playbooks, plays) and migration system.

**Architecture:** Use Bun.sql for MySQL connections, implement a simple migration system with numbered SQL files, create type-safe repository pattern for database access.

**Tech Stack:** Bun runtime, Bun.sql (MySQL), TypeScript, bun:test

---

## Prerequisites

**Before starting:**
- MySQL server running locally or accessible remotely
- Database created: `CREATE DATABASE playsmith;`
- Database user with permissions

**Environment setup:**
Create `.env` file with:
```
DATABASE_URL=mysql://user:password@localhost:3306/playsmith
```

---

## Task 1: Database Connection Setup

**Files:**
- Create: `src/db/connection.ts`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Add .env.example file**

```bash
echo "DATABASE_URL=mysql://user:password@localhost:3306/playsmith" > .env.example
```

**Step 2: Ensure .env is gitignored**

Add to `.gitignore` if not present:
```
.env
```

**Step 3: Write database connection module**

Create `src/db/connection.ts`:
```typescript
import { sql } from 'bun';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is required');
}

export const db = sql(process.env.DATABASE_URL);

export async function testConnection(): Promise<boolean> {
	try {
		await db`SELECT 1`;
		return true;
	} catch (error) {
		console.error('Database connection failed:', error);
		return false;
	}
}
```

**Step 4: Test the connection**

Create `src/db/connection.test.ts`:
```typescript
import { describe, test, expect } from 'bun:test';
import { testConnection } from './connection';

describe('Database Connection', () => {
	test('should connect to database', async () => {
		const connected = await testConnection();
		expect(connected).toBe(true);
	});
});
```

**Step 5: Run the test**

```bash
bun test src/db/connection.test.ts
```

Expected: PASS (assumes MySQL is running and DATABASE_URL is set)

**Step 6: Commit**

```bash
git add .env.example .gitignore src/db/connection.ts src/db/connection.test.ts
git commit -m "feat: add MySQL database connection

- Add Bun.sql connection module
- Add connection test
- Add .env.example for configuration"
```

---

## Task 2: Migration System

**Files:**
- Create: `src/db/migrate.ts`
- Create: `src/db/migrations/.gitkeep`
- Create: `package.json` (modify scripts)

**Step 1: Create migrations directory**

```bash
mkdir -p src/db/migrations
touch src/db/migrations/.gitkeep
```

**Step 2: Write migration runner**

Create `src/db/migrate.ts`:
```typescript
import { db } from './connection';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface Migration {
	id: number;
	name: string;
	applied_at: Date;
}

async function createMigrationsTable(): Promise<void> {
	await db`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id INT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`;
}

async function getAppliedMigrations(): Promise<Set<number>> {
	const rows = await db<Migration[]>`
		SELECT id FROM schema_migrations ORDER BY id
	`;
	return new Set(rows.map(r => r.id));
}

async function getMigrationFiles(): Promise<Array<{ id: number; name: string; path: string }>> {
	const migrationsDir = join(import.meta.dir, 'migrations');
	const files = await readdir(migrationsDir);

	return files
		.filter(f => f.endsWith('.sql'))
		.map(f => {
			const match = f.match(/^(\d+)_(.+)\.sql$/);
			if (!match) throw new Error(`Invalid migration filename: ${f}`);
			return {
				id: parseInt(match[1], 10),
				name: match[2],
				path: join(migrationsDir, f),
			};
		})
		.sort((a, b) => a.id - b.id);
}

export async function migrate(): Promise<void> {
	await createMigrationsTable();

	const applied = await getAppliedMigrations();
	const migrations = await getMigrationFiles();

	for (const migration of migrations) {
		if (applied.has(migration.id)) {
			console.log(`✓ Migration ${migration.id}_${migration.name} already applied`);
			continue;
		}

		console.log(`→ Applying migration ${migration.id}_${migration.name}...`);
		const sql = await readFile(migration.path, 'utf-8');

		try {
			// Execute migration
			await db.unsafe(sql);

			// Record migration
			await db`
				INSERT INTO schema_migrations (id, name)
				VALUES (${migration.id}, ${migration.name})
			`;

			console.log(`✓ Applied migration ${migration.id}_${migration.name}`);
		} catch (error) {
			console.error(`✗ Failed to apply migration ${migration.id}_${migration.name}:`, error);
			throw error;
		}
	}

	console.log('✓ All migrations applied successfully');
}

// Run migrations if called directly
if (import.meta.main) {
	migrate()
		.then(() => process.exit(0))
		.catch(err => {
			console.error(err);
			process.exit(1);
		});
}
```

**Step 3: Add migration script to package.json**

Add to `scripts` section:
```json
"migrate": "bun src/db/migrate.ts"
```

**Step 4: Test migration system (empty)**

```bash
bun run migrate
```

Expected output:
```
✓ All migrations applied successfully
```

**Step 5: Commit**

```bash
git add src/db/migrate.ts src/db/migrations/.gitkeep package.json
git commit -m "feat: add database migration system

- Add migration runner with numbered SQL files
- Track applied migrations in schema_migrations table
- Add 'bun run migrate' script"
```

---

## Task 3: Initial Schema - Users & Teams

**Files:**
- Create: `src/db/migrations/001_create_users_teams.sql`

**Step 1: Write migration for users and teams**

Create `src/db/migrations/001_create_users_teams.sql`:
```sql
-- Users table
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Teams table
CREATE TABLE teams (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Team members (many-to-many with roles)
CREATE TABLE team_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('owner', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_team_user (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);
```

**Step 2: Run migration**

```bash
bun run migrate
```

Expected output:
```
→ Applying migration 001_create_users_teams...
✓ Applied migration 001_create_users_teams
✓ All migrations applied successfully
```

**Step 3: Verify tables exist**

```bash
bun -e "import {db} from './src/db/connection'; const tables = await db\`SHOW TABLES\`; console.log(tables)"
```

Expected: Shows `users`, `teams`, `team_members`, `schema_migrations`

**Step 4: Commit**

```bash
git add src/db/migrations/001_create_users_teams.sql
git commit -m "feat: add users and teams schema

- Create users table with email/name
- Create teams table
- Create team_members junction with role-based permissions"
```

---

## Task 4: Playbooks & Sharing Schema

**Files:**
- Create: `src/db/migrations/002_create_playbooks.sql`

**Step 1: Write playbooks migration**

Create `src/db/migrations/002_create_playbooks.sql`:
```sql
-- Playbooks table
CREATE TABLE playbooks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_team (team_id),
    INDEX idx_created_by (created_by)
);

-- Playbook sharing (team-to-team)
CREATE TABLE playbook_shares (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    playbook_id BIGINT UNSIGNED NOT NULL,
    shared_with_team_id BIGINT UNSIGNED NOT NULL,
    permission ENUM('view', 'edit') NOT NULL DEFAULT 'view',
    shared_by BIGINT UNSIGNED NOT NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_playbook_team (playbook_id, shared_with_team_id),
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id),
    INDEX idx_shared_team (shared_with_team_id)
);
```

**Step 2: Run migration**

```bash
bun run migrate
```

Expected output:
```
✓ Migration 001_create_users_teams already applied
→ Applying migration 002_create_playbooks...
✓ Applied migration 002_create_playbooks
✓ All migrations applied successfully
```

**Step 3: Commit**

```bash
git add src/db/migrations/002_create_playbooks.sql
git commit -m "feat: add playbooks schema with sharing

- Create playbooks table with team ownership
- Add playbook_shares for team-to-team sharing
- Support view/edit permissions"
```

---

## Task 5: Plays Schema

**Files:**
- Create: `src/db/migrations/003_create_plays.sql`

**Step 1: Write plays migration**

Create `src/db/migrations/003_create_plays.sql`:
```sql
-- Plays table
CREATE TABLE plays (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    playbook_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255),
    formation_id BIGINT UNSIGNED,
    personnel_id BIGINT UNSIGNED,
    defensive_formation_id BIGINT UNSIGNED,
    hash_position ENUM('left', 'middle', 'right') NOT NULL DEFAULT 'middle',
    notes TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_playbook (playbook_id)
);

-- Note: formation_id, personnel_id, defensive_formation_id FKs will be added
-- in Phase 2 when we create those tables
```

**Step 2: Run migration**

```bash
bun run migrate
```

Expected output:
```
✓ Migration 001_create_users_teams already applied
✓ Migration 002_create_playbooks already applied
→ Applying migration 003_create_plays...
✓ Applied migration 003_create_plays
✓ All migrations applied successfully
```

**Step 3: Commit**

```bash
git add src/db/migrations/003_create_plays.sql
git commit -m "feat: add plays schema

- Create plays table with metadata fields
- Link to playbooks
- Support hash positioning and display ordering"
```

---

## Task 6: User Repository (Type-Safe DB Access)

**Files:**
- Create: `src/db/types.ts`
- Create: `src/db/repositories/UserRepository.ts`
- Create: `src/db/repositories/UserRepository.test.ts`

**Step 1: Define database types**

Create `src/db/types.ts`:
```typescript
export interface User {
	id: number;
	email: string;
	name: string;
	created_at: Date;
	updated_at: Date;
}

export interface Team {
	id: number;
	name: string;
	created_at: Date;
	updated_at: Date;
}

export interface TeamMember {
	id: number;
	team_id: number;
	user_id: number;
	role: 'owner' | 'editor' | 'viewer';
	joined_at: Date;
}

export interface Playbook {
	id: number;
	team_id: number;
	name: string;
	description: string | null;
	created_by: number;
	created_at: Date;
	updated_at: Date;
}

export interface Play {
	id: number;
	playbook_id: number;
	name: string | null;
	formation_id: number | null;
	personnel_id: number | null;
	defensive_formation_id: number | null;
	hash_position: 'left' | 'middle' | 'right';
	notes: string | null;
	display_order: number;
	created_by: number;
	created_at: Date;
	updated_at: Date;
}
```

**Step 2: Write UserRepository with TDD - failing test first**

Create `src/db/repositories/UserRepository.test.ts`:
```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { UserRepository } from './UserRepository';
import { db } from '../connection';

describe('UserRepository', () => {
	const repo = new UserRepository();
	let testUserId: number;

	afterAll(async () => {
		// Cleanup
		if (testUserId) {
			await db`DELETE FROM users WHERE id = ${testUserId}`;
		}
	});

	test('create user', async () => {
		const user = await repo.create({
			email: 'test@example.com',
			name: 'Test User',
		});

		expect(user.id).toBeGreaterThan(0);
		expect(user.email).toBe('test@example.com');
		expect(user.name).toBe('Test User');

		testUserId = user.id;
	});

	test('find user by id', async () => {
		const user = await repo.findById(testUserId);

		expect(user).toBeDefined();
		expect(user?.email).toBe('test@example.com');
	});

	test('find user by email', async () => {
		const user = await repo.findByEmail('test@example.com');

		expect(user).toBeDefined();
		expect(user?.id).toBe(testUserId);
	});

	test('find non-existent user returns null', async () => {
		const user = await repo.findById(999999);
		expect(user).toBeNull();
	});
});
```

**Step 3: Run test to see it fail**

```bash
bun test src/db/repositories/UserRepository.test.ts
```

Expected: FAIL with "Cannot find module './UserRepository'"

**Step 4: Implement UserRepository**

Create `src/db/repositories/UserRepository.ts`:
```typescript
import { db } from '../connection';
import type { User } from '../types';

export class UserRepository {
	async create(data: { email: string; name: string }): Promise<User> {
		const [result] = await db<any[]>`
			INSERT INTO users (email, name)
			VALUES (${data.email}, ${data.name})
		`;

		const [user] = await db<User[]>`
			SELECT * FROM users WHERE id = ${result.insertId}
		`;

		return user;
	}

	async findById(id: number): Promise<User | null> {
		const [user] = await db<User[]>`
			SELECT * FROM users WHERE id = ${id}
		`;

		return user || null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const [user] = await db<User[]>`
			SELECT * FROM users WHERE email = ${email}
		`;

		return user || null;
	}

	async list(): Promise<User[]> {
		return await db<User[]>`
			SELECT * FROM users ORDER BY created_at DESC
		`;
	}
}
```

**Step 5: Run test to see it pass**

```bash
bun test src/db/repositories/UserRepository.test.ts
```

Expected: PASS (all 4 tests)

**Step 6: Commit**

```bash
git add src/db/types.ts src/db/repositories/UserRepository.ts src/db/repositories/UserRepository.test.ts
git commit -m "feat: add UserRepository with tests

- Define database types
- Implement CRUD operations for users
- Add comprehensive test coverage"
```

---

## Task 7: Team Repository

**Files:**
- Create: `src/db/repositories/TeamRepository.ts`
- Create: `src/db/repositories/TeamRepository.test.ts`

**Step 1: Write failing test**

Create `src/db/repositories/TeamRepository.test.ts`:
```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { TeamRepository } from './TeamRepository';
import { UserRepository } from './UserRepository';
import { db } from '../connection';

describe('TeamRepository', () => {
	const teamRepo = new TeamRepository();
	const userRepo = new UserRepository();

	let testTeamId: number;
	let testUserId: number;

	beforeAll(async () => {
		// Create test user
		const user = await userRepo.create({
			email: 'team-test@example.com',
			name: 'Team Test User',
		});
		testUserId = user.id;
	});

	afterAll(async () => {
		// Cleanup
		if (testTeamId) {
			await db`DELETE FROM teams WHERE id = ${testTeamId}`;
		}
		if (testUserId) {
			await db`DELETE FROM users WHERE id = ${testUserId}`;
		}
	});

	test('create team', async () => {
		const team = await teamRepo.create({
			name: 'Test Team',
		});

		expect(team.id).toBeGreaterThan(0);
		expect(team.name).toBe('Test Team');

		testTeamId = team.id;
	});

	test('add member to team', async () => {
		const member = await teamRepo.addMember({
			team_id: testTeamId,
			user_id: testUserId,
			role: 'owner',
		});

		expect(member.team_id).toBe(testTeamId);
		expect(member.user_id).toBe(testUserId);
		expect(member.role).toBe('owner');
	});

	test('get team members', async () => {
		const members = await teamRepo.getMembers(testTeamId);

		expect(members.length).toBe(1);
		expect(members[0].user_id).toBe(testUserId);
		expect(members[0].role).toBe('owner');
	});

	test('get user teams', async () => {
		const teams = await teamRepo.getUserTeams(testUserId);

		expect(teams.length).toBeGreaterThan(0);
		expect(teams.some(t => t.id === testTeamId)).toBe(true);
	});
});
```

**Step 2: Run test to see it fail**

```bash
bun test src/db/repositories/TeamRepository.test.ts
```

Expected: FAIL with "Cannot find module './TeamRepository'"

**Step 3: Implement TeamRepository**

Create `src/db/repositories/TeamRepository.ts`:
```typescript
import { db } from '../connection';
import type { Team, TeamMember } from '../types';

export class TeamRepository {
	async create(data: { name: string }): Promise<Team> {
		const [result] = await db<any[]>`
			INSERT INTO teams (name)
			VALUES (${data.name})
		`;

		const [team] = await db<Team[]>`
			SELECT * FROM teams WHERE id = ${result.insertId}
		`;

		return team;
	}

	async findById(id: number): Promise<Team | null> {
		const [team] = await db<Team[]>`
			SELECT * FROM teams WHERE id = ${id}
		`;

		return team || null;
	}

	async addMember(data: {
		team_id: number;
		user_id: number;
		role: 'owner' | 'editor' | 'viewer';
	}): Promise<TeamMember> {
		const [result] = await db<any[]>`
			INSERT INTO team_members (team_id, user_id, role)
			VALUES (${data.team_id}, ${data.user_id}, ${data.role})
		`;

		const [member] = await db<TeamMember[]>`
			SELECT * FROM team_members WHERE id = ${result.insertId}
		`;

		return member;
	}

	async getMembers(teamId: number): Promise<TeamMember[]> {
		return await db<TeamMember[]>`
			SELECT * FROM team_members WHERE team_id = ${teamId}
		`;
	}

	async getUserTeams(userId: number): Promise<Team[]> {
		return await db<Team[]>`
			SELECT t.*
			FROM teams t
			INNER JOIN team_members tm ON t.id = tm.team_id
			WHERE tm.user_id = ${userId}
			ORDER BY tm.joined_at DESC
		`;
	}

	async removeMember(teamId: number, userId: number): Promise<void> {
		await db`
			DELETE FROM team_members
			WHERE team_id = ${teamId} AND user_id = ${userId}
		`;
	}
}
```

**Step 4: Run test to see it pass**

```bash
bun test src/db/repositories/TeamRepository.test.ts
```

Expected: PASS (all 4 tests)

**Step 5: Commit**

```bash
git add src/db/repositories/TeamRepository.ts src/db/repositories/TeamRepository.test.ts
git commit -m "feat: add TeamRepository with tests

- Implement team CRUD operations
- Support team member management
- Add user teams lookup"
```

---

## Task 8: Playbook Repository

**Files:**
- Create: `src/db/repositories/PlaybookRepository.ts`
- Create: `src/db/repositories/PlaybookRepository.test.ts`

**Step 1: Write failing test**

Create `src/db/repositories/PlaybookRepository.test.ts`:
```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { PlaybookRepository } from './PlaybookRepository';
import { TeamRepository } from './TeamRepository';
import { UserRepository } from './UserRepository';
import { db } from '../connection';

describe('PlaybookRepository', () => {
	const playbookRepo = new PlaybookRepository();
	const teamRepo = new TeamRepository();
	const userRepo = new UserRepository();

	let testPlaybookId: number;
	let testTeamId: number;
	let testUserId: number;

	beforeAll(async () => {
		const user = await userRepo.create({
			email: 'playbook-test@example.com',
			name: 'Playbook Test User',
		});
		testUserId = user.id;

		const team = await teamRepo.create({
			name: 'Playbook Test Team',
		});
		testTeamId = team.id;
	});

	afterAll(async () => {
		if (testPlaybookId) {
			await db`DELETE FROM playbooks WHERE id = ${testPlaybookId}`;
		}
		if (testTeamId) {
			await db`DELETE FROM teams WHERE id = ${testTeamId}`;
		}
		if (testUserId) {
			await db`DELETE FROM users WHERE id = ${testUserId}`;
		}
	});

	test('create playbook', async () => {
		const playbook = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Test Playbook',
			description: 'A test playbook',
			created_by: testUserId,
		});

		expect(playbook.id).toBeGreaterThan(0);
		expect(playbook.name).toBe('Test Playbook');
		expect(playbook.team_id).toBe(testTeamId);

		testPlaybookId = playbook.id;
	});

	test('get team playbooks', async () => {
		const playbooks = await playbookRepo.getTeamPlaybooks(testTeamId);

		expect(playbooks.length).toBeGreaterThan(0);
		expect(playbooks[0].id).toBe(testPlaybookId);
	});

	test('update playbook', async () => {
		const updated = await playbookRepo.update(testPlaybookId, {
			name: 'Updated Playbook',
		});

		expect(updated?.name).toBe('Updated Playbook');
	});
});
```

**Step 2: Run test to see it fail**

```bash
bun test src/db/repositories/PlaybookRepository.test.ts
```

Expected: FAIL

**Step 3: Implement PlaybookRepository**

Create `src/db/repositories/PlaybookRepository.ts`:
```typescript
import { db } from '../connection';
import type { Playbook } from '../types';

export class PlaybookRepository {
	async create(data: {
		team_id: number;
		name: string;
		description?: string;
		created_by: number;
	}): Promise<Playbook> {
		const [result] = await db<any[]>`
			INSERT INTO playbooks (team_id, name, description, created_by)
			VALUES (${data.team_id}, ${data.name}, ${data.description || null}, ${data.created_by})
		`;

		const [playbook] = await db<Playbook[]>`
			SELECT * FROM playbooks WHERE id = ${result.insertId}
		`;

		return playbook;
	}

	async findById(id: number): Promise<Playbook | null> {
		const [playbook] = await db<Playbook[]>`
			SELECT * FROM playbooks WHERE id = ${id}
		`;

		return playbook || null;
	}

	async getTeamPlaybooks(teamId: number): Promise<Playbook[]> {
		return await db<Playbook[]>`
			SELECT * FROM playbooks
			WHERE team_id = ${teamId}
			ORDER BY updated_at DESC
		`;
	}

	async update(
		id: number,
		data: Partial<{ name: string; description: string }>
	): Promise<Playbook | null> {
		const updates: string[] = [];
		const values: any[] = [];

		if (data.name !== undefined) {
			updates.push('name = ?');
			values.push(data.name);
		}
		if (data.description !== undefined) {
			updates.push('description = ?');
			values.push(data.description);
		}

		if (updates.length === 0) {
			return this.findById(id);
		}

		values.push(id);
		await db.unsafe(
			`UPDATE playbooks SET ${updates.join(', ')} WHERE id = ?`,
			values
		);

		return this.findById(id);
	}

	async delete(id: number): Promise<void> {
		await db`DELETE FROM playbooks WHERE id = ${id}`;
	}
}
```

**Step 4: Run test to see it pass**

```bash
bun test src/db/repositories/PlaybookRepository.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/db/repositories/PlaybookRepository.ts src/db/repositories/PlaybookRepository.test.ts
git commit -m "feat: add PlaybookRepository with tests

- Implement playbook CRUD operations
- Support team playbook listing
- Add update/delete methods"
```

---

## Task 9: API Endpoints - Users

**Files:**
- Modify: `src/index.ts`
- Create: `src/api/users.ts`

**Step 1: Create users API handler**

Create `src/api/users.ts`:
```typescript
import { UserRepository } from '../db/repositories/UserRepository';

const userRepo = new UserRepository();

export const usersAPI = {
	async GET(req: Request) {
		const users = await userRepo.list();
		return Response.json(users);
	},

	async POST(req: Request) {
		const body = await req.json();

		if (!body.email || !body.name) {
			return Response.json(
				{ error: 'email and name are required' },
				{ status: 400 }
			);
		}

		const user = await userRepo.create({
			email: body.email,
			name: body.name,
		});

		return Response.json(user, { status: 201 });
	},
};

export async function getUserById(req: Request) {
	const id = parseInt(req.params.id, 10);
	const user = await userRepo.findById(id);

	if (!user) {
		return Response.json({ error: 'User not found' }, { status: 404 });
	}

	return Response.json(user);
}
```

**Step 2: Add routes to server**

Modify `src/index.ts`:
```typescript
import { serve } from "bun";
import index from "./index.html";
import { usersAPI, getUserById } from "./api/users";

const server = serve({
  routes: {
    "/*": index,

    "/api/users": usersAPI,
    "/api/users/:id": getUserById,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
```

**Step 3: Test API manually**

Start server:
```bash
bun run dev
```

In another terminal, test endpoints:
```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"api@test.com","name":"API Test User"}'

# Get all users
curl http://localhost:3000/api/users

# Get user by ID
curl http://localhost:3000/api/users/1
```

**Step 4: Commit**

```bash
git add src/api/users.ts src/index.ts
git commit -m "feat: add users API endpoints

- GET /api/users - list all users
- POST /api/users - create user
- GET /api/users/:id - get user by ID"
```

---

## Task 10: Integration Test - Full Workflow

**Files:**
- Create: `tests/integration/playbook-workflow.test.ts`

**Step 1: Write integration test**

Create `tests/integration/playbook-workflow.test.ts`:
```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { UserRepository } from '../../src/db/repositories/UserRepository';
import { TeamRepository } from '../../src/db/repositories/TeamRepository';
import { PlaybookRepository } from '../../src/db/repositories/PlaybookRepository';
import { db } from '../../src/db/connection';

describe('Playbook Workflow Integration', () => {
	const userRepo = new UserRepository();
	const teamRepo = new TeamRepository();
	const playbookRepo = new PlaybookRepository();

	let userId: number;
	let teamId: number;
	let playbookId: number;

	afterAll(async () => {
		// Cleanup in reverse order due to foreign keys
		if (playbookId) {
			await db`DELETE FROM playbooks WHERE id = ${playbookId}`;
		}
		if (teamId) {
			await db`DELETE FROM teams WHERE id = ${teamId}`;
		}
		if (userId) {
			await db`DELETE FROM users WHERE id = ${userId}`;
		}
	});

	test('complete workflow: user creates team and playbook', async () => {
		// Step 1: Create user
		const user = await userRepo.create({
			email: 'workflow@test.com',
			name: 'Workflow Test',
		});
		userId = user.id;
		expect(user.id).toBeGreaterThan(0);

		// Step 2: Create team
		const team = await teamRepo.create({
			name: 'Workflow Team',
		});
		teamId = team.id;
		expect(team.id).toBeGreaterThan(0);

		// Step 3: Add user to team as owner
		const member = await teamRepo.addMember({
			team_id: teamId,
			user_id: userId,
			role: 'owner',
		});
		expect(member.role).toBe('owner');

		// Step 4: Create playbook
		const playbook = await playbookRepo.create({
			team_id: teamId,
			name: 'Workflow Playbook',
			description: 'Integration test playbook',
			created_by: userId,
		});
		playbookId = playbook.id;
		expect(playbook.id).toBeGreaterThan(0);

		// Step 5: Verify relationships
		const userTeams = await teamRepo.getUserTeams(userId);
		expect(userTeams.some(t => t.id === teamId)).toBe(true);

		const teamPlaybooks = await playbookRepo.getTeamPlaybooks(teamId);
		expect(teamPlaybooks.some(p => p.id === playbookId)).toBe(true);
	});
});
```

**Step 2: Run integration test**

```bash
bun test tests/integration/playbook-workflow.test.ts
```

Expected: PASS

**Step 3: Commit**

```bash
git add tests/integration/playbook-workflow.test.ts
git commit -m "test: add playbook workflow integration test

- Test complete user->team->playbook creation flow
- Verify relationship queries work end-to-end"
```

---

## Phase 1 Complete! 🎉

**What we built:**
✅ MySQL database connection with Bun.sql
✅ Migration system with numbered SQL files
✅ Core schema: users, teams, playbooks, plays
✅ Type-safe repository pattern
✅ Comprehensive test coverage
✅ API endpoints for users
✅ Integration tests

**Next Steps (Future Phases):**
- **Phase 2**: Players & Drawings (fully normalized with segments/control points)
- **Phase 3**: Tags & Team Libraries (formations, personnel, position labels)
- **Phase 4**: Templates (formation/route templates with auto-population)
- **Phase 5**: Audit Logging

**To run the full test suite:**
```bash
bun test
```

**To start the server:**
```bash
bun run dev
```
