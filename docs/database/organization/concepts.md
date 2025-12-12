# Concepts (Personnel & Routes)

This document describes team libraries for personnel packages and route templates.

## Overview

Teams maintain reusable concepts:
- **Personnel packages**: Player groupings (11 personnel, 12 personnel, etc.)
- **Route templates**: Reusable route patterns with geometry

## Tables

### personnel_packages

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

**Fields:**
- `id`: Unique identifier
- `team_id`: Owning team
- `name`: Personnel package name
- `code`: Optional shorthand (e.g., "11", "12")
- `description`: Breakdown of positions (e.g., "1 RB, 1 TE, 3 WR")
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- `UNIQUE (team_id, name)`: No duplicate personnel names per team
- `ON DELETE CASCADE` for `team_id`: Remove packages when team deleted

**Indexes:**
- `idx_personnel_packages_team`: Find all personnel packages for a team

### route_templates

```sql
CREATE TYPE line_style AS ENUM ('solid', 'dashed');
CREATE TYPE line_end AS ENUM ('none', 'arrow', 'tShape');

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

**Fields:**
- `id`: Unique identifier
- `team_id`: Owning team
- `name`: Route template name
- `description`: Route notes/details
- `default_color`: Default hex color for instantiated routes
- `default_stroke_width`: Default line thickness
- `default_line_style`: solid or dashed
- `default_line_end`: arrow, tShape, or none
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- `UNIQUE (team_id, name)`: No duplicate route names per team
- `ON DELETE CASCADE` for `team_id`: Remove routes when team deleted

### route_template_segments

```sql
CREATE TYPE segment_type AS ENUM ('line', 'quadratic', 'cubic');

CREATE TABLE route_template_segments (
    id BIGSERIAL PRIMARY KEY,
    route_template_id BIGINT NOT NULL,
    segment_index INT NOT NULL,
    type segment_type NOT NULL DEFAULT 'line',
    FOREIGN KEY (route_template_id) REFERENCES route_templates(id) ON DELETE CASCADE,
    UNIQUE (route_template_id, segment_index)
);

CREATE INDEX idx_route_template_segments_template ON route_template_segments(route_template_id);
```

**Fields:**
- `id`: Unique identifier
- `route_template_id`: Parent template
- `segment_index`: Order within template (0-indexed)
- `type`: line, quadratic, or cubic

**Constraints:**
- `UNIQUE (route_template_id, segment_index)`: No duplicate indexes
- `ON DELETE CASCADE`: Remove segments when template deleted

### route_template_control_points

```sql
CREATE TYPE point_type AS ENUM ('start', 'end', 'corner', 'curve');

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

**Fields:**
- `id`: Unique identifier
- `template_segment_id`: Parent segment
- `point_index`: Order within segment (0-indexed)
- `type`: start, end, corner, or curve
- `x`, `y`: Relative coordinates (feet)
- `handle_in_x/y`: Incoming Bezier handle
- `handle_out_x/y`: Outgoing Bezier handle

**Constraints:**
- `UNIQUE (template_segment_id, point_index)`: No duplicate indexes
- `ON DELETE CASCADE`: Remove points when segment deleted

## Relationships

```
teams (1) ─────< (M) personnel_packages
     "owns packages"

teams (1) ─────< (M) route_templates
     "owns route library"

route_templates (1) ─────< (M) route_template_segments
               "composed of"

route_template_segments (1) ─────< (M) route_template_control_points
                       "contains points"

plays (M) >────── (1) personnel_packages
     "uses package"

drawings (M) >────── (1) route_templates
        "instantiated from"
```

## Personnel Packages

### Standard Personnel Groupings

Personnel packages are named by number of RBs and TEs:
- **First digit**: Running backs
- **Second digit**: Tight ends
- **Remaining**: Wide receivers (assumed to total 5 skill players)

**Examples:**
- **11 Personnel**: 1 RB, 1 TE, 3 WR (most common)
- **12 Personnel**: 1 RB, 2 TE, 2 WR (power running)
- **10 Personnel**: 1 RB, 0 TE, 4 WR (spread passing)
- **21 Personnel**: 2 RB, 1 TE, 2 WR (heavy running)
- **13 Personnel**: 1 RB, 3 TE, 1 WR (goal line)

### Example Queries

#### Get all personnel packages for team

```sql
SELECT
  id,
  name,
  code,
  description,
  (SELECT COUNT(*) FROM plays WHERE personnel_id = personnel_packages.id) as usage_count
FROM personnel_packages
WHERE team_id = ?
ORDER BY code, name;
```

#### Create personnel package

```sql
INSERT INTO personnel_packages (team_id, name, code, description)
VALUES (?, '11 Personnel', '11', '1 RB, 1 TE, 3 WR')
RETURNING id;
```

#### Update personnel package

```sql
UPDATE personnel_packages
SET name = ?, code = ?, description = ?
WHERE id = ? AND team_id = ?;
```

#### Delete personnel package

```sql
-- Sets plays.personnel_id to NULL (ON DELETE SET NULL in plays table)
DELETE FROM personnel_packages
WHERE id = ? AND team_id = ?;
```

#### Get plays using personnel package

```sql
SELECT
  p.id,
  p.name,
  p.play_type,
  pb.name as playbook_name
FROM plays p
JOIN playbooks pb ON pb.id = p.playbook_id
WHERE p.personnel_id = ?
ORDER BY p.name;
```

### Migration: Seed Default Personnel Packages

```sql
-- Run when team is created
INSERT INTO personnel_packages (team_id, name, code, description) VALUES
  (?, '10 Personnel', '10', '1 RB, 0 TE, 4 WR'),
  (?, '11 Personnel', '11', '1 RB, 1 TE, 3 WR'),
  (?, '12 Personnel', '12', '1 RB, 2 TE, 2 WR'),
  (?, '13 Personnel', '13', '1 RB, 3 TE, 1 WR'),
  (?, '20 Personnel', '20', '2 RB, 0 TE, 3 WR'),
  (?, '21 Personnel', '21', '2 RB, 1 TE, 2 WR'),
  (?, '22 Personnel', '22', '2 RB, 2 TE, 1 WR');
```

## Route Templates

### Common Route Types

**Individual Routes:**
- Go/Fly/9 Route (vertical)
- Post/8 Route (vertical then angle in)
- Corner/7 Route (vertical then angle out)
- Dig/In/6 Route (horizontal in)
- Out/5 Route (horizontal out)
- Curl/4 Route (comeback)
- Slant/3 Route (quick diagonal in)
- Hitch/2 Route (quick stop)
- Flat/1 Route (horizontal shallow)

**Concepts (multi-route combinations):**
- Stick Concept (curl + flat)
- Mesh Concept (crossing routes)
- Flood Concept (3 levels vertical)
- Smash Concept (corner + flat)
- Y-Cross (tight end crosser)

### Example Queries

#### Get all route templates for team

```sql
SELECT
  id,
  name,
  description,
  default_color,
  default_line_end,
  (SELECT COUNT(*) FROM drawings WHERE template_id = route_templates.id) as usage_count
FROM route_templates
WHERE team_id = ?
ORDER BY name;
```

#### Get route template with geometry

```sql
SELECT
  rt.id,
  rt.name,
  rt.description,
  rt.default_color,
  rt.default_stroke_width,
  rt.default_line_style,
  rt.default_line_end,
  json_agg(
    json_build_object(
      'segment_id', rts.id,
      'segment_index', rts.segment_index,
      'segment_type', rts.type,
      'control_points', (
        SELECT json_agg(
          json_build_object(
            'id', rtcp.id,
            'point_index', rtcp.point_index,
            'type', rtcp.type,
            'x', rtcp.x,
            'y', rtcp.y,
            'handle_in_x', rtcp.handle_in_x,
            'handle_in_y', rtcp.handle_in_y,
            'handle_out_x', rtcp.handle_out_x,
            'handle_out_y', rtcp.handle_out_y
          )
          ORDER BY rtcp.point_index
        )
        FROM route_template_control_points rtcp
        WHERE rtcp.template_segment_id = rts.id
      )
    )
    ORDER BY rts.segment_index
  ) as segments
FROM route_templates rt
LEFT JOIN route_template_segments rts ON rts.route_template_id = rt.id
WHERE rt.id = ?
GROUP BY rt.id;
```

#### Create route template

```sql
-- Create template
INSERT INTO route_templates (
  team_id, name, description,
  default_color, default_stroke_width, default_line_style, default_line_end
)
VALUES (?, 'Go Route', 'Vertical route', '#0000FF', 2.0, 'solid', 'arrow')
RETURNING id;

-- Add segment
INSERT INTO route_template_segments (route_template_id, segment_index, type)
VALUES (?, 0, 'line')
RETURNING id;

-- Add control points
INSERT INTO route_template_control_points (
  template_segment_id, point_index, type, x, y
)
VALUES
  (?, 0, 'start', 0, 0),
  (?, 1, 'end', 0, 30);  -- 30 yards vertical
```

#### Save drawing as route template

```sql
-- Create template from existing drawing
INSERT INTO route_templates (
  team_id, name, description,
  default_color, default_stroke_width, default_line_style, default_line_end
)
SELECT
  ?,
  ?,
  ?,
  d.style_color,
  d.style_stroke_width,
  d.style_line_style,
  d.style_line_end
FROM drawings d
WHERE d.id = ?
RETURNING id;

-- Clone segments
WITH new_segments AS (
  INSERT INTO route_template_segments (route_template_id, segment_index, type)
  SELECT ?, segment_index, type
  FROM segments
  WHERE drawing_id = ?
  RETURNING id, segment_index
)
-- Clone control points
INSERT INTO route_template_control_points (
  template_segment_id, point_index, type, x, y,
  handle_in_x, handle_in_y, handle_out_x, handle_out_y
)
SELECT
  ns.id,
  cp.point_index,
  cp.type,
  cp.x,
  cp.y,
  cp.handle_in_x,
  cp.handle_in_y,
  cp.handle_out_x,
  cp.handle_out_y
FROM control_points cp
JOIN segments s ON s.id = cp.segment_id
JOIN new_segments ns ON ns.segment_index = s.segment_index
WHERE s.drawing_id = ?;
```

#### Instantiate route template onto play

```sql
-- Create drawing from template
INSERT INTO drawings (
  play_id, template_id,
  style_color, style_stroke_width, style_line_style, style_line_end
)
SELECT
  ?,
  rt.id,
  rt.default_color,
  rt.default_stroke_width,
  rt.default_line_style,
  rt.default_line_end
FROM route_templates rt
WHERE rt.id = ?
RETURNING id;

-- Clone template segments
WITH new_segments AS (
  INSERT INTO segments (drawing_id, segment_index, type)
  SELECT ?, segment_index, type
  FROM route_template_segments
  WHERE route_template_id = ?
  RETURNING id, segment_index
)
-- Clone template control points with position transforms
INSERT INTO control_points (
  segment_id, point_index, type,
  x, y,
  handle_in_x, handle_in_y, handle_out_x, handle_out_y
)
SELECT
  ns.id,
  rtcp.point_index,
  rtcp.type,
  rtcp.x + ?,  -- x_offset (translate to player position)
  rtcp.y + ?,  -- y_offset
  rtcp.handle_in_x,
  rtcp.handle_in_y,
  rtcp.handle_out_x,
  rtcp.handle_out_y
FROM route_template_control_points rtcp
JOIN route_template_segments rts ON rts.id = rtcp.template_segment_id
JOIN new_segments ns ON ns.segment_index = rts.segment_index
WHERE rts.route_template_id = ?;
```

#### Update route template

```sql
UPDATE route_templates
SET
  name = ?,
  description = ?,
  default_color = ?,
  default_stroke_width = ?,
  default_line_style = ?,
  default_line_end = ?
WHERE id = ? AND team_id = ?;
```

#### Delete route template

```sql
-- Cascades to route_template_segments and route_template_control_points
-- Sets drawings.template_id to NULL (ON DELETE SET NULL in drawings table)
DELETE FROM route_templates
WHERE id = ? AND team_id = ?;
```

#### Get most used route templates

```sql
SELECT
  rt.id,
  rt.name,
  rt.description,
  COUNT(d.id) as usage_count
FROM route_templates rt
LEFT JOIN drawings d ON d.template_id = rt.id
WHERE rt.team_id = ?
GROUP BY rt.id, rt.name, rt.description
ORDER BY usage_count DESC, rt.name
LIMIT 10;
```

#### Search route templates by name

```sql
SELECT *
FROM route_templates
WHERE team_id = ?
AND name ILIKE '%' || ? || '%'
ORDER BY name;
```

### Route Template Transforms

When instantiating a template, apply transforms to control points:

**Translate (move):**
```
new_x = template_x + offset_x
new_y = template_y + offset_y
```

**Scale (resize):**
```
new_x = template_x * scale_x
new_y = template_y * scale_y
```

**Rotate (turn):**
```
new_x = template_x * cos(angle) - template_y * sin(angle)
new_y = template_x * sin(angle) + template_y * cos(angle)
```

**Flip horizontal:**
```
new_x = -template_x
new_y = template_y
```

## Base Concepts Table (Optional)

For advanced implementations, track concept relationships:

```sql
CREATE TABLE base_concepts (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE (team_id, name)
);

CREATE TABLE concept_routes (
    id BIGSERIAL PRIMARY KEY,
    concept_id BIGINT NOT NULL,
    route_template_id BIGINT NOT NULL,
    position_label VARCHAR(2),  -- Which position runs this route
    FOREIGN KEY (concept_id) REFERENCES base_concepts(id) ON DELETE CASCADE,
    FOREIGN KEY (route_template_id) REFERENCES route_templates(id) ON DELETE CASCADE
);
```

**Example: Stick Concept**
- X runs curl route (template: "Curl Route")
- Y runs flat route (template: "Flat Route")
- Z runs vertical route (template: "Go Route")

## See Also

- [../playbooks/plays.md](../playbooks/plays.md) - Play personnel references
- [../canvas/drawings.md](../canvas/drawings.md) - Route drawings and instantiation
- [formations.md](./formations.md) - Formation libraries
- [../core/users-teams.md](../core/users-teams.md) - Team ownership
- [../audit.md](../audit.md) - Template change tracking
