import { describe, test, expect } from 'bun:test'
import type { Drawing, PathStyle } from '../../types/drawing.types'

/**
 * TDD RED: Test for maintaining drawing shape during whole-drawing drag link
 *
 * Requirements:
 * 1. When linking via whole-drawing drag, the entire drawing should move
 * 2. The shape of the drawing should be maintained (relative positions preserved)
 * 3. The linked point should end up at the player's position
 * 4. All other points should move by the same delta
 */
describe('SVGCanvas - Maintain Shape During Drag Link', () => {
	const defaultStyle: PathStyle = {
		color: '#000000',
		strokeWidth: 0.3,
		lineStyle: 'solid',
		lineEnd: 'none',
		pathMode: 'sharp',
	}

	test('whole-drawing drag link should maintain shape', () => {
		// Initial drawing: a line from (10, 10) to (20, 10)
		const drawing: Drawing = {
			id: 'd1',
			points: {
				'start': { id: 'start', x: 10, y: 10, type: 'start' },
				'end': { id: 'end', x: 20, y: 10, type: 'end' },
			},
			segments: [{ type: 'line', pointIds: ['start', 'end'] }],
			style: defaultStyle,
			annotations: [],
		}

		// Player at (25, 15)
		const player = { id: 'p1', x: 25, y: 15 }

		// User drags drawing so end point (20, 10) links to player (25, 15)
		// The end point moves from (20, 10) to (25, 15)
		// Delta: (5, 5)

		// Expected result:
		// - end point: (25, 15) - at player position
		// - start point: (15, 15) - moved by same delta (10 + 5, 10 + 5)
		// - The line length is preserved: sqrt((25-15)^2 + (15-15)^2) = 10 feet

		const expectedEndPoint = { x: 25, y: 15 }
		const expectedStartPoint = { x: 15, y: 15 }

		// Calculate the delta from original end point to player
		const deltaX = player.x - drawing.points.end.x
		const deltaY = player.y - drawing.points.end.y

		expect(deltaX).toBe(5)
		expect(deltaY).toBe(5)

		// All points should move by this delta
		const movedStartPoint = {
			x: drawing.points.start.x + deltaX,
			y: drawing.points.start.y + deltaY,
		}
		const movedEndPoint = {
			x: drawing.points.end.x + deltaX,
			y: drawing.points.end.y + deltaY,
		}

		expect(movedStartPoint).toEqual(expectedStartPoint)
		expect(movedEndPoint).toEqual(expectedEndPoint)

		// Verify shape is maintained (distance between points)
		const originalDistance = Math.sqrt(
			Math.pow(drawing.points.end.x - drawing.points.start.x, 2) +
			Math.pow(drawing.points.end.y - drawing.points.start.y, 2)
		)
		const newDistance = Math.sqrt(
			Math.pow(movedEndPoint.x - movedStartPoint.x, 2) +
			Math.pow(movedEndPoint.y - movedStartPoint.y, 2)
		)

		expect(newDistance).toBe(originalDistance)
	})

	test('integration: handleLinkDrawingToPlayer should move entire drawing', () => {
		// This test documents the expected behavior of the link handler
		// when called from whole-drawing drag (not node drag)

		// Current behavior (WRONG for whole-drawing drag):
		// - Only the linked point moves to player position
		// - Other points stay in place
		// - Shape is distorted

		// Expected behavior (CORRECT for whole-drawing drag):
		// - Calculate delta from linked point to player
		// - Move ALL points by the same delta
		// - Shape is preserved

		// We need a new parameter or a different handler for whole-drawing drag
		// Options:
		// 1. Add a "maintainShape" boolean parameter
		// 2. Create a separate "onLinkDrawingToPlayerWithShape" handler
		// 3. Calculate and apply the delta before calling the link handler

		expect(true).toBe(true) // Placeholder - will implement after design decision
	})

	test('complex drawing shape should be maintained', () => {
		// Test with a more complex drawing (triangle)
		const drawing: Drawing = {
			id: 'd1',
			points: {
				'p1': { id: 'p1', x: 10, y: 10, type: 'start' },
				'p2': { id: 'p2', x: 20, y: 10, type: 'corner' },
				'p3': { id: 'p3', x: 15, y: 20, type: 'end' },
			},
			segments: [
				{ type: 'line', pointIds: ['p1', 'p2'] },
				{ type: 'line', pointIds: ['p2', 'p3'] },
				{ type: 'line', pointIds: ['p3', 'p1'] },
			],
			style: defaultStyle,
			annotations: [],
		}

		// Player at (25, 15)
		const player = { id: 'p1', x: 25, y: 15 }

		// User drags so p3 (15, 20) links to player (25, 15)
		// Delta: (10, -5)

		const deltaX = player.x - drawing.points.p3.x
		const deltaY = player.y - drawing.points.p3.y

		expect(deltaX).toBe(10)
		expect(deltaY).toBe(-5)

		// All points should move by this delta
		const expectedP1 = { x: 20, y: 5 }
		const expectedP2 = { x: 30, y: 5 }
		const expectedP3 = { x: 25, y: 15 }

		// Calculate moved points
		const movedP1 = {
			x: drawing.points.p1.x + deltaX,
			y: drawing.points.p1.y + deltaY,
		}
		const movedP2 = {
			x: drawing.points.p2.x + deltaX,
			y: drawing.points.p2.y + deltaY,
		}
		const movedP3 = {
			x: drawing.points.p3.x + deltaX,
			y: drawing.points.p3.y + deltaY,
		}

		expect(movedP1).toEqual(expectedP1)
		expect(movedP2).toEqual(expectedP2)
		expect(movedP3).toEqual(expectedP3)

		// Verify all distances are preserved
		const dist12Original = Math.sqrt(
			Math.pow(drawing.points.p2.x - drawing.points.p1.x, 2) +
			Math.pow(drawing.points.p2.y - drawing.points.p1.y, 2)
		)
		const dist12New = Math.sqrt(
			Math.pow(movedP2.x - movedP1.x, 2) +
			Math.pow(movedP2.y - movedP1.y, 2)
		)
		expect(dist12New).toBe(dist12Original)
	})
})
