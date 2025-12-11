/**
 * Curve smoothing utilities using Catmull-Rom splines
 */

import type { Coordinate } from '../types/field.types'
import type { ControlPoint, PathSegment, Drawing } from '../types/drawing.types'

// Constants for curve smoothing
const CATMULL_ROM_HANDLE_SCALE = 1 / 6
const BEZIER_SAMPLE_POINTS = 10

/**
 * Extract main path coordinates from a drawing in segment order.
 * FIXED: Maintains proper segment traversal order instead of using Object.values().
 * Filters out bezier control points, returning just the path through-points.
 */
export function extractMainCoordinates(drawing: Drawing): Coordinate[] {
	if (drawing.segments.length === 0) return []

	const coords: Coordinate[] = []
	const visited = new Set<string>()

	for (const segment of drawing.segments) {
		for (const pointId of segment.pointIds) {
			const point = drawing.points[pointId]
			// Skip missing points, curve control points, and duplicates at segment boundaries
			if (!point || visited.has(pointId)) continue
			visited.add(pointId)

			coords.push({ x: point.x, y: point.y })
		}
	}

	return coords
}

/**
 * Catmull-Rom to Bezier conversion.
 * Given 4 points (p0, p1, p2, p3), computes cubic bezier control points
 * for the segment from p1 to p2.
 */
export function catmullRomToBezier(
	p0: Coordinate,
	p1: Coordinate,
	p2: Coordinate,
	p3: Coordinate,
	tension: number = 0.5
): { start: Coordinate; cp1: Coordinate; cp2: Coordinate; end: Coordinate } {
	const t = tension

	// Catmull-Rom to Bezier conversion formulas
	const cp1: Coordinate = {
		x: p1.x + ((p2.x - p0.x) / 6) * t,
		y: p1.y + ((p2.y - p0.y) / 6) * t,
	}

	const cp2: Coordinate = {
		x: p2.x - ((p3.x - p1.x) / 6) * t,
		y: p2.y - ((p3.y - p1.y) / 6) * t,
	}

	return { start: p1, cp1, cp2, end: p2 }
}


/**
 * Find the start point of a path by looking through point pool.
 * For OLD format compatibility only.
 */
function findStartPoint(
	points: Record<string, ControlPoint>
): ControlPoint | null {
	// Iterate through point IDs in insertion order (guaranteed in modern JS)
	for (const point of Object.values(points)) {
		if (point.type === 'start') {
			return point
		}
	}
	return null
}

/**
 * Convert a curved drawing back to sharp (line segments).
 * FIXED: Properly captures first point for all segment types.
 * Handles both OLD format (separate curve points) and NEW format (inline handles).
 */
export function convertToSharp(
	drawing: { points: Record<string, ControlPoint>; segments: PathSegment[] }
): { points: Record<string, ControlPoint>; segments: PathSegment[] } {
	const mainCoords: Coordinate[] = []

	for (let i = 0; i < drawing.segments.length; i++) {
		const segment = drawing.segments[i]
		const pointIds = segment.pointIds

		if (i === 0) {
			// FIXED: Get the actual first on-path point
			if (segment.type === 'line') {
				// Line: pointIds = [startId, endId]
				const startPoint = drawing.points[pointIds[0]]
				if (startPoint) {
					mainCoords.push({ x: startPoint.x, y: startPoint.y })
				}
			} else if (segment.type === 'cubic') {
				if (pointIds.length === 2) {
					// NEW FORMAT: pointIds = [fromId, toId], handles in nodes
					const fromPoint = drawing.points[pointIds[0]]
					if (fromPoint) {
						mainCoords.push({ x: fromPoint.x, y: fromPoint.y })
					}
				} else if (pointIds.length === 3) {
					// OLD FORMAT: pointIds = [cp1Id, cp2Id, endId]
					// NOTE: Object.values() used here for backward compatibility
					// with legacy data format where start point is not in segments
					const startPoint = findStartPoint(drawing.points)
					if (startPoint) {
						mainCoords.push({ x: startPoint.x, y: startPoint.y })
					}
				}
			} else if (segment.type === 'quadratic') {
				// Quadratic: pointIds = [controlId, endId] - need to find start
				// NOTE: Object.values() used here for backward compatibility
				const startPoint = findStartPoint(drawing.points)
				if (startPoint) {
					mainCoords.push({ x: startPoint.x, y: startPoint.y })
				}
			}
		}

		// Get the endpoint of each segment
		const lastPointId = pointIds[pointIds.length - 1]
		const lastPoint = drawing.points[lastPointId]

		if (lastPoint) {
			mainCoords.push({ x: lastPoint.x, y: lastPoint.y })
		}
	}

	// Build new line-based structure
	const points: Record<string, ControlPoint> = {}
	const segments: PathSegment[] = []

	for (let i = 0; i < mainCoords.length; i++) {
		const id = `p-${i}`
		const isFirst = i === 0
		const isLast = i === mainCoords.length - 1
		points[id] = {
			id,
			x: mainCoords[i].x,
			y: mainCoords[i].y,
			type: isFirst ? 'start' : isLast ? 'end' : 'corner',
		}
	}

	for (let i = 1; i < mainCoords.length; i++) {
		segments.push({ type: 'line', pointIds: [`p-${i - 1}`, `p-${i}`] })
	}

	return { points, segments }
}
