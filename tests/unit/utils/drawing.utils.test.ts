import { describe, it, expect } from 'bun:test'
import {
	findSnapTarget,
	mergeDrawings,
	isPointNearControlPoint,
} from '../../../src/utils/drawing.utils'
import type { Drawing, PathSegment } from '../../../src/types/drawing.types'
import { createCoordinateSystem } from '../../../src/utils/coordinates'

function lineSegment(
	idStart: string,
	start: { x: number; y: number },
	idEnd: string,
	end: { x: number; y: number },
): PathSegment {
	return {
		type: 'line',
		points: [
			{ id: idStart, x: start.x, y: start.y, type: 'corner' },
			{ id: idEnd, x: end.x, y: end.y, type: 'corner' },
		],
	}
}

function makeDrawing(id: string, segments: PathSegment[]): Drawing {
	return {
		id,
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

function pathCoords(segments: PathSegment[]): Array<[number, number]> {
	if (segments.length == 0) return []
	const coords: Array<[number, number]> = []
	coords.push([segments[0]!.points[0]!.x, segments[0]!.points[0]!.y])
	for (const segment of segments) {
		segment.points.slice(1).forEach((pt) => {
			coords.push([pt.x, pt.y])
		})
	}
	return coords
}

describe('drawing.utils', () => {
	describe('isPointNearControlPoint', () => {
		it('detects proximity near a control point in pixels', () => {
			const drawing = makeDrawing('d', [
				lineSegment('p0', { x: 20, y: 20 }, 'p1', { x: 30, y: 30 }),
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
			const sharedMid = { id: 'm', x: 5, y: 0, type: 'corner' as const }
			const drawing = makeDrawing('d1', [
				{
					type: 'line',
					points: [
						{ id: 's', x: 0, y: 0, type: 'corner' },
						sharedMid,
					],
				},
				{
					type: 'line',
					points: [
						sharedMid,
						{ id: 'e', x: 10, y: 0, type: 'corner' },
					],
				},
			])

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
				lineSegment('s0', { x: 0, y: 0 }, 's1', { x: 10, y: 0 }),
			])
			const target = makeDrawing('t', [
				lineSegment('t0', { x: 20, y: 0 }, 't1', { x: 30, y: 0 }),
			])

			const merged = mergeDrawings(source, target, 's1', 't1')
		const coords = pathCoords(merged.segments)

		expect(coords).toEqual([
			[0, 0],
			[30, 0],
			[20, 0],
		])
		})

		it('keeps orientation when source end meets target start', () => {
			const source = makeDrawing('s', [
				lineSegment('s0', { x: 0, y: 0 }, 's1', { x: 10, y: 0 }),
			])
			const target = makeDrawing('t', [
				lineSegment('t0', { x: 20, y: 0 }, 't1', { x: 30, y: 0 }),
			])

			const merged = mergeDrawings(source, target, 's1', 't0')
		const coords = pathCoords(merged.segments)

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
		// Bug: PathRenderer skips middle points in multi-point segments
		// Fix: merge must create separate 2-point segments, not one multi-point segment
		
		const drawing1 = makeDrawing('d1', [
			lineSegment('a', { x: 20, y: 20 }, 'b', { x: 30, y: 30 }),
		])
		const drawing2 = makeDrawing('d2', [
			lineSegment('c', { x: 10, y: 30 }, 'd', { x: 20, y: 30 }),
		])

		// User drags drawing2's end (20,30) onto drawing1's start (20,20)
		const merged = mergeDrawings(drawing2, drawing1, 'd', 'a')
		
		// Verify segment structure: each line segment should have exactly 2 points
		for (const segment of merged.segments) {
			if (segment.type === 'line') {
				expect(segment.points.length).toBe(2)
			}
		}
		
		// Verify path goes through fused node
		const coords = pathCoords(merged.segments)
		expect(coords).toEqual([
			[10, 30],
			[20, 20],
			[30, 30],
		])
		
		// Verify moved node is gone
		expect(coords.some(([x, y]) => x === 20 && y === 30)).toBe(false)
	})

	it('keeps the stationary node position and removes the moved node', () => {
		// Drag source end (20,20) onto target start (10,10)
		const source = makeDrawing('s', [
			lineSegment('s0', { x: 0, y: 0 }, 's1', { x: 20, y: 20 }),
		])
		const target = makeDrawing('t', [
			lineSegment('t0', { x: 10, y: 10 }, 't1', { x: 30, y: 30 }),
		])

		const merged = mergeDrawings(source, target, 's1', 't0')
		
		// Verify path coordinates (rendered path)
		const coords = pathCoords(merged.segments)
		expect(coords).toEqual([
			[0, 0],
			[10, 10],
			[30, 30],
		])
		
		// Verify moved node coordinate is gone from path
		expect(coords.some(([x, y]) => x === 20 && y === 20)).toBe(false)
		
		// Verify each segment has exactly 2 points
		for (const segment of merged.segments) {
			if (segment.type === 'line') {
				expect(segment.points.length).toBe(2)
			}
		}
	})
	})
})
