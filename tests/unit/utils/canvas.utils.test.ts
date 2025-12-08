/**
 * Tests for canvas utility functions
 * Verifies drawing calculations and geometry operations
 */

import { describe, it, expect } from 'bun:test'
import {
	calculateAverageAngle,
	pointToLineDistance,
	isPointNearDrawing,
} from '../../../src/utils/canvas.utils'
import type { DrawingObject } from '../../../src/types/drawing.types'

describe('canvas.utils', () => {
	describe('calculateAverageAngle', () => {
		it('should return 0 for single point', () => {
			const points = [{ x: 0, y: 0 }]
			expect(calculateAverageAngle(points)).toBe(0)
		})

		it('should calculate angle for horizontal line', () => {
			const points = [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
			]
			const angle = calculateAverageAngle(points)
			expect(angle).toBe(0) // 0 radians = horizontal right
		})

		it('should calculate angle for vertical upward line', () => {
			const points = [
				{ x: 0, y: 0 },
				{ x: 0, y: 10 },
			]
			const angle = calculateAverageAngle(points)
			expect(angle).toBeCloseTo(Math.PI / 2, 5) // π/2 radians = up
		})

		it('should calculate angle for diagonal line', () => {
			const points = [
				{ x: 0, y: 0 },
				{ x: 10, y: 10 },
			]
			const angle = calculateAverageAngle(points)
			expect(angle).toBeCloseTo(Math.PI / 4, 5) // π/4 radians = 45°
		})

		it('should average multiple segments', () => {
			const points = [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },  // horizontal
				{ x: 10, y: 10 }, // vertical
			]
			const angle = calculateAverageAngle(points)
			// Should be between 0 and π/2
			expect(angle).toBeGreaterThan(0)
			expect(angle).toBeLessThan(Math.PI / 2)
		})
	})

	describe('pointToLineDistance', () => {
		it('should return 0 for point on line', () => {
			const point = { x: 5, y: 5 }
			const lineStart = { x: 0, y: 0 }
			const lineEnd = { x: 10, y: 10 }
			
			const distance = pointToLineDistance(point, lineStart, lineEnd)
			expect(distance).toBeCloseTo(0, 5)
		})

		it('should calculate perpendicular distance', () => {
			const point = { x: 5, y: 10 }
			const lineStart = { x: 0, y: 0 }
			const lineEnd = { x: 10, y: 0 }
			
			const distance = pointToLineDistance(point, lineStart, lineEnd)
			expect(distance).toBe(10) // Perpendicular distance
		})

		it('should handle point beyond line segment', () => {
			const point = { x: 15, y: 0 }
			const lineStart = { x: 0, y: 0 }
			const lineEnd = { x: 10, y: 0 }
			
			const distance = pointToLineDistance(point, lineStart, lineEnd)
			expect(distance).toBe(5) // Distance from end point
		})

		it('should handle zero-length line segment', () => {
			const point = { x: 5, y: 5 }
			const lineStart = { x: 0, y: 0 }
			const lineEnd = { x: 0, y: 0 }
			
			const distance = pointToLineDistance(point, lineStart, lineEnd)
			expect(distance).toBeCloseTo(Math.sqrt(50), 5) // √(5² + 5²)
		})
	})

	describe('isPointNearDrawing', () => {
		const createDrawing = (points: Array<{ x: number; y: number }>): DrawingObject => ({
			id: 'test-drawing',
			type: 'draw',
			points,
			color: '#000000',
			brushSize: 3,
			lineStyle: 'solid',
			lineEnd: 'none',
			eraseSize: 40,
		})

		it('should detect point on line', () => {
			const drawing = createDrawing([
				{ x: 0, y: 0 },
				{ x: 100, y: 0 },
			])
			const pixelPoints = drawing.points // Already in pixel coords for this test
			const clickPoint = { x: 50, y: 0 }
			
			const result = isPointNearDrawing(clickPoint, drawing, pixelPoints)
			expect(result).toBe(true)
		})

		it('should detect point near line within tolerance', () => {
			const drawing = createDrawing([
				{ x: 0, y: 0 },
				{ x: 100, y: 0 },
			])
			const pixelPoints = drawing.points
			const clickPoint = { x: 50, y: 10 } // 10 pixels away
			
			const result = isPointNearDrawing(clickPoint, drawing, pixelPoints)
			expect(result).toBe(true)
		})

		it('should not detect point far from line', () => {
			const drawing = createDrawing([
				{ x: 0, y: 0 },
				{ x: 100, y: 0 },
			])
			const pixelPoints = drawing.points
			const clickPoint = { x: 50, y: 100 } // 100 pixels away
			
			const result = isPointNearDrawing(clickPoint, drawing, pixelPoints)
			expect(result).toBe(false)
		})

		it('should handle multi-segment drawings', () => {
			const drawing = createDrawing([
				{ x: 0, y: 0 },
				{ x: 50, y: 0 },
				{ x: 50, y: 50 },
			])
			const pixelPoints = drawing.points
			
			// Point near second segment
			const clickPoint = { x: 50, y: 25 }
			const result = isPointNearDrawing(clickPoint, drawing, pixelPoints)
			expect(result).toBe(true)
		})

		it('should return false for empty drawing', () => {
			const drawing = createDrawing([])
			const pixelPoints = []
			const clickPoint = { x: 50, y: 50 }
			
			const result = isPointNearDrawing(clickPoint, drawing, pixelPoints)
			expect(result).toBe(false)
		})
	})
})
