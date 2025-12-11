import { describe, test, expect } from 'bun:test'
import { processSharpPath } from './sharp-path.utils'
import type { Coordinate } from '../types/field.types'

describe('processSharpPath', () => {
	test('all segment point references exist in points collection', () => {
		// Create a simple path with 3 segments (4 points)
		const coords: Coordinate[] = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
			{ x: 20, y: 10 },
		]

		const result = processSharpPath(coords)

		// Verify all segments reference existing points
		for (const segment of result.segments) {
			for (const pointId of segment.pointIds) {
				expect(result.points[pointId]).toBeDefined()
				expect(result.points[pointId]?.id).toBe(pointId)
			}
		}
	})

	test('last segment has at least 2 points for line end calculation', () => {
		// Create a path with multiple segments
		const coords: Coordinate[] = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
			{ x: 20, y: 10 },
		]

		const result = processSharpPath(coords)

		// Get the last segment
		const lastSegment = result.segments[result.segments.length - 1]
		expect(lastSegment).toBeDefined()

		// Get points for the last segment
		const lastSegmentPoints = lastSegment!.pointIds
			.map((id) => result.points[id])
			.filter((point) => point !== undefined)

		// Must have at least 2 points to calculate line end angle
		expect(lastSegmentPoints.length).toBeGreaterThanOrEqual(2)
	})

	test('segments share endpoints - end of one segment is start of next', () => {
		const coords: Coordinate[] = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
			{ x: 20, y: 10 },
		]

		const result = processSharpPath(coords)

		// For each consecutive pair of segments, verify they share a point
		for (let i = 0; i < result.segments.length - 1; i++) {
			const currentSegment = result.segments[i]
			const nextSegment = result.segments[i + 1]

			// End of current segment should be start of next segment
			const currentEnd = currentSegment!.pointIds[currentSegment!.pointIds.length - 1]
			const nextStart = nextSegment!.pointIds[0]

			expect(currentEnd).toBe(nextStart)
		}
	})
})
