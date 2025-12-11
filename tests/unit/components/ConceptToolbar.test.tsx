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
					showDrawOptions={false}
					onShowDrawOptionsChange={() => {}}
					lineStyle="solid"
					lineEnd="arrow"
					brushSize={3}
					pathMode="sharp"
					onLineStyleChange={() => {}}
					onLineEndChange={() => {}}
					onBrushSizeChange={() => {}}
					onPathModeChange={() => {}}
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

describe('ConceptToolbar - Draw Options Integration', () => {
	afterEach(() => {
		cleanup()
	})

	test('clicking draw button twice toggles DrawOptionsDialog', () => {
		let showDrawOptions = false
		const { container, rerender } = render(
			<ThemeProvider>
				<ConceptToolbar
					selectedTool="draw"
					onToolChange={() => {}}
					color="#000000"
					onColorChange={() => {}}
					hashAlignment="middle"
					onHashAlignmentChange={() => {}}
					showColorPicker={false}
					onShowColorPickerChange={() => {}}
					showDrawOptions={showDrawOptions}
					onShowDrawOptionsChange={(show) => {
						showDrawOptions = show
					}}
					lineStyle="solid"
					lineEnd="arrow"
					brushSize={3}
					pathMode="sharp"
					onLineStyleChange={() => {}}
					onLineEndChange={() => {}}
					onBrushSizeChange={() => {}}
					onPathModeChange={() => {}}
				/>
			</ThemeProvider>
		)

		// Find the draw button
		const drawButton = Array.from(container.querySelectorAll('button')).find(btn =>
			btn.getAttribute('aria-label')?.includes('Draw')
		)

		expect(drawButton).toBeTruthy()

		// First click - should open the dialog
		fireEvent.click(drawButton!)
		expect(showDrawOptions).toBe(true)

		// Re-render with updated state
		rerender(
			<ThemeProvider>
				<ConceptToolbar
					selectedTool="draw"
					onToolChange={() => {}}
					color="#000000"
					onColorChange={() => {}}
					hashAlignment="middle"
					onHashAlignmentChange={() => {}}
					showColorPicker={false}
					onShowColorPickerChange={() => {}}
					showDrawOptions={showDrawOptions}
					onShowDrawOptionsChange={(show) => {
						showDrawOptions = show
					}}
					lineStyle="solid"
					lineEnd="arrow"
					brushSize={3}
					pathMode="sharp"
					onLineStyleChange={() => {}}
					onLineEndChange={() => {}}
					onBrushSizeChange={() => {}}
					onPathModeChange={() => {}}
				/>
			</ThemeProvider>
		)

		// Second click - should close the dialog
		fireEvent.click(drawButton!)
		expect(showDrawOptions).toBe(false)
	})
})
