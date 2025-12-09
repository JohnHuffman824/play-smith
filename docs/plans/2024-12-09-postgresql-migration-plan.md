# PostgreSQL Migration Plan

**Date:** 2024-12-09
**Goal:** Migrate from MySQL to PostgreSQL database infrastructure

## Overview

This plan converts the existing MySQL-based Phase 1 implementation to use PostgreSQL with PostGIS for enhanced spatial querying capabilities and better JSONB support.

## Prerequisites

**Choose your PostgreSQL deployment:**

### Option A: AWS RDS (Recommended for Production)
- AWS account with RDS access
- Follow the complete setup guide: `docs/AWS-RDS-Setup.md`
- RDS PostgreSQL 15+ instance created
- PostGIS extension enabled
- Security groups configured

**Environment setup (AWS RDS):**
```
DATABASE_URL=postgres://playsmith_admin:PASSWORD@playsmith-db.xxxxx.us-east-1.rds.amazonaws.com:5432/playsmith?sslmode=require
```

### Option B: Local PostgreSQL (Development)
- PostgreSQL 14+ installed locally
- PostGIS extension available
- Database created: `CREATE DATABASE playsmith;`
- Database user with permissions

**Environment setup (Local):**
```
DATABASE_URL=postgres://user:password@localhost:5432/playsmith
```

---

**For detailed AWS RDS setup instructions, see:** `docs/AWS-RDS-Setup.md`

---

## Migration Tasks

### Task 1: Update Dependencies

**Files:**
- `package.json`
- `bun.lock` (will be regenerated)

**Steps:**

1. Remove MySQL dependency:
```bash
bun remove mysql2
```

2. Verify PostgreSQL support (Bun has built-in PostgreSQL via `Bun.sql`)
   - No additional dependencies needed!
   - Bun's `Bun.sql` function works with PostgreSQL connection strings

3. Update `.env.example`:
```bash
echo "DATABASE_URL=postgres://user:password@localhost:5432/playsmith" > .env.example
```

4. Commit:
```bash
git add package.json bun.lock .env.example
git commit -m "chore: switch from mysql2 to PostgreSQL

- Remove mysql2 dependency
- Use Bun.sql with PostgreSQL connection string
- Update .env.example for PostgreSQL"
```

---

### Task 2: Update Database Connection

**Files:**
- `src/db/connection.ts`
- `src/db/connection.test.ts` (if exists)

**Step 1: Rewrite connection.ts for PostgreSQL**

Replace `src/db/connection.ts`:
```typescript
import { sql } from 'bun';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is required');
}

// Bun.sql automatically detects PostgreSQL from connection string
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

**Step 2: Test the connection**

```bash
bun test src/db/connection.test.ts
```

Expected: PASS (assumes PostgreSQL is running and DATABASE_URL is set)

**Step 3: Commit**

```bash
git add src/db/connection.ts
git commit -m "feat: update database connection for PostgreSQL

- Replace mysql2 connection with Bun.sql PostgreSQL
- Simplify connection code (Bun handles pooling)
- Remove MySQL-specific parsing logic"
```

---

### Task 3: Convert Migration Files to PostgreSQL Syntax

**Files:**
- `src/db/migrations/001_create_users_teams.sql`
- `src/db/migrations/002_create_playbooks.sql`
- `src/db/migrations/003_create_plays.sql`

**Key Syntax Changes:**
- `BIGINT UNSIGNED AUTO_INCREMENT` → `BIGSERIAL`
- `BIGINT UNSIGNED` → `BIGINT`
- `ENUM('val1', 'val2')` → Create custom TYPE first, then use it
- `UNIQUE KEY name (col)` → `UNIQUE (col)`
- `INDEX idx_name (col)` → Move to separate `CREATE INDEX` statement
- `ON UPDATE CURRENT_TIMESTAMP` → Use triggers (see below)

#### Migration 001: Users & Teams

Replace `src/db/migrations/001_create_users_teams.sql`:
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

#### Migration 002: Playbooks & Sharing

Replace `src/db/migrations/002_create_playbooks.sql`:
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

#### Migration 003: Plays

Replace `src/db/migrations/003_create_plays.sql`:
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

**Commit migration changes:**
```bash
git add src/db/migrations/*.sql
git commit -m "refactor: convert migrations to PostgreSQL syntax

- Replace BIGINT UNSIGNED AUTO_INCREMENT with BIGSERIAL
- Create custom ENUM types for role, permission, hash_position
- Use triggers for updated_at instead of ON UPDATE CURRENT_TIMESTAMP
- Move indexes to separate CREATE INDEX statements
- Simplify UNIQUE constraints"
```

---

### Task 4: Update Database Types (if needed)

**Files:**
- `src/db/types.ts`

**Check if any type changes are needed:**

The existing types should work fine, but verify:
- `id` fields are `number` (PostgreSQL BIGSERIAL returns numbers in Bun)
- ENUM types match (they're just strings in TypeScript anyway)

No changes needed for `src/db/types.ts` - TypeScript types remain the same!

---

### Task 5: Update Repositories (Minimal Changes)

**Files:**
- `src/db/repositories/UserRepository.ts`
- `src/db/repositories/TeamRepository.ts`
- `src/db/repositories/PlaybookRepository.ts`

**Key Changes:**

PostgreSQL uses different result object structure for INSERT:

**Before (MySQL):**
```typescript
const [result] = await db<any[]>`
    INSERT INTO users (email, name)
    VALUES (${data.email}, ${data.name})
`;
// result.insertId
```

**After (PostgreSQL):**
```typescript
const [result] = await db<any[]>`
    INSERT INTO users (email, name)
    VALUES (${data.email}, ${data.name})
    RETURNING id
`;
// result.id (PostgreSQL returns the row with RETURNING clause)
```

**Updated UserRepository.create method:**
```typescript
async create(data: { email: string; name: string }): Promise<User> {
    const [user] = await db<User[]>`
        INSERT INTO users (email, name)
        VALUES (${data.email}, ${data.name})
        RETURNING *
    `;
    return user;
}
```

Apply this pattern to all `create` methods in all repositories:
- UserRepository.create
- TeamRepository.create
- TeamRepository.addMember
- PlaybookRepository.create

**Commit:**
```bash
git add src/db/repositories/*.ts
git commit -m "refactor: update repositories for PostgreSQL RETURNING clause

- Replace result.insertId with RETURNING * or RETURNING id
- Remove second SELECT query (PostgreSQL returns inserted row)
- More efficient: one query instead of two"
```

---

### Task 6: Test Everything

**Run all tests:**
```bash
bun test
```

**Manual testing:**
```bash
# Start server
bun run dev

# In another terminal, test API
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

curl http://localhost:3000/api/users
```

**Expected:** All tests pass, API works correctly

---

### Task 7: Update Documentation References

**Files:**
- `docs/plans/2024-12-09-database-architecture-phase1.md` (optional: add note about PostgreSQL)
- `README.md` (if it mentions MySQL)

**Add note to Phase 1 plan:**

At the top of `docs/plans/2024-12-09-database-architecture-phase1.md`:
```markdown
> **Note:** This plan was originally written for MySQL but has been migrated to PostgreSQL.
> See `docs/plans/2024-12-09-postgresql-migration-plan.md` for migration details.
```

---

### Task 8: Final Migration Commit

**Create comprehensive commit:**
```bash
git add -A
git commit -m "feat: complete PostgreSQL migration

BREAKING CHANGE: Database migrated from MySQL to PostgreSQL

- Updated database connection to use Bun.sql with PostgreSQL
- Converted all migration files to PostgreSQL syntax
- Updated repositories to use RETURNING clause
- Added PostgreSQL-specific features (ENUMs, triggers)
- Removed mysql2 dependency

PostgreSQL advantages:
- PostGIS support for future spatial queries
- Better JSONB for audit logging
- Superior concurrency control (MVCC)
- Custom types for type safety

Migration guide: docs/plans/2024-12-09-postgresql-migration-plan.md"
```

---

## Database Reset (If Needed)

If you need to drop and recreate the database:

```sql
-- Connect to postgres database first
\c postgres

-- Drop and recreate
DROP DATABASE IF EXISTS playsmith;
CREATE DATABASE playsmith;

-- Reconnect
\c playsmith

-- Run migrations
-- (from terminal)
bun run migrate
```

---

## Verification Checklist

- [ ] PostgreSQL server running
- [ ] DATABASE_URL updated in `.env`
- [ ] `bun run migrate` completes successfully
- [ ] All repository tests pass
- [ ] Integration test passes
- [ ] API endpoints work correctly
- [ ] No MySQL-specific syntax in codebase

---

## Rollback Plan

If migration fails:

1. Revert git commits:
```bash
git reset --hard <commit-before-migration>
```

2. Restore `.env` to use MySQL connection string

3. Reinstall mysql2:
```bash
bun add mysql2
```

4. Run MySQL migrations:
```bash
bun run migrate
```

---

## Future Enhancements

**Phase 2 additions (when implementing players/drawings):**
- Enable PostGIS extension: `CREATE EXTENSION IF NOT EXISTS postgis;`
- Add geometric types for spatial queries
- Use GIST indexes for proximity searches
- Implement spatial triggers for location sync

**Benefits we'll unlock:**
- Fast "find nearby points" for merge detection
- Bounding box queries for viewport-based rendering
- Distance calculations for drawing operations
- Geometric collision detection
