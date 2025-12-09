# PlaySmith Database Architecture

## Overview

This document describes the PostgreSQL database architecture for PlaySmith, an American football play and playbook creator.

### Key Design Decisions

1. **Team-based collaboration**: Full support for team ownership, collaborative editing, and read-only sharing between teams
2. **Fully normalized structure**: Control points, segments, and players stored in dedicated tables (not JSON blobs) for queryability and data integrity
3. **Hybrid tag scoping**: Preset tags are global, custom tags are team-scoped
4. **Team libraries**: Each team maintains their own libraries of formations, personnel packages, and route templates
5. **Template system**: Formations and routes can be saved as templates to auto-populate new plays
6. **Basic audit logging**: Track who changed what and when (without full version snapshots)
7. **One-to-one player-drawing links**: Players and drawings can be linked bidirectionally; merging is prevented if both drawings have player links

### PostgreSQL-Specific Features

**Why PostgreSQL:**
- **PostGIS Extension**: Advanced geometric/spatial queries for drawing control points and player positions
- **JSONB with GIN Indexes**: Efficient querying of audit log changes
- **Rich Type System**: Custom ENUMs, INET for IP addresses, native geometric types
- **MVCC**: Superior concurrency control for collaborative editing
- **Triggers & Functions**: Automatic `updated_at` management and spatial data sync

**Key PostgreSQL Capabilities Used:**
1. **Spatial Data (PostGIS)**:
   - `GEOMETRY(POINT, 4326)` columns for player and control point locations
   - GIST indexes for spatial queries (merge detection, proximity searches)
   - Automatic sync between `x,y` columns and `location` geometry via triggers

2. **JSONB**:
   - Audit log `changes` field uses JSONB for efficient queries
   - GIN indexes enable fast "show me all changes to field X" queries
   - Binary storage format for better performance than JSON

3. **Custom Types**:
   - Strong typing via ENUMs (team_role, player_side, player_type, etc.)
   - Type safety enforced at database level

4. **Auto-incrementing IDs**:
   - `BIGSERIAL` instead of MySQL's `BIGINT UNSIGNED AUTO_INCREMENT`
   - Sequence-based, cleaner syntax

5. **Triggers**:
   - Automatic `updated_at` timestamp updates
   - Spatial data synchronization (x,y ↔ location)

---

## Section 1: Core Entities (Users, Teams, Permissions)

### Users & Teams

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

**Permission model:**
- Teams own playbooks
- Team members inherit permissions through their role (owner > editor > viewer)
- Playbooks can be shared with other teams (see playbook_shares below)

### Playbook Ownership & Sharing

```sql
CREATE TYPE share_permission AS ENUM ('view', 'edit');

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

**Sharing model:**
- Playbooks belong to a team (owning team)
- Can be shared with other teams with 'view' or 'edit' permissions
- A user's effective permission = MAX(team_role, playbook_share_permission)
- Supports collaborative editing and read-only sharing

---

## Section 2: Playbooks & Plays

### Plays

```sql
CREATE TYPE hash_position AS ENUM ('left', 'middle', 'right');

CREATE TABLE plays (
    id BIGSERIAL PRIMARY KEY,
    playbook_id BIGINT NOT NULL,
    name VARCHAR(255), -- "Play" field (e.g., "Power Left")
    formation_id BIGINT, -- References team's formation library
    personnel_id BIGINT, -- References team's personnel library
    defensive_formation_id BIGINT, -- References team's formation library
    hash_position hash_position NOT NULL DEFAULT 'middle',
    notes TEXT, -- Optional coach notes
    display_order INT NOT NULL DEFAULT 0, -- For ordering within playbook
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE SET NULL,
    FOREIGN KEY (personnel_id) REFERENCES personnel_packages(id) ON DELETE SET NULL,
    FOREIGN KEY (defensive_formation_id) REFERENCES formations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_plays_playbook ON plays(playbook_id);
CREATE INDEX idx_plays_formation ON plays(formation_id);
CREATE INDEX idx_plays_personnel ON plays(personnel_id);

CREATE TRIGGER update_plays_updated_at BEFORE UPDATE ON plays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Play structure:**
- Each play belongs to a playbook
- References team library entries for formation, personnel, defensive formation
- `hash_position` determines the base positioning of the 5 offensive linemen
- `display_order` allows custom ordering within a playbook (drag to reorder)
- Formation/personnel/defensive_formation are nullable (can be free-form or unset)

### Play Tags (Many-to-Many)

```sql
CREATE TABLE play_tags (
    id BIGSERIAL PRIMARY KEY,
    play_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    UNIQUE (play_id, tag_id),
    FOREIGN KEY (play_id) REFERENCES plays(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_play_tags_tag ON play_tags(tag_id);
CREATE INDEX idx_play_tags_play ON play_tags(play_id);
```

**Tag relationships:**
- Many plays can have the same tag
- Tags are defined in Section 4 (preset global + custom team-scoped)

---

## Section 3: Players & Drawings (Fully Normalized)

### Team Position Terminology

Each team configures their own position labels (e.g., "X/Y/Z" vs "F/A/B" systems):

```sql
CREATE TYPE player_side AS ENUM ('offense', 'defense');

CREATE TABLE team_position_labels (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    side player_side NOT NULL,
    label VARCHAR(2) NOT NULL, -- 1-2 character designation (e.g., 'X', 'F', 'DE', 'CB')
    description VARCHAR(100), -- Optional description (e.g., "Split End", "Fullback")
    display_order INT NOT NULL DEFAULT 0, -- Order for UI display
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE (team_id, side, label)
);

CREATE INDEX idx_team_position_labels_team_side ON team_position_labels(team_id, side);
```

**Position label system:**
- Teams define their own offensive and defensive position labels
- When a team is created, seed with default preset labels based on their chosen system
- Settings allow choosing preset systems (X/Y/Z/A/B/Q, X/Y/Z/F/T/Q) or fully custom
- Players reference these labels via the `players.label` field

### Players

All players (linemen, skill, offensive, defensive) stored in a single table:

```sql
-- Enable PostGIS extension for geometric types
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE player_type AS ENUM ('lineman', 'skill');

CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    play_id BIGINT NOT NULL,
    side player_side NOT NULL DEFAULT 'offense',
    type player_type NOT NULL,
    position VARCHAR(50), -- Physical position: 'C', 'LG', 'RG', 'LT', 'RT' for linemen
    label VARCHAR(2), -- Team's terminology (1-2 chars): 'F', 'X', 'Y', 'DE', 'CB', etc.
    -- Geometric position (PostGIS POINT type for advanced spatial queries)
    location GEOMETRY(POINT, 4326), -- SRID 4326 (WGS 84) for standard coordinate system
    -- Also store as separate columns for backward compatibility and simple queries
    x DECIMAL(10, 2) NOT NULL, -- Position in feet
    y DECIMAL(10, 2) NOT NULL, -- Position in feet
    color VARCHAR(7) NOT NULL DEFAULT '#000000', -- Hex color
    linked_drawing_id BIGINT, -- If player is linked to a drawing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (play_id) REFERENCES plays(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_drawing_id) REFERENCES drawings(id) ON DELETE SET NULL
);

CREATE INDEX idx_players_play ON players(play_id);
CREATE INDEX idx_players_side ON players(side);
CREATE INDEX idx_players_type ON players(type);
-- Spatial index using PostGIS
CREATE INDEX idx_players_location ON players USING GIST(location);
-- B-tree index for simple coordinate queries
CREATE INDEX idx_players_coordinates ON players(x, y);

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to keep location in sync with x, y columns
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

**Player details:**
- **Side**: Distinguish offensive vs defensive players
- **Type**: `lineman` (auto-created, 5 per play) vs `skill` (manually added)
- **Position**: Physical location designation (C, LG, RG for linemen)
- **Label**: Team-specific terminology (references team's position label system)
- **Linking**: `linked_drawing_id` creates bidirectional sync with drawings

### Drawings

```sql
CREATE TYPE line_style AS ENUM ('solid', 'dashed');
CREATE TYPE line_end AS ENUM ('none', 'arrow', 'tShape');

CREATE TABLE drawings (
    id BIGSERIAL PRIMARY KEY,
    play_id BIGINT NOT NULL,
    linked_player_id BIGINT, -- If drawing is linked to a player
    linked_point_id BIGINT, -- Which control point is anchored to the player
    template_id BIGINT, -- If created from a route template
    -- Style properties (drawing-level)
    style_color VARCHAR(7) NOT NULL DEFAULT '#000000',
    style_stroke_width DECIMAL(5, 2) NOT NULL DEFAULT 2.0,
    style_line_style line_style NOT NULL DEFAULT 'solid',
    style_line_end line_end NOT NULL DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (play_id) REFERENCES plays(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_player_id) REFERENCES players(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_point_id) REFERENCES control_points(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES route_templates(id) ON DELETE SET NULL
);

CREATE INDEX idx_drawings_play ON drawings(play_id);
CREATE INDEX idx_drawings_linked_player ON drawings(linked_player_id);

CREATE TRIGGER update_drawings_updated_at BEFORE UPDATE ON drawings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Drawing details:**
- **Linking**: Both `linked_player_id` and `linked_point_id` track bidirectional player-drawing relationship
- **Styling**: All style properties at drawing level (one style per complete route)
- **Line end placement**: The `style_line_end` (arrow/tShape) is rendered on control points with `type='end'`
- **Merge prevention**: Application logic prevents merging two drawings if both have `linked_player_id` set

### Segments

```sql
CREATE TYPE segment_type AS ENUM ('line', 'quadratic', 'cubic');

CREATE TABLE segments (
    id BIGSERIAL PRIMARY KEY,
    drawing_id BIGINT NOT NULL,
    segment_index INT NOT NULL, -- Order within the drawing (0, 1, 2...)
    type segment_type NOT NULL DEFAULT 'line',
    FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE,
    UNIQUE (drawing_id, segment_index)
);

CREATE INDEX idx_segments_drawing ON segments(drawing_id);
```

**Segment details:**
- Multiple segments per drawing, ordered by `segment_index`
- **Segment types:**
  - `line`: Straight line segment
  - `quadratic`: Quadratic Bezier curve (1 control point with handles)
  - `cubic`: Cubic Bezier curve (2+ control points with handles)
- Supports both straight and curved drawing paths

### Control Points

```sql
CREATE TYPE point_type AS ENUM ('start', 'end', 'corner', 'curve');

CREATE TABLE control_points (
    id BIGSERIAL PRIMARY KEY,
    segment_id BIGINT NOT NULL,
    point_index INT NOT NULL, -- Order within the segment (0, 1, 2...)
    type point_type NOT NULL,
    -- Geometric position (PostGIS POINT for spatial queries)
    location GEOMETRY(POINT, 4326),
    -- Also store as separate columns for simple queries
    x DECIMAL(10, 2) NOT NULL, -- Position in feet
    y DECIMAL(10, 2) NOT NULL, -- Position in feet
    -- Bezier curve handles (nullable, only used for quadratic/cubic segments)
    handle_in_x DECIMAL(10, 2),
    handle_in_y DECIMAL(10, 2),
    handle_out_x DECIMAL(10, 2),
    handle_out_y DECIMAL(10, 2),
    FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE,
    UNIQUE (segment_id, point_index)
);

CREATE INDEX idx_control_points_segment ON control_points(segment_id);
-- PostGIS spatial index for merge detection and snapping
CREATE INDEX idx_control_points_location ON control_points USING GIST(location);
-- B-tree index for simple coordinate queries
CREATE INDEX idx_control_points_coordinates ON control_points(x, y);

-- Trigger to keep location in sync with x, y columns
CREATE TRIGGER sync_control_point_location_trigger
    BEFORE INSERT OR UPDATE ON control_points
    FOR EACH ROW EXECUTE FUNCTION sync_player_location();
```

**Control point details:**
- Stores exact position and type of each node in the drawing
- **Bezier handles**: `handle_in/handle_out` coordinates support curved segments (quadratic/cubic)
- **Spatial indexing**: Enables merge detection (find nearby points) and snap-to-grid features
- **Line end rendering**: Points with `type='end'` receive the drawing's `style_line_end` decoration (arrow/tShape)

### Drawing Annotations

```sql
CREATE TYPE annotation_type AS ENUM ('marker', 'text', 'icon');

CREATE TABLE drawing_annotations (
    id BIGSERIAL PRIMARY KEY,
    drawing_id BIGINT NOT NULL,
    point_index INT NOT NULL, -- Which point along the route this annotation is at
    type annotation_type NOT NULL,
    content TEXT NOT NULL, -- Annotation content (e.g., "12-yard break", "head fake here")
    offset_x DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Offset from point position
    offset_y DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE
);

CREATE INDEX idx_drawing_annotations_drawing ON drawing_annotations(drawing_id);

CREATE TRIGGER update_drawing_annotations_updated_at BEFORE UPDATE ON drawing_annotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Annotation support:**
- Future feature for adding coach notes at specific points on routes
- Examples: "12-yard break", "stack the DB", "look for safety rotation"
- Offset allows positioning annotation relative to the route point

---

## Section 4: Tags

### Tag System (Hybrid Scoping)

Tags are used to categorize plays (e.g., "Short Yardage", "Red Zone", "Third Down"). We use hybrid scoping: preset tags are global, custom tags are team-specific.

```sql
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT, -- NULL for preset tags, set for custom team tags
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    is_preset BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE (team_id, name) -- Prevents duplicates within team scope
);

CREATE INDEX idx_tags_team ON tags(team_id);
CREATE INDEX idx_tags_preset ON tags(is_preset);

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Tag scoping:**
- **Preset tags** (`is_preset=TRUE`, `team_id=NULL`): Available to all teams
  - Short Yardage (#00FF00 - Green)
  - Mid Yardage (#FFFF00 - Yellow)
  - Long Yardage (#FFA500 - Orange)
  - Redzone (#FF0000 - Red)
- **Custom tags** (`is_preset=FALSE`, `team_id` set): Team-specific, persist across all team playbooks
- Teams can use both preset and custom tags on their plays
- When sharing playbooks between teams, tags are included (but custom tags remain team-owned)

**Note:** The `play_tags` junction table (defined in Section 2) creates the many-to-many relationship between plays and tags.

---

## Section 5: Team Libraries & Templates

Teams build their own libraries of formations, personnel packages, and route templates. These support auto-population of new plays.

### Formations Library

```sql
CREATE TABLE formations (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., "I-Formation", "Spread", "Trips Right"
    description TEXT,
    is_template BOOLEAN NOT NULL DEFAULT FALSE, -- Has player positioning data?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE (team_id, name)
);

CREATE INDEX idx_formations_team ON formations(team_id);

CREATE TRIGGER update_formations_updated_at BEFORE UPDATE ON formations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Formation usage:**
- Referenced by `plays.formation_id` and `plays.defensive_formation_id`
- When `is_template=TRUE`, the formation includes player positioning data (see below)
- Teams can create both simple name-only formations and full templates

### Formation Templates (Player Positioning)

```sql
CREATE TABLE formation_template_players (
    id BIGSERIAL PRIMARY KEY,
    formation_id BIGINT NOT NULL,
    side player_side NOT NULL,
    position_label VARCHAR(2), -- References team's position labels (e.g., 'X', 'F', 'RB')
    x DECIMAL(10, 2) NOT NULL, -- Position in feet (relative to hash_position)
    y DECIMAL(10, 2) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#000000',
    FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE
);

CREATE INDEX idx_formation_template_players_formation ON formation_template_players(formation_id);
```

**Template behavior:**
- When a user selects a formation with `is_template=TRUE`, auto-populate players at these positions
- Positions are relative to the play's `hash_position` setting (left/middle/right)
- Linemen (C, LG, RG, LT, RT) are always auto-created separately based on hash position

### Personnel Packages Library

```sql
CREATE TABLE personnel_packages (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL, -- e.g., "11 Personnel", "12 Personnel", "Trips Heavy"
    code VARCHAR(10), -- Optional shorthand (e.g., "11", "12", "21")
    description TEXT, -- e.g., "1 RB, 1 TE, 3 WR"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE (team_id, name)
);

CREATE INDEX idx_personnel_packages_team ON personnel_packages(team_id);

CREATE TRIGGER update_personnel_packages_updated_at BEFORE UPDATE ON personnel_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Personnel usage:**
- Referenced by `plays.personnel_id`
- Preset packages (11, 10, 12, 13, 21, 22) seeded when team is created
- Teams can add custom packages with any naming

### Route Templates Library

```sql
CREATE TABLE route_templates (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., "Go Route", "Slant", "Corner", "Stick Concept"
    description TEXT,
    -- Style defaults for instantiated routes
    default_color VARCHAR(7) NOT NULL DEFAULT '#000000',
    default_stroke_width DECIMAL(5, 2) NOT NULL DEFAULT 2.0,
    default_line_style line_style NOT NULL DEFAULT 'solid',
    default_line_end line_end NOT NULL DEFAULT 'arrow',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE (team_id, name)
);

CREATE INDEX idx_route_templates_team ON route_templates(team_id);

CREATE TRIGGER update_route_templates_updated_at BEFORE UPDATE ON route_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Route template structure:**

Templates store the path geometry (segments and control points) that can be instantiated onto plays:

```sql
CREATE TABLE route_template_segments (
    id BIGSERIAL PRIMARY KEY,
    route_template_id BIGINT NOT NULL,
    segment_index INT NOT NULL,
    type segment_type NOT NULL DEFAULT 'line',
    FOREIGN KEY (route_template_id) REFERENCES route_templates(id) ON DELETE CASCADE,
    UNIQUE (route_template_id, segment_index)
);

CREATE INDEX idx_route_template_segments_template ON route_template_segments(route_template_id);

CREATE TABLE route_template_control_points (
    id BIGSERIAL PRIMARY KEY,
    template_segment_id BIGINT NOT NULL,
    point_index INT NOT NULL,
    type point_type NOT NULL,
    x DECIMAL(10, 2) NOT NULL, -- Relative position
    y DECIMAL(10, 2) NOT NULL,
    handle_in_x DECIMAL(10, 2),
    handle_in_y DECIMAL(10, 2),
    handle_out_x DECIMAL(10, 2),
    handle_out_y DECIMAL(10, 2),
    FOREIGN KEY (template_segment_id) REFERENCES route_template_segments(id) ON DELETE CASCADE,
    UNIQUE (template_segment_id, point_index)
);

CREATE INDEX idx_route_template_control_points_segment ON route_template_control_points(template_segment_id);
```

**Template instantiation:**
- When a user selects a route template, create new drawing/segments/control_points records
- Copy the template geometry, applying any transformations (scale, rotation, position)
- Set `drawings.template_id` to track which template was used
- `drawings.template_params` (JSON) can store instantiation parameters (e.g., depth, break point)

---

## Section 6: Audit Logging

Basic audit trail to track who changed what and when. Supports collaborative editing accountability without full version history.

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

**Audit log usage:**
- **Create**: New play, drawing, player, etc. created
- **Update**: Changes to existing entities (store field-level changes in JSON)
- **Delete**: Entity removed
- **Share/Unshare**: Playbook sharing events

**Example changes JSON:**
```json
{
  "name": {"old": "Power Left", "new": "Power Right"},
  "formation_id": {"old": 5, "new": 12}
}
```

**Querying patterns:**
- "Show me all changes to this play" → filter by `entity_type='play'` and `entity_id`
- "Who edited this playbook today?" → filter by `playbook_id` and `created_at`
- "What did this user change?" → filter by `user_id`

**Future expansion:**
- Can add full versioning later by storing complete snapshots in a separate `entity_versions` table
- Audit log provides the timeline; versions table would provide point-in-time restoration

---

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

---

## Database Indexes Summary

Key indexes for performance:

**Lookups:**
- `users.email` - Login queries
- `playbooks.team_id` - Team's playbooks
- `plays.playbook_id` - Playbook's plays
- `drawings.play_id`, `players.play_id` - Load play content
- `team_members(team_id, user_id)` - Permission checks

**Spatial queries:**
- `control_points(x, y)` - Merge detection, snapping
- `players(x, y)` - Collision detection

**Audit & history:**
- `audit_log.created_at` - Recent activity
- `audit_log.entity` - Entity history

**Foreign key indexes:**
- All FK columns automatically indexed for JOIN performance

---

## Migration Strategy

**Phase 1: Core functionality (SQLite → MySQL)**
- Users, teams, team_members
- Playbooks, playbook_shares
- Plays with basic metadata
- Players and drawings (full normalization)

**Phase 2: Team libraries**
- Tags (preset + custom)
- Formations, personnel_packages
- Team position labels

**Phase 3: Templates & automation**
- Formation templates with player positioning
- Route templates with geometry
- Template instantiation logic

**Phase 4: Advanced features**
- Audit logging
- Drawing annotations
- Full collaborative editing features

---

## Key Takeaways

1. **Fully normalized structure** enables spatial queries, player-drawing linking, and merge prevention
2. **Team-scoped libraries** allow terminology and template customization per team
3. **Hybrid tag/position scoping** balances global consistency with team flexibility
4. **Template system** supports auto-population of formations and routes
5. **Audit log** provides accountability for collaborative editing without version storage overhead
6. **Future-ready** architecture supports versioning, advanced spatial features, and playbook marketplace
