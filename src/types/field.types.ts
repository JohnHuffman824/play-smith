/**
 * Field coordinate and position types
 */

export interface Coordinate {
	x: number
	y: number
}

export interface FeetCoordinate extends Coordinate {
	// Coordinate in feet, origin at bottom-left (0,0), Y increases upward
}

export interface PixelCoordinate extends Coordinate {
	// Coordinate in web pixels, origin at top-left (0,0), Y increases downward
}

export type HashAlignment = 'center' | 'left' | 'right'

export interface FieldDimensions {
	width: number
	height: number
}

