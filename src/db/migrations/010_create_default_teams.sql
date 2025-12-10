-- Create default "My Team" for all users who don't have any teams yet
-- This ensures every user has at least one team for their personal playbooks

DO $$
DECLARE
    user_record RECORD;
    new_team_id BIGINT;
BEGIN
    -- Loop through all users who don't have any team memberships
    FOR user_record IN
        SELECT u.id, u.name
        FROM users u
        LEFT JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.user_id IS NULL
    LOOP
        -- Create a "My Team" for this user
        INSERT INTO teams (name, created_at, updated_at)
        VALUES ('My Team', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id INTO new_team_id;

        -- Add the user as owner of their new team
        INSERT INTO team_members (team_id, user_id, role, joined_at)
        VALUES (new_team_id, user_record.id, 'owner', CURRENT_TIMESTAMP);

        RAISE NOTICE 'Created default team for user %', user_record.id;
    END LOOP;
END $$;

-- Update any playbooks with NULL team_id to use the user's first team
-- (This handles playbooks created before default teams existed)
UPDATE playbooks p
SET team_id = (
    SELECT tm.team_id
    FROM team_members tm
    WHERE tm.user_id = p.created_by
    ORDER BY tm.joined_at ASC
    LIMIT 1
)
WHERE p.team_id IS NULL;

-- Now that all playbooks have teams, we can make team_id NOT NULL again
-- (Comment this out if you want to keep team_id nullable)
-- ALTER TABLE playbooks ALTER COLUMN team_id SET NOT NULL;
