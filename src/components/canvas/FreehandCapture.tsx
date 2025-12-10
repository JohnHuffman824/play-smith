import { useEffect, useRef, useState } from 'react'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import type { PathStyle, Drawing } from '../../types/drawing.types'
import { simplifyPath, straightenSegments } from '../../utils/path.utils'
import { smoothPathToCurves } from '../../utils/curve.utils'
import type { Coordinate } from '../../types/field.types'

interface FreehandCaptureProps {
	coordSystem: FieldCoordinateSystem
	style: PathStyle
	isActive: boolean
	autoCorrect: boolean
	onCommit: (drawing: Drawing) => void
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

		let pathPoints = captured
		if (autoCorrect) {
			const simplified = simplifyPath(pathPoints, 0.5)
			const straightened = straightenSegments(simplified, Math.PI / 18)
			pathPoints = straightened.points
		}

		// Apply curve smoothing if pathMode is 'curve'
		const { points, segments } = style.pathMode === 'curve'
			? smoothPathToCurves(pathPoints)
			: buildDrawingData(pathPoints)

		const drawing: Drawing = {
			id: `drawing-${Date.now()}`,
			points,
			segments,
			style,
			annotations: [],
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

/**
 * Build drawing data with shared point pool architecture.
 * Creates points once in a shared pool, segments reference them by ID.
 */
function buildDrawingData(coords: Coordinate[]) {
	const points: Record<
		string,
		import('../../types/drawing.types').ControlPoint
	> = {}
	const segments: import('../../types/drawing.types').PathSegment[] = []

	// Create unique points in the shared pool (no duplicates at boundaries)
	for (let i = 0; i < coords.length; i++) {
		const id = `p-${i}`
		const coord = coords[i]!
		points[id] = {
			id,
			x: coord.x,
			y: coord.y,
			type: 'corner',
		}
	}

	// Create segments referencing shared points by ID
	for (let i = 1; i < coords.length; i++) {
		segments.push({
			type: 'line',
			pointIds: [`p-${i - 1}`, `p-${i}`], // References, not copies
		})
	}

	return { points, segments }
}

