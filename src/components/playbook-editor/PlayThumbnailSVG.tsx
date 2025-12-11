import type {
	Drawing,
	ControlPoint,
	PathSegment,
	Coordinate
} from '@/types/drawing.types'

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
const FIELD_VIEW_HEIGHT_FEET = 60  // Show 60 feet of vertical field
const FIELD_VIEW_Y_OFFSET = 15     // Start view at Y=15 (shifted down)
const PLAYER_RADIUS_FEET = 2.0     // Player circle radius

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
	viewBoxHeight: number,
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
			const firstPoint = drawing.points[pointIds[0]]
			if (firstPoint) {
				const transformed = transform(firstPoint)
				const x = transformed.x.toFixed(2)
				const y = transformed.y.toFixed(2)
				commands.push(`M ${x} ${y}`)
			}
		}

		if (segment.type === 'line') {
			// Line to last point in segment
			const lastPoint = drawing.points[pointIds[pointIds.length - 1]]
			if (lastPoint) {
				const transformed = transform(lastPoint)
				const x = transformed.x.toFixed(2)
				const y = transformed.y.toFixed(2)
				commands.push(`L ${x} ${y}`)
			}
		} else if (segment.type === 'quadratic') {
			// Quadratic curve: Q controlX controlY endX endY
			if (pointIds.length >= 2) {
				const controlPoint = drawing.points[pointIds[0]]
				const endPoint = drawing.points[pointIds[1]]
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
				const fromPoint = drawing.points[pointIds[0]]
				const toPoint = drawing.points[pointIds[1]]
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
				const cp1Point = drawing.points[pointIds[0]]
				const cp2Point = drawing.points[pointIds[1]]
				const endPoint = drawing.points[pointIds[2]]
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

export function PlayThumbnailSVG({ drawings, players = [], className }: PlayThumbnailSVGProps) {
	const hasContent = hasValidDrawings(drawings) || players.length > 0
	if (!hasContent) {
		return null
	}

	const viewBoxWidth = 160
	const viewBoxHeight = 60
	const padding = 5
	const scale = (viewBoxWidth - 2 * padding) / FIELD_WIDTH_FEET

	return (
		<svg
			viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
			className={className}
			preserveAspectRatio="xMidYMid meet"
		>
			{/* Render players first (behind drawings) */}
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
						stroke="white"
						strokeWidth={0.5}
					/>
				)
			})}

			{/* Render drawings on top */}
			{drawings.map((drawing, index) => {
				const pathString = buildPathString(
					drawing,
					viewBoxWidth,
					viewBoxHeight,
					padding
				)
				if (!pathString) return null

				const isDashed = drawing.style.lineStyle === 'dashed'
				return (
					<path
						key={index}
						d={pathString}
						stroke={drawing.style.color}
						strokeWidth={drawing.style.strokeWidth * 0.5}
						fill="none"
						strokeDasharray={isDashed ? '2,2' : undefined}
					/>
				)
			})}
		</svg>
	)
}
