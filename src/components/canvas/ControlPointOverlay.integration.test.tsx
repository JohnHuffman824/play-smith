import { afterEach, describe, test, expect, beforeEach } from 'bun:test'
import { cleanup, render, fireEvent } from '@testing-library/react'
import { ControlPointOverlay } from './ControlPointOverlay'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import type { Drawing } from '../../types/drawing.types'

describe('ControlPointOverlay - Node Linking Integration', () => {

	afterEach(() => {
		cleanup()
	})

	const mockCoordSystem = new FieldCoordinateSystem(800, 400)
	type MergeArgs = [string, string, string, string]
	let mergeCallArgs: MergeArgs[] = []
	let dragPointCallArgs: unknown[] = []

	const mockOnMerge = (...args: MergeArgs) => {
		mergeCallArgs.push(args)
	}

	const mockOnDragPoint = (...args: unknown[]) => {
		dragPointCallArgs.push(args)
	}

	beforeEach(() => {
		mergeCallArgs = []
		dragPointCallArgs = []
	})

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
	},
		annotations: [],
	}

	const drawing2: Drawing = {
		id: 'drawing-2',
		points: {
			'p3': { id: 'p3', x: 30, y: 10, type: 'corner' },
			'p4': { id: 'p4', x: 40, y: 10, type: 'corner' },
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
	},
		annotations: [],
	}

	test('triggers onMerge when dragging node near another drawing', () => {
		const { container } = render(
			<svg width={800} height={400}>
				<ControlPointOverlay
					drawing={drawing1}
					drawings={[drawing1, drawing2]}
					coordSystem={mockCoordSystem}
					snapThreshold={10}
					onDragPoint={mockOnDragPoint}
					onMerge={mockOnMerge}
				/>
			</svg>
		)

		// Find the control point for p2 (end point of drawing1 at 20, 10)
		const p2Pixel = mockCoordSystem.feetToPixels(20, 10)
		const controlNode = container.querySelector(
			`circle[cx="${p2Pixel.x}"]`,
		)
		expect(controlNode).not.toBeNull()

		// Simulate dragging p2 near p3 (start of drawing2 at 30, 10)
		// We'll drag it to (29, 10) which is within snap threshold of (30, 10)
		fireEvent.pointerDown(controlNode!, {
			clientX: p2Pixel.x,
			clientY: p2Pixel.y,
		})

		// Drag to near p3
		const nearP3Pixel = mockCoordSystem.feetToPixels(29, 10)
		fireEvent.pointerMove(window, {
			clientX: nearP3Pixel.x,
			clientY: nearP3Pixel.y
		})

		// Release
		fireEvent.pointerUp(window)

		// Should have called onMerge
		expect(mergeCallArgs.length).toBeGreaterThan(0)
		const [
			sourceDrawingId,
			sourcePointId,
			targetDrawingId,
			targetPointId,
		] = mergeCallArgs[0]
		expect(sourceDrawingId).toBe('drawing-1')
		expect(sourcePointId).toBe('p2')
		expect(targetDrawingId).toBe('drawing-2')
		expect(targetPointId).toBe('p3')
	})

	test('user scenario: dragging (20,30) to (20,20) preserves (10,30)', () => {
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
			},
			annotations: [],
		}

		const { container } = render(
			<svg width={800} height={400}>
				<ControlPointOverlay
					drawing={userDrawing1}
					drawings={[userDrawing1, userDrawing2]}
					coordSystem={mockCoordSystem}
					snapThreshold={10}
					onDragPoint={mockOnDragPoint}
					onMerge={mockOnMerge}
				/>
			</svg>
		)

		// Drag node 'b' (20, 30) to node 'c' (20, 20)
		const bPixel = mockCoordSystem.feetToPixels(20, 30)
		const controlNode = container.querySelector(
			`circle[cx="${bPixel.x}"]`,
		)
		expect(controlNode).not.toBeNull()

		fireEvent.pointerDown(controlNode!, {
			clientX: bPixel.x,
			clientY: bPixel.y,
		})

		// Drag to near 'c' (20, 20)
		const nearCPixel = mockCoordSystem.feetToPixels(20, 21)
		fireEvent.pointerMove(window, {
			clientX: nearCPixel.x,
			clientY: nearCPixel.y
		})

		fireEvent.pointerUp(window)

		// Should trigger merge with correct parameters
		expect(mergeCallArgs.length).toBeGreaterThan(0)
		const [
			sourceDrawingId,
			sourcePointId,
			targetDrawingId,
			targetPointId,
		] = mergeCallArgs[0]

		// Source is drawing1, point 'b' (the one being dragged)
		expect(sourceDrawingId).toBe('d1')
		expect(sourcePointId).toBe('b')

		// Target is drawing2, point 'c' (the stationary one)
		expect(targetDrawingId).toBe('d2')
		expect(targetPointId).toBe('c')
	})

	test('does not trigger merge when dragging far from other nodes', () => {
		const { container } = render(
			<svg width={800} height={400}>
				<ControlPointOverlay
					drawing={drawing1}
					drawings={[drawing1, drawing2]}
					coordSystem={mockCoordSystem}
					snapThreshold={10}
					onDragPoint={mockOnDragPoint}
					onMerge={mockOnMerge}
				/>
			</svg>
		)

		const p2Pixel = mockCoordSystem.feetToPixels(20, 10)
		const controlNode = container.querySelector(
			`circle[cx="${p2Pixel.x}"]`,
		)

		fireEvent.pointerDown(controlNode!, {
			clientX: p2Pixel.x,
			clientY: p2Pixel.y,
		})

		// Drag far away
		const farPixel = mockCoordSystem.feetToPixels(50, 50)
		fireEvent.pointerMove(window, {
			clientX: farPixel.x,
			clientY: farPixel.y,
		})

		fireEvent.pointerUp(window)

		// Should NOT have called onMerge
		expect(mergeCallArgs.length).toBe(0)
	})

	test('shows green indicator when dragging near another node', () => {
		const { container } = render(
			<svg width={800} height={400}>
				<ControlPointOverlay
					drawing={drawing1}
					drawings={[drawing1, drawing2]}
					coordSystem={mockCoordSystem}
					snapThreshold={10}
					onDragPoint={mockOnDragPoint}
					onMerge={mockOnMerge}
				/>
			</svg>
		)

		const p2Pixel = mockCoordSystem.feetToPixels(20, 10)
		const controlNode = container.querySelector(
			`circle[cx="${p2Pixel.x}"]`,
		)

		fireEvent.pointerDown(controlNode!, {
			clientX: p2Pixel.x,
			clientY: p2Pixel.y,
		})

		// Drag near p3
		const nearP3Pixel = mockCoordSystem.feetToPixels(29, 10)
		fireEvent.pointerMove(window, {
			clientX: nearP3Pixel.x,
			clientY: nearP3Pixel.y,
		})

		// Should show green snap indicator circle (r=10, stroke=#22c55e)
		const snapIndicator = container.querySelector(
			'circle[r="10"][stroke="#22c55e"]',
		)
		expect(snapIndicator).not.toBeNull()
	})
})
