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
		) as typeof fetch
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

		// Check that it has the animation-dialog-wrapper class which applies the 98vw width via CSS
		// The CSS rule: .animation-dialog-wrapper { width: 98vw; max-width: none; }
		const hasCorrectClass = dialogContent.className.includes('animation-dialog-wrapper')
		expect(hasCorrectClass).toBe(true)

		// Verify it also has the base dialog-content class
		const hasDialogContentClass = dialogContent.className.includes('dialog-content')
		expect(hasDialogContentClass).toBe(true)
	})
})
