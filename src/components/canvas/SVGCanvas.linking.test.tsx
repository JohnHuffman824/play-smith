import { describe, test, expect } from 'bun:test'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { SVGCanvas } from './SVGCanvas'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import type { Drawing } from '../../types/drawing.types'

describe('SVGCanvas - Full Link Integration', () => {
	const mockCoordSystem = new FieldCoordinateSystem(800, 400)
	let drawings: Drawing[] = []
	let changeCount = 0

	const handleChange = (newDrawings: Drawing[]) => {
		drawings = newDrawings
		changeCount++
	}

	const drawing1: Drawing = {
		id: 'drawing-1',
		segments: [
			{
				type: 'line',
				points: [
					{ id: 'p1', x: 10, y: 10, type: 'corner' },
					{ id: 'p2', x: 20, y: 10, type: 'corner' },
				],
			},
		],
		style: { color: '#ff0000', lineWidth: 2, lineStyle: 'solid', lineEnd: 'none' },
		annotations: [],
	}

	const drawing2: Drawing = {
		id: 'drawing-2',
		segments: [
			{
				type: 'line',
				points: [
					{ id: 'p3', x: 25, y: 10, type: 'corner' },
					{ id: 'p4', x: 35, y: 10, type: 'corner' },
				],
			},
		],
		style: { color: '#00ff00', lineWidth: 2, lineStyle: 'solid', lineEnd: 'none' },
		annotations: [],
	}

	test('merges drawings when dragging node near another', async () => {
		drawings = [drawing1, drawing2]
		changeCount = 0

		const { container } = render(
			<SVGCanvas
				width={800}
				height={400}
				coordSystem={mockCoordSystem}
				drawings={drawings}
				onChange={handleChange}
				activeTool="select"
				autoCorrect={false}
				defaultStyle={{ color: '#000000', lineWidth: 2, lineStyle: 'solid', lineEnd: 'none' }}
				snapThreshold={10}
				isOverCanvas={true}
			/>
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

	test('user scenario: (20,30) to (20,20) preserves (10,30) and removes (20,30)', async () => {
		// Drawing 1: (10, 30) -> (20, 30)
		const userDrawing1: Drawing = {
			id: 'd1',
			segments: [
				{
					type: 'line',
					points: [
						{ id: 'a', x: 10, y: 30, type: 'corner' },
						{ id: 'b', x: 20, y: 30, type: 'corner' },
					],
				},
			],
			style: { color: '#ff0000', lineWidth: 2, lineStyle: 'solid', lineEnd: 'none' },
			annotations: [],
		}

		// Drawing 2: (20, 20) -> (30, 30)
		const userDrawing2: Drawing = {
			id: 'd2',
			segments: [
				{
					type: 'line',
					points: [
						{ id: 'c', x: 20, y: 20, type: 'corner' },
						{ id: 'd', x: 30, y: 30, type: 'corner' },
					],
				},
			],
			style: { color: '#00ff00', lineWidth: 2, lineStyle: 'solid', lineEnd: 'none' },
			annotations: [],
		}

		drawings = [userDrawing1, userDrawing2]
		changeCount = 0

		const { container } = render(
			<SVGCanvas
				width={800}
				height={400}
				coordSystem={mockCoordSystem}
				drawings={drawings}
				onChange={handleChange}
				activeTool="select"
				autoCorrect={false}
				defaultStyle={{ color: '#000000', lineWidth: 2, lineStyle: 'solid', lineEnd: 'none' }}
				snapThreshold={10}
				isOverCanvas={true}
			/>
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
		const allPoints: Array<{x: number, y: number}> = []
		for (const segment of merged.segments) {
			for (const point of segment.points) {
				// Only add if not already in array (to get unique positions)
				const exists = allPoints.some(p =>
					Math.abs(p.x - point.x) < 0.1 && Math.abs(p.y - point.y) < 0.1
				)
				if (!exists) {
					allPoints.push({ x: point.x, y: point.y })
				}
			}
		}

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
			<SVGCanvas
				width={800}
				height={400}
				coordSystem={mockCoordSystem}
				drawings={drawings}
				onChange={handleChange}
				activeTool="select"
				autoCorrect={false}
				defaultStyle={{ color: '#000000', lineWidth: 2, lineStyle: 'solid', lineEnd: 'none' }}
				snapThreshold={10}
				isOverCanvas={true}
			/>
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
})
