import { useEffect, useRef, useState } from 'react'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import { PathStyle, Drawing } from '../../types/drawing.types'
import { simplifyPath, straightenSegments } from '../../utils/path.utils'
import { Coordinate } from '../../types/field.types'

interface FreehandCaptureProps {
	coordSystem: FieldCoordinateSystem
	style: PathStyle
	isActive: boolean
	autoCorrect: boolean
	onCommit: (drawing: Drawing) => void
}

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

	const resetCanvas = () => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		ctx.clearRect(0, 0, canvas.width, canvas.height)
	}

	const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
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

		console.log('[FreehandCapture] start', {
			pixel,
			feet,
			lineWidthPx: ctx.lineWidth,
			isActive,
		})

		setPoints([feet])
		setIsDrawing(true)
	}

	const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
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

		if (points.length % 10 == 0) {
			console.log('[FreehandCapture] draw', {
				pointsCount: points.length,
				pixel,
				feet,
			})
		}

		setPoints((prev) => [...prev, feet])
	}

	const stopDrawing = () => {
		if (!isDrawing) return
		setIsDrawing(false)
		resetCanvas()
		commitDrawing(points)
		console.log('[FreehandCapture] stop', { pointsCount: points.length })
		setPoints([])
	}

	const commitDrawing = (captured: Coordinate[]) => {
		if (captured.length < 2) return

		let pathPoints = captured
		if (autoCorrect) {
			console.log('[FreehandCapture] simplify before', {
				points: pathPoints.length,
			})
			const simplified = simplifyPath(pathPoints, 0.5)
			const straightened = straightenSegments(simplified, Math.PI / 18)
			pathPoints = straightened.points
			console.log('[FreehandCapture] simplify after', {
				points: pathPoints.length,
			})
		}

		const segments = buildLineSegments(pathPoints)
		const drawing: Drawing = {
			id: `drawing-${Date.now()}`,
			segments,
			style,
			annotations: [],
		}

		console.log('[FreehandCapture] commit drawing', {
			segments: segments.length,
			points: pathPoints.length,
			id: drawing.id,
		})

		onCommit(drawing)
	}

	const resizeCanvas = () => {
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

function buildLineSegments(points: Coordinate[]) {
	const segments = []
	for (let i = 1; i < points.length; i++) {
		const start = points[i - 1]!
		const end = points[i]!
		segments.push({
			type: 'line' as const,
			points: [
				{
					id: `${i - 1}`,
					x: start.x,
					y: start.y,
					type: 'corner' as const,
				},
				{
					id: `${i}`,
					x: end.x,
					y: end.y,
					type: 'corner' as const,
				},
			],
		})
	}
	return segments
}

