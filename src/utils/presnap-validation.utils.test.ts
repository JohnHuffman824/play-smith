/**
 * Tests for pre-snap motion validation utilities
 */

import { describe, test, expect } from 'bun:test'
import type { Drawing } from '../types/drawing.types'
import {
	hasMultipleTerminalNodes,
	playerHasPreSnapMovement,
	countMotions,
	countShifts,
	validateShift,
	validateMotion,
	validatePreSnapMovement,
} from './presnap-validation.utils'

// Test fixture factory
function createTestDrawing(overrides?: Partial<Drawing>): Drawing {
	return {
		id: 'test-drawing',
		points: {
			p1: { id: 'p1', x: 0, y: 0, type: 'start' },
			p2: { id: 'p2', x: 10, y: 0, type: 'end' },
		},
		segments: [{ type: 'line', pointIds: ['p1', 'p2'] }],
		style: {
			color: '#000000',
			strokeWidth: 2,
			lineStyle: 'solid',
			lineEnd: 'none',
			pathMode: 'sharp',
		},
		annotations: [],
		...overrides,
	}
}

describe('hasMultipleTerminalNodes', () => {
	test('returns false for single terminal node', () => {
		const drawing = createTestDrawing()
		expect(hasMultipleTerminalNodes(drawing)).toBe(false)
	})

	test('returns true for multiple terminal nodes', () => {
		const drawing = createTestDrawing({
			points: {
				p1: { id: 'p1', x: 0, y: 0, type: 'start' },
				p2: { id: 'p2', x: 10, y: 0, type: 'end' },
				p3: { id: 'p3', x: 5, y: 10, type: 'end' },
			},
		})
		expect(hasMultipleTerminalNodes(drawing)).toBe(true)
	})

	test('returns false for empty points', () => {
		const drawing = createTestDrawing({ points: {} })
		expect(hasMultipleTerminalNodes(drawing)).toBe(false)
	})
})

describe('playerHasPreSnapMovement', () => {
	test('returns true when player has motion on drawing', () => {
		const drawings = [
			createTestDrawing({
				id: 'drawing1',
				playerId: 'player1',
				preSnapMotion: { type: 'motion', snapPointId: 'snap1' },
			}),
		]
		expect(playerHasPreSnapMovement('player1', drawings)).toBe(true)
	})

	test('returns true when player has shift on drawing', () => {
		const drawings = [
			createTestDrawing({
				id: 'drawing1',
				playerId: 'player1',
				preSnapMotion: { type: 'shift' },
			}),
		]
		expect(playerHasPreSnapMovement('player1', drawings)).toBe(true)
	})

	test('returns false when player has no pre-snap movement', () => {
		const drawings = [
			createTestDrawing({
				id: 'drawing1',
				playerId: 'player1',
			}),
		]
		expect(playerHasPreSnapMovement('player1', drawings)).toBe(false)
	})

	test('excludes specified drawing from check', () => {
		const drawings = [
			createTestDrawing({
				id: 'drawing1',
				playerId: 'player1',
				preSnapMotion: { type: 'motion', snapPointId: 'snap1' },
			}),
		]
		expect(playerHasPreSnapMovement('player1', drawings, 'drawing1')).toBe(false)
	})

	test('handles empty drawings array', () => {
		expect(playerHasPreSnapMovement('player1', [])).toBe(false)
	})
})

describe('countMotions', () => {
	test('counts motions correctly', () => {
		const drawings = [
			createTestDrawing({
				id: 'drawing1',
				preSnapMotion: { type: 'motion', snapPointId: 'snap1' },
			}),
			createTestDrawing({
				id: 'drawing2',
				preSnapMotion: { type: 'shift' },
			}),
		]
		expect(countMotions(drawings)).toBe(1)
	})

	test('returns 0 for no motions', () => {
		const drawings = [createTestDrawing()]
		expect(countMotions(drawings)).toBe(0)
	})

	test('ignores shifts', () => {
		const drawings = [
			createTestDrawing({
				id: 'drawing1',
				preSnapMotion: { type: 'shift' },
			}),
		]
		expect(countMotions(drawings)).toBe(0)
	})
})

describe('countShifts', () => {
	test('counts shifts correctly', () => {
		const drawings = [
			createTestDrawing({
				id: 'drawing1',
				preSnapMotion: { type: 'shift' },
			}),
			createTestDrawing({
				id: 'drawing2',
				preSnapMotion: { type: 'shift' },
			}),
		]
		expect(countShifts(drawings)).toBe(2)
	})

	test('returns 0 for no shifts', () => {
		const drawings = [createTestDrawing()]
		expect(countShifts(drawings)).toBe(0)
	})

	test('ignores motions', () => {
		const drawings = [
			createTestDrawing({
				id: 'drawing1',
				preSnapMotion: { type: 'motion', snapPointId: 'snap1' },
			}),
		]
		expect(countShifts(drawings)).toBe(0)
	})
})

describe('validateShift', () => {
	test('returns error when drawing has no playerId', () => {
		const drawing = createTestDrawing()
		const result = validateShift(drawing, [])
		expect(result).toBe('Drawing must be linked to a player')
	})

	test('returns error when drawing has multiple terminal nodes', () => {
		const drawing = createTestDrawing({
			playerId: 'player1',
			points: {
				p1: { id: 'p1', x: 0, y: 0, type: 'start' },
				p2: { id: 'p2', x: 10, y: 0, type: 'end' },
				p3: { id: 'p3', x: 5, y: 10, type: 'end' },
			},
		})
		const result = validateShift(drawing, [])
		expect(result).toBe('Cannot apply shift to drawing with multiple terminal nodes')
	})

	test('returns error when player already has pre-snap movement', () => {
		const drawing = createTestDrawing({
			id: 'drawing1',
			playerId: 'player1',
		})
		const existingDrawing = createTestDrawing({
			id: 'drawing2',
			playerId: 'player1',
			preSnapMotion: { type: 'motion', snapPointId: 'snap1' },
		})
		const result = validateShift(drawing, [existingDrawing])
		expect(result).toBe('Player already has pre-snap movement on another drawing')
	})

	test('returns null when shift is valid', () => {
		const drawing = createTestDrawing({
			playerId: 'player1',
		})
		const result = validateShift(drawing, [])
		expect(result).toBe(null)
	})
})

describe('validateMotion', () => {
	test('returns error when drawing has no playerId', () => {
		const drawing = createTestDrawing()
		const result = validateMotion(drawing, [])
		expect(result).toBe('Drawing must be linked to a player')
	})

	test('returns error when player already has pre-snap movement', () => {
		const drawing = createTestDrawing({
			id: 'drawing1',
			playerId: 'player1',
		})
		const existingDrawing = createTestDrawing({
			id: 'drawing2',
			playerId: 'player1',
			preSnapMotion: { type: 'shift' },
		})
		const result = validateMotion(drawing, [existingDrawing])
		expect(result).toBe('Player already has pre-snap movement on another drawing')
	})

	test('returns error when play already has a motion', () => {
		const drawing = createTestDrawing({
			id: 'drawing1',
			playerId: 'player1',
		})
		const existingMotion = createTestDrawing({
			id: 'drawing2',
			playerId: 'player2',
			preSnapMotion: { type: 'motion', snapPointId: 'snap1' },
		})
		const result = validateMotion(drawing, [existingMotion])
		expect(result).toBe('Only one motion is allowed per play')
	})

	test('returns null when motion is valid', () => {
		const drawing = createTestDrawing({
			playerId: 'player1',
		})
		const result = validateMotion(drawing, [])
		expect(result).toBe(null)
	})
})

describe('validatePreSnapMovement', () => {
	test('calls validateShift for terminal clicks', () => {
		const drawing = createTestDrawing({
			playerId: 'player1',
		})
		const result = validatePreSnapMovement(drawing, [], 'terminal')
		expect(result).toBe(null)
	})

	test('calls validateMotion for path clicks', () => {
		const drawing = createTestDrawing({
			playerId: 'player1',
		})
		const result = validatePreSnapMovement(drawing, [], 'path')
		expect(result).toBe(null)
	})
})
