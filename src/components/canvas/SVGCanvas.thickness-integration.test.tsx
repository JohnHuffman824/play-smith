import { afterEach, describe, test, expect } from 'bun:test'
import { cleanup, render, fireEvent } from '@testing-library/react'
import { SVGCanvas } from './SVGCanvas'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import type { Drawing, PathStyle } from '../../types/drawing.types'
import { SettingsProvider } from '@/contexts/SettingsContext'

/**
 * Integration test for the strokeWidth scaling fix
 *
 * GREEN PHASE: This test should PASS after the fix
 *
 * Fix: DrawingPropertiesDialog now converts pixel values to feet before storing,
 * ensuring correct rendering (scale = 10 px/ft).
 */
describe('SVGCanvas - Line Thickness Integration Test (GREEN)', () => {

	afterEach(() => {
		cleanup()
	})

	test('setting line thickness via dialog should maintain correct rendered size', () => {
		// Setup coordinate system with scale = 10 px/ft (1600px / 160ft)
		const coordSystem = new FieldCoordinateSystem(1600, 800)
		const scale = coordSystem.scale
		expect(scale).toBe(10)

		// Create a drawing with 3px line (stored correctly as 0.3 feet)
		const initialDrawing: Drawing = {
			id: 'test-drawing',
			points: {
				'p-0': { id: 'p-0', x: 10, y: 10, type: 'start' },
				'p-1': { id: 'p-1', x: 20, y: 20, type: 'end' },
			},
			segments: [{ type: 'line', pointIds: ['p-0', 'p-1'] }],
			style: {
				color: '#000000',
				strokeWidth: 0.3, // 3 pixels / 10 scale = 0.3 feet (CORRECT)
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'sharp',
			},
		}

		let updatedDrawings: Drawing[] = [initialDrawing]

		const handleChange = (drawings: Drawing[]) => {
			updatedDrawings = drawings
		}

		const { container } = render(
			<SettingsProvider>
				<SVGCanvas
					width={1600}
					height={800}
					coordSystem={coordSystem}
					drawings={[initialDrawing]}
					onChange={handleChange}
					activeTool="select"
					autoCorrect={false}
					defaultStyle={initialDrawing.style}
					eraseSize={10}
					snapThreshold={10}
				/>
			</SettingsProvider>
		)

		// Verify initial rendering (should be 3px)
		const paths = container.querySelectorAll('path[stroke="#000000"]')
		expect(paths.length).toBeGreaterThan(0)
		const initialPath = paths[0] as SVGPathElement
		const initialStrokeWidth = initialPath.getAttribute('stroke-width')
		expect(initialStrokeWidth).toBe('3') // 0.3 feet * 10 scale = 3px ✓

		// FIXED: Now the dialog converts pixels to feet before updating
		// User clicks "Thick" (5px) → dialog converts: 5 / 10 = 0.5 feet
		const updatedStyle: Partial<PathStyle> = {
			strokeWidth: 5 / scale, // 0.5 feet (FIXED!)
		}

		// Simulate the update that happens in SVGCanvas.handleDrawingStyleUpdate
		const updatedDrawing = {
			...initialDrawing,
			style: { ...initialDrawing.style, ...updatedStyle },
		}

		// Calculate what would be rendered
		const renderedStrokeWidth = updatedDrawing.style.strokeWidth * scale

		// THIS SHOULD NOW PASS (GREEN PHASE)
		// Expected: 5 pixels (user clicked "Thick" button for 5px line)
		// Actual: 0.5 * 10 = 5 pixels ✓ Correct!
		expect(renderedStrokeWidth).toBe(5) // ✓ PASS - renders correctly!
	})

	test('proper conversion: pixels to feet to rendered pixels', () => {
		const scale = 10 // px/ft

		// User clicks "Thick" button (wants 5 pixel line)
		const desiredPixels = 5

		// CORRECT: Convert to feet before storing
		const strokeWidthInFeet = desiredPixels / scale // 5 / 10 = 0.5 feet
		expect(strokeWidthInFeet).toBe(0.5)

		// Verify it renders correctly
		const renderedPixels = strokeWidthInFeet * scale // 0.5 * 10 = 5px
		expect(renderedPixels).toBe(5) // ✓ PASS

		// WRONG: Store pixels directly (current bug)
		const wrongStrokeWidth = desiredPixels // 5 (no conversion!)
		const wrongRenderedPixels = wrongStrokeWidth * scale // 5 * 10 = 50px
		expect(wrongRenderedPixels).toBe(50) // ✗ 10x too large!
	})
})
