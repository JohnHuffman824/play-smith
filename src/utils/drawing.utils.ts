import type { Coordinate } from '../types/field.types'
import type {
	ControlPoint,
	Drawing,
	PathSegment,
} from '../types/drawing.types'
import { pointToLineDistance } from './canvas.utils'
import { applyChaikin, CHAIKIN_ITERATIONS } from './chaikin.utils'

export interface SnapTarget {
	drawingId: string
	pointId: string
	point: ControlPoint
	distance: number
}

export interface PlayerForSnap {
	id: string
	x: number
	y: number
	label: string
	color: string
}

export interface PlayerSnapTarget {
	playerId: string
	point: Coordinate
	distance: number
}

export function findSnapTarget(
	position: Coordinate,
	drawings: Drawing[],
	excludeDrawingId: string,
	threshold: number,
): SnapTarget | null {
	let closest: SnapTarget | null = null

	for (const drawing of drawings) {
		if (drawing.id == excludeDrawingId) continue

		const startPoint = getStartPoint(drawing)
		const endPoint = getEndPoint(drawing)
		const candidates = [startPoint, endPoint].filter(
			(point): point is ControlPoint => Boolean(point),
		)

		for (const point of candidates) {
			const dx = position.x - point.x
			const dy = position.y - point.y
			const distance = Math.sqrt(dx * dx + dy * dy)

			if (distance > threshold) continue

			if (!closest || distance < closest.distance) {
				closest = {
					drawingId: drawing.id,
					pointId: point.id,
					point,
					distance,
				}
			}
		}
	}

	return closest
}

export function findPlayerSnapTarget(
	position: Coordinate,
	players: PlayerForSnap[],
	threshold: number,
): PlayerSnapTarget | null {
	let closest: PlayerSnapTarget | null = null

	for (const player of players) {
		const dx = position.x - player.x
		const dy = position.y - player.y
		const distance = Math.sqrt(dx * dx + dy * dy)

		if (distance > threshold) continue

		if (!closest || distance < closest.distance) {
			closest = {
				playerId: player.id,
				point: { x: player.x, y: player.y },
				distance,
			}
		}
	}

	return closest
}

export interface DrawingSnapTarget {
	drawingId: string
	pointId: string
	point: Coordinate
	distance: number
}

export function findDrawingSnapTarget(
	position: Coordinate,
	drawings: Drawing[],
	threshold: number,
): DrawingSnapTarget | null {
	let closest: DrawingSnapTarget | null = null

	for (const drawing of drawings) {
		// Skip drawings that already have a player linked
		if (drawing.playerId) continue

		// Check start and end points only (not intermediate points)
		const startPoint = getDrawingStartPoint(drawing)
		const endPoint = getDrawingEndPoint(drawing)
		const candidates = [startPoint, endPoint].filter(
			(point): point is ControlPoint => Boolean(point),
		)

		for (const point of candidates) {
			const dx = position.x - point.x
			const dy = position.y - point.y
			const distance = Math.sqrt(dx * dx + dy * dy)

			if (distance > threshold) continue

			if (!closest || distance < closest.distance) {
				closest = {
					drawingId: drawing.id,
					pointId: point.id,
					point: { x: point.x, y: point.y },
					distance,
				}
			}
		}
	}

	return closest
}

export function calculateUnlinkPosition(
	playerPos: Coordinate,
	secondToLastPoint: Coordinate,
	distance: number,
): Coordinate {
	const dx = secondToLastPoint.x - playerPos.x
	const dy = secondToLastPoint.y - playerPos.y
	const length = Math.sqrt(dx * dx + dy * dy)

	if (length == 0) {
		return { x: playerPos.x, y: playerPos.y - distance }
	}

	const unitX = dx / length
	const unitY = dy / length

	return {
		x: playerPos.x + unitX * distance,
		y: playerPos.y + unitY * distance,
	}
}

/**
 * Determine the priority of a lineEnd type.
 * arrow > tShape > none
 */
function lineEndPriority(lineEnd: 'none' | 'arrow' | 'tShape'): number {
	switch (lineEnd) {
		case 'arrow':
			return 2
		case 'tShape':
			return 1
		case 'none':
			return 0
	}
}

/**
 * Select the higher priority lineEnd between two options.
 */
function selectLineEnd(
	a: 'none' | 'arrow' | 'tShape',
	b: 'none' | 'arrow' | 'tShape',
): 'none' | 'arrow' | 'tShape' {
	return lineEndPriority(a) >= lineEndPriority(b) ? a : b
}

export function mergeDrawings(
	sourceDrawing: Drawing,
	targetDrawing: Drawing,
	sourcePointId: string,
	targetPointId: string,
): Drawing {
	// Determine if we need to reverse segments to make junction points meet
	const sourceIsEnd = isEndPoint(sourceDrawing, sourcePointId)
	const sourceIsStart = isStartPoint(sourceDrawing, sourcePointId)
	const targetIsStart = isStartPoint(targetDrawing, targetPointId)
	const targetIsEnd = isEndPoint(targetDrawing, targetPointId)

	// Compute merged lineEnd - preserve arrows from junction points
	let mergedLineEnd: 'none' | 'arrow' | 'tShape' = 'none'

	// Source's junction was source's END - its arrow is consumed, transfer it
	if (sourceIsEnd) {
		mergedLineEnd = selectLineEnd(mergedLineEnd, sourceDrawing.style.lineEnd)
	}
	// Target's junction was target's END - its arrow is consumed, transfer it
	if (targetIsEnd) {
		mergedLineEnd = selectLineEnd(mergedLineEnd, targetDrawing.style.lineEnd)
	}
	// Target's terminal END becomes merged END (if junction was START)
	if (targetIsStart) {
		mergedLineEnd = selectLineEnd(mergedLineEnd, targetDrawing.style.lineEnd)
	}

	// Get segments in correct order (source ends with sourcePoint, target starts with targetPoint)
	const sourceSegments = sourceIsEnd
		? sourceDrawing.segments
		: sourceIsStart
			? reverseSegments(sourceDrawing.segments)
			: sourceDrawing.segments

	const targetSegments = targetIsStart
		? targetDrawing.segments
		: targetIsEnd
			? reverseSegments(targetDrawing.segments)
			: targetDrawing.segments

	// Merge point pools - target junction point gets replaced by source junction point
	const mergedPoints: Record<string, ControlPoint> = { ...sourceDrawing.points }

	// Map target point IDs to new IDs (avoid collisions with source)
	let counter = Object.keys(mergedPoints).length
	const targetIdMap: Record<string, string> = {}

	for (const [oldId, point] of Object.entries(targetDrawing.points)) {
		if (oldId === targetPointId) {
			// Junction point - map to source point ID (target position is stationary)
			targetIdMap[oldId] = sourcePointId
			// Update the source junction point to target's position (stationary node wins)
			mergedPoints[sourcePointId] = { ...point, id: sourcePointId }
		} else {
			// Non-junction point - create new ID to avoid collision
			const newId = `p-${counter++}`
			targetIdMap[oldId] = newId
			mergedPoints[newId] = { ...point, id: newId }
		}
	}

	// Merge segments, remapping target point IDs
	const mergedSegments: PathSegment[] = [
		...sourceSegments,
		...targetSegments.map((seg) => ({
			...seg,
			pointIds: seg.pointIds.map((id) => targetIdMap[id] || id),
		})),
	]

	return {
		id: `drawing-${Date.now()}`,
		points: mergedPoints,
		segments: mergedSegments,
		style: {
			...sourceDrawing.style,
			lineEnd: mergedLineEnd,
		},
		annotations: [
			...sourceDrawing.annotations,
			...targetDrawing.annotations,
		],
	}
}

export function isPointNearDrawing(
	drawing: Drawing,
	coordSystem: { feetToPixels: (x: number, y: number) => Coordinate },
	pixelPoint: Coordinate,
	paddingPx: number,
): boolean {
	const segments = drawing.segments
	for (const segment of segments) {
		const points = getSegmentPoints(drawing, segment)
		for (let i = 0; i < points.length - 1; i++) {
			const p1Feet = points[i]!
			const p2Feet = points[i + 1]!
			const p1 = coordSystem.feetToPixels(p1Feet.x, p1Feet.y)
			const p2 = coordSystem.feetToPixels(p2Feet.x, p2Feet.y)
			const dist = pointToLineDistance(pixelPoint, p1, p2)
			if (dist <= paddingPx) return true
		}
	}
	return false
}

export function isPointNearControlPoint(
	drawing: Drawing,
	coordSystem: { feetToPixels: (x: number, y: number) => Coordinate },
	pixelPoint: Coordinate,
	paddingPx: number,
): boolean {
	// Check all points in the shared pool
	for (const point of Object.values(drawing.points)) {
		const pixel = coordSystem.feetToPixels(point.x, point.y)
		const dx = pixelPoint.x - pixel.x
		const dy = pixelPoint.y - pixel.y
		const dist = Math.sqrt(dx * dx + dy * dy)
		if (dist <= paddingPx) return true
	}
	return false
}

function isEndPoint(drawing: Drawing, pointId: string): boolean {
	const lastSegment = drawing.segments[drawing.segments.length - 1]
	if (!lastSegment) return false
	const lastPointId = lastSegment.pointIds[lastSegment.pointIds.length - 1]
	return lastPointId == pointId
}

function isStartPoint(drawing: Drawing, pointId: string): boolean {
	const firstSegment = drawing.segments[0]
	if (!firstSegment) return false
	const firstPointId = firstSegment.pointIds[0]
	return firstPointId == pointId
}

function _reindexSegments(segments: PathSegment[]): PathSegment[] {
	// Note: This function is deprecated since segments now use pointIds
	// Keeping for backward compatibility but segments should just be returned as-is
	return segments
}

function reverseSegments(segments: PathSegment[]): PathSegment[] {
	const reversedSegments = [...segments].reverse().map((segment) => ({
		...segment,
		pointIds: [...segment.pointIds].reverse(),
	}))
	return reversedSegments
}

function _ensurePointIsStart(
	drawing: Drawing,
	pointId: string,
): PathSegment[] {
	const isStart = isStartPoint(drawing, pointId)
	const isEnd = isEndPoint(drawing, pointId)
	if (isStart) return drawing.segments
	if (isEnd) return reverseSegments(drawing.segments)
	return drawing.segments
}

function _ensurePointIsEnd(drawing: Drawing, pointId: string): PathSegment[] {
	const isEnd = isEndPoint(drawing, pointId)
	const isStart = isStartPoint(drawing, pointId)
	if (isEnd) return drawing.segments
	if (isStart) return reverseSegments(drawing.segments)
	return drawing.segments
}

function getStartPoint(drawing: Drawing): ControlPoint | null {
	const firstSegment = drawing.segments[0]
	if (!firstSegment) return null
	const firstPointId = firstSegment.pointIds[0]
	if (!firstPointId) return null
	return drawing.points[firstPointId] ?? null
}

function getEndPoint(drawing: Drawing): ControlPoint | null {
	const lastSegment = drawing.segments[drawing.segments.length - 1]
	if (!lastSegment) return null
	const lastPointId = lastSegment.pointIds[lastSegment.pointIds.length - 1]
	if (!lastPointId) return null
	return drawing.points[lastPointId] ?? null
}

function _cloneSegments(segments: PathSegment[]): PathSegment[] {
	return segments.map((segment) => ({
		...segment,
		pointIds: [...segment.pointIds],
	}))
}

// NEW HELPER FUNCTIONS FOR SHARED POINT REFERENCES ARCHITECTURE

/**
 * Get a point from a drawing by ID.
 * Returns the point from the shared point pool.
 */
export function getPoint(drawing: Drawing, pointId: string): ControlPoint | undefined {
	return drawing.points[pointId]
}

/**
 * Get all points for a segment (resolved from IDs).
 * Filters out undefined points if a referenced ID doesn't exist in the pool.
 */
export function getSegmentPoints(drawing: Drawing, segment: PathSegment): ControlPoint[] {
	return segment.pointIds
		.map((id) => drawing.points[id])
		.filter((point): point is ControlPoint => point !== undefined)
}

/**
 * Get the start point of a drawing (first point of first segment).
 */
export function getDrawingStartPoint(drawing: Drawing): ControlPoint | null {
	const firstSegment = drawing.segments[0]
	if (!firstSegment) return null
	const firstPointId = firstSegment.pointIds[0]
	if (!firstPointId) return null
	return drawing.points[firstPointId] ?? null
}

/**
 * Get the end point of a drawing (last point of last segment).
 */
export function getDrawingEndPoint(drawing: Drawing): ControlPoint | null {
	const lastSegment = drawing.segments[drawing.segments.length - 1]
	if (!lastSegment) return null
	const lastPointId = lastSegment.pointIds[lastSegment.pointIds.length - 1]
	if (!lastPointId) return null
	return drawing.points[lastPointId] ?? null
}

/**
 * Get ordered list of point IDs by traversing segments.
 */
function getOrderedPointIds(drawing: Drawing): string[] {
	if (drawing.segments.length === 0) {
		return Object.keys(drawing.points)
	}

	const orderedIds: string[] = []
	const seen = new Set<string>()

	for (const segment of drawing.segments) {
		for (const pointId of segment.pointIds) {
			if (!seen.has(pointId)) {
				orderedIds.push(pointId)
				seen.add(pointId)
			}
		}
	}

	return orderedIds
}

/**
 * Delete a point from a drawing, updating segments accordingly.
 * Returns null if the drawing should be deleted entirely (fewer than 2 points remaining).
 */
export function deletePointFromDrawing(
	drawing: Drawing,
	pointIdToDelete: string
): Drawing | null {
	const pointIds = Object.keys(drawing.points)

	// If deleting would leave fewer than 2 points, return null to signal deletion
	if (pointIds.length <= 2) {
		return null
	}

	// Create new points pool without the deleted point
	const newPoints: Record<string, ControlPoint> = {}
	for (const [id, point] of Object.entries(drawing.points)) {
		if (id !== pointIdToDelete) {
			newPoints[id] = point
		}
	}

	// Get ordered list of remaining point IDs by traversing segments
	const orderedPointIds = getOrderedPointIds(drawing)
	const remainingOrderedPoints = orderedPointIds.filter(id => id !== pointIdToDelete)

	// Rebuild segments as simple lines connecting remaining points in order
	const rebuiltSegments: PathSegment[] = []
	for (let i = 0; i < remainingOrderedPoints.length - 1; i++) {
		rebuiltSegments.push({
			type: 'line',
			pointIds: [remainingOrderedPoints[i]!, remainingOrderedPoints[i + 1]!]
		})
	}

	return {
		...drawing,
		points: newPoints,
		segments: rebuiltSegments
	}
}

// POINT INSERTION UTILITIES FOR ADD NODE FEATURE

type SegmentHitResult = {
	segmentIndex: number
	insertPosition: Coordinate
	distance: number
}

type CoordSystemLike = {
	feetToPixels: (x: number, y: number) => Coordinate
	pixelsToFeet: (x: number, y: number) => Coordinate
	scale: number
}

const CHAIKIN_SMOOTH_ITERATIONS = 3
const CHAIKIN_MULTIPLIER = 8

/**
 * Find which segment a point is closest to, considering Chaikin smoothing for curved paths.
 * Returns the segment index and the position where a new point should be inserted.
 */
export function findClosestSegmentPosition(
	drawing: Drawing,
	clickPositionFeet: Coordinate,
	coordSystem: CoordSystemLike
): SegmentHitResult | null {
	if (drawing.segments.length === 0) return null

	// Get ordered points
	const orderedPoints = getOrderedPointsFromDrawing(drawing)
	if (orderedPoints.length < 2) return null

	let bestResult: SegmentHitResult | null = null
	let bestDistance = Infinity

	if (drawing.style.pathMode === 'curve') {
		// For curved paths, apply Chaikin smoothing and find position on smoothed curve
		const pixelPoints = orderedPoints.map(p => coordSystem.feetToPixels(p.x, p.y))

		// Apply Chaikin smoothing (matching PathRenderer)
		let smoothedPixels = pixelPoints
		for (let i = 0; i < CHAIKIN_SMOOTH_ITERATIONS; i++) {
			smoothedPixels = chaikinSubdivideSimple(smoothedPixels, true)
		}

		const clickPixel = coordSystem.feetToPixels(clickPositionFeet.x, clickPositionFeet.y)

		// Find closest point on smoothed curve
		let closestSmoothedIndex = 0
		let closestT = 0
		let minDist = Infinity

		for (let i = 0; i < smoothedPixels.length - 1; i++) {
			const p1 = smoothedPixels[i]
			const p2 = smoothedPixels[i + 1]
			if (!p1 || !p2) continue

			const { distance, t } = pointToSegmentInfo(clickPixel, p1, p2)
			if (distance < minDist) {
				minDist = distance
				closestSmoothedIndex = i
				closestT = t
			}
		}

		// Map smoothed index back to original segment
		// Each Chaikin iteration roughly doubles the points
		const originalSegmentIndex = Math.min(
			Math.floor(closestSmoothedIndex / CHAIKIN_MULTIPLIER),
			drawing.segments.length - 1
		)

		// Calculate insert position by interpolating on the smoothed curve
		const p1 = smoothedPixels[closestSmoothedIndex]
		const p2 = smoothedPixels[closestSmoothedIndex + 1]
		if (!p1 || !p2) {
			return null
		}
		const insertPixel = {
			x: p1.x + closestT * (p2.x - p1.x),
			y: p1.y + closestT * (p2.y - p1.y)
		}
		const insertFeet = coordSystem.pixelsToFeet(insertPixel.x, insertPixel.y)

		bestResult = {
			segmentIndex: originalSegmentIndex,
			insertPosition: insertFeet,
			distance: minDist
		}
	} else {
		// For sharp paths, check each segment directly
		const clickPixel = coordSystem.feetToPixels(clickPositionFeet.x, clickPositionFeet.y)

		for (let i = 0; i < drawing.segments.length; i++) {
			const segment = drawing.segments[i]
			if (!segment) continue

			const points = segment.pointIds
				.map(id => drawing.points[id])
				.filter(Boolean) as ControlPoint[]

			if (points.length < 2) continue

			const firstPoint = points[0]
			const lastPoint = points[points.length - 1]
			if (!firstPoint || !lastPoint) continue

			const p1Pixel = coordSystem.feetToPixels(firstPoint.x, firstPoint.y)
			const p2Pixel = coordSystem.feetToPixels(lastPoint.x, lastPoint.y)

			const { distance, t } = pointToSegmentInfo(clickPixel, p1Pixel, p2Pixel)

			if (distance < bestDistance) {
				bestDistance = distance
				const insertFeet = {
					x: firstPoint.x + t * (lastPoint.x - firstPoint.x),
					y: firstPoint.y + t * (lastPoint.y - firstPoint.y)
				}
				bestResult = {
					segmentIndex: i,
					insertPosition: insertFeet,
					distance
				}
			}
		}
	}

	return bestResult
}

/**
 * Simple Chaikin subdivision (matching PathRenderer logic)
 */
function chaikinSubdivideSimple(
	points: Coordinate[],
	preserveEndpoints: boolean
): Coordinate[] {
	if (points.length < 2) return points

	const result: Coordinate[] = []

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i]
		const p1 = points[i + 1]

		if (!p0 || !p1) continue

		const q = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y }
		const r = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y }

		if (preserveEndpoints && i === 0) {
			result.push(p0)
			result.push(r)
		} else if (preserveEndpoints && i === points.length - 2) {
			result.push(q)
			result.push(p1)
		} else {
			result.push(q)
			result.push(r)
		}
	}

	return result
}

/**
 * Get distance and parametric t value for closest point on segment
 */
function pointToSegmentInfo(
	point: Coordinate,
	segStart: Coordinate,
	segEnd: Coordinate
): { distance: number; t: number } {
	const dx = segEnd.x - segStart.x
	const dy = segEnd.y - segStart.y
	const lengthSq = dx * dx + dy * dy

	if (lengthSq === 0) {
		const dist = Math.sqrt(
			(point.x - segStart.x) ** 2 + (point.y - segStart.y) ** 2
		)
		return { distance: dist, t: 0 }
	}

	let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSq
	t = Math.max(0, Math.min(1, t))

	const closestX = segStart.x + t * dx
	const closestY = segStart.y + t * dy
	const distance = Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2)

	return { distance, t }
}

/**
 * Get ordered points from a drawing by traversing segments
 */
function getOrderedPointsFromDrawing(drawing: Drawing): ControlPoint[] {
	const orderedIds: string[] = []
	const seen = new Set<string>()

	for (const segment of drawing.segments) {
		for (const pointId of segment.pointIds) {
			if (!seen.has(pointId)) {
				orderedIds.push(pointId)
				seen.add(pointId)
			}
		}
	}

	return orderedIds.map(id => drawing.points[id]).filter(Boolean) as ControlPoint[]
}

/**
 * Insert a new point into a drawing at the specified segment.
 * Splits the segment into two line segments.
 */
export function insertPointIntoDrawing(
	drawing: Drawing,
	segmentIndex: number,
	newPointPosition: Coordinate
): Drawing {
	const segment = drawing.segments[segmentIndex]
	if (!segment) return drawing

	// Create new point
	const newPointId = `point-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
	const newPoint: ControlPoint = {
		id: newPointId,
		x: newPointPosition.x,
		y: newPointPosition.y,
		type: 'corner'
	}

	// Add to points pool
	const newPoints = {
		...drawing.points,
		[newPointId]: newPoint
	}

	// Split the segment into two
	const startPointId = segment.pointIds[0]
	const endPointId = segment.pointIds[segment.pointIds.length - 1]

	if (!startPointId || !endPointId) return drawing

	const newSegment1: PathSegment = {
		type: 'line',
		pointIds: [startPointId, newPointId]
	}

	const newSegment2: PathSegment = {
		type: 'line',
		pointIds: [newPointId, endPointId]
	}

	// Replace the old segment with two new ones
	const newSegments = [
		...drawing.segments.slice(0, segmentIndex),
		newSegment1,
		newSegment2,
		...drawing.segments.slice(segmentIndex + 1)
	]

	return {
		...drawing,
		points: newPoints,
		segments: newSegments
	}
}

/**
 * Check if a drawing should be smoothed with Chaikin algorithm.
 * Smooth drawings are those with all line segments and pathMode === 'curve'.
 */
export function shouldSmoothDrawing(drawing: Drawing): boolean {
	const isAllLineSegments = drawing.segments.every(s => s.type === 'line')
	return isAllLineSegments && drawing.style.pathMode === 'curve'
}

/**
 * Collect all unique control points from a drawing in order,
 * apply a coordinate transform, and return Chaikin-smoothed points.
 * Returns null if drawing should not be smoothed.
 */
export function getSmoothedPoints<T extends Coordinate>(
	drawing: Drawing,
	transform: (point: ControlPoint) => T
): T[] | null {
	if (!shouldSmoothDrawing(drawing)) {
		return null
	}

	// Collect all unique points in order
	const seenPoints = new Set<string>()
	const allPoints: T[] = []

	for (const segment of drawing.segments) {
		for (const pointId of segment.pointIds) {
			if (!seenPoints.has(pointId)) {
				seenPoints.add(pointId)
				const point = drawing.points[pointId]
				if (point) {
					allPoints.push(transform(point))
				}
			}
		}
	}

	if (allPoints.length < 2) {
		return null
	}

	// Apply Chaikin smoothing
	return applyChaikin(allPoints, CHAIKIN_ITERATIONS)
}

