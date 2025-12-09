-- Playbooks table
CREATE TABLE playbooks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_team (team_id),
    INDEX idx_created_by (created_by)
);

-- Playbook sharing (team-to-team)
CREATE TABLE playbook_shares (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    playbook_id BIGINT UNSIGNED NOT NULL,
    shared_with_team_id BIGINT UNSIGNED NOT NULL,
    permission ENUM('view', 'edit') NOT NULL DEFAULT 'view',
    shared_by BIGINT UNSIGNED NOT NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_playbook_team (playbook_id, shared_with_team_id),
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id),
    INDEX idx_shared_team (shared_with_team_id)
);
