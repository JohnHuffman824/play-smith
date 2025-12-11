import { describe, test, expect, afterEach } from 'bun:test'
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react'
import { ConceptDialog } from '../../../src/components/concepts/ConceptDialog'
import { ThemeProvider } from '../../../src/contexts/ThemeContext'

describe('ConceptDialog - Draw Options', () => {
	afterEach(() => {
		cleanup()
	})

	function renderDialog() {
		return render(
			<ThemeProvider>
				<ConceptDialog
					isOpen={true}
					onClose={() => {}}
					mode="create"
					teamId="team-1"
					onSave={async () => {}}
				/>
			</ThemeProvider>
		)
	}

	test('should show DrawOptionsDialog when draw tool is clicked', async () => {
		const { container, getByText } = renderDialog()

		// Find and click the draw button
		const buttons = container.querySelectorAll('button')
		const drawButton = Array.from(buttons).find(btn =>
			btn.getAttribute('aria-label')?.includes('Draw')
		)

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
		const buttons = container.querySelectorAll('button')
		const drawButton = Array.from(buttons).find(btn =>
			btn.getAttribute('aria-label')?.includes('Draw')
		)
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

		// Verify solid is initially selected (default)
		expect(solidButton!.classList.contains('bg-blue-500')).toBe(true)
		expect(dashedButton!.classList.contains('bg-blue-500')).toBe(false)

		// Click the dashed button
		fireEvent.click(dashedButton!)

		// After clicking, the dashed button should be selected and solid should not
		await waitFor(() => {
			expect(dashedButton!.classList.contains('bg-blue-500')).toBe(true)
			expect(solidButton!.classList.contains('bg-blue-500')).toBe(false)
		})
	})

	test('should update line end when arrow button clicked', async () => {
		const { container, getByText } = renderDialog()

		// Click draw button
		const drawButton = Array.from(container.querySelectorAll('button')).find(btn =>
			btn.getAttribute('aria-label')?.includes('Draw')
		)
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

		// Arrow should be selected initially
		expect(arrowButton!.classList.contains('bg-blue-500')).toBe(true)

		// Click none button
		fireEvent.click(noneButton!)

		// None should now be selected
		await waitFor(() => {
			expect(noneButton!.classList.contains('bg-blue-500')).toBe(true)
			expect(arrowButton!.classList.contains('bg-blue-500')).toBe(false)
		})

		// Click arrow button again
		fireEvent.click(arrowButton!)

		// Arrow should be selected again
		await waitFor(() => {
			expect(arrowButton!.classList.contains('bg-blue-500')).toBe(true)
			expect(noneButton!.classList.contains('bg-blue-500')).toBe(false)
		})
	})
})
