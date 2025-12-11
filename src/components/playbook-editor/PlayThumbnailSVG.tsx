import type {
	Drawing,
	ControlPoint,
	PathSegment,
	Coordinate
} from '@/types/drawing.types'

type PlayThumbnailSVGProps = {
	drawings: Drawing[]
	className?: string
}

type BoundingBox = {
	minX: number
	maxX: number
	minY: number
	maxY: number
}

/**
 * Calculate bounding box from all drawing points
 */
function calculateBoundingBox(drawings: Drawing[]): BoundingBox | null {
	if (drawings.length === 0) return null

	let minX = Infinity
	let maxX = -Infinity
	let minY = Infinity
	let maxY = -Infinity

	for (const drawing of drawings) {
		for (const pointId in drawing.points) {
			const point = drawing.points[pointId]
			if (!point) continue

			minX = Math.min(minX, point.x)
			maxX = Math.max(maxX, point.x)
			minY = Math.min(minY, point.y)
			maxY = Math.max(maxY, point.y)

			// Also consider handle points for cubic curves
			if (point.handleIn) {
				const absX = point.x + point.handleIn.x
				const absY = point.y + point.handleIn.y
				minX = Math.min(minX, absX)
				maxX = Math.max(maxX, absX)
				minY = Math.min(minY, absY)
				maxY = Math.max(maxY, absY)
			}
			if (point.handleOut) {
				const absX = point.x + point.handleOut.x
				const absY = point.y + point.handleOut.y
				minX = Math.min(minX, absX)
				maxX = Math.max(maxX, absX)
				minY = Math.min(minY, absY)
				maxY = Math.max(maxY, absY)
			}
		}
	}

	// Handle edge case: no points or single point
	if (!isFinite(minX)) return null
	if (minX === maxX) maxX = minX + 1
	if (minY === maxY) maxY = minY + 1

	return { minX, maxX, minY, maxY }
}

/**
 * Transform field coordinates to SVG viewBox coordinates
 */
function transformPoint(
	point: Coordinate,
	bbox: BoundingBox,
	viewBoxWidth: number,
	viewBoxHeight: number,
	padding: number
): Coordinate {
	// Calculate scale to fit within viewBox with padding
	const fieldWidth = bbox.maxX - bbox.minX
	const fieldHeight = bbox.maxY - bbox.minY
	const availableWidth = viewBoxWidth - 2 * padding
	const availableHeight = viewBoxHeight - 2 * padding

	const scale = Math.min(availableWidth / fieldWidth, availableHeight / fieldHeight)

	// Center the drawing in viewBox
	const scaledWidth = fieldWidth * scale
	const scaledHeight = fieldHeight * scale
	const offsetX = padding + (availableWidth - scaledWidth) / 2
	const offsetY = padding + (availableHeight - scaledHeight) / 2

	return {
		x: (point.x - bbox.minX) * scale + offsetX,
		y: (point.y - bbox.minY) * scale + offsetY
	}
}

/**
 * Build SVG path string from drawing data
 */
function buildPathString(
	drawing: Drawing,
	bbox: BoundingBox,
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
				bbox,
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

export function PlayThumbnailSVG({ drawings, className }: PlayThumbnailSVGProps) {
	console.log('PlayThumbnailSVG received drawings:', drawings)

	// Calculate bounding box
	const bbox = calculateBoundingBox(drawings)

	// If no valid bounding box, return null (no drawings to render)
	if (!bbox) {
		console.log('No valid bounding box - no drawings to render')
		return null
	}

	const viewBoxWidth = 100
	const viewBoxHeight = 60
	const padding = 5

	return (
		<svg
			viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
			className={className}
			preserveAspectRatio="xMidYMid meet"
		>
			{drawings.map((drawing, index) => {
				const pathString = buildPathString(
					drawing,
					bbox,
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
