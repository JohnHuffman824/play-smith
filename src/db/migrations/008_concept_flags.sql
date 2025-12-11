-- Migration 008: Add concept flags (is_motion, is_modifier) and modifier overrides
-- Adds additional functionality to base_concepts for motion and modifier concepts

-- Add concept flags to base_concepts
ALTER TABLE base_concepts ADD COLUMN is_motion BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE base_concepts ADD COLUMN is_modifier BOOLEAN NOT NULL DEFAULT false;

-- Create modifier formation overrides table
CREATE TABLE modifier_formation_overrides (
  id BIGSERIAL PRIMARY KEY,
  modifier_concept_id BIGINT NOT NULL REFERENCES base_concepts(id) ON DELETE CASCADE,
  formation_id BIGINT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  override_rules JSONB NOT NULL, -- {role: "Y", delta_x: -3, delta_y: 0}
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT modifier_override_unique UNIQUE (modifier_concept_id, formation_id)
);

-- Index for faster lookups
CREATE INDEX idx_modifier_overrides_concept ON modifier_formation_overrides(modifier_concept_id);
CREATE INDEX idx_modifier_overrides_formation ON modifier_formation_overrides(formation_id);
