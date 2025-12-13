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

export interface TeamInvitation {
	id: number
	team_id: number
	email: string
	role: 'owner' | 'editor' | 'viewer'
	token: string
	invited_by: number
	expires_at: Date
	accepted_at: Date | null
	created_at: Date
}

export interface TeamMemberWithUser extends TeamMember {
	user_email: string
	user_name: string
}

export interface Folder {
	id: number
	user_id: number
	name: string
	created_at: Date
}

export interface Playbook {
	id: number
	team_id: number | null
	name: string
	description: string | null
	created_by: number
	created_at: Date
	updated_at: Date
	folder_id: number | null
	is_starred: boolean
	deleted_at: Date | null
	last_accessed_at: Date | null
}

export interface PlaybookWithCount extends Playbook {
	play_count: number
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
	section_type: 'standard' | 'ideas'
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

export interface Label {
	id: number
	team_id: number | null
	name: string
	color: string
	is_preset: boolean
	created_by: number | null
	created_at: Date
	updated_at: Date
}

export interface PlayLabel {
	id: number
	play_id: number
	label_id: number
	created_at: Date
}

export interface PlaybookLabel {
	id: number
	playbook_id: number
	label_id: number
	created_at: Date
}

// Backward compatibility aliases
/** @deprecated Use Label instead. */
export type Tag = Label

/** @deprecated Use PlayLabel instead. */
export type PlayTag = PlayLabel

/** @deprecated Use PlaybookLabel instead. */
export type PlaybookTag = PlaybookLabel

export interface Presentation {
	id: number
	playbook_id: number
	name: string
	description: string | null
	created_by: number
	created_at: Date
	updated_at: Date
}

export interface PresentationSlide {
	id: number
	presentation_id: number
	play_id: number
	display_order: number
	created_at: Date
}
