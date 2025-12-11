import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { Toolbar } from '../../../src/components/toolbar/Toolbar'
import { ThemeProvider } from '../../../src/contexts/ThemeContext'
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
			<ThemeProvider>
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
			</ThemeProvider>
		)
	}

	test('should render toolbar with grid layout', () => {
		const { container } = renderToolbar()
		const toolbar = container.querySelector('div[style*="display: grid"]')

		expect(toolbar).toBeTruthy()
	})

	test('should set gridTemplateRows in addition to gridTemplateColumns', () => {
		const { container } = renderToolbar()
		const toolbar = container.querySelector('div[style*="display: grid"]') as HTMLElement

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
		const toolbar = container.querySelector('div[style*="display: grid"]') as HTMLElement

		expect(toolbar).toBeTruthy()

		// With plenty of height, should use 1 column
		expect(toolbar.style.gridTemplateColumns).toContain('repeat(1')
	})

	test('should use multiple columns when window is short', () => {
		// Set a short window (not enough for all buttons in 1 column)
		// 13 buttons * 56px + 12 gaps * 12px = 728px + 144px = 872px needed for single column
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: 600,
		})

		const { container } = renderToolbar()
		const toolbar = container.querySelector('div[style*="display: grid"]') as HTMLElement

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
		const toolbar = container.querySelector('div[style*="display: grid"]') as HTMLElement

		expect(toolbar).toBeTruthy()
		expect(toolbar.style.gap).toBe('12px')
		expect(toolbar.style.padding).toBe('12px')
	})

	test('should set gridAutoFlow to column', () => {
		const { container } = renderToolbar()
		const toolbar = container.querySelector('div[style*="display: grid"]') as HTMLElement

		expect(toolbar).toBeTruthy()
		expect(toolbar.style.gridAutoFlow).toBe('column')
	})

	test('should center buttons vertically within toolbar', () => {
		const { container } = renderToolbar()
		const toolbar = container.querySelector('div[style*="display: grid"]') as HTMLElement

		expect(toolbar).toBeTruthy()
		expect(toolbar.style.alignContent).toBe('center')
	})

	test('should calculate rows per column for even distribution', () => {
		// Set a window height that would require 2 columns
		// Each button is 56px + 12px gap = 68px
		// With 14 buttons, we want 7 in each column
		// So we need gridTemplateRows to be repeat(7, 56px) for 2 columns
		Object.defineProperty(window, 'innerHeight', {
			writable: true,
			configurable: true,
			value: 600,
		})

		const { container } = renderToolbar()
		const toolbar = container.querySelector('div[style*="display: grid"]') as HTMLElement

		expect(toolbar).toBeTruthy()

		// Should have gridTemplateRows set with a repeat() function
		expect(toolbar.style.gridTemplateRows).toContain('repeat(')
		expect(toolbar.style.gridTemplateRows).toContain('56px')
	})

	test('should have 14 buttons total', () => {
		const { container } = renderToolbar()
		const buttons = container.querySelectorAll('button')

		expect(buttons.length).toBe(14)
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
