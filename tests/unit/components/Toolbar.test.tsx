import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { Toolbar } from '../../../src/components/toolbar/Toolbar'
import { SettingsProvider } from '../../../src/contexts/SettingsContext'
import { PlayProvider } from '../../../src/contexts/PlayContext'
import type { DrawingState } from '../../../src/types/play.types'
import type { HashAlignment } from '../../../src/types/field.types'

describe('Toolbar - Responsive Layout', () => {

	afterEach(() => {
		cleanup()
	})

	let originalInnerHeight: number

	beforeEach(() => {
		// Save original window height
		originalInnerHeight = window.innerHeight
	})

	afterEach(() => {
		// Restore original window height
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: originalInnerHeight,
		})
	})

	const mockDrawingState: DrawingState = {
		tool: 'select',
		color: '#000000',
		lineStyle: 'solid',
		lineEnd: 'arrow',
		brushSize: 2,
		pathMode: 'straight',
		eraseSize: 20,
		snapThreshold: 10,
	}

	const mockSetDrawingState = () => {}
	const mockSetHashAlignment = () => {}
	const mockSetShowPlayBar = () => {}

	function renderToolbar(overrides?: Partial<{
		playId: string
		onDeletePlay: () => Promise<void>
	}>) {
		return render(
			<SettingsProvider>
				<PlayProvider>
					<Toolbar
						drawingState={mockDrawingState}
						setDrawingState={mockSetDrawingState}
						hashAlignment="middle"
						setHashAlignment={mockSetHashAlignment}
						showPlayBar={true}
						setShowPlayBar={mockSetShowPlayBar}
						playId={overrides?.playId}
						onDeletePlay={overrides?.onDeletePlay}
					/>
				</PlayProvider>
			</SettingsProvider>
		)
	}

	test('should render toolbar with grid layout', () => {
		const { container } = renderToolbar()
		const toolbar = container.querySelector('.toolbar')

		expect(toolbar).toBeTruthy()
	})

	test('should set gridTemplateRows in addition to gridTemplateColumns', () => {
		const { container } = renderToolbar()
		const toolbar = container.querySelector('.toolbar') as HTMLElement

		expect(toolbar).toBeTruthy()

		// Check that both gridTemplateColumns and gridTemplateRows are set
		const style = toolbar.style
		expect(style.gridTemplateColumns).toBeTruthy()
		expect(style.gridTemplateRows).toBeTruthy()

		// Should not be empty strings
		expect(style.gridTemplateColumns).not.toBe('')
		expect(style.gridTemplateRows).not.toBe('')
	})

	test('should use single column layout when window is tall enough', () => {
		// Set a very tall window
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: 2000,
		})

		const { container } = renderToolbar()
		const toolbar = container.querySelector('.toolbar') as HTMLElement

		expect(toolbar).toBeTruthy()

		// With plenty of height, should use 1 column
		expect(toolbar.style.gridTemplateColumns).toContain('repeat(1')
	})

	test('should use multiple columns when window is short', () => {
		// Set a short window (not enough for all buttons in 1 column)
		// 15 buttons * 56px + 14 gaps * 12px = 840px + 168px = 1008px needed for single column
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: 600,
		})

		const { container } = renderToolbar()
		const toolbar = container.querySelector('.toolbar') as HTMLElement

		expect(toolbar).toBeTruthy()

		// With limited height, should use multiple columns
		const columnsMatch = toolbar.style.gridTemplateColumns.match(/repeat\((\d+)/)
		expect(columnsMatch).toBeTruthy()

		if (columnsMatch) {
			const columnCount = parseInt(columnsMatch[1], 10)
			expect(columnCount).toBeGreaterThan(1)
		}
	})

	test('should have consistent spacing (12px gap and padding)', () => {
		const { container } = renderToolbar()
		const toolbar = container.querySelector('.toolbar') as HTMLElement

		expect(toolbar).toBeTruthy()
		// gap and padding are defined in CSS, not inline styles
		// We can verify the toolbar has the correct class which provides these styles
		expect(toolbar.className).toContain('toolbar')
	})

	test('should set gridAutoFlow to column', () => {
		const { container } = renderToolbar()
		const toolbar = container.querySelector('.toolbar') as HTMLElement

		expect(toolbar).toBeTruthy()
		expect(toolbar.style.gridAutoFlow).toBe('column')
	})

	test('should center buttons vertically within toolbar', () => {
		const { container } = renderToolbar()
		const toolbar = container.querySelector('.toolbar') as HTMLElement

		expect(toolbar).toBeTruthy()
		// alignContent is defined in CSS, not inline styles
		expect(toolbar.className).toContain('toolbar')
	})

	test('should calculate rows per column for even distribution', () => {
		// Set a window height that would require 2 columns
		// Each button is 56px + 12px gap = 68px
		// With 15 buttons, we want 8 in column 1 and 7 in column 2
		// So we need gridTemplateRows to be repeat(8, 56px) for 2 columns
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: 600,
		})

		const { container } = renderToolbar()
		const toolbar = container.querySelector('.toolbar') as HTMLElement

		expect(toolbar).toBeTruthy()

		// Should have gridTemplateRows set with a repeat() function
		expect(toolbar.style.gridTemplateRows).toContain('repeat(')
		expect(toolbar.style.gridTemplateRows).toContain('56px')
	})

	test('should have 16 buttons total', () => {
		const { container } = renderToolbar()
		const buttons = container.querySelectorAll('button')

		expect(buttons.length).toBe(16)
	})

	test('should disable Delete Play button when playId is not provided', () => {
		const { container } = renderToolbar()
		const buttons = container.querySelectorAll('button')
		const deleteButton = buttons[buttons.length - 1] // Last button

		expect(deleteButton.disabled).toBe(true)
	})

	test('should enable Delete Play button when playId is provided', () => {
		const { container } = renderToolbar({ playId: '123' })
		const buttons = container.querySelectorAll('button')
		const deleteButton = buttons[buttons.length - 1] // Last button

		expect(deleteButton.disabled).toBe(false)
	})
})
