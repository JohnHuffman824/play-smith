/**
 * Animation utilities for path interpolation.
 */

import type { Coordinate } from '../types/field.types'
import type { RouteTiming, SegmentTiming } from '../types/animation.types'
import { ANIMATION_DEFAULTS } from '../types/animation.types'

const { DIRECTION_EPSILON } = ANIMATION_DEFAULTS

/**
 * Calculate position along a line segment at parameter t (0-1).
 * Linear interpolation: P(t) = P0 + t(P1 - P0)
 */
export function interpolateLine(
	p0: Coordinate,
	p1: Coordinate,
	t: number
): Coordinate {
	const clampedT = Math.max(0, Math.min(1, t))
	return {
		x: p0.x + (p1.x - p0.x) * clampedT,
		y: p0.y + (p1.y - p0.y) * clampedT,
	}
}

/**
 * Calculate position along a quadratic Bezier curve at parameter t (0-1).
 * Q(t) = (1-t)² P0 + 2(1-t)t P1 + t² P2
 */
export function interpolateQuadratic(
	p0: Coordinate,
	p1: Coordinate, // control point
	p2: Coordinate, // end point
	t: number
): Coordinate {
	const clampedT = Math.max(0, Math.min(1, t))
	const oneMinusT = 1 - clampedT
	const oneMinusT2 = oneMinusT * oneMinusT
	const t2 = clampedT * clampedT

	return {
		x: oneMinusT2 * p0.x + 2 * oneMinusT * clampedT * p1.x + t2 * p2.x,
		y: oneMinusT2 * p0.y + 2 * oneMinusT * clampedT * p1.y + t2 * p2.y,
	}
}

/**
 * Calculate position along a cubic Bezier curve at parameter t (0-1).
 * C(t) = (1-t)³ P0 + 3(1-t)²t P1 + 3(1-t)t² P2 + t³ P3
 */
export function interpolateCubic(
	p0: Coordinate,
	p1: Coordinate, // control point 1
	p2: Coordinate, // control point 2
	p3: Coordinate, // end point
	t: number
): Coordinate {
	const clampedT = Math.max(0, Math.min(1, t))
	const oneMinusT = 1 - clampedT
	const oneMinusT2 = oneMinusT * oneMinusT
	const oneMinusT3 = oneMinusT2 * oneMinusT
	const t2 = clampedT * clampedT
	const t3 = t2 * clampedT

	return {
		x:
			oneMinusT3 * p0.x +
			3 * oneMinusT2 * clampedT * p1.x +
			3 * oneMinusT * t2 * p2.x +
			t3 * p3.x,
		y:
			oneMinusT3 * p0.y +
			3 * oneMinusT2 * clampedT * p1.y +
			3 * oneMinusT * t2 * p2.y +
			t3 * p3.y,
	}
}

/**
 * Calculate the length of a line segment.
 */
export function lineLength(p0: Coordinate, p1: Coordinate): number {
	const dx = p1.x - p0.x
	const dy = p1.y - p0.y
	return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Approximate the length of a quadratic Bezier curve using sampling.
 */
export function quadraticLength(
	p0: Coordinate,
	p1: Coordinate,
	p2: Coordinate,
	samples: number = 50
): number {
	let length = 0
	let prevPoint = p0

	for (let i = 1; i <= samples; i++) {
		const t = i / samples
		const currentPoint = interpolateQuadratic(p0, p1, p2, t)
		length += lineLength(prevPoint, currentPoint)
		prevPoint = currentPoint
	}

	return length
}

/**
 * Approximate the length of a cubic Bezier curve using sampling.
 */
export function cubicLength(
	p0: Coordinate,
	p1: Coordinate,
	p2: Coordinate,
	p3: Coordinate,
	samples: number = 50
): number {
	let length = 0
	let prevPoint = p0

	for (let i = 1; i <= samples; i++) {
		const t = i / samples
		const currentPoint = interpolateCubic(p0, p1, p2, p3, t)
		length += lineLength(prevPoint, currentPoint)
		prevPoint = currentPoint
	}

	return length
}

/**
 * Calculate the position along a single segment at a given progress (0-1).
 */
export function getPositionAlongSegment(
	segment: SegmentTiming,
	progress: number
): Coordinate {
	const { type, points } = segment
	const clampedProgress = Math.max(0, Math.min(1, progress))

	// Early return if no points
	if (points.length === 0) {
		return { x: 0, y: 0 }
	}

	const p0 = points[0]!
	const p1 = points[1] ?? p0
	const p2 = points[2] ?? p1
	const p3 = points[3] ?? p2

	switch (type) {
		case 'line':
			return interpolateLine(p0, p1, clampedProgress)

		case 'quadratic':
			return interpolateQuadratic(p0, p1, p2, clampedProgress)

		case 'cubic':
			return interpolateCubic(p0, p1, p2, p3, clampedProgress)

		default:
			return p0
	}
}

/**
 * Get position along an entire route at a given time (in ms).
 * Handles multiple segments with different lengths and timing.
 */
export function getPositionAlongRoute(
	routeTiming: RouteTiming,
	currentTime: number
): Coordinate {
	const { segments, duration } = routeTiming

	if (segments.length === 0) {
		return { x: 0, y: 0 }
	}

	// Clamp time to valid range
	const clampedTime = Math.max(0, Math.min(duration, currentTime))

	// Find which segment contains this time
	for (const segment of segments) {
		if (clampedTime >= segment.startTime && clampedTime <= segment.endTime) {
			const segmentDuration = segment.endTime - segment.startTime
			const segmentProgress =
				segmentDuration > 0
					? (clampedTime - segment.startTime) / segmentDuration
					: 0

			return getPositionAlongSegment(segment, segmentProgress)
		}
	}

	// If past end, return last point of last segment
	const lastSegment = segments[segments.length - 1]
	if (!lastSegment || lastSegment.points.length === 0) {
		return { x: 0, y: 0 }
	}
	return lastSegment.points[lastSegment.points.length - 1] ?? { x: 0, y: 0 }
}

/**
 * Calculate the overall progress (0-1) based on current time.
 */
export function calculateProgress(
	currentTime: number,
	totalDuration: number
): number {
	if (totalDuration <= 0) return 0
	return Math.max(0, Math.min(1, currentTime / totalDuration))
}

/**
 * Calculate time from progress.
 */
export function calculateTimeFromProgress(
	progress: number,
	totalDuration: number
): number {
	const clampedProgress = Math.max(0, Math.min(1, progress))
	return clampedProgress * totalDuration
}

/**
 * Calculate the direction vector at a point along a segment.
 * Useful for orienting player sprites to face direction of movement.
 */
export function getDirectionAtSegment(
	segment: SegmentTiming,
	progress: number
): Coordinate {
	const t1 = Math.max(0, progress - DIRECTION_EPSILON)
	const t2 = Math.min(1, progress + DIRECTION_EPSILON)

	const p1 = getPositionAlongSegment(segment, t1)
	const p2 = getPositionAlongSegment(segment, t2)

	const dx = p2.x - p1.x
	const dy = p2.y - p1.y
	const magnitude = Math.sqrt(dx * dx + dy * dy)

	if (magnitude === 0) {
		return { x: 0, y: 1 } // Default to facing "up" (positive Y)
	}

	return {
		x: dx / magnitude,
		y: dy / magnitude,
	}
}

/**
 * Calculate the angle in radians from a direction vector.
 * 0 = facing right, PI/2 = facing up, etc.
 */
export function directionToAngle(direction: Coordinate): number {
	return Math.atan2(direction.y, direction.x)
}
