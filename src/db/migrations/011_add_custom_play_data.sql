-- Add custom play data columns to support free-form editing

ALTER TABLE plays ADD COLUMN custom_players JSONB DEFAULT '[]'::jsonb;
ALTER TABLE plays ADD COLUMN custom_drawings JSONB DEFAULT '[]'::jsonb;

CREATE INDEX idx_plays_custom_players ON plays USING gin(custom_players);
CREATE INDEX idx_plays_custom_drawings ON plays USING gin(custom_drawings);

COMMENT ON COLUMN plays.custom_players IS 'Free-form player positions not derived from formations';
COMMENT ON COLUMN plays.custom_drawings IS 'Free-form drawings/routes not derived from concepts';
