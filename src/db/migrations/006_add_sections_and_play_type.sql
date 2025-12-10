-- Create sections table for organizing plays within playbooks
CREATE TABLE sections (
	id BIGSERIAL PRIMARY KEY,
	playbook_id BIGINT NOT NULL,
	name VARCHAR(255) NOT NULL,
	display_order INTEGER NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
	UNIQUE (playbook_id, display_order)
);

CREATE INDEX idx_sections_playbook_id ON sections(playbook_id);

CREATE TRIGGER update_sections_updated_at
	BEFORE UPDATE ON sections
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

-- Add play type enum and column to plays table
CREATE TYPE play_type AS ENUM ('pass', 'run');

ALTER TABLE plays ADD COLUMN play_type play_type;
ALTER TABLE plays ADD COLUMN section_id BIGINT REFERENCES sections(id) ON DELETE SET NULL;

CREATE INDEX idx_plays_section ON plays(section_id);
