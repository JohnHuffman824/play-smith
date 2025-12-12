-- Migration 016: Create Presentations
CREATE TABLE presentations (
    id BIGSERIAL PRIMARY KEY,
    playbook_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_presentations_playbook ON presentations(playbook_id);
CREATE INDEX idx_presentations_created_by ON presentations(created_by);

CREATE TRIGGER update_presentations_updated_at
    BEFORE UPDATE ON presentations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Junction table for slides
CREATE TABLE presentation_slides (
    id BIGSERIAL PRIMARY KEY,
    presentation_id BIGINT NOT NULL,
    play_id BIGINT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
    FOREIGN KEY (play_id) REFERENCES plays(id) ON DELETE CASCADE
);

CREATE INDEX idx_presentation_slides_presentation ON presentation_slides(presentation_id);
CREATE INDEX idx_presentation_slides_play ON presentation_slides(play_id);
CREATE UNIQUE INDEX idx_presentation_slides_order ON presentation_slides(presentation_id, display_order);
