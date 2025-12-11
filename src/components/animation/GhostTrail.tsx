/**
 * GhostTrail - Renders ghost images of player start positions.
 * Shows where players began their routes for reference.
 */

import { AnimatedPlayer } from './AnimatedPlayer'
import {
	ANIMATION_DEFAULTS,
	type PlayerAnimationState,
} from '../../types/animation.types'
import type { FieldCoordinateSystem } from '../../utils/coordinates'

type GhostTrailProps = {
	playerStates: PlayerAnimationState[]
	coordSystem: FieldCoordinateSystem
	playerInfo: Map<string, { color: string; label: string }>
}

export function GhostTrail({
	playerStates,
	coordSystem,
	playerInfo,
}: GhostTrailProps) {
	const threshold = ANIMATION_DEFAULTS.GHOST_MOVEMENT_THRESHOLD

	return (
		<>
			{playerStates.map((playerState) => {
				const info = playerInfo.get(playerState.playerId)
				const dx = playerState.currentPosition.x - playerState.startPosition.x
				const dy = playerState.currentPosition.y - playerState.startPosition.y
				const hasMoved = Math.abs(dx) > threshold || Math.abs(dy) > threshold

				if (!hasMoved) return null

				return (
					<AnimatedPlayer
						key={`ghost-${playerState.playerId}`}
						id={`ghost-${playerState.playerId}`}
						position={playerState.startPosition}
						coordSystem={coordSystem}
						label={info?.label ?? ''}
						color={info?.color ?? '#3b82f6'}
						showLabel={false}
						isGhost
					/>
				)
			})}
		</>
	)
}
