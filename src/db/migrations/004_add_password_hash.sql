-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- For existing users, set a placeholder that will never match bcrypt output
UPDATE users SET password_hash = 'NEEDS_RESET' WHERE password_hash IS NULL;

-- Make column required for future inserts
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
