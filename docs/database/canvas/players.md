# Players

This document describes player positioning on the play canvas.

## Overview

All players (offensive, defensive, linemen, skill positions) are stored in a single normalized table:
- PostGIS spatial data for advanced queries
- Bidirectional linking with drawings (routes)
- Team-specific position labels
- Automatic linemen generation based on hash position

## Table

### players

```sql
-- Enable PostGIS extension for geometric types
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE player_side AS ENUM ('offense', 'defense');
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

**Fields:**
- `id`: Unique identifier
- `play_id`: Parent play
- `side`: offense or defense
- `type`: lineman (auto-created) or skill (manually added)
- `position`: Physical position (C, LG, RG, LT, RT for linemen)
- `label`: Team-specific terminology (X, Y, Z, F, A, B, DE, CB, etc.)
- `location`: PostGIS POINT geometry for spatial queries
- `x`, `y`: Coordinates in feet (synced with location via trigger)
- `color`: Hex color code for display
- `linked_drawing_id`: Reference to drawing (route) if linked
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- `ON DELETE CASCADE` for `play_id`: Remove players when play deleted
- `ON DELETE SET NULL` for `linked_drawing_id`: Unlink if drawing deleted

**Indexes:**
- `idx_players_play`: Find all players for a play
- `idx_players_side`: Filter by offense/defense
- `idx_players_type`: Filter by lineman/skill
- `idx_players_location` (GIST): Spatial queries (proximity, containment)
- `idx_players_coordinates` (B-tree): Simple coordinate lookups

## Player Types

### Linemen (type='lineman')

Auto-created when play is created. Always 5 offensive linemen:
- **C**: Center (x=0, y=0 at middle hash)
- **LG**: Left Guard (x=-2, y=0)
- **RG**: Right Guard (x=2, y=0)
- **LT**: Left Tackle (x=-4, y=0)
- **RT**: Right Tackle (x=4, y=0)

Positions adjusted based on `plays.hash_position` (left/middle/right).

### Skill Players (type='skill')

Manually added by users. Can be:
- **Offensive**: QB, RB, WR, TE, FB, etc.
- **Defensive**: DE, DT, LB, CB, S, etc.

Position determined by:
1. Formation template (if play uses formation with `is_template=TRUE`)
2. Manual placement by user

## Position Labels

The `label` field uses team-specific terminology defined in `team_position_labels`:

```sql
-- Example team position labels
INSERT INTO team_position_labels (team_id, side, label, description, display_order)
VALUES
  (1, 'offense', 'X', 'Split End', 1),
  (1, 'offense', 'Y', 'Tight End', 2),
  (1, 'offense', 'Z', 'Flanker', 3),
  (1, 'offense', 'F', 'Fullback', 4),
  (1, 'offense', 'R', 'Running Back', 5),
  (1, 'offense', 'Q', 'Quarterback', 6);
```

See [../organization/formations.md](../organization/formations.md) for team position label details.

## Player-Drawing Linking

Players can be linked to drawings (routes) for synchronized movement:

```
players.linked_drawing_id → drawings.id
drawings.linked_player_id → players.id
drawings.linked_point_id → control_points.id
```

**Linking workflow:**
1. User creates player (e.g., WR at position X)
2. User creates route (drawing)
3. User links route to player
4. `players.linked_drawing_id` = drawing ID
5. `drawings.linked_player_id` = player ID
6. `drawings.linked_point_id` = first control point (anchor)

**Bidirectional sync:**
- When player moves, linked drawing's anchor point moves
- When drawing's anchor point moves, linked player moves
- Prevents merge if both drawings have player links

## PostGIS Spatial Features

### Spatial Queries

```sql
-- Find players within 10 feet of a point
SELECT * FROM players
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(?, ?), 4326),
  10
);

-- Find nearest player to a point
SELECT *, ST_Distance(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)) as distance
FROM players
WHERE play_id = ?
ORDER BY location <-> ST_SetSRID(ST_MakePoint(?, ?), 4326)
LIMIT 1;

-- Check if player is within a polygon (e.g., red zone)
SELECT * FROM players
WHERE ST_Contains(
  ST_MakePolygon(ST_GeomFromText('LINESTRING(...)')),
  location
);
```

### Collision Detection

```sql
-- Find players too close to each other (< 3 feet)
SELECT
  p1.id as player1_id,
  p2.id as player2_id,
  ST_Distance(p1.location, p2.location) as distance
FROM players p1
JOIN players p2 ON p2.play_id = p1.play_id AND p2.id > p1.id
WHERE p1.play_id = ?
AND ST_DWithin(p1.location, p2.location, 3)
ORDER BY distance;
```

## Example Queries

### Get all players for a play

```sql
SELECT
  id,
  side,
  type,
  position,
  label,
  x,
  y,
  color,
  linked_drawing_id IS NOT NULL as is_linked
FROM players
WHERE play_id = ?
ORDER BY
  side,  -- offense first, then defense
  CASE type WHEN 'lineman' THEN 0 ELSE 1 END,  -- linemen first
  position,  -- C, LG, RG, LT, RT
  label;
```

### Create offensive linemen for new play

```sql
-- Based on hash_position (e.g., 'middle')
INSERT INTO players (play_id, side, type, position, x, y, color)
VALUES
  (?, 'offense', 'lineman', 'C', 0, 0, '#000000'),
  (?, 'offense', 'lineman', 'LG', -2, 0, '#000000'),
  (?, 'offense', 'lineman', 'RG', 2, 0, '#000000'),
  (?, 'offense', 'lineman', 'LT', -4, 0, '#000000'),
  (?, 'offense', 'lineman', 'RT', 4, 0, '#000000');
```

### Add skill player

```sql
INSERT INTO players (play_id, side, type, label, x, y, color)
VALUES (?, 'offense', 'skill', 'X', 10, 5, '#0000FF')
RETURNING id;
```

### Update player position

```sql
-- Location automatically synced via trigger
UPDATE players
SET x = ?, y = ?
WHERE id = ?;
```

### Link player to drawing

```sql
-- Link player to route
UPDATE players
SET linked_drawing_id = ?
WHERE id = ?;

-- Also update drawing side
UPDATE drawings
SET linked_player_id = ?, linked_point_id = ?
WHERE id = ?;
```

### Unlink player from drawing

```sql
-- Unlink player
UPDATE players
SET linked_drawing_id = NULL
WHERE id = ?;

-- Also unlink drawing
UPDATE drawings
SET linked_player_id = NULL, linked_point_id = NULL
WHERE id = ?;
```

### Get players with linked routes

```sql
SELECT
  p.*,
  d.id as drawing_id,
  d.style_color as route_color
FROM players p
LEFT JOIN drawings d ON d.id = p.linked_drawing_id
WHERE p.play_id = ?;
```

### Clone players to new play

```sql
INSERT INTO players (
  play_id, side, type, position, label, x, y, color
)
SELECT
  ?, side, type, position, label, x, y, color
FROM players
WHERE play_id = ?
RETURNING id;
```

### Delete player

```sql
-- Unlinks from drawing automatically (ON DELETE SET NULL)
DELETE FROM players WHERE id = ?;
```

### Apply formation template

```sql
-- Apply formation template to play
INSERT INTO players (play_id, side, type, label, x, y, color)
SELECT
  ?,
  ftp.side,
  'skill',
  ftp.position_label,
  ftp.x + ?,  -- Adjust for hash_position offset
  ftp.y,
  ftp.color
FROM formation_template_players ftp
WHERE ftp.formation_id = ?;
```

### Get player statistics

```sql
SELECT
  COUNT(*) as total_players,
  COUNT(*) FILTER (WHERE side = 'offense') as offensive_players,
  COUNT(*) FILTER (WHERE side = 'defense') as defensive_players,
  COUNT(*) FILTER (WHERE type = 'lineman') as linemen,
  COUNT(*) FILTER (WHERE type = 'skill') as skill_players,
  COUNT(*) FILTER (WHERE linked_drawing_id IS NOT NULL) as linked_players
FROM players
WHERE play_id = ?;
```

### Find players by label

```sql
SELECT * FROM players
WHERE play_id = ?
AND label = 'X'
AND side = 'offense';
```

### Bulk update player colors

```sql
-- Set all offensive players to blue
UPDATE players
SET color = '#0000FF'
WHERE play_id = ?
AND side = 'offense';
```

## Hash Position Adjustment

When `plays.hash_position` changes, adjust linemen x-coordinates:

```sql
-- Hash position offsets (in feet)
-- left: shift all linemen -10 feet
-- middle: 0 offset (default)
-- right: shift all linemen +10 feet

UPDATE players
SET x = x + ?  -- offset based on hash_position
WHERE play_id = ?
AND type = 'lineman';
```

## Validation Rules

### Application-level validations

1. **Linemen limit**: Exactly 5 offensive linemen per play
2. **Position uniqueness**: Only one player per lineman position (C, LG, RG, LT, RT)
3. **Label references**: Validate `label` exists in `team_position_labels` for team
4. **Color format**: Validate hex color format (#RRGGBB)
5. **Coordinate bounds**: Keep players within field boundaries (0-360 feet wide, 0-120 feet long)

## See Also

- [drawings.md](./drawings.md) - Route drawings linked to players
- [../playbooks/plays.md](../playbooks/plays.md) - Parent play structure
- [../organization/formations.md](../organization/formations.md) - Formation templates with player positions
- [../audit.md](../audit.md) - Player creation/modification tracking
