# Playbooks & Sharing

This document describes playbook ownership and cross-team sharing.

## Overview

Playbooks are the primary organizational unit in PlaySmith:
- Playbooks belong to a team
- Contain sections and plays
- Can be shared with other teams
- Sharing permissions are configurable (view/edit)

## Tables

### playbooks

Stores playbook metadata and ownership.

```sql
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
```

**Fields:**
- `id`: Unique identifier
- `team_id`: Owning team (NOT NULL - playbooks always belong to a team)
- `name`: Playbook name
- `description`: Optional description/notes
- `created_by`: User who created the playbook
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp (auto-updated)

**Constraints:**
- `ON DELETE CASCADE`: Delete playbook when team is deleted
- `created_by` uses `ON DELETE` default (no action) to preserve creator reference

**Indexes:**
- `idx_playbooks_team`: Find all playbooks for a team
- `idx_playbooks_created_by`: Find all playbooks created by a user

### playbook_shares

Cross-team playbook sharing with permissions.

```sql
CREATE TYPE share_permission AS ENUM ('view', 'edit');

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

**Fields:**
- `id`: Unique identifier
- `playbook_id`: Reference to shared playbook
- `shared_with_team_id`: Team receiving access
- `permission`: Access level (view/edit)
- `shared_by`: User who initiated the share
- `shared_at`: When sharing occurred

**Share Permissions:**
- **view**: Read-only access (can view plays, cannot modify)
- **edit**: Full collaborative editing access

**Constraints:**
- `UNIQUE (playbook_id, shared_with_team_id)`: Can only share once per team
- `ON DELETE CASCADE`: Remove share when playbook or team deleted

**Indexes:**
- `idx_playbook_shares_shared_team`: Find all playbooks shared with a team
- `idx_playbook_shares_playbook`: Find all teams a playbook is shared with

## Relationships

```
teams (1) ─────< (M) playbooks
    "owns"

playbooks (M) >─────< (M) teams
         playbook_shares     "shared with"
        (with permission)

users (1) ─────< (M) playbooks
    "created by"

users (1) ─────< (M) playbook_shares
    "shared by"
```

## Permission Model

### Effective Permission Calculation

A user's effective permission on a playbook is:
```
MAX(team_role, playbook_share_permission)
```

**Examples:**

| User's Team Role | Playbook Share Permission | Effective Permission |
|-----------------|---------------------------|---------------------|
| owner           | -                         | edit (owner)        |
| editor          | -                         | edit (editor)       |
| viewer          | -                         | view                |
| viewer          | edit                      | edit (share wins)   |
| - (not member)  | view                      | view                |
| - (not member)  | edit                      | edit                |

### Permission Check Query

```sql
-- Get user's effective permission on a playbook
WITH team_permission AS (
  -- Check if user is member of owning team
  SELECT
    CASE tm.role
      WHEN 'owner' THEN 'edit'
      WHEN 'editor' THEN 'edit'
      WHEN 'viewer' THEN 'view'
    END as permission
  FROM playbooks p
  JOIN team_members tm ON tm.team_id = p.team_id
  WHERE p.id = ? AND tm.user_id = ?
),
share_permission AS (
  -- Check if playbook is shared with user's teams
  SELECT ps.permission
  FROM playbook_shares ps
  JOIN team_members tm ON tm.team_id = ps.shared_with_team_id
  WHERE ps.playbook_id = ? AND tm.user_id = ?
)
SELECT
  CASE
    WHEN tp.permission = 'edit' THEN 'edit'
    WHEN sp.permission = 'edit' THEN 'edit'
    WHEN tp.permission = 'view' THEN 'view'
    WHEN sp.permission = 'view' THEN 'view'
    ELSE NULL
  END as effective_permission
FROM (SELECT 1) dummy
LEFT JOIN team_permission tp ON true
LEFT JOIN share_permission sp ON true;
```

### Simplified Permission Check

```sql
-- Check if user can view playbook
SELECT EXISTS (
  -- User is member of owning team
  SELECT 1 FROM playbooks p
  JOIN team_members tm ON tm.team_id = p.team_id
  WHERE p.id = ? AND tm.user_id = ?
  UNION
  -- Playbook is shared with user's team
  SELECT 1 FROM playbook_shares ps
  JOIN team_members tm ON tm.team_id = ps.shared_with_team_id
  WHERE ps.playbook_id = ? AND tm.user_id = ?
);

-- Check if user can edit playbook
SELECT EXISTS (
  -- User is owner/editor of owning team
  SELECT 1 FROM playbooks p
  JOIN team_members tm ON tm.team_id = p.team_id
  WHERE p.id = ? AND tm.user_id = ?
  AND tm.role IN ('owner', 'editor')
  UNION
  -- Playbook shared with edit permission to user's team
  SELECT 1 FROM playbook_shares ps
  JOIN team_members tm ON tm.team_id = ps.shared_with_team_id
  WHERE ps.playbook_id = ? AND tm.user_id = ?
  AND ps.permission = 'edit'
);
```

## Example Queries

### Get all playbooks accessible to a user

```sql
-- Playbooks user can access (owned + shared)
SELECT DISTINCT
  p.id,
  p.name,
  p.description,
  t.name as team_name,
  CASE
    WHEN p.team_id = tm.team_id THEN 'owned'
    ELSE 'shared'
  END as access_type,
  CASE
    WHEN tm.role IN ('owner', 'editor') THEN 'edit'
    WHEN ps.permission = 'edit' THEN 'edit'
    ELSE 'view'
  END as permission
FROM playbooks p
JOIN teams t ON t.id = p.team_id
LEFT JOIN team_members tm ON tm.team_id = p.team_id AND tm.user_id = ?
LEFT JOIN playbook_shares ps ON ps.playbook_id = p.id
LEFT JOIN team_members tm2 ON tm2.team_id = ps.shared_with_team_id AND tm2.user_id = ?
WHERE tm.user_id IS NOT NULL OR tm2.user_id IS NOT NULL
ORDER BY p.updated_at DESC;
```

### Share playbook with team

```sql
-- Share playbook (only if user is owner/editor of owning team)
INSERT INTO playbook_shares (playbook_id, shared_with_team_id, permission, shared_by)
SELECT ?, ?, ?, ?
FROM playbooks p
JOIN team_members tm ON tm.team_id = p.team_id
WHERE p.id = ? AND tm.user_id = ? AND tm.role IN ('owner', 'editor')
ON CONFLICT (playbook_id, shared_with_team_id)
DO UPDATE SET permission = EXCLUDED.permission;
```

### Revoke playbook share

```sql
-- Remove share (only if user is owner/editor of owning team)
DELETE FROM playbook_shares
WHERE playbook_id = ? AND shared_with_team_id = ?
AND EXISTS (
  SELECT 1 FROM playbooks p
  JOIN team_members tm ON tm.team_id = p.team_id
  WHERE p.id = playbook_shares.playbook_id
  AND tm.user_id = ? AND tm.role IN ('owner', 'editor')
);
```

### Get teams playbook is shared with

```sql
SELECT
  t.id,
  t.name,
  ps.permission,
  ps.shared_at,
  u.name as shared_by_name
FROM playbook_shares ps
JOIN teams t ON t.id = ps.shared_with_team_id
JOIN users u ON u.id = ps.shared_by
WHERE ps.playbook_id = ?
ORDER BY ps.shared_at DESC;
```

### Change share permission

```sql
UPDATE playbook_shares
SET permission = ?
WHERE playbook_id = ? AND shared_with_team_id = ?;
```

### Get playbook with access info

```sql
-- Get playbook details with user's permission
SELECT
  p.id,
  p.name,
  p.description,
  p.created_at,
  p.updated_at,
  t.name as team_name,
  creator.name as created_by_name,
  -- User's effective permission
  CASE
    WHEN tm.role IN ('owner', 'editor') THEN 'edit'
    WHEN ps.permission = 'edit' THEN 'edit'
    ELSE 'view'
  END as user_permission,
  -- Is user member of owning team?
  (tm.user_id IS NOT NULL) as is_team_member,
  -- Count of plays in playbook
  (SELECT COUNT(*) FROM plays WHERE playbook_id = p.id) as play_count,
  -- Count of shares
  (SELECT COUNT(*) FROM playbook_shares WHERE playbook_id = p.id) as share_count
FROM playbooks p
JOIN teams t ON t.id = p.team_id
JOIN users creator ON creator.id = p.created_by
LEFT JOIN team_members tm ON tm.team_id = p.team_id AND tm.user_id = ?
LEFT JOIN playbook_shares ps ON ps.playbook_id = p.id
LEFT JOIN team_members tm2 ON tm2.team_id = ps.shared_with_team_id AND tm2.user_id = ?
WHERE p.id = ?
AND (tm.user_id IS NOT NULL OR tm2.user_id IS NOT NULL);
```

## Sharing Workflow

### Share Flow

1. User (owner/editor of Team A) shares Playbook X with Team B
2. Record created in `playbook_shares`
3. All members of Team B can now access Playbook X
4. Their access level depends on share permission (view/edit)

### Collaborative Editing

When a playbook is shared with `edit` permission:
- Members of shared team can create/edit/delete plays
- All changes are tracked in audit log
- `updated_at` timestamps reflect last modification
- Original team retains ownership

### Unsharing

When a share is revoked:
- `playbook_shares` record deleted
- Shared team members immediately lose access
- No cascade effects on plays (they remain unchanged)

## URL Routing

```
/playbook/:playbookId
/playbook/:playbookId/play/:playId
```

**Permission logic:**
1. Look up playbook
2. Check if user has access (team member OR playbook shared with user's team)
3. Return 404 if no access (don't reveal playbook existence)
4. Return playbook data with user's effective permission level

## See Also

- [sections.md](./sections.md) - Section organization within playbooks
- [plays.md](./plays.md) - Individual plays
- [../core/users-teams.md](../core/users-teams.md) - Team ownership and roles
- [../audit.md](../audit.md) - Tracking playbook changes and shares
