import { describe, test, expect, afterEach } from 'bun:test'
import { cleanup, render, fireEvent } from '@testing-library/react'
import { DrawingPropertiesDialog } from './DrawingPropertiesDialog'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { FieldCoordinateSystem } from '../../../utils/coordinates'
import type { Drawing } from '../../../types/drawing.types'

describe('DrawingPropertiesDialog - StrokeWidth Fix', () => {

	afterEach(() => {
		cleanup()
	})

	test('clicking thickness button should convert pixels to feet before calling onUpdate', () => {
		// After fix: dialog converts pixels to feet using coordSystem
		const coordSystem = new FieldCoordinateSystem(1600, 800)
		const scale = coordSystem.scale
		expect(scale).toBe(10)

		const drawing: Drawing = {
			id: 'test-drawing',
			points: {
				'p-0': { id: 'p-0', x: 10, y: 10, type: 'start' },
				'p-1': { id: 'p-1', x: 20, y: 20, type: 'end' },
			},
			segments: [{ type: 'line', pointIds: ['p-0', 'p-1'] }],
			style: {
				color: '#000000',
				strokeWidth: 0.3, // correctly stored in feet (3px / 10 scale)
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'sharp',
			},
		}

		let updatedStrokeWidth: number | undefined

		const onUpdate = (updates: Partial<typeof drawing.style>) => {
			if (updates.strokeWidth !== undefined) {
				updatedStrokeWidth = updates.strokeWidth
			}
		}

		const { getByText } = render(
			<SettingsProvider>
				<DrawingPropertiesDialog
					drawing={drawing}
					position={{ x: 100, y: 100 }}
					onUpdate={onUpdate}
					onClose={() => {}}
					coordSystem={coordSystem}
				/>
			</SettingsProvider>
		)

		// Click the "Medium" button (3 pixels)
		const mediumButton = getByText('Medium')
		fireEvent.click(mediumButton)

		// FIXED: Dialog now converts pixels to feet
		// 3 pixels / 10 scale = 0.3 feet
		expect(updatedStrokeWidth).toBe(0.3) // ✓ Correct!

		// Verify it will render correctly
		const renderedPixels = updatedStrokeWidth! * scale
		expect(renderedPixels).toBe(3) // ✓ 3 pixels as expected
	})

	test('all thickness buttons convert pixels to feet correctly', () => {
		const coordSystem = new FieldCoordinateSystem(1600, 800)
		const scale = coordSystem.scale
		expect(scale).toBe(10)

		const drawing: Drawing = {
			id: 'test',
			points: {},
			segments: [],
			style: {
				color: '#000000',
				strokeWidth: 0.3,
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'sharp',
			},
		}

		const updates: number[] = []
		const onUpdate = (update: Partial<typeof drawing.style>) => {
			if (update.strokeWidth !== undefined) {
				updates.push(update.strokeWidth)
			}
		}

		const { container } = render(
			<SettingsProvider>
				<DrawingPropertiesDialog
					drawing={drawing}
					position={{ x: 100, y: 100 }}
					onUpdate={onUpdate}
					onClose={() => {}}
					coordSystem={coordSystem}
				/>
			</SettingsProvider>
		)

		// Find buttons by their visual indicator (circle size) and label
		// The buttons are in a grid, and we can identify them by their size values
		const buttons = Array.from(container.querySelectorAll('button')).filter(btn =>
			btn.textContent === 'Thin' ||
			btn.textContent === 'Medium' ||
			btn.textContent === 'Thick' ||
			btn.textContent === 'Extra Thick'
		)

		expect(buttons.length).toBe(4)

		// Click all thickness buttons
		fireEvent.click(buttons.find(b => b.textContent === 'Thin')!)
		fireEvent.click(buttons.find(b => b.textContent === 'Medium')!)
		fireEvent.click(buttons.find(b => b.textContent === 'Thick')!)
		fireEvent.click(buttons.find(b => b.textContent === 'Extra Thick')!)

		// FIXED: Now converts pixels to feet correctly
		// [2/10, 3/10, 5/10, 7/10] = [0.2, 0.3, 0.5, 0.7] feet
		expect(updates).toEqual([0.2, 0.3, 0.5, 0.7]) // ✓ Correct!

		// Verify they render correctly
		const renderedPixels = updates.map(feet => feet * scale)
		expect(renderedPixels).toEqual([2, 3, 5, 7]) // ✓ Original pixel sizes
	})
})
