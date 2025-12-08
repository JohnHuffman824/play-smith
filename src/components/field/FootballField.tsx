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
 * - Dynamic height based on viewport aspect ratio
 * - Bottom-anchored, extends upward as needed
 */
interface FootballFieldProps {
	className?: string
}

export function FootballField({ className }: FootballFieldProps) {
	const svgRef = React.useRef<SVGSVGElement>(null)
	const [fieldHeight, setFieldHeight] = React.useState(360)

	// College football field dimensions in feet
	const FIELD_WIDTH = 160
	const HASH_SPACING = 3
	const LEFT_HASH_POSITION = 60
	const RIGHT_HASH_POSITION = 100
	const NUMBER_HEIGHT = 6
	const NUMBER_TOP_FROM_EDGE = 15

	// Calculate dynamic field height based on container aspect ratio
	React.useEffect(() => {
		const updateFieldHeight = () => {
			if (svgRef.current) {
				const container = svgRef.current.parentElement
				if (container) {
					const { width, height } = container.getBoundingClientRect()
					if (width > 0) {
						// Calculate height in "feet" based on aspect ratio
						// Maintain 160 feet width, calculate proportional height
						const calculatedHeight = (height / width) * FIELD_WIDTH
						// Round up to nearest yard (3 feet) for clean rendering
						const heightInYards = Math.ceil(calculatedHeight / HASH_SPACING)
						setFieldHeight(heightInYards * HASH_SPACING)
					}
				}
			}
		}

		updateFieldHeight()

		const resizeObserver = new ResizeObserver(updateFieldHeight)
		if (svgRef.current?.parentElement) {
			resizeObserver.observe(svgRef.current.parentElement)
		}

		return () => resizeObserver.disconnect()
	}, [FIELD_WIDTH, HASH_SPACING])

	const maxYards = Math.floor(fieldHeight / HASH_SPACING)
	const fieldMarkers: React.ReactNode[] = []

	for (let yards = 0; yards <= maxYards; yards++) {
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
					stroke='#a9a9a9'
					strokeWidth={1}
				/>
			)

			// Show hashtag markers at 10-yard intervals
			// Position: top at 15 feet from edge, 6 feet tall
			if (yards % 10 === 0 && yards >= 20 && yards <= 100) {
				const leftNumberX =
					NUMBER_TOP_FROM_EDGE + NUMBER_HEIGHT / 2
				fieldMarkers.push(
					<text
						key={`label-left-${yards}`}
						x={leftNumberX}
						y={yPosition}
						fontSize={NUMBER_HEIGHT}
						fill='#919191'
						textAnchor='middle'
						dominantBaseline='middle'
						transform={`rotate(-90 ${leftNumberX} ${yPosition})`}
					>
						#  #
					</text>
				)

				const rightNumberX =
					FIELD_WIDTH -
					NUMBER_TOP_FROM_EDGE -
					NUMBER_HEIGHT / 2
				fieldMarkers.push(
					<text
						key={`label-right-${yards}`}
						x={rightNumberX}
						y={yPosition}
						fontSize={NUMBER_HEIGHT}
						fill='#919191'
						textAnchor='middle'
						dominantBaseline='middle'
						transform={`rotate(90 ${rightNumberX} ${yPosition})`}
					>
						#  #
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
					stroke='#a9a9a9'
					strokeWidth={0.5}
				/>
			)

			fieldMarkers.push(
				<line
					key={`right-hash-${yards}`}
					x1={RIGHT_HASH_POSITION - 3}
					y1={yPosition}
					x2={RIGHT_HASH_POSITION + 3}
					y2={yPosition}
					stroke='#a9a9a9'
					strokeWidth={0.5}
				/>
			)
		}
	}

	const sidelines = (
		<>
			{/* Left sideline */}
			<line
				x1={0}
				y1={0}
				x2={0}
				y2={fieldHeight}
				stroke='#a9a9a9'
				strokeWidth={2}
			/>
			{/* Right sideline */}
			<line
				x1={FIELD_WIDTH}
				y1={0}
				x2={FIELD_WIDTH}
				y2={fieldHeight}
				stroke='#a9a9a9'
				strokeWidth={2}
			/>
			{/* Top boundary (extends as viewport grows) */}
			<line
				x1={0}
				y1={0}
				x2={FIELD_WIDTH}
				y2={0}
				stroke='#a9a9a9'
				strokeWidth={2}
			/>
			{/* Bottom boundary (locked to viewport bottom) */}
			<line
				x1={0}
				y1={fieldHeight}
				x2={FIELD_WIDTH}
				y2={fieldHeight}
				stroke='#a9a9a9'
				strokeWidth={2}
			/>
		</>
	)

	return (
		<svg
			ref={svgRef}
			viewBox={`0 0 ${FIELD_WIDTH} ${fieldHeight}`}
			preserveAspectRatio='none'
			className={className}
			style={{
				width: '100%',
				height: '100%',
				backgroundColor: '#f2f2f2',
				display: 'block',
			}}
		>
			{sidelines}
			{fieldMarkers}
		</svg>
	)
}
