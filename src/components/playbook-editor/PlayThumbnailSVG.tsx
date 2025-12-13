import type {
	Drawing,
	ControlPoint,
	Coordinate
} from '@/types/drawing.types'
import {
	applyChaikin,
	CHAIKIN_ITERATIONS,
} from '@/utils/chaikin.utils'
import { useTheme } from '@/contexts/SettingsContext'
import { getThemeAwareColor } from '@/utils/colorUtils'
import {
	ARROW_LENGTH_MULTIPLIER,
	TSHAPE_LENGTH_MULTIPLIER,
	ARROW_ANGLE_DEGREES,
	LINE_END_NONE,
	LINE_END_ARROW,
	LINE_END_TSHAPE,
	LINE_OF_SCRIMMAGE,
	LEFT_HASH_CENTER,
	RIGHT_HASH_CENTER,
	HASH_WIDTH,
	HASH_SPACING,
} from '@/constants/field.constants'

interface ThumbnailPlayer {
	id: string
	x: number
	y: number
	label: string
	color: string
	isLineman?: boolean
}

type PlayThumbnailSVGProps = {
	drawings: Drawing[]
	players?: ThumbnailPlayer[]
	className?: string
}

// Field constants for thumbnail rendering
const FIELD_WIDTH_FEET = 160
const FIELD_VIEW_HEIGHT_FEET = 90  // Show 90 feet to match 16:9 aspect ratio
const FIELD_VIEW_Y_OFFSET = 0      // Start view at Y=0 (show from bottom of field)
const PLAYER_RADIUS_FEET = 2.0     // Player circle radius
const MIN_THUMBNAIL_STROKE_WIDTH = 1.0 // Minimum stroke width for visibility
const NUMBER_HEIGHT = 6            // Height of yard number markers in feet
const NUMBER_FROM_EDGE = 15        // Distance from field edge to numbers in feet

/**
 * Check if drawings have valid points
 */
function hasValidDrawings(drawings: Drawing[]): boolean {
	if (drawings.length === 0) return false

	for (const drawing of drawings) {
		for (const pointId in drawing.points) {
			const point = drawing.points[pointId]
			if (point) return true
		}
	}

	return false
}

/**
 * Transform field coordinates to SVG viewBox coordinates
 * Field coordinates: Y=0 at bottom, increasing upward
 * SVG coordinates: Y=0 at top, increasing downward
 */
function transformPoint(
	point: Coordinate,
	viewBoxWidth: number,
	_viewBoxHeight: number,
	padding: number
): Coordinate {
	const availableWidth = viewBoxWidth - 2 * padding
	const scale = availableWidth / FIELD_WIDTH_FEET

	const x = point.x * scale + padding

	// Shift Y by offset, then flip
	// Field Y=15 should map to bottom, Y=75 to top
	const adjustedY = point.y - FIELD_VIEW_Y_OFFSET
	const y = (FIELD_VIEW_HEIGHT_FEET - adjustedY) * scale + padding

	return { x, y }
}

/**
 * Build SVG path string from drawing data
 */
function buildPathString(
	drawing: Drawing,
	viewBoxWidth: number,
	viewBoxHeight: number,
	padding: number
): string {
	if (drawing.segments.length === 0) return ''

	// Check if this should be smoothed (all line segments with curve mode)
	const isAllLineSegments = drawing.segments.every(s => s.type === 'line')
	const shouldSmooth = isAllLineSegments && drawing.style.pathMode === 'curve'

	if (shouldSmooth) {
		// Collect all unique points in order
		const seenPoints = new Set<string>()
		const allPoints: Coordinate[] = []

		for (const segment of drawing.segments) {
			for (const pointId of segment.pointIds) {
				if (!seenPoints.has(pointId)) {
					seenPoints.add(pointId)
					const point = drawing.points[pointId]
					if (point) allPoints.push(point)
				}
			}
		}

		if (allPoints.length < 2) return ''

		// Transform to SVG coords, apply smoothing, build path
		const transform = (p: Coordinate) => transformPoint(p, viewBoxWidth, viewBoxHeight, padding)
		const transformed = allPoints.map(transform)
		const smoothed = applyChaikin(transformed, CHAIKIN_ITERATIONS)

		if (smoothed.length === 0) return ''

		const commands: string[] = [`M ${smoothed[0]!.x.toFixed(2)} ${smoothed[0]!.y.toFixed(2)}`]
		for (let i = 1; i < smoothed.length; i++) {
			const point = smoothed[i]
			if (point) {
				commands.push(`L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
			}
		}
		return commands.join(' ')
	}

	const commands: string[] = []

	for (let i = 0; i < drawing.segments.length; i++) {
		const segment = drawing.segments[i]
		if (!segment) continue

		// Get points for this segment
		const pointIds = segment.pointIds
		if (pointIds.length === 0) continue

		// Transform to SVG coordinates
		const transform = (p: Coordinate) =>
			transformPoint(
				p,
				viewBoxWidth,
				viewBoxHeight,
				padding
			)

		if (i === 0) {
			// Move to first point
			const firstPointId = pointIds[0]
			if (firstPointId !== undefined) {
				const firstPoint = drawing.points[firstPointId]
				if (firstPoint) {
					const transformed = transform(firstPoint)
					const x = transformed.x.toFixed(2)
					const y = transformed.y.toFixed(2)
					commands.push(`M ${x} ${y}`)
				}
			}
		}

		if (segment.type === 'line') {
			// Line to last point in segment
			const lastPointId = pointIds[pointIds.length - 1]
			if (lastPointId === undefined) continue
			const lastPoint = drawing.points[lastPointId]
			if (lastPoint) {
				const transformed = transform(lastPoint)
				const x = transformed.x.toFixed(2)
				const y = transformed.y.toFixed(2)
				commands.push(`L ${x} ${y}`)
			}
		} else if (segment.type === 'quadratic') {
			// Quadratic curve: Q controlX controlY endX endY
			if (pointIds.length >= 2) {
				const controlPointId = pointIds[0]
				const endPointId = pointIds[1]
				if (controlPointId === undefined || endPointId === undefined) continue
				const controlPoint = drawing.points[controlPointId]
				const endPoint = drawing.points[endPointId]
				if (controlPoint && endPoint) {
					const c = transform(controlPoint)
					const e = transform(endPoint)
					const cx = c.x.toFixed(2)
					const cy = c.y.toFixed(2)
					const ex = e.x.toFixed(2)
					const ey = e.y.toFixed(2)
					commands.push(`Q ${cx} ${cy} ${ex} ${ey}`)
				}
			}
		} else if (segment.type === 'cubic') {
			// Cubic curve: C cp1X cp1Y cp2X cp2Y endX endY
			if (pointIds.length === 2) {
				// NEW FORMAT: pointIds = [fromId, toId], handles in nodes
				const fromPointId = pointIds[0]
				const toPointId = pointIds[1]
				if (fromPointId === undefined || toPointId === undefined) continue
				const fromPoint = drawing.points[fromPointId]
				const toPoint = drawing.points[toPointId]
				if (fromPoint && toPoint) {
					// Calculate absolute control points from handles
					const cp1: Coordinate = {
						x: fromPoint.x + (fromPoint.handleOut?.x ?? 0),
						y: fromPoint.y + (fromPoint.handleOut?.y ?? 0)
					}
					const cp2: Coordinate = {
						x: toPoint.x + (toPoint.handleIn?.x ?? 0),
						y: toPoint.y + (toPoint.handleIn?.y ?? 0)
					}
					const c1 = transform(cp1)
					const c2 = transform(cp2)
					const e = transform(toPoint)
					const c1x = c1.x.toFixed(2)
					const c1y = c1.y.toFixed(2)
					const c2x = c2.x.toFixed(2)
					const c2y = c2.y.toFixed(2)
					const ex = e.x.toFixed(2)
					const ey = e.y.toFixed(2)
					commands.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`)
				}
			} else if (pointIds.length >= 3) {
				// OLD FORMAT: pointIds = [cp1Id, cp2Id, endId]
				const cp1PointId = pointIds[0]
				const cp2PointId = pointIds[1]
				const endPointId = pointIds[2]
				if (cp1PointId === undefined || cp2PointId === undefined || endPointId === undefined) continue
				const cp1Point = drawing.points[cp1PointId]
				const cp2Point = drawing.points[cp2PointId]
				const endPoint = drawing.points[endPointId]
				if (cp1Point && cp2Point && endPoint) {
					const c1 = transform(cp1Point)
					const c2 = transform(cp2Point)
					const e = transform(endPoint)
					const c1x = c1.x.toFixed(2)
					const c1y = c1.y.toFixed(2)
					const c2x = c2.x.toFixed(2)
					const c2y = c2.y.toFixed(2)
					const ex = e.x.toFixed(2)
					const ey = e.y.toFixed(2)
					commands.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`)
				}
			}
		}
	}

	return commands.join(' ')
}

/**
 * Build arrow SVG path for line endings
 */
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

/**
 * Build T-shape SVG path for line endings
 */
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

/**
 * Calculate the end direction (angle and point) from a drawing's segments
 */
function getEndDirection(
	drawing: Drawing,
	viewBoxWidth: number,
	viewBoxHeight: number,
	padding: number
): { angle: number; point: Coordinate } | undefined {
	if (drawing.segments.length === 0) return undefined

	// Get the last segment
	const lastSegment = drawing.segments[drawing.segments.length - 1]
	if (!lastSegment || lastSegment.pointIds.length === 0) return undefined

	// Get the last point
	const lastPointId = lastSegment.pointIds[lastSegment.pointIds.length - 1]
	if (lastPointId === undefined) return undefined
	const lastPoint = drawing.points[lastPointId]
	if (!lastPoint) return undefined

	// Find second-to-last point for angle calculation
	let secondToLastPoint: ControlPoint | undefined

	// Try to get second-to-last from current segment
	if (lastSegment.pointIds.length >= 2) {
		const secondToLastId = lastSegment.pointIds[lastSegment.pointIds.length - 2]
		if (secondToLastId !== undefined) {
			secondToLastPoint = drawing.points[secondToLastId]
		}
	}

	// If not found, try previous segment
	if (!secondToLastPoint && drawing.segments.length >= 2) {
		const prevSegment = drawing.segments[drawing.segments.length - 2]
		if (prevSegment && prevSegment.pointIds.length > 0) {
			const prevLastId = prevSegment.pointIds[prevSegment.pointIds.length - 1]
			if (prevLastId !== undefined) {
				secondToLastPoint = drawing.points[prevLastId]
			}
		}
	}

	if (!secondToLastPoint) return undefined

	// Transform points to SVG coordinates
	const transform = (p: Coordinate) =>
		transformPoint(p, viewBoxWidth, viewBoxHeight, padding)

	const endPointTransformed = transform(lastPoint)
	const prevPointTransformed = transform(secondToLastPoint)

	// Calculate angle from previous to end point
	const dx = endPointTransformed.x - prevPointTransformed.x
	const dy = endPointTransformed.y - prevPointTransformed.y
	const angle = Math.atan2(dy, dx)

	return { angle, point: endPointTransformed }
}

/**
 * Render field background elements (yard lines, hash marks, LOS) for thumbnail
 */
function renderFieldBackground(
	viewBoxWidth: number,
	viewBoxHeight: number,
	padding: number,
	theme: 'light' | 'dark'
): React.ReactNode[] {
	const elements: React.ReactNode[] = []

	// Theme-aware colors (matching FootballField.tsx)
	const lineColor = theme === 'dark' ? '#4b5563' : '#a9a9a9'
	const losLineColor = theme === 'dark' ? '#60A5FA' : '#3B82F6'
	const textColor = theme === 'dark' ? '#6b7280' : '#919191'
	const lineOpacity = theme === 'dark' ? 0.6 : 0.4
	const losOpacity = theme === 'dark' ? 0.9 : 0.8
	const textOpacity = theme === 'dark' ? 0.5 : 0.3

	// Helper to transform field coordinates to SVG
	const transform = (p: Coordinate) =>
		transformPoint(p, viewBoxWidth, viewBoxHeight, padding)

	// Generate yard lines and hash marks for visible area
	const minY = FIELD_VIEW_Y_OFFSET
	const maxY = FIELD_VIEW_Y_OFFSET + FIELD_VIEW_HEIGHT_FEET

	for (let yFeet = minY; yFeet <= maxY; yFeet += HASH_SPACING) {
		const isYardLine = yFeet % (HASH_SPACING * 5) === 0
		const isLOS = yFeet === LINE_OF_SCRIMMAGE

		// Get SVG y coordinate
		const y = transform({ x: 0, y: yFeet }).y

		if (isYardLine) {
			// Full yard line (every 5 yards) - extends to edges
			elements.push(
				<line
					key={`yard-${yFeet}`}
					x1={0}
					y1={y}
					x2={viewBoxWidth}
					y2={y}
					stroke={isLOS ? losLineColor : lineColor}
					strokeWidth={isLOS ? 0.8 : 0.5}
					opacity={isLOS ? losOpacity : lineOpacity}
				/>
			)

			// Add number labels at 10-yard intervals
			if (yFeet % 10 === 0 && yFeet > 0) {
				const scale = (viewBoxWidth - 2 * padding) / FIELD_WIDTH_FEET
				const fontSize = NUMBER_HEIGHT * scale
				const numberCenterX = NUMBER_FROM_EDGE + NUMBER_HEIGHT / 2
				const leftX = transform({ x: numberCenterX, y: 0 }).x
				const rightX = transform({
					x: FIELD_WIDTH_FEET - numberCenterX,
					y: 0
				}).x

				elements.push(
					<text
						key={`label-left-${yFeet}`}
						x={leftX}
						y={y}
						fontSize={fontSize}
						fill={textColor}
						textAnchor="middle"
						dominantBaseline="middle"
						transform={`rotate(-90 ${leftX} ${y})`}
						opacity={textOpacity}
					>
						#  #
					</text>
				)

				elements.push(
					<text
						key={`label-right-${yFeet}`}
						x={rightX}
						y={y}
						fontSize={fontSize}
						fill={textColor}
						textAnchor="middle"
						dominantBaseline="middle"
						transform={`rotate(90 ${rightX} ${y})`}
						opacity={textOpacity}
					>
						#  #
					</text>
				)
			}
		} else {
			// Hash marks only (every yard, not 5-yard intervals)
			const leftHashStart = transform({ x: LEFT_HASH_CENTER - HASH_WIDTH / 2, y: 0 }).x
			const leftHashEnd = transform({ x: LEFT_HASH_CENTER + HASH_WIDTH / 2, y: 0 }).x

			elements.push(
				<line
					key={`left-hash-${yFeet}`}
					x1={leftHashStart}
					y1={y}
					x2={leftHashEnd}
					y2={y}
					stroke={lineColor}
					strokeWidth={0.3}
					opacity={0.6}
				/>
			)

			const rightHashStart = transform({ x: RIGHT_HASH_CENTER - HASH_WIDTH / 2, y: 0 }).x
			const rightHashEnd = transform({ x: RIGHT_HASH_CENTER + HASH_WIDTH / 2, y: 0 }).x

			elements.push(
				<line
					key={`right-hash-${yFeet}`}
					x1={rightHashStart}
					y1={y}
					x2={rightHashEnd}
					y2={y}
					stroke={lineColor}
					strokeWidth={0.3}
					opacity={0.6}
				/>
			)
		}
	}

	return elements
}

export function PlayThumbnailSVG({ drawings, players = [], className }: PlayThumbnailSVGProps) {
	const { theme } = useTheme()
	const hasContent = hasValidDrawings(drawings) || players.length > 0
	if (!hasContent) {
		return null
	}

	const viewBoxWidth = 160
	const viewBoxHeight = 90
	const padding = 5
	const scale = (viewBoxWidth - 2 * padding) / FIELD_WIDTH_FEET

	// Player outline: black in light mode, white in dark mode
	const playerStroke = theme === 'dark' ? 'white' : 'black'

	// Field background color
	const fieldBg = theme === 'dark' ? '#1f2937' : '#f2f2f2'

	return (
		<svg
			viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
			className={className}
			preserveAspectRatio="xMidYMid meet"
		>
			{/* Field background */}
			<rect
				x={0}
				y={0}
				width={viewBoxWidth}
				height={viewBoxHeight}
				fill={fieldBg}
			/>

			{/* Field markers (yard lines, hash marks, LOS) */}
			{renderFieldBackground(viewBoxWidth, viewBoxHeight, padding, theme)}

			{/* Render drawings */}
			{drawings.map((drawing, index) => {
				const pathString = buildPathString(
					drawing,
					viewBoxWidth,
					viewBoxHeight,
					padding
				)
				if (!pathString) return null

				// Apply theme-aware color switching for visibility
				const displayColor = getThemeAwareColor(drawing.style.color, theme)
				const isDashed = drawing.style.lineStyle === 'dashed'
				const scaledStrokeWidth = Math.max(drawing.style.strokeWidth * 0.5, MIN_THUMBNAIL_STROKE_WIDTH)

				// Calculate line ending if needed
				const endDirection = drawing.style.lineEnd !== LINE_END_NONE
					? getEndDirection(drawing, viewBoxWidth, viewBoxHeight, padding)
					: undefined

				let lineEndingPath: string | undefined
				if (endDirection) {
					if (drawing.style.lineEnd === LINE_END_ARROW) {
						lineEndingPath = buildArrow(endDirection.point, endDirection.angle, scaledStrokeWidth)
					} else if (drawing.style.lineEnd === LINE_END_TSHAPE) {
						lineEndingPath = buildTShape(endDirection.point, endDirection.angle, scaledStrokeWidth)
					}
				}

				return (
					<g key={index}>
						<path
							d={pathString}
							stroke={displayColor}
							strokeWidth={scaledStrokeWidth}
							fill="none"
							strokeDasharray={isDashed ? '2,2' : undefined}
						/>
						{lineEndingPath && (
							<path
								d={lineEndingPath}
								stroke={displayColor}
								strokeWidth={scaledStrokeWidth}
								fill="none"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						)}
					</g>
				)
			})}

			{/* Render players on top */}
			{players.map((player) => {
				const pos = transformPoint(
					{ x: player.x, y: player.y },
					viewBoxWidth,
					viewBoxHeight,
					padding
				)
				const radius = PLAYER_RADIUS_FEET * scale
				return (
					<circle
						key={player.id}
						cx={pos.x}
						cy={pos.y}
						r={radius}
						fill={player.color}
						stroke={playerStroke}
						strokeWidth={0.5}
					/>
				)
			})}
		</svg>
	)
}
