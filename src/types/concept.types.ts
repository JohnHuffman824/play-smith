import type { Drawing } from './drawing.types'

export type TargetingMode = 'absolute_role' | 'relative_selector'
export type BallPosition = 'left' | 'center' | 'right'
export type PlayDirection = 'left' | 'right' | 'na'
export type ConceptScope = 'team' | 'playbook'
export type PositionType = 'receiver' | 'back' | 'line' | 'tight_end'

export interface Formation {
	id: number
	team_id: number
	name: string
	description: string | null
	thumbnail: string | null
	created_by: number
	created_at: Date
	updated_at: Date
	positions?: FormationPlayerPosition[]
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
	thumbnail: string | null
	targeting_mode: TargetingMode
	ball_position: BallPosition
	play_direction: PlayDirection
	is_motion: boolean
	is_modifier: boolean
	created_by: number
	created_at: Date
	updated_at: Date
	usage_count: number
	last_used_at: Date | null
	assignments?: ConceptPlayerAssignment[]
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
	thumbnail: string | null
	formation_id: number | null
	created_by: number
	created_at: Date
	updated_at: Date
	usage_count: number
	last_used_at: Date | null
	formation?: Formation | null
	concepts?: Array<BaseConcept & { order_index: number }>
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
	position_type: PositionType
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

export interface SearchResult {
	type: 'formation' | 'concept' | 'concept_group'
	id: number
	name: string
	frecencyScore: number
}

export interface SearchResults {
	formations: SearchResult[]
	concepts: SearchResult[]
	groups: SearchResult[]
}

export interface ConceptChip {
	id: string
	type: 'formation' | 'concept' | 'concept_group' | 'text'
	label: string
	entityId?: number
	entity?: Formation | BaseConcept | ConceptGroup
}

export type RelativeSelector =
	| 'leftmost_receiver'
	| 'rightmost_receiver'
	| 'leftmost_receivers'
	| 'rightmost_receivers'
	| 'second_receiver_from_left'
	| 'second_receiver_from_right'
	| 'inside_receivers'
	| 'outside_receivers'
	| 'playside_receiver'
	| 'backside_receiver'
	| 'playside_tackle'
	| 'backside_tackle'
	| 'strong_side_receivers'
	| 'weak_side_receivers'
	| 'strong_side_te'
	| 'deepest_receiver'
	| 'shallow_receivers'
	| 'deep_receivers'

export interface RoleDefinition {
	id: string
	name: string
	category: PositionType
}

export interface SelectorDefinition {
	id: RelativeSelector
	label: string
	hasCount: boolean
	requiresPlayDirection?: boolean
}

export interface ModifierOverride {
	id: number
	modifier_concept_id: number
	formation_id: number
	override_rules: {
		role: string
		delta_x: number
		delta_y: number
	}
	created_at: Date
}

export interface ComposedConcept {
	role: string
	template_name: string
	drawing_data: {
		paths: Array<{
			points: Array<{ x: number; y: number }>
			style: 'solid' | 'dashed'
			end: 'none' | 'arrow' | 'tShape'
		}>
	}
	is_saved: boolean
}

export type ConceptUIType = 'formation' | 'concept' | 'concept_group'
