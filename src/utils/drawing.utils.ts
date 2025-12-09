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
	const sourceSegments = cloneSegments(
		ensurePointIsEnd(sourceDrawing, sourcePointId),
	)
	const targetSegments = cloneSegments(
		ensurePointIsStart(targetDrawing, targetPointId),
	)

	const sourceLastSegment = sourceSegments[sourceSegments.length - 1]
	const targetFirstSegment = targetSegments[0]
	const targetFirstPoint = targetFirstSegment?.points[0]

	let mergedSegments: PathSegment[]

	if (
		sourceLastSegment &&
		targetFirstSegment &&
		targetFirstSegment.points.length > 0
	) {
		const fusedPoint = { ...targetFirstPoint! }
		const combinedPoints = [
			...sourceLastSegment.points.slice(
				0,
				sourceLastSegment.points.length - 1,
			),
			fusedPoint,
			...targetFirstSegment.points.slice(1),
		]

		// Create separate 2-point line segments so PathRenderer renders correctly
		const bridgeSegments: PathSegment[] = []
		for (let i = 1; i < combinedPoints.length; i++) {
			bridgeSegments.push({
				type: 'line',
				points: [combinedPoints[i - 1]!, combinedPoints[i]!],
			})
		}

		mergedSegments = [
			...sourceSegments.slice(0, sourceSegments.length - 1),
			...bridgeSegments,
			...targetSegments.slice(1),
		]
	} else {
		mergedSegments = [...sourceSegments, ...targetSegments]
	}

	const merged = reindexSegments(mergedSegments)

	return {
		id: `drawing-${Date.now()}`,
		segments: merged,
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
		for (let i = 0; i < segment.points.length - 1; i++) {
			const p1Feet = segment.points[i]!
			const p2Feet = segment.points[i + 1]!
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
	for (const segment of drawing.segments) {
		for (const point of segment.points) {
			const pixel = coordSystem.feetToPixels(point.x, point.y)
			const dx = pixelPoint.x - pixel.x
			const dy = pixelPoint.y - pixel.y
			const dist = Math.sqrt(dx * dx + dy * dy)
			if (dist <= paddingPx) return true
		}
	}
	return false
}

function isEndPoint(drawing: Drawing, pointId: string): boolean {
	const lastSegment = drawing.segments[drawing.segments.length - 1]
	if (!lastSegment) return false
	const lastPoint = lastSegment.points[lastSegment.points.length - 1]
	return lastPoint?.id == pointId
}

function isStartPoint(drawing: Drawing, pointId: string): boolean {
	const firstSegment = drawing.segments[0]
	if (!firstSegment) return false
	const firstPoint = firstSegment.points[0]
	return firstPoint?.id == pointId
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
		points: [...segment.points].reverse(),
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
	return firstSegment.points[0] ?? null
}

function getEndPoint(drawing: Drawing): ControlPoint | null {
	const lastSegment = drawing.segments[drawing.segments.length - 1]
	if (!lastSegment) return null
	return lastSegment.points[lastSegment.points.length - 1] ?? null
}

function cloneSegments(segments: PathSegment[]): PathSegment[] {
	return segments.map((segment) => ({
		...segment,
		points: segment.points.map((point) => ({ ...point })),
	}))
}

