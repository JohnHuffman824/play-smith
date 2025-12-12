/**
 * AnimatedPlayer - Renders a player marker during animation playback.
 * A simplified, non-interactive version of Player for animation display.
 */

import { useMemo } from 'react'
import type { Coordinate } from '../../types/field.types'
import type { FieldCoordinateSystem } from '../../utils/coordinates'
import { PLAYER_RADIUS_FEET } from '../../constants/field.constants'
import { useTheme } from '../../contexts/SettingsContext'
import './animated-player.css'

type AnimatedPlayerProps = {
	id: string
	position: Coordinate
	coordSystem: FieldCoordinateSystem
	label: string
	color?: string
	showLabel?: boolean
	opacity?: number
	isGhost?: boolean
}

export function AnimatedPlayer({
	id,
	position,
	coordSystem,
	label,
	color = '#3b82f6',
	showLabel = true,
	opacity = 1,
	isGhost = false,
}: AnimatedPlayerProps) {
	const { theme } = useTheme()
	const pixelPosition = useMemo(() => {
		return coordSystem.feetToPixels(position.x, position.y)
	}, [position.x, position.y, coordSystem])

	const pixelRadius = useMemo(() => {
		return PLAYER_RADIUS_FEET * coordSystem.scale
	}, [coordSystem.scale])

	const size = pixelRadius * 2

	// Player outline: black in light mode, white in dark mode
	const outlineColor = theme === 'dark' ? 'white' : 'black'

	return (
		<div
			data-player-id={id}
			data-ghost={isGhost}
			className='animated-player'
			style={{
				left: pixelPosition.x - pixelRadius,
				top: pixelPosition.y - pixelRadius,
				width: size,
				height: size,
				backgroundColor: isGhost ? 'transparent' : color,
				border: `2px ${isGhost ? 'dashed' : 'solid'} ${outlineColor}`,
				opacity: isGhost ? undefined : opacity,
			}}
		>
			{showLabel && !isGhost && (
				<span className='animated-player-label'>
					{label}
				</span>
			)}
		</div>
	)
}

type PlayerState = {
	playerId: string
	currentPosition: Coordinate
	label?: string
	color?: string
}

type AnimatedPlayerGroupProps = {
	players: PlayerState[]
	coordSystem: FieldCoordinateSystem
	showLabels?: boolean
}

export function AnimatedPlayerGroup({
	players,
	coordSystem,
	showLabels = true,
}: AnimatedPlayerGroupProps) {
	return (
		<>
			{players.map((player) => (
				<AnimatedPlayer
					key={player.playerId}
					id={player.playerId}
					position={player.currentPosition}
					coordSystem={coordSystem}
					label={player.label ?? player.playerId}
					color={player.color ?? '#3b82f6'}
					showLabel={showLabels}
				/>
			))}
		</>
	)
}
