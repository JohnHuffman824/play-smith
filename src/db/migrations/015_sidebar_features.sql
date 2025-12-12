-- Folders table (flat structure)
CREATE TABLE folders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_folders_user ON folders(user_id);

-- Add new columns to playbooks
ALTER TABLE playbooks ADD COLUMN folder_id BIGINT REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE playbooks ADD COLUMN is_starred BOOLEAN DEFAULT FALSE;
ALTER TABLE playbooks ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE playbooks ADD COLUMN last_accessed_at TIMESTAMP;

CREATE INDEX idx_playbooks_folder ON playbooks(folder_id);
CREATE INDEX idx_playbooks_starred ON playbooks(is_starred) WHERE is_starred = true;
CREATE INDEX idx_playbooks_deleted ON playbooks(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_playbooks_last_accessed ON playbooks(last_accessed_at DESC NULLS LAST);
