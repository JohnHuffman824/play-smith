import type { Coordinate } from '../types/field.types'
import type {
	ControlPoint,
	Drawing,
	PathSegment,
} from '../types/drawing.types'
import { pointToLineDistance } from './canvas.utils'

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
		style: sourceDrawing.style,
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

function reindexSegments(segments: PathSegment[]): PathSegment[] {
	let counter = 0
	return segments.map((segment) => ({
		...segment,
		points: segment.points.map((point) => {
			const nextId = `p-${counter++}`
			return { ...point, id: nextId }
		}),
	}))
}

function reverseSegments(segments: PathSegment[]): PathSegment[] {
	const reversedSegments = [...segments].reverse().map((segment) => ({
		...segment,
		pointIds: [...segment.pointIds].reverse(),
	}))
	return reversedSegments
}

function ensurePointIsStart(
	drawing: Drawing,
	pointId: string,
): PathSegment[] {
	const isStart = isStartPoint(drawing, pointId)
	const isEnd = isEndPoint(drawing, pointId)
	if (isStart) return drawing.segments
	if (isEnd) return reverseSegments(drawing.segments)
	return drawing.segments
}

function ensurePointIsEnd(drawing: Drawing, pointId: string): PathSegment[] {
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

function cloneSegments(segments: PathSegment[]): PathSegment[] {
	return segments.map((segment) => ({
		...segment,
		points: segment.points.map((point) => ({ ...point })),
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

