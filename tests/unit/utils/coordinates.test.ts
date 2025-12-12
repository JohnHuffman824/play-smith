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

	describe('screenToFeet conversion with zoom and pan', () => {
		it('should match pixelsToFeet when zoom=1 and pan=(0,0)', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const screenX = 400
			const screenY = 300

			const withScreen = coords.screenToFeet(screenX, screenY, 1, 0, 0)
			const withPixels = coords.pixelsToFeet(screenX, screenY)

			expect(withScreen.x).toBeCloseTo(withPixels.x, 10)
			expect(withScreen.y).toBeCloseTo(withPixels.y, 10)
		})

		it('should account for zoom=2 (2x zoomed in)', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const screenX = 400
			const screenY = 300
			const zoom = 2

			// At 2x zoom, screen position 400 represents canvas position 200
			const result = coords.screenToFeet(screenX, screenY, zoom, 0, 0)
			const expected = coords.pixelsToFeet(200, 150)

			expect(result.x).toBeCloseTo(expected.x, 10)
			expect(result.y).toBeCloseTo(expected.y, 10)
		})

		it('should account for pan offset', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const screenX = 400
			const screenY = 300
			const panX = 100
			const panY = 50

			// With pan, screen position 400 with panX=100 represents canvas position 300
			const result = coords.screenToFeet(screenX, screenY, 1, panX, panY)
			const expected = coords.pixelsToFeet(300, 250)

			expect(result.x).toBeCloseTo(expected.x, 10)
			expect(result.y).toBeCloseTo(expected.y, 10)
		})

		it('should account for both zoom and pan', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const screenX = 400
			const screenY = 300
			const zoom = 2
			const panX = 100
			const panY = 50

			// With zoom=2 and pan, screen 400 with panX=100 → (400-100)/2 = 150
			const result = coords.screenToFeet(screenX, screenY, zoom, panX, panY)
			const expected = coords.pixelsToFeet(150, 125)

			expect(result.x).toBeCloseTo(expected.x, 10)
			expect(result.y).toBeCloseTo(expected.y, 10)
		})

		it('should handle zoom=4 (maximum zoom)', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const screenX = 800
			const screenY = 600
			const zoom = 4

			// At 4x zoom, screen 800 represents canvas 200
			const result = coords.screenToFeet(screenX, screenY, zoom, 0, 0)
			const expected = coords.pixelsToFeet(200, 150)

			expect(result.x).toBeCloseTo(expected.x, 10)
			expect(result.y).toBeCloseTo(expected.y, 10)
		})
	})

	describe('feetToScreen conversion with zoom and pan', () => {
		it('should match feetToPixels when zoom=1 and pan=(0,0)', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const feetX = 80
			const feetY = 60

			const withScreen = coords.feetToScreen(feetX, feetY, 1, 0, 0)
			const withPixels = coords.feetToPixels(feetX, feetY)

			expect(withScreen.x).toBeCloseTo(withPixels.x, 10)
			expect(withScreen.y).toBeCloseTo(withPixels.y, 10)
		})

		it('should apply zoom=2 scaling', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const feetX = 40
			const feetY = 30
			const zoom = 2

			// Canvas pixels: (40*5=200, 600-30*5=450)
			// With zoom=2: (200*2=400, 450*2=900)
			const result = coords.feetToScreen(feetX, feetY, zoom, 0, 0)
			const canvasPixels = coords.feetToPixels(feetX, feetY)

			expect(result.x).toBeCloseTo(canvasPixels.x * zoom, 10)
			expect(result.y).toBeCloseTo(canvasPixels.y * zoom, 10)
		})

		it('should apply pan offset', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const feetX = 40
			const feetY = 30
			const panX = 100
			const panY = 50

			// Canvas pixels + pan
			const result = coords.feetToScreen(feetX, feetY, 1, panX, panY)
			const canvasPixels = coords.feetToPixels(feetX, feetY)

			expect(result.x).toBeCloseTo(canvasPixels.x + panX, 10)
			expect(result.y).toBeCloseTo(canvasPixels.y + panY, 10)
		})

		it('should apply both zoom and pan', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const feetX = 40
			const feetY = 30
			const zoom = 2
			const panX = 100
			const panY = 50

			// Canvas: (200, 450) → zoom: (400, 900) → pan: (500, 950)
			const result = coords.feetToScreen(feetX, feetY, zoom, panX, panY)
			const canvasPixels = coords.feetToPixels(feetX, feetY)

			expect(result.x).toBeCloseTo(canvasPixels.x * zoom + panX, 10)
			expect(result.y).toBeCloseTo(canvasPixels.y * zoom + panY, 10)
		})
	})

	describe('round-trip conversion with zoom and pan', () => {
		it('should be invertible: feetToScreen → screenToFeet', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const originalFeet = { x: 50, y: 75 }
			const zoom = 2
			const panX = 100
			const panY = 50

			const screen = coords.feetToScreen(originalFeet.x, originalFeet.y, zoom, panX, panY)
			const backToFeet = coords.screenToFeet(screen.x, screen.y, zoom, panX, panY)

			expect(backToFeet.x).toBeCloseTo(originalFeet.x, 10)
			expect(backToFeet.y).toBeCloseTo(originalFeet.y, 10)
		})

		it('should be invertible at various zoom levels', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const originalFeet = { x: 80, y: 60 }
			const zoomLevels = [1, 1.5, 2, 3, 4]

			for (const zoom of zoomLevels) {
				const screen = coords.feetToScreen(originalFeet.x, originalFeet.y, zoom, 0, 0)
				const backToFeet = coords.screenToFeet(screen.x, screen.y, zoom, 0, 0)

				expect(backToFeet.x).toBeCloseTo(originalFeet.x, 10)
				expect(backToFeet.y).toBeCloseTo(originalFeet.y, 10)
			}
		})

		it('should be invertible with various pan offsets', () => {
			const coords = new FieldCoordinateSystem(800, 600)
			const originalFeet = { x: 80, y: 60 }
			const panOffsets = [
				{ panX: 0, panY: 0 },
				{ panX: 50, panY: 25 },
				{ panX: -50, panY: -25 },
				{ panX: 200, panY: 100 },
			]

			for (const { panX, panY } of panOffsets) {
				const screen = coords.feetToScreen(originalFeet.x, originalFeet.y, 2, panX, panY)
				const backToFeet = coords.screenToFeet(screen.x, screen.y, 2, panX, panY)

				expect(backToFeet.x).toBeCloseTo(originalFeet.x, 10)
				expect(backToFeet.y).toBeCloseTo(originalFeet.y, 10)
			}
		})
	})
})
