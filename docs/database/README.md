# PlaySmith Database Architecture

## Overview

This directory contains the PostgreSQL database schema documentation for PlaySmith, an American football play and playbook creator.

## Documentation Structure

- **[core/](./core/)** - Core entities (users, teams, sessions)
- **[playbooks/](./playbooks/)** - Playbook and play management
- **[canvas/](./canvas/)** - Player positioning and route drawings
- **[organization/](./organization/)** - Tags, formations, and concept libraries
- **[audit.md](./audit.md)** - Audit logging patterns

## Key Design Decisions

### 1. Team-based Collaboration
Full support for team ownership, collaborative editing, and read-only sharing between teams. Teams own playbooks and can share them with other teams with configurable permissions (view/edit).

### 2. Fully Normalized Structure
Control points, segments, and players are stored in dedicated tables (not JSON blobs) for:
- Enhanced queryability
- Data integrity enforcement
- Spatial indexing capabilities
- Player-drawing relationship tracking

### 3. Hybrid Tag Scoping
- **Preset tags**: Global tags available to all teams (Short Yardage, Red Zone, etc.)
- **Custom tags**: Team-scoped tags that persist across all team playbooks
- Both types can be used on plays

### 4. Team Libraries
Each team maintains their own libraries of:
- **Formations**: Offensive and defensive alignments
- **Personnel packages**: Player groupings (11 personnel, 12 personnel, etc.)
- **Route templates**: Reusable route patterns
- **Position labels**: Custom terminology (X/Y/Z vs F/A/B systems)

### 5. Template System
Formations and routes can be saved as templates to auto-populate new plays:
- Formation templates include player positioning data
- Route templates store complete path geometry
- Templates are instantiated with transformations (scale, rotation, position)

### 6. Basic Audit Logging
Track who changed what and when without full version snapshots:
- Field-level change tracking in JSONB
- Entity-level action history
- Supports collaborative editing accountability

### 7. One-to-One Player-Drawing Links
Players and drawings can be linked bidirectionally:
- Anchor point on drawing syncs with player position
- Merging prevented if both drawings have player links
- Enables route-player coordination

## PostgreSQL-Specific Features

### Why PostgreSQL?

1. **PostGIS Extension**: Advanced geometric/spatial queries for drawing control points and player positions
2. **JSONB with GIN Indexes**: Efficient querying of audit log changes
3. **Rich Type System**: Custom ENUMs, INET for IP addresses, native geometric types
4. **MVCC**: Superior concurrency control for collaborative editing
5. **Triggers & Functions**: Automatic `updated_at` management and spatial data sync

### Key PostgreSQL Capabilities Used

#### 1. Spatial Data (PostGIS)

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- GEOMETRY columns for spatial queries
location GEOMETRY(POINT, 4326)  -- WGS 84 coordinate system
```

**Benefits:**
- GIST indexes for spatial queries (merge detection, proximity searches)
- Automatic sync between `x,y` columns and `location` geometry via triggers
- Advanced spatial operations (distance, containment, intersection)

**Use cases:**
- Player position queries
- Control point merge detection
- Route snapping and alignment
- Collision detection

#### 2. JSONB

```sql
-- Audit log changes field
changes JSONB

-- Example data
{
  "name": {"old": "Power Left", "new": "Power Right"},
  "formation_id": {"old": 5, "new": 12}
}

-- GIN index for efficient queries
CREATE INDEX idx_audit_log_changes ON audit_log USING GIN(changes);
```

**Benefits:**
- Binary storage format for better performance than JSON
- Indexable with GIN indexes
- Efficient field-level change tracking
- Flexible schema for different entity types

**Query examples:**
```sql
-- Find all changes to a specific field
SELECT * FROM audit_log
WHERE changes ? 'formation_id';

-- Find changes where field has specific value
SELECT * FROM audit_log
WHERE changes @> '{"formation_id": {"new": 12}}';
```

#### 3. Custom Types

```sql
-- Strong typing via ENUMs
CREATE TYPE team_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE player_side AS ENUM ('offense', 'defense');
CREATE TYPE player_type AS ENUM ('lineman', 'skill');
CREATE TYPE segment_type AS ENUM ('line', 'quadratic', 'cubic');
CREATE TYPE line_style AS ENUM ('solid', 'dashed');
CREATE TYPE line_end AS ENUM ('none', 'arrow', 'tShape');
CREATE TYPE hash_position AS ENUM ('left', 'middle', 'right');
CREATE TYPE play_type AS ENUM ('pass', 'run');
CREATE TYPE share_permission AS ENUM ('view', 'edit');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'share', 'unshare');
```

**Benefits:**
- Type safety enforced at database level
- Self-documenting schema
- Invalid values rejected automatically
- Clear API contracts

#### 4. Auto-incrementing IDs

```sql
-- PostgreSQL's BIGSERIAL
id BIGSERIAL PRIMARY KEY

-- Equivalent to:
-- id BIGINT NOT NULL DEFAULT nextval('table_name_id_seq')
-- with sequence automatically created
```

**Benefits:**
- Cleaner syntax than MySQL's `BIGINT UNSIGNED AUTO_INCREMENT`
- Sequence-based (can be shared or customized)
- 64-bit range: -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807

#### 5. Triggers

```sql
-- Automatic updated_at management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Spatial data synchronization
CREATE OR REPLACE FUNCTION sync_player_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.x, NEW.y), 4326);
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER sync_player_location_trigger
    BEFORE INSERT OR UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION sync_player_location();
```

**Benefits:**
- Automatic data consistency (no application code needed)
- `x,y` columns always in sync with `location` geometry
- `updated_at` automatically maintained
- Centralized business logic

## URL Structure

Playbooks and plays are accessed via RESTful URLs:

```
play-smith.com/playbook/{playbookId}
play-smith.com/playbook/{playbookId}/play/{playId}
```

**Routing:**
- `/playbook/:playbookId` → Show playbook overview with list of plays
- `/playbook/:playbookId/play/:playId` → Show play editor for specific play

**Permissions check:**
- Verify user has access to playbook (team member OR playbook shared with user's team)
- Verify user has appropriate permission level (view vs edit)
- 404 if playbook doesn't exist or user lacks access (don't reveal existence)

## Database Indexes Summary

### Lookups
- `users.email` - Login queries
- `playbooks.team_id` - Team's playbooks
- `plays.playbook_id` - Playbook's plays
- `drawings.play_id`, `players.play_id` - Load play content
- `team_members(team_id, user_id)` - Permission checks

### Spatial Queries
- `control_points.location` (GIST) - Merge detection, snapping
- `players.location` (GIST) - Collision detection
- `control_points(x, y)` (B-tree) - Simple coordinate queries
- `players(x, y)` (B-tree) - Simple coordinate queries

### Audit & History
- `audit_log.created_at` - Recent activity
- `audit_log(entity_type, entity_id)` - Entity history
- `audit_log.changes` (GIN) - JSONB field queries

### Foreign Key Indexes
All FK columns automatically indexed for JOIN performance

## Migration Strategy

### Phase 1: Core Functionality
- Users, teams, team_members
- Playbooks, playbook_shares
- Plays with basic metadata
- Players and drawings (full normalization)

### Phase 2: Team Libraries
- Tags (preset + custom)
- Formations, personnel_packages
- Team position labels

### Phase 3: Templates & Automation
- Formation templates with player positioning
- Route templates with geometry
- Template instantiation logic

### Phase 4: Advanced Features
- Audit logging
- Drawing annotations
- Full collaborative editing features

## Key Takeaways

1. **Fully normalized structure** enables spatial queries, player-drawing linking, and merge prevention
2. **Team-scoped libraries** allow terminology and template customization per team
3. **Hybrid tag/position scoping** balances global consistency with team flexibility
4. **Template system** supports auto-population of formations and routes
5. **Audit log** provides accountability for collaborative editing without version storage overhead
6. **Future-ready** architecture supports versioning, advanced spatial features, and playbook marketplace
