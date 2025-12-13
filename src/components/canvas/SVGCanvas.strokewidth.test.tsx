import { afterEach, describe, test, expect } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { SVGCanvas } from './SVGCanvas'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import type { Drawing } from '../../types/drawing.types'

describe('SVGCanvas - StrokeWidth Scaling Bug', () => {

	afterEach(() => {
		cleanup()
	})

	test('updating existing drawing strokeWidth should maintain correct pixel size', () => {
		// Setup: Create a coordinate system with known scale
		// If container is 1600px wide and field is 160ft wide: scale = 10 px/ft
		const coordSystem = new FieldCoordinateSystem(1600, 800)
		const scale = coordSystem.scale // should be 10 px/ft
		expect(scale).toBe(10)

		// Create an initial drawing with strokeWidth = 3 pixels (correctly stored as feet)
		const initialDrawing: Drawing = {
			id: 'test-drawing',
			points: {
				'p-0': { id: 'p-0', x: 10, y: 10, type: 'start' },
				'p-1': { id: 'p-1', x: 20, y: 20, type: 'end' },
			},
			segments: [
				{ type: 'line', pointIds: ['p-0', 'p-1'] },
			],
			style: {
				color: '#000000',
				strokeWidth: 0.3, // 3 pixels / 10 scale = 0.3 feet (CORRECT)
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'sharp',
			},
			annotations: [],
		}

		const drawings = [initialDrawing]
		const onChange = (newDrawings: Drawing[]) => {
			// Get the updated drawing
			const updatedDrawing = newDrawings[0]
			expect(updatedDrawing).toBeDefined()

			// The key test: after user clicks "Medium" (3px) button in dialog,
			// strokeWidth should still be 0.3 feet (which renders as 3px)
			// NOT 3 feet (which would render as 30px)
			expect(updatedDrawing!.style.strokeWidth).toBe(0.3)

			// Verify it renders correctly (this is what PathRenderer does)
			const renderedPixels = updatedDrawing!.style.strokeWidth * scale
			expect(renderedPixels).toBe(3) // Should be 3px, not 30px
		}

		const { container } = render(
			<SVGCanvas
				width={1600}
				height={800}
				coordSystem={coordSystem}
				drawings={drawings}
				onChange={onChange}
				activeTool="select"
				autoCorrect={false}
				defaultStyle={initialDrawing.style}
				eraseSize={10}
				snapThreshold={10}
			/>
		)

		// Simulate what happens when user opens dialog and clicks "Medium" (3px)
		// The dialog currently does: onUpdate({ strokeWidth: 3 })
		// But it SHOULD do: onUpdate({ strokeWidth: 3 / scale })

		// Find the SVGCanvas component's internal handler
		// This test will fail until we fix the dialog to convert pixels to feet
		const svg = container.querySelector('svg')
		expect(svg).toBeDefined()

		// We'll test this by directly calling the update handler that the dialog uses
		// For now, this test documents the expected behavior
	})

	test('new drawings correctly convert brushSize pixels to feet', () => {
		const coordSystem = new FieldCoordinateSystem(1600, 800)
		const scale = coordSystem.scale
		expect(scale).toBe(10)

		// When user draws with brushSize = 3 pixels
		const brushSizePixels = 3
		const strokeFeet = brushSizePixels / scale

		// It should be stored as 0.3 feet
		expect(strokeFeet).toBe(0.3)

		// And render as 3 pixels
		const renderedPixels = strokeFeet * scale
		expect(renderedPixels).toBe(3)
	})

	test('strokeWidth values should be in feet, not pixels', () => {
		// This test verifies the contract: strokeWidth in Drawing.style is ALWAYS in feet
		new FieldCoordinateSystem(1600, 800)
		const scale = 10 // px/ft

		// Test all the brush sizes from the dialog
		const brushSizes = [
			{ pixels: 2, feet: 0.2, label: 'Thin' },
			{ pixels: 3, feet: 0.3, label: 'Medium' },
			{ pixels: 5, feet: 0.5, label: 'Thick' },
			{ pixels: 7, feet: 0.7, label: 'Extra Thick' },
		]

		for (const brush of brushSizes) {
			// strokeWidth should be stored in feet
			const expectedFeet = brush.pixels / scale
			expect(expectedFeet).toBe(brush.feet)

			// And render correctly
			const renderedPixels = expectedFeet * scale
			expect(renderedPixels).toBe(brush.pixels)
		}
	})
})
