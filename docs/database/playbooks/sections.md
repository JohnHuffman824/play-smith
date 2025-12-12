# Sections

This document describes sections, which organize plays within playbooks.

## Overview

Sections provide organizational structure within playbooks:
- Group related plays together (e.g., "Red Zone", "Third Down", "Goal Line")
- Support custom ordering via `display_order`
- Optional (plays can exist without a section)
- Scoped to a single playbook

## Table

### sections

```sql
CREATE TABLE sections (
    id BIGSERIAL PRIMARY KEY,
    playbook_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    UNIQUE (playbook_id, display_order)
);

CREATE INDEX idx_sections_playbook_id ON sections(playbook_id);

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**
- `id`: Unique identifier
- `playbook_id`: Parent playbook
- `name`: Section name (e.g., "Opening Drive", "Red Zone")
- `display_order`: Sort order within playbook (0, 1, 2, ...)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp (auto-updated)

**Constraints:**
- `UNIQUE (playbook_id, display_order)`: No duplicate orders within a playbook
- `ON DELETE CASCADE`: Remove section when playbook is deleted

**Indexes:**
- `idx_sections_playbook_id`: Find all sections for a playbook

**Notes:**
- Section names are NOT unique (can have "Red Zone" in multiple playbooks)
- `display_order` ensures consistent ordering for UI display
- Plays reference sections via `plays.section_id` (nullable)

## Relationships

```
playbooks (1) ─────< (M) sections
         "contains"

sections (1) ─────< (M) plays
        "groups"
```

## Section Organization Patterns

### Common Section Names

- **By Down & Distance:**
  - "First Down"
  - "Second Down"
  - "Third Down (Short)"
  - "Third Down (Long)"
  - "Fourth Down"

- **By Field Position:**
  - "Opening Drive"
  - "Midfield"
  - "Red Zone" (inside 20)
  - "Goal Line" (inside 5)

- **By Situation:**
  - "Two Minute Drill"
  - "Short Yardage"
  - "Play Action"
  - "Screen Plays"
  - "Special Situations"

- **By Formation/Personnel:**
  - "Spread Offense"
  - "I-Formation"
  - "11 Personnel"
  - "Heavy Package"

### Drag-to-Reorder

The `display_order` field supports drag-to-reorder functionality:

```sql
-- Move section from position 2 to position 0
-- Shift other sections down
UPDATE sections
SET display_order = display_order + 1
WHERE playbook_id = ? AND display_order >= 0 AND display_order < 2;

UPDATE sections
SET display_order = 0
WHERE id = ?;
```

## Example Queries

### Get all sections for a playbook

```sql
SELECT
  id,
  name,
  display_order,
  (SELECT COUNT(*) FROM plays WHERE section_id = sections.id) as play_count
FROM sections
WHERE playbook_id = ?
ORDER BY display_order ASC;
```

### Create new section

```sql
-- Find max display_order and add new section at end
INSERT INTO sections (playbook_id, name, display_order)
SELECT ?, ?, COALESCE(MAX(display_order) + 1, 0)
FROM sections
WHERE playbook_id = ?
RETURNING id, name, display_order;
```

### Rename section

```sql
UPDATE sections
SET name = ?
WHERE id = ? AND playbook_id = ?;
```

### Delete section

```sql
-- Plays in section are NOT deleted (section_id set to NULL)
DELETE FROM sections
WHERE id = ? AND playbook_id = ?;

-- Plays affected:
-- UPDATE plays SET section_id = NULL WHERE section_id = ?
-- (happens automatically via ON DELETE SET NULL in plays table)
```

### Reorder sections (swap two sections)

```sql
-- Swap section A and section B
WITH section_orders AS (
  SELECT id, display_order
  FROM sections
  WHERE id IN (?, ?)
)
UPDATE sections
SET display_order = CASE
  WHEN id = ? THEN (SELECT display_order FROM section_orders WHERE id = ?)
  WHEN id = ? THEN (SELECT display_order FROM section_orders WHERE id = ?)
END
WHERE id IN (?, ?);
```

### Move section to specific position

```sql
-- Move section to new position (e.g., drag from position 5 to position 2)
BEGIN;

-- Get current position
SELECT display_order INTO @old_order
FROM sections WHERE id = ?;

-- Shift sections in between
UPDATE sections
SET display_order = CASE
  WHEN ? < @old_order THEN display_order + 1  -- Moving up
  ELSE display_order - 1  -- Moving down
END
WHERE playbook_id = ?
AND display_order BETWEEN
  LEAST(?, @old_order) AND GREATEST(?, @old_order)
AND id != ?;

-- Move target section
UPDATE sections
SET display_order = ?
WHERE id = ?;

COMMIT;
```

### Compact display_order (remove gaps)

```sql
-- Reset display_order to consecutive integers (0, 1, 2, ...)
WITH ordered_sections AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, id) - 1 as new_order
  FROM sections
  WHERE playbook_id = ?
)
UPDATE sections
SET display_order = ordered_sections.new_order
FROM ordered_sections
WHERE sections.id = ordered_sections.id;
```

### Get section with play count

```sql
SELECT
  s.id,
  s.name,
  s.display_order,
  COUNT(p.id) as play_count,
  COUNT(p.id) FILTER (WHERE p.play_type = 'pass') as pass_count,
  COUNT(p.id) FILTER (WHERE p.play_type = 'run') as run_count
FROM sections s
LEFT JOIN plays p ON p.section_id = s.id
WHERE s.id = ?
GROUP BY s.id, s.name, s.display_order;
```

### Get sections with plays

```sql
-- Get sections with their plays (nested structure)
SELECT
  s.id as section_id,
  s.name as section_name,
  s.display_order,
  json_agg(
    json_build_object(
      'id', p.id,
      'name', p.name,
      'play_type', p.play_type,
      'display_order', p.display_order
    )
    ORDER BY p.display_order
  ) FILTER (WHERE p.id IS NOT NULL) as plays
FROM sections s
LEFT JOIN plays p ON p.section_id = s.id
WHERE s.playbook_id = ?
GROUP BY s.id, s.name, s.display_order
ORDER BY s.display_order;
```

### Move plays to different section

```sql
-- Move all plays from one section to another
UPDATE plays
SET section_id = ?
WHERE section_id = ?;

-- Or move specific plays
UPDATE plays
SET section_id = ?
WHERE id = ANY(?::bigint[]);
```

### Clone section to another playbook

```sql
-- Clone section structure (without plays)
INSERT INTO sections (playbook_id, name, display_order)
SELECT
  ?,  -- new playbook_id
  name,
  (SELECT COALESCE(MAX(display_order) + 1, 0)
   FROM sections WHERE playbook_id = ?)
FROM sections
WHERE id = ?
RETURNING id;

-- To also clone plays, see plays.md
```

## Display Order Management

### Best Practices

1. **Start at 0**: First section has `display_order = 0`
2. **Use gaps**: Consider using gaps (0, 10, 20, ...) to allow insertions without reordering
3. **Compact periodically**: Run compaction query to remove gaps
4. **Transaction safety**: Use transactions when reordering multiple sections

### Alternative: Fractional Ordering

Instead of integers, use DECIMAL for unlimited insertions:

```sql
-- Change display_order to DECIMAL
ALTER TABLE sections
ALTER COLUMN display_order TYPE DECIMAL(20, 10);

-- Insert between two sections
INSERT INTO sections (playbook_id, name, display_order)
VALUES (?, ?, (
  SELECT (a.display_order + b.display_order) / 2
  FROM sections a, sections b
  WHERE a.playbook_id = ? AND b.playbook_id = ?
  AND a.display_order < b.display_order
  ORDER BY a.display_order DESC, b.display_order ASC
  LIMIT 1
));
```

**Trade-offs:**
- Pros: No reordering needed, insertions are fast
- Cons: Eventually need rebalancing, less intuitive values

## See Also

- [playbooks.md](./playbooks.md) - Parent playbook structure
- [plays.md](./plays.md) - Plays within sections
- [../audit.md](../audit.md) - Section creation/modification tracking
