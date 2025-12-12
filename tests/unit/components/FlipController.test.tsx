import { describe, it, expect } from 'bun:test'
import { render, act } from '@testing-library/react'
import { FlipController } from '../../../src/components/concepts/FlipController'
import { PlayProvider, usePlayContext } from '../../../src/contexts/PlayContext'
import { SettingsProvider } from '../../../src/contexts/SettingsContext'
import type { Drawing } from '../../../src/types/drawing.types'
import { useState, useEffect, useCallback } from 'react'

// Helper component that can interact with PlayContext
function TestHarness() {
	const { state, setDrawings } = usePlayContext()
	const [flipFn, setFlipFn] = useState<(() => void) | null>(null)

	// Memoize the callback to prevent infinite loops
	const onFlipReady = useCallback((fn: () => void) => {
		setFlipFn(() => fn)
	}, [])

	// Expose state and flip function via data attributes for testing
	useEffect(() => {
		;(window as any).testHarness = {
			state,
			flipFn,
			setDrawings,
		}
	}, [state, flipFn, setDrawings])

	return (
		<div>
			<FlipController onFlipReady={onFlipReady} />
			<div data-testid="state">
				{JSON.stringify({
					playersCount: state.players.length,
					drawingsCount: state.drawings.length,
				})}
			</div>
		</div>
	)
}

describe('FlipController', () => {
	it('provides flip function that preserves drawings', () => {
		const { getByTestId } = render(
			<SettingsProvider>
				<PlayProvider>
					<TestHarness />
				</PlayProvider>
			</SettingsProvider>
		)

		// Helper to get fresh harness state
		const getHarness = () => (window as any).testHarness

		// Add a test drawing
		const testDrawing: Drawing = {
			id: 'd1',
			points: {
				p1: { id: 'p1', type: 'start', x: 60, y: 30 },
				p2: { id: 'p2', type: 'end', x: 70, y: 40 },
			},
			segments: [{ type: 'line', pointIds: ['p1', 'p2'] }],
			style: {
				color: '#FF0000',
				strokeWidth: 3,
				lineStyle: 'solid',
				lineEnd: 'arrow',
				pathMode: 'sharp',
			},
			annotations: [],
		}

		act(() => {
			getHarness().setDrawings([testDrawing])
		})

		// Verify drawing was added
		expect(getHarness().state.drawings).toHaveLength(1)
		expect(getHarness().state.drawings[0].id).toBe('d1')

		// Call flip function
		act(() => {
			const flipFn = getHarness().flipFn
			if (flipFn) {
				flipFn()
			}
		})

		// Verify drawing is still present (not disappeared!)
		expect(getHarness().state.drawings).toHaveLength(1)
		expect(getHarness().state.drawings[0].id).toBe('d1')

		// Verify coordinates were flipped
		// Original x: 60 → Flipped: 160 - 60 = 100
		expect(getHarness().state.drawings[0].points.p1.x).toBe(100)
		expect(getHarness().state.drawings[0].points.p2.x).toBe(90)
	})
})
