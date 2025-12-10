import type { Drawing } from '../types/drawing.types'

export interface User {
	id: number
	email: string
	name: string
	password_hash: string
	created_at: Date
	updated_at: Date
}

export interface Team {
	id: number
	name: string
	created_at: Date
	updated_at: Date
}

export interface TeamMember {
	id: number
	team_id: number
	user_id: number
	role: 'owner' | 'editor' | 'viewer'
	joined_at: Date
}

export interface Playbook {
	id: number
	team_id: number | null
	name: string
	description: string | null
	created_by: number
	created_at: Date
	updated_at: Date
}

export interface PlaybookShare {
	id: number
	playbook_id: number
	shared_with_team_id: number
	permission: 'view' | 'edit'
	shared_by: number
	shared_at: Date
}

export interface Play {
	id: number
	playbook_id: number
	name: string | null
	formation_id: number | null
	personnel_id: number | null
	defensive_formation_id: number | null
	hash_position: 'left' | 'middle' | 'right'
	notes: string | null
	display_order: number
	created_by: number
	created_at: Date
	updated_at: Date
}

export interface Section {
	id: number
	playbook_id: number
	name: string
	display_order: number
	created_at: Date
	updated_at: Date
}

export interface Session {
	id: number
	user_id: number
	token: string
	expires_at: Date
	created_at: Date
}

export interface Formation {
	id: number
	team_id: number
	name: string
	description: string | null
	created_by: number
	created_at: Date
	updated_at: Date
}

export interface FormationPlayerPosition {
	id: number
	formation_id: number
	role: string
	position_x: number
	position_y: number
	hash_relative: boolean
	created_at: Date
}

export interface BaseConcept {
	id: number
	team_id: number | null
	playbook_id: number | null
	name: string
	description: string | null
	targeting_mode: 'absolute_role' | 'relative_selector'
	ball_position: 'left' | 'center' | 'right'
	play_direction: 'left' | 'right' | 'na'
	created_by: number
	created_at: Date
	updated_at: Date
	usage_count: number
	last_used_at: Date | null
}

export interface ConceptPlayerAssignment {
	id: number
	concept_id: number
	role: string | null
	selector_type: string | null
	selector_params: Record<string, unknown> | null
	drawing_data: Drawing
	order_index: number
	created_at: Date
}

export interface ConceptGroup {
	id: number
	team_id: number
	playbook_id: number | null
	name: string
	description: string | null
	formation_id: number | null
	created_by: number
	created_at: Date
	updated_at: Date
	usage_count: number
	last_used_at: Date | null
}

export interface ConceptGroupConcept {
	id: number
	concept_group_id: number
	concept_id: number
	order_index: number
	created_at: Date
}

export interface ConceptApplication {
	id: number
	play_id: number
	concept_id: number | null
	concept_group_id: number | null
	order_index: number
	applied_at: Date
}

export interface RoleTerminology {
	id: number
	team_id: number
	standard_role: string
	custom_name: string
	position_type: 'receiver' | 'back' | 'line' | 'tight_end'
	created_at: Date
	updated_at: Date
}

export interface PresetRoute {
	id: number
	team_id: number | null
	name: string
	route_number: number | null
	drawing_template: Drawing
	created_by: number | null
	created_at: Date
	updated_at: Date
}
