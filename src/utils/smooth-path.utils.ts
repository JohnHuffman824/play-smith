/**
 * Smooth path processing pipeline
 * Adaptive smoothing: keeps straights perfect, makes curves flowing
 */

import type { Coordinate } from '../types/field.types'
import type { ControlPoint, PathSegment } from '../types/drawing.types'
import { simplifyPath, perpendicularDistance } from './path.utils'

// Constants for smooth mode
const SMOOTH_STRAIGHT_TOLERANCE = 8
const SMOOTH_CURVE_SIMPLIFICATION = 0.2
const SMOOTH_CATMULL_TENSION = 0.75
const CATMULL_ROM_HANDLE_SCALE = 1 / 6

interface Region {
	type: 'straight' | 'curve'
	points: Coordinate[]
	startIndex: number
	endIndex: number
}

/**
 * Calculate maximum deviation of points from straight line between first and last
 */
function calculateMaxDeviation(points: Coordinate[]): number {
	if (points.length < 3) return 0

	const first = points[0]
	const last = points[points.length - 1]
	let maxDist = 0

	for (let i = 1; i < points.length - 1; i++) {
		const dist = perpendicularDistance(points[i], first, last)
		maxDist = Math.max(maxDist, dist)
	}

	return maxDist
}

/**
 * Convert distance deviation to approximate angle deviation
 */
function deviationToAngle(deviation: number, length: number): number {
	if (length === 0) return 0
	const radians = Math.atan(deviation / length)
	return radians * (180 / Math.PI)
}

/**
 * Step 1: Segment Classification
 * Classify regions as straight or curved using sliding window
 */
function classifyRegions(coords: Coordinate[]): Region[] {
	if (coords.length < 2) return []
	if (coords.length === 2) {
		return [{
			type: 'straight',
			points: coords,
			startIndex: 0,
			endIndex: 1,
		}]
	}

	const regions: Region[] = []
	const windowSize = Math.min(10, coords.length)
	let currentRegion: Region | null = null

	for (let i = 0; i < coords.length; i++) {
		const end = Math.min(i + windowSize, coords.length)
		const window = coords.slice(i, end)

		if (window.length < 3) continue

		const deviation = calculateMaxDeviation(window)
		const first = window[0]
		const last = window[window.length - 1]
		const dx = last.x - first.x
		const dy = last.y - first.y
		const length = Math.sqrt(dx * dx + dy * dy)
		const angleDev = deviationToAngle(deviation, length)

		const isStraight = angleDev <= SMOOTH_STRAIGHT_TOLERANCE

		if (!currentRegion) {
			currentRegion = {
				type: isStraight ? 'straight' : 'curve',
				points: [coords[i]],
				startIndex: i,
				endIndex: i,
			}
		} else if (currentRegion.type === (isStraight ? 'straight' : 'curve')) {
			// Continue current region
			currentRegion.points.push(coords[i])
			currentRegion.endIndex = i
		} else {
			// Type changed - start new region
			regions.push(currentRegion)
			currentRegion = {
				type: isStraight ? 'straight' : 'curve',
				points: [coords[i]],
				startIndex: i,
				endIndex: i,
			}
		}
	}

	if (currentRegion && currentRegion.points.length > 0) {
		regions.push(currentRegion)
	}

	return regions.length > 0 ? regions : [{
		type: 'straight',
		points: coords,
		startIndex: 0,
		endIndex: coords.length - 1,
	}]
}

/**
 * Step 2: Process Straight Regions
 * Fit perfect line from first to last point
 */
function processStraightRegion(region: Region): Coordinate[] {
	if (region.points.length < 2) return region.points
	return [region.points[0], region.points[region.points.length - 1]]
}

/**
 * Step 3: Process Curve Regions
 * Apply light simplification and preserve curve shape
 */
function processCurveRegion(region: Region): Coordinate[] {
	if (region.points.length < 3) return region.points
	return simplifyPath(region.points, SMOOTH_CURVE_SIMPLIFICATION)
}

/**
 * Calculate tangent direction at a point
 */
function calculateTangent(
	prev: Coordinate,
	next: Coordinate
): { x: number; y: number } {
	const dx = next.x - prev.x
	const dy = next.y - prev.y
	const length = Math.sqrt(dx * dx + dy * dy)

	if (length === 0) return { x: 0, y: 0 }

	return {
		x: dx / length,
		y: dy / length,
	}
}

/**
 * Create smooth bezier curves using Catmull-Rom with handles
 */
function createSmoothCurves(
	coords: Coordinate[],
	regions: Region[]
): { points: Record<string, ControlPoint>; segments: PathSegment[] } {
	const points: Record<string, ControlPoint> = {}
	const pathSegments: PathSegment[] = []

	if (coords.length < 2) {
		if (coords.length === 1) {
			points['p-0'] = {
				id: 'p-0',
				x: coords[0].x,
				y: coords[0].y,
				type: 'start',
			}
		}
		return { points, segments: pathSegments }
	}

	// Process regions and merge points
	const processedPoints: Coordinate[] = []
	const regionTypes: string[] = []

	for (const region of regions) {
		const processed = region.type === 'straight'
			? processStraightRegion(region)
			: processCurveRegion(region)

		for (const pt of processed) {
			if (processedPoints.length === 0 ||
				pt.x !== processedPoints[processedPoints.length - 1].x ||
				pt.y !== processedPoints[processedPoints.length - 1].y) {
				processedPoints.push(pt)
				regionTypes.push(region.type)
			}
		}
	}

	// Create extended array for Catmull-Rom tangent calculation
	const extended = [
		processedPoints[0],
		...processedPoints,
		processedPoints[processedPoints.length - 1],
	]

	// Create control points with handles
	let pointIndex = 0
	for (let i = 0; i < processedPoints.length; i++) {
		const id = `p-${pointIndex++}`
		const isFirst = i === 0
		const isLast = i === processedPoints.length - 1
		const p0 = extended[i]
		const p1 = extended[i + 1]
		const p2 = extended[i + 2]

		const tangentX = (p2.x - p0.x) / 2
		const tangentY = (p2.y - p0.y) / 2
		const handleLength = CATMULL_ROM_HANDLE_SCALE * SMOOTH_CATMULL_TENSION

		const point: ControlPoint = {
			id,
			x: p1.x,
			y: p1.y,
			type: isFirst ? 'start' : isLast ? 'end' : 'corner',
		}

		// Add handles for smooth transitions
		if (!isFirst) {
			point.handleIn = {
				x: -tangentX * handleLength,
				y: -tangentY * handleLength,
			}
		}

		if (!isLast) {
			point.handleOut = {
				x: tangentX * handleLength,
				y: tangentY * handleLength,
			}
		}

		points[id] = point
	}

	// Create segments
	for (let i = 0; i < processedPoints.length - 1; i++) {
		const fromPoint = points[`p-${i}`]
		const toPoint = points[`p-${i + 1}`]

		// Use cubic for smooth curves, line for straights
		const hasCurve = fromPoint.handleOut || toPoint.handleIn

		pathSegments.push({
			type: hasCurve ? 'cubic' : 'line',
			pointIds: [`p-${i}`, `p-${i + 1}`],
		})
	}

	return { points, segments: pathSegments }
}

/**
 * Main smooth pipeline function
 * Processes raw coordinates into adaptive smooth paths
 */
export function processSmoothPath(
	coords: Coordinate[]
): { points: Record<string, ControlPoint>; segments: PathSegment[] } {
	if (coords.length < 2) {
		if (coords.length === 1) {
			const points: Record<string, ControlPoint> = {
				'p-0': {
					id: 'p-0',
					x: coords[0].x,
					y: coords[0].y,
					type: 'start',
				},
			}
			return { points, segments: [] }
		}
		return { points: {}, segments: [] }
	}

	// Step 1: Classify regions as straight or curved
	const regions = classifyRegions(coords)

	// Steps 2-4: Process regions and create smooth curves
	return createSmoothCurves(coords, regions)
}
