import { describe, test, expect } from 'bun:test'
import { catmullRomToBezier, smoothPathToCurves } from '../../../src/utils/curve.utils'
import type { Coordinate } from '../../../src/types/field.types'

describe('catmullRomToBezier', () => {
	test('converts 4 points to cubic bezier control points', () => {
		const p0: Coordinate = { x: 0, y: 0 }
		const p1: Coordinate = { x: 1, y: 0 }
		const p2: Coordinate = { x: 2, y: 1 }
		const p3: Coordinate = { x: 3, y: 1 }

		const result = catmullRomToBezier(p0, p1, p2, p3)

		// Result should have start, two control points, and end
		expect(result.start).toEqual(p1)
		expect(result.end).toEqual(p2)
		expect(result.cp1).toBeDefined()
		expect(result.cp2).toBeDefined()
	})
})

describe('smoothPathToCurves', () => {
	test('returns original segments for fewer than 3 points', () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 1, y: 1 },
		]
		const result = smoothPathToCurves(points)
		expect(result.segments).toHaveLength(1)
		expect(result.segments[0].type).toBe('line')
	})

	test('converts sharp corners to smooth curves', () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 5, y: 0 },
			{ x: 5, y: 5 },
			{ x: 10, y: 5 },
		]
		const result = smoothPathToCurves(points)

		// Should have cubic segments
		expect(result.segments.some(s => s.type === 'cubic')).toBe(true)
	})
})
