/**
 * Bezier and path utilities for calculating animation timing from drawings.
 */

import type { Coordinate } from '../types/field.types'
import type { Drawing, PathSegment, ControlPoint } from '../types/drawing.types'
import type { RouteTiming, SegmentTiming } from '../types/animation.types'
import { ANIMATION_DEFAULTS } from '../types/animation.types'
import {
	lineLength,
	quadraticLength,
	cubicLength,
} from './animation.utils'
import { getSmoothedPoints } from './drawing.utils'

/**
 * Resolve point IDs to actual coordinates from drawing's point pool.
 */
export function resolvePointIds(
	drawing: Drawing,
	pointIds: string[]
): Coordinate[] {
	return pointIds
		.map((id) => drawing.points[id])
		.filter((point): point is ControlPoint => point !== undefined)
		.map((point) => ({ x: point.x, y: point.y }))
}

/**
 * Get the starting point of a drawing (first point of first segment).
 */
export function getDrawingStartPoint(drawing: Drawing): Coordinate | null {
	const firstSegment = drawing.segments[0]
	if (!firstSegment || firstSegment.pointIds.length === 0) return null
	const firstPointId = firstSegment.pointIds[0]
	if (!firstPointId) return null
	const firstPoint = drawing.points[firstPointId]
	return firstPoint ? { x: firstPoint.x, y: firstPoint.y } : null
}

/**
 * Get the ending point of a drawing (last point of last segment).
 */
export function getDrawingEndPoint(drawing: Drawing): Coordinate | null {
	const lastSegment = drawing.segments[drawing.segments.length - 1]
	if (!lastSegment || lastSegment.pointIds.length === 0) return null
	const lastPointId = lastSegment.pointIds[lastSegment.pointIds.length - 1]
	if (!lastPointId) return null
	const lastPoint = drawing.points[lastPointId]
	return lastPoint ? { x: lastPoint.x, y: lastPoint.y } : null
}

/**
 * Calculate the length of a single path segment.
 */
export function calculateSegmentLength(
	segment: PathSegment,
	points: Coordinate[]
): number {
	const p0 = points[0]
	const p1 = points[1]
	const p2 = points[2]
	const p3 = points[3]

	switch (segment.type) {
		case 'line':
			if (!p0 || !p1) return 0
			return lineLength(p0, p1)

		case 'quadratic':
			if (!p0 || !p1 || !p2) return 0
			return quadraticLength(p0, p1, p2)

		case 'cubic':
			if (!p0 || !p1 || !p2 || !p3) return 0
			return cubicLength(p0, p1, p2, p3)

		default:
			return 0
	}
}

/**
 * Build segment timing from a path segment.
 * Uses the ending point of the previous segment as the starting point.
 */
function buildSegmentTiming(
	segment: PathSegment,
	points: Coordinate[],
	startTime: number,
	speedFps: number
): SegmentTiming {
	const length = calculateSegmentLength(segment, points)
	const duration = length > 0 ? (length / speedFps) * 1000 : 0

	return {
		type: segment.type,
		length,
		startTime,
		endTime: startTime + duration,
		points,
	}
}

/**
 * Calculate complete timing data for a drawing (route).
 * Auto-generates timing based on route length at default player speed.
 */
export function calculateRouteTiming(
	drawing: Drawing,
	speedFps: number = ANIMATION_DEFAULTS.PLAYER_SPEED_FPS
): RouteTiming {
	// Get smoothed points if drawing should be smoothed
	// Transform to extract just x,y coordinates
	const smoothedPoints = getSmoothedPoints(drawing, (point) => ({ x: point.x, y: point.y }))

	if (smoothedPoints) {

		// Create line segments from consecutive smoothed points
		const segments: SegmentTiming[] = []
		let totalLength = 0
		let currentTime = 0

		for (let i = 0; i < smoothedPoints.length - 1; i++) {
			const p0 = smoothedPoints[i]
			const p1 = smoothedPoints[i + 1]
			if (!p0 || !p1) continue

			const points = [p0, p1]
			const segment: PathSegment = { type: 'line', pointIds: [] }

			const segmentTiming = buildSegmentTiming(
				segment,
				points,
				currentTime,
				speedFps
			)

			segments.push(segmentTiming)
			totalLength += segmentTiming.length
			currentTime = segmentTiming.endTime
		}

		return {
			drawingId: drawing.id,
			playerId: drawing.playerId ?? null,
			totalLength,
			duration: currentTime,
			segments,
			startOffset: 0, // Default, will be calculated in calculateAllRouteTimings
		}
	}

	// Original logic for non-smooth drawings (sharp mode, cubic, quadratic)
	const segments: SegmentTiming[] = []
	let totalLength = 0
	let currentTime = 0

	// Track the previous end point for continuity
	let prevEndPoint: Coordinate | null = null

	for (const segment of drawing.segments) {
		// Resolve point IDs to coordinates
		let points = resolvePointIds(drawing, segment.pointIds)

		// If we have a previous end point and this segment starts differently,
		// prepend the previous end point for continuity
		const firstPoint = points[0]
		if (firstPoint && prevEndPoint) {
			const isContinuous =
				Math.abs(firstPoint.x - prevEndPoint.x) < 0.01 &&
				Math.abs(firstPoint.y - prevEndPoint.y) < 0.01

			if (!isContinuous) {
				// Use prevEndPoint as start for line-type continuity
				points = [prevEndPoint, ...points]
			}
		}

		if (points.length < 2) continue

		const segmentTiming = buildSegmentTiming(
			segment,
			points,
			currentTime,
			speedFps
		)

		segments.push(segmentTiming)
		totalLength += segmentTiming.length
		currentTime = segmentTiming.endTime

		// Track the end point for next segment
		const lastPoint = points[points.length - 1]
		prevEndPoint = lastPoint ?? null
	}

	return {
		drawingId: drawing.id,
		playerId: drawing.playerId ?? null,
		totalLength,
		duration: currentTime,
		segments,
		startOffset: 0, // Default, will be calculated in calculateAllRouteTimings
	}
}

/**
 * Calculate timing for all player-linked drawings in a play.
 * Returns a map keyed by drawing ID with proper startOffset for pre-snap motion.
 */
export function calculateAllRouteTimings(
	drawings: Drawing[],
	speedFps: number = ANIMATION_DEFAULTS.PLAYER_SPEED_FPS
): Map<string, RouteTiming> {
	const timings = new Map<string, RouteTiming>()

	// Separate drawings by type
	const shifts: Drawing[] = []
	const motions: Drawing[] = []
	const regular: Drawing[] = []

	for (const drawing of drawings) {
		// Only process drawings linked to players
		if (!drawing.playerId) continue

		if (drawing.preSnapMotion?.type === 'shift') {
			shifts.push(drawing)
		} else if (drawing.preSnapMotion?.type === 'motion') {
			motions.push(drawing)
		} else {
			regular.push(drawing)
		}
	}

	// Calculate base timing for all drawings
	for (const drawing of [...shifts, ...motions, ...regular]) {
		const timing = calculateRouteTiming(drawing, speedFps)
		timings.set(drawing.id, timing)
	}

	// Calculate pre-snap offsets
	// Shifts animate sequentially, then motion, then regular routes at snap (offset 0)
	let currentPreSnapOffset = 0

	// Process shifts sequentially
	for (const shift of shifts) {
		const timing = timings.get(shift.id)
		if (timing) {
			// Shift starts at current pre-snap offset (negative time)
			timing.startOffset = currentPreSnapOffset - timing.duration
			// Next shift starts after this one completes
			currentPreSnapOffset = timing.startOffset
		}
	}

	// Process motion after all shifts
	for (const motion of motions) {
		const timing = timings.get(motion.id)
		if (timing) {
			// Motion starts after all shifts complete
			timing.startOffset = currentPreSnapOffset - timing.duration
		}
	}

	// Regular routes start at snap (offset 0) - already set as default

	return timings
}

/**
 * Get the maximum duration across all route timings.
 * This determines the total animation duration.
 */
export function getMaxRouteDuration(
	routeTimings: Map<string, RouteTiming>
): number {
	let maxDuration = 0

	for (const timing of routeTimings.values()) {
		if (timing.duration > maxDuration) {
			maxDuration = timing.duration
		}
	}

	return maxDuration
}

/**
 * Calculate the total animation duration including pre-snap, snap count, and endpoint hold.
 */
export function calculateTotalDuration(
	routeTimings: Map<string, RouteTiming>,
	includeSnapCount: boolean = true,
	includeEndpointHold: boolean = true
): number {
	let preSnapDuration = 0
	let postSnapDuration = 0

	// Find the earliest start (most negative offset) and latest end
	for (const timing of routeTimings.values()) {
		// Pre-snap duration is the absolute value of the most negative startOffset
		if (timing.startOffset < 0) {
			const routePreSnapTime = Math.abs(timing.startOffset)
			preSnapDuration = Math.max(preSnapDuration, routePreSnapTime)
		}

		// Post-snap duration is the maximum of (startOffset + duration) for routes starting at/after snap
		const routeEndTime = timing.startOffset + timing.duration
		if (routeEndTime > postSnapDuration) {
			postSnapDuration = routeEndTime
		}
	}

	let totalDuration = preSnapDuration + postSnapDuration

	if (includeSnapCount) {
		totalDuration += ANIMATION_DEFAULTS.SNAP_COUNT_DURATION
	}

	if (includeEndpointHold) {
		totalDuration += ANIMATION_DEFAULTS.ENDPOINT_HOLD_DURATION
	}

	return totalDuration
}
