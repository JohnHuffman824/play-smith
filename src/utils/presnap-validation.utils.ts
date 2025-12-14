/**
 * Validation utilities for pre-snap motion constraints
 */

import type { Drawing } from '../types/drawing.types'

/**
 * Check if a drawing has multiple terminal nodes (branching paths).
 * Shifts cannot be applied to drawings with multiple terminal nodes.
 */
export function hasMultipleTerminalNodes(drawing: Drawing): boolean {
	const terminalPoints = Object.values(drawing.points).filter(
		p => p.type === 'end'
	)
	return terminalPoints.length > 1
}

/**
 * Check if a player already has pre-snap movement on any drawing.
 */
export function playerHasPreSnapMovement(
	playerId: string,
	drawings: Drawing[],
	excludeDrawingId?: string
): boolean {
	return drawings.some(d =>
		d.playerId === playerId &&
		d.preSnapMotion &&
		d.id !== excludeDrawingId
	)
}

/**
 * Count the number of motions in the play.
 * Only one motion is allowed per play.
 */
export function countMotions(drawings: Drawing[]): number {
	return drawings.filter(d => d.preSnapMotion?.type === 'motion').length
}

/**
 * Count the number of shifts in the play.
 * Multiple shifts are allowed.
 */
export function countShifts(drawings: Drawing[]): number {
	return drawings.filter(d => d.preSnapMotion?.type === 'shift').length
}

/**
 * Validate if a shift can be applied to a drawing.
 * Returns an error message if invalid, null if valid.
 */
export function validateShift(
	drawing: Drawing,
	drawings: Drawing[]
): string | null {
	// Must be linked to a player
	if (!drawing.playerId) {
		return 'Drawing must be linked to a player'
	}

	// Cannot have multiple terminal nodes
	if (hasMultipleTerminalNodes(drawing)) {
		return 'Cannot apply shift to drawing with multiple terminal nodes'
	}

	// Player cannot already have pre-snap movement
	if (playerHasPreSnapMovement(drawing.playerId, drawings, drawing.id)) {
		return 'Player already has pre-snap movement on another drawing'
	}

	return null
}

/**
 * Validate if a motion can be applied to a drawing.
 * Returns an error message if invalid, null if valid.
 */
export function validateMotion(
	drawing: Drawing,
	drawings: Drawing[]
): string | null {
	// Must be linked to a player
	if (!drawing.playerId) {
		return 'Drawing must be linked to a player'
	}

	// Player cannot already have pre-snap movement
	if (playerHasPreSnapMovement(drawing.playerId, drawings, drawing.id)) {
		return 'Player already has pre-snap movement on another drawing'
	}

	// Only one motion allowed per play
	const existingMotions = countMotions(drawings.filter(d => d.id !== drawing.id))
	if (existingMotions >= 1) {
		return 'Only one motion is allowed per play'
	}

	return null
}

/**
 * Validate pre-snap movement application based on click type.
 * Returns an error message if invalid, null if valid.
 */
export function validatePreSnapMovement(
	drawing: Drawing,
	drawings: Drawing[],
	clickType: 'terminal' | 'path'
): string | null {
	if (clickType === 'terminal') {
		return validateShift(drawing, drawings)
	} else {
		return validateMotion(drawing, drawings)
	}
}
