# PostgreSQL Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete migration from MySQL to PostgreSQL including connection code, migrations, and repositories.

**Architecture:** Replace mysql2 with postgres library, convert SQL syntax from MySQL to PostgreSQL (BIGINT UNSIGNED AUTO_INCREMENT → BIGSERIAL, ENUMs, triggers), update repositories to use RETURNING clause.

**Tech Stack:** Bun runtime, postgres (npm package), PostgreSQL 17, AWS RDS

---

## Task 1: Update Database Migration Runner

**Files:**
- Modify: `src/db/migrate.ts`

**Step 1: Read current migrate.ts file**

```bash
cat src/db/migrate.ts
```

Expected: Shows MySQL-based migration runner

**Step 2: Update migrate.ts for PostgreSQL**

Replace entire file with:

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
	console.log('🔄 Running database migrations...\n');

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
			// PostgreSQL supports running multiple statements
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

	console.log('\n✅ All migrations applied successfully');
}

// Run migrations if called directly
if (import.meta.main) {
	migrate()
		.then(() => {
			process.exit(0);
		})
		.catch(err => {
			console.error(err);
			process.exit(1);
		});
}
```

**Step 3: Test migration runner compiles**

```bash
bun --dry-run src/db/migrate.ts
```

Expected: No compilation errors

**Step 4: Commit**

```bash
git add src/db/migrate.ts src/db/connection.ts
git commit -m "refactor: update database connection and migration runner for PostgreSQL

- Replace mysql2 with postgres library
- Simplify connection code using postgres tagged templates
- Update migration runner to use PostgreSQL syntax
- Remove MySQL-specific configuration"
```

---

## Task 2: Convert Migration 001 - Users & Teams

**Files:**
- Modify: `src/db/migrations/001_create_users_teams.sql`

**Step 1: Backup current migration**

```bash
cp src/db/migrations/001_create_users_teams.sql src/db/migrations/001_create_users_teams.sql.mysql.bak
```

**Step 2: Replace migration with PostgreSQL syntax**

Replace entire file:

```sql
-- Updated_at trigger function (reusable across all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Teams table
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Team role enum
CREATE TYPE team_role AS ENUM ('owner', 'editor', 'viewer');

-- Team members (many-to-many with roles)
CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role team_role NOT NULL DEFAULT 'viewer',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
```

**Step 3: Commit**

```bash
git add src/db/migrations/001_create_users_teams.sql
git commit -m "refactor: convert migration 001 to PostgreSQL syntax

- Replace BIGINT UNSIGNED AUTO_INCREMENT with BIGSERIAL
- Create custom team_role ENUM type
- Use triggers for updated_at instead of ON UPDATE CURRENT_TIMESTAMP
- Move indexes to separate CREATE INDEX statements
- Simplify UNIQUE constraints"
```

---

## Task 3: Convert Migration 002 - Playbooks

**Files:**
- Modify: `src/db/migrations/002_create_playbooks.sql`

**Step 1: Replace migration with PostgreSQL syntax**

Replace entire file:

```sql
-- Share permission enum
CREATE TYPE share_permission AS ENUM ('view', 'edit');

-- Playbooks table
CREATE TABLE playbooks (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_playbooks_team ON playbooks(team_id);
CREATE INDEX idx_playbooks_created_by ON playbooks(created_by);

CREATE TRIGGER update_playbooks_updated_at BEFORE UPDATE ON playbooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Playbook sharing (team-to-team)
CREATE TABLE playbook_shares (
    id BIGSERIAL PRIMARY KEY,
    playbook_id BIGINT NOT NULL,
    shared_with_team_id BIGINT NOT NULL,
    permission share_permission NOT NULL DEFAULT 'view',
    shared_by BIGINT NOT NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (playbook_id, shared_with_team_id),
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id)
);

CREATE INDEX idx_playbook_shares_shared_team ON playbook_shares(shared_with_team_id);
CREATE INDEX idx_playbook_shares_playbook ON playbook_shares(playbook_id);
```

**Step 2: Commit**

```bash
git add src/db/migrations/002_create_playbooks.sql
git commit -m "refactor: convert migration 002 to PostgreSQL syntax

- Replace BIGINT UNSIGNED AUTO_INCREMENT with BIGSERIAL
- Create share_permission ENUM type
- Use triggers for updated_at
- Move indexes to separate statements"
```

---

## Task 4: Convert Migration 003 - Plays

**Files:**
- Modify: `src/db/migrations/003_create_plays.sql`

**Step 1: Replace migration with PostgreSQL syntax**

Replace entire file:

```sql
-- Hash position enum
CREATE TYPE hash_position AS ENUM ('left', 'middle', 'right');

-- Plays table
CREATE TABLE plays (
    id BIGSERIAL PRIMARY KEY,
    playbook_id BIGINT NOT NULL,
    name VARCHAR(255),
    formation_id BIGINT,
    personnel_id BIGINT,
    defensive_formation_id BIGINT,
    hash_position hash_position NOT NULL DEFAULT 'middle',
    notes TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_plays_playbook ON plays(playbook_id);

CREATE TRIGGER update_plays_updated_at BEFORE UPDATE ON plays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: formation_id, personnel_id, defensive_formation_id FKs will be added
-- in Phase 2 when we create those tables
```

**Step 2: Commit**

```bash
git add src/db/migrations/003_create_plays.sql
git commit -m "refactor: convert migration 003 to PostgreSQL syntax

- Replace BIGINT UNSIGNED AUTO_INCREMENT with BIGSERIAL
- Create hash_position ENUM type
- Use triggers for updated_at"
```

---

## Task 5: Update UserRepository for PostgreSQL

**Files:**
- Modify: `src/db/repositories/UserRepository.ts`
- Test: `src/db/repositories/UserRepository.test.ts`

**Step 1: Update UserRepository.create method**

Find the `create` method and replace it:

```typescript
async create(data: { email: string; name: string }): Promise<User> {
	// PostgreSQL uses RETURNING clause instead of separate SELECT
	const [user] = await db<User[]>`
		INSERT INTO users (email, name)
		VALUES (${data.email}, ${data.name})
		RETURNING *
	`;

	return user;
}
```

**Step 2: Run UserRepository tests**

```bash
bun test src/db/repositories/UserRepository.test.ts
```

Expected: Tests may fail initially due to database state

**Step 3: Commit**

```bash
git add src/db/repositories/UserRepository.ts
git commit -m "refactor: update UserRepository for PostgreSQL RETURNING clause

- Use RETURNING * instead of separate SELECT
- More efficient: one query instead of two"
```

---

## Task 6: Update TeamRepository for PostgreSQL

**Files:**
- Modify: `src/db/repositories/TeamRepository.ts`

**Step 1: Update TeamRepository.create method**

```typescript
async create(data: { name: string }): Promise<Team> {
	const [team] = await db<Team[]>`
		INSERT INTO teams (name)
		VALUES (${data.name})
		RETURNING *
	`;

	return team;
}
```

**Step 2: Update TeamRepository.addMember method**

```typescript
async addMember(data: {
	team_id: number;
	user_id: number;
	role: 'owner' | 'editor' | 'viewer';
}): Promise<TeamMember> {
	const [member] = await db<TeamMember[]>`
		INSERT INTO team_members (team_id, user_id, role)
		VALUES (${data.team_id}, ${data.user_id}, ${data.role})
		RETURNING *
	`;

	return member;
}
```

**Step 3: Commit**

```bash
git add src/db/repositories/TeamRepository.ts
git commit -m "refactor: update TeamRepository for PostgreSQL RETURNING clause

- Update create and addMember methods
- Use RETURNING * for inserted rows"
```

---

## Task 7: Update PlaybookRepository for PostgreSQL

**Files:**
- Modify: `src/db/repositories/PlaybookRepository.ts`

**Step 1: Update PlaybookRepository.create method**

```typescript
async create(data: {
	team_id: number;
	name: string;
	description?: string;
	created_by: number;
}): Promise<Playbook> {
	const [playbook] = await db<Playbook[]>`
		INSERT INTO playbooks (team_id, name, description, created_by)
		VALUES (${data.team_id}, ${data.name}, ${data.description || null}, ${data.created_by})
		RETURNING *
	`;

	return playbook;
}
```

**Step 2: Update PlaybookRepository.update method**

The update method needs to be refactored to use PostgreSQL syntax. Replace the entire method:

```typescript
async update(
	id: number,
	data: Partial<{ name: string; description: string }>
): Promise<Playbook | null> {
	// Build SET clause dynamically
	const updates: string[] = [];
	const values: any[] = [];
	let paramIndex = 1;

	if (data.name !== undefined) {
		updates.push(`name = $${paramIndex++}`);
		values.push(data.name);
	}
	if (data.description !== undefined) {
		updates.push(`description = $${paramIndex++}`);
		values.push(data.description);
	}

	if (updates.length === 0) {
		return this.findById(id);
	}

	values.push(id);
	const query = `UPDATE playbooks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

	const result = await db.unsafe(query, values);
	return result[0] || null;
}
```

**Step 3: Commit**

```bash
git add src/db/repositories/PlaybookRepository.ts
git commit -m "refactor: update PlaybookRepository for PostgreSQL

- Use RETURNING * in create method
- Update dynamic UPDATE query for PostgreSQL $N syntax
- Remove MySQL-specific placeholder syntax"
```

---

## Task 8: Drop MySQL Database and Run PostgreSQL Migrations

**Files:**
- None (database operations)

**Step 1: Verify PostgreSQL connection**

```bash
bun setup-rds.ts
```

Expected: Shows connection successful, PostGIS version

**Step 2: Drop all MySQL tables if they exist on PostgreSQL**

This is safe because we're migrating to a fresh PostgreSQL database.

**Step 3: Run PostgreSQL migrations**

```bash
bun run migrate
```

Expected output:
```
🔄 Running database migrations...

→ Applying migration 001_create_users_teams...
✓ Applied migration 001_create_users_teams
→ Applying migration 002_create_playbooks...
✓ Applied migration 002_create_playbooks
→ Applying migration 003_create_plays...
✓ Applied migration 003_create_plays

✅ All migrations applied successfully
```

**Step 4: Verify tables exist**

Create temporary verification script:

```typescript
// verify-schema.ts
import { db } from './src/db/connection';

const tables = await db`
	SELECT tablename
	FROM pg_tables
	WHERE schemaname = 'public'
	ORDER BY tablename
`;

console.log('📊 PostgreSQL Tables:');
tables.forEach(t => console.log(`  - ${t.tablename}`));

const enums = await db`
	SELECT typname
	FROM pg_type
	WHERE typtype = 'e'
	ORDER BY typname
`;

console.log('\n🏷️  Custom ENUMs:');
enums.forEach(e => console.log(`  - ${e.typname}`));

await db.end();
```

Run:
```bash
bun verify-schema.ts
```

Expected output:
```
📊 PostgreSQL Tables:
  - playbook_shares
  - playbooks
  - plays
  - schema_migrations
  - team_members
  - teams
  - users

🏷️  Custom ENUMs:
  - hash_position
  - share_permission
  - team_role
```

**Step 5: Clean up and commit**

```bash
rm verify-schema.ts
git add .
git commit -m "chore: verify PostgreSQL migrations successful

All tables and ENUMs created successfully on RDS PostgreSQL instance"
```

---

## Task 9: Test All Repositories

**Files:**
- Test: `src/db/repositories/*.test.ts`

**Step 1: Run all repository tests**

```bash
bun test src/db/repositories/
```

Expected: All tests should pass

**Step 2: If tests fail, debug specific repository**

```bash
bun test src/db/repositories/UserRepository.test.ts --verbose
```

**Step 3: Run integration test**

```bash
bun test tests/integration/playbook-workflow.test.ts
```

Expected: Complete workflow test passes

**Step 4: Commit if any fixes were needed**

```bash
git add src/db/repositories/
git commit -m "test: verify all repository tests pass with PostgreSQL

- UserRepository: PASS
- TeamRepository: PASS
- PlaybookRepository: PASS
- Integration test: PASS"
```

---

## Task 10: Test API Endpoints

**Files:**
- None (manual testing)

**Step 1: Start development server**

```bash
bun dev
```

**Step 2: Test user creation**

In another terminal:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@playsmith.com","name":"Test User"}'
```

Expected: Returns created user with ID

**Step 3: Test user retrieval**

```bash
curl http://localhost:3000/api/users
```

Expected: Returns array with created user

**Step 4: Test user by ID**

```bash
curl http://localhost:3000/api/users/1
```

Expected: Returns specific user

**Step 5: Document API test results**

Create test log:
```bash
echo "✅ API Endpoints Working with PostgreSQL" > api-test-results.txt
echo "- POST /api/users: ✓" >> api-test-results.txt
echo "- GET /api/users: ✓" >> api-test-results.txt
echo "- GET /api/users/:id: ✓" >> api-test-results.txt
```

---

## Task 11: Update Package Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Remove mysql2 dependency**

```bash
bun remove mysql2
```

**Step 2: Verify postgres is installed**

```bash
bun list | grep postgres
```

Expected: Shows postgres@3.4.7 or similar

**Step 3: Clean install to verify**

```bash
rm -rf node_modules
bun install
```

**Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: remove mysql2 dependency

- mysql2 replaced with postgres library
- Clean dependencies after migration"
```

---

## Task 12: Final Verification and Documentation

**Files:**
- Modify: `README.md` (already updated)

**Step 1: Run full test suite**

```bash
bun test
```

Expected: All tests pass

**Step 2: Verify development workflow**

```bash
# Stop server (Ctrl+C)
# Start fresh
bun dev
```

Expected: Server starts without errors

**Step 3: Create migration completion summary**

Create summary document:

```bash
cat > MIGRATION-COMPLETE.md << 'EOF'
# PostgreSQL Migration Complete ✅

**Date:** 2024-12-09
**Status:** Successfully migrated from MySQL to PostgreSQL

## What Changed

### Database
- **Before:** MySQL (mysql2 library)
- **After:** PostgreSQL 17 on AWS RDS (postgres library)

### Migrations Converted
- ✅ 001_create_users_teams.sql - PostgreSQL ENUMs, triggers
- ✅ 002_create_playbooks.sql - PostgreSQL syntax
- ✅ 003_create_plays.sql - PostgreSQL syntax

### Code Updated
- ✅ src/db/connection.ts - postgres library
- ✅ src/db/migrate.ts - PostgreSQL migration runner
- ✅ src/db/repositories/UserRepository.ts - RETURNING clause
- ✅ src/db/repositories/TeamRepository.ts - RETURNING clause
- ✅ src/db/repositories/PlaybookRepository.ts - RETURNING clause

### Features Enabled
- ✅ PostGIS extension (spatial queries ready)
- ✅ JSONB support (for future audit logging)
- ✅ Custom ENUM types (team_role, share_permission, hash_position)
- ✅ Trigger-based updated_at timestamps

## Testing Status

- ✅ All repository tests passing
- ✅ Integration test passing
- ✅ API endpoints working
- ✅ Migrations run successfully on RDS

## Database Info

- **Host:** playsmith-dev.c940uiy0ypml.us-east-2.rds.amazonaws.com
- **Database:** playsmith_dev
- **PostGIS:** v3.x.x
- **PostgreSQL:** 17.6

## Developer Workflow

```bash
# Setup (first time)
bun setup-rds.ts    # Enable PostGIS
bun run migrate     # Run migrations

# Daily development
bun dev             # Start server

# Testing
bun test            # Run all tests
```

## Next Steps

- Phase 2: Players & Drawings tables (with PostGIS geometry)
- Phase 3: Tags & Team Libraries
- Phase 4: Route Templates
- Phase 5: Audit Logging (with JSONB)
EOF
```

**Step 4: Final commit**

```bash
git add MIGRATION-COMPLETE.md
git commit -m "docs: PostgreSQL migration complete

Complete migration from MySQL to PostgreSQL on AWS RDS

- All migrations converted and applied
- All repositories updated for PostgreSQL
- All tests passing
- API endpoints verified
- PostGIS enabled and ready

See MIGRATION-COMPLETE.md for full details"
```

---

## Verification Checklist

Before considering migration complete, verify:

- [ ] `bun run migrate` completes successfully
- [ ] All 3 migrations applied (001, 002, 003)
- [ ] `bun test` all tests pass
- [ ] `bun dev` server starts without errors
- [ ] API endpoints respond correctly
- [ ] PostGIS extension enabled (verified in setup-rds.ts)
- [ ] No mysql2 references in code
- [ ] .env file points to PostgreSQL RDS
- [ ] README.md reflects PostgreSQL setup

---

## Rollback Plan

If migration fails critically:

1. **Restore connection.ts from git:**
   ```bash
   git checkout HEAD~1 src/db/connection.ts
   ```

2. **Restore mysql2:**
   ```bash
   bun add mysql2
   ```

3. **Restore migration files:**
   ```bash
   git checkout HEAD~3 src/db/migrations/
   ```

4. **Restore .env:**
   ```bash
   # Restore MySQL connection string
   ```

5. **Report issue and investigate**

---

## Success Criteria

✅ All tests passing
✅ Server runs without errors
✅ Database migrations applied
✅ API endpoints functional
✅ No MySQL dependencies remaining
✅ Documentation updated
