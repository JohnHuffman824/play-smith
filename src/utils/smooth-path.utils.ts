/**
 * Smooth path processing pipeline
 * Simplifies raw drawing to few control points - smoothing happens at render time
 */

import type { Coordinate } from '../types/field.types'
import type { ControlPoint, PathSegment } from '../types/drawing.types'

// RDP tolerance in feet - controls how many points we keep
const SIMPLIFICATION_TOLERANCE = 0.3

/**
 * Ramer-Douglas-Peucker algorithm to simplify a path while preserving shape
 */
function simplifyRDP(points: Coordinate[], epsilon: number): Coordinate[] {
	if (points.length < 3) return points

	let maxDist = 0
	let maxIndex = 0
	const first = points[0]
	const last = points[points.length - 1]

	for (let i = 1; i < points.length - 1; i++) {
		const dist = perpendicularDistance(points[i], first, last)
		if (dist > maxDist) {
			maxDist = dist
			maxIndex = i
		}
	}

	if (maxDist > epsilon) {
		const left = simplifyRDP(points.slice(0, maxIndex + 1), epsilon)
		const right = simplifyRDP(points.slice(maxIndex), epsilon)
		return [...left.slice(0, -1), ...right]
	}

	return [first, last]
}

function perpendicularDistance(
	point: Coordinate,
	lineStart: Coordinate,
	lineEnd: Coordinate
): number {
	const dx = lineEnd.x - lineStart.x
	const dy = lineEnd.y - lineStart.y
	const lineLengthSq = dx * dx + dy * dy

	if (lineLengthSq === 0) {
		const pdx = point.x - lineStart.x
		const pdy = point.y - lineStart.y
		return Math.sqrt(pdx * pdx + pdy * pdy)
	}

	const crossProduct = Math.abs(
		(lineEnd.y - lineStart.y) * point.x -
		(lineEnd.x - lineStart.x) * point.y +
		lineEnd.x * lineStart.y -
		lineEnd.y * lineStart.x
	)
	return crossProduct / Math.sqrt(lineLengthSq)
}

/**
 * Main smooth pipeline function
 * Returns simplified control points - smoothing applied at render time
 */
export function processSmoothPath(
	coords: Coordinate[]
): { points: Record<string, ControlPoint>; segments: PathSegment[] } {
	if (coords.length === 0) {
		return { points: {}, segments: [] }
	}

	if (coords.length === 1) {
		return {
			points: {
				'p-0': { id: 'p-0', x: coords[0].x, y: coords[0].y, type: 'start' }
			},
			segments: []
		}
	}

	if (coords.length === 2) {
		return {
			points: {
				'p-0': { id: 'p-0', x: coords[0].x, y: coords[0].y, type: 'start' },
				'p-1': { id: 'p-1', x: coords[1].x, y: coords[1].y, type: 'end' }
			},
			segments: [{ type: 'line', pointIds: ['p-0', 'p-1'] }]
		}
	}

	// Simplify to few control points
	const simplified = simplifyRDP(coords, SIMPLIFICATION_TOLERANCE)

	// Create control points
	const points: Record<string, ControlPoint> = {}
	for (let i = 0; i < simplified.length; i++) {
		const id = `p-${i}`
		points[id] = {
			id,
			x: simplified[i].x,
			y: simplified[i].y,
			type: i === 0 ? 'start' : i === simplified.length - 1 ? 'end' : 'corner'
		}
	}

	// Create line segments (smoothing happens at render time)
	const segments: PathSegment[] = []
	for (let i = 0; i < simplified.length - 1; i++) {
		segments.push({
			type: 'line',
			pointIds: [`p-${i}`, `p-${i + 1}`]
		})
	}

	return { points, segments }
}
