-- Plays table
CREATE TABLE plays (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    playbook_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255),
    formation_id BIGINT UNSIGNED,
    personnel_id BIGINT UNSIGNED,
    defensive_formation_id BIGINT UNSIGNED,
    hash_position ENUM('left', 'middle', 'right') NOT NULL DEFAULT 'middle',
    notes TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_playbook (playbook_id)
);

-- Note: formation_id, personnel_id, defensive_formation_id FKs will be added
-- in Phase 2 when we create those tables
