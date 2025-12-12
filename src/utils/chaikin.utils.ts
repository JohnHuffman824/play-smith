/**
 * Chaikin smoothing algorithm utilities
 * Used for render-time curve smoothing of line-based drawings
 */

import type { Coordinate } from '../types/field.types'

export const CHAIKIN_ITERATIONS = 3

/**
 * Apply one iteration of Chaikin subdivision to a list of points
 * @param points Array of points to subdivide
 * @param preserveEndpoints If true, keeps first and last points unchanged
 */
export function chaikinSubdivide(
	points: Coordinate[],
	preserveEndpoints = false,
): Coordinate[] {
	if (points.length < 2) return points

	const result: Coordinate[] = []

	// Preserve first endpoint if requested
	if (preserveEndpoints) {
		result.push(points[0])
	}

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i]
		const p1 = points[i + 1]

		// For first/last segments with endpoint preservation, only add one point
		if (preserveEndpoints && i === 0) {
			// Only add R point for first segment
			result.push({
				x: 0.25 * p0.x + 0.75 * p1.x,
				y: 0.25 * p0.y + 0.75 * p1.y,
			})
		} else if (preserveEndpoints && i === points.length - 2) {
			// Only add Q point for last segment
			result.push({
				x: 0.75 * p0.x + 0.25 * p1.x,
				y: 0.75 * p0.y + 0.25 * p1.y,
			})
		} else {
			// Normal subdivision for middle segments
			result.push({
				x: 0.75 * p0.x + 0.25 * p1.x,
				y: 0.75 * p0.y + 0.25 * p1.y,
			})
			result.push({
				x: 0.25 * p0.x + 0.75 * p1.x,
				y: 0.25 * p0.y + 0.75 * p1.y,
			})
		}
	}

	// Preserve last endpoint if requested
	if (preserveEndpoints) {
		result.push(points[points.length - 1])
	}

	return result
}

/**
 * Apply Chaikin smoothing algorithm iteratively
 * @param points Array of points to smooth
 * @param iterations Number of subdivision iterations (default: CHAIKIN_ITERATIONS)
 */
export function applyChaikin(
	points: Coordinate[],
	iterations: number = CHAIKIN_ITERATIONS,
): Coordinate[] {
	let result = points
	for (let i = 0; i < iterations; i++) {
		// Preserve endpoints on every iteration to maintain start/end positions
		result = chaikinSubdivide(result, true)
	}
	return result
}
