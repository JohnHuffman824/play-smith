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
 * - Scale: 1 foot = 3 pixels
 */
export function FootballField() {
	// College football field dimensions in feet
	const FIELD_WIDTH = 160
	const FIELD_LENGTH = 360 // 100 yards + 2 end zones = 120 yards
	const HASH_SPACING = 3 // 3 feet apart (1 yard)
	const LEFT_HASH_POSITION = 60 // 60 feet from left edge
	const RIGHT_HASH_POSITION = 100 // 60 feet from right edge
	const NUMBER_HEIGHT = 6 // 6 feet tall
	const NUMBER_TOP_FROM_EDGE = 15 // 15 feet from edge

	// Scale for rendering (pixels per foot)
	const SCALE = 3
	const viewportWidth = FIELD_WIDTH * SCALE
	const viewportHeight = FIELD_LENGTH * SCALE

	// Generate hash marks and yard lines
	const fieldMarkers = []

	// Loop through field creating markers every 3 feet (1 yard)
	for (let yards = 0; yards <= 120; yards++) {
		const yPosition = yards * HASH_SPACING * SCALE
		const isYardLine = yards % 5 === 0

		if (isYardLine) {
			// Full width line for 5-yard increments
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

			// Add yard number labels (skip end zones)
			if (yards >= 10 && yards <= 110) {
				const fieldYard = yards <= 60 ? yards - 10 : 120 - yards
				if (
					fieldYard >= 0 &&
					fieldYard <= 50 &&
					fieldYard % 10 === 0
				) {
					// Left side number - rotated -90 degrees
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

					// Right side number - rotated 90 degrees
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
			// Hash marks only (not full width)
			// Left hash mark
			fieldMarkers.push(
				<line
					key={`left-hash-${yards}`}
					x1={LEFT_HASH_POSITION * SCALE - 6}
					y1={yPosition}
					x2={LEFT_HASH_POSITION * SCALE + 6}
					y2={yPosition}
					stroke='#000000'
					strokeWidth={1}
					opacity={0.3}
				/>
			)

			// Right hash mark
			fieldMarkers.push(
				<line
					key={`right-hash-${yards}`}
					x1={RIGHT_HASH_POSITION * SCALE - 6}
					y1={yPosition}
					x2={RIGHT_HASH_POSITION * SCALE + 6}
					y2={yPosition}
					stroke='#000000'
					strokeWidth={1}
					opacity={0.3}
				/>
			)
		}
	}

	// Sideline boundaries
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
			height='100%'
			viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
			style={{ backgroundColor: '#f2f2f2' }}
			preserveAspectRatio='xMidYMid meet'
			className='max-h-full'
		>
			{sidelines}
			{fieldMarkers}
		</svg>
	)
}

