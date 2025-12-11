import { describe, it, expect } from 'bun:test'
import {
	flipPlayer,
	flipDrawing,
	flipCanvasHorizontally,
} from '../../../src/utils/flip.utils'
import type { Player } from '../../../src/contexts/PlayContext'
import type { Drawing } from '../../../src/types/drawing.types'
import { FIELD_WIDTH_FEET } from '../../../src/constants/field.constants'

describe('flip.utils', () => {
	describe('flipPlayer', () => {
		it('mirrors player X coordinate around field center', () => {
			const player: Player = {
				id: '1',
				x: 60,
				y: 30,
				label: 'X',
				color: '#000',
			}
			const flipped = flipPlayer(player)

			expect(flipped.x).toBe(FIELD_WIDTH_FEET - 60) // 100
			expect(flipped.y).toBe(30) // Y unchanged
			expect(flipped.id).toBe('1')
			expect(flipped.label).toBe('X')
		})

		it('player at center stays at center', () => {
			const player: Player = {
				id: '1',
				x: 80,
				y: 30,
				label: 'C',
				color: '#000',
			}
			const flipped = flipPlayer(player)

			expect(flipped.x).toBe(80) // CENTER_X stays same
		})
	})

	describe('flipDrawing', () => {
		it('mirrors all control points', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: {
					p1: { id: 'p1', type: 'start', x: 60, y: 30 },
					p2: { id: 'p2', type: 'end', x: 70, y: 40 },
				},
				segments: [{ type: 'line', pointIds: ['p1', 'p2'] }],
				style: {
					color: '#000',
					strokeWidth: 2,
					lineStyle: 'solid',
					lineEnd: 'arrow',
					pathMode: 'sharp',
				},
				annotations: [],
			}
			const flipped = flipDrawing(drawing)

			expect(flipped.points.p1.x).toBe(100) // 160 - 60
			expect(flipped.points.p2.x).toBe(90)  // 160 - 70
			expect(flipped.points.p1.y).toBe(30)  // Y unchanged
		})

		it('mirrors bezier handles', () => {
			const drawing: Drawing = {
				id: 'd1',
				points: {
					p1: {
						id: 'p1',
						type: 'corner',
						x: 60,
						y: 30,
						handleIn: { x: 55, y: 28 },
						handleOut: { x: 65, y: 32 },
					},
				},
				segments: [],
				style: {
					color: '#000',
					strokeWidth: 2,
					lineStyle: 'solid',
					lineEnd: 'none',
					pathMode: 'curve',
				},
				annotations: [],
			}
			const flipped = flipDrawing(drawing)

			expect(flipped.points.p1.handleIn?.x).toBe(105) // 160 - 55
			expect(flipped.points.p1.handleOut?.x).toBe(95) // 160 - 65
		})
	})

	describe('flipCanvasHorizontally', () => {
		it('flips both players and drawings', () => {
			const players: Player[] = [
				{ id: '1', x: 60, y: 30, label: 'X', color: '#000' },
			]
			const drawings: Drawing[] = [
				{
					id: 'd1',
					points: { p1: { id: 'p1', type: 'start', x: 70, y: 35 } },
					segments: [],
					style: {
						color: '#000',
						strokeWidth: 2,
						lineStyle: 'solid',
						lineEnd: 'none',
						pathMode: 'sharp',
					},
					annotations: [],
				},
			]

			const result = flipCanvasHorizontally(players, drawings)

			expect(result.players[0].x).toBe(100)
			expect(result.drawings[0].points.p1.x).toBe(90)
		})
	})
})
