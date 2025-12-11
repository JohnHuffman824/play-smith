/**
 * Sharp path processing pipeline
 * Creates clean geometric shapes with crisp angles
 */

import type { Coordinate } from '../types/field.types'
import type { ControlPoint, PathSegment } from '../types/drawing.types'
import { simplifyPath } from './path.utils'

// Constants for sharp mode
const SHARP_SIMPLIFICATION_TOLERANCE = 1.5
const SHARP_MIN_ANGLE_THRESHOLD = 15
const SHARP_ANGLE_SNAP_INCREMENT = 15

interface LineSegment {
	start: Coordinate
	end: Coordinate
	angle: number
}

/**
 * Convert angle from radians to degrees
 */
function toDegrees(radians: number): number {
	return radians * (180 / Math.PI)
}

/**
 * Convert angle from degrees to radians
 */
function toRadians(degrees: number): number {
	return degrees * (Math.PI / 180)
}

/**
 * Normalize angle to 0-360 range
 */
function normalizeAngle(degrees: number): number {
	let angle = degrees % 360
	if (angle < 0) angle += 360
	return angle
}

/**
 * Calculate angle between two points (in degrees)
 */
function calculateAngle(from: Coordinate, to: Coordinate): number {
	const radians = Math.atan2(to.y - from.y, to.x - from.x)
	return normalizeAngle(toDegrees(radians))
}

/**
 * Calculate smallest angle difference between two angles
 */
function angleDifference(angle1: number, angle2: number): number {
	const diff = Math.abs(angle1 - angle2)
	return Math.min(diff, 360 - diff)
}

/**
 * Snap angle to nearest increment
 */
function snapAngle(angle: number, increment: number): number {
	return Math.round(angle / increment) * increment
}

/**
 * Step 1: Line Segment Detection
 * Apply aggressive simplification to group collinear points
 */
function detectLineSegments(
	coords: Coordinate[]
): LineSegment[] {
	if (coords.length < 2) return []

	const simplified = simplifyPath(coords, SHARP_SIMPLIFICATION_TOLERANCE)

	const segments: LineSegment[] = []
	for (let i = 0; i < simplified.length - 1; i++) {
		const start = simplified[i]
		const end = simplified[i + 1]
		const angle = calculateAngle(start, end)

		segments.push({ start, end, angle })
	}

	return segments
}

/**
 * Step 2: Corner Analysis
 * Detect corners and merge segments with small angle changes
 */
function analyzeCorners(segments: LineSegment[]): LineSegment[] {
	if (segments.length < 2) return segments

	const merged: LineSegment[] = []
	let currentSegment = segments[0]

	for (let i = 1; i < segments.length; i++) {
		const nextSegment = segments[i]
		const angleDiff = angleDifference(
			currentSegment.angle,
			nextSegment.angle
		)

		if (angleDiff < SHARP_MIN_ANGLE_THRESHOLD) {
			// Merge: extend current segment to next end point
			currentSegment = {
				start: currentSegment.start,
				end: nextSegment.end,
				angle: calculateAngle(currentSegment.start, nextSegment.end),
			}
		} else {
			// Real corner detected
			merged.push(currentSegment)
			currentSegment = nextSegment
		}
	}

	merged.push(currentSegment)
	return merged
}

/**
 * Step 3: Angle Snapping
 * Snap angles to 15° increments and adjust endpoints
 */
function snapAngles(segments: LineSegment[]): LineSegment[] {
	if (segments.length === 0) return []

	const snapped: LineSegment[] = []
	let currentStart = segments[0].start

	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i]
		const snappedAngle = snapAngle(
			segment.angle,
			SHARP_ANGLE_SNAP_INCREMENT
		)

		// Calculate segment length
		const dx = segment.end.x - segment.start.x
		const dy = segment.end.y - segment.start.y
		const length = Math.sqrt(dx * dx + dy * dy)

		// Calculate new endpoint based on snapped angle
		const angleRad = toRadians(snappedAngle)
		const newEnd: Coordinate = {
			x: currentStart.x + length * Math.cos(angleRad),
			y: currentStart.y + length * Math.sin(angleRad),
		}

		snapped.push({
			start: currentStart,
			end: newEnd,
			angle: snappedAngle,
		})

		currentStart = newEnd
	}

	return snapped
}

/**
 * Step 4: Line Straightening
 * Ensure perfect straight lines (already handled by segment construction)
 */
function convertToControlPoints(
	segments: LineSegment[]
): { points: Record<string, ControlPoint>; segments: PathSegment[] } {
	const points: Record<string, ControlPoint> = {}
	const pathSegments: PathSegment[] = []

	if (segments.length === 0) {
		return { points, segments: pathSegments }
	}

	// Create control points with sequential IDs
	// Each point is created once and shared between consecutive segments
	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i]
		const isFirst = i === 0
		const isLast = i === segments.length - 1

		// Add start point (for first segment only)
		if (isFirst) {
			const startId = `p-${i}`
			points[startId] = {
				id: startId,
				x: segment.start.x,
				y: segment.start.y,
				type: 'start',
			}
		}

		// Add end point (always)
		const endId = `p-${i + 1}`
		points[endId] = {
			id: endId,
			x: segment.end.x,
			y: segment.end.y,
			type: isLast ? 'end' : 'corner',
		}
	}

	// Create line segments that reference consecutive points
	// This ensures each segment shares its endpoint with the next segment's start point
	for (let i = 0; i < segments.length; i++) {
		pathSegments.push({
			type: 'line',
			pointIds: [`p-${i}`, `p-${i + 1}`],
		})
	}

	return { points, segments: pathSegments }
}

/**
 * Main sharp pipeline function
 * Processes raw coordinates into clean geometric paths
 */
export function processSharpPath(
	coords: Coordinate[]
): { points: Record<string, ControlPoint>; segments: PathSegment[] } {
	if (coords.length < 2) {
		// Handle edge case: single point
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

	// Step 1: Detect line segments
	let segments = detectLineSegments(coords)

	// Step 2: Analyze corners and merge small angles
	segments = analyzeCorners(segments)

	// Step 3: Snap angles to 15° increments
	segments = snapAngles(segments)

	// Step 4: Convert to control points and path segments
	return convertToControlPoints(segments)
}
