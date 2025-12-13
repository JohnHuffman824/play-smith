import { afterEach, describe, test, expect } from 'bun:test'
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react'
import { SVGCanvas } from './SVGCanvas'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import { SettingsProvider } from '../../contexts/SettingsContext'
import type { Drawing } from '../../types/drawing.types'

describe('SVGCanvas - Full Link Integration', () => {

	afterEach(() => {
		cleanup()
	})

	const mockCoordSystem = new FieldCoordinateSystem(800, 400)
	let drawings: Drawing[] = []
	let changeCount = 0
const DEFAULT_STYLE = {
	color: '#000000',
	strokeWidth: 2,
	lineStyle: 'solid',
	lineEnd: 'none',
	pathMode: 'sharp',
}

	const handleChange = (newDrawings: Drawing[]) => {
		drawings = newDrawings
		changeCount++
	}

	const drawing1: Drawing = {
		id: 'drawing-1',
		points: {
			'p1': { id: 'p1', x: 10, y: 10, type: 'corner' },
			'p2': { id: 'p2', x: 20, y: 10, type: 'corner' },
		},
		segments: [
			{
				type: 'line',
				pointIds: ['p1', 'p2'],
			},
		],
	style: {
		color: '#ff0000',
		strokeWidth: 2,
		lineStyle: 'solid',
		lineEnd: 'none',
		pathMode: 'sharp',
	},
		annotations: [],
	}

	const drawing2: Drawing = {
		id: 'drawing-2',
		points: {
			'p3': { id: 'p3', x: 25, y: 10, type: 'corner' },
			'p4': { id: 'p4', x: 35, y: 10, type: 'corner' },
		},
		segments: [
			{
				type: 'line',
				pointIds: ['p3', 'p4'],
			},
		],
	style: {
		color: '#00ff00',
		strokeWidth: 2,
		lineStyle: 'solid',
		lineEnd: 'none',
		pathMode: 'sharp',
	},
		annotations: [],
	}

	test('merges drawings when dragging D1→D2 (regression test)', async () => {
		drawings = [drawing1, drawing2]
		changeCount = 0

		const { container } = render(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={drawings}
					onChange={handleChange}
					activeTool='select'
					autoCorrect={false}
					defaultStyle={DEFAULT_STYLE}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={['drawing-1', 'drawing-2']}
				/>
			</SettingsProvider>
		)

		// Find control node for p2 (end of drawing1 at 20, 10)
		const p2Pixel = mockCoordSystem.feetToPixels(20, 10)
		const allCircles = container.querySelectorAll('circle[r="6"]')

		// Find the circle at p2's position
		let p2Node: Element | null = null
		allCircles.forEach(circle => {
			const cx = parseFloat(circle.getAttribute('cx') || '0')
			const cy = parseFloat(circle.getAttribute('cy') || '0')
			if (Math.abs(cx - p2Pixel.x) < 1 && Math.abs(cy - p2Pixel.y) < 1) {
				p2Node = circle
			}
		})

		expect(p2Node).not.toBeNull()

		// Drag p2 near p3 (start of drawing2 at 25, 10)
		fireEvent.pointerDown(p2Node!, { clientX: p2Pixel.x, clientY: p2Pixel.y })

		// Drag to (24, 10) which is within snap threshold of p3 at (25, 10)
		const nearP3Pixel = mockCoordSystem.feetToPixels(24, 10)
		fireEvent.pointerMove(window, {
			clientX: nearP3Pixel.x,
			clientY: nearP3Pixel.y
		})

		// Release
		fireEvent.pointerUp(window)

		// Wait for state update
		await waitFor(() => {
			expect(changeCount).toBeGreaterThan(0)
		}, { timeout: 1000 })

		// Should have merged drawings
		expect(drawings.length).toBe(1)

		// The merged drawing should have both paths connected
		const merged = drawings[0]!
		expect(merged.segments.length).toBeGreaterThan(1)
	})

	test('merges drawings when dragging D2→D1 (asymmetric bug case)', async () => {
		drawings = [drawing1, drawing2]
		changeCount = 0

		const { container } = render(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={drawings}
					onChange={handleChange}
					activeTool='select'
					autoCorrect={false}
					defaultStyle={DEFAULT_STYLE}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={['drawing-1', 'drawing-2']}
				/>
			</SettingsProvider>
		)

		// Find control node for p3 (start of drawing2 at 25, 10)
		const p3Pixel = mockCoordSystem.feetToPixels(25, 10)
		const allCircles = container.querySelectorAll('circle[r="6"]')

		// Find the circle at p3's position
		let p3Node: Element | null = null
		allCircles.forEach(circle => {
			const cx = parseFloat(circle.getAttribute('cx') || '0')
			const cy = parseFloat(circle.getAttribute('cy') || '0')
			if (Math.abs(cx - p3Pixel.x) < 1 && Math.abs(cy - p3Pixel.y) < 1) {
				p3Node = circle
			}
		})

		expect(p3Node).not.toBeNull()

		// Drag p3 near p2 (end of drawing1 at 20, 10)
		fireEvent.pointerDown(p3Node!, { clientX: p3Pixel.x, clientY: p3Pixel.y })

		// Drag to (21, 10) which is within snap threshold of p2 at (20, 10)
		const nearP2Pixel = mockCoordSystem.feetToPixels(21, 10)
		fireEvent.pointerMove(window, {
			clientX: nearP2Pixel.x,
			clientY: nearP2Pixel.y
		})

		// Release
		fireEvent.pointerUp(window)

		// Wait for state update
		await waitFor(() => {
			expect(changeCount).toBeGreaterThan(0)
		}, { timeout: 1000 })

		// Should have merged drawings
		expect(drawings.length).toBe(1)

		// The merged drawing should have both paths connected
		const merged = drawings[0]!
		expect(merged.segments.length).toBeGreaterThan(1)
	})

	test('user scenario: (20,30) to (20,20) preserves (10,30) and removes (20,30)', async () => {
		// Drawing 1: (10, 30) -> (20, 30)
		const userDrawing1: Drawing = {
			id: 'd1',
			points: {
				'a': { id: 'a', x: 10, y: 30, type: 'corner' },
				'b': { id: 'b', x: 20, y: 30, type: 'corner' },
			},
			segments: [
				{
					type: 'line',
					pointIds: ['a', 'b'],
				},
			],
	style: {
		color: '#ff0000',
		strokeWidth: 2,
		lineStyle: 'solid',
		lineEnd: 'none',
		pathMode: 'sharp',
	},
			annotations: [],
		}

		// Drawing 2: (20, 20) -> (30, 30)
		const userDrawing2: Drawing = {
			id: 'd2',
			points: {
				'c': { id: 'c', x: 20, y: 20, type: 'corner' },
				'd': { id: 'd', x: 30, y: 30, type: 'corner' },
			},
			segments: [
				{
					type: 'line',
					pointIds: ['c', 'd'],
				},
			],
	style: {
		color: '#00ff00',
		strokeWidth: 2,
		lineStyle: 'solid',
		lineEnd: 'none',
		pathMode: 'sharp',
	},
			annotations: [],
		}

		drawings = [userDrawing1, userDrawing2]
		changeCount = 0

		const { container } = render(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={drawings}
					onChange={handleChange}
					activeTool='select'
					autoCorrect={false}
					defaultStyle={DEFAULT_STYLE}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={['d1', 'd2']}
				/>
			</SettingsProvider>
		)

		// Find node 'b' at (20, 30)
		const bPixel = mockCoordSystem.feetToPixels(20, 30)
		const allCircles = container.querySelectorAll('circle[r="6"]')

		let bNode: Element | null = null
		allCircles.forEach(circle => {
			const cx = parseFloat(circle.getAttribute('cx') || '0')
			const cy = parseFloat(circle.getAttribute('cy') || '0')
			if (Math.abs(cx - bPixel.x) < 1 && Math.abs(cy - bPixel.y) < 1) {
				bNode = circle
			}
		})

		expect(bNode).not.toBeNull()

		// Drag to near 'c' at (20, 20)
		fireEvent.pointerDown(bNode!, { clientX: bPixel.x, clientY: bPixel.y })

		const nearCPixel = mockCoordSystem.feetToPixels(20, 21)
		fireEvent.pointerMove(window, {
			clientX: nearCPixel.x,
			clientY: nearCPixel.y
		})

		fireEvent.pointerUp(window)

		// Wait for merge
		await waitFor(() => {
			expect(changeCount).toBeGreaterThan(0)
		}, { timeout: 1000 })

		// Should have one merged drawing
		expect(drawings.length).toBe(1)

		// Extract all point coordinates from merged drawing
		const merged = drawings[0]!
		// With point pool architecture, just get all points from the pool
		const allPoints = Object.values(merged.points).map(p => ({ x: p.x, y: p.y }))

		// Should have 3 unique positions: (10,30), (20,20), (30,30)
		expect(allPoints.length).toBe(3)

		// Should have (10, 30) - the OTHER end of drawing1
		const has10_30 = allPoints.some(p =>
			Math.abs(p.x - 10) < 0.1 && Math.abs(p.y - 30) < 0.1
		)
		expect(has10_30).toBe(true)

		// Should have (20, 20) - the TARGET (stationary) node
		const has20_20 = allPoints.some(p =>
			Math.abs(p.x - 20) < 0.1 && Math.abs(p.y - 20) < 0.1
		)
		expect(has20_20).toBe(true)

		// Should have (30, 30) - the other end of drawing2
		const has30_30 = allPoints.some(p =>
			Math.abs(p.x - 30) < 0.1 && Math.abs(p.y - 30) < 0.1
		)
		expect(has30_30).toBe(true)

		// Should NOT have (20, 30) - the SOURCE (moved) node
		const has20_30 = allPoints.some(p =>
			Math.abs(p.x - 20) < 0.1 && Math.abs(p.y - 30) < 0.1
		)
		expect(has20_30).toBe(false)
	})

	test('does not merge when dragging far from other nodes', async () => {
		drawings = [drawing1, drawing2]
		changeCount = 0

		const { container } = render(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={drawings}
					onChange={handleChange}
					activeTool='select'
					autoCorrect={false}
					defaultStyle={DEFAULT_STYLE}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={['drawing-1', 'drawing-2']}
				/>
			</SettingsProvider>
		)

		const p2Pixel = mockCoordSystem.feetToPixels(20, 10)
		const allCircles = container.querySelectorAll('circle[r="6"]')

		let p2Node: Element | null = null
		allCircles.forEach(circle => {
			const cx = parseFloat(circle.getAttribute('cx') || '0')
			if (Math.abs(cx - p2Pixel.x) < 1) {
				p2Node = circle
			}
		})

		fireEvent.pointerDown(p2Node!, { clientX: p2Pixel.x, clientY: p2Pixel.y })

		// Drag far away
		const farPixel = mockCoordSystem.feetToPixels(50, 50)
		fireEvent.pointerMove(window, { clientX: farPixel.x, clientY: farPixel.y })

		fireEvent.pointerUp(window)

		// Should NOT have merged
		expect(drawings.length).toBe(2)
	})

	test('no phantom nodes after merge - correct control point count', async () => {
		// Drawing 1: (10, 30) -> (20, 30)
		const d1: Drawing = {
			id: 'd1',
			points: {
				'a': { id: 'a', x: 10, y: 30, type: 'corner' },
				'b': { id: 'b', x: 20, y: 30, type: 'corner' },
			},
			segments: [
				{
					type: 'line',
					pointIds: ['a', 'b'],
				},
			],
			style: { color: '#ff0000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' },
			annotations: [],
		}

		// Drawing 2: (20, 20) -> (30, 30)
		const d2: Drawing = {
			id: 'd2',
			points: {
				'c': { id: 'c', x: 20, y: 20, type: 'corner' },
				'd': { id: 'd', x: 30, y: 30, type: 'corner' },
			},
			segments: [
				{
					type: 'line',
					pointIds: ['c', 'd'],
				},
			],
	style: {
		color: '#00ff00',
		strokeWidth: 2,
		lineStyle: 'solid',
		lineEnd: 'none',
		pathMode: 'sharp',
	},
			annotations: [],
		}

		drawings = [d1, d2]
		changeCount = 0

		const { container, rerender } = render(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={drawings}
					onChange={handleChange}
					activeTool='select'
					autoCorrect={false}
					defaultStyle={DEFAULT_STYLE}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={['d1', 'd2']}
				/>
			</SettingsProvider>
		)

		// Before merge: 4 control points (2 per drawing)
		let controlPoints = container.querySelectorAll('circle[r="6"]')
		expect(controlPoints.length).toBe(4)

		// Drag node 'b' (20, 30) to node 'c' (20, 20)
		const bPixel = mockCoordSystem.feetToPixels(20, 30)
		let bNode: Element | null = null
		controlPoints.forEach(circle => {
			const cx = parseFloat(circle.getAttribute('cx') || '0')
			const cy = parseFloat(circle.getAttribute('cy') || '0')
			if (Math.abs(cx - bPixel.x) < 1 && Math.abs(cy - bPixel.y) < 1) {
				bNode = circle
			}
		})

		expect(bNode).not.toBeNull()

		fireEvent.pointerDown(bNode!, { clientX: bPixel.x, clientY: bPixel.y })

		const nearCPixel = mockCoordSystem.feetToPixels(20, 21)
		fireEvent.pointerMove(window, {
			clientX: nearCPixel.x,
			clientY: nearCPixel.y
		})

		fireEvent.pointerUp(window)

		// Wait for merge
		await waitFor(() => {
			expect(changeCount).toBeGreaterThan(0)
		}, { timeout: 1000 })

		// Rerender with merged drawings
		rerender(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={drawings}
					onChange={handleChange}
					activeTool="select"
					autoCorrect={false}
					defaultStyle={{ color: '#000000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' }}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={drawings.map(d => d.id)}
				/>
			</SettingsProvider>
		)

		// After merge: Should have exactly 3 control points
		// (10,30), (20,20), (30,30) - NO phantom node at (20,30)
		controlPoints = container.querySelectorAll('circle[r="6"]')
		expect(controlPoints.length).toBe(3)

		// Verify the 3 points are at the correct positions
		const positions = Array.from(controlPoints).map(circle => ({
			x: mockCoordSystem.pixelsToFeet(
				parseFloat(circle.getAttribute('cx') || '0'),
				parseFloat(circle.getAttribute('cy') || '0')
			).x,
			y: mockCoordSystem.pixelsToFeet(
				parseFloat(circle.getAttribute('cx') || '0'),
				parseFloat(circle.getAttribute('cy') || '0')
			).y,
		}))

		// Should have (10, 30)
		expect(positions.some(p => Math.abs(p.x - 10) < 0.1 && Math.abs(p.y - 30) < 0.1)).toBe(true)
		// Should have (20, 20)
		expect(positions.some(p => Math.abs(p.x - 20) < 0.1 && Math.abs(p.y - 20) < 0.1)).toBe(true)
		// Should have (30, 30)
		expect(positions.some(p => Math.abs(p.x - 30) < 0.1 && Math.abs(p.y - 30) < 0.1)).toBe(true)
		// Should NOT have (20, 30) - the phantom node
		expect(positions.some(p => Math.abs(p.x - 20) < 0.1 && Math.abs(p.y - 30) < 0.1)).toBe(false)
	})

	test('no phantom nodes when dragging merged junction point', async () => {
		// Drawing 1: (10, 30) -> (20, 30)
		const d1: Drawing = {
			id: 'd1',
			points: {
				'a': { id: 'a', x: 10, y: 30, type: 'corner' },
				'b': { id: 'b', x: 20, y: 30, type: 'corner' },
			},
			segments: [{
				type: 'line',
				pointIds: ['a', 'b'],
			}],
			style: { color: '#ff0000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' },
			annotations: [],
		}

		// Drawing 2: (20, 20) -> (30, 30)
		const d2: Drawing = {
			id: 'd2',
			points: {
				'c': { id: 'c', x: 20, y: 20, type: 'corner' },
				'd': { id: 'd', x: 30, y: 30, type: 'corner' },
			},
			segments: [{
				type: 'line',
				pointIds: ['c', 'd'],
			}],
			style: { color: '#00ff00', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' },
			annotations: [],
		}

		drawings = [d1, d2]
		changeCount = 0

		const { container, rerender } = render(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={drawings}
					onChange={handleChange}
					activeTool="select"
					autoCorrect={false}
					defaultStyle={{ color: '#000000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' }}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={['d1', 'd2']}
				/>
			</SettingsProvider>
		)

		// Perform merge: drag 'b' to 'c'
		const bPixel = mockCoordSystem.feetToPixels(20, 30)
		let controlPoints = container.querySelectorAll('circle[r="6"]')
		let bNode: Element | null = null
		controlPoints.forEach(circle => {
			const cx = parseFloat(circle.getAttribute('cx') || '0')
			const cy = parseFloat(circle.getAttribute('cy') || '0')
			if (Math.abs(cx - bPixel.x) < 1 && Math.abs(cy - bPixel.y) < 1) {
				bNode = circle
			}
		})

		fireEvent.pointerDown(bNode!, { clientX: bPixel.x, clientY: bPixel.y })
		const nearCPixel = mockCoordSystem.feetToPixels(20, 21)
		fireEvent.pointerMove(window, { clientX: nearCPixel.x, clientY: nearCPixel.y })
		fireEvent.pointerUp(window)

		await waitFor(() => expect(changeCount).toBeGreaterThan(0), { timeout: 1000 })

		// Rerender with merged drawing
		rerender(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={drawings}
					onChange={handleChange}
					activeTool="select"
					autoCorrect={false}
					defaultStyle={{ color: '#000000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' }}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={drawings.map(d => d.id)}
				/>
			</SettingsProvider>
		)

		// Now drag the merged junction point at (20, 20) to (25, 25)
		const junctionPixel = mockCoordSystem.feetToPixels(20, 20)
		controlPoints = container.querySelectorAll('circle[r="6"]')
		let junctionNode: Element | null = null
		controlPoints.forEach(circle => {
			const cx = parseFloat(circle.getAttribute('cx') || '0')
			const cy = parseFloat(circle.getAttribute('cy') || '0')
			if (Math.abs(cx - junctionPixel.x) < 1 && Math.abs(cy - junctionPixel.y) < 1) {
				junctionNode = circle
			}
		})

		expect(junctionNode).not.toBeNull()

		const initialChangeCount = changeCount
		fireEvent.pointerDown(junctionNode!, { clientX: junctionPixel.x, clientY: junctionPixel.y })
		const newPixel = mockCoordSystem.feetToPixels(25, 25)
		fireEvent.pointerMove(window, { clientX: newPixel.x, clientY: newPixel.y })
		fireEvent.pointerUp(window)

		await waitFor(() => expect(changeCount).toBeGreaterThan(initialChangeCount), { timeout: 1000 })

		// Rerender after dragging junction
		rerender(
			<SettingsProvider>
				<SVGCanvas
					width={800}
					height={400}
					coordSystem={mockCoordSystem}
					drawings={drawings}
					onChange={handleChange}
					activeTool="select"
					autoCorrect={false}
					defaultStyle={{ color: '#000000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' }}
					snapThreshold={10}
					isOverCanvas={true}
					selectedDrawingIds={drawings.map(d => d.id)}
				/>
			</SettingsProvider>
		)

		// Should still have exactly 3 control points (no phantom at old junction position)
		controlPoints = container.querySelectorAll('circle[r="6"]')
		expect(controlPoints.length).toBe(3)

		// Verify the 3 points are at the new positions
		const positions = Array.from(controlPoints).map(circle => ({
			x: mockCoordSystem.pixelsToFeet(
				parseFloat(circle.getAttribute('cx') || '0'),
				parseFloat(circle.getAttribute('cy') || '0')
			).x,
			y: mockCoordSystem.pixelsToFeet(
				parseFloat(circle.getAttribute('cx') || '0'),
				parseFloat(circle.getAttribute('cy') || '0')
			).y,
		}))

		// Should have (10, 30) - unchanged
		expect(positions.some(p => Math.abs(p.x - 10) < 0.1 && Math.abs(p.y - 30) < 0.1)).toBe(true)
		// Should have (25, 25) - the moved junction point
		expect(positions.some(p => Math.abs(p.x - 25) < 0.1 && Math.abs(p.y - 25) < 0.1)).toBe(true)
		// Should have (30, 30) - unchanged
		expect(positions.some(p => Math.abs(p.x - 30) < 0.1 && Math.abs(p.y - 30) < 0.1)).toBe(true)
		// Should NOT have phantom at (20, 20) - the old junction position
		expect(positions.some(p => Math.abs(p.x - 20) < 0.1 && Math.abs(p.y - 20) < 0.1)).toBe(false)
	})
})
