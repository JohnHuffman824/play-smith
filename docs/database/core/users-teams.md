# Users & Teams

This document describes the core user and team management tables that form the foundation of PlaySmith's collaboration model.

## Overview

PlaySmith uses a team-based collaboration model where:
- Users belong to one or more teams
- Teams own playbooks
- Team membership determines base permissions
- Roles define what members can do (owner > editor > viewer)

## Tables

### users

Stores user account information.

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Trigger for automatic updated_at management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**
- `id`: Unique identifier (BIGSERIAL auto-increments)
- `email`: User's email address (unique, used for login)
- `name`: Display name
- `created_at`: Account creation timestamp
- `updated_at`: Last modification timestamp (auto-updated via trigger)

**Indexes:**
- `idx_users_email`: Fast lookup by email for login queries

**Notes:**
- The `update_updated_at_column()` trigger function is reused across all tables
- Email uniqueness enforced at database level
- Authentication/password hashing handled by application layer (not stored here)

### teams

Stores team information.

```sql
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**
- `id`: Unique identifier
- `name`: Team name (display name, not unique to allow duplicate team names)
- `created_at`: Team creation timestamp
- `updated_at`: Last modification timestamp

**Notes:**
- Team names are NOT unique (multiple teams can have the same name)
- Each team gets their own libraries (formations, personnel, tags, routes)
- Team ownership cascades to playbooks, formations, etc.

### team_members

Junction table linking users to teams with role-based permissions.

```sql
CREATE TYPE team_role AS ENUM ('owner', 'editor', 'viewer');

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

**Fields:**
- `id`: Unique identifier
- `team_id`: Reference to team
- `user_id`: Reference to user
- `role`: Permission level (owner/editor/viewer)
- `joined_at`: When user joined the team

**Role Hierarchy:**
- **owner**: Full control (manage team, members, playbooks, delete team)
- **editor**: Can create and edit playbooks, plays, formations
- **viewer**: Read-only access to team playbooks

**Constraints:**
- `UNIQUE (team_id, user_id)`: User can only be member once per team
- `ON DELETE CASCADE`: Remove membership if team or user deleted

**Indexes:**
- `idx_team_members_user`: Find all teams for a user
- `idx_team_members_team`: Find all members of a team

## Relationships

```
users (1) ──────< (M) team_members (M) >────── (1) teams
              "member of"                   "has members"
```

- One user can belong to many teams
- One team can have many users
- `team_members` is the junction table with role information

## Permission Model

### Base Permissions (Team Membership)

A user's permission level for team-owned content is determined by their `team_role`:

```sql
-- Check if user is owner of team
SELECT role FROM team_members
WHERE user_id = ? AND team_id = ?
AND role = 'owner';

-- Get user's highest role in team
SELECT role FROM team_members
WHERE user_id = ? AND team_id = ?
ORDER BY
  CASE role
    WHEN 'owner' THEN 3
    WHEN 'editor' THEN 2
    WHEN 'viewer' THEN 1
  END DESC
LIMIT 1;
```

### Effective Permissions

A user's effective permission on a playbook is:
```
MAX(team_role, playbook_share_permission)
```

See [playbooks/playbooks.md](../playbooks/playbooks.md) for playbook sharing details.

## Example Queries

### Find all teams for a user

```sql
SELECT t.id, t.name, tm.role, tm.joined_at
FROM teams t
JOIN team_members tm ON tm.team_id = t.id
WHERE tm.user_id = ?
ORDER BY tm.joined_at DESC;
```

### Find all members of a team

```sql
SELECT u.id, u.name, u.email, tm.role, tm.joined_at
FROM users u
JOIN team_members tm ON tm.user_id = u.id
WHERE tm.team_id = ?
ORDER BY
  CASE tm.role
    WHEN 'owner' THEN 1
    WHEN 'editor' THEN 2
    WHEN 'viewer' THEN 3
  END,
  tm.joined_at ASC;
```

### Check if user has permission to access team

```sql
-- Returns role if user is member, NULL otherwise
SELECT role FROM team_members
WHERE team_id = ? AND user_id = ?;
```

### Check if user is owner of team

```sql
SELECT EXISTS (
  SELECT 1 FROM team_members
  WHERE team_id = ? AND user_id = ? AND role = 'owner'
);
```

### Promote user to editor

```sql
UPDATE team_members
SET role = 'editor'
WHERE team_id = ? AND user_id = ?
AND role = 'viewer';  -- Only promote viewers
```

### Remove member from team

```sql
DELETE FROM team_members
WHERE team_id = ? AND user_id = ?;
```

## Triggers

### update_updated_at_column()

Automatically updates the `updated_at` timestamp on any UPDATE:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

**Used by:**
- `users` table
- `teams` table
- All other tables with `updated_at` columns

**Benefits:**
- No application code needed
- Guaranteed consistency
- Centralized logic

## Migration Notes

### Seeding Default Team

When a user signs up, optionally create a default team:

```sql
-- Create user
INSERT INTO users (email, name)
VALUES ('user@example.com', 'John Doe')
RETURNING id;

-- Create default team
INSERT INTO teams (name)
VALUES ('John Doe''s Team')
RETURNING id;

-- Add user as owner
INSERT INTO team_members (team_id, user_id, role)
VALUES (?, ?, 'owner');
```

### Team Invitation Flow

1. Owner invites user by email
2. Create pending invitation record (separate `team_invitations` table - not shown)
3. When user accepts, create `team_members` record with appropriate role
4. Delete invitation record

## See Also

- [playbooks/playbooks.md](../playbooks/playbooks.md) - Playbook ownership and sharing
- [organization/tags.md](../organization/tags.md) - Team-scoped custom tags
- [organization/formations.md](../organization/formations.md) - Team formation libraries
- [audit.md](../audit.md) - Team activity tracking
