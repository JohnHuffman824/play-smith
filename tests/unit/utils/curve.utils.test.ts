import { describe, test, expect } from 'bun:test'
import { catmullRomToBezier } from '../../../src/utils/curve.utils'
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
