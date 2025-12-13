/**
 * AnimatedRoute - Renders a route with animation progress indicator.
 * Shows the full route path and optionally highlights the traveled portion.
 */

import { useMemo } from 'react'
import type { Drawing } from '../../types/drawing.types'
import type { RouteTiming as _RouteTiming } from '../../types/animation.types'
import type { FieldCoordinateSystem } from '../../utils/coordinates'
import type { Coordinate } from '../../types/field.types'
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
import { getSegmentPoints, getSmoothedPoints } from '../../utils/drawing.utils'
import { useTheme } from '../../contexts/SettingsContext'
import { getThemeAwareColor } from '../../utils/colorUtils'

type AnimatedRouteProps = {
	drawing: Drawing
	coordSystem: FieldCoordinateSystem
	progress?: number
	showProgress?: boolean
	traveledColor?: string
	opacity?: number
}

export function AnimatedRoute({
	drawing,
	coordSystem,
	progress = 0,
	showProgress = false,
	traveledColor = '#22c55e', // Green for traveled
	opacity = 1,
}: AnimatedRouteProps) {
	const { theme } = useTheme()

	// Build the full SVG path
	const { d, pathLength, endPoints, endDirection } = useMemo(() => {
		return buildPathWithLength(drawing, coordSystem)
	}, [drawing, coordSystem])

	if (!d) return null

	// Apply theme-aware color switching for visibility
	const displayColor = getThemeAwareColor(drawing.style.color, theme)

	const strokeWidth = drawing.style.strokeWidth * coordSystem.scale
	const lineDash =
		drawing.style.lineStyle === 'dashed'
			? [
					strokeWidth * DASH_PATTERN_LENGTH_MULTIPLIER,
					strokeWidth * DASH_PATTERN_GAP_MULTIPLIER,
				]
			: []

	// Calculate dash offset for progress animation
	const progressOffset = showProgress ? pathLength * (1 - progress) : 0

	const ending = renderLineEnding(
		drawing,
		endPoints,
		strokeWidth,
		coordSystem,
		displayColor,
		endDirection
	)

	return (
		<g opacity={opacity} pointerEvents="none">
			{/* Full route (dimmed background) */}
			<path
				d={d}
				fill="none"
				stroke={displayColor}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray={
					lineDash.length > 0 ? lineDash.join(' ') : undefined
				}
				opacity={showProgress ? 0.3 : 1}
			/>

			{/* Traveled portion (animated) */}
			{showProgress && progress > 0 && (
				<path
					d={d}
					fill="none"
					stroke={traveledColor}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeDasharray={`${pathLength}`}
					strokeDashoffset={progressOffset}
				/>
			)}

			{/* Line ending (arrow/T-shape) */}
			{ending}
		</g>
	)
}

/**
 * Build SVG path string and calculate total path length.
 */
function buildPathWithLength(
	drawing: Drawing,
	coordSystem: FieldCoordinateSystem
): { d: string; pathLength: number; endPoints: Coordinate[]; endDirection?: { angle: number; point: Coordinate } } {
	if (drawing.segments.length === 0) {
		return { d: '', pathLength: 0, endPoints: [] }
	}

	// Get smoothed points in pixel coordinates
	const smoothed = getSmoothedPoints(drawing, (point) => toPixels(point, coordSystem))

	if (smoothed && smoothed.length >= 2) {

		// Build path from smoothed points
		const commands: string[] = [`M ${smoothed[0]!.x} ${smoothed[0]!.y}`]
		let pathLength = 0

		for (let i = 1; i < smoothed.length; i++) {
			commands.push(`L ${smoothed[i]!.x} ${smoothed[i]!.y}`)
			pathLength += distance(smoothed[i - 1]!, smoothed[i]!)
		}

		// Calculate end direction from smoothed path for arrow rendering
		const lastSmoothed = smoothed[smoothed.length - 1]!
		const prevSmoothed = smoothed[smoothed.length - 2]!
		const endAngle = Math.atan2(
			lastSmoothed.y - prevSmoothed.y,
			lastSmoothed.x - prevSmoothed.x
		)

		// Chaikin preserves endpoints, so first and last smoothed points are the original endpoints
		return {
			d: commands.join(' '),
			pathLength,
			endPoints: [smoothed[0]!, smoothed[smoothed.length - 1]!],
			endDirection: { angle: endAngle, point: lastSmoothed }
		}
	}

	// Original logic for non-smooth drawings (sharp mode, cubic, quadratic)
	const commands: string[] = []
	const endPoints: Coordinate[] = []
	let pathLength = 0
	let prevPoint: Coordinate | null = null

	for (let i = 0; i < drawing.segments.length; i++) {
		const segment = drawing.segments[i]
		if (!segment) continue

		const points = getSegmentPoints(drawing, segment)
		if (points.length === 0) continue

		if (i === 0) {
			const first = toPixels(points[0]!, coordSystem)
			commands.push(`M ${first.x} ${first.y}`)
			prevPoint = first
		}

		if (segment.type === 'line') {
			const last = points[points.length - 1]!
			const target = toPixels(last, coordSystem)
			commands.push(`L ${target.x} ${target.y}`)
			endPoints.push(target)

			if (prevPoint) {
				pathLength += distance(prevPoint, target)
			}
			prevPoint = target
		} else if (segment.type === 'quadratic') {
			if (points.length < 2) continue
			const control = toPixels(points[0]!, coordSystem)
			const end = toPixels(points[1]!, coordSystem)
			commands.push(`Q ${control.x} ${control.y} ${end.x} ${end.y}`)
			endPoints.push(end)

			if (prevPoint) {
				pathLength += approximateBezierLength(prevPoint, control, end)
			}
			prevPoint = end
		} else if (segment.type === 'cubic') {
			if (points.length < 3) continue
			const c1 = toPixels(points[0]!, coordSystem)
			const c2 = toPixels(points[1]!, coordSystem)
			const end = toPixels(points[2]!, coordSystem)
			commands.push(`C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`)
			endPoints.push(end)

			if (prevPoint) {
				pathLength += approximateCubicLength(prevPoint, c1, c2, end)
			}
			prevPoint = end
		}
	}

	return { d: commands.join(' '), pathLength, endPoints }
}

function toPixels(
	point: Coordinate,
	coordSystem: FieldCoordinateSystem
): Coordinate {
	return coordSystem.feetToPixels(point.x, point.y)
}

function distance(p1: Coordinate, p2: Coordinate): number {
	const dx = p2.x - p1.x
	const dy = p2.y - p1.y
	return Math.sqrt(dx * dx + dy * dy)
}

function approximateBezierLength(
	p0: Coordinate,
	p1: Coordinate,
	p2: Coordinate,
	samples: number = 20
): number {
	let length = 0
	let prev = p0

	for (let i = 1; i <= samples; i++) {
		const t = i / samples
		const oneMinusT = 1 - t
		const current = {
			x: oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
			y: oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
		}
		length += distance(prev, current)
		prev = current
	}

	return length
}

function approximateCubicLength(
	p0: Coordinate,
	p1: Coordinate,
	p2: Coordinate,
	p3: Coordinate,
	samples: number = 20
): number {
	let length = 0
	let prev = p0

	for (let i = 1; i <= samples; i++) {
		const t = i / samples
		const oneMinusT = 1 - t
		const oneMinusT2 = oneMinusT * oneMinusT
		const oneMinusT3 = oneMinusT2 * oneMinusT
		const t2 = t * t
		const t3 = t2 * t

		const current = {
			x:
				oneMinusT3 * p0.x +
				3 * oneMinusT2 * t * p1.x +
				3 * oneMinusT * t2 * p2.x +
				t3 * p3.x,
			y:
				oneMinusT3 * p0.y +
				3 * oneMinusT2 * t * p1.y +
				3 * oneMinusT * t2 * p2.y +
				t3 * p3.y,
		}
		length += distance(prev, current)
		prev = current
	}

	return length
}

function renderLineEnding(
	drawing: Drawing,
	endPoints: Coordinate[],
	strokeWidth: number,
	coordSystem: FieldCoordinateSystem,
	displayColor: string,
	endDirection?: { angle: number; point: Coordinate }
) {
	if (drawing.style.lineEnd === LINE_END_NONE) return null
	if (endPoints.length === 0) return null

	// For smooth drawings, use the smoothed path's end direction
	let endPoint: Coordinate
	let angle: number

	if (endDirection) {
		// Smooth drawing: use direction from smoothed path, position at control point
		endPoint = endPoints[endPoints.length - 1]!
		angle = endDirection.angle
	} else {
		// Sharp drawing: calculate from control points
		const lastSegment = drawing.segments[drawing.segments.length - 1]
		if (!lastSegment) return null

		const points = getSegmentPoints(drawing, lastSegment)
		const pixelPoints = points.map((p) => toPixels(p, coordSystem))
		if (pixelPoints.length < 2) return null

		endPoint = pixelPoints[pixelPoints.length - 1]!
		const prevPoint = pixelPoints[pixelPoints.length - 2]!

		angle = Math.atan2(
			endPoint.y - prevPoint.y,
			endPoint.x - prevPoint.x
		)
	}

	if (drawing.style.lineEnd === LINE_END_ARROW) {
		const arrowLen = strokeWidth * ARROW_LENGTH_MULTIPLIER
		const arrowAngle = ARROW_ANGLE_DEGREES

		const p1 = {
			x: endPoint.x - arrowLen * Math.cos(angle - arrowAngle),
			y: endPoint.y - arrowLen * Math.sin(angle - arrowAngle),
		}
		const p2 = {
			x: endPoint.x - arrowLen * Math.cos(angle + arrowAngle),
			y: endPoint.y - arrowLen * Math.sin(angle + arrowAngle),
		}

		return (
			<path
				d={`M ${p1.x} ${p1.y} L ${endPoint.x} ${endPoint.y} L ${p2.x} ${p2.y}`}
				fill="none"
				stroke={displayColor}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		)
	}

	if (drawing.style.lineEnd === LINE_END_TSHAPE) {
		const tLen = strokeWidth * TSHAPE_LENGTH_MULTIPLIER
		const perpAngle = angle + Math.PI / 2

		const p1 = {
			x: endPoint.x + tLen * Math.cos(perpAngle),
			y: endPoint.y + tLen * Math.sin(perpAngle),
		}
		const p2 = {
			x: endPoint.x - tLen * Math.cos(perpAngle),
			y: endPoint.y - tLen * Math.sin(perpAngle),
		}

		return (
			<path
				d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
				fill="none"
				stroke={displayColor}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
			/>
		)
	}

	return null
}
