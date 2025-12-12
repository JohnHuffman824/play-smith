import { describe, test, expect, afterEach } from 'bun:test'
import { cleanup, render, fireEvent } from '@testing-library/react'
import { DrawingPropertiesDialog } from './DrawingPropertiesDialog'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { FieldCoordinateSystem } from '../../../utils/coordinates'
import type { Drawing } from '../../../types/drawing.types'

/**
 * TDD RED: Tests for white color in drawing properties dialog
 *
 * Requirement:
 * - White (#FFFFFF) should be available as one of the color presets
 */
describe('DrawingPropertiesDialog - White Color Preset', () => {

	afterEach(() => {
		cleanup()
	})

	const coordSystem = new FieldCoordinateSystem(1600, 800)

	const mockDrawing: Drawing = {
		id: 'test-drawing',
		points: {
			'p-0': { id: 'p-0', x: 10, y: 10, type: 'start' },
			'p-1': { id: 'p-1', x: 20, y: 20, type: 'end' },
		},
		segments: [{ type: 'line', pointIds: ['p-0', 'p-1'] }],
		style: {
			color: '#000000',
			strokeWidth: 0.3,
			lineStyle: 'solid',
			lineEnd: 'none',
			pathMode: 'sharp',
		},
	}

	test('white color button exists in color palette', () => {
		const { container } = render(
			<SettingsProvider>
				<DrawingPropertiesDialog
					drawing={mockDrawing}
					position={{ x: 100, y: 100 }}
					onUpdate={() => {}}
					onClose={() => {}}
					coordSystem={coordSystem}
				/>
			</SettingsProvider>
		)

		// Find all color buttons by looking for buttons with background-color style
		const colorButtons = Array.from(
			container.querySelectorAll('button[style*="background-color"]')
		) as HTMLElement[]

		expect(colorButtons.length).toBeGreaterThan(0)

		// Check if white color (#FFFFFF or rgb(255, 255, 255)) exists
		const whiteButton = colorButtons.find(btn => {
			const bgColor = btn.style.backgroundColor
			// Match #FFFFFF or rgb(255, 255, 255) or white
			return (
				bgColor === '#FFFFFF' ||
				bgColor === 'rgb(255, 255, 255)' ||
				bgColor === 'white' ||
				btn.getAttribute('style')?.includes('#FFFFFF')
			)
		})

		expect(whiteButton).toBeDefined()
	})

	test('clicking white color button updates drawing color to white', () => {
		let updatedColor: string | undefined

		const { container } = render(
			<SettingsProvider>
				<DrawingPropertiesDialog
					drawing={mockDrawing}
					position={{ x: 100, y: 100 }}
					onUpdate={(updates) => {
						if (updates.color) {
							updatedColor = updates.color
						}
					}}
					onClose={() => {}}
					coordSystem={coordSystem}
				/>
			</SettingsProvider>
		)

		// Find white color button
		const colorButtons = Array.from(
			container.querySelectorAll('button[style*="background-color"]')
		) as HTMLElement[]

		const whiteButton = colorButtons.find(btn => {
			const bgColor = btn.style.backgroundColor
			return (
				bgColor === '#FFFFFF' ||
				bgColor === 'rgb(255, 255, 255)' ||
				bgColor === 'white' ||
				btn.getAttribute('style')?.includes('#FFFFFF')
			)
		})

		expect(whiteButton).toBeDefined()

		// Click the white button
		fireEvent.click(whiteButton!)

		// Should update color to white
		expect(updatedColor).toBe('#FFFFFF')
	})

	test('white color is distinct from other colors in palette', () => {
		const { container } = render(
			<SettingsProvider>
				<DrawingPropertiesDialog
					drawing={mockDrawing}
					position={{ x: 100, y: 100 }}
					onUpdate={() => {}}
					onClose={() => {}}
					coordSystem={coordSystem}
				/>
			</SettingsProvider>
		)

		const colorButtons = Array.from(
			container.querySelectorAll('button[style*="background-color"]')
		) as HTMLElement[]

		// Extract all background colors
		const colors = colorButtons.map(btn => {
			const style = btn.getAttribute('style') || ''
			const match = style.match(/background-color:\s*([^;]+)/)
			return match ? match[1].trim() : ''
		})

		// Should have no duplicate colors
		const uniqueColors = new Set(colors)
		expect(uniqueColors.size).toBe(colors.length)

		// White should be one of them
		const hasWhite = colors.some(color =>
			color === '#FFFFFF' ||
			color === 'rgb(255, 255, 255)' ||
			color === 'white'
		)
		expect(hasWhite).toBe(true)
	})

	test('color palette includes both black and white', () => {
		const { container } = render(
			<SettingsProvider>
				<DrawingPropertiesDialog
					drawing={mockDrawing}
					position={{ x: 100, y: 100 }}
					onUpdate={() => {}}
					onClose={() => {}}
					coordSystem={coordSystem}
				/>
			</SettingsProvider>
		)

		const colorButtons = Array.from(
			container.querySelectorAll('button[style*="background-color"]')
		) as HTMLElement[]

		const colors = colorButtons.map(btn => {
			const style = btn.getAttribute('style') || ''
			const match = style.match(/background-color:\s*([^;]+)/)
			return match ? match[1].trim() : ''
		})

		// Should have black
		const hasBlack = colors.some(color =>
			color === '#000000' ||
			color === 'rgb(0, 0, 0)' ||
			color === 'black'
		)
		expect(hasBlack).toBe(true)

		// Should have white
		const hasWhite = colors.some(color =>
			color === '#FFFFFF' ||
			color === 'rgb(255, 255, 255)' ||
			color === 'white'
		)
		expect(hasWhite).toBe(true)
	})
})
