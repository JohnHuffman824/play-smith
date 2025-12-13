# Drawings (Routes)

This document describes the route drawing system with fully normalized segments and control points.

## Overview

Drawings represent routes, blocking assignments, and movement paths:
- Composed of segments (line, quadratic curve, cubic curve)
- Each segment contains control points
- PostGIS spatial indexing for merge detection
- Bidirectional linking with players
- Template instantiation support

## Tables

### drawings

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

**Fields:**
- `id`: Unique identifier
- `play_id`: Parent play
- `linked_player_id`: Player this route is linked to (bidirectional)
- `linked_point_id`: Anchor point that moves with player
- `template_id`: Route template used to create this drawing
- `style_color`: Hex color code
- `style_stroke_width`: Line thickness (decimal for sub-pixel precision)
- `style_line_style`: solid or dashed
- `style_line_end`: none, arrow, or tShape (rendered on end points)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Style Properties:**
- All style properties are at drawing level (one style per route)
- Line ends (arrows/tShapes) rendered on control points with `type='end'`

**Constraints:**
- `ON DELETE CASCADE` for `play_id`: Delete drawing when play deleted
- `ON DELETE SET NULL` for links: Unlink if player/point/template deleted

### segments

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

**Fields:**
- `id`: Unique identifier
- `drawing_id`: Parent drawing
- `segment_index`: Order within drawing (0-indexed)
- `type`: line, quadratic, or cubic

**Segment Types:**
- **line**: Straight line segment (2 control points)
- **quadratic**: Quadratic Bezier curve (1 control point with handles)
- **cubic**: Cubic Bezier curve (2+ control points with handles)

**Constraints:**
- `UNIQUE (drawing_id, segment_index)`: No duplicate indexes per drawing
- `ON DELETE CASCADE`: Remove segments when drawing deleted

### control_points

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

**Fields:**
- `id`: Unique identifier
- `segment_id`: Parent segment
- `point_index`: Order within segment (0-indexed)
- `type`: start, end, corner, or curve
- `location`: PostGIS POINT geometry for spatial queries
- `x`, `y`: Coordinates in feet (synced with location via trigger)
- `handle_in_x/y`: Incoming Bezier handle (for curves)
- `handle_out_x/y`: Outgoing Bezier handle (for curves)

**Point Types:**
- **start**: First point of drawing (may be linked to player)
- **end**: Last point of drawing (receives line_end decoration)
- **corner**: Sharp turn point
- **curve**: Smooth curve point (with handles)

**Bezier Handles:**
- Only used for quadratic/cubic segments
- `handle_in`: Controls incoming curve
- `handle_out`: Controls outgoing curve
- Null for straight line segments

**Constraints:**
- `UNIQUE (segment_id, point_index)`: No duplicate indexes per segment
- `ON DELETE CASCADE`: Remove points when segment deleted

## Relationships

```
plays (1) ─────< (M) drawings
     "contains routes"

drawings (1) ─────< (M) segments
        "composed of"

segments (1) ─────< (M) control_points
        "contains points"

drawings (1) ─────── (1) players (optional)
        "linked to"
           ↓
    control_points (1)
    "anchored to player via"

route_templates (1) ─────< (M) drawings
               "instantiated as"
```

## Drawing-Player Linking

Bidirectional relationship for synchronized movement:

```
players.linked_drawing_id → drawings.id
drawings.linked_player_id → players.id
drawings.linked_point_id → control_points.id
```

**Linking constraints:**
- One player can have one linked drawing
- One drawing can link to one player
- Anchor point (linked_point_id) typically the first control point (start)
- Prevents merging two drawings if both have player links

## PostGIS Spatial Features

### Merge Detection

Find nearby control points for snapping/merging:

```sql
-- Find control points within 2 feet of a point
SELECT cp.id, cp.x, cp.y, ST_Distance(cp.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)) as distance
FROM control_points cp
JOIN segments s ON s.id = cp.segment_id
JOIN drawings d ON d.id = s.drawing_id
WHERE d.play_id = ?
AND ST_DWithin(cp.location, ST_SetSRID(ST_MakePoint(?, ?), 4326), 2)
ORDER BY distance
LIMIT 5;
```

### Route Proximity

Find routes near a point:

```sql
-- Find drawings with control points near a location
SELECT DISTINCT d.*
FROM drawings d
JOIN segments s ON s.drawing_id = d.id
JOIN control_points cp ON cp.segment_id = s.id
WHERE d.play_id = ?
AND ST_DWithin(cp.location, ST_SetSRID(ST_MakePoint(?, ?), 4326), 5);
```

## Example Queries

### Get complete drawing with segments and points

```sql
SELECT
  d.id as drawing_id,
  d.style_color,
  d.style_stroke_width,
  d.style_line_style,
  d.style_line_end,
  d.linked_player_id,
  json_agg(
    json_build_object(
      'segment_id', s.id,
      'segment_index', s.segment_index,
      'segment_type', s.type,
      'control_points', (
        SELECT json_agg(
          json_build_object(
            'id', cp.id,
            'point_index', cp.point_index,
            'type', cp.type,
            'x', cp.x,
            'y', cp.y,
            'handle_in_x', cp.handle_in_x,
            'handle_in_y', cp.handle_in_y,
            'handle_out_x', cp.handle_out_x,
            'handle_out_y', cp.handle_out_y
          )
          ORDER BY cp.point_index
        )
        FROM control_points cp
        WHERE cp.segment_id = s.id
      )
    )
    ORDER BY s.segment_index
  ) as segments
FROM drawings d
LEFT JOIN segments s ON s.drawing_id = d.id
WHERE d.id = ?
GROUP BY d.id;
```

### Create simple line drawing

```sql
-- Insert drawing
INSERT INTO drawings (play_id, style_color, style_line_end)
VALUES (?, '#0000FF', 'arrow')
RETURNING id;

-- Insert single segment
INSERT INTO segments (drawing_id, segment_index, type)
VALUES (?, 0, 'line')
RETURNING id;

-- Insert control points
INSERT INTO control_points (segment_id, point_index, type, x, y)
VALUES
  (?, 0, 'start', 10, 5),
  (?, 1, 'end', 30, 15);
```

### Create curved route

```sql
-- Insert drawing
INSERT INTO drawings (play_id, style_color, style_line_end)
VALUES (?, '#FF0000', 'arrow')
RETURNING id;

-- Insert quadratic segment
INSERT INTO segments (drawing_id, segment_index, type)
VALUES (?, 0, 'quadratic')
RETURNING id;

-- Insert control points with handles
INSERT INTO control_points (
  segment_id, point_index, type, x, y,
  handle_in_x, handle_in_y, handle_out_x, handle_out_y
)
VALUES
  (?, 0, 'start', 10, 5, NULL, NULL, 12, 8),
  (?, 1, 'curve', 20, 15, 18, 12, 22, 18),
  (?, 2, 'end', 30, 25, 28, 22, NULL, NULL);
```

### Link drawing to player

```sql
-- Link drawing to player
UPDATE drawings
SET linked_player_id = ?, linked_point_id = ?
WHERE id = ?;

-- Also update player
UPDATE players
SET linked_drawing_id = ?
WHERE id = ?;
```

### Update drawing style

```sql
UPDATE drawings
SET
  style_color = ?,
  style_stroke_width = ?,
  style_line_style = ?,
  style_line_end = ?
WHERE id = ?;
```

### Move control point

```sql
-- Location automatically synced via trigger
UPDATE control_points
SET x = ?, y = ?
WHERE id = ?;
```

### Update Bezier handles

```sql
UPDATE control_points
SET
  handle_in_x = ?,
  handle_in_y = ?,
  handle_out_x = ?,
  handle_out_y = ?
WHERE id = ?;
```

### Delete drawing

```sql
-- Cascades to segments and control_points
DELETE FROM drawings WHERE id = ?;
```

### Clone drawing to new play

```sql
-- Clone drawing
INSERT INTO drawings (
  play_id, style_color, style_stroke_width,
  style_line_style, style_line_end
)
SELECT
  ?, style_color, style_stroke_width,
  style_line_style, style_line_end
FROM drawings
WHERE id = ?
RETURNING id;

-- Clone segments
WITH new_segments AS (
  INSERT INTO segments (drawing_id, segment_index, type)
  SELECT ?, segment_index, type
  FROM segments
  WHERE drawing_id = ?
  RETURNING id, segment_index
)
-- Clone control points
INSERT INTO control_points (
  segment_id, point_index, type, x, y,
  handle_in_x, handle_in_y, handle_out_x, handle_out_y
)
SELECT
  ns.id, cp.point_index, cp.type, cp.x, cp.y,
  cp.handle_in_x, cp.handle_in_y, cp.handle_out_x, cp.handle_out_y
FROM control_points cp
JOIN segments s ON s.id = cp.segment_id
JOIN new_segments ns ON ns.segment_index = s.segment_index
WHERE s.drawing_id = ?;
```

### Merge two drawings

```sql
-- Merge drawing B into drawing A (at connection point)
-- 1. Find connection points (use spatial query)
-- 2. Offset segment_index values for drawing B
UPDATE segments
SET
  drawing_id = ?,  -- target drawing A
  segment_index = segment_index + ?  -- offset by A's segment count
WHERE drawing_id = ?;  -- source drawing B

-- 3. Delete source drawing B (segments now belong to A)
DELETE FROM drawings WHERE id = ?;

-- Note: Application must handle connecting control points
```

### Get all drawings for a play

```sql
SELECT
  d.*,
  p.label as linked_player_label,
  COUNT(DISTINCT s.id) as segment_count,
  COUNT(cp.id) as control_point_count
FROM drawings d
LEFT JOIN players p ON p.id = d.linked_player_id
LEFT JOIN segments s ON s.drawing_id = d.id
LEFT JOIN control_points cp ON cp.segment_id = s.id
WHERE d.play_id = ?
GROUP BY d.id, p.label;
```

### Instantiate route template

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
-- Clone template control points (with position transforms)
INSERT INTO control_points (
  segment_id, point_index, type,
  x, y,  -- Apply transforms here (scale, rotate, translate)
  handle_in_x, handle_in_y, handle_out_x, handle_out_y
)
SELECT
  ns.id,
  rtcp.point_index,
  rtcp.type,
  rtcp.x + ?,  -- x_offset
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

## Drawing Annotations

Future feature for route notes:

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

**Usage:**
- Add coach notes at specific route points
- Examples: "12-yard break", "stack the DB", "look for safety rotation"
- Offset allows positioning annotation away from route line

## Merge Prevention Logic

Application-level validation to prevent merging when both drawings have player links:

```sql
-- Check if merge would violate player linking rule
SELECT
  d1.linked_player_id IS NOT NULL as drawing1_linked,
  d2.linked_player_id IS NOT NULL as drawing2_linked
FROM drawings d1, drawings d2
WHERE d1.id = ? AND d2.id = ?;

-- If both are TRUE, reject merge operation
```

## See Also

- [players.md](./players.md) - Player positioning and linking
- [../playbooks/plays.md](../playbooks/plays.md) - Parent play structure
- [../organization/concepts.md](../organization/concepts.md) - Route templates
- [../audit.md](../audit.md) - Drawing change tracking
