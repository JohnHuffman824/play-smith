import type { Player } from '../contexts/PlayContext'
import type { Drawing, ControlPoint, Coordinate } from '../types/drawing.types'
import { FIELD_WIDTH_FEET } from '../constants/field.constants'

/**
 * Flip an X coordinate horizontally around the field center
 */
function flipX(x: number): number {
	return FIELD_WIDTH_FEET - x
}

/**
 * Flip a coordinate horizontally
 */
function flipCoordinate(coord: Coordinate): Coordinate {
	return { x: flipX(coord.x), y: coord.y }
}

/**
 * Flip a control point horizontally (including bezier handles)
 */
function flipControlPoint(point: ControlPoint): ControlPoint {
	return {
		...point,
		x: flipX(point.x),
		handleIn: point.handleIn ? flipCoordinate(point.handleIn) : undefined,
		handleOut: point.handleOut ? flipCoordinate(point.handleOut) : undefined,
	}
}

/**
 * Flip a player horizontally
 */
export function flipPlayer(player: Player): Player {
	return {
		...player,
		x: flipX(player.x),
	}
}

/**
 * Flip a drawing horizontally
 */
export function flipDrawing(drawing: Drawing): Drawing {
	const flippedPoints: Record<string, ControlPoint> = {}
	for (const [id, point] of Object.entries(drawing.points)) {
		flippedPoints[id] = flipControlPoint(point)
	}
	return {
		...drawing,
		points: flippedPoints,
	}
}

/**
 * Flip all players and drawings horizontally
 */
export function flipCanvasHorizontally(
	players: Player[],
	drawings: Drawing[]
): { players: Player[]; drawings: Drawing[] } {
	return {
		players: players.map(flipPlayer),
		drawings: drawings.map(flipDrawing),
	}
}
