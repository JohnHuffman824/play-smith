# Sessions

This document describes session management for user authentication.

## Overview

Sessions track logged-in users and manage authentication state. While not explicitly defined in the original DATABASE_ARCHITECTURE.md, this is a common requirement for web applications.

## Recommended Implementation

### Option 1: Database Sessions

```sql
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    data JSONB,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);
```

**Fields:**
- `id`: Session identifier (UUID or random token)
- `user_id`: Reference to logged-in user
- `data`: Session data stored as JSONB (preferences, temporary state)
- `expires_at`: Session expiration timestamp
- `created_at`: When session was created (login time)
- `last_activity`: Last request timestamp (for activity tracking)
- `ip_address`: Client IP (using PostgreSQL INET type)
- `user_agent`: Browser/client information

**Indexes:**
- `idx_sessions_user`: Find all sessions for a user
- `idx_sessions_expires`: Cleanup expired sessions
- `idx_sessions_last_activity`: Find inactive sessions

### Option 2: Redis Sessions (Recommended)

For better performance, use Bun's built-in Redis support:

```typescript
// Using Bun.redis for session storage
const session = await Bun.redis.get(`session:${sessionId}`);
const sessionData = {
  userId: user.id,
  email: user.email,
  expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
};
await Bun.redis.setex(`session:${sessionId}`, 604800, JSON.stringify(sessionData));
```

**Benefits:**
- Faster than database sessions
- Automatic expiration with TTL
- Lower database load
- Better horizontal scaling

**See:** [Bun.redis documentation](../../node_modules/bun-types/docs/api/redis.md)

## Session Management Patterns

### Login Flow

```sql
-- Create new session on login
INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent)
VALUES (
  gen_random_uuid()::text,
  ?,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  ?::inet,
  ?
)
RETURNING id;
```

### Session Validation

```sql
-- Validate session and check expiration
SELECT s.id, s.user_id, u.email, u.name
FROM sessions s
JOIN users u ON u.id = s.user_id
WHERE s.id = ?
AND s.expires_at > CURRENT_TIMESTAMP;
```

### Update Last Activity

```sql
UPDATE sessions
SET last_activity = CURRENT_TIMESTAMP
WHERE id = ?;
```

### Logout

```sql
-- Delete session on logout
DELETE FROM sessions WHERE id = ?;
```

### Cleanup Expired Sessions

```sql
-- Run periodically (cron job or scheduled task)
DELETE FROM sessions
WHERE expires_at < CURRENT_TIMESTAMP;
```

### Revoke All User Sessions

```sql
-- Force logout (e.g., password reset, security event)
DELETE FROM sessions WHERE user_id = ?;
```

## Security Considerations

### Session ID Generation

Use cryptographically secure random tokens:

```typescript
// Generate secure session ID
const sessionId = crypto.randomUUID();

// Or use crypto.randomBytes
const sessionId = crypto.randomBytes(32).toString('hex');
```

### Session Fixation Prevention

Always regenerate session ID after login:

```sql
-- Delete old session
DELETE FROM sessions WHERE id = ?;

-- Create new session with new ID
INSERT INTO sessions (id, user_id, expires_at)
VALUES (?, ?, CURRENT_TIMESTAMP + INTERVAL '7 days');
```

### Concurrent Session Limits

```sql
-- Limit to 5 active sessions per user
WITH old_sessions AS (
  SELECT id FROM sessions
  WHERE user_id = ?
  ORDER BY last_activity DESC
  OFFSET 5
)
DELETE FROM sessions
WHERE id IN (SELECT id FROM old_sessions);
```

## Example Queries

### Get active sessions for user

```sql
SELECT
  id,
  created_at,
  last_activity,
  ip_address,
  user_agent,
  CASE
    WHEN last_activity > CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN 'active'
    WHEN last_activity > CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 'idle'
    ELSE 'inactive'
  END as status
FROM sessions
WHERE user_id = ?
AND expires_at > CURRENT_TIMESTAMP
ORDER BY last_activity DESC;
```

### Count active users

```sql
-- Users with activity in last 15 minutes
SELECT COUNT(DISTINCT user_id)
FROM sessions
WHERE last_activity > CURRENT_TIMESTAMP - INTERVAL '15 minutes'
AND expires_at > CURRENT_TIMESTAMP;
```

### Session analytics

```sql
-- Session duration statistics
SELECT
  AVG(EXTRACT(EPOCH FROM (last_activity - created_at))) as avg_duration_seconds,
  MAX(EXTRACT(EPOCH FROM (last_activity - created_at))) as max_duration_seconds,
  COUNT(*) as total_sessions
FROM sessions
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
```

## JSONB Session Data

Store additional session data in the `data` JSONB field:

```sql
-- Store user preferences in session
UPDATE sessions
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{preferences}',
  '{"theme": "dark", "notifications": true}'::jsonb
)
WHERE id = ?;

-- Query session data
SELECT data->>'preferences' as preferences
FROM sessions
WHERE id = ?;
```

**Common session data:**
- Theme preferences
- Last visited playbook/play
- UI state (collapsed panels, zoom level)
- Temporary form data
- Feature flags
- CSRF tokens

## See Also

- [users-teams.md](./users-teams.md) - User and team management
- [../audit.md](../audit.md) - Session activity logging
