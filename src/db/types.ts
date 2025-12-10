export interface User {
	id: number;
	email: string;
	name: string;
	password_hash: string;
	created_at: Date;
	updated_at: Date;
}

export interface Team {
	id: number;
	name: string;
	created_at: Date;
	updated_at: Date;
}

export interface TeamMember {
	id: number;
	team_id: number;
	user_id: number;
	role: 'owner' | 'editor' | 'viewer';
	joined_at: Date;
}

export interface Playbook {
	id: number;
	team_id: number;
	name: string;
	description: string | null;
	created_by: number;
	created_at: Date;
	updated_at: Date;
}

export interface PlaybookShare {
	id: number;
	playbook_id: number;
	shared_with_team_id: number;
	permission: 'view' | 'edit';
	shared_by: number;
	shared_at: Date;
}

export interface Play {
	id: number;
	playbook_id: number;
	name: string | null;
	formation_id: number | null;
	personnel_id: number | null;
	defensive_formation_id: number | null;
	hash_position: 'left' | 'middle' | 'right';
	notes: string | null;
	display_order: number;
	created_by: number;
	created_at: Date;
	updated_at: Date;
}

export interface Section {
	id: number;
	playbook_id: number;
	name: string;
	display_order: number;
	created_at: Date;
	updated_at: Date;
}

export interface Session {
	id: number;
	user_id: number;
	token: string;
	expires_at: Date;
	created_at: Date;
}
