-- Make team_id optional to support personal playbooks
-- Users can create playbooks without being part of a team

-- Drop the foreign key constraint
ALTER TABLE playbooks DROP CONSTRAINT playbooks_team_id_fkey;

-- Make team_id nullable
ALTER TABLE playbooks ALTER COLUMN team_id DROP NOT NULL;

-- Re-add foreign key with ON DELETE SET NULL
ALTER TABLE playbooks
  ADD CONSTRAINT playbooks_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
