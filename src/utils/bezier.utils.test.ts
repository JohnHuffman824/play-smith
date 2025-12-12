import { describe, test, expect } from 'bun:test'
import { calculateRouteTiming } from './bezier.utils'
import type { Drawing } from '../types/drawing.types'

describe('bezier.utils - Smooth Path Timing', () => {
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
				pathMode: 'sharp', // Sharp mode
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
				pathMode: 'curve', // Smooth mode
			},
			annotations: [],
		}

		const routeTiming = calculateRouteTiming(smoothDrawing)

		// With Chaikin smoothing (3 iterations), 3 control points should become many smoothed points
		// This creates many more segments (one between each consecutive smoothed point)
		expect(routeTiming.segments.length).toBeGreaterThan(5)

		// All segments should be line type (Chaikin produces line segments)
		for (const segment of routeTiming.segments) {
			expect(segment.type).toBe('line')
		}

		// Each segment should have 2 points (start and end of line)
		for (const segment of routeTiming.segments) {
			expect(segment.points.length).toBe(2)
		}

		// The first point should be preserved (Chaikin preserves endpoints)
		expect(routeTiming.segments[0].points[0]).toEqual({ x: 10, y: 10 })

		// The last point of the last segment should be preserved
		const lastSegment = routeTiming.segments[routeTiming.segments.length - 1]
		expect(lastSegment.points[1]).toEqual({ x: 30, y: 20 })
	})

	test('cubic and quadratic segments are not smoothed even with curve mode', () => {
		const curveDrawing: Drawing = {
			id: 'test-cubic',
			playerId: 'player1',
			points: {
				p1: { id: 'p1', x: 10, y: 10, type: 'start' },
				p2: { id: 'p2', x: 15, y: 15, type: 'control' },
				p3: { id: 'p3', x: 20, y: 15, type: 'control' },
				p4: { id: 'p4', x: 30, y: 20, type: 'end' },
			},
			segments: [
				{ type: 'cubic', pointIds: ['p1', 'p2', 'p3', 'p4'] },
			],
			style: {
				color: '#FF0000',
				strokeWidth: 0.3,
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'curve', // Even with curve mode, cubic segments stay cubic
			},
			annotations: [],
		}

		const routeTiming = calculateRouteTiming(curveDrawing)

		// Should have 1 cubic segment (not smoothed into many line segments)
		expect(routeTiming.segments.length).toBe(1)
		expect(routeTiming.segments[0].type).toBe('cubic')
		expect(routeTiming.segments[0].points.length).toBe(4)
	})

	test('smooth drawings without player ID are not processed', () => {
		const smoothDrawing: Drawing = {
			id: 'test-no-player',
			// No playerId!
			points: {
				p1: { id: 'p1', x: 10, y: 10, type: 'start' },
				p2: { id: 'p2', x: 20, y: 10, type: 'end' },
			},
			segments: [
				{ type: 'line', pointIds: ['p1', 'p2'] },
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

		// calculateRouteTiming still works, just won't be used in animation
		const routeTiming = calculateRouteTiming(smoothDrawing)

		// Should still apply smoothing if called directly
		expect(routeTiming.segments.length).toBeGreaterThan(1)
	})
})
