/**
 * Canvas drawing utility functions
 * Pure functions for drawing operations on HTML5 Canvas
 */

import {
	ANGLE_AVERAGE_POINTS,
	ARROW_LENGTH_MULTIPLIER,
	ARROW_ANGLE_DEGREES,
	TSHAPE_LENGTH_MULTIPLIER,
	DASH_PATTERN_LENGTH_MULTIPLIER,
	DASH_PATTERN_GAP_MULTIPLIER,
	LINE_END_NONE,
	LINE_END_ARROW,
	LINE_END_TSHAPE,
	COMPOSITE_DESTINATION_OUT,
	COMPOSITE_SOURCE_OVER,
} from '../constants/field.constants'
import type { DrawingObject } from '../types/drawing.types'
import type { Coordinate } from '../types/field.types'

/**
 * Calculate average angle from a series of points
 * Used for drawing line endings (arrows, T-shapes) in the correct direction
 */
export function calculateAverageAngle(
	points: Array<Coordinate>,
): number {
	if (points.length < 2) return 0

	const numPointsToAverage = Math.min(
		ANGLE_AVERAGE_POINTS,
		points.length - 1,
	)
	const startIndex = points.length - numPointsToAverage - 1

	let totalAngle = 0
	let angleCount = 0

	for (let i = startIndex; i < points.length - 1; i++) {
		const p1 = points[i]
		const p2 = points[i + 1]
		if (!p1 || !p2) continue
		const segmentAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
		totalAngle += segmentAngle
		angleCount++
	}

	return totalAngle / angleCount
}

/**
 * Draw arrow head at the end of a line
 */
export function drawArrow(
	ctx: CanvasRenderingContext2D,
	endPoint: Coordinate,
	angle: number,
	brushSize: number,
): void {
	const arrowLength = brushSize * ARROW_LENGTH_MULTIPLIER
	const angle1 = angle - ARROW_ANGLE_DEGREES
	const angle2 = angle + ARROW_ANGLE_DEGREES

	ctx.beginPath()
	ctx.moveTo(endPoint.x, endPoint.y)
	ctx.lineTo(
		endPoint.x - arrowLength * Math.cos(angle1),
		endPoint.y - arrowLength * Math.sin(angle1),
	)
	ctx.moveTo(endPoint.x, endPoint.y)
	ctx.lineTo(
		endPoint.x - arrowLength * Math.cos(angle2),
		endPoint.y - arrowLength * Math.sin(angle2),
	)
	ctx.stroke()
}

/**
 * Draw T-shape at the end of a line
 */
export function drawTShape(
	ctx: CanvasRenderingContext2D,
	endPoint: Coordinate,
	angle: number,
	brushSize: number,
): void {
	const tLength = brushSize * TSHAPE_LENGTH_MULTIPLIER
	const perpAngle = angle + Math.PI / 2

	ctx.beginPath()
	ctx.moveTo(
		endPoint.x - tLength * Math.cos(perpAngle),
		endPoint.y - tLength * Math.sin(perpAngle),
	)
	ctx.lineTo(
		endPoint.x + tLength * Math.cos(perpAngle),
		endPoint.y + tLength * Math.sin(perpAngle),
	)
	ctx.stroke()
}

/**
 * Draw line ending (arrow or T-shape) at the end of a path
 */
export function drawLineEnding(
	ctx: CanvasRenderingContext2D,
	lineEnd: 'none' | 'arrow' | 'tShape',
	points: Array<Coordinate>,
	brushSize: number,
): void {
	if (lineEnd === LINE_END_NONE || points.length < 2) return

	const endPoint = points[points.length - 1]
	if (!endPoint) return
	
	const angle = calculateAverageAngle(points)

	ctx.save()
	ctx.setLineDash([])

	if (lineEnd === LINE_END_ARROW && endPoint) {
		drawArrow(ctx, endPoint, angle, brushSize)
	} else if (lineEnd === LINE_END_TSHAPE && endPoint) {
		drawTShape(ctx, endPoint, angle, brushSize)
	}

	ctx.restore()
}

/**
 * Render an erase stroke by removing pixels in a circular pattern
 */
export function renderEraseStroke(
	ctx: CanvasRenderingContext2D,
	pixelPoints: Array<Coordinate>,
	eraseSize: number,
): void {
	ctx.globalCompositeOperation = COMPOSITE_DESTINATION_OUT
	pixelPoints.forEach((point) => {
		ctx.beginPath()
		ctx.arc(point.x, point.y, eraseSize / 2, 0, Math.PI * 2)
		ctx.fill()
	})
}

/**
 * Render a draw stroke with specified style and line ending
 */
export function renderDrawStroke(
	ctx: CanvasRenderingContext2D,
	drawing: DrawingObject,
	pixelPoints: Array<Coordinate>,
): void {
	ctx.globalCompositeOperation = COMPOSITE_SOURCE_OVER
	ctx.strokeStyle = drawing.color
	ctx.lineWidth = drawing.brushSize
	ctx.lineCap = 'round'
	ctx.lineJoin = 'round'

	// Set line dash pattern
	if (drawing.lineStyle === 'dashed') {
		ctx.setLineDash([
			drawing.brushSize * DASH_PATTERN_LENGTH_MULTIPLIER,
			drawing.brushSize * DASH_PATTERN_GAP_MULTIPLIER,
		])
	} else {
		ctx.setLineDash([])
	}

	// Draw the path
	if (pixelPoints.length === 0) return
	
	const firstPoint = pixelPoints[0]!
	
	ctx.beginPath()
	ctx.moveTo(firstPoint.x, firstPoint.y)
	for (let i = 1; i < pixelPoints.length; i++) {
		const point = pixelPoints[i]!
		ctx.lineTo(point.x, point.y)
	}
	ctx.stroke()

	// Draw line ending if applicable
	drawLineEnding(
		ctx,
		drawing.lineEnd,
		pixelPoints,
		drawing.brushSize,
	)
}

/**
 * Calculate distance from a point to a line segment
 * Used for hit testing on drawn lines
 */
export function pointToLineDistance(
	point: Coordinate,
	lineStart: Coordinate,
	lineEnd: Coordinate,
): number {
	const lineLength = Math.sqrt(
		Math.pow(lineEnd.x - lineStart.x, 2) +
			Math.pow(lineEnd.y - lineStart.y, 2),
	)

	if (lineLength === 0) {
		return Math.sqrt(
			Math.pow(point.x - lineStart.x, 2) +
				Math.pow(point.y - lineStart.y, 2),
		)
	}

	const t =
		((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
			(point.y - lineStart.y) * (lineEnd.y - lineStart.y)) /
		Math.pow(lineLength, 2)

	const closestPoint = {
		x: lineStart.x + t * (lineEnd.x - lineStart.x),
		y: lineStart.y + t * (lineEnd.y - lineStart.y),
	}

	if (t < 0) {
		closestPoint.x = lineStart.x
		closestPoint.y = lineStart.y
	} else if (t > 1) {
		closestPoint.x = lineEnd.x
		closestPoint.y = lineEnd.y
	}

	return Math.sqrt(
		Math.pow(point.x - closestPoint.x, 2) +
			Math.pow(point.y - closestPoint.y, 2),
	)
}

/**
 * Determine if a click point is near any line segment in a drawing
 * Used for selecting/interacting with drawings
 */
export function isPointNearDrawing(
	clickPixelPoint: Coordinate,
	drawing: DrawingObject,
	pixelPoints: Array<Coordinate>,
	brushSize: number = 15,
): boolean {
	// Use a generous tolerance to make it easier to click on lines
	// Scale with brush size but ensure a minimum of 15 pixels
	const tolerance = Math.max(15, brushSize * 2)

	// Check each line segment in the drawing
	for (let i = 0; i < pixelPoints.length - 1; i++) {
		const p1 = pixelPoints[i]
		const p2 = pixelPoints[i + 1]
		if (!p1 || !p2) continue

		// Calculate the distance from the click point to the line segment
		const distance = pointToLineDistance(clickPixelPoint, p1, p2)

		if (distance <= tolerance) {
			return true
		}
	}

	return false
}

/**
 * Get canvas coordinates from a mouse event
 * Returns pixel coordinates relative to the container
 */
export function getCanvasCoordinates(
	e: React.MouseEvent<HTMLCanvasElement>,
	containerRect: DOMRect,
): { x: number; y: number } {
	return {
		x: e.clientX - containerRect.left,
		y: e.clientY - containerRect.top,
	}
}
