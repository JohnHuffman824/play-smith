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

	const fieldMarkers: React.ReactNode[] = []

	for (let yards = 0; yards <= 120; yards++) {
		const yPosition = yards * HASH_SPACING
		const isYardLine = yards % 5 === 0

		if (isYardLine) {
			fieldMarkers.push(
				<line
					key={`yard-${yards}`}
					x1={0}
					y1={yPosition}
					x2={FIELD_WIDTH}
					y2={yPosition}
					stroke='#000000'
					strokeWidth={1}
					opacity={0.3}
				/>
			)

			// Show hashtag markers at 10-yard intervals (20, 30, 40, 50, etc.)
			if (yards % 10 === 0 && yards >= 20 && yards <= 100) {
				const leftNumberX =
					(NUMBER_TOP_FROM_EDGE + NUMBER_HEIGHT / 2)
				fieldMarkers.push(
					<text
						key={`label-left-${yards}`}
						x={leftNumberX}
						y={yPosition}
						fontSize={NUMBER_HEIGHT}
						fill='#000000'
						opacity={0.4}
						textAnchor='middle'
						dominantBaseline='middle'
						transform={`rotate(-90 ${leftNumberX} ${yPosition})`}
					>
						# | #
					</text>
				)

				const rightNumberX =
					(FIELD_WIDTH -
						NUMBER_TOP_FROM_EDGE -
						NUMBER_HEIGHT / 2)
				fieldMarkers.push(
					<text
						key={`label-right-${yards}`}
						x={rightNumberX}
						y={yPosition}
						fontSize={NUMBER_HEIGHT}
						fill='#000000'
						opacity={0.4}
						textAnchor='middle'
						dominantBaseline='middle'
						transform={`rotate(90 ${rightNumberX} ${yPosition})`}
					>
						# | #
					</text>
				)
			}
		} else {
			fieldMarkers.push(
				<line
					key={`left-hash-${yards}`}
					x1={LEFT_HASH_POSITION - 3}
					y1={yPosition}
					x2={LEFT_HASH_POSITION + 3}
					y2={yPosition}
					stroke='#000000'
					strokeWidth={0.5}
					opacity={0.3}
				/>
			)

			fieldMarkers.push(
				<line
					key={`right-hash-${yards}`}
					x1={RIGHT_HASH_POSITION - 3}
					y1={yPosition}
					x2={RIGHT_HASH_POSITION + 3}
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
				y2={FIELD_LENGTH}
				stroke='#000000'
				strokeWidth={3}
				opacity={0.4}
			/>
			<line
				x1={FIELD_WIDTH}
				y1={0}
				x2={FIELD_WIDTH}
				y2={FIELD_LENGTH}
				stroke='#000000'
				strokeWidth={3}
				opacity={0.4}
			/>
			<line
				x1={0}
				y1={0}
				x2={FIELD_WIDTH}
				y2={0}
				stroke='#000000'
				strokeWidth={3}
				opacity={0.4}
			/>
			<line
				x1={0}
				y1={FIELD_LENGTH}
				x2={FIELD_WIDTH}
				y2={FIELD_LENGTH}
				stroke='#000000'
				strokeWidth={3}
				opacity={0.4}
			/>
		</>
	)

	return (
		<svg
			viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_LENGTH}`}
			preserveAspectRatio='xMinYMin meet'
			className={className}
			style={{
				width: '100%',
				height: 'auto',
				backgroundColor: '#f2f2f2',
				display: 'block',
			}}
		>
			{sidelines}
			{fieldMarkers}
		</svg>
	)
}
