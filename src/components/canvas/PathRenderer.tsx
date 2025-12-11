import { useMemo } from 'react'
import {
	ARROW_ANGLE_DEGREES,
	ARROW_LENGTH_MULTIPLIER,
	DASH_PATTERN_GAP_MULTIPLIER,
	DASH_PATTERN_LENGTH_MULTIPLIER,
	LINE_END_ARROW,
	LINE_END_NONE,
	LINE_END_TSHAPE,
	SELECTION_GLOW_BLUR,
	TSHAPE_LENGTH_MULTIPLIER,
} from '../../constants/field.constants'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import type { Drawing } from '../../types/drawing.types'
import type { Coordinate } from '../../types/field.types'
import {
	isPointNearControlPoint,
	getSegmentPoints,
	getPoint,
} from '../../utils/drawing.utils'

// Chaikin smoothing for render-time curve smoothing
const CHAIKIN_ITERATIONS = 3

interface PixelPoint {
	x: number
	y: number
}

function chaikinSubdivide(points: PixelPoint[], preserveEndpoints: boolean = false): PixelPoint[] {
	if (points.length < 2) return points

	const result: PixelPoint[] = []

	// Preserve first endpoint if requested
	if (preserveEndpoints) {
		result.push(points[0])
	}

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i]
		const p1 = points[i + 1]

		// For first/last segments with endpoint preservation, only add one point
		if (preserveEndpoints && i === 0) {
			// Only add R point for first segment
			result.push({
				x: 0.25 * p0.x + 0.75 * p1.x,
				y: 0.25 * p0.y + 0.75 * p1.y,
			})
		} else if (preserveEndpoints && i === points.length - 2) {
			// Only add Q point for last segment
			result.push({
				x: 0.75 * p0.x + 0.25 * p1.x,
				y: 0.75 * p0.y + 0.25 * p1.y,
			})
		} else {
			// Normal subdivision for middle segments
			result.push({
				x: 0.75 * p0.x + 0.25 * p1.x,
				y: 0.75 * p0.y + 0.25 * p1.y,
			})
			result.push({
				x: 0.25 * p0.x + 0.75 * p1.x,
				y: 0.25 * p0.y + 0.75 * p1.y,
			})
		}
	}

	// Preserve last endpoint if requested
	if (preserveEndpoints) {
		result.push(points[points.length - 1])
	}

	return result
}

function applyChaikin(points: PixelPoint[], iterations: number): PixelPoint[] {
	let result = points
	for (let i = 0; i < iterations; i++) {
		// Preserve endpoints on every iteration to maintain start/end positions
		result = chaikinSubdivide(result, true)
	}
	return result
}

interface PathRendererProps {
	drawing: Drawing
	coordSystem: FieldCoordinateSystem
	className?: string
	onSelect?: (id: string) => void
	onSelectWithPosition?: (id: string, position: { x: number; y: number }) => void
	isSelected?: boolean
	activeTool?: 'draw' | 'select' | 'erase'
	onDelete?: (id: string) => void
	onDragStart?: (drawingId: string, feetX: number, feetY: number) => void
}

/**
 * Renders a drawing path with selection and erase handling.
 */
export function PathRenderer({
	drawing,
	coordSystem,
	className,
	onSelect,
	onSelectWithPosition,
	isSelected,
	activeTool,
	onDelete,
	onDragStart,
}: PathRendererProps) {
	const { d, endDirection } = useMemo(() => {
		return buildPath(drawing, coordSystem)
	}, [drawing, coordSystem])

	if (!d) return null

	const strokeWidth = drawing.style.strokeWidth * coordSystem.scale
	const hitPaddingPx = 12
	const hitStrokeWidth = strokeWidth + hitPaddingPx * 2
	const lineDash =
		drawing.style.lineStyle == 'dashed'
			? [
					strokeWidth * DASH_PATTERN_LENGTH_MULTIPLIER,
					strokeWidth * DASH_PATTERN_GAP_MULTIPLIER,
				]
			: []

	const ending = renderLineEnding(
		drawing,
		endDirection,
		strokeWidth,
		activeTool,
	)

	function handleClick(event: React.MouseEvent) {
		if (activeTool == 'erase' && onDelete) {
			onDelete(drawing.id)
			return
		}
		if (activeTool == 'select' && onSelectWithPosition) {
			onSelectWithPosition(drawing.id, { x: event.clientX, y: event.clientY })
		} else if (onSelect) {
			onSelect(drawing.id)
		}
	}

	function handlePointerDown(event: React.PointerEvent<SVGPathElement>) {
		if (activeTool == 'select') {
			const svg = event.currentTarget.ownerSVGElement
			if (!svg) return
			const rect = svg.getBoundingClientRect()
			const pixelX = event.clientX - rect.left
			const pixelY = event.clientY - rect.top
			const nearNode = isPointNearControlPoint(
				drawing,
				coordSystem,
				{ x: pixelX, y: pixelY },
				12,
			)
			if (nearNode) return

			if (onDragStart) {
				const feet = coordSystem.pixelsToFeet(pixelX, pixelY)
				onDragStart(drawing.id, feet.x, feet.y)
			}
		}
	}


	const eraseHover =
		activeTool == 'erase'
			? {
					stroke: 'rgba(239,68,68,0.9)',
					strokeWidth: strokeWidth * 1.15,
					filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.6))',
				}
			: {}

	const selectStyle = activeTool == 'select' ? { cursor: 'move' } : {}

	// Get linked point for indicator
	const linkedPoint = drawing.linkedPointId
		? getPoint(drawing, drawing.linkedPointId)
		: null
	const linkedPixel = linkedPoint
		? coordSystem.feetToPixels(linkedPoint.x, linkedPoint.y)
		: null

	return (
		<g className={className} onClick={handleClick}>
			{/* SVG filter for selection glow */}
			{isSelected && (
				<defs>
					<filter
						id={`glow-${drawing.id}`}
						x='-50%'
						y='-50%'
						width='200%'
						height='200%'
					>
						<feGaussianBlur
							stdDeviation={SELECTION_GLOW_BLUR}
							result='coloredBlur'
						/>
						<feMerge>
							<feMergeNode in='coloredBlur' />
							<feMergeNode in='SourceGraphic' />
						</feMerge>
					</filter>
				</defs>
			)}
			{activeTool == 'select' && (
				<path
					d={d}
					fill='none'
					stroke='transparent'
					strokeWidth={hitStrokeWidth}
					strokeLinecap='round'
					strokeLinejoin='round'
					pointerEvents='stroke'
					style={{ cursor: 'move' }}
					onPointerDown={handlePointerDown}
				/>
			)}
			<path
				d={d}
				fill='none'
				stroke={drawing.style.color}
				strokeWidth={strokeWidth}
				strokeLinecap='round'
				strokeLinejoin='round'
				strokeDasharray={lineDash.join(' ')}
				opacity={isSelected ? 0.9 : 1}
				filter={isSelected ? `url(#glow-${drawing.id})` : undefined}
				style={{ ...eraseHover, ...selectStyle }}
				pointerEvents='stroke'
				onPointerDown={handlePointerDown}
			/>
			{ending}
			{drawing.playerId && linkedPixel && (
				<circle
					cx={linkedPixel.x}
					cy={linkedPixel.y}
					r={4}
					fill='#3b82f6'
					stroke='white'
					strokeWidth={1}
					pointerEvents='none'
				/>
			)}
		</g>
	)
}

function buildPath(
	drawing: Drawing,
	coordSystem: FieldCoordinateSystem,
): { d: string; endPoints: Coordinate[]; endDirection?: { angle: number; point: Coordinate } } {
	const commands: string[] = []
	const endPoints: Coordinate[] = []

	if (drawing.segments.length === 0) return { d: '', endPoints: [] }

	// Check if this is a smooth drawing (all line segments from smooth mode)
	const isAllLineSegments = drawing.segments.every(s => s.type === 'line')
	const shouldSmooth = isAllLineSegments && drawing.style.pathMode === 'curve'

	if (shouldSmooth) {
		// Collect all unique points in order for smooth rendering
		const allPixelPoints: PixelPoint[] = []
		const seenPoints = new Set<string>()

		for (const segment of drawing.segments) {
			for (const pointId of segment.pointIds) {
				if (!seenPoints.has(pointId)) {
					seenPoints.add(pointId)
					const point = drawing.points[pointId]
					if (point) {
						allPixelPoints.push(toPixels(point, coordSystem))
					}
				}
			}
		}

		if (allPixelPoints.length < 2) {
			return { d: '', endPoints: [] }
		}

		// Apply Chaikin smoothing to pixel coordinates
		const smoothed = applyChaikin(allPixelPoints, CHAIKIN_ITERATIONS)

		// Build path from smoothed points
		commands.push(`M ${smoothed[0].x} ${smoothed[0].y}`)
		for (let i = 1; i < smoothed.length; i++) {
			commands.push(`L ${smoothed[i].x} ${smoothed[i].y}`)
		}

		// Return original endpoints for arrow rendering
		endPoints.push(allPixelPoints[0])
		endPoints.push(allPixelPoints[allPixelPoints.length - 1])

		// Calculate end direction from smoothed path
		const lastSmoothed = smoothed[smoothed.length - 1]
		const prevSmoothed = smoothed[smoothed.length - 2]
		const endAngle = Math.atan2(
			lastSmoothed.y - prevSmoothed.y,
			lastSmoothed.x - prevSmoothed.x
		)

		return {
			d: commands.join(' '),
			endPoints,
			endDirection: { angle: endAngle, point: lastSmoothed }
		}
	}

	// Original logic for non-smooth drawings (sharp mode, cubic, quadratic)
	for (let i = 0; i < drawing.segments.length; i++) {
		const segment = drawing.segments[i]
		if (!segment) continue

		// Resolve point IDs to actual points
		const points = getSegmentPoints(drawing, segment)
		if (points.length == 0) continue

		if (i == 0) {
			const first = toPixels(points[0]!, coordSystem)
			commands.push(`M ${first.x} ${first.y}`)
		}

		if (segment.type == 'line') {
			const last = points[points.length - 1]!
			const target = toPixels(last, coordSystem)
			commands.push(`L ${target.x} ${target.y}`)
			endPoints.push(target)
		} else if (segment.type == 'quadratic') {
			if (points.length < 2) continue
			const control = toPixels(points[0]!, coordSystem)
			const end = toPixels(points[1]!, coordSystem)
			commands.push(`Q ${control.x} ${control.y} ${end.x} ${end.y}`)
			endPoints.push(end)
		} else if (segment.type == 'cubic') {
			// Handle both NEW and OLD cubic formats
			if (segment.pointIds.length === 2) {
				// NEW FORMAT: pointIds = [fromId, toId], handles stored in nodes
				const fromPoint = drawing.points[segment.pointIds[0]]
				const toPoint = drawing.points[segment.pointIds[1]]
				if (!fromPoint || !toPoint) continue

				// Calculate absolute control point positions from relative handles
				const cp1: Coordinate = {
					x: fromPoint.x + (fromPoint.handleOut?.x ?? 0),
					y: fromPoint.y + (fromPoint.handleOut?.y ?? 0),
				}
				const cp2: Coordinate = {
					x: toPoint.x + (toPoint.handleIn?.x ?? 0),
					y: toPoint.y + (toPoint.handleIn?.y ?? 0),
				}

				const c1 = toPixels(cp1, coordSystem)
				const c2 = toPixels(cp2, coordSystem)
				const end = toPixels(toPoint, coordSystem)

				commands.push(
					`C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`,
				)
				endPoints.push(end)
			} else {
				// OLD FORMAT: pointIds = [cp1Id, cp2Id, endId] (backward compatibility)
				if (points.length < 3) continue
				const c1 = toPixels(points[0]!, coordSystem)
				const c2 = toPixels(points[1]!, coordSystem)
				const end = toPixels(points[2]!, coordSystem)
				commands.push(
					`C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`,
				)
				endPoints.push(end)
			}
		}
	}

	// Calculate end direction from last segment for sharp mode
	let endDirection: { angle: number; point: Coordinate } | undefined
	if (drawing.segments.length > 0) {
		const lastSeg = drawing.segments[drawing.segments.length - 1]
		const points = getSegmentPoints(drawing, lastSeg!)
		if (points.length >= 2) {
			const lastPt = toPixels(points[points.length - 1]!, coordSystem)
			const prevPt = toPixels(points[points.length - 2]!, coordSystem)
			const angle = Math.atan2(lastPt.y - prevPt.y, lastPt.x - prevPt.x)
			endDirection = { angle, point: lastPt }
		}
	}

	return { d: commands.join(' '), endPoints, endDirection }
}

function renderLineEnding(
	drawing: Drawing,
	endDirection: { angle: number; point: Coordinate } | undefined,
	strokeWidth: number,
	activeTool?: 'draw' | 'select' | 'erase',
) {
	if (drawing.style.lineEnd === LINE_END_NONE) return null
	if (!endDirection) return null

	const { angle, point: endPoint } = endDirection

	const strokeColor =
		activeTool === 'erase'
			? 'rgba(239,68,68,0.9)'
			: drawing.style.color
	const strokeW =
		activeTool === 'erase' ? strokeWidth * 1.15 : strokeWidth

	if (drawing.style.lineEnd === LINE_END_ARROW) {
		const arrowD = buildArrow(endPoint, angle, strokeWidth)
		return (
			<path
				d={arrowD}
				fill='none'
				stroke={strokeColor}
				strokeWidth={strokeW}
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		)
	}

	if (drawing.style.lineEnd === LINE_END_TSHAPE) {
		const tD = buildTShape(endPoint, angle, strokeWidth)
		return (
			<path
				d={tD}
				fill='none'
				stroke={strokeColor}
				strokeWidth={strokeW}
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		)
	}

	return null
}

function buildArrow(
	endPoint: Coordinate,
	angle: number,
	strokeWidth: number,
): string {
	const length = strokeWidth * ARROW_LENGTH_MULTIPLIER
	const angle1 = angle - ARROW_ANGLE_DEGREES
	const angle2 = angle + ARROW_ANGLE_DEGREES

	const p1 = {
		x: endPoint.x - length * Math.cos(angle1),
		y: endPoint.y - length * Math.sin(angle1),
	}
	const p2 = {
		x: endPoint.x - length * Math.cos(angle2),
		y: endPoint.y - length * Math.sin(angle2),
	}

	return [
		`M ${endPoint.x} ${endPoint.y} L ${p1.x} ${p1.y}`,
		`M ${endPoint.x} ${endPoint.y} L ${p2.x} ${p2.y}`,
	].join(' ')
}

function buildTShape(
	endPoint: Coordinate,
	angle: number,
	strokeWidth: number,
): string {
	const length = strokeWidth * TSHAPE_LENGTH_MULTIPLIER
	const perp = angle + Math.PI / 2

	const left = {
		x: endPoint.x - length * Math.cos(perp),
		y: endPoint.y - length * Math.sin(perp),
	}
	const right = {
		x: endPoint.x + length * Math.cos(perp),
		y: endPoint.y + length * Math.sin(perp),
	}

	return `M ${left.x} ${left.y} L ${right.x} ${right.y}`
}

function toPixels(
	point: Coordinate,
	coordSystem: FieldCoordinateSystem,
): Coordinate {
	return coordSystem.feetToPixels(point.x, point.y)
}

