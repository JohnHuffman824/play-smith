import { describe, test, expect, afterEach } from 'bun:test'
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react'
import { ConceptDialog } from '../../../src/components/concepts/ConceptDialog'
import { SettingsProvider } from '../../../src/contexts/SettingsContext'

describe('ConceptDialog - Draw Options', () => {
	afterEach(() => {
		cleanup()
	})

	function renderDialog() {
		return render(
			<SettingsProvider>
				<ConceptDialog
					isOpen={true}
					onClose={() => {}}
					mode="create"
					teamId="team-1"
					onSave={async () => {}}
				/>
			</SettingsProvider>
		)
	}

	test('should show DrawOptionsDialog when draw tool is clicked', async () => {
		const { container, getByText } = renderDialog()

		// Find and click the draw button - it's a ToolbarButton with Pencil icon
		// Look for button with data-active attribute that's part of toolbar
		const buttons = container.querySelectorAll('.toolbar-button')
		const drawButton = Array.from(buttons)[2] // Select=0, AddPlayer=1, Draw=2

		expect(drawButton).toBeTruthy()
		fireEvent.click(drawButton!)

		// DrawOptionsDialog should appear with "Line Style" label
		await waitFor(() => {
			expect(getByText('Line Style')).toBeTruthy()
		})
	})

	test('should update line style when dashed button clicked in DrawOptionsDialog', async () => {
		const { container, getByText } = renderDialog()

		// Click draw button to open dialog
		const buttons = container.querySelectorAll('.toolbar-button')
		const drawButton = Array.from(buttons)[2] // Draw button is 3rd toolbar button
		fireEvent.click(drawButton!)

		// Wait for dialog to appear
		await waitFor(() => {
			expect(getByText('Line Style')).toBeTruthy()
		})

		// Find the DrawOptionsDialog container
		const drawDialog = container.querySelector('[data-draw-dialog]')
		expect(drawDialog).toBeTruthy()

		// Find all buttons within the dialog
		const lineStyleButtons = drawDialog!.querySelectorAll('button')
		// 0: close, 1-2: path mode (sharp, curve), 3-4: line style (solid, dashed)
		const solidButton = lineStyleButtons[3]
		const dashedButton = lineStyleButtons[4]

		// Verify solid is initially selected (default) using data-active attribute
		expect(solidButton!.getAttribute('data-active')).toBe('true')
		expect(dashedButton!.getAttribute('data-active')).toBe('false')

		// Click the dashed button
		fireEvent.click(dashedButton!)

		// After clicking, the dashed button should be selected and solid should not
		await waitFor(() => {
			expect(dashedButton!.getAttribute('data-active')).toBe('true')
			expect(solidButton!.getAttribute('data-active')).toBe('false')
		})
	})

	test('should update line end when arrow button clicked', async () => {
		const { container, getByText } = renderDialog()

		// Click draw button
		const drawButton = Array.from(container.querySelectorAll('.toolbar-button'))[2]
		fireEvent.click(drawButton!)

		await waitFor(() => {
			expect(getByText('Line End')).toBeTruthy()
		})

		// Find the DrawOptionsDialog container
		const drawDialog = container.querySelector('[data-draw-dialog]')
		expect(drawDialog).toBeTruthy()

		// Arrow button is the default, so let's test clicking the 'none' button
		// and then back to arrow
		const lineEndButtons = drawDialog!.querySelectorAll('button')
		// 0: close, 1-2: path mode, 3-4: line style, 5-7: line end (none, arrow, tShape)
		const noneButton = lineEndButtons[5]
		const arrowButton = lineEndButtons[6]

		// Arrow should be selected initially using data-active attribute
		expect(arrowButton!.getAttribute('data-active')).toBe('true')

		// Click none button
		fireEvent.click(noneButton!)

		// None should now be selected
		await waitFor(() => {
			expect(noneButton!.getAttribute('data-active')).toBe('true')
			expect(arrowButton!.getAttribute('data-active')).toBe('false')
		})

		// Click arrow button again
		fireEvent.click(arrowButton!)

		// Arrow should be selected again
		await waitFor(() => {
			expect(arrowButton!.getAttribute('data-active')).toBe('true')
			expect(noneButton!.getAttribute('data-active')).toBe('false')
		})
	})
})
