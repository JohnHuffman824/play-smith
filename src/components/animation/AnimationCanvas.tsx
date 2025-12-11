/**
 * AnimationCanvas - Main canvas component for animation playback.
 * Renders the football field, animated routes, and player positions.
 */

import { useRef, useEffect, useState, useMemo } from 'react'
import { cn } from '../ui/utils'
import { FootballField } from '../field/FootballField'
import { AnimatedPlayer } from './AnimatedPlayer'
import { AnimatedRoute } from './AnimatedRoute'
import { GhostTrail } from './GhostTrail'
import { useAnimation } from '../../contexts/AnimationContext'
import { useAnimationEngine } from '../../hooks/useAnimationEngine'
import { useFieldCoordinates } from '../../hooks/useFieldCoordinates'
import type { Drawing } from '../../types/drawing.types'

type Player = {
	id: string
	x: number
	y: number
	label: string
	color: string
}

type AnimationCanvasProps = {
	drawings: Drawing[]
	players: Player[]
	className?: string
	onComplete?: () => void
}

export function AnimationCanvas({
	drawings,
	players,
	className,
	onComplete,
}: AnimationCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
	const { state, dispatch } = useAnimation()

	useEffect(() => {
		const updateDimensions = () => {
			if (!containerRef.current) return
			const width = containerRef.current.clientWidth
			const height = containerRef.current.clientHeight
			setDimensions({ width, height })
		}

		updateDimensions()
		window.addEventListener('resize', updateDimensions)
		return () => window.removeEventListener('resize', updateDimensions)
	}, [])

	const coordSystem = useFieldCoordinates({
		containerWidth: dimensions.width,
		containerHeight: dimensions.height,
	})

	useAnimationEngine({
		state,
		dispatch,
		onComplete,
	})

	const playerInfo = useMemo(() => {
		const map = new Map<string, { color: string; label: string }>()
		for (const player of players) {
			map.set(player.id, { color: player.color, label: player.label })
		}
		return map
	}, [players])

	const routeProgress = useMemo(() => {
		const map = new Map<string, number>()
		for (const playerState of state.playerStates) {
			if (playerState.routeId) {
				map.set(playerState.routeId, playerState.progress)
			}
		}
		return map
	}, [state.playerStates])

	if (dimensions.width === 0 || dimensions.height === 0) {
		return (
			<div ref={containerRef} className={cn('size-full', className)} />
		)
	}

	return (
		<div
			ref={containerRef}
			className={cn('relative size-full overflow-hidden', className)}
		>
			<FootballField
				onDimensionsChange={(w, h) => setDimensions({ width: w, height: h })}
			/>

			<svg className='pointer-events-none absolute inset-0 size-full'>
				{drawings.map((drawing) => {
					const progress = routeProgress.get(drawing.id) ?? 0
					return (
						<AnimatedRoute
							key={drawing.id}
							drawing={drawing}
							coordSystem={coordSystem}
							progress={progress}
							showProgress={state.isPlaying || state.currentTime > 0}
						/>
					)
				})}
			</svg>

			{state.showGhostTrail && (
				<GhostTrail
					playerStates={state.playerStates}
					coordSystem={coordSystem}
					playerInfo={playerInfo}
				/>
			)}

			{state.playerStates.map((playerState) => {
				const info = playerInfo.get(playerState.playerId)
				return (
					<AnimatedPlayer
						key={playerState.playerId}
						id={playerState.playerId}
						position={playerState.currentPosition}
						coordSystem={coordSystem}
						label={info?.label ?? playerState.playerId}
						color={info?.color ?? '#3b82f6'}
					/>
				)
			})}
		</div>
	)
}
