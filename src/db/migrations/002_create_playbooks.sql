-- Create ENUM type for playbook share permissions
CREATE TYPE share_permission AS ENUM ('view', 'edit');

-- Playbooks table
CREATE TABLE playbooks (
	id BIGSERIAL PRIMARY KEY,
	team_id BIGINT NOT NULL,
	name VARCHAR(255) NOT NULL,
	description TEXT,
	created_by BIGINT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
	FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_playbooks_team ON playbooks(team_id);
CREATE INDEX idx_playbooks_created_by ON playbooks(created_by);

CREATE TRIGGER update_playbooks_updated_at
	BEFORE UPDATE ON playbooks
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

-- Playbook sharing (team-to-team)
CREATE TABLE playbook_shares (
	id BIGSERIAL PRIMARY KEY,
	playbook_id BIGINT NOT NULL,
	shared_with_team_id BIGINT NOT NULL,
	permission share_permission NOT NULL DEFAULT 'view',
	shared_by BIGINT NOT NULL,
	shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (playbook_id, shared_with_team_id),
	FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
	FOREIGN KEY (shared_with_team_id) REFERENCES teams(id) ON DELETE CASCADE,
	FOREIGN KEY (shared_by) REFERENCES users(id)
);

CREATE INDEX idx_playbook_shares_shared_team
	ON playbook_shares(shared_with_team_id);
