-- Create default "My Team" for all users who don't have any teams yet
-- This ensures every user has at least one team for their personal playbooks

-- Step 1: Create teams and link to users (without window functions in RETURNING)
WITH users_needing_teams AS (
    SELECT u.id as user_id, u.name, ROW_NUMBER() OVER (ORDER BY u.id) as rn
    FROM users u
    LEFT JOIN team_members tm ON u.id = tm.user_id
    WHERE tm.user_id IS NULL
),
created_teams_raw AS (
    INSERT INTO teams (name, created_at, updated_at)
    SELECT 'My Team', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM users_needing_teams
    RETURNING id
),
created_teams_numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM created_teams_raw
)
INSERT INTO team_members (team_id, user_id, role, joined_at)
SELECT ct.id, unt.user_id, 'owner', CURRENT_TIMESTAMP
FROM created_teams_numbered ct
JOIN users_needing_teams unt ON ct.rn = unt.rn;

-- Step 2: Update any playbooks with NULL team_id to use the user's first team
UPDATE playbooks p
SET team_id = (
    SELECT tm.team_id
    FROM team_members tm
    WHERE tm.user_id = p.created_by
    ORDER BY tm.joined_at ASC
    LIMIT 1
)
WHERE p.team_id IS NULL;

-- Step 3: Show verification results
SELECT
    (SELECT COUNT(*) FROM users u LEFT JOIN team_members tm ON u.id = tm.user_id WHERE tm.user_id IS NULL) as users_without_teams,
    (SELECT COUNT(*) FROM playbooks WHERE team_id IS NULL) as playbooks_without_teams;
