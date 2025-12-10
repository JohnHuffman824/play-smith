/**
 * Curve smoothing utilities using Catmull-Rom splines
 */

import type { Coordinate } from '../types/field.types'
import type { ControlPoint, PathSegment } from '../types/drawing.types'

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
		x: p1.x + (p2.x - p0.x) / 6 * t,
		y: p1.y + (p2.y - p0.y) / 6 * t,
	}

	const cp2: Coordinate = {
		x: p2.x - (p3.x - p1.x) / 6 * t,
		y: p2.y - (p3.y - p1.y) / 6 * t,
	}

	return { start: p1, cp1, cp2, end: p2 }
}

/**
 * Convert a series of points to smooth curves using Catmull-Rom splines.
 * Returns a new point pool and segments suitable for Drawing.
 */
export function smoothPathToCurves(
	coords: Coordinate[]
): { points: Record<string, ControlPoint>; segments: PathSegment[] } {
	const points: Record<string, ControlPoint> = {}
	const segments: PathSegment[] = []

	// Need at least 3 points to create curves
	if (coords.length < 3) {
		// Fall back to line segments
		for (let i = 0; i < coords.length; i++) {
			const id = `p-${i}`
			points[id] = { id, x: coords[i].x, y: coords[i].y, type: 'corner' }
		}
		for (let i = 1; i < coords.length; i++) {
			segments.push({ type: 'line', pointIds: [`p-${i - 1}`, `p-${i}`] })
		}
		return { points, segments }
	}

	// Create extended array with virtual endpoints for first/last segments
	const extended = [
		coords[0], // Duplicate first point
		...coords,
		coords[coords.length - 1], // Duplicate last point
	]

	// Add the start point
	let pointIndex = 0
	const startId = `p-${pointIndex++}`
	points[startId] = { id: startId, x: coords[0].x, y: coords[0].y, type: 'start' }

	// Generate cubic bezier segments
	for (let i = 0; i < coords.length - 1; i++) {
		const p0 = extended[i]
		const p1 = extended[i + 1]
		const p2 = extended[i + 2]
		const p3 = extended[i + 3]

		const bezier = catmullRomToBezier(p0, p1, p2, p3)

		// Add control points to pool
		const cp1Id = `p-${pointIndex++}`
		const cp2Id = `p-${pointIndex++}`
		const endId = `p-${pointIndex++}`

		points[cp1Id] = { id: cp1Id, x: bezier.cp1.x, y: bezier.cp1.y, type: 'curve' }
		points[cp2Id] = { id: cp2Id, x: bezier.cp2.x, y: bezier.cp2.y, type: 'curve' }
		points[endId] = { id: endId, x: bezier.end.x, y: bezier.end.y, type: i === coords.length - 2 ? 'end' : 'corner' }

		// First segment starts from startId, subsequent from previous endpoint
		const fromId = i === 0 ? startId : `p-${pointIndex - 4}`

		segments.push({
			type: 'cubic',
			pointIds: [cp1Id, cp2Id, endId],
		})
	}

	return { points, segments }
}

/**
 * Convert a curved drawing back to sharp (line segments).
 * Extracts endpoint coordinates from segments.
 */
export function convertToSharp(
	drawing: { points: Record<string, ControlPoint>; segments: PathSegment[] }
): { points: Record<string, ControlPoint>; segments: PathSegment[] } {
	// Extract just the main path points (not control points)
	const mainPoints: Coordinate[] = []

	// Get start point from first segment
	if (drawing.segments.length > 0) {
		const firstSeg = drawing.segments[0]
		if (firstSeg.type === 'line') {
			mainPoints.push(drawing.points[firstSeg.pointIds[0]])
		} else if (firstSeg.type === 'cubic') {
			// Find the point that leads into this segment
			// For cubic, pointIds = [cp1, cp2, end], we need the implicit start
			// This requires tracking the previous endpoint
		}
	}

	// Collect endpoints from each segment
	for (const seg of drawing.segments) {
		const lastPointId = seg.pointIds[seg.pointIds.length - 1]
		const point = drawing.points[lastPointId]
		if (point) {
			mainPoints.push({ x: point.x, y: point.y })
		}
	}

	// Build new line-based structure
	const points: Record<string, ControlPoint> = {}
	const segments: PathSegment[] = []

	for (let i = 0; i < mainPoints.length; i++) {
		const id = `p-${i}`
		points[id] = { id, x: mainPoints[i].x, y: mainPoints[i].y, type: 'corner' }
	}

	for (let i = 1; i < mainPoints.length; i++) {
		segments.push({ type: 'line', pointIds: [`p-${i - 1}`, `p-${i}`] })
	}

	return { points, segments }
}
