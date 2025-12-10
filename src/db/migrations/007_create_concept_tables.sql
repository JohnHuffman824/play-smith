-- Migration 007: Create Core Concept Tables for Concept Architecture System
-- Phase 1: Formations, Base Concepts, Concept Groups, and Role Terminology

-- Create ENUM types for concept system
CREATE TYPE targeting_mode AS ENUM ('absolute_role', 'relative_selector');
CREATE TYPE ball_position AS ENUM ('left', 'center', 'right');
CREATE TYPE play_direction AS ENUM ('left', 'right', 'na');
CREATE TYPE position_type AS ENUM ('receiver', 'back', 'line', 'tight_end');

-- Table 1: formations
-- Stores saved formation templates (player alignments only, no routes)
CREATE TABLE formations (
	id BIGSERIAL PRIMARY KEY,
	team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	description TEXT,
	created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT formations_name_team_unique UNIQUE (team_id, name)
);

CREATE INDEX idx_formations_team ON formations(team_id);
CREATE INDEX idx_formations_name ON formations(name);

-- Table 2: formation_player_positions
-- Stores individual player positions within a formation
CREATE TABLE formation_player_positions (
	id BIGSERIAL PRIMARY KEY,
	formation_id BIGINT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
	role TEXT NOT NULL,
	position_x NUMERIC(10,2) NOT NULL,
	position_y NUMERIC(10,2) NOT NULL,
	hash_relative BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT formation_positions_unique UNIQUE (formation_id, role)
);

CREATE INDEX idx_formation_positions_formation ON formation_player_positions(formation_id);

-- Table 3: base_concepts
-- Stores reusable route/assignment patterns for player roles
CREATE TABLE base_concepts (
	id BIGSERIAL PRIMARY KEY,
	team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
	playbook_id BIGINT REFERENCES playbooks(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	description TEXT,
	targeting_mode targeting_mode NOT NULL,
	ball_position ball_position NOT NULL DEFAULT 'center',
	play_direction play_direction NOT NULL DEFAULT 'na',
	created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	usage_count INTEGER NOT NULL DEFAULT 0,
	last_used_at TIMESTAMP,
	CONSTRAINT base_concepts_name_scope_unique UNIQUE NULLS NOT DISTINCT (team_id, playbook_id, name)
);

CREATE INDEX idx_base_concepts_team ON base_concepts(team_id);
CREATE INDEX idx_base_concepts_playbook ON base_concepts(playbook_id);
CREATE INDEX idx_base_concepts_name ON base_concepts(name);
CREATE INDEX idx_base_concepts_usage ON base_concepts(usage_count DESC, last_used_at DESC);

-- Table 4: concept_player_assignments
-- Stores player assignments for concepts (absolute role and relative selector modes)
CREATE TABLE concept_player_assignments (
	id BIGSERIAL PRIMARY KEY,
	concept_id BIGINT NOT NULL REFERENCES base_concepts(id) ON DELETE CASCADE,
	role TEXT,
	selector_type TEXT,
	selector_params JSONB,
	drawing_data JSONB NOT NULL,
	order_index INTEGER NOT NULL DEFAULT 0,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CHECK (
		(role IS NOT NULL AND selector_type IS NULL) OR
		(role IS NULL AND selector_type IS NOT NULL)
	)
);

CREATE INDEX idx_concept_assignments_concept ON concept_player_assignments(concept_id);
CREATE INDEX idx_concept_assignments_order ON concept_player_assignments(concept_id, order_index);

-- Table 5: concept_groups
-- Stores bundled combinations of formation + multiple base concepts
CREATE TABLE concept_groups (
	id BIGSERIAL PRIMARY KEY,
	team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
	playbook_id BIGINT REFERENCES playbooks(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	description TEXT,
	formation_id BIGINT REFERENCES formations(id) ON DELETE SET NULL,
	created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	usage_count INTEGER NOT NULL DEFAULT 0,
	last_used_at TIMESTAMP,
	CONSTRAINT concept_groups_name_scope_unique UNIQUE NULLS NOT DISTINCT (team_id, playbook_id, name)
);

CREATE INDEX idx_concept_groups_team ON concept_groups(team_id);
CREATE INDEX idx_concept_groups_playbook ON concept_groups(playbook_id);
CREATE INDEX idx_concept_groups_name ON concept_groups(name);
CREATE INDEX idx_concept_groups_usage ON concept_groups(usage_count DESC, last_used_at DESC);

-- Table 6: concept_group_concepts
-- Join table linking concept groups to their base concepts
CREATE TABLE concept_group_concepts (
	id BIGSERIAL PRIMARY KEY,
	concept_group_id BIGINT NOT NULL REFERENCES concept_groups(id) ON DELETE CASCADE,
	concept_id BIGINT NOT NULL REFERENCES base_concepts(id) ON DELETE CASCADE,
	order_index INTEGER NOT NULL DEFAULT 0,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT group_concepts_unique UNIQUE (concept_group_id, concept_id)
);

CREATE INDEX idx_group_concepts_group ON concept_group_concepts(concept_group_id);
CREATE INDEX idx_group_concepts_order ON concept_group_concepts(concept_group_id, order_index);

-- Table 7: concept_applications
-- Tracks which concepts/groups are applied to which plays
CREATE TABLE concept_applications (
	id BIGSERIAL PRIMARY KEY,
	play_id BIGINT NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
	concept_id BIGINT REFERENCES base_concepts(id) ON DELETE CASCADE,
	concept_group_id BIGINT REFERENCES concept_groups(id) ON DELETE CASCADE,
	order_index INTEGER NOT NULL DEFAULT 0,
	applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CHECK (
		(concept_id IS NOT NULL AND concept_group_id IS NULL) OR
		(concept_id IS NULL AND concept_group_id IS NOT NULL)
	)
);

CREATE INDEX idx_concept_applications_play ON concept_applications(play_id);
CREATE INDEX idx_concept_applications_concept ON concept_applications(concept_id);
CREATE INDEX idx_concept_applications_group ON concept_applications(concept_group_id);
CREATE INDEX idx_concept_applications_order ON concept_applications(play_id, order_index);

-- Table 8: role_terminology
-- Stores team-level customization of player role names
CREATE TABLE role_terminology (
	id BIGSERIAL PRIMARY KEY,
	team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
	standard_role TEXT NOT NULL,
	custom_name TEXT NOT NULL,
	position_type position_type NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT role_terminology_team_role_unique UNIQUE (team_id, standard_role)
);

CREATE INDEX idx_role_terminology_team ON role_terminology(team_id);
