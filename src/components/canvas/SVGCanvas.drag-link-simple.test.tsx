import { describe, test, expect } from 'bun:test'
import { getDrawingStartPoint, getDrawingEndPoint, findPlayerSnapTarget } from '../../utils/drawing.utils'
import { PLAYER_RADIUS_FEET } from '../../constants/field.constants'
import type { Drawing, PathStyle } from '../../types/drawing.types'

/**
 * Unit tests for snap detection logic (isolated from React components)
 */
describe('Drawing Snap Detection Logic', () => {
	const defaultStyle: PathStyle = {
		color: '#000000',
		strokeWidth: 0.3,
		lineStyle: 'solid',
		lineEnd: 'none',
		pathMode: 'sharp',
	}

	const createTestDrawing = (id: string, startX: number, startY: number, endX: number, endY: number): Drawing => ({
		id,
		points: {
			'start': { id: 'start', x: startX, y: startY, type: 'start' },
			'end': { id: 'end', x: endX, y: endY, type: 'end' },
		},
		segments: [{ type: 'line', pointIds: ['start', 'end'] }],
		style: defaultStyle,
		annotations: [],
	})

	test('getDrawingStartPoint returns first point', () => {
		const drawing = createTestDrawing('d1', 10, 10, 20, 20)
		const startPoint = getDrawingStartPoint(drawing)

		expect(startPoint).toBeDefined()
		expect(startPoint?.id).toBe('start')
		expect(startPoint?.x).toBe(10)
		expect(startPoint?.y).toBe(10)
	})

	test('getDrawingEndPoint returns last point', () => {
		const drawing = createTestDrawing('d1', 10, 10, 20, 20)
		const endPoint = getDrawingEndPoint(drawing)

		expect(endPoint).toBeDefined()
		expect(endPoint?.id).toBe('end')
		expect(endPoint?.x).toBe(20)
		expect(endPoint?.y).toBe(20)
	})

	test('findPlayerSnapTarget finds player within threshold', () => {
		const players = [
			{ id: 'p1', x: 25, y: 10, label: 'QB', color: '#000' },
		]

		const position = { x: 24, y: 10 } // 1 foot away
		const threshold = PLAYER_RADIUS_FEET // 2.0 feet

		const snap = findPlayerSnapTarget(position, players, threshold)

		expect(snap).toBeDefined()
		expect(snap?.playerId).toBe('p1')
		expect(snap?.distance).toBeLessThan(threshold)
	})

	test('findPlayerSnapTarget returns null when outside threshold', () => {
		const players = [
			{ id: 'p1', x: 25, y: 10, label: 'QB', color: '#000' },
		]

		const position = { x: 30, y: 10 } // 5 feet away
		const threshold = PLAYER_RADIUS_FEET // 2.0 feet

		const snap = findPlayerSnapTarget(position, players, threshold)

		expect(snap).toBeNull()
	})

	test('snap detection logic for whole drawing drag', () => {
		// Simulate the logic from handleDrawingDragMove
		const drawing = createTestDrawing('d1', 10, 10, 20, 10)
		const players = [
			{ id: 'p1', x: 25, y: 10, label: 'QB', color: '#000' },
		]

		// Simulate dragging drawing 5 feet to the right
		const deltaX = 5
		const deltaY = 0

		// Build updated drawing with new positions
		const updatedDrawing = {
			...drawing,
			points: Object.fromEntries(
				Object.entries(drawing.points).map(([id, point]) => [
					id,
					{ ...point, x: point.x + deltaX, y: point.y + deltaY }
				])
			),
		}

		const startPoint = getDrawingStartPoint(updatedDrawing)
		const endPoint = getDrawingEndPoint(updatedDrawing)
		const threshold = PLAYER_RADIUS_FEET

		let bestTarget: {
			playerId: string
			pointId: string
			playerPosition: { x: number; y: number }
			distance: number
		} | null = null

		// Check start point (now at x=15, y=10)
		if (startPoint) {
			const snap = findPlayerSnapTarget(
				{ x: startPoint.x, y: startPoint.y },
				players,
				threshold
			)
			if (snap && (!bestTarget || snap.distance < bestTarget.distance)) {
				bestTarget = {
					playerId: snap.playerId,
					pointId: startPoint.id,
					playerPosition: snap.point,
					distance: snap.distance,
				}
			}
		}

		// Check end point (now at x=25, y=10) - should be right on the player!
		if (endPoint && endPoint.id !== startPoint?.id) {
			const snap = findPlayerSnapTarget(
				{ x: endPoint.x, y: endPoint.y },
				players,
				threshold
			)
			if (snap && (!bestTarget || snap.distance < bestTarget.distance)) {
				bestTarget = {
					playerId: snap.playerId,
					pointId: endPoint.id,
					playerPosition: snap.point,
					distance: snap.distance,
				}
			}
		}

		// End point should snap to player
		expect(bestTarget).toBeDefined()
		expect(bestTarget?.playerId).toBe('p1')
		expect(bestTarget?.pointId).toBe('end')
		expect(bestTarget?.distance).toBeLessThan(threshold)
	})
})
