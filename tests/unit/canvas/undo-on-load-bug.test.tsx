import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { cleanup, render, waitFor, act } from '@testing-library/react'
import { Canvas } from '../../../src/components/canvas/Canvas'
import { PlayProvider, usePlayContext } from '../../../src/contexts/PlayContext'
import { SettingsProvider } from '../../../src/contexts/SettingsContext'
import { CanvasViewportProvider } from '../../../src/contexts/CanvasViewportContext'
import { eventBus } from '../../../src/services/EventBus'
import type { DrawingState } from '../../../src/types/play.types'
import { useEffect } from 'react'

/**
 * This test verifies the bug: when a play loads and user immediately presses undo,
 * the entire play disappears instead of preventing undo.
 */

const defaultDrawingState: DrawingState = {
	tool: 'select',
	color: '#000000',
	brushSize: 4,
	eraseSize: 30,
	lineStyle: 'solid',
	lineEnd: 'none',
	pathMode: 'sharp',
	snapThreshold: 15,
}

function CanvasWithInitialData({
	drawingState,
	initialPlayers,
	initialDrawings,
}: {
	drawingState: DrawingState
	initialPlayers?: Array<{ id: string; x: number; y: number; label: string; color: string }>
	initialDrawings?: any[]
}) {
	const { setPlayers, setDrawings } = usePlayContext()

	// Simulate loading a play by setting initial data
	useEffect(() => {
		if (initialPlayers) {
			setPlayers(initialPlayers)
		}
		if (initialDrawings) {
			setDrawings(initialDrawings)
		}
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<CanvasViewportProvider>
			<Canvas
				drawingState={drawingState}
				hashAlignment="center"
				showPlayBar={false}
				showFieldMarkings={true}
				containerMode="viewport"
			/>
		</CanvasViewportProvider>
	)
}

function renderCanvas(
	drawingState: DrawingState,
	initialPlayers?: Array<{ id: string; x: number; y: number; label: string; color: string }>,
	initialDrawings?: any[]
) {
	return render(
		<SettingsProvider>
			<PlayProvider>
				<CanvasWithInitialData
					drawingState={drawingState}
					initialPlayers={initialPlayers}
					initialDrawings={initialDrawings}
				/>
			</PlayProvider>
		</SettingsProvider>
	)
}

beforeEach(() => {
	eventBus.clear()
})

describe('Canvas Undo on Load Bug', () => {

	afterEach(() => {
		cleanup()
	})

	test('undo immediately after loading a play should not clear the canvas', async () => {
		// Simulate loading a play with players
		const initialPlayers = [
			{ id: 'p1', x: 100, y: 100, label: 'QB', color: '#FF0000' },
			{ id: 'p2', x: 200, y: 100, label: 'RB', color: '#0000FF' }
		]

		let contextState: any = null

		function TestWrapper() {
			const context = usePlayContext()
			contextState = context.state
			return (
				<CanvasWithInitialData
					drawingState={defaultDrawingState}
					initialPlayers={initialPlayers}
				/>
			)
		}

		render(
			<SettingsProvider>
				<PlayProvider>
					<TestWrapper />
				</PlayProvider>
			</SettingsProvider>
		)

		// Wait for Canvas to set up undo listener and initial players to be set
		await waitFor(() => {
			expect(eventBus.listenerCount('canvas:undo')).toBeGreaterThan(0)
			expect(contextState?.players?.length).toBe(2)
		})

		// At this point, the play has loaded with 2 players
		// User presses undo immediately (hasn't made any changes)
		await act(async () => {
			eventBus.emit('canvas:undo')
		})

		// After undo, players should still exist (undo should be a no-op)
		// because we haven't made any changes after the initial load
		await waitFor(() => {
			expect(contextState?.players?.length).toBe(2)
		})
	})

	test('undo immediately after loading a play with drawings should not clear drawings', async () => {
		const initialDrawings = [
			{
				id: 'drawing-1',
				points: { 'p1': { x: 0, y: 0 }, 'p2': { x: 10, y: 10 } },
				segments: [{ pointIds: ['p1', 'p2'] }],
				style: {
					color: '#000000',
					strokeWidth: 2,
					lineStyle: 'solid',
					lineEnd: 'none',
					pathMode: 'sharp'
				}
			}
		]

		let contextState: any = null

		function TestWrapper() {
			const context = usePlayContext()
			contextState = context.state
			return (
				<CanvasWithInitialData
					drawingState={defaultDrawingState}
					initialDrawings={initialDrawings}
				/>
			)
		}

		render(
			<SettingsProvider>
				<PlayProvider>
					<TestWrapper />
				</PlayProvider>
			</SettingsProvider>
		)

		await waitFor(() => {
			expect(eventBus.listenerCount('canvas:undo')).toBeGreaterThan(0)
			expect(contextState?.drawings?.length).toBe(1)
		})

		// User presses undo right after load
		await act(async () => {
			eventBus.emit('canvas:undo')
		})

		// Drawings should still exist
		await waitFor(() => {
			expect(contextState?.drawings?.length).toBe(1)
		})
	})

	test('undo should work after user makes a change', async () => {
		const initialPlayers = [
			{ id: 'p1', x: 100, y: 100, label: 'QB', color: '#FF0000' }
		]

		let contextState: any = null
		let setPlayers: any = null

		function TestWrapper() {
			const context = usePlayContext()
			contextState = context.state
			setPlayers = context.setPlayers
			return (
				<CanvasWithInitialData
					drawingState={defaultDrawingState}
					initialPlayers={initialPlayers}
				/>
			)
		}

		render(
			<SettingsProvider>
				<PlayProvider>
					<TestWrapper />
				</PlayProvider>
			</SettingsProvider>
		)

		await waitFor(() => {
			expect(eventBus.listenerCount('canvas:undo')).toBeGreaterThan(0)
			expect(contextState?.players?.length).toBe(1)
		})

		// User makes a change - adds another player
		await act(async () => {
			setPlayers([
				...contextState.players,
				{ id: 'p2', x: 200, y: 100, label: 'WR', color: '#0000FF' }
			])
		})

		// Wait for state to update
		await waitFor(() => {
			expect(contextState?.players?.length).toBe(2)
		})

		// Now undo should work and go back to 1 player
		await act(async () => {
			eventBus.emit('canvas:undo')
		})

		await waitFor(() => {
			expect(contextState?.players?.length).toBe(1)
		})
	})
})
