/**
 * Drawing and canvas-related types
 */

import { Coordinate } from './field.types'

export interface DrawingObject {
	id: string
	type: 'draw' | 'erase'
	points: Array<Coordinate> // Stored in feet coordinates
	color: string
	brushSize: number
	lineStyle: 'solid' | 'dashed'
	lineEnd: 'none' | 'arrow' | 'tShape'
	eraseSize: number // Required for erase type
}
