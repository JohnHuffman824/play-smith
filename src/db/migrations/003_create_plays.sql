-- Create ENUM type for hash position
CREATE TYPE hash_position AS ENUM ('left', 'middle', 'right');

-- Plays table
CREATE TABLE plays (
    id BIGSERIAL PRIMARY KEY,
    playbook_id BIGINT NOT NULL,
    name VARCHAR(255),
    formation_id BIGINT,
    personnel_id BIGINT,
    defensive_formation_id BIGINT,
    hash_position hash_position NOT NULL DEFAULT 'middle',
    notes TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_plays_playbook ON plays(playbook_id);

CREATE TRIGGER update_plays_updated_at
    BEFORE UPDATE ON plays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: formation_id, personnel_id, defensive_formation_id FKs will be added
-- in Phase 2 when we create those tables
