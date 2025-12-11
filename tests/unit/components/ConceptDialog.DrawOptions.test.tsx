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
})
