import { afterEach, describe, test, expect } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { SVGCanvas } from './SVGCanvas'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import { SettingsProvider } from '../../contexts/SettingsContext'
import type { Drawing } from '../../types/drawing.types'

describe('SVGCanvas - Control Node Visibility', () => {

	afterEach(() => {
		cleanup()
	})

	const mockCoordSystem = new FieldCoordinateSystem(800, 400)
	const mockOnChange = () => {}

	const drawing1: Drawing = {
		id: 'drawing-1',
		points: {
			'p1': { id: 'p1', x: 10, y: 10, type: 'corner' },
			'p2': { id: 'p2', x: 20, y: 20, type: 'corner' },
		},
		segments: [
			{
				type: 'line',
				pointIds: ['p1', 'p2'],
			},
		],
		style: { color: '#ff0000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' },
		annotations: [],
	}

	const drawing2: Drawing = {
		id: 'drawing-2',
		points: {
			'p3': { id: 'p3', x: 30, y: 30, type: 'corner' },
			'p4': { id: 'p4', x: 40, y: 40, type: 'corner' },
		},
		segments: [
			{
				type: 'line',
				pointIds: ['p3', 'p4'],
			},
		],
		style: { color: '#00ff00', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' },
		annotations: [],
	}

	test('shows control nodes for all drawings when SELECT tool is active and hovering', () => {
		const { container } = render(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={[drawing1, drawing2]}
					onChange={mockOnChange}
					activeTool="select"
					autoCorrect={false}
					defaultStyle={{ color: '#000000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' }}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={['drawing-1', 'drawing-2']}
				/>
			</SettingsProvider>
		)

		// Should render control nodes (circles) for ALL drawings, not just one
		// drawing1 has 2 points (p1, p2) and drawing2 has 2 points (p3, p4)
		// Total: 4 control nodes should be visible
		const controlNodes = container.querySelectorAll('circle[r="6"]')

		expect(controlNodes.length).toBe(4)
	})

	test('shows control nodes for drawing1 points', () => {
		const { container } = render(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={[drawing1, drawing2]}
					onChange={mockOnChange}
					activeTool="select"
					autoCorrect={false}
					defaultStyle={{ color: '#000000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' }}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={['drawing-1', 'drawing-2']}
				/>
			</SettingsProvider>
		)

		// Verify nodes exist at the pixel positions for drawing1's points
		const p1Pixel = mockCoordSystem.feetToPixels(10, 10)
		const p2Pixel = mockCoordSystem.feetToPixels(20, 20)

		const controlNodes = container.querySelectorAll('circle[r="6"]')
		const nodePositions = Array.from(controlNodes).map(node => ({
			cx: parseFloat(node.getAttribute('cx') || '0'),
			cy: parseFloat(node.getAttribute('cy') || '0'),
		}))

		// Should find nodes at drawing1's positions
		expect(nodePositions.some(pos =>
			Math.abs(pos.cx - p1Pixel.x) < 1 && Math.abs(pos.cy - p1Pixel.y) < 1
		)).toBe(true)
		expect(nodePositions.some(pos =>
			Math.abs(pos.cx - p2Pixel.x) < 1 && Math.abs(pos.cy - p2Pixel.y) < 1
		)).toBe(true)
	})

	test('shows control nodes for drawing2 points', () => {
		const { container } = render(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={[drawing1, drawing2]}
					onChange={mockOnChange}
					activeTool="select"
					autoCorrect={false}
					defaultStyle={{ color: '#000000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' }}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={['drawing-1', 'drawing-2']}
				/>
			</SettingsProvider>
		)

		// Verify nodes exist at the pixel positions for drawing2's points
		const p3Pixel = mockCoordSystem.feetToPixels(30, 30)
		const p4Pixel = mockCoordSystem.feetToPixels(40, 40)

		const controlNodes = container.querySelectorAll('circle[r="6"]')
		const nodePositions = Array.from(controlNodes).map(node => ({
			cx: parseFloat(node.getAttribute('cx') || '0'),
			cy: parseFloat(node.getAttribute('cy') || '0'),
		}))

		// Should find nodes at drawing2's positions
		expect(nodePositions.some(pos =>
			Math.abs(pos.cx - p3Pixel.x) < 1 && Math.abs(pos.cy - p3Pixel.y) < 1
		)).toBe(true)
		expect(nodePositions.some(pos =>
			Math.abs(pos.cx - p4Pixel.x) < 1 && Math.abs(pos.cy - p4Pixel.y) < 1
		)).toBe(true)
	})

	test('hides control nodes when not hovering over canvas', () => {
		const { container } = render(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={[drawing1, drawing2]}
					onChange={mockOnChange}
					activeTool="select"
					autoCorrect={false}
					defaultStyle={{ color: '#000000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' }}
					snapThreshold={10}
					isOverCanvas={false}
				/>
			</SettingsProvider>
		)

		const controlNodes = container.querySelectorAll('circle[r="6"]')
		expect(controlNodes.length).toBe(0)
	})
})
