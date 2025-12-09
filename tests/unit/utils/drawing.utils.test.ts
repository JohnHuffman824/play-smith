import { describe, it, expect } from 'bun:test'
import {
	findSnapTarget,
	mergeDrawings,
	isPointNearControlPoint,
	findPlayerSnapTarget,
	calculateUnlinkPosition,
	getPoint,
	getSegmentPoints,
	getDrawingStartPoint,
	getDrawingEndPoint,
} from '../../../src/utils/drawing.utils'
import type { Drawing, PathSegment, ControlPoint } from '../../../src/types/drawing.types'
import { createCoordinateSystem } from '../../../src/utils/coordinates'

/**
 * Create a line segment with NEW shared point pool architecture.
 * Returns segment (with pointIds) and the two points it references.
 */
function lineSegmentWithPoints(
	idStart: string,
	start: { x: number; y: number },
	idEnd: string,
	end: { x: number; y: number },
): { segment: PathSegment; points: Record<string, ControlPoint> } {
	const points: Record<string, ControlPoint> = {
		[idStart]: { id: idStart, x: start.x, y: start.y, type: 'corner' },
		[idEnd]: { id: idEnd, x: end.x, y: end.y, type: 'corner' },
	}
	const segment: PathSegment = {
		type: 'line',
		pointIds: [idStart, idEnd],
	}
	return { segment, points }
}

/**
 * Create a Drawing with NEW shared point pool architecture.
 * Segments should be created with lineSegmentWithPoints.
 */
function makeDrawing(
	id: string,
	segmentsData: Array<{ segment: PathSegment; points: Record<string, ControlPoint> }>,
): Drawing {
	// Merge all point pools from segments
	const points: Record<string, ControlPoint> = {}
	const segments: PathSegment[] = []

	for (const data of segmentsData) {
		Object.assign(points, data.points)
		segments.push(data.segment)
	}

	return {
		id,
		points,
		segments,
		style: {
			color: '#000',
			strokeWidth: 1,
			lineStyle: 'solid',
			lineEnd: 'none',
		},
		annotations: [],
	}
}

/**
 * Extract path coordinates from a drawing for verification.
 * Works with NEW shared point pool architecture.
 */
function pathCoords(drawing: Drawing): Array<[number, number]> {
	if (drawing.segments.length == 0) return []
	const coords: Array<[number, number]> = []

	// Get first point from first segment
	const firstSegment = drawing.segments[0]!
	const firstPointId = firstSegment.pointIds[0]
	if (firstPointId) {
		const firstPoint = drawing.points[firstPointId]
		if (firstPoint) {
			coords.push([firstPoint.x, firstPoint.y])
		}
	}

	// Get subsequent points (skip first of each segment to avoid duplicates)
	for (const segment of drawing.segments) {
		segment.pointIds.slice(1).forEach((pointId) => {
			const point = drawing.points[pointId]
			if (point) {
				coords.push([point.x, point.y])
			}
		})
	}
	return coords
}

describe('drawing.utils', () => {
	describe('isPointNearControlPoint', () => {
		it('detects proximity near a control point in pixels', () => {
			const drawing = makeDrawing('d', [
				lineSegmentWithPoints('p0', { x: 20, y: 20 }, 'p1', { x: 30, y: 30 }),
			])
			const coordSystem = createCoordinateSystem(160, 160) // 1 px per foot
			const nearPixel = { x: 20, y: 140 } // feet (20,20) => pixels (20,140)
			const farPixel = { x: 100, y: 100 }

			expect(isPointNearControlPoint(drawing, coordSystem, nearPixel, 8)).toBe(
				true,
			)
			expect(isPointNearControlPoint(drawing, coordSystem, farPixel, 8)).toBe(
				false,
			)
		})
	})

	describe('findSnapTarget', () => {
		it('ignores interior points and snaps only to endpoints', () => {
			// Create a drawing with 3 points: start (s), middle (m), end (e)
			// Two segments share the middle point
			const drawing: Drawing = {
				id: 'd1',
				points: {
					's': { id: 's', x: 0, y: 0, type: 'corner' },
					'm': { id: 'm', x: 5, y: 0, type: 'corner' },
					'e': { id: 'e', x: 10, y: 0, type: 'corner' },
				},
				segments: [
					{ type: 'line', pointIds: ['s', 'm'] },
					{ type: 'line', pointIds: ['m', 'e'] },
				],
				style: { color: '#000', strokeWidth: 1, lineStyle: 'solid', lineEnd: 'none' },
				annotations: [],
			}

			const nearMiddle = findSnapTarget(
				{ x: 5, y: 0 },
				[drawing],
				'exclude',
				1,
			)
			expect(nearMiddle).toBeNull()

			const nearEnd = findSnapTarget(
				{ x: 10, y: 0 },
				[drawing],
				'exclude',
				1,
			)
			expect(nearEnd?.pointId).toBe('e')
		})
	})

	describe('mergeDrawings', () => {
		it('aligns selected endpoints by reversing when needed', () => {
			const source = makeDrawing('s', [
				lineSegmentWithPoints('s0', { x: 0, y: 0 }, 's1', { x: 10, y: 0 }),
			])
			const target = makeDrawing('t', [
				lineSegmentWithPoints('t0', { x: 20, y: 0 }, 't1', { x: 30, y: 0 }),
			])

			const merged = mergeDrawings(source, target, 's1', 't1')
		const coords = pathCoords(merged)

		expect(coords).toEqual([
			[0, 0],
			[30, 0],
			[20, 0],
		])
		})

		it('keeps orientation when source end meets target start', () => {
			const source = makeDrawing('s', [
				lineSegmentWithPoints('s0', { x: 0, y: 0 }, 's1', { x: 10, y: 0 }),
			])
			const target = makeDrawing('t', [
				lineSegmentWithPoints('t0', { x: 20, y: 0 }, 't1', { x: 30, y: 0 }),
			])

			const merged = mergeDrawings(source, target, 's1', 't0')
		const coords = pathCoords(merged)

		expect(coords).toEqual([
			[0, 0],
			[20, 0],
			[30, 0],
		])
		})

	it('fuses nodes with correct segment structure for rendering', () => {
		// Scenario: Drawing 1 has (20,20)-(30,30), Drawing 2 has (10,30)-(20,30)
		// User drags (20,30) onto (20,20)
		// Expected: path goes [10,30] -> [20,20] -> [30,30]
		// With shared point pool: junction point 'a' replaces 'd' at position (20,20)

		const drawing1 = makeDrawing('d1', [
			lineSegmentWithPoints('a', { x: 20, y: 20 }, 'b', { x: 30, y: 30 }),
		])
		const drawing2 = makeDrawing('d2', [
			lineSegmentWithPoints('c', { x: 10, y: 30 }, 'd', { x: 20, y: 30 }),
		])

		// User drags drawing2's end (20,30) onto drawing1's start (20,20)
		const merged = mergeDrawings(drawing2, drawing1, 'd', 'a')

		// Verify segment structure: each line segment should have exactly 2 point IDs
		for (const segment of merged.segments) {
			if (segment.type == 'line') {
				expect(segment.pointIds.length).toBe(2)
			}
		}

		// Verify path goes through fused node
		const coords = pathCoords(merged)
		expect(coords).toEqual([
			[10, 30],
			[20, 20],
			[30, 30],
		])

		// Verify moved node is gone
		expect(coords.some(([x, y]) => x == 20 && y == 30)).toBe(false)
	})

	it('keeps the stationary node position and removes the moved node', () => {
		// Drag source end (20,20) onto target start (10,10)
		const source = makeDrawing('s', [
			lineSegmentWithPoints('s0', { x: 0, y: 0 }, 's1', { x: 20, y: 20 }),
		])
		const target = makeDrawing('t', [
			lineSegmentWithPoints('t0', { x: 10, y: 10 }, 't1', { x: 30, y: 30 }),
		])

		const merged = mergeDrawings(source, target, 's1', 't0')

		// Verify path coordinates (rendered path)
		const coords = pathCoords(merged)
		expect(coords).toEqual([
			[0, 0],
			[10, 10],
			[30, 30],
		])

		// Verify moved node coordinate is gone from path
		expect(coords.some(([x, y]) => x == 20 && y == 20)).toBe(false)

		// Verify each segment has exactly 2 point IDs
		for (const segment of merged.segments) {
			if (segment.type == 'line') {
				expect(segment.pointIds.length).toBe(2)
			}
		}
	})
	})

	describe('findPlayerSnapTarget', () => {
		const mockPlayers = [
			{ id: 'player-1', x: 10, y: 10, label: 'A', color: '#000' },
			{ id: 'player-2', x: 50, y: 50, label: 'B', color: '#000' },
		]

		it('returns null when no players are within threshold', () => {
			const position = { x: 100, y: 100 }
			const result = findPlayerSnapTarget(position, mockPlayers, 5)
			expect(result).toBeNull()
		})

		it('returns the closest player within threshold', () => {
			const position = { x: 11, y: 11 }
			const result = findPlayerSnapTarget(position, mockPlayers, 5)
			expect(result).not.toBeNull()
			expect(result?.playerId).toBe('player-1')
		})

		it('returns the player center point', () => {
			const position = { x: 50, y: 51 }
			const result = findPlayerSnapTarget(position, mockPlayers, 5)
			expect(result?.point.x).toBe(50)
			expect(result?.point.y).toBe(50)
		})
	})

	describe('calculateUnlinkPosition', () => {
		it('returns position along path direction from player', () => {
			const playerPos = { x: 10, y: 10 }
			const secondToLastPoint = { x: 10, y: 20 }
			const distance = 5
			const result = calculateUnlinkPosition(
				playerPos,
				secondToLastPoint,
				distance,
			)
			expect(result.x).toBeCloseTo(10)
			expect(result.y).toBeCloseTo(15)
		})

		it('handles diagonal direction', () => {
			const playerPos = { x: 0, y: 0 }
			const secondToLastPoint = { x: 3, y: 4 }
			const distance = 5
			const result = calculateUnlinkPosition(
				playerPos,
				secondToLastPoint,
				distance,
			)
			expect(result.x).toBeCloseTo(3)
			expect(result.y).toBeCloseTo(4)
		})

		it('falls back to below player when no direction', () => {
			const playerPos = { x: 50, y: 50 }
			const secondToLastPoint = { x: 50, y: 50 }
			const distance = 5
			const result = calculateUnlinkPosition(
				playerPos,
				secondToLastPoint,
				distance,
			)
			expect(result.x).toBe(50)
			expect(result.y).toBe(45)
		})
	})

	// NEW HELPER FUNCTIONS FOR SHARED POINT REFERENCES ARCHITECTURE
	describe('getPoint', () => {
		it('returns the point from the shared pool by ID', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: {
					'p-0': { id: 'p-0', x: 10, y: 20, type: 'corner' },
					'p-1': { id: 'p-1', x: 30, y: 40, type: 'corner' },
				},
				segments: [{ type: 'line', pointIds: ['p-0', 'p-1'] }],
				style: { color: '#000', strokeWidth: 1, lineStyle: 'solid', lineEnd: 'none' },
				annotations: [],
			}

			const point = getPoint(drawing, 'p-1')
			expect(point).toBeDefined()
			expect(point?.x).toBe(30)
			expect(point?.y).toBe(40)
		})

		it('returns undefined for non-existent point ID', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: {
					'p-0': { id: 'p-0', x: 10, y: 20, type: 'corner' },
				},
				segments: [{ type: 'line', pointIds: ['p-0'] }],
				style: { color: '#000', strokeWidth: 1, lineStyle: 'solid', lineEnd: 'none' },
				annotations: [],
			}

			const point = getPoint(drawing, 'nonexistent')
			expect(point).toBeUndefined()
		})
	})

	describe('getSegmentPoints', () => {
		it('resolves pointIds to actual ControlPoint objects', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: {
					'p-0': { id: 'p-0', x: 10, y: 20, type: 'corner' },
					'p-1': { id: 'p-1', x: 30, y: 40, type: 'corner' },
					'p-2': { id: 'p-2', x: 50, y: 60, type: 'corner' },
				},
				segments: [{ type: 'line', pointIds: ['p-0', 'p-1', 'p-2'] }],
				style: { color: '#000', strokeWidth: 1, lineStyle: 'solid', lineEnd: 'none' },
				annotations: [],
			}

			const segment = drawing.segments[0]!
			const points = getSegmentPoints(drawing, segment)

			expect(points.length).toBe(3)
			expect(points[0]?.x).toBe(10)
			expect(points[1]?.x).toBe(30)
			expect(points[2]?.x).toBe(50)
		})

		it('filters out undefined points for missing IDs', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: {
					'p-0': { id: 'p-0', x: 10, y: 20, type: 'corner' },
					'p-2': { id: 'p-2', x: 50, y: 60, type: 'corner' },
				},
				segments: [{ type: 'line', pointIds: ['p-0', 'p-1', 'p-2'] }],
				style: { color: '#000', strokeWidth: 1, lineStyle: 'solid', lineEnd: 'none' },
				annotations: [],
			}

			const segment = drawing.segments[0]!
			const points = getSegmentPoints(drawing, segment)

			expect(points.length).toBe(2) // Only p-0 and p-2 exist
			expect(points[0]?.id).toBe('p-0')
			expect(points[1]?.id).toBe('p-2')
		})
	})

	describe('getDrawingStartPoint', () => {
		it('returns the first point of the first segment', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: {
					'p-0': { id: 'p-0', x: 10, y: 20, type: 'start' },
					'p-1': { id: 'p-1', x: 30, y: 40, type: 'corner' },
					'p-2': { id: 'p-2', x: 50, y: 60, type: 'end' },
				},
				segments: [
					{ type: 'line', pointIds: ['p-0', 'p-1'] },
					{ type: 'line', pointIds: ['p-1', 'p-2'] },
				],
				style: { color: '#000', strokeWidth: 1, lineStyle: 'solid', lineEnd: 'none' },
				annotations: [],
			}

			const startPoint = getDrawingStartPoint(drawing)
			expect(startPoint).toBeDefined()
			expect(startPoint?.id).toBe('p-0')
			expect(startPoint?.x).toBe(10)
			expect(startPoint?.type).toBe('start')
		})

		it('returns null for drawing with no segments', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: {},
				segments: [],
				style: { color: '#000', strokeWidth: 1, lineStyle: 'solid', lineEnd: 'none' },
				annotations: [],
			}

			const startPoint = getDrawingStartPoint(drawing)
			expect(startPoint).toBeNull()
		})

		it('returns null for segment with no pointIds', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: { 'p-0': { id: 'p-0', x: 10, y: 20, type: 'corner' } },
				segments: [{ type: 'line', pointIds: [] }],
				style: { color: '#000', strokeWidth: 1, lineStyle: 'solid', lineEnd: 'none' },
				annotations: [],
			}

			const startPoint = getDrawingStartPoint(drawing)
			expect(startPoint).toBeNull()
		})
	})

	describe('getDrawingEndPoint', () => {
		it('returns the last point of the last segment', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: {
					'p-0': { id: 'p-0', x: 10, y: 20, type: 'start' },
					'p-1': { id: 'p-1', x: 30, y: 40, type: 'corner' },
					'p-2': { id: 'p-2', x: 50, y: 60, type: 'end' },
				},
				segments: [
					{ type: 'line', pointIds: ['p-0', 'p-1'] },
					{ type: 'line', pointIds: ['p-1', 'p-2'] },
				],
				style: { color: '#000', strokeWidth: 1, lineStyle: 'solid', lineEnd: 'none' },
				annotations: [],
			}

			const endPoint = getDrawingEndPoint(drawing)
			expect(endPoint).toBeDefined()
			expect(endPoint?.id).toBe('p-2')
			expect(endPoint?.x).toBe(50)
			expect(endPoint?.type).toBe('end')
		})

		it('returns null for drawing with no segments', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: {},
				segments: [],
				style: { color: '#000', strokeWidth: 1, lineStyle: 'solid', lineEnd: 'none' },
				annotations: [],
			}

			const endPoint = getDrawingEndPoint(drawing)
			expect(endPoint).toBeNull()
		})

		it('returns null for segment with no pointIds', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: { 'p-0': { id: 'p-0', x: 10, y: 20, type: 'corner' } },
				segments: [{ type: 'line', pointIds: [] }],
				style: { color: '#000', strokeWidth: 1, lineStyle: 'solid', lineEnd: 'none' },
				annotations: [],
			}

			const endPoint = getDrawingEndPoint(drawing)
			expect(endPoint).toBeNull()
		})
	})
})
