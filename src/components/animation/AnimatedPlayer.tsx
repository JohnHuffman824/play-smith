/**
 * AnimatedPlayer - Renders a player marker during animation playback.
 * A simplified, non-interactive version of Player for animation display.
 */

import { useMemo } from 'react'
import type { Coordinate } from '@/types'
import type { FieldCoordinateSystem } from '@/utils'
import { PLAYER_RADIUS_FEET } from '@/constants'
import { useTheme } from '../../contexts/SettingsContext'
import './animated-player.css'

/**
 * Calculate the luminance of a color to determine if text should be black or white
 * Uses WCAG relative luminance formula for accessibility
 */
function getTextColorForBackground(hexColor: string): string {
	// Remove # if present
	const hex = hexColor.replace('#', '')

	// Parse RGB values
	const r = parseInt(hex.substring(0, 2), 16) / 255
	const g = parseInt(hex.substring(2, 4), 16) / 255
	const b = parseInt(hex.substring(4, 6), 16) / 255

	// Apply gamma correction (WCAG formula)
	const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
	const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
	const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

	// Calculate relative luminance
	const luminance = 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB

	// If luminance > 0.5, background is light, use black text
	// Otherwise use white text
	return luminance > 0.5 ? 'black' : 'white'
}

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

	// Calculate text color based on background color for visibility
	const textColor = getTextColorForBackground(color)

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
				<span
					className='animated-player-label'
					style={{ fontSize: pixelRadius, color: textColor }}
				>
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
