-- Add thumbnail support to concept architecture tables
-- Thumbnails stored as base64-encoded PNG images

-- Add thumbnail to formations
ALTER TABLE formations
ADD COLUMN thumbnail TEXT NULL;

-- Add thumbnail to base_concepts
ALTER TABLE base_concepts
ADD COLUMN thumbnail TEXT NULL;

-- Add thumbnail to concept_groups
ALTER TABLE concept_groups
ADD COLUMN thumbnail TEXT NULL;

-- Add indexes for faster queries
CREATE INDEX idx_formations_thumbnail ON formations(id) WHERE thumbnail IS NOT NULL;
CREATE INDEX idx_base_concepts_thumbnail ON base_concepts(id) WHERE thumbnail IS NOT NULL;
CREATE INDEX idx_concept_groups_thumbnail ON concept_groups(id) WHERE thumbnail IS NOT NULL;
