# Tags

This document describes the hybrid tag scoping system for play categorization.

## Overview

Tags categorize plays (e.g., "Short Yardage", "Red Zone", "Third Down"). PlaySmith uses hybrid scoping:
- **Preset tags**: Global tags available to all teams
- **Custom tags**: Team-specific tags for specialized categorization

## Tables

### tags

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

**Fields:**
- `id`: Unique identifier
- `team_id`: NULL for preset tags, team ID for custom tags
- `name`: Tag name (e.g., "Red Zone", "Third Down")
- `color`: Hex color code for display (#RRGGBB)
- `is_preset`: TRUE for global preset tags, FALSE for custom tags
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- `UNIQUE (team_id, name)`: No duplicate tags within team scope
- `ON DELETE CASCADE` for `team_id`: Remove custom tags when team deleted

**Indexes:**
- `idx_tags_team`: Find all custom tags for a team
- `idx_tags_preset`: Find all preset tags

### play_tags

Many-to-many junction table linking plays to tags:

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

**Fields:**
- `id`: Unique identifier
- `play_id`: Reference to play
- `tag_id`: Reference to tag

**Constraints:**
- `UNIQUE (play_id, tag_id)`: Can't tag a play with the same tag twice
- `ON DELETE CASCADE`: Remove tag association when play or tag deleted

**Indexes:**
- `idx_play_tags_tag`: Find all plays with a tag
- `idx_play_tags_play`: Find all tags for a play

## Relationships

```
teams (1) ─────< (M) tags
     "owns custom tags"

plays (M) >─────< (M) tags
         play_tags
     "categorized by"
```

## Tag Scoping

### Preset Tags (Global)

**Definition:**
- `is_preset = TRUE`
- `team_id = NULL`
- Available to all teams
- Cannot be edited or deleted by teams

**Default preset tags:**

```sql
INSERT INTO tags (name, color, is_preset, team_id) VALUES
  ('Short Yardage', '#00FF00', TRUE, NULL),    -- Green
  ('Mid Yardage', '#FFFF00', TRUE, NULL),      -- Yellow
  ('Long Yardage', '#FFA500', TRUE, NULL),     -- Orange
  ('Red Zone', '#FF0000', TRUE, NULL);          -- Red
```

### Custom Tags (Team-scoped)

**Definition:**
- `is_preset = FALSE`
- `team_id` is set
- Only visible to owning team
- Team can edit and delete

**Use cases:**
- Specialized situations (e.g., "Two Minute Drill", "Goal Line")
- Formation-specific tags (e.g., "Trips Heavy", "Empty Set")
- Down & distance (e.g., "Third & Long", "Fourth Down")
- Personnel-specific (e.g., "11 Personnel", "Jumbo Package")

## Example Queries

### Get all tags available to a team

```sql
-- Preset tags + team's custom tags
SELECT
  id,
  name,
  color,
  is_preset,
  CASE WHEN is_preset THEN 'Preset' ELSE 'Custom' END as tag_type
FROM tags
WHERE is_preset = TRUE OR team_id = ?
ORDER BY is_preset DESC, name;
```

### Create custom tag

```sql
INSERT INTO tags (team_id, name, color, is_preset)
VALUES (?, ?, ?, FALSE)
RETURNING id;
```

### Update custom tag

```sql
-- Only custom tags can be updated
UPDATE tags
SET name = ?, color = ?
WHERE id = ?
AND is_preset = FALSE
AND team_id = ?;
```

### Delete custom tag

```sql
-- Only custom tags can be deleted
-- Cascades to play_tags (removes tag from all plays)
DELETE FROM tags
WHERE id = ?
AND is_preset = FALSE
AND team_id = ?;
```

### Add tag to play

```sql
-- Works for both preset and custom tags
INSERT INTO play_tags (play_id, tag_id)
VALUES (?, ?)
ON CONFLICT (play_id, tag_id) DO NOTHING;
```

### Remove tag from play

```sql
DELETE FROM play_tags
WHERE play_id = ? AND tag_id = ?;
```

### Get all tags for a play

```sql
SELECT
  t.id,
  t.name,
  t.color,
  t.is_preset
FROM tags t
JOIN play_tags pt ON pt.tag_id = t.id
WHERE pt.play_id = ?
ORDER BY t.is_preset DESC, t.name;
```

### Get all plays with a tag

```sql
SELECT
  p.id,
  p.name,
  p.play_type,
  pb.name as playbook_name
FROM plays p
JOIN play_tags pt ON pt.play_id = p.id
JOIN playbooks pb ON pb.id = p.playbook_id
WHERE pt.tag_id = ?
ORDER BY p.name;
```

### Filter plays by multiple tags (AND logic)

```sql
-- Find plays with ALL specified tags
SELECT p.*
FROM plays p
WHERE NOT EXISTS (
  SELECT 1 FROM unnest(ARRAY[?, ?, ?]::bigint[]) AS required_tag
  WHERE NOT EXISTS (
    SELECT 1 FROM play_tags pt
    WHERE pt.play_id = p.id AND pt.tag_id = required_tag
  )
)
ORDER BY p.name;
```

### Filter plays by multiple tags (OR logic)

```sql
-- Find plays with ANY of the specified tags
SELECT DISTINCT p.*
FROM plays p
JOIN play_tags pt ON pt.play_id = p.id
WHERE pt.tag_id = ANY(ARRAY[?, ?, ?]::bigint[])
ORDER BY p.name;
```

### Get tag usage statistics

```sql
SELECT
  t.id,
  t.name,
  t.color,
  t.is_preset,
  COUNT(pt.play_id) as play_count
FROM tags t
LEFT JOIN play_tags pt ON pt.tag_id = t.id
WHERE t.is_preset = TRUE OR t.team_id = ?
GROUP BY t.id, t.name, t.color, t.is_preset
ORDER BY play_count DESC, t.name;
```

### Find unused tags

```sql
-- Custom tags with no plays
SELECT t.*
FROM tags t
LEFT JOIN play_tags pt ON pt.tag_id = t.id
WHERE t.team_id = ?
AND t.is_preset = FALSE
AND pt.id IS NULL;
```

### Bulk tag plays

```sql
-- Add tag to multiple plays
INSERT INTO play_tags (play_id, tag_id)
SELECT play_id, ?
FROM unnest(ARRAY[?, ?, ?]::bigint[]) AS play_id
ON CONFLICT (play_id, tag_id) DO NOTHING;
```

### Bulk remove tag from plays

```sql
DELETE FROM play_tags
WHERE tag_id = ?
AND play_id = ANY(ARRAY[?, ?, ?]::bigint[]);
```

### Replace play tags

```sql
-- Remove all existing tags
DELETE FROM play_tags WHERE play_id = ?;

-- Add new tags
INSERT INTO play_tags (play_id, tag_id)
SELECT ?, tag_id
FROM unnest(ARRAY[?, ?, ?]::bigint[]) AS tag_id;
```

### Search tags by name

```sql
SELECT *
FROM tags
WHERE (is_preset = TRUE OR team_id = ?)
AND name ILIKE '%' || ? || '%'
ORDER BY is_preset DESC, name;
```

### Clone tags to new team

```sql
-- Clone another team's custom tags (useful for team templates)
INSERT INTO tags (team_id, name, color, is_preset)
SELECT ?, name, color, FALSE
FROM tags
WHERE team_id = ?
AND is_preset = FALSE
ON CONFLICT (team_id, name) DO NOTHING;
```

## Playbook Sharing & Tags

When playbooks are shared between teams, tags work as follows:

### Viewing Shared Playbooks

Teams can see plays with tags from:
- Preset tags (always visible)
- Their own custom tags
- Other team's custom tags (display only, can't modify)

### Editing Shared Playbooks

When a team has edit permission on a shared playbook:
- Can add their own custom tags to plays
- Can add preset tags to plays
- Cannot add other team's custom tags to plays
- Can remove any tags they added
- Cannot remove tags added by owning team

### Implementation

```sql
-- Get all tags for a play (visible to user's team)
SELECT
  t.id,
  t.name,
  t.color,
  t.is_preset,
  CASE
    WHEN t.is_preset THEN TRUE
    WHEN t.team_id = ? THEN TRUE  -- User's team
    ELSE FALSE
  END as can_modify
FROM tags t
JOIN play_tags pt ON pt.tag_id = t.id
WHERE pt.play_id = ?
ORDER BY t.is_preset DESC, t.name;
```

## Tag Color Palette

Recommended color palette for tags:

```sql
-- Situational tags (green/yellow/orange/red spectrum)
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
3. **Preset protection**: Cannot edit/delete preset tags
4. **Team scope**: Custom tags only visible to owning team
5. **Duplicate prevention**: No duplicate names within team scope

## Migration: Seed Preset Tags

```sql
-- Run once on initial database setup
INSERT INTO tags (name, color, is_preset, team_id) VALUES
  ('Short Yardage', '#00FF00', TRUE, NULL),
  ('Mid Yardage', '#FFFF00', TRUE, NULL),
  ('Long Yardage', '#FFA500', TRUE, NULL),
  ('Red Zone', '#FF0000', TRUE, NULL)
ON CONFLICT DO NOTHING;
```

## See Also

- [../playbooks/plays.md](../playbooks/plays.md) - Play tagging
- [../core/users-teams.md](../core/users-teams.md) - Team ownership
- [../audit.md](../audit.md) - Tag creation/modification tracking
