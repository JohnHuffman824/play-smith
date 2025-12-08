/**
 * Tests for FieldCoordinateSystem
 * Verifies coordinate conversion between feet and pixels
 */

import { describe, it, expect } from 'bun:test'
import { FieldCoordinateSystem, createCoordinateSystem } from '../../../src/utils/coordinates'
import { FIELD_WIDTH_FEET } from '../../../src/constants/field.constants'

describe('FieldCoordinateSystem', () => {
	describe('constructor and initialization', () => {
		it('should create instance with given dimensions', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			expect(coords.getDimensions()).toEqual({ width: 800, height: 600 })
		})

		it('should calculate correct scale factor', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const expectedScale = 800 / FIELD_WIDTH_FEET // 800 / 160 = 5
			expect(coords.scale).toBe(expectedScale)
		})
	})

	describe('feetToPixels conversion', () => {
		it('should convert feet origin (0,0) to bottom-left pixels', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const result = coords.feetToPixels(0, 0)
			expect(result).toEqual({ x: 0, y: 600 })
		})

		it('should convert center field position correctly', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			// Center X = 80 feet, Y = 30 feet
			const result = coords.feetToPixels(80, 30)
			expect(result.x).toBe(400) // 80 * 5 = 400
			expect(result.y).toBe(450) // 600 - (30 * 5) = 450
		})

		it('should handle Y-axis flip correctly', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			// Y=0 in feet is at bottom (y=600 in pixels)
			// Y=120 in feet should be at top (y=0 in pixels)
			const bottomResult = coords.feetToPixels(0, 0)
			const topResult = coords.feetToPixels(0, 120)
			expect(bottomResult.y).toBeGreaterThan(topResult.y)
		})

		it('should scale proportionally', () => {
			const coords = new FieldCoordinateSystem(1600, 1200)
			// With 2x container, scale should be 10
			const result = coords.feetToPixels(10, 10)
			expect(result.x).toBe(100) // 10 * 10
			expect(result.y).toBe(1100) // 1200 - (10 * 10)
		})
	})

	describe('pixelsToFeet conversion', () => {
		it('should convert bottom-left pixels to feet origin', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const result = coords.pixelsToFeet(0, 600)
			expect(result).toEqual({ x: 0, y: 0 })
		})

		it('should convert pixel position to feet correctly', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const result = coords.pixelsToFeet(400, 450)
			expect(result.x).toBe(80) // 400 / 5
			expect(result.y).toBe(30) // (600 - 450) / 5
		})

		it('should be inverse of feetToPixels', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const originalFeet = { x: 50, y: 75 }
			const pixels = coords.feetToPixels(originalFeet.x, originalFeet.y)
			const backToFeet = coords.pixelsToFeet(pixels.x, pixels.y)
			
			expect(backToFeet.x).toBeCloseTo(originalFeet.x, 10)
			expect(backToFeet.y).toBeCloseTo(originalFeet.y, 10)
		})
	})

	describe('updateDimensions', () => {
		it('should update dimensions and recalculate scale', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const initialScale = coords.scale
			
			coords.updateDimensions(1600, 1200)
			
			expect(coords.getDimensions()).toEqual({ width: 1600, height: 1200 })
			expect(coords.scale).toBe(initialScale * 2)
		})

		it('should affect subsequent conversions', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const before = coords.feetToPixels(10, 10)
			
			coords.updateDimensions(1600, 1200)
			const after = coords.feetToPixels(10, 10)
			
			expect(after.x).toBe(before.x * 2)
		})
	})

	describe('getHeightInFeet', () => {
		it('should calculate visible height in feet', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const heightInFeet = coords.getHeightInFeet()
			expect(heightInFeet).toBe(120) // 600 / 5 = 120 feet
		})

		it('should update when dimensions change', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const initialHeight = coords.getHeightInFeet()
			
			coords.updateDimensions(800, 1200)
			const newHeight = coords.getHeightInFeet()
			
			expect(newHeight).toBe(initialHeight * 2)
		})
	})

	describe('createCoordinateSystem factory', () => {
		it('should create a new instance', () => {
			const coords = createCoordinateSystem(800, 600)
			expect(coords).toBeInstanceOf(FieldCoordinateSystem)
			expect(coords.getDimensions()).toEqual({ width: 800, height: 600 })
		})
	})
})
