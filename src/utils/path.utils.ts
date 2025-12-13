import type { Coordinate } from '../types/field.types'

interface StraightenResult {
	points: Coordinate[]
}

export function simplifyPath(
	points: Coordinate[],
	tolerance: number,
): Coordinate[] {
	if (points.length <= 2) return points

	const keep: boolean[] = new Array(points.length).fill(false)
	keep[0] = true
	keep[points.length - 1] = true

	const stack: Array<[number, number]> = [[0, points.length - 1]]

	while (stack.length > 0) {
		const segment = stack.pop()
		if (!segment) continue
		const [start, end] = segment
		let maxDist = 0
		let index = -1

		for (let i = start + 1; i < end; i++) {
			const point = points[i]
			const startPoint = points[start]
			const endPoint = points[end]
			if (!point || !startPoint || !endPoint) continue

			const dist = perpendicularDistance(point, startPoint, endPoint)
			if (dist > maxDist) {
				maxDist = dist
				index = i
			}
		}

		if (maxDist > tolerance && index != -1) {
			keep[index] = true
			stack.push([start, index])
			stack.push([index, end])
		}
	}

	return points.filter((_, i) => keep[i])
}

export function straightenSegments(
	points: Coordinate[],
	angleThreshold: number,
): StraightenResult {
	if (points.length < 3) return { points }

	const result: Coordinate[] = [points[0]!]

	for (let i = 1; i < points.length - 1; i++) {
		const prev = points[i - 1]!
		const current = points[i]!
		const next = points[i + 1]!

		const angle1 = Math.atan2(
			current.y - prev.y,
			current.x - prev.x,
		)
		const angle2 = Math.atan2(
			next.y - current.y,
			next.x - current.x,
		)

		const delta = Math.abs(normalizeAngle(angle1 - angle2))

		if (delta < angleThreshold) {
			continue
		}

		result.push(current)
	}

	result.push(points[points.length - 1]!)
	return { points: result }
}

export function detectCorners(
	points: Coordinate[],
	angleThreshold: number,
): number[] {
	const corners: number[] = []
	if (points.length < 3) return corners

	for (let i = 1; i < points.length - 1; i++) {
		const prev = points[i - 1]!
		const current = points[i]!
		const next = points[i + 1]!

		const angle1 = Math.atan2(
			current.y - prev.y,
			current.x - prev.x,
		)
		const angle2 = Math.atan2(
			next.y - current.y,
			next.x - current.x,
		)
		const delta = Math.abs(normalizeAngle(angle1 - angle2))

		if (delta >= angleThreshold) {
			corners.push(i)
		}
	}

	return corners
}

export function perpendicularDistance(
	point: Coordinate,
	lineStart: Coordinate,
	lineEnd: Coordinate,
): number {
	const area = Math.abs(
		(lineEnd.x - lineStart.x) * (lineStart.y - point.y) -
			(lineStart.x - point.x) * (lineEnd.y - lineStart.y),
	) / 2
	const base = distance(lineStart, lineEnd)
	if (base == 0) return distance(point, lineStart)
	return (2 * area) / base
}

export function distance(a: Coordinate, b: Coordinate): number {
	return Math.sqrt(
		Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2),
	)
}

function normalizeAngle(angle: number): number {
	let value = angle
	while (value <= -Math.PI) value += Math.PI * 2
	while (value > Math.PI) value -= Math.PI * 2
	return value
}

