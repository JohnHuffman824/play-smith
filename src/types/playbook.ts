/**
 * Playbook editor shared types
 * Used across PlaybookEditorPage, PlayCard, PlayListView and related components
 */

/**
 * Individual play within a playbook
 * Represents a football play with formation, personnel, and metadata
 */
export interface Play {
	id: number
	name: string
	section_id: number | null
	play_type: 'pass' | 'run' | null
	formation_id: number | null
	formation_name?: string
	personnel_id: number | null
	personnel_name?: string
	defensive_formation_id: number | null
	defensive_formation_name?: string
	tags: { id: number; name: string; color: string }[]
	updated_at: string
	thumbnail?: string
}

/**
 * Section for organizing plays within a playbook
 * Sections provide hierarchical organization of plays
 */
export interface Section {
	id: number
	playbook_id: number
	name: string
	display_order: number
	play_count?: number
	created_at: string
	updated_at: string
}

/**
 * Playbook metadata and details
 * Contains basic information about a playbook without full play data
 */
export interface PlaybookDetails {
	id: number
	name: string
	description: string | null
	team_id: number
	created_at: string
	updated_at: string
}
