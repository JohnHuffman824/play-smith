/**
 * GhostTrail - Renders ghost images of player start positions.
 * Shows where players began their routes for reference.
 */

import { motion, AnimatePresence } from 'framer-motion'
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

	// Filter to only players that have moved before mapping
	const movedPlayers = playerStates.filter((playerState) => {
		const dx = playerState.currentPosition.x - playerState.startPosition.x
		const dy = playerState.currentPosition.y - playerState.startPosition.y
		return Math.abs(dx) > threshold || Math.abs(dy) > threshold
	})

	return (
		<AnimatePresence>
			{movedPlayers.map((playerState) => {
				const info = playerInfo.get(playerState.playerId)

				return (
					<motion.div
						key={`ghost-${playerState.playerId}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.4 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						<AnimatedPlayer
							id={`ghost-${playerState.playerId}`}
							position={playerState.startPosition}
							coordSystem={coordSystem}
							label={info?.label ?? ''}
							color={info?.color ?? '#3b82f6'}
							showLabel={false}
							isGhost
						/>
					</motion.div>
				)
			})}
		</AnimatePresence>
	)
}
