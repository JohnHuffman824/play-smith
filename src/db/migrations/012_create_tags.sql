-- Migration 012: Create Tags System (DEPRECATED - renamed to labels in migration 018)
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    is_preset BOOLEAN NOT NULL DEFAULT false,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tags_preset_check CHECK (
        (is_preset = true AND team_id IS NULL) OR
        (is_preset = false AND team_id IS NOT NULL)
    ),
    CONSTRAINT tags_name_scope_unique UNIQUE NULLS NOT DISTINCT (team_id, name)
);

CREATE INDEX idx_tags_team ON tags(team_id);
CREATE INDEX idx_tags_preset ON tags(is_preset);

CREATE TABLE play_tags (
    id BIGSERIAL PRIMARY KEY,
    play_id BIGINT NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT play_tags_unique UNIQUE (play_id, tag_id)
);

CREATE INDEX idx_play_tags_play ON play_tags(play_id);
CREATE INDEX idx_play_tags_tag ON play_tags(tag_id);

CREATE TABLE playbook_tags (
    id BIGSERIAL PRIMARY KEY,
    playbook_id BIGINT NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT playbook_tags_unique UNIQUE (playbook_id, tag_id)
);

CREATE INDEX idx_playbook_tags_playbook ON playbook_tags(playbook_id);
CREATE INDEX idx_playbook_tags_tag ON playbook_tags(tag_id);

-- Seed preset tags
INSERT INTO tags (name, color, is_preset, team_id, created_by) VALUES
    ('Short Yardage', '#10B981', true, NULL, NULL),
    ('Mid Yardage', '#FBBF24', true, NULL, NULL),
    ('Long Yardage', '#F97316', true, NULL, NULL),
    ('Redzone', '#EF4444', true, NULL, NULL),
    ('Goal Line', '#F43F5E', true, NULL, NULL),
    ('3rd Down', '#3B82F6', true, NULL, NULL),
    ('Quick Game', '#8B5CF6', true, NULL, NULL),
    ('Play Action', '#6366F1', true, NULL, NULL),
    ('RPO', '#14B8A6', true, NULL, NULL),
    ('Option', '#06B6D4', true, NULL, NULL);
