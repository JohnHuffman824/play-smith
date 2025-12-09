import { useMemo } from 'react'
import {
	ARROW_ANGLE_DEGREES,
	ARROW_LENGTH_MULTIPLIER,
	DASH_PATTERN_GAP_MULTIPLIER,
	DASH_PATTERN_LENGTH_MULTIPLIER,
	LINE_END_ARROW,
	LINE_END_NONE,
	LINE_END_TSHAPE,
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

interface PathRendererProps {
	drawing: Drawing
	coordSystem: FieldCoordinateSystem
	className?: string
	onSelect?: (id: string) => void
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
	isSelected,
	activeTool,
	onDelete,
	onDragStart,
}: PathRendererProps) {
	const { d, endPoints } = useMemo(() => {
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
		endPoints,
		strokeWidth,
		coordSystem,
		activeTool,
	)

	function handleClick() {
		if (activeTool == 'erase' && onDelete) {
			onDelete(drawing.id)
			return
		}
		if (onSelect) onSelect(drawing.id)
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
): { d: string; endPoints: Coordinate[] } {
	if (drawing.segments.length == 0) return { d: '', endPoints: [] }

	const commands: string[] = []
	const endPoints: Coordinate[] = []

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

	return { d: commands.join(' '), endPoints }
}

function renderLineEnding(
	drawing: Drawing,
	endPoints: Coordinate[],
	strokeWidth: number,
	coordSystem: FieldCoordinateSystem,
	activeTool?: 'draw' | 'select' | 'erase',
) {
	if (drawing.style.lineEnd == LINE_END_NONE) return null
	if (endPoints.length == 0) return null

	const lastSegment = drawing.segments[drawing.segments.length - 1]
	if (!lastSegment) return null

	// Resolve point IDs to actual points
	const points = getSegmentPoints(drawing, lastSegment)
	const pixelPoints = points.map((p) => toPixels(p, coordSystem))
	if (pixelPoints.length < 2) return null

	const endPoint = pixelPoints[pixelPoints.length - 1]!
	const prevPoint = pixelPoints[pixelPoints.length - 2]!

	const angle = Math.atan2(
		endPoint.y - prevPoint.y,
		endPoint.x - prevPoint.x,
	)

	const strokeColor =
		activeTool == 'erase'
			? 'rgba(239,68,68,0.9)'
			: drawing.style.color
	const strokeW =
		activeTool == 'erase' ? strokeWidth * 1.15 : strokeWidth

	if (drawing.style.lineEnd == LINE_END_ARROW) {
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

	if (drawing.style.lineEnd == LINE_END_TSHAPE) {
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

