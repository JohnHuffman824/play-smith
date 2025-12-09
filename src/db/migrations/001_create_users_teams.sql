-- Create ENUM type for team roles
CREATE TYPE team_role AS ENUM ('owner', 'editor', 'viewer');

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users table
CREATE TABLE users (
	id BIGSERIAL PRIMARY KEY,
	email VARCHAR(255) NOT NULL UNIQUE,
	name VARCHAR(255) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

CREATE TRIGGER update_users_updated_at
	BEFORE UPDATE ON users
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

-- Teams table
CREATE TABLE teams (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_teams_updated_at
	BEFORE UPDATE ON teams
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

-- Team members (many-to-many with roles)
CREATE TABLE team_members (
	id BIGSERIAL PRIMARY KEY,
	team_id BIGINT NOT NULL,
	user_id BIGINT NOT NULL,
	role team_role NOT NULL DEFAULT 'viewer',
	joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (team_id, user_id),
	FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_team_members_user ON team_members(user_id);
