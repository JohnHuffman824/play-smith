# Audit Logging

This document describes the audit logging system for tracking changes to plays, playbooks, and other entities.

## Overview

PlaySmith uses basic audit logging to track:
- Who made changes
- What changed (field-level JSONB)
- When changes occurred
- Where changes came from (IP address, user agent)

This provides accountability for collaborative editing without the overhead of full version history.

## Table

### audit_log

```sql
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'share', 'unshare');

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    playbook_id BIGINT, -- Optional: associate with playbook for filtering
    entity_type VARCHAR(50) NOT NULL, -- 'play', 'drawing', 'player', 'playbook', 'tag', etc.
    entity_id BIGINT NOT NULL, -- ID of the changed entity
    action audit_action NOT NULL,
    changes JSONB, -- What changed: {"field": {"old": "value", "new": "value"}}
    ip_address INET, -- PostgreSQL INET type for IP addresses
    user_agent TEXT, -- Browser/client information
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_playbook ON audit_log(playbook_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);
-- GIN index for efficient JSONB queries
CREATE INDEX idx_audit_log_changes ON audit_log USING GIN(changes);
```

**Fields:**
- `id`: Unique identifier
- `user_id`: User who made the change
- `playbook_id`: Optional playbook association (for filtering)
- `entity_type`: Type of entity changed (play, drawing, player, etc.)
- `entity_id`: ID of the changed entity
- `action`: Type of change (create/update/delete/share/unshare)
- `changes`: Field-level changes stored as JSONB
- `ip_address`: Client IP address (INET type)
- `user_agent`: Browser/client string
- `created_at`: When the change occurred

**Constraints:**
- `ON DELETE SET NULL` for `playbook_id`: Keep audit record when playbook deleted

**Indexes:**
- `idx_audit_log_entity`: Find all changes to a specific entity
- `idx_audit_log_user`: Find all changes by a user
- `idx_audit_log_playbook`: Find all changes to a playbook
- `idx_audit_log_created_at`: Time-based queries (recent activity)
- `idx_audit_log_action`: Filter by action type
- `idx_audit_log_changes` (GIN): JSONB field queries

## Audit Actions

### create

Entity was created (new play, drawing, player, etc.):

```json
{
  "changes": null  // No old values for new entities
}
```

### update

Entity was modified (field-level changes):

```json
{
  "changes": {
    "name": {"old": "Power Left", "new": "Power Right"},
    "formation_id": {"old": 5, "new": 12},
    "hash_position": {"old": "middle", "new": "right"}
  }
}
```

### delete

Entity was removed:

```json
{
  "changes": null  // Entire entity deleted
}
```

### share

Playbook was shared with a team:

```json
{
  "changes": {
    "shared_with_team_id": {"old": null, "new": 42},
    "permission": {"old": null, "new": "edit"}
  }
}
```

### unshare

Playbook share was revoked:

```json
{
  "changes": {
    "shared_with_team_id": {"old": 42, "new": null}
  }
}
```

## Entity Types

Common entity types:
- `playbook`
- `section`
- `play`
- `player`
- `drawing`
- `segment`
- `control_point`
- `tag`
- `formation`
- `personnel_package`
- `route_template`

## Example Queries

### Record play creation

```sql
INSERT INTO audit_log (
  user_id, playbook_id, entity_type, entity_id, action,
  ip_address, user_agent
)
VALUES (?, ?, 'play', ?, 'create', ?::inet, ?);
```

### Record play update

```sql
-- Build changes JSON in application code
INSERT INTO audit_log (
  user_id, playbook_id, entity_type, entity_id, action, changes,
  ip_address, user_agent
)
VALUES (
  ?,
  ?,
  'play',
  ?,
  'update',
  '{
    "name": {"old": "Power Left", "new": "Power Right"},
    "formation_id": {"old": 5, "new": 12}
  }'::jsonb,
  ?::inet,
  ?
);
```

### Record play deletion

```sql
INSERT INTO audit_log (
  user_id, playbook_id, entity_type, entity_id, action,
  ip_address, user_agent
)
VALUES (?, ?, 'play', ?, 'delete', ?::inet, ?);
```

### Record playbook share

```sql
INSERT INTO audit_log (
  user_id, playbook_id, entity_type, entity_id, action, changes,
  ip_address, user_agent
)
VALUES (
  ?,
  ?,
  'playbook_share',
  ?,
  'share',
  jsonb_build_object(
    'shared_with_team_id', jsonb_build_object('old', null, 'new', ?),
    'permission', jsonb_build_object('old', null, 'new', ?)
  ),
  ?::inet,
  ?
);
```

### Get all changes to a play

```sql
SELECT
  al.action,
  al.changes,
  al.created_at,
  u.name as user_name,
  u.email as user_email,
  al.ip_address
FROM audit_log al
JOIN users u ON u.id = al.user_id
WHERE al.entity_type = 'play'
AND al.entity_id = ?
ORDER BY al.created_at DESC;
```

### Get recent activity for a playbook

```sql
SELECT
  al.entity_type,
  al.entity_id,
  al.action,
  al.created_at,
  u.name as user_name,
  al.changes
FROM audit_log al
JOIN users u ON u.id = al.user_id
WHERE al.playbook_id = ?
ORDER BY al.created_at DESC
LIMIT 50;
```

### Get user's recent activity

```sql
SELECT
  al.entity_type,
  al.entity_id,
  al.action,
  al.created_at,
  al.changes,
  pb.name as playbook_name
FROM audit_log al
LEFT JOIN playbooks pb ON pb.id = al.playbook_id
WHERE al.user_id = ?
ORDER BY al.created_at DESC
LIMIT 100;
```

### Find all changes to a specific field

```sql
-- Find all changes to "formation_id" field
SELECT
  al.entity_type,
  al.entity_id,
  al.changes->'formation_id' as formation_change,
  al.created_at,
  u.name as user_name
FROM audit_log al
JOIN users u ON u.id = al.user_id
WHERE al.changes ? 'formation_id'  -- JSONB key exists
AND al.playbook_id = ?
ORDER BY al.created_at DESC;
```

### Find changes with specific field value

```sql
-- Find all plays changed to use formation_id = 12
SELECT
  al.entity_type,
  al.entity_id,
  al.changes,
  al.created_at,
  u.name as user_name
FROM audit_log al
JOIN users u ON u.id = al.user_id
WHERE al.entity_type = 'play'
AND al.changes @> '{"formation_id": {"new": 12}}'::jsonb
ORDER BY al.created_at DESC;
```

### Get activity timeline for playbook

```sql
SELECT
  DATE(al.created_at) as date,
  COUNT(*) as change_count,
  COUNT(DISTINCT al.user_id) as active_users,
  json_agg(DISTINCT u.name) as users
FROM audit_log al
JOIN users u ON u.id = al.user_id
WHERE al.playbook_id = ?
AND al.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY DATE(al.created_at)
ORDER BY date DESC;
```

### Get most active users

```sql
SELECT
  u.id,
  u.name,
  u.email,
  COUNT(*) as total_changes,
  COUNT(*) FILTER (WHERE al.action = 'create') as creates,
  COUNT(*) FILTER (WHERE al.action = 'update') as updates,
  COUNT(*) FILTER (WHERE al.action = 'delete') as deletes,
  MAX(al.created_at) as last_activity
FROM audit_log al
JOIN users u ON u.id = al.user_id
WHERE al.playbook_id = ?
GROUP BY u.id, u.name, u.email
ORDER BY total_changes DESC
LIMIT 10;
```

### Get entity history with full details

```sql
-- Complete history of a play with all changes
SELECT
  al.action,
  al.changes,
  al.created_at,
  u.name as user_name,
  u.email as user_email,
  al.ip_address::text as ip_address,
  al.user_agent
FROM audit_log al
JOIN users u ON u.id = al.user_id
WHERE al.entity_type = 'play'
AND al.entity_id = ?
ORDER BY al.created_at ASC;  -- Chronological order
```

### Get changes within time range

```sql
SELECT
  al.entity_type,
  al.entity_id,
  al.action,
  al.created_at,
  u.name as user_name,
  al.changes
FROM audit_log al
JOIN users u ON u.id = al.user_id
WHERE al.playbook_id = ?
AND al.created_at BETWEEN ? AND ?
ORDER BY al.created_at DESC;
```

### Aggregate changes by entity type

```sql
SELECT
  entity_type,
  COUNT(*) as total_changes,
  COUNT(*) FILTER (WHERE action = 'create') as creates,
  COUNT(*) FILTER (WHERE action = 'update') as updates,
  COUNT(*) FILTER (WHERE action = 'delete') as deletes
FROM audit_log
WHERE playbook_id = ?
AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY entity_type
ORDER BY total_changes DESC;
```

### Find concurrent edits

```sql
-- Find when multiple users edited same entity within 5 minutes
SELECT
  al1.entity_type,
  al1.entity_id,
  al1.user_id as user1_id,
  u1.name as user1_name,
  al2.user_id as user2_id,
  u2.name as user2_name,
  al1.created_at as time1,
  al2.created_at as time2,
  ABS(EXTRACT(EPOCH FROM (al1.created_at - al2.created_at))) as seconds_apart
FROM audit_log al1
JOIN audit_log al2 ON
  al2.entity_type = al1.entity_type
  AND al2.entity_id = al1.entity_id
  AND al2.id > al1.id
  AND al2.user_id != al1.user_id
  AND al2.created_at BETWEEN al1.created_at - INTERVAL '5 minutes' AND al1.created_at + INTERVAL '5 minutes'
JOIN users u1 ON u1.id = al1.user_id
JOIN users u2 ON u2.id = al2.user_id
WHERE al1.playbook_id = ?
ORDER BY al1.created_at DESC;
```

## JSONB Query Patterns

### Check if field exists in changes

```sql
WHERE changes ? 'field_name'
```

### Get specific field from changes

```sql
SELECT changes->'field_name' as field_change
```

### Filter by specific new value

```sql
WHERE changes @> '{"field_name": {"new": "value"}}'::jsonb
```

### Filter by specific old value

```sql
WHERE changes @> '{"field_name": {"old": "value"}}'::jsonb
```

### Get all fields that changed

```sql
SELECT jsonb_object_keys(changes) as changed_field
```

## Application Integration

### Building Changes JSON

```typescript
// TypeScript example
interface FieldChange {
  old: any;
  new: any;
}

function buildChanges(oldEntity: any, newEntity: any): Record<string, FieldChange> {
  const changes: Record<string, FieldChange> = {};

  for (const key in newEntity) {
    if (oldEntity[key] !== newEntity[key]) {
      changes[key] = {
        old: oldEntity[key],
        new: newEntity[key]
      };
    }
  }

  return changes;
}

// Example usage
const oldPlay = { name: "Power Left", formation_id: 5 };
const newPlay = { name: "Power Right", formation_id: 12 };
const changes = buildChanges(oldPlay, newPlay);
// Result: { name: { old: "Power Left", new: "Power Right" }, formation_id: { old: 5, new: 12 } }
```

### Automatic Logging Middleware

```typescript
// Example middleware to automatically log all changes
async function auditMiddleware(
  userId: number,
  playbookId: number | null,
  entityType: string,
  entityId: number,
  action: 'create' | 'update' | 'delete',
  changes: any,
  ipAddress: string,
  userAgent: string
) {
  await db.query(`
    INSERT INTO audit_log (
      user_id, playbook_id, entity_type, entity_id, action,
      changes, ip_address, user_agent
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8)
  `, [userId, playbookId, entityType, entityId, action, JSON.stringify(changes), ipAddress, userAgent]);
}
```

## Data Retention

### Archive old audit logs

```sql
-- Move logs older than 1 year to archive table
CREATE TABLE audit_log_archive (LIKE audit_log INCLUDING ALL);

INSERT INTO audit_log_archive
SELECT * FROM audit_log
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';

DELETE FROM audit_log
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
```

### Cleanup strategy

```sql
-- Keep detailed logs for 90 days, summaries for 1 year, then archive
-- Run periodically via cron job

-- Delete logs older than 1 year (after archiving)
DELETE FROM audit_log
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';

-- Vacuum to reclaim space
VACUUM ANALYZE audit_log;
```

## Future Expansion: Full Versioning

For full version history (point-in-time restoration), add:

```sql
CREATE TABLE entity_versions (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    snapshot JSONB NOT NULL,  -- Complete entity state
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE (entity_type, entity_id, version_number)
);

CREATE INDEX idx_entity_versions_entity ON entity_versions(entity_type, entity_id);
CREATE INDEX idx_entity_versions_created_at ON entity_versions(created_at);
```

**Benefits:**
- Point-in-time restoration
- Rollback to any version
- Complete history preservation

**Trade-offs:**
- Storage overhead (full snapshots)
- More complex queries
- Slower writes

## See Also

- [playbooks/plays.md](./playbooks/plays.md) - Play changes tracking
- [canvas/drawings.md](./canvas/drawings.md) - Drawing changes tracking
- [core/users-teams.md](./core/users-teams.md) - User activity tracking
- [playbooks/playbooks.md](./playbooks/playbooks.md) - Playbook sharing events
