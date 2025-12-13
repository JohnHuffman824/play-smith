-- Migration 018: Rename tags to labels
-- Renames all tag-related tables and columns to use "label" terminology

-- Rename tables
ALTER TABLE tags RENAME TO labels;
ALTER TABLE play_tags RENAME TO play_labels;
ALTER TABLE playbook_tags RENAME TO playbook_labels;

-- Rename indexes
ALTER INDEX idx_tags_team RENAME TO idx_labels_team;
ALTER INDEX idx_tags_preset RENAME TO idx_labels_preset;
ALTER INDEX idx_play_tags_play RENAME TO idx_play_labels_play;
ALTER INDEX idx_play_tags_tag RENAME TO idx_play_labels_label;
ALTER INDEX idx_playbook_tags_playbook RENAME TO idx_playbook_labels_playbook;
ALTER INDEX idx_playbook_tags_tag RENAME TO idx_playbook_labels_label;

-- Rename constraints
ALTER TABLE labels RENAME CONSTRAINT tags_preset_check TO labels_preset_check;
ALTER TABLE labels RENAME CONSTRAINT tags_name_scope_unique TO labels_name_scope_unique;
ALTER TABLE play_labels RENAME CONSTRAINT play_tags_unique TO play_labels_unique;
ALTER TABLE playbook_labels RENAME CONSTRAINT playbook_tags_unique TO playbook_labels_unique;

-- Rename foreign key columns
ALTER TABLE play_labels RENAME COLUMN tag_id TO label_id;
ALTER TABLE playbook_labels RENAME COLUMN tag_id TO label_id;

-- Update comment for clarity
COMMENT ON TABLE labels IS 'Visual labels for categorizing plays and playbooks (not to be confused with route tags in football)';
