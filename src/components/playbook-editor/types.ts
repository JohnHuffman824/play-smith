/**
 * Shared types for playbookEditorInterface components
 * These are temporary local types used by the Figma-exported UI
 */

import type { Drawing } from '@/types/drawing.types'

export type Play = {
	id: string
	name: string
	formation: string
	playType: string
	defensiveFormation: string
	tags: string[]
	lastModified: string
	thumbnail?: string
	drawings?: Drawing[]
	personnel?: string
}

export type Section = {
	id: string
	name: string
	section_type?: 'standard' | 'ideas'
	plays: Play[]
}
