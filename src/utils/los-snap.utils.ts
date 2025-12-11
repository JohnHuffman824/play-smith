/**
 * Line of Scrimmage (LOS) snapping utility
 *
 * Snaps players to touch the LOS when within snap zone.
 * - Offensive side (y <= 30): snaps to y=28 (player top touches LOS)
 * - Defensive side (y > 30): snaps to y=32 (player bottom touches LOS)
 */

import { LINE_OF_SCRIMMAGE, PLAYER_RADIUS_FEET } from '../constants/field.constants'

/**
 * Check if a Y position is within the LOS snap zone
 */
export function isInLOSSnapZone(y: number): boolean {
	return y >= LINE_OF_SCRIMMAGE - PLAYER_RADIUS_FEET && y <= LINE_OF_SCRIMMAGE + PLAYER_RADIUS_FEET
}

/**
 * Apply LOS snapping to a coordinate pair
 * X coordinate passes through unchanged
 */
export function applyLOSSnap(x: number, y: number): { x: number; y: number; snapped: boolean } {
	if (!isInLOSSnapZone(y)) {
		return { x, y, snapped: false }
	}

	// Offensive side (at or below LOS) -> snap to y=28
	// Defensive side (above LOS) -> snap to y=32
	const snappedY = y <= LINE_OF_SCRIMMAGE ? LINE_OF_SCRIMMAGE - PLAYER_RADIUS_FEET : LINE_OF_SCRIMMAGE + PLAYER_RADIUS_FEET

	return { x, y: snappedY, snapped: true }
}
