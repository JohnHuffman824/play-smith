import { useEffect, useRef, useState } from 'react'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import type { PathStyle, Drawing } from '../../types/drawing.types'
import { processSharpPath } from '../../utils/sharp-path.utils'
import { processSmoothPath } from '../../utils/smooth-path.utils'
import type { Coordinate } from '../../types/field.types'
import { findPlayerSnapTarget, type PlayerForSnap } from '../../utils/drawing.utils'
import { PLAYER_RADIUS_FEET } from '../../constants/field.constants'

interface FreehandCaptureProps {
	coordSystem: FieldCoordinateSystem
	style: PathStyle
	isActive: boolean
	autoCorrect: boolean
	onCommit: (drawing: Drawing) => void
	players?: PlayerForSnap[]
}

/**
 * Captures freehand canvas strokes and converts them to drawings.
 */
export function FreehandCapture({
	coordSystem,
	style,
	isActive,
	autoCorrect,
	onCommit,
	players,
}: FreehandCaptureProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const [isDrawing, setIsDrawing] = useState(false)
	const [points, setPoints] = useState<Coordinate[]>([])

	useEffect(() => {
		if (!isActive) {
			resetCanvas()
		}
	}, [isActive])

	function resetCanvas() {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		ctx.clearRect(0, 0, canvas.width, canvas.height)
	}

	function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
		if (!isActive) return
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const rect = canvas.getBoundingClientRect()
		const pixel = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		}
		const feet = coordSystem.pixelsToFeet(pixel.x, pixel.y)

		ctx.strokeStyle = style.color
		ctx.lineWidth = style.strokeWidth * coordSystem.scale
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'
		ctx.beginPath()
		ctx.moveTo(pixel.x, pixel.y)

		setPoints([feet])
		setIsDrawing(true)
	}

	function draw(event: React.PointerEvent<HTMLCanvasElement>) {
		if (!isDrawing) return
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const rect = canvas.getBoundingClientRect()
		const pixel = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		}
		const feet = coordSystem.pixelsToFeet(pixel.x, pixel.y)

		ctx.lineTo(pixel.x, pixel.y)
		ctx.stroke()

		setPoints((prev) => [...prev, feet])
	}

	function stopDrawing() {
		if (!isDrawing) return
		setIsDrawing(false)
		resetCanvas()
		commitDrawing(points)
		setPoints([])
	}

	function commitDrawing(captured: Coordinate[]) {
		if (captured.length < 2) return

		// Use appropriate pipeline based on pathMode
		// Sharp: Geometric shapes with 15° angle snapping
		// Smooth: Adaptive smoothing (straight detection + curve smoothing)
		const { points, segments } = style.pathMode === 'curve'
			? processSmoothPath(captured)
			: processSharpPath(captured)

		// Check for player snap on start and end points
		let playerId: string | undefined
		let linkedPointId: string | undefined

		if (players && players.length > 0) {
			const pointIds = Object.keys(points)
			const startPointId = pointIds[0]
			const endPointId = pointIds[pointIds.length - 1]
			const startPoint = points[startPointId]
			const endPoint = points[endPointId]

			// Check start point first (prioritize)
			if (startPoint) {
				const startSnap = findPlayerSnapTarget(startPoint, players, PLAYER_RADIUS_FEET)
				if (startSnap) {
					playerId = startSnap.playerId
					linkedPointId = startPointId
					// Move start point to player center
					points[startPointId] = { ...startPoint, x: startSnap.point.x, y: startSnap.point.y }
				}
			}

			// Check end point if start didn't snap and end is different from start
			if (!playerId && endPoint && endPointId !== startPointId) {
				const endSnap = findPlayerSnapTarget(endPoint, players, PLAYER_RADIUS_FEET)
				if (endSnap) {
					playerId = endSnap.playerId
					linkedPointId = endPointId
					// Move end point to player center
					points[endPointId] = { ...endPoint, x: endSnap.point.x, y: endSnap.point.y }
				}
			}
		}

		const drawing: Drawing = {
			id: `drawing-${Date.now()}`,
			points,
			segments,
			style,
			annotations: [],
			// Include player link if found
			...(playerId && linkedPointId ? { playerId, linkedPointId } : {}),
		}

		onCommit(drawing)
	}

	function resizeCanvas() {
		const canvas = canvasRef.current
		if (!canvas) return
		const rect = canvas.getBoundingClientRect()
		canvas.width = rect.width
		canvas.height = rect.height
		resetCanvas()
	}

	useEffect(() => {
		resizeCanvas()
		const canvas = canvasRef.current
		if (!canvas) return
		const observer = new ResizeObserver(() => resizeCanvas())
		observer.observe(canvas)
		return () => observer.disconnect()
	}, [])

	return (
		<canvas
			ref={canvasRef}
			className='absolute inset-0 w-full h-full pointer-events-auto'
			style={{ display: isActive ? 'block' : 'none' }}
			onPointerDown={startDrawing}
			onPointerMove={draw}
			onPointerUp={stopDrawing}
			onPointerLeave={stopDrawing}
		/>
	)
}

