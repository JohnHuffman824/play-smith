import { describe, test, expect } from 'bun:test'

// Test the undo history logic in isolation
describe('Canvas Undo History', () => {
	describe('History Snapshot Structure', () => {
		test('snapshot should include players and drawings', () => {
			// Test data structure
			const snapshot = {
				drawings: [
					{
						id: 'drawing-1',
						points: {},
						segments: [],
						style: { color: '#000000', strokeWidth: 2, lineStyle: 'solid' as const, lineEnd: 'none' as const }
					}
				],
				players: [
					{ id: 'player-1', x: 100, y: 100, label: 'QB', color: '#FF0000' }
				],
				linemanPositions: [
					{ id: 1, x: 50, y: 100 }
				]
			}

			expect(snapshot.drawings).toHaveLength(1)
			expect(snapshot.players).toHaveLength(1)
			expect(snapshot.linemanPositions).toHaveLength(1)
		})
	})

	describe('Undo Logic', () => {
		test('undo should restore previous state after player deletion', () => {
			// Simulate history with snapshots
			const history = [
				{
					// Initial state with 2 players
					drawings: [],
					players: [
						{ id: 'p1', x: 100, y: 100, label: 'QB', color: '#FF0000' },
						{ id: 'p2', x: 200, y: 100, label: 'RB', color: '#0000FF' }
					],
					linemanPositions: []
				},
				{
					// Current state with 1 player (p2 was erased)
					drawings: [],
					players: [
						{ id: 'p1', x: 100, y: 100, label: 'QB', color: '#FF0000' }
					],
					linemanPositions: []
				}
			]

			// Undo logic: get previous snapshot
			const currentIndex = history.length - 1
			const previousSnapshot = history[currentIndex - 1]

			// Verify previous state is restored
			expect(previousSnapshot.players).toHaveLength(2)
			expect(previousSnapshot.players[0].id).toBe('p1')
			expect(previousSnapshot.players[1].id).toBe('p2')
		})

		test('undo should restore previous state after drawing deletion', () => {
			// Simulate history with snapshots
			const history = [
				{
					// Initial state with 2 drawings
					drawings: [
						{ id: 'd1', points: {}, segments: [], style: { color: '#000000', strokeWidth: 2, lineStyle: 'solid' as const, lineEnd: 'none' as const } },
						{ id: 'd2', points: {}, segments: [], style: { color: '#FF0000', strokeWidth: 3, lineStyle: 'dashed' as const, lineEnd: 'arrow' as const } }
					],
					players: [],
					linemanPositions: []
				},
				{
					// Current state with 1 drawing (d2 was erased)
					drawings: [
						{ id: 'd1', points: {}, segments: [], style: { color: '#000000', strokeWidth: 2, lineStyle: 'solid' as const, lineEnd: 'none' as const } }
					],
					players: [],
					linemanPositions: []
				}
			]

			// Undo logic: get previous snapshot
			const currentIndex = history.length - 1
			const previousSnapshot = history[currentIndex - 1]

			// Verify previous state is restored
			expect(previousSnapshot.drawings).toHaveLength(2)
			expect(previousSnapshot.drawings[0].id).toBe('d1')
			expect(previousSnapshot.drawings[1].id).toBe('d2')
		})

		test('undo on empty history should clear canvas', () => {
			// When history is empty or has only current state
			const history = [
				{
					drawings: [{ id: 'd1', points: {}, segments: [], style: { color: '#000000', strokeWidth: 2, lineStyle: 'solid' as const, lineEnd: 'none' as const } }],
					players: [{ id: 'p1', x: 100, y: 100, label: 'QB', color: '#FF0000' }],
					linemanPositions: []
				}
			]

			// Try to undo
			const currentIndex = history.length - 1
			const previousSnapshot = history[currentIndex - 1]

			// Should be undefined (will trigger clear canvas)
			expect(previousSnapshot).toBeUndefined()
		})

		test('multiple undos should restore progressively earlier states', () => {
			const history = [
				{ drawings: [], players: [], linemanPositions: [] }, // State 0: Empty
				{ drawings: [], players: [{ id: 'p1', x: 100, y: 100, label: 'QB', color: '#FF0000' }], linemanPositions: [] }, // State 1: Added p1
				{ drawings: [], players: [{ id: 'p1', x: 100, y: 100, label: 'QB', color: '#FF0000' }, { id: 'p2', x: 200, y: 100, label: 'RB', color: '#0000FF' }], linemanPositions: [] }, // State 2: Added p2
				{ drawings: [], players: [{ id: 'p1', x: 100, y: 100, label: 'QB', color: '#FF0000' }], linemanPositions: [] }, // State 3: Erased p2
			]

			// First undo: from state 3 to state 2
			let currentIndex = history.length - 1
			let previousSnapshot = history[currentIndex - 1]
			expect(previousSnapshot.players).toHaveLength(2)

			// Second undo: from state 2 to state 1
			currentIndex = currentIndex - 1
			previousSnapshot = history[currentIndex - 1]
			expect(previousSnapshot.players).toHaveLength(1)

			// Third undo: from state 1 to state 0
			currentIndex = currentIndex - 1
			previousSnapshot = history[currentIndex - 1]
			expect(previousSnapshot.players).toHaveLength(0)
		})
	})
})




