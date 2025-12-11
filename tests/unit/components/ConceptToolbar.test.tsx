import { describe, test, expect, afterEach } from 'bun:test'
import { cleanup, render, fireEvent } from '@testing-library/react'
import { ConceptToolbar } from '../../../src/components/concepts/ConceptToolbar'
import { ThemeProvider } from '../../../src/contexts/ThemeContext'

describe('ConceptToolbar - Add Player Tool', () => {
	afterEach(() => {
		cleanup()
	})

	function renderToolbar(overrides?: {
		selectedTool?: string
		onToolChange?: (tool: string) => void
	}) {
		const mockOnToolChange = overrides?.onToolChange ?? (() => {})
		return render(
			<ThemeProvider>
				<ConceptToolbar
					selectedTool={overrides?.selectedTool ?? 'select'}
					onToolChange={mockOnToolChange}
					color="#000000"
					onColorChange={() => {}}
					hashAlignment="middle"
					onHashAlignmentChange={() => {}}
					showColorPicker={false}
					onShowColorPickerChange={() => {}}
				/>
			</ThemeProvider>
		)
	}

	test('should call onToolChange with "addPlayer" when add player button clicked', () => {
		let capturedTool: string | undefined
		const { container } = renderToolbar({
			onToolChange: (tool) => { capturedTool = tool }
		})

		// Find the add player button (second button in TOOLS array)
		const buttons = container.querySelectorAll('button')
		const addPlayerButton = Array.from(buttons).find(btn =>
			btn.getAttribute('aria-label')?.includes('Add Player')
		)

		expect(addPlayerButton).toBeTruthy()
		fireEvent.click(addPlayerButton!)

		// Must be 'addPlayer' (camelCase) to match Canvas.tsx TOOL_ADD_PLAYER constant
		expect(capturedTool).toBe('addPlayer')
	})
})
