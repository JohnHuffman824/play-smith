/**
 * Play and tool-related types
 */

export type Tool =
	| 'select'
	| 'addPlayer'
	| 'draw'
	| 'erase'
	| 'color'
	| 'fill'
	| 'drawing'
	| 'addComponent'

export interface DrawingState {
	tool: Tool
	color: string
	brushSize: number
	lineStyle: 'solid' | 'dashed'
	lineEnd: 'none' | 'arrow' | 'tShape'
	eraseSize: number
	snapThreshold: number
}

export interface PlayCard {
	id: string
	name: string
	thumbnail: string // Will store canvas data URL
}

