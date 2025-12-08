import React from 'react'

/**
 * Renders a college-specification American football field
 * with accurate dimensions and markings.
 *
 * Field specs:
 * - 160 feet wide
 * - Hash marks 60 feet from each edge (40 feet between hashes)
 * - 3 feet between hash marks (1 yard)
 * - Numbers 6 feet tall, 15 feet from edge
 * - Responsive scale based on available width
 */
interface FootballFieldProps {
	className?: string
}

export function FootballField({ className }: FootballFieldProps) {
	// College football field dimensions in feet
	const FIELD_WIDTH = 160
	const FIELD_LENGTH = 360
	const HASH_SPACING = 3
	const LEFT_HASH_POSITION = 60
	const RIGHT_HASH_POSITION = 100
	const NUMBER_HEIGHT = 6
	const NUMBER_TOP_FROM_EDGE = 15

	// Base scale for the viewBox. The SVG scales fluidly via CSS.
	const SCALE = 1
	const viewportWidth = FIELD_WIDTH * SCALE
	const viewportHeight = FIELD_LENGTH * SCALE

	const fieldMarkers: React.ReactNode[] = []

	for (let yards = 0; yards <= 120; yards++) {
		const yPosition = yards * HASH_SPACING * SCALE
		const isYardLine = yards % 5 === 0

		if (isYardLine) {
			fieldMarkers.push(
				<line
					key={`yard-${yards}`}
					x1={0}
					y1={yPosition}
					x2={viewportWidth}
					y2={yPosition}
					stroke='#000000'
					strokeWidth={yards % 10 === 0 ? 2 : 1}
					opacity={0.3}
				/>
			)

			// Only show numbers at 10-yard intervals (20, 30, 40, 50, etc.)
			if (yards % 10 === 0 && yards >= 20 && yards <= 100) {
				const fieldYard = yards <= 60 ? yards - 10 : 110 - yards

				if (fieldYard >= 10 && fieldYard <= 50) {
					const leftNumberX =
						(NUMBER_TOP_FROM_EDGE + NUMBER_HEIGHT / 2) *
						SCALE
					fieldMarkers.push(
						<text
							key={`label-left-${yards}`}
							x={leftNumberX}
							y={yPosition}
							fontSize={NUMBER_HEIGHT * SCALE}
							fill='#000000'
							opacity={0.4}
							textAnchor='middle'
							dominantBaseline='middle'
							transform={`rotate(-90 ${leftNumberX} ${yPosition})`}
						>
							{fieldYard}
						</text>
					)

					const rightNumberX =
						(FIELD_WIDTH -
							NUMBER_TOP_FROM_EDGE -
							NUMBER_HEIGHT / 2) *
						SCALE
					fieldMarkers.push(
						<text
							key={`label-right-${yards}`}
							x={rightNumberX}
							y={yPosition}
							fontSize={NUMBER_HEIGHT * SCALE}
							fill='#000000'
							opacity={0.4}
							textAnchor='middle'
							dominantBaseline='middle'
							transform={`rotate(90 ${rightNumberX} ${yPosition})`}
						>
							{fieldYard}
						</text>
					)
				}
			}
		} else {
			fieldMarkers.push(
				<line
					key={`left-hash-${yards}`}
					x1={LEFT_HASH_POSITION * SCALE - 3}
					y1={yPosition}
					x2={LEFT_HASH_POSITION * SCALE + 3}
					y2={yPosition}
					stroke='#000000'
					strokeWidth={0.5}
					opacity={0.3}
				/>
			)

			fieldMarkers.push(
				<line
					key={`right-hash-${yards}`}
					x1={RIGHT_HASH_POSITION * SCALE - 3}
					y1={yPosition}
					x2={RIGHT_HASH_POSITION * SCALE + 3}
					y2={yPosition}
					stroke='#000000'
					strokeWidth={0.5}
					opacity={0.3}
				/>
			)
		}
	}

	const sidelines = (
		<>
			<line
				x1={0}
				y1={0}
				x2={0}
				y2={viewportHeight}
				stroke='#000000'
				strokeWidth={3}
				opacity={0.4}
			/>
			<line
				x1={viewportWidth}
				y1={0}
				x2={viewportWidth}
				y2={viewportHeight}
				stroke='#000000'
				strokeWidth={3}
				opacity={0.4}
			/>
			<line
				x1={0}
				y1={0}
				x2={viewportWidth}
				y2={0}
				stroke='#000000'
				strokeWidth={3}
				opacity={0.4}
			/>
			<line
				x1={0}
				y1={viewportHeight}
				x2={viewportWidth}
				y2={viewportHeight}
				stroke='#000000'
				strokeWidth={3}
				opacity={0.4}
			/>
		</>
	)

	return (
		<svg
			width='100%'
			viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
			style={{ backgroundColor: '#f2f2f2', height: 'auto' }}
			preserveAspectRatio='xMidYMid meet'
			className={`w-full h-auto ${className ?? ''}`}
		>
			{sidelines}
			{fieldMarkers}
		</svg>
	)
}
