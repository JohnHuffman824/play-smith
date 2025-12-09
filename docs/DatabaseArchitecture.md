# PlaySmith Database Architecture

## Overview

This document describes the MySQL database architecture for PlaySmith, an American football play and playbook creator.

### Key Design Decisions

1. **Team-based collaboration**: Full support for team ownership, collaborative editing, and read-only sharing between teams
2. **Fully normalized structure**: Control points, segments, and players stored in dedicated tables (not JSON blobs) for queryability and data integrity
3. **Hybrid tag scoping**: Preset tags are global, custom tags are team-scoped
4. **Team libraries**: Each team maintains their own libraries of formations, personnel packages, and route templates
5. **Template system**: Formations and routes can be saved as templates to auto-populate new plays
6. **Basic audit logging**: Track who changed what and when (without full version snapshots)
7. **One-to-one player-drawing links**: Players and drawings can be linked bidirectionally; merging is prevented if both drawings have player links

---

## Section 1: Core Entities (Users, Teams, Permissions)

### Users & Teams

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

CREATE TABLE teams (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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

**Permission model:**
- Teams own playbooks
- Team members inherit permissions through their role (owner > editor > viewer)
- Playbooks can be shared with other teams (see playbook_shares below)

### Playbook Ownership & Sharing

```sql
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

**Sharing model:**
- Playbooks belong to a team (owning team)
- Can be shared with other teams with 'view' or 'edit' permissions
- A user's effective permission = MAX(team_role, playbook_share_permission)
- Supports collaborative editing and read-only sharing

---

## Section 2: Playbooks & Plays

### Plays

```sql
CREATE TABLE plays (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    playbook_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255), -- "Play" field (e.g., "Power Left")
    formation_id BIGINT UNSIGNED, -- References team's formation library
    personnel_id BIGINT UNSIGNED, -- References team's personnel library
    defensive_formation_id BIGINT UNSIGNED, -- References team's formation library
    hash_position ENUM('left', 'middle', 'right') NOT NULL DEFAULT 'middle',
    notes TEXT, -- Optional coach notes
    display_order INT NOT NULL DEFAULT 0, -- For ordering within playbook
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE SET NULL,
    FOREIGN KEY (personnel_id) REFERENCES personnel_packages(id) ON DELETE SET NULL,
    FOREIGN KEY (defensive_formation_id) REFERENCES formations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_playbook (playbook_id),
    INDEX idx_formation (formation_id),
    INDEX idx_personnel (personnel_id)
);
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
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    play_id BIGINT UNSIGNED NOT NULL,
    tag_id BIGINT UNSIGNED NOT NULL,
    UNIQUE KEY unique_play_tag (play_id, tag_id),
    FOREIGN KEY (play_id) REFERENCES plays(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    INDEX idx_tag (tag_id)
);
```

**Tag relationships:**
- Many plays can have the same tag
- Tags are defined in Section 4 (preset global + custom team-scoped)

---

## Section 3: Players & Drawings (Fully Normalized)

### Team Position Terminology

Each team configures their own position labels (e.g., "X/Y/Z" vs "F/A/B" systems):

```sql
CREATE TABLE team_position_labels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT UNSIGNED NOT NULL,
    side ENUM('offense', 'defense') NOT NULL,
    label VARCHAR(2) NOT NULL, -- 1-2 character designation (e.g., 'X', 'F', 'DE', 'CB')
    description VARCHAR(100), -- Optional description (e.g., "Split End", "Fullback")
    display_order INT NOT NULL DEFAULT 0, -- Order for UI display
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_side_label (team_id, side, label),
    INDEX idx_team_side (team_id, side)
);
```

**Position label system:**
- Teams define their own offensive and defensive position labels
- When a team is created, seed with default preset labels based on their chosen system
- Settings allow choosing preset systems (X/Y/Z/A/B/Q, X/Y/Z/F/T/Q) or fully custom
- Players reference these labels via the `players.label` field

### Players

All players (linemen, skill, offensive, defensive) stored in a single table:

```sql
CREATE TABLE players (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    play_id BIGINT UNSIGNED NOT NULL,
    side ENUM('offense', 'defense') NOT NULL DEFAULT 'offense',
    type ENUM('lineman', 'skill') NOT NULL,
    position VARCHAR(50), -- Physical position: 'C', 'LG', 'RG', 'LT', 'RT' for linemen
    label VARCHAR(2), -- Team's terminology (1-2 chars): 'F', 'X', 'Y', 'DE', 'CB', etc.
    x DECIMAL(10, 2) NOT NULL, -- Position in feet
    y DECIMAL(10, 2) NOT NULL, -- Position in feet
    color VARCHAR(7) NOT NULL DEFAULT '#000000', -- Hex color
    linked_drawing_id BIGINT UNSIGNED, -- If player is linked to a drawing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (play_id) REFERENCES plays(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_drawing_id) REFERENCES drawings(id) ON DELETE SET NULL,
    INDEX idx_play (play_id),
    INDEX idx_side (side),
    INDEX idx_type (type),
    INDEX idx_position (x, y) -- For spatial queries
);
```

**Player details:**
- **Side**: Distinguish offensive vs defensive players
- **Type**: `lineman` (auto-created, 5 per play) vs `skill` (manually added)
- **Position**: Physical location designation (C, LG, RG for linemen)
- **Label**: Team-specific terminology (references team's position label system)
- **Linking**: `linked_drawing_id` creates bidirectional sync with drawings

### Drawings

```sql
CREATE TABLE drawings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    play_id BIGINT UNSIGNED NOT NULL,
    linked_player_id BIGINT UNSIGNED, -- If drawing is linked to a player
    linked_point_id BIGINT UNSIGNED, -- Which control point is anchored to the player
    template_id BIGINT UNSIGNED, -- If created from a route template
    -- Style properties (drawing-level)
    style_color VARCHAR(7) NOT NULL DEFAULT '#000000',
    style_stroke_width DECIMAL(5, 2) NOT NULL DEFAULT 2.0,
    style_line_style ENUM('solid', 'dashed') NOT NULL DEFAULT 'solid',
    style_line_end ENUM('none', 'arrow', 'tShape') NOT NULL DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (play_id) REFERENCES plays(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_player_id) REFERENCES players(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_point_id) REFERENCES control_points(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES route_templates(id) ON DELETE SET NULL,
    INDEX idx_play (play_id),
    INDEX idx_linked_player (linked_player_id)
);
```

**Drawing details:**
- **Linking**: Both `linked_player_id` and `linked_point_id` track bidirectional player-drawing relationship
- **Styling**: All style properties at drawing level (one style per complete route)
- **Line end placement**: The `style_line_end` (arrow/tShape) is rendered on control points with `type='end'`
- **Merge prevention**: Application logic prevents merging two drawings if both have `linked_player_id` set

### Segments

```sql
CREATE TABLE segments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    drawing_id BIGINT UNSIGNED NOT NULL,
    segment_index INT NOT NULL, -- Order within the drawing (0, 1, 2...)
    type ENUM('line', 'quadratic', 'cubic') NOT NULL DEFAULT 'line',
    FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE,
    INDEX idx_drawing (drawing_id),
    UNIQUE KEY unique_drawing_segment (drawing_id, segment_index)
);
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
CREATE TABLE control_points (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    segment_id BIGINT UNSIGNED NOT NULL,
    point_index INT NOT NULL, -- Order within the segment (0, 1, 2...)
    type ENUM('start', 'end', 'corner', 'curve') NOT NULL,
    x DECIMAL(10, 2) NOT NULL, -- Position in feet
    y DECIMAL(10, 2) NOT NULL, -- Position in feet
    -- Bezier curve handles (nullable, only used for quadratic/cubic segments)
    handle_in_x DECIMAL(10, 2),
    handle_in_y DECIMAL(10, 2),
    handle_out_x DECIMAL(10, 2),
    handle_out_y DECIMAL(10, 2),
    FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE,
    INDEX idx_segment (segment_id),
    INDEX idx_position (x, y), -- For spatial queries (merge detection, snapping)
    UNIQUE KEY unique_segment_point (segment_id, point_index)
);
```

**Control point details:**
- Stores exact position and type of each node in the drawing
- **Bezier handles**: `handle_in/handle_out` coordinates support curved segments (quadratic/cubic)
- **Spatial indexing**: Enables merge detection (find nearby points) and snap-to-grid features
- **Line end rendering**: Points with `type='end'` receive the drawing's `style_line_end` decoration (arrow/tShape)

### Drawing Annotations

```sql
CREATE TABLE drawing_annotations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    drawing_id BIGINT UNSIGNED NOT NULL,
    point_index INT NOT NULL, -- Which point along the route this annotation is at
    type ENUM('marker', 'text', 'icon') NOT NULL,
    content TEXT NOT NULL, -- Annotation content (e.g., "12-yard break", "head fake here")
    offset_x DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Offset from point position
    offset_y DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE,
    INDEX idx_drawing (drawing_id)
);
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
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT UNSIGNED, -- NULL for preset tags, set for custom team tags
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    is_preset BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_team (team_id),
    INDEX idx_preset (is_preset),
    UNIQUE KEY unique_tag_name (team_id, name) -- Prevents duplicates within team scope
);
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
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., "I-Formation", "Spread", "Trips Right"
    description TEXT,
    is_template BOOLEAN NOT NULL DEFAULT FALSE, -- Has player positioning data?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_team (team_id),
    UNIQUE KEY unique_team_formation (team_id, name)
);
```

**Formation usage:**
- Referenced by `plays.formation_id` and `plays.defensive_formation_id`
- When `is_template=TRUE`, the formation includes player positioning data (see below)
- Teams can create both simple name-only formations and full templates

### Formation Templates (Player Positioning)

```sql
CREATE TABLE formation_template_players (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    formation_id BIGINT UNSIGNED NOT NULL,
    side ENUM('offense', 'defense') NOT NULL,
    position_label VARCHAR(2), -- References team's position labels (e.g., 'X', 'F', 'RB')
    x DECIMAL(10, 2) NOT NULL, -- Position in feet (relative to hash_position)
    y DECIMAL(10, 2) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#000000',
    FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE,
    INDEX idx_formation (formation_id)
);
```

**Template behavior:**
- When a user selects a formation with `is_template=TRUE`, auto-populate players at these positions
- Positions are relative to the play's `hash_position` setting (left/middle/right)
- Linemen (C, LG, RG, LT, RT) are always auto-created separately based on hash position

### Personnel Packages Library

```sql
CREATE TABLE personnel_packages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(50) NOT NULL, -- e.g., "11 Personnel", "12 Personnel", "Trips Heavy"
    code VARCHAR(10), -- Optional shorthand (e.g., "11", "12", "21")
    description TEXT, -- e.g., "1 RB, 1 TE, 3 WR"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_team (team_id),
    UNIQUE KEY unique_team_personnel (team_id, name)
);
```

**Personnel usage:**
- Referenced by `plays.personnel_id`
- Preset packages (11, 10, 12, 13, 21, 22) seeded when team is created
- Teams can add custom packages with any naming

### Route Templates Library

```sql
CREATE TABLE route_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., "Go Route", "Slant", "Corner", "Stick Concept"
    description TEXT,
    -- Style defaults for instantiated routes
    default_color VARCHAR(7) NOT NULL DEFAULT '#000000',
    default_stroke_width DECIMAL(5, 2) NOT NULL DEFAULT 2.0,
    default_line_style ENUM('solid', 'dashed') NOT NULL DEFAULT 'solid',
    default_line_end ENUM('none', 'arrow', 'tShape') NOT NULL DEFAULT 'arrow',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_team (team_id),
    UNIQUE KEY unique_team_route (team_id, name)
);
```

**Route template structure:**

Templates store the path geometry (segments and control points) that can be instantiated onto plays:

```sql
CREATE TABLE route_template_segments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    route_template_id BIGINT UNSIGNED NOT NULL,
    segment_index INT NOT NULL,
    type ENUM('line', 'quadratic', 'cubic') NOT NULL DEFAULT 'line',
    FOREIGN KEY (route_template_id) REFERENCES route_templates(id) ON DELETE CASCADE,
    INDEX idx_template (route_template_id),
    UNIQUE KEY unique_template_segment (route_template_id, segment_index)
);

CREATE TABLE route_template_control_points (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_segment_id BIGINT UNSIGNED NOT NULL,
    point_index INT NOT NULL,
    type ENUM('start', 'end', 'corner', 'curve') NOT NULL,
    x DECIMAL(10, 2) NOT NULL, -- Relative position
    y DECIMAL(10, 2) NOT NULL,
    handle_in_x DECIMAL(10, 2),
    handle_in_y DECIMAL(10, 2),
    handle_out_x DECIMAL(10, 2),
    handle_out_y DECIMAL(10, 2),
    FOREIGN KEY (template_segment_id) REFERENCES route_template_segments(id) ON DELETE CASCADE,
    INDEX idx_template_segment (template_segment_id),
    UNIQUE KEY unique_template_point (template_segment_id, point_index)
);
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
CREATE TABLE audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    playbook_id BIGINT UNSIGNED, -- Optional: associate with playbook for filtering
    entity_type VARCHAR(50) NOT NULL, -- 'play', 'drawing', 'player', 'playbook', 'tag', etc.
    entity_id BIGINT UNSIGNED NOT NULL, -- ID of the changed entity
    action ENUM('create', 'update', 'delete', 'share', 'unshare') NOT NULL,
    changes JSON, -- What changed: {"field": {"old": "value", "new": "value"}}
    ip_address VARCHAR(45), -- For security tracking
    user_agent TEXT, -- Browser/client information
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE SET NULL,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user (user_id),
    INDEX idx_playbook (playbook_id),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
);
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
