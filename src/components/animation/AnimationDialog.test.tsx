import { describe, test, expect, afterEach, beforeEach, vi } from 'bun:test'
import { cleanup, render, waitFor } from '@testing-library/react'
import { AnimationDialog } from './AnimationDialog'

describe('AnimationDialog - Width', () => {
	beforeEach(() => {
		// Mock fetch to avoid API calls
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				json: () => Promise.resolve({
					play: {
						id: 'test-play',
						name: 'Test Play',
						players: [],
						drawings: [],
					}
				}),
			} as Response)
		)
	})

	afterEach(() => {
		cleanup()
		vi.restoreAllMocks()
	})

	test('dialog should be 98vw wide to fill screen with minimal spacing', async () => {
		render(
			<AnimationDialog
				isOpen={true}
				onClose={() => {}}
				playId="test-play"
				playName="Test Play"
			/>
		)

		// Dialog renders to document.body via portal
		// Wait for the dialog to appear in the DOM
		const dialogContent = await waitFor(() => {
			const dialog = document.querySelector('[role="dialog"]')
			if (!dialog) throw new Error('Dialog not found')
			return dialog
		})

		// Check that it has the w-[98vw] class and no max-width restrictions
		const hasCorrectWidth = dialogContent.className.includes('w-[98vw]')
		expect(hasCorrectWidth).toBe(true)

		// Ensure the default sm:max-w-lg is not present
		const hasNoSmallMaxWidth = !dialogContent.className.includes('sm:max-w-lg')
		expect(hasNoSmallMaxWidth).toBe(true)
	})
})
