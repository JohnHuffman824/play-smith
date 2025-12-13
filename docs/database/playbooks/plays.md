# Plays

This document describes individual plays within playbooks.

## Overview

Plays are the core content of PlaySmith:
- Belong to a playbook
- Optionally organized into sections
- Reference team libraries (formations, personnel)
- Contain players and drawings (see [canvas/](../canvas/))
- Support tagging for categorization

## Table

### plays

```sql
CREATE TYPE hash_position AS ENUM ('left', 'middle', 'right');
CREATE TYPE play_type AS ENUM ('pass', 'run');

CREATE TABLE plays (
    id BIGSERIAL PRIMARY KEY,
    playbook_id BIGINT NOT NULL,
    section_id BIGINT, -- Optional grouping within playbook
    name VARCHAR(255), -- "Play" field (e.g., "Power Left")
    play_type play_type, -- Pass or Run designation
    formation_id BIGINT, -- References team's formation library
    personnel_id BIGINT, -- References team's personnel library
    defensive_formation_id BIGINT, -- References team's formation library
    hash_position hash_position NOT NULL DEFAULT 'middle',
    notes TEXT, -- Optional coach notes
    display_order INT NOT NULL DEFAULT 0, -- For ordering within section/playbook
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
    FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE SET NULL,
    FOREIGN KEY (personnel_id) REFERENCES personnel_packages(id) ON DELETE SET NULL,
    FOREIGN KEY (defensive_formation_id) REFERENCES formations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_plays_playbook ON plays(playbook_id);
CREATE INDEX idx_plays_section ON plays(section_id);
CREATE INDEX idx_plays_formation ON plays(formation_id);
CREATE INDEX idx_plays_personnel ON plays(personnel_id);

CREATE TRIGGER update_plays_updated_at BEFORE UPDATE ON plays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**
- `id`: Unique identifier
- `playbook_id`: Parent playbook (required)
- `section_id`: Optional section for organization
- `name`: Play name (e.g., "Power Left", "Y-Stick", "Double Slant")
- `play_type`: Pass or run designation
- `formation_id`: Reference to team's offensive formation library
- `personnel_id`: Reference to team's personnel package library
- `defensive_formation_id`: Reference to defensive formation (for practice/film)
- `hash_position`: Field position (left/middle/right hash mark)
- `notes`: Coach notes, adjustments, reads, etc.
- `display_order`: Custom ordering within section or playbook
- `created_by`: User who created the play
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp (auto-updated)

**Constraints:**
- `ON DELETE CASCADE` for `playbook_id`: Delete play when playbook deleted
- `ON DELETE SET NULL` for `section_id`: Keep play when section deleted
- `ON DELETE SET NULL` for formation/personnel: Keep play when library entry deleted

**Indexes:**
- `idx_plays_playbook`: Find all plays in a playbook
- `idx_plays_section`: Find all plays in a section
- `idx_plays_formation`: Find plays using a formation
- `idx_plays_personnel`: Find plays using a personnel package

## Relationships

```
playbooks (1) ─────< (M) plays
         "contains"

sections (1) ─────< (M) plays (optional)
        "groups"

plays (1) ─────< (M) players
     "has players"

plays (1) ─────< (M) drawings
     "has routes"

plays (M) >─────< (M) tags
         play_tags
     "categorized by"

formations (1) ─────< (M) plays
          "uses"

personnel_packages (1) ─────< (M) plays
                  "uses"
```

## Play Structure

### Hash Position

The `hash_position` determines the base positioning of the 5 offensive linemen:

- **left**: Left hash mark (linemen shift left)
- **middle**: Middle of field (default alignment)
- **right**: Right hash mark (linemen shift right)

This affects auto-generated linemen positions (C, LG, RG, LT, RT).

### Play Type

- **pass**: Passing play (routes, protection)
- **run**: Running play (blocking assignments, running lanes)

Used for filtering and analytics.

### Formation References

- `formation_id`: Offensive formation (e.g., "I-Formation", "Spread", "Trips Right")
- `defensive_formation_id`: Defensive alignment (e.g., "4-3", "Nickel", "Cover 2")

Both are optional (nullable) to support free-form plays.

### Personnel Package

`personnel_id` references the team's personnel library (e.g., "11 Personnel", "12 Personnel").

**Common packages:**
- **11 Personnel**: 1 RB, 1 TE, 3 WR
- **12 Personnel**: 1 RB, 2 TE, 2 WR
- **21 Personnel**: 2 RB, 1 TE, 2 WR
- **10 Personnel**: 1 RB, 0 TE, 4 WR

## Play Tags

Many-to-many relationship with tags via junction table:

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

See [../organization/tags.md](../organization/tags.md) for tag details.

## Example Queries

### Get all plays in a playbook

```sql
SELECT
  p.id,
  p.name,
  p.play_type,
  p.hash_position,
  p.display_order,
  s.name as section_name,
  f.name as formation_name,
  pp.name as personnel_name,
  (SELECT COUNT(*) FROM players WHERE play_id = p.id AND side = 'offense') as player_count,
  (SELECT COUNT(*) FROM drawings WHERE play_id = p.id) as route_count
FROM plays p
LEFT JOIN sections s ON s.id = p.section_id
LEFT JOIN formations f ON f.id = p.formation_id
LEFT JOIN personnel_packages pp ON pp.id = p.personnel_id
WHERE p.playbook_id = ?
ORDER BY
  COALESCE(s.display_order, 999999),  -- Sections first, then unsectioned plays
  p.display_order,
  p.created_at;
```

### Get play with full details

```sql
SELECT
  p.*,
  pb.name as playbook_name,
  s.name as section_name,
  f.name as formation_name,
  pp.name as personnel_name,
  df.name as defensive_formation_name,
  creator.name as created_by_name,
  -- Tags as JSON array
  COALESCE(
    json_agg(
      json_build_object('id', t.id, 'name', t.name, 'color', t.color)
    ) FILTER (WHERE t.id IS NOT NULL),
    '[]'
  ) as tags
FROM plays p
JOIN playbooks pb ON pb.id = p.playbook_id
LEFT JOIN sections s ON s.id = p.section_id
LEFT JOIN formations f ON f.id = p.formation_id
LEFT JOIN personnel_packages pp ON pp.id = p.personnel_id
LEFT JOIN formations df ON df.id = p.defensive_formation_id
JOIN users creator ON creator.id = p.created_by
LEFT JOIN play_tags pt ON pt.play_id = p.id
LEFT JOIN tags t ON t.id = pt.tag_id
WHERE p.id = ?
GROUP BY p.id, pb.name, s.name, f.name, pp.name, df.name, creator.name;
```

### Create new play

```sql
-- Insert play with defaults
INSERT INTO plays (playbook_id, name, created_by, hash_position, play_type)
VALUES (?, ?, ?, 'middle', 'pass')
RETURNING id;

-- Auto-create 5 offensive linemen based on hash_position
INSERT INTO players (play_id, side, type, position, x, y, color)
VALUES
  (?, 'offense', 'lineman', 'C', 0, 0, '#000000'),
  (?, 'offense', 'lineman', 'LG', -2, 0, '#000000'),
  (?, 'offense', 'lineman', 'RG', 2, 0, '#000000'),
  (?, 'offense', 'lineman', 'LT', -4, 0, '#000000'),
  (?, 'offense', 'lineman', 'RT', 4, 0, '#000000');
```

### Update play metadata

```sql
UPDATE plays
SET
  name = ?,
  play_type = ?,
  formation_id = ?,
  personnel_id = ?,
  hash_position = ?,
  notes = ?
WHERE id = ?;
```

### Delete play

```sql
-- Cascades to players, drawings, segments, control_points, play_tags
DELETE FROM plays WHERE id = ?;
```

### Reorder plays within section

```sql
-- Move play from position 3 to position 1 within section
UPDATE plays
SET display_order = display_order + 1
WHERE section_id = ? AND display_order >= 1 AND display_order < 3;

UPDATE plays
SET display_order = 1
WHERE id = ?;
```

### Move play to different section

```sql
UPDATE plays
SET section_id = ?
WHERE id = ?;
```

### Filter plays by tag

```sql
SELECT DISTINCT p.*
FROM plays p
JOIN play_tags pt ON pt.play_id = p.id
JOIN tags t ON t.id = pt.tag_id
WHERE p.playbook_id = ?
AND t.name = 'Red Zone'
ORDER BY p.display_order;
```

### Filter plays by multiple tags (AND)

```sql
-- Find plays with ALL specified tags
SELECT p.*
FROM plays p
WHERE p.playbook_id = ?
AND NOT EXISTS (
  SELECT 1 FROM unnest(ARRAY[?, ?, ?]::bigint[]) AS required_tag
  WHERE NOT EXISTS (
    SELECT 1 FROM play_tags pt
    WHERE pt.play_id = p.id AND pt.tag_id = required_tag
  )
);
```

### Filter plays by play type

```sql
SELECT * FROM plays
WHERE playbook_id = ?
AND play_type = 'pass'
ORDER BY display_order;
```

### Filter plays by formation

```sql
SELECT p.*, f.name as formation_name
FROM plays p
JOIN formations f ON f.id = p.formation_id
WHERE p.playbook_id = ?
AND f.name = 'Spread'
ORDER BY p.display_order;
```

### Clone play to another playbook

```sql
-- Clone play structure (without players/drawings)
INSERT INTO plays (
  playbook_id, section_id, name, play_type, formation_id,
  personnel_id, defensive_formation_id, hash_position, notes,
  display_order, created_by
)
SELECT
  ?, NULL, name, play_type, formation_id,
  personnel_id, defensive_formation_id, hash_position, notes,
  (SELECT COALESCE(MAX(display_order) + 1, 0) FROM plays WHERE playbook_id = ?),
  ?
FROM plays
WHERE id = ?
RETURNING id;

-- Clone players (see canvas/players.md)
-- Clone drawings (see canvas/drawings.md)
-- Clone tags
INSERT INTO play_tags (play_id, tag_id)
SELECT ?, tag_id
FROM play_tags
WHERE play_id = ?;
```

### Get play statistics

```sql
SELECT
  COUNT(*) as total_plays,
  COUNT(*) FILTER (WHERE play_type = 'pass') as pass_plays,
  COUNT(*) FILTER (WHERE play_type = 'run') as run_plays,
  COUNT(DISTINCT formation_id) as unique_formations,
  COUNT(DISTINCT personnel_id) as unique_personnel,
  AVG((SELECT COUNT(*) FROM players WHERE play_id = plays.id AND side = 'offense')) as avg_offensive_players,
  AVG((SELECT COUNT(*) FROM drawings WHERE play_id = plays.id)) as avg_routes
FROM plays
WHERE playbook_id = ?;
```

### Search plays by name

```sql
SELECT * FROM plays
WHERE playbook_id = ?
AND name ILIKE '%' || ? || '%'
ORDER BY name;
```

### Recently updated plays

```sql
SELECT
  p.*,
  s.name as section_name,
  f.name as formation_name
FROM plays p
LEFT JOIN sections s ON s.id = p.section_id
LEFT JOIN formations f ON f.id = p.formation_id
WHERE p.playbook_id = ?
ORDER BY p.updated_at DESC
LIMIT 10;
```

## Display Order Management

Similar to sections, `display_order` supports drag-to-reorder:

```sql
-- Compact display_order for plays in a section
WITH ordered_plays AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, id) - 1 as new_order
  FROM plays
  WHERE section_id = ?
)
UPDATE plays
SET display_order = ordered_plays.new_order
FROM ordered_plays
WHERE plays.id = ordered_plays.id;
```

## Notes Field Usage

The `notes` TEXT field supports:
- Blocking assignments
- Route progressions
- Defensive reads
- Adjustments and audibles
- Practice notes
- Film study references

**Example:**
```
Primary read: X on post route vs Cover 2
Secondary: TE on seam vs Cover 3
Hot route: RB on swing if blitz
Protection: Max protect, slide right
```

## See Also

- [playbooks.md](./playbooks.md) - Parent playbook structure
- [sections.md](./sections.md) - Section organization
- [../canvas/players.md](../canvas/players.md) - Player positioning
- [../canvas/drawings.md](../canvas/drawings.md) - Route drawings
- [../organization/tags.md](../organization/tags.md) - Play categorization
- [../organization/formations.md](../organization/formations.md) - Formation library
- [../organization/concepts.md](../organization/concepts.md) - Personnel packages
- [../audit.md](../audit.md) - Play change tracking
