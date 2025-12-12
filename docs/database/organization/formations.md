# Formations

This document describes team formation libraries and templates.

## Overview

Teams maintain their own formation libraries:
- Name-only formations (simple references)
- Template formations (with player positioning data)
- Used for both offensive and defensive formations
- Auto-populate players when creating new plays

## Tables

### formations

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

**Fields:**
- `id`: Unique identifier
- `team_id`: Owning team
- `name`: Formation name (e.g., "I-Formation", "Spread", "4-3 Defense")
- `description`: Optional description/notes
- `is_template`: TRUE if formation includes player positioning data
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- `UNIQUE (team_id, name)`: No duplicate formation names per team
- `ON DELETE CASCADE` for `team_id`: Remove formations when team deleted

**Indexes:**
- `idx_formations_team`: Find all formations for a team

### formation_template_players

Player positioning data for template formations:

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

**Fields:**
- `id`: Unique identifier
- `formation_id`: Parent formation
- `side`: offense or defense
- `position_label`: Team's position label (X, Y, Z, F, etc.)
- `x`, `y`: Coordinates in feet (relative to hash position)
- `color`: Hex color code for display

**Constraints:**
- `ON DELETE CASCADE`: Remove template players when formation deleted

**Indexes:**
- `idx_formation_template_players_formation`: Find all players in a formation

### team_position_labels

Team-specific position terminology:

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

**Fields:**
- `id`: Unique identifier
- `team_id`: Owning team
- `side`: offense or defense
- `label`: 1-2 character position designation
- `description`: Human-readable description
- `display_order`: Sort order for UI display

**Constraints:**
- `UNIQUE (team_id, side, label)`: No duplicate labels per team/side
- `ON DELETE CASCADE`: Remove position labels when team deleted

## Relationships

```
teams (1) ─────< (M) formations
     "owns formation library"

formations (1) ─────< (M) formation_template_players (optional)
          "contains positioning for"

plays (M) >────── (1) formations (offensive)
     "uses formation"

plays (M) >────── (1) formations (defensive)
     "vs defensive formation"

teams (1) ─────< (M) team_position_labels
     "defines terminology"

formation_template_players.position_label → team_position_labels.label
                                          "uses terminology"
```

## Formation Types

### Name-only Formations

Simple formation references without positioning data:
- `is_template = FALSE`
- No entries in `formation_template_players`
- Used for manual play creation
- Teams can add/edit as needed

**Example:**
```sql
INSERT INTO formations (team_id, name, description, is_template)
VALUES (1, 'I-Formation', 'Traditional I-Formation with FB and RB', FALSE);
```

### Template Formations

Formations with complete player positioning:
- `is_template = TRUE`
- Has entries in `formation_template_players`
- Auto-populate players when applied to a play
- Positions relative to play's hash_position

**Example:**
```sql
-- Create formation
INSERT INTO formations (team_id, name, is_template)
VALUES (1, 'Spread', TRUE)
RETURNING id;

-- Add template players
INSERT INTO formation_template_players (
  formation_id, side, position_label, x, y, color
) VALUES
  (?, 'offense', 'Q', 0, -5, '#FF0000'),   -- QB in shotgun
  (?, 'offense', 'X', -15, 0, '#0000FF'),  -- X receiver left
  (?, 'offense', 'Y', 15, 0, '#0000FF'),   -- Y receiver right
  (?, 'offense', 'Z', -10, 0, '#0000FF'),  -- Z receiver left slot
  (?, 'offense', 'R', 5, -3, '#00FF00');   -- RB offset right
```

## Position Label Systems

### Common Offensive Systems

**X/Y/Z System (Traditional):**
```sql
INSERT INTO team_position_labels (team_id, side, label, description, display_order) VALUES
  (?, 'offense', 'X', 'Split End', 1),
  (?, 'offense', 'Y', 'Tight End', 2),
  (?, 'offense', 'Z', 'Flanker', 3),
  (?, 'offense', 'F', 'Fullback', 4),
  (?, 'offense', 'R', 'Running Back', 5),
  (?, 'offense', 'Q', 'Quarterback', 6);
```

**F/A/B System (Modern Spread):**
```sql
INSERT INTO team_position_labels (team_id, side, label, description, display_order) VALUES
  (?, 'offense', 'F', 'Field Receiver', 1),
  (?, 'offense', 'A', 'Apex Receiver', 2),
  (?, 'offense', 'B', 'Boundary Receiver', 3),
  (?, 'offense', 'T', 'Tight End', 4),
  (?, 'offense', 'R', 'Running Back', 5),
  (?, 'offense', 'Q', 'Quarterback', 6);
```

### Common Defensive Systems

```sql
INSERT INTO team_position_labels (team_id, side, label, description, display_order) VALUES
  (?, 'defense', 'DE', 'Defensive End', 1),
  (?, 'defense', 'DT', 'Defensive Tackle', 2),
  (?, 'defense', 'LB', 'Linebacker', 3),
  (?, 'defense', 'CB', 'Cornerback', 4),
  (?, 'defense', 'S', 'Safety', 5);
```

## Example Queries

### Get all formations for a team

```sql
SELECT
  id,
  name,
  description,
  is_template,
  (SELECT COUNT(*) FROM formation_template_players WHERE formation_id = formations.id) as player_count,
  (SELECT COUNT(*) FROM plays WHERE formation_id = formations.id) as usage_count
FROM formations
WHERE team_id = ?
ORDER BY name;
```

### Get formation with template players

```sql
SELECT
  f.id,
  f.name,
  f.description,
  f.is_template,
  json_agg(
    json_build_object(
      'id', ftp.id,
      'side', ftp.side,
      'position_label', ftp.position_label,
      'x', ftp.x,
      'y', ftp.y,
      'color', ftp.color
    )
  ) FILTER (WHERE ftp.id IS NOT NULL) as template_players
FROM formations f
LEFT JOIN formation_template_players ftp ON ftp.formation_id = f.id
WHERE f.id = ?
GROUP BY f.id;
```

### Create name-only formation

```sql
INSERT INTO formations (team_id, name, description, is_template)
VALUES (?, ?, ?, FALSE)
RETURNING id;
```

### Create template formation

```sql
-- Create formation
INSERT INTO formations (team_id, name, description, is_template)
VALUES (?, ?, ?, TRUE)
RETURNING id;

-- Add template players
INSERT INTO formation_template_players (
  formation_id, side, position_label, x, y, color
)
VALUES
  (?, 'offense', 'Q', 0, -5, '#FF0000'),
  (?, 'offense', 'X', -15, 0, '#0000FF'),
  (?, 'offense', 'Y', 15, 0, '#0000FF');
```

### Update formation

```sql
UPDATE formations
SET name = ?, description = ?
WHERE id = ? AND team_id = ?;
```

### Delete formation

```sql
-- Cascades to formation_template_players
-- Sets plays.formation_id to NULL (ON DELETE SET NULL in plays table)
DELETE FROM formations
WHERE id = ? AND team_id = ?;
```

### Apply formation to play

```sql
-- Set formation reference
UPDATE plays
SET formation_id = ?
WHERE id = ?;

-- If is_template=TRUE, also create players
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

### Convert name-only to template

```sql
-- Capture current play's player positions as template
BEGIN;

-- Enable template mode
UPDATE formations
SET is_template = TRUE
WHERE id = ?;

-- Copy players from a reference play
INSERT INTO formation_template_players (
  formation_id, side, position_label, x, y, color
)
SELECT
  ?,
  side,
  label,
  x,
  y,
  color
FROM players
WHERE play_id = ?
AND type = 'skill';  -- Don't include linemen

COMMIT;
```

### Clone formation to another team

```sql
-- Clone formation
INSERT INTO formations (team_id, name, description, is_template)
SELECT ?, name, description, is_template
FROM formations
WHERE id = ?
RETURNING id;

-- Clone template players
INSERT INTO formation_template_players (
  formation_id, side, position_label, x, y, color
)
SELECT
  ?,
  side,
  position_label,
  x,
  y,
  color
FROM formation_template_players
WHERE formation_id = ?;
```

### Get most used formations

```sql
SELECT
  f.id,
  f.name,
  COUNT(p.id) as play_count
FROM formations f
LEFT JOIN plays p ON p.formation_id = f.id
WHERE f.team_id = ?
GROUP BY f.id, f.name
ORDER BY play_count DESC, f.name
LIMIT 10;
```

### Search formations by name

```sql
SELECT *
FROM formations
WHERE team_id = ?
AND name ILIKE '%' || ? || '%'
ORDER BY name;
```

### Get position labels for team

```sql
SELECT
  label,
  description,
  display_order
FROM team_position_labels
WHERE team_id = ?
AND side = ?
ORDER BY display_order;
```

### Create position label

```sql
INSERT INTO team_position_labels (
  team_id, side, label, description, display_order
)
VALUES (?, ?, ?, ?, ?)
RETURNING id;
```

### Update position label

```sql
UPDATE team_position_labels
SET description = ?, display_order = ?
WHERE id = ? AND team_id = ?;
```

### Delete position label

```sql
-- Only allow if no formations/players use it
DELETE FROM team_position_labels
WHERE id = ? AND team_id = ?
AND NOT EXISTS (
  SELECT 1 FROM formation_template_players
  WHERE position_label = team_position_labels.label
)
AND NOT EXISTS (
  SELECT 1 FROM players
  WHERE label = team_position_labels.label
);
```

## Common Formations

### Offensive Formations

**Spread:**
- 4-5 WRs, 0-1 RB, shotgun QB
- Wide spacing, horizontal stretch

**I-Formation:**
- FB and RB aligned behind QB
- Traditional power running formation

**Trips:**
- 3 WRs on one side
- Overload one side of defense

**Empty:**
- 0 RBs, 5 skill players
- All receivers, QB in shotgun

**Pistol:**
- RB aligned behind QB (closer than shotgun)
- Hybrid between under center and shotgun

### Defensive Formations

**4-3:**
- 4 DL, 3 LB, 4 DB
- Balanced front

**3-4:**
- 3 DL, 4 LB, 4 DB
- More versatile LBs

**Nickel:**
- 4 DL, 2 LB, 5 DB
- Extra DB for pass coverage

**Dime:**
- 4 DL, 1 LB, 6 DB
- Maximum pass coverage

**Cover 2/3/4:**
- Zone coverage schemes
- Numbered by deep zones

## Migration: Seed Default Formations

```sql
-- Run when team is created
INSERT INTO formations (team_id, name, description, is_template) VALUES
  -- Offensive
  (?, 'I-Formation', 'Traditional I-Formation', FALSE),
  (?, 'Spread', 'Spread offense', FALSE),
  (?, 'Trips Right', 'Trips formation to the right', FALSE),
  (?, 'Trips Left', 'Trips formation to the left', FALSE),
  (?, 'Empty', 'Empty backfield', FALSE),
  (?, 'Pistol', 'Pistol formation', FALSE),

  -- Defensive
  (?, '4-3', '4-3 defense', FALSE),
  (?, '3-4', '3-4 defense', FALSE),
  (?, 'Nickel', 'Nickel package', FALSE),
  (?, 'Dime', 'Dime package', FALSE),
  (?, 'Cover 2', 'Cover 2 defense', FALSE),
  (?, 'Cover 3', 'Cover 3 defense', FALSE);
```

## See Also

- [../playbooks/plays.md](../playbooks/plays.md) - Play formation references
- [../canvas/players.md](../canvas/players.md) - Player positioning
- [concepts.md](./concepts.md) - Personnel packages
- [../core/users-teams.md](../core/users-teams.md) - Team ownership
- [../audit.md](../audit.md) - Formation change tracking
