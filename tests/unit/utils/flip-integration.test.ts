import { describe, it, expect } from 'bun:test'
import { flipDrawing } from '../../../src/utils/flip.utils'
import type { Drawing } from '../../../src/types/drawing.types'

describe('flip integration - drawings should persist', () => {
	it('preserves all drawing properties when flipping', () => {
		const drawing: Drawing = {
			id: 'd1',
			points: {
				p1: { id: 'p1', type: 'start', x: 60, y: 30 },
				p2: { id: 'p2', type: 'end', x: 70, y: 40 },
			},
			segments: [{ type: 'line', pointIds: ['p1', 'p2'] }],
			style: {
				color: '#FF0000',
				strokeWidth: 3,
				lineStyle: 'dashed',
				lineEnd: 'arrow',
				pathMode: 'curve',
			},
			annotations: [],
		}

		const flipped = flipDrawing(drawing)

		// Should preserve all non-coordinate properties
		expect(flipped.id).toBe('d1')
		expect(flipped.segments).toEqual([{ type: 'line', pointIds: ['p1', 'p2'] }])
		expect(flipped.style).toEqual({
			color: '#FF0000',
			strokeWidth: 3,
			lineStyle: 'dashed',
			lineEnd: 'arrow',
			pathMode: 'curve',
		})
		expect(flipped.annotations).toEqual([])

		// Should have flipped points
		expect(Object.keys(flipped.points)).toHaveLength(2)
		expect(flipped.points.p1).toBeDefined()
		expect(flipped.points.p2).toBeDefined()
	})

	it('preserves playerId and linkedPointId when present', () => {
		const drawing: Drawing = {
			id: 'd1',
			playerId: 'player-123',
			linkedPointId: 'p1',
			points: {
				p1: { id: 'p1', type: 'start', x: 60, y: 30 },
			},
			segments: [],
			style: {
				color: '#000',
				strokeWidth: 2,
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'sharp',
			},
			annotations: [],
		}

		const flipped = flipDrawing(drawing)

		expect(flipped.playerId).toBe('player-123')
		expect(flipped.linkedPointId).toBe('p1')
	})
})
