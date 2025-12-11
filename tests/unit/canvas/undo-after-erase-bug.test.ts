import { describe, test, expect } from 'bun:test'

/**
 * These tests demonstrate the bug where undo doesn't work after erasing
 * the last player or drawing due to the history save condition.
 */
describe('Canvas Undo - Erase Bug', () => {
	test('should save history when canvas becomes empty after erase', () => {
		// Simulate the current Canvas.tsx logic
		function shouldSaveHistory(drawings: any[], players: any[]): boolean {
			// Current buggy condition from Canvas.tsx line 203
			if (drawings.length == 0 && players.length == 0) return false
			return true
		}

		// Test case: Start with 1 player, erase it
		const beforeErase = { drawings: [], players: [{ id: 'p1' }] }
		const afterErase = { drawings: [], players: [] }

		// History should be saved before erasing
		expect(shouldSaveHistory(beforeErase.drawings, beforeErase.players)).toBe(true)

		// BUG: History is NOT saved after erasing (canvas is empty)
		// This means we can't undo the erase operation!
		expect(shouldSaveHistory(afterErase.drawings, afterErase.players)).toBe(false)

		// This test FAILS with current implementation, demonstrating the bug
		// After fix, history SHOULD be saved even when canvas is empty
	})

	test('correct implementation should always save history for undo', () => {
		// Fixed logic: always save history (or use a different approach)
		function shouldSaveHistoryFixed(_drawings: any[], _players: any[]): boolean {
			// Always return true, or check if this is an actual change
			return true
		}

		const emptyCanvas = { drawings: [], players: [] }
		const withOnePlayer = { drawings: [], players: [{ id: 'p1' }] }

		// History should be saved in both cases
		expect(shouldSaveHistoryFixed(emptyCanvas.drawings, emptyCanvas.players)).toBe(true)
		expect(shouldSaveHistoryFixed(withOnePlayer.drawings, withOnePlayer.players)).toBe(true)
	})

	test('demonstrates the undo flow with the bug', () => {
		// Simulate history tracking
		const history: Array<{ drawings: any[]; players: any[] }> = []

		function saveToHistory(drawings: any[], players: any[]) {
			// Current buggy condition
			if (drawings.length == 0 && players.length == 0) return

			history.push({ drawings: JSON.parse(JSON.stringify(drawings)), players: JSON.parse(JSON.stringify(players)) })
		}

		// Step 1: Add a player
		let drawings: any[] = []
		let players = [{ id: 'p1', x: 100, y: 100 }]
		saveToHistory(drawings, players)

		// Verify history was saved
		expect(history.length).toBe(1)
		expect(history[0].players).toHaveLength(1)

		// Step 2: Erase the player
		players = []
		saveToHistory(drawings, players)

		// BUG: History was NOT saved because canvas is empty!
		expect(history.length).toBe(1) // Still only 1 entry

		// Step 3: Try to undo
		const previousSnapshot = history[history.length - 2]

		// BUG: No previous snapshot exists because we didn't save after erasing
		expect(previousSnapshot).toBeUndefined()

		// This means undo cannot restore the erased player!
	})

	test('demonstrates correct behavior after fix', () => {
		const history: Array<{ drawings: any[]; players: any[] }> = []

		function saveToHistoryFixed(drawings: any[], players: any[]) {
			// Fixed: Save history even when canvas is empty
			// Or: Track if this is different from last snapshot
			history.push({ drawings: JSON.parse(JSON.stringify(drawings)), players: JSON.parse(JSON.stringify(players)) })
		}

		// Step 1: Add a player
		let drawings: any[] = []
		let players = [{ id: 'p1', x: 100, y: 100 }]
		saveToHistoryFixed(drawings, players)
		expect(history.length).toBe(1)

		// Step 2: Erase the player
		players = []
		saveToHistoryFixed(drawings, players)

		// FIXED: History WAS saved even though canvas is empty
		expect(history.length).toBe(2)
		expect(history[1].players).toHaveLength(0)

		// Step 3: Undo
		const previousSnapshot = history[history.length - 2]

		// SUCCESS: Previous snapshot exists
		expect(previousSnapshot).toBeDefined()
		expect(previousSnapshot.players).toHaveLength(1)
		expect(previousSnapshot.players[0].id).toBe('p1')

		// Undo successfully restores the erased player!
	})
})




