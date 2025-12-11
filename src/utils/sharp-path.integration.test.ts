import { describe, test, expect } from 'bun:test'
import { processSharpPath } from './sharp-path.utils'
import type { Coordinate } from '../types/field.types'

describe('processSharpPath - Line End Integration', () => {
	test('sharp path drawing can calculate line end direction', () => {
		// Simulate a user drawing a multi-segment path
		const coords: Coordinate[] = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
			{ x: 20, y: 10 },
			{ x: 20, y: 20 },
		]

		const { points, segments } = processSharpPath(coords)

		// Get the last segment (this is what PathRenderer uses for line end)
		const lastSegment = segments[segments.length - 1]!

		// Get the points for the last segment
		const segmentPoints = lastSegment.pointIds
			.map(id => points[id])
			.filter(p => p !== undefined)

		// Must have at least 2 points to calculate end direction angle
		expect(segmentPoints.length).toBeGreaterThanOrEqual(2)

		// Verify we can calculate the angle (this is what was failing before)
		const lastPt = segmentPoints[segmentPoints.length - 1]!
		const prevPt = segmentPoints[segmentPoints.length - 2]!

		const angle = Math.atan2(lastPt.y - prevPt.y, lastPt.x - prevPt.x)

		// Angle should be a valid number (not NaN)
		expect(angle).not.toBe(NaN)
		expect(typeof angle).toBe('number')
	})

	test('sharp path with single segment works', () => {
		const coords: Coordinate[] = [
			{ x: 0, y: 0 },
			{ x: 10, y: 10 },
		]

		const { points, segments } = processSharpPath(coords)

		expect(segments.length).toBe(1)

		const segment = segments[0]!
		const segmentPoints = segment.pointIds
			.map(id => points[id])
			.filter(p => p !== undefined)

		expect(segmentPoints.length).toBe(2)
	})
})
