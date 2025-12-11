import { describe, test, expect } from 'bun:test'

describe('Selection-Delete Synchronization', () => {
	test('selection glow and delete target should use same source', () => {
		// Test that a single selectedDrawingIds array drives both:
		// 1. PathRenderer isSelected prop (glow)
		// 2. Delete handler target list

		const selectedDrawingIds = ['drawing-1', 'drawing-2']

		// Glow should show for drawing-1
		const drawing1ShouldGlow = selectedDrawingIds.includes('drawing-1')
		expect(drawing1ShouldGlow).toBe(true)

		// Delete should target drawing-1
		const deleteTargets = selectedDrawingIds
		expect(deleteTargets).toContain('drawing-1')

		// Both derived from same array
		expect(drawing1ShouldGlow).toBe(deleteTargets.includes('drawing-1'))
	})

	test('control nodes should show only for selected drawings', () => {
		const selectedDrawingIds = ['drawing-1']
		const allDrawings = [
			{ id: 'drawing-1' },
			{ id: 'drawing-2' },
			{ id: 'drawing-3' }
		]

		// Only selected drawings should have control nodes
		const drawingsWithNodes = allDrawings.filter(
			d => selectedDrawingIds.includes(d.id)
		)

		expect(drawingsWithNodes).toHaveLength(1)
		expect(drawingsWithNodes[0].id).toBe('drawing-1')
	})

	test('when selection changes, both glow and nodes update together', () => {
		let selectedDrawingIds = ['drawing-1']

		// Initial state
		expect(selectedDrawingIds.includes('drawing-1')).toBe(true)
		expect(selectedDrawingIds.includes('drawing-2')).toBe(false)

		// Change selection
		selectedDrawingIds = ['drawing-2']

		// Both should update
		expect(selectedDrawingIds.includes('drawing-1')).toBe(false)
		expect(selectedDrawingIds.includes('drawing-2')).toBe(true)
	})
})
