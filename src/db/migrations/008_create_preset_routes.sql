-- Migration 008: Create Preset Routes Table and Seed Standard Route Tree
-- Provides system-wide route templates for the standard 9-route tree

-- Table: preset_routes
-- Stores system and team-defined route templates
CREATE TABLE preset_routes (
	id BIGSERIAL PRIMARY KEY,
	team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	route_number INTEGER,
	drawing_template JSONB NOT NULL,
	created_by BIGINT REFERENCES users(id) ON DELETE RESTRICT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT preset_routes_name_team_unique UNIQUE NULLS NOT DISTINCT (team_id, name)
);

CREATE INDEX idx_preset_routes_team ON preset_routes(team_id);
CREATE INDEX idx_preset_routes_number ON preset_routes(route_number);

-- Seed standard 9-route tree (team_id=NULL for system routes)
-- Route geometries are simplified templates in feet coordinates
-- Points are relative to player start position (0, 0)

-- Route 1: Flat (Quick out to sideline)
INSERT INTO preset_routes (team_id, name, route_number, drawing_template, created_by) VALUES (
	NULL,
	'Flat',
	1,
	'{"id":"route-1-flat","points":{"p1":{"id":"p1","x":0,"y":0,"type":"start"},"p2":{"id":"p2","x":5,"y":0,"type":"end"}},"segments":[{"type":"line","pointIds":["p1","p2"]}],"style":{"color":"#000000","strokeWidth":2,"lineStyle":"solid","lineEnd":"arrow"},"annotations":[]}'::jsonb,
	NULL
);

-- Route 2: Slant (Quick diagonal inside)
INSERT INTO preset_routes (team_id, name, route_number, drawing_template, created_by) VALUES (
	NULL,
	'Slant',
	2,
	'{"id":"route-2-slant","points":{"p1":{"id":"p1","x":0,"y":0,"type":"start"},"p2":{"id":"p2","x":3,"y":-5,"type":"end"}},"segments":[{"type":"line","pointIds":["p1","p2"]}],"style":{"color":"#000000","strokeWidth":2,"lineStyle":"solid","lineEnd":"arrow"},"annotations":[]}'::jsonb,
	NULL
);

-- Route 3: Comeback (Out then back towards sideline)
INSERT INTO preset_routes (team_id, name, route_number, drawing_template, created_by) VALUES (
	NULL,
	'Comeback',
	3,
	'{"id":"route-3-comeback","points":{"p1":{"id":"p1","x":0,"y":0,"type":"start"},"p2":{"id":"p2","x":0,"y":-12,"type":"corner"},"p3":{"id":"p3","x":2,"y":-12,"type":"end"}},"segments":[{"type":"line","pointIds":["p1","p2"]},{"type":"line","pointIds":["p2","p3"]}],"style":{"color":"#000000","strokeWidth":2,"lineStyle":"solid","lineEnd":"arrow"},"annotations":[]}'::jsonb,
	NULL
);

-- Route 4: Curl (In then curl back to QB)
INSERT INTO preset_routes (team_id, name, route_number, drawing_template, created_by) VALUES (
	NULL,
	'Curl',
	4,
	'{"id":"route-4-curl","points":{"p1":{"id":"p1","x":0,"y":0,"type":"start"},"p2":{"id":"p2","x":0,"y":-10,"type":"corner"},"p3":{"id":"p3","x":0,"y":-8,"type":"end"}},"segments":[{"type":"line","pointIds":["p1","p2"]},{"type":"line","pointIds":["p2","p3"]}],"style":{"color":"#000000","strokeWidth":2,"lineStyle":"solid","lineEnd":"arrow"},"annotations":[]}'::jsonb,
	NULL
);

-- Route 5: Out (Out at 90 degrees to sideline)
INSERT INTO preset_routes (team_id, name, route_number, drawing_template, created_by) VALUES (
	NULL,
	'Out',
	5,
	'{"id":"route-5-out","points":{"p1":{"id":"p1","x":0,"y":0,"type":"start"},"p2":{"id":"p2","x":0,"y":-10,"type":"corner"},"p3":{"id":"p3","x":5,"y":-10,"type":"end"}},"segments":[{"type":"line","pointIds":["p1","p2"]},{"type":"line","pointIds":["p2","p3"]}],"style":{"color":"#000000","strokeWidth":2,"lineStyle":"solid","lineEnd":"arrow"},"annotations":[]}'::jsonb,
	NULL
);

-- Route 6: In/Dig (In at 90 degrees toward middle)
INSERT INTO preset_routes (team_id, name, route_number, drawing_template, created_by) VALUES (
	NULL,
	'In',
	6,
	'{"id":"route-6-in","points":{"p1":{"id":"p1","x":0,"y":0,"type":"start"},"p2":{"id":"p2","x":0,"y":-10,"type":"corner"},"p3":{"id":"p3","x":-5,"y":-10,"type":"end"}},"segments":[{"type":"line","pointIds":["p1","p2"]},{"type":"line","pointIds":["p2","p3"]}],"style":{"color":"#000000","strokeWidth":2,"lineStyle":"solid","lineEnd":"arrow"},"annotations":[]}'::jsonb,
	NULL
);

-- Route 7: Corner (Deep outside angle)
INSERT INTO preset_routes (team_id, name, route_number, drawing_template, created_by) VALUES (
	NULL,
	'Corner',
	7,
	'{"id":"route-7-corner","points":{"p1":{"id":"p1","x":0,"y":0,"type":"start"},"p2":{"id":"p2","x":0,"y":-12,"type":"corner"},"p3":{"id":"p3","x":8,"y":-20,"type":"end"}},"segments":[{"type":"line","pointIds":["p1","p2"]},{"type":"line","pointIds":["p2","p3"]}],"style":{"color":"#000000","strokeWidth":2,"lineStyle":"solid","lineEnd":"arrow"},"annotations":[]}'::jsonb,
	NULL
);

-- Route 8: Post (Deep inside angle)
INSERT INTO preset_routes (team_id, name, route_number, drawing_template, created_by) VALUES (
	NULL,
	'Post',
	8,
	'{"id":"route-8-post","points":{"p1":{"id":"p1","x":0,"y":0,"type":"start"},"p2":{"id":"p2","x":0,"y":-12,"type":"corner"},"p3":{"id":"p3","x":-8,"y":-20,"type":"end"}},"segments":[{"type":"line","pointIds":["p1","p2"]},{"type":"line","pointIds":["p2","p3"]}],"style":{"color":"#000000","strokeWidth":2,"lineStyle":"solid","lineEnd":"arrow"},"annotations":[]}'::jsonb,
	NULL
);

-- Route 9: Go/Streak (Straight vertical)
INSERT INTO preset_routes (team_id, name, route_number, drawing_template, created_by) VALUES (
	NULL,
	'Go',
	9,
	'{"id":"route-9-go","points":{"p1":{"id":"p1","x":0,"y":0,"type":"start"},"p2":{"id":"p2","x":0,"y":-20,"type":"end"}},"segments":[{"type":"line","pointIds":["p1","p2"]}],"style":{"color":"#000000","strokeWidth":2,"lineStyle":"solid","lineEnd":"arrow"},"annotations":[]}'::jsonb,
	NULL
);
