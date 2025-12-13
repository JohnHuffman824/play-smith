import { describe, test, expect, afterEach } from 'bun:test'
import { cleanup, render, fireEvent } from '@testing-library/react'
import { ConceptToolbar } from '../../../src/components/concepts/ConceptToolbar'
import { SettingsProvider } from '../../../src/contexts/SettingsContext'
import { PlayProvider } from '../../../src/contexts/PlayContext'

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
			<SettingsProvider>
				<PlayProvider>
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
				</PlayProvider>
			</SettingsProvider>
		)
	}

	test('should call onToolChange with "addPlayer" when add player button clicked', () => {
		let capturedTool: string | undefined
		const { container } = renderToolbar({
			onToolChange: (tool) => { capturedTool = tool }
		})

		// Find the add player button (second button - after select button)
		const buttons = container.querySelectorAll('button')
		// UserPlus icon is the second button in ConceptToolbar
		const addPlayerButton = buttons[1]

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
			<SettingsProvider>
				<PlayProvider>
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
				</PlayProvider>
			</SettingsProvider>
		)

		// Find the draw button (third button - after select and add player)
		const buttons = container.querySelectorAll('button')
		// Pencil icon is the third button in ConceptToolbar
		const drawButton = buttons[2]

		expect(drawButton).toBeTruthy()

		// First click - should open the dialog
		fireEvent.click(drawButton!)
		expect(showDrawOptions).toBe(true)

		// Re-render with updated state
		rerender(
			<SettingsProvider>
				<PlayProvider>
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
				</PlayProvider>
			</SettingsProvider>
		)

		// Second click - should close the dialog
		fireEvent.click(drawButton!)
		expect(showDrawOptions).toBe(false)
	})
})
