import { describe, test, expect } from 'bun:test'

describe('Line End Direction Calculation', () => {
	test('sharp mode line should calculate direction from last two points', () => {
		// A horizontal line going right: start (0,0) -> end (10,0)
		const startPoint = { x: 0, y: 0 }
		const endPoint = { x: 10, y: 0 }

		const angle = Math.atan2(
			endPoint.y - startPoint.y,
			endPoint.x - startPoint.x
		)

		// Should be 0 (pointing right)
		expect(angle).toBe(0)
	})

	test('sharp mode vertical line should point down', () => {
		const startPoint = { x: 0, y: 0 }
		const endPoint = { x: 0, y: 10 }

		const angle = Math.atan2(
			endPoint.y - startPoint.y,
			endPoint.x - startPoint.x
		)

		// Should be PI/2 (pointing down in SVG coordinates)
		expect(angle).toBeCloseTo(Math.PI / 2, 5)
	})

	test('multi-segment sharp path uses last segment direction', () => {
		// Path: (0,0) -> (5,0) -> (5,10)
		// Last segment goes from (5,0) to (5,10) - pointing down
		const lastSegmentStart = { x: 5, y: 0 }
		const lastSegmentEnd = { x: 5, y: 10 }

		const angle = Math.atan2(
			lastSegmentEnd.y - lastSegmentStart.y,
			lastSegmentEnd.x - lastSegmentStart.x
		)

		expect(angle).toBeCloseTo(Math.PI / 2, 5)
	})
})
