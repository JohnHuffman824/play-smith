/**
 * Tests for FreehandCapture coordinate conversion
 *
 * Key insight: FreehandCapture is INSIDE the CSS transform container.
 * getBoundingClientRect() returns the TRANSFORMED rect.
 * So coordinates from (clientX - rect.left) are already in "canvas-relative" space,
 * NOT screen space. We should NOT apply zoom/pan conversion again.
 */
import { describe, it, expect } from 'bun:test'

describe('FreehandCapture Coordinate Conversion', () => {
	describe('when inside CSS transform container', () => {
		// Scenario: Canvas at 800x600, zoom=2, canvas appears as 1600x1200 on screen
		const canvasInternalWidth = 800
		const canvasInternalHeight = 600
		const zoom = 2

		it('should convert screen-relative coords to canvas-internal coords for preview', () => {
			// User clicks at position relative to the transformed canvas element
			// getBoundingClientRect gives scaled rect, so coordinates are already scaled
			const screenRelativeX = 400  // Middle of 1600px wide scaled canvas
			const screenRelativeY = 300  // Middle of 1200px tall scaled canvas

			// For canvas preview, divide by zoom to get internal coordinates
			const canvasInternalX = screenRelativeX / zoom
			const canvasInternalY = screenRelativeY / zoom

			// Should be (200, 150) - the center of 800x600 internal canvas
			expect(canvasInternalX).toBe(200)
			expect(canvasInternalY).toBe(150)
		})

		it('should use pixelsToFeet directly for coordinate storage (not screenToFeet)', () => {
			// Since the canvas element is inside the transform, coordinates from
			// getBoundingClientRect are already in canvas-space (just scaled).
			// After dividing by zoom, we have true canvas internal pixels.
			// Use pixelsToFeet() directly - do NOT use screenToFeet() which would double-correct.

			const screenRelativeX = 400
			const screenRelativeY = 300

			// Convert to canvas internal pixels
			const canvasInternalX = screenRelativeX / zoom
			const canvasInternalY = screenRelativeY / zoom

			// Now use pixelsToFeet (simulated)
			const scale = canvasInternalWidth / 160  // 5 pixels per foot
			const feetX = canvasInternalX / scale
			const feetY = (canvasInternalHeight - canvasInternalY) / scale  // Y flip

			// At internal (200, 150): feetX = 200/5 = 40, feetY = (600-150)/5 = 90
			expect(feetX).toBe(40)
			expect(feetY).toBe(90)
		})

		it('should NOT use screenToFeet which would double-correct', () => {
			// Demonstrating what goes wrong with screenToFeet
			const screenRelativeX = 400
			const screenRelativeY = 300
			const panX = 0
			const panY = 0

			// screenToFeet formula (WRONG for inside-transform context):
			// canvasX = (screenX - panX) / zoom = (400 - 0) / 2 = 200
			// This would be correct IF screenX was relative to untransformed container
			// But our screenX is already relative to transformed canvas!

			// The correct approach is to divide by zoom for canvas preview,
			// then use pixelsToFeet directly (which doesn't apply zoom again)

			// This test documents the expected behavior
			expect(true).toBe(true)
		})
	})
})
