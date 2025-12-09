/**
 * Drawing types for SVG paths and legacy canvas strokes.
 */

import type { Coordinate } from './field.types'

export interface ControlPoint extends Coordinate {
	id: string
	type: 'start' | 'end' | 'corner' | 'curve'
	handleIn?: Coordinate
	handleOut?: Coordinate
}

export interface PathSegment {
	type: 'line' | 'quadratic' | 'cubic'
	points: ControlPoint[]
}

export interface PathStyle {
	color: string
	strokeWidth: number
	lineStyle: 'solid' | 'dashed'
	lineEnd: 'none' | 'arrow' | 'tShape'
}

export interface Annotation {
	id: string
	pointIndex: number
	type: 'marker' | 'text' | 'icon'
	content: string
	offset: Coordinate
}

export interface Drawing {
	id: string
	playerId?: string
	segments: PathSegment[]
	style: PathStyle
	annotations: Annotation[]
	templateId?: string
	templateParams?: Record<string, number>
}

/**
 * Legacy canvas-based drawing stroke.
 */
export interface DrawingObject {
	id: string
	type: 'draw' | 'erase'
	points: Array<Coordinate>
	color: string
	brushSize: number
	lineStyle: 'solid' | 'dashed'
	lineEnd: 'none' | 'arrow' | 'tShape'
	eraseSize: number
}
