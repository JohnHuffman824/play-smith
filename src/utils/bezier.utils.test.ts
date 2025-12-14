/**
 * Tests for bezier and path timing utilities
 */

import { describe, test, expect } from 'bun:test'
import type { Drawing, PathSegment } from '../types/drawing.types'
import type { Coordinate } from '../types/field.types'
import {
	resolvePointIds,
	getDrawingStartPoint,
	getDrawingEndPoint,
	calculateSegmentLength,
	calculateRouteTiming,
	calculateAllRouteTimings,
	calculateTotalDuration,
} from './bezier.utils'
import { ANIMATION_DEFAULTS } from '../types/animation.types'

// Test fixture factory
function createTestDrawing(overrides?: Partial<Drawing>): Drawing {
	return {
		id: 'test-drawing',
		points: {
			p1: { id: 'p1', x: 0, y: 0, type: 'start' },
			p2: { id: 'p2', x: 10, y: 0, type: 'end' },
		},
		segments: [{ type: 'line', pointIds: ['p1', 'p2'] }],
		style: {
			color: '#000000',
			strokeWidth: 2,
			lineStyle: 'solid',
			lineEnd: 'none',
			pathMode: 'sharp',
		},
		annotations: [],
		...overrides,
	}
}

describe('resolvePointIds', () => {
	test('resolves valid point IDs to coordinates', () => {
		const drawing = createTestDrawing()
		const coords = resolvePointIds(drawing, ['p1', 'p2'])
		expect(coords).toEqual([
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
		])
	})

	test('filters out undefined points', () => {
		const drawing = createTestDrawing()
		const coords = resolvePointIds(drawing, ['p1', 'p3', 'p2'])
		expect(coords).toEqual([
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
		])
	})

	test('handles empty pointIds array', () => {
		const drawing = createTestDrawing()
		const coords = resolvePointIds(drawing, [])
		expect(coords).toEqual([])
	})
})

describe('getDrawingStartPoint', () => {
	test('returns first point of first segment', () => {
		const drawing = createTestDrawing()
		const start = getDrawingStartPoint(drawing)
		expect(start).toEqual({ x: 0, y: 0 })
	})

	test('returns null for empty segments', () => {
		const drawing = createTestDrawing({ segments: [] })
		const start = getDrawingStartPoint(drawing)
		expect(start).toBe(null)
	})

	test('returns null for missing point', () => {
		const drawing = createTestDrawing({
			segments: [{ type: 'line', pointIds: ['p99'] }],
		})
		const start = getDrawingStartPoint(drawing)
		expect(start).toBe(null)
	})
})

describe('getDrawingEndPoint', () => {
	test('returns last point of last segment', () => {
		const drawing = createTestDrawing()
		const end = getDrawingEndPoint(drawing)
		expect(end).toEqual({ x: 10, y: 0 })
	})

	test('returns null for empty segments', () => {
		const drawing = createTestDrawing({ segments: [] })
		const end = getDrawingEndPoint(drawing)
		expect(end).toBe(null)
	})

	test('returns null for missing point', () => {
		const drawing = createTestDrawing({
			segments: [{ type: 'line', pointIds: ['p99'] }],
		})
		const end = getDrawingEndPoint(drawing)
		expect(end).toBe(null)
	})
})

describe('calculateSegmentLength', () => {
	test('calculates line segment length correctly', () => {
		const segment: PathSegment = { type: 'line', pointIds: [] }
		const points: Coordinate[] = [
			{ x: 0, y: 0 },
			{ x: 3, y: 4 },
		]
		const length = calculateSegmentLength(segment, points)
		expect(length).toBe(5) // 3-4-5 triangle
	})

	test('returns 0 for insufficient points', () => {
		const segment: PathSegment = { type: 'line', pointIds: [] }
		const points: Coordinate[] = [{ x: 0, y: 0 }]
		const length = calculateSegmentLength(segment, points)
		expect(length).toBe(0)
	})
})

describe('calculateRouteTiming', () => {
	test('calculates timing for simple line drawing', () => {
		const drawing = createTestDrawing()
		const timing = calculateRouteTiming(drawing, 15)

		expect(timing.drawingId).toBe('test-drawing')
		expect(timing.playerId).toBe(null)
		expect(timing.totalLength).toBe(10)
		expect(timing.duration).toBeGreaterThan(0)
		expect(timing.startOffset).toBe(0)
	})

	test('sharp drawings use raw control points for segment timing', () => {
		const sharpDrawing: Drawing = {
			id: 'test-sharp',
			playerId: 'player1',
			points: {
				p1: { id: 'p1', x: 10, y: 10, type: 'start' },
				p2: { id: 'p2', x: 20, y: 10, type: 'intermediate' },
				p3: { id: 'p3', x: 30, y: 20, type: 'end' },
			},
			segments: [
				{ type: 'line', pointIds: ['p1', 'p2'] },
				{ type: 'line', pointIds: ['p2', 'p3'] },
			],
			style: {
				color: '#FF0000',
				strokeWidth: 0.3,
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'sharp',
			},
			annotations: [],
		}

		const routeTiming = calculateRouteTiming(sharpDrawing)

		// Should have 2 segments (one per control segment)
		expect(routeTiming.segments.length).toBe(2)

		// First segment: p1 to p2
		expect(routeTiming.segments[0].type).toBe('line')
		expect(routeTiming.segments[0].points.length).toBe(2)
		expect(routeTiming.segments[0].points[0]).toEqual({ x: 10, y: 10 })
		expect(routeTiming.segments[0].points[1]).toEqual({ x: 20, y: 10 })

		// Second segment: p2 to p3
		expect(routeTiming.segments[1].type).toBe('line')
		expect(routeTiming.segments[1].points.length).toBe(2)
		expect(routeTiming.segments[1].points[0]).toEqual({ x: 20, y: 10 })
		expect(routeTiming.segments[1].points[1]).toEqual({ x: 30, y: 20 })
	})

	test('smooth drawings apply Chaikin smoothing to segment timing', () => {
		const smoothDrawing: Drawing = {
			id: 'test-smooth',
			playerId: 'player1',
			points: {
				p1: { id: 'p1', x: 10, y: 10, type: 'start' },
				p2: { id: 'p2', x: 20, y: 10, type: 'intermediate' },
				p3: { id: 'p3', x: 30, y: 20, type: 'end' },
			},
			segments: [
				{ type: 'line', pointIds: ['p1', 'p2'] },
				{ type: 'line', pointIds: ['p2', 'p3'] },
			],
			style: {
				color: '#FF0000',
				strokeWidth: 0.3,
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'curve',
			},
			annotations: [],
		}

		const routeTiming = calculateRouteTiming(smoothDrawing)

		// With Chaikin smoothing, should create many more segments
		expect(routeTiming.segments.length).toBeGreaterThan(5)

		// All segments should be line type
		for (const segment of routeTiming.segments) {
			expect(segment.type).toBe('line')
		}

		// Each segment should have 2 points
		for (const segment of routeTiming.segments) {
			expect(segment.points.length).toBe(2)
		}

		// First and last points should be preserved
		expect(routeTiming.segments[0].points[0]).toEqual({ x: 10, y: 10 })
		const lastSegment = routeTiming.segments[routeTiming.segments.length - 1]
		expect(lastSegment.points[1]).toEqual({ x: 30, y: 20 })
	})

	test('cubic segments are not smoothed even with curve mode', () => {
		const curveDrawing: Drawing = {
			id: 'test-cubic',
			playerId: 'player1',
			points: {
				p1: { id: 'p1', x: 10, y: 10, type: 'start' },
				p2: { id: 'p2', x: 15, y: 15, type: 'control' },
				p3: { id: 'p3', x: 20, y: 15, type: 'control' },
				p4: { id: 'p4', x: 30, y: 20, type: 'end' },
			},
			segments: [{ type: 'cubic', pointIds: ['p1', 'p2', 'p3', 'p4'] }],
			style: {
				color: '#FF0000',
				strokeWidth: 0.3,
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'curve',
			},
			annotations: [],
		}

		const routeTiming = calculateRouteTiming(curveDrawing)

		// Should have 1 cubic segment (not smoothed)
		expect(routeTiming.segments.length).toBe(1)
		expect(routeTiming.segments[0].type).toBe('cubic')
		expect(routeTiming.segments[0].points.length).toBe(4)
	})

	test('sets default startOffset to 0', () => {
		const drawing = createTestDrawing()
		const timing = calculateRouteTiming(drawing)
		expect(timing.startOffset).toBe(0)
	})
})

describe('calculateAllRouteTimings', () => {
	test('separates drawings into shifts, motions, and regular', () => {
		const drawings = [
			createTestDrawing({
				id: 'regular1',
				playerId: 'player1',
			}),
			createTestDrawing({
				id: 'shift1',
				playerId: 'player2',
				preSnapMotion: { type: 'shift' },
			}),
			createTestDrawing({
				id: 'motion1',
				playerId: 'player3',
				preSnapMotion: { type: 'motion', snapPointId: 'snap1' },
			}),
		]
		const timings = calculateAllRouteTimings(drawings, 15)

		expect(timings.size).toBe(3)
		expect(timings.has('regular1')).toBe(true)
		expect(timings.has('shift1')).toBe(true)
		expect(timings.has('motion1')).toBe(true)
	})

	test('assigns sequential negative offsets to shifts', () => {
		const drawings = [
			createTestDrawing({
				id: 'shift1',
				playerId: 'player1',
				preSnapMotion: { type: 'shift' },
			}),
			createTestDrawing({
				id: 'shift2',
				playerId: 'player2',
				preSnapMotion: { type: 'shift' },
			}),
		]
		const timings = calculateAllRouteTimings(drawings, 15)

		const shift1 = timings.get('shift1')
		const shift2 = timings.get('shift2')

		expect(shift1?.startOffset).toBeLessThan(0)
		expect(shift2?.startOffset).toBeLessThan(0)
		// Second shift starts before first shift (more negative offset)
		if (shift1 && shift2) {
			expect(shift2.startOffset).toBeLessThan(shift1.startOffset)
		}
	})

	test('assigns motion offset after all shifts', () => {
		const drawings = [
			createTestDrawing({
				id: 'shift1',
				playerId: 'player1',
				preSnapMotion: { type: 'shift' },
			}),
			createTestDrawing({
				id: 'motion1',
				playerId: 'player2',
				preSnapMotion: { type: 'motion', snapPointId: 'snap1' },
			}),
		]
		const timings = calculateAllRouteTimings(drawings, 15)

		const motion = timings.get('motion1')
		expect(motion?.startOffset).toBeLessThan(0)
	})

	test('keeps regular routes at offset 0', () => {
		const drawings = [
			createTestDrawing({
				id: 'regular1',
				playerId: 'player1',
			}),
		]
		const timings = calculateAllRouteTimings(drawings, 15)

		const regular = timings.get('regular1')
		expect(regular?.startOffset).toBe(0)
	})

	test('handles empty drawings array', () => {
		const timings = calculateAllRouteTimings([])
		expect(timings.size).toBe(0)
	})
})

describe('calculateTotalDuration', () => {
	test('includes pre-snap duration from negative offsets', () => {
		const timings = new Map()
		timings.set('shift1', {
			drawingId: 'shift1',
			playerId: 'player1',
			totalLength: 10,
			duration: 1000,
			segments: [],
			startOffset: -1000, // 1 second before snap
		})

		const total = calculateTotalDuration(timings, false, false)
		expect(total).toBeGreaterThanOrEqual(1000)
	})

	test('includes snap count duration when enabled', () => {
		const timings = new Map()
		const baseTotal = calculateTotalDuration(timings, false, false)
		const withSnapCount = calculateTotalDuration(timings, true, false)

		expect(withSnapCount).toBe(baseTotal + ANIMATION_DEFAULTS.SNAP_COUNT_DURATION)
	})

	test('includes endpoint hold duration when enabled', () => {
		const timings = new Map()
		const baseTotal = calculateTotalDuration(timings, false, false)
		const withHold = calculateTotalDuration(timings, false, true)

		expect(withHold).toBe(baseTotal + ANIMATION_DEFAULTS.ENDPOINT_HOLD_DURATION)
	})

	test('handles no pre-snap movements', () => {
		const timings = new Map()
		timings.set('regular1', {
			drawingId: 'regular1',
			playerId: 'player1',
			totalLength: 10,
			duration: 1000,
			segments: [],
			startOffset: 0,
		})

		const total = calculateTotalDuration(timings, false, false)
		expect(total).toBe(1000)
	})
})
