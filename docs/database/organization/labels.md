# Labels

This document describes the hybrid label scoping system for play categorization.

## Overview

Labels categorize plays (e.g., "Short Yardage", "Red Zone", "Third Down"). PlaySmith uses hybrid scoping:
- **Preset labels**: Global labels available to all teams
- **Custom labels**: Team-specific labels for specialized categorization

## Tables

### labels

```sql
CREATE TABLE labels (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT, -- NULL for preset labels, set for custom team labels
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    is_preset BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE (team_id, name) -- Prevents duplicates within team scope
);

CREATE INDEX idx_labels_team ON labels(team_id);
CREATE INDEX idx_labels_preset ON labels(is_preset);

CREATE TRIGGER update_labels_updated_at BEFORE UPDATE ON labels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**
- `id`: Unique identifier
- `team_id`: NULL for preset labels, team ID for custom labels
- `name`: Label name (e.g., "Red Zone", "Third Down")
- `color`: Hex color code for display (#RRGGBB)
- `is_preset`: TRUE for global preset labels, FALSE for custom labels
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- `UNIQUE (team_id, name)`: No duplicate labels within team scope
- `ON DELETE CASCADE` for `team_id`: Remove custom labels when team deleted

**Indexes:**
- `idx_labels_team`: Find all custom labels for a team
- `idx_labels_preset`: Find all preset labels

### play_labels

Many-to-many junction table linking plays to labels:

```sql
CREATE TABLE play_labels (
    id BIGSERIAL PRIMARY KEY,
    play_id BIGINT NOT NULL,
    label_id BIGINT NOT NULL,
    UNIQUE (play_id, label_id),
    FOREIGN KEY (play_id) REFERENCES plays(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

CREATE INDEX idx_play_labels_label ON play_labels(label_id);
CREATE INDEX idx_play_labels_play ON play_labels(play_id);
```

**Fields:**
- `id`: Unique identifier
- `play_id`: Reference to play
- `label_id`: Reference to label

**Constraints:**
- `UNIQUE (play_id, label_id)`: Can't label a play with the same label twice
- `ON DELETE CASCADE`: Remove label association when play or label deleted

**Indexes:**
- `idx_play_labels_label`: Find all plays with a label
- `idx_play_labels_play`: Find all labels for a play

## Relationships

```
teams (1) ─────< (M) labels
     "owns custom labels"

plays (M) >─────< (M) labels
         play_labels
     "categorized by"
```

## Label Scoping

### Preset Labels (Global)

**Definition:**
- `is_preset = TRUE`
- `team_id = NULL`
- Available to all teams
- Cannot be edited or deleted by teams

**Default preset labels:**

```sql
INSERT INTO labels (name, color, is_preset, team_id) VALUES
  ('Short Yardage', '#00FF00', TRUE, NULL),    -- Green
  ('Mid Yardage', '#FFFF00', TRUE, NULL),      -- Yellow
  ('Long Yardage', '#FFA500', TRUE, NULL),     -- Orange
  ('Red Zone', '#FF0000', TRUE, NULL);          -- Red
```

### Custom Labels (Team-scoped)

**Definition:**
- `is_preset = FALSE`
- `team_id` is set
- Only visible to owning team
- Team can edit and delete

**Use cases:**
- Specialized situations (e.g., "Two Minute Drill", "Goal Line")
- Formation-specific labels (e.g., "Trips Heavy", "Empty Set")
- Down & distance (e.g., "Third & Long", "Fourth Down")
- Personnel-specific (e.g., "11 Personnel", "Jumbo Package")

## Example Queries

### Get all labels available to a team

```sql
-- Preset labels + team's custom labels
SELECT
  id,
  name,
  color,
  is_preset,
  CASE WHEN is_preset THEN 'Preset' ELSE 'Custom' END as label_type
FROM labels
WHERE is_preset = TRUE OR team_id = ?
ORDER BY is_preset DESC, name;
```

### Create custom label

```sql
INSERT INTO labels (team_id, name, color, is_preset)
VALUES (?, ?, ?, FALSE)
RETURNING id;
```

### Update custom label

```sql
-- Only custom labels can be updated
UPDATE labels
SET name = ?, color = ?
WHERE id = ?
AND is_preset = FALSE
AND team_id = ?;
```

### Delete custom label

```sql
-- Only custom labels can be deleted
-- Cascades to play_labels (removes label from all plays)
DELETE FROM labels
WHERE id = ?
AND is_preset = FALSE
AND team_id = ?;
```

### Add label to play

```sql
-- Works for both preset and custom labels
INSERT INTO play_labels (play_id, label_id)
VALUES (?, ?)
ON CONFLICT (play_id, label_id) DO NOTHING;
```

### Remove label from play

```sql
DELETE FROM play_labels
WHERE play_id = ? AND label_id = ?;
```

### Get all labels for a play

```sql
SELECT
  l.id,
  l.name,
  l.color,
  l.is_preset
FROM labels l
JOIN play_labels pl ON pl.label_id = l.id
WHERE pl.play_id = ?
ORDER BY l.is_preset DESC, l.name;
```

### Get all plays with a label

```sql
SELECT
  p.id,
  p.name,
  p.play_type,
  pb.name as playbook_name
FROM plays p
JOIN play_labels pl ON pl.play_id = p.id
JOIN playbooks pb ON pb.id = p.playbook_id
WHERE pl.label_id = ?
ORDER BY p.name;
```

### Filter plays by multiple labels (AND logic)

```sql
-- Find plays with ALL specified labels
SELECT p.*
FROM plays p
WHERE NOT EXISTS (
  SELECT 1 FROM unnest(ARRAY[?, ?, ?]::bigint[]) AS required_label
  WHERE NOT EXISTS (
    SELECT 1 FROM play_labels pl
    WHERE pl.play_id = p.id AND pl.label_id = required_label
  )
)
ORDER BY p.name;
```

### Filter plays by multiple labels (OR logic)

```sql
-- Find plays with ANY of the specified labels
SELECT DISTINCT p.*
FROM plays p
JOIN play_labels pl ON pl.play_id = p.id
WHERE pl.label_id = ANY(ARRAY[?, ?, ?]::bigint[])
ORDER BY p.name;
```

### Get label usage statistics

```sql
SELECT
  l.id,
  l.name,
  l.color,
  l.is_preset,
  COUNT(pl.play_id) as play_count
FROM labels l
LEFT JOIN play_labels pl ON pl.label_id = l.id
WHERE l.is_preset = TRUE OR l.team_id = ?
GROUP BY l.id, l.name, l.color, l.is_preset
ORDER BY play_count DESC, l.name;
```

### Find unused labels

```sql
-- Custom labels with no plays
SELECT l.*
FROM labels l
LEFT JOIN play_labels pl ON pl.label_id = l.id
WHERE l.team_id = ?
AND l.is_preset = FALSE
AND pl.id IS NULL;
```

### Bulk label plays

```sql
-- Add label to multiple plays
INSERT INTO play_labels (play_id, label_id)
SELECT play_id, ?
FROM unnest(ARRAY[?, ?, ?]::bigint[]) AS play_id
ON CONFLICT (play_id, label_id) DO NOTHING;
```

### Bulk remove label from plays

```sql
DELETE FROM play_labels
WHERE label_id = ?
AND play_id = ANY(ARRAY[?, ?, ?]::bigint[]);
```

### Replace play labels

```sql
-- Remove all existing labels
DELETE FROM play_labels WHERE play_id = ?;

-- Add new labels
INSERT INTO play_labels (play_id, label_id)
SELECT ?, label_id
FROM unnest(ARRAY[?, ?, ?]::bigint[]) AS label_id;
```

### Search labels by name

```sql
SELECT *
FROM labels
WHERE (is_preset = TRUE OR team_id = ?)
AND name ILIKE '%' || ? || '%'
ORDER BY is_preset DESC, name;
```

### Clone labels to new team

```sql
-- Clone another team's custom labels (useful for team templates)
INSERT INTO labels (team_id, name, color, is_preset)
SELECT ?, name, color, FALSE
FROM labels
WHERE team_id = ?
AND is_preset = FALSE
ON CONFLICT (team_id, name) DO NOTHING;
```

## Playbook Sharing & Labels

When playbooks are shared between teams, labels work as follows:

### Viewing Shared Playbooks

Teams can see plays with labels from:
- Preset labels (always visible)
- Their own custom labels
- Other team's custom labels (display only, can't modify)

### Editing Shared Playbooks

When a team has edit permission on a shared playbook:
- Can add their own custom labels to plays
- Can add preset labels to plays
- Cannot add other team's custom labels to plays
- Can remove any labels they added
- Cannot remove labels added by owning team

### Implementation

```sql
-- Get all labels for a play (visible to user's team)
SELECT
  l.id,
  l.name,
  l.color,
  l.is_preset,
  CASE
    WHEN l.is_preset THEN TRUE
    WHEN l.team_id = ? THEN TRUE  -- User's team
    ELSE FALSE
  END as can_modify
FROM labels l
JOIN play_labels pl ON pl.label_id = l.id
WHERE pl.play_id = ?
ORDER BY l.is_preset DESC, l.name;
```

## Label Color Palette

Recommended color palette for labels:

```sql
-- Situational labels (green/yellow/orange/red spectrum)
'#00FF00'  -- Short Yardage (Green)
'#FFFF00'  -- Mid Yardage (Yellow)
'#FFA500'  -- Long Yardage (Orange)
'#FF0000'  -- Red Zone (Red)

-- Down & distance (blue spectrum)
'#0000FF'  -- First Down
'#3399FF'  -- Second Down
'#6666FF'  -- Third Down
'#9933FF'  -- Fourth Down

-- Formation/Personnel (purple/pink spectrum)
'#9900FF'  -- I-Formation
'#CC00FF'  -- Spread
'#FF00CC'  -- Trips

-- Special situations (gray/brown spectrum)
'#666666'  -- Goal Line
'#999999'  -- Two Minute
'#8B4513'  -- Short Yardage
```

## Validation Rules

### Application-level validations

1. **Name length**: 1-50 characters
2. **Color format**: Valid hex color (#RRGGBB)
3. **Preset protection**: Cannot edit/delete preset labels
4. **Team scope**: Custom labels only visible to owning team
5. **Duplicate prevention**: No duplicate names within team scope

## Migration: Seed Preset Labels

```sql
-- Run once on initial database setup
INSERT INTO labels (name, color, is_preset, team_id) VALUES
  ('Short Yardage', '#00FF00', TRUE, NULL),
  ('Mid Yardage', '#FFFF00', TRUE, NULL),
  ('Long Yardage', '#FFA500', TRUE, NULL),
  ('Red Zone', '#FF0000', TRUE, NULL)
ON CONFLICT DO NOTHING;
```

## See Also

- [../playbooks/plays.md](../playbooks/plays.md) - Play labeling
- [../core/users-teams.md](../core/users-teams.md) - Team ownership
- [../audit.md](../audit.md) - Label creation/modification tracking
