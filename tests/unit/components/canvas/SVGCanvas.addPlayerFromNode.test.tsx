import { afterEach, describe, test, expect } from 'bun:test'
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react'
import { SVGCanvas } from '../../../../src/components/canvas/SVGCanvas'
import { FieldCoordinateSystem } from '../../../../src/utils/coordinates'
import type { Drawing } from '../../../../src/types/drawing.types'

describe('SVGCanvas - Add Player from Control Point Node', () => {
	afterEach(() => {
		cleanup()
	})

	const mockCoordSystem = new FieldCoordinateSystem(800, 400)

	const mockDrawing: Drawing = {
		id: 'drawing-1',
		points: {
			p1: { id: 'p1', x: 10, y: 10, type: 'corner' },
			p2: { id: 'p2', x: 20, y: 10, type: 'corner' },
		},
		segments: [{ type: 'line', pointIds: ['p1', 'p2'] }],
		style: {
			color: '#ff0000',
			strokeWidth: 2,
			lineStyle: 'solid',
			lineEnd: 'none',
			pathMode: 'sharp',
		},
		annotations: [],
	}

	const mockPlayers = [
		{ id: 'player-1', x: 50, y: 50, label: 'QB', color: '#0000ff' },
	]

	test('control points are visible when addPlayer tool is active', () => {
		const { container } = render(
			<SVGCanvas
				width={800}
				height={400}
				coordSystem={mockCoordSystem}
				drawings={[mockDrawing]}
				players={mockPlayers}
				onChange={() => {}}
				activeTool="addPlayer"
				autoCorrect={false}
				defaultStyle={{
					color: '#000',
					strokeWidth: 2,
					lineStyle: 'solid',
					lineEnd: 'none',
					pathMode: 'sharp',
				}}
				snapThreshold={10}
				isOverCanvas={true}
				selectedDrawingIds={['drawing-1']}
			/>,
		)

		// Control points should be rendered (circles with r=6)
		const controlPoints = container.querySelectorAll('circle[r="6"]')
		expect(controlPoints.length).toBe(2) // p1 and p2
	})

	test('clicking control point calls onAddPlayerAtNode with correct position', async () => {
		let addPlayerCalled = false
		let addPlayerPosition: {
			x: number
			y: number
			drawingId: string
			pointId: string
		} | null = null

		const handleAddPlayerAtNode = (
			drawingId: string,
			pointId: string,
			x: number,
			y: number,
		) => {
			addPlayerCalled = true
			addPlayerPosition = { drawingId, pointId, x, y }
		}

		const { container } = render(
			<SVGCanvas
				width={800}
				height={400}
				coordSystem={mockCoordSystem}
				drawings={[mockDrawing]}
				players={mockPlayers}
				onChange={() => {}}
				activeTool="addPlayer"
				autoCorrect={false}
				defaultStyle={{
					color: '#000',
					strokeWidth: 2,
					lineStyle: 'solid',
					lineEnd: 'none',
					pathMode: 'sharp',
				}}
				snapThreshold={10}
				isOverCanvas={true}
				selectedDrawingIds={['drawing-1']}
				onAddPlayerAtNode={handleAddPlayerAtNode}
			/>,
		)

		// Find and click control point p1 at (10, 10)
		const p1Pixel = mockCoordSystem.feetToPixels(10, 10)
		const controlPoints = container.querySelectorAll('circle[r="6"]')

		let p1Node: Element | null = null
		controlPoints.forEach((circle) => {
			const cx = parseFloat(circle.getAttribute('cx') || '0')
			const cy = parseFloat(circle.getAttribute('cy') || '0')
			if (Math.abs(cx - p1Pixel.x) < 1 && Math.abs(cy - p1Pixel.y) < 1) {
				p1Node = circle
			}
		})

		expect(p1Node).not.toBeNull()
		fireEvent.click(p1Node!)

		await waitFor(() => {
			expect(addPlayerCalled).toBe(true)
		})

		expect(addPlayerPosition).toEqual({
			drawingId: 'drawing-1',
			pointId: 'p1',
			x: 10,
			y: 10,
		})
	})

	test('blocks add player when drawing already has a linked player', async () => {
		let addPlayerCalled = false

		const drawingWithPlayer: Drawing = {
			...mockDrawing,
			playerId: 'existing-player',
			linkedPointId: 'p1',
		}

		const handleAddPlayerAtNode = () => {
			addPlayerCalled = true
		}

		const { container } = render(
			<SVGCanvas
				width={800}
				height={400}
				coordSystem={mockCoordSystem}
				drawings={[drawingWithPlayer]}
				players={[
					...mockPlayers,
					{ id: 'existing-player', x: 10, y: 10, label: 'X', color: '#ff0000' },
				]}
				onChange={() => {}}
				activeTool="addPlayer"
				autoCorrect={false}
				defaultStyle={{
					color: '#000',
					strokeWidth: 2,
					lineStyle: 'solid',
					lineEnd: 'none',
					pathMode: 'sharp',
				}}
				snapThreshold={10}
				isOverCanvas={true}
				selectedDrawingIds={['drawing-1']}
				onAddPlayerAtNode={handleAddPlayerAtNode}
			/>,
		)

		// Find and click control point p2 (p1 is hidden because linked)
		const p2Pixel = mockCoordSystem.feetToPixels(20, 10)
		const controlPoints = container.querySelectorAll('circle[r="6"]')

		let p2Node: Element | null = null
		controlPoints.forEach((circle) => {
			const cx = parseFloat(circle.getAttribute('cx') || '0')
			const cy = parseFloat(circle.getAttribute('cy') || '0')
			if (Math.abs(cx - p2Pixel.x) < 1 && Math.abs(cy - p2Pixel.y) < 1) {
				p2Node = circle
			}
		})

		// Note: p1 is hidden because it's linked, so we try p2
		if (p2Node) {
			fireEvent.click(p2Node)
		}

		// Should NOT have called add player because drawing already has a player
		await new Promise((r) => setTimeout(r, 100))
		expect(addPlayerCalled).toBe(false)
	})

	test('clicking control point does NOT start drag in addPlayer mode', async () => {
		let dragStarted = false

		const mockOnChange = () => {
			dragStarted = true
		}

		const { container } = render(
			<SVGCanvas
				width={800}
				height={400}
				coordSystem={mockCoordSystem}
				drawings={[mockDrawing]}
				players={mockPlayers}
				onChange={mockOnChange}
				activeTool="addPlayer"
				autoCorrect={false}
				defaultStyle={{
					color: '#000',
					strokeWidth: 2,
					lineStyle: 'solid',
					lineEnd: 'none',
					pathMode: 'sharp',
				}}
				snapThreshold={10}
				isOverCanvas={true}
				selectedDrawingIds={['drawing-1']}
				onAddPlayerAtNode={() => {}}
			/>,
		)

		const p1Pixel = mockCoordSystem.feetToPixels(10, 10)
		const controlPoints = container.querySelectorAll('circle[r="6"]')

		let p1Node: Element | null = null
		controlPoints.forEach((circle) => {
			const cx = parseFloat(circle.getAttribute('cx') || '0')
			const cy = parseFloat(circle.getAttribute('cy') || '0')
			if (Math.abs(cx - p1Pixel.x) < 1 && Math.abs(cy - p1Pixel.y) < 1) {
				p1Node = circle
			}
		})

		// Use pointerDown which normally starts drag
		fireEvent.pointerDown(p1Node!)

		// Should NOT have triggered drag (onChange not called from drag)
		expect(dragStarted).toBe(false)
	})
})
