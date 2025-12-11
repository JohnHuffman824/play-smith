// src/utils/lineman.utils.ts
import {
	LINEMAN_Y,
	SPACING_CENTER_TO_CENTER,
	LEFT_HASH_INNER_EDGE,
	RIGHT_HASH_INNER_EDGE,
	CENTER_X,
} from '../constants/field.constants'
import type { HashAlignment } from '../types/field.types'

interface Player {
	id: string
	x: number
	y: number
	label: string
	color: string
	isLineman: boolean
}

const LINEMAN_LABELS = ['LT', 'LG', 'C', 'RG', 'RT']
const DEFAULT_LINEMAN_COLOR = '#3b82f6'

/**
 * Get the center X position based on hash alignment
 */
export function getCenterXForHash(hashAlignment: HashAlignment): number {
	switch (hashAlignment) {
		case 'left':
			return LEFT_HASH_INNER_EDGE
		case 'right':
			return RIGHT_HASH_INNER_EDGE
		default:
			return CENTER_X
	}
}

/**
 * Create the default 5 offensive linemen for a new play
 */
export function createDefaultLinemen(hashAlignment: HashAlignment = 'middle'): Player[] {
	const centerX = getCenterXForHash(hashAlignment)
	const timestamp = Date.now()

	return LINEMAN_LABELS.map((label, index) => {
		const offsetFromCenter = (index - 2) * SPACING_CENTER_TO_CENTER
		return {
			id: `lineman-${label}-${timestamp}-${index}`,
			x: centerX + offsetFromCenter,
			y: LINEMAN_Y,
			label,
			color: DEFAULT_LINEMAN_COLOR,
			isLineman: true,
		}
	})
}

/**
 * Reposition all linemen to a new hash alignment
 * Returns updated players array with linemen moved
 */
export function repositionLinemenForHash(
	players: Player[],
	newHashAlignment: HashAlignment
): Player[] {
	const newCenterX = getCenterXForHash(newHashAlignment)

	return players.map((player) => {
		if (!player.isLineman) return player

		// Find lineman index from label to calculate offset
		const labelIndex = LINEMAN_LABELS.indexOf(player.label)
		if (labelIndex === -1) return player

		const offsetFromCenter = (labelIndex - 2) * SPACING_CENTER_TO_CENTER
		return {
			...player,
			x: newCenterX + offsetFromCenter,
		}
	})
}

/**
 * Check if all linemen are at their default positions for the given hash alignment
 * Returns true if all linemen are positioned correctly, false otherwise
 */
export function areLinemenAtDefaultPositions(
	players: Player[],
	hashAlignment: HashAlignment
): boolean {
	const centerX = getCenterXForHash(hashAlignment)
	const linemen = players.filter(p => p.isLineman)

	for (const player of linemen) {
		const labelIndex = LINEMAN_LABELS.indexOf(player.label)
		if (labelIndex === -1) continue

		const expectedX = centerX + (labelIndex - 2) * SPACING_CENTER_TO_CENTER
		const expectedY = LINEMAN_Y

		// Use small tolerance for floating point comparison
		if (Math.abs(player.x - expectedX) > 0.1 || Math.abs(player.y - expectedY) > 0.1) {
			return false
		}
	}
	return true
}
