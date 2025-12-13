/**
 * Hook to calculate animation timing from play data.
 */

import { useMemo } from 'react'
import type { Drawing } from '../types/drawing.types'
import type {
	RouteTiming,
	PlayerAnimationState,
	LoadPlayPayload,
} from '../types/animation.types'
import { ANIMATION_DEFAULTS } from '../types/animation.types'
import {
	calculateAllRouteTimings,
	calculateTotalDuration,
	getDrawingStartPoint,
} from '../utils/bezier.utils'

type Player = {
	id: string
	x: number
	y: number
	label: string
	color: string
}

type PlayData = {
	id: string
	players: Player[]
	drawings: Drawing[]
}

/**
 * Hook to calculate animation timing data from play data.
 * Returns a LoadPlayPayload ready to be passed to AnimationContext.loadPlay()
 */
export function useAnimationTiming(
	playData: PlayData | null,
	speedFps: number = ANIMATION_DEFAULTS.PLAYER_SPEED_FPS
): LoadPlayPayload | null {
	return useMemo(() => {
		if (!playData) return null

		const { id, players, drawings } = playData

		// Calculate route timings for all player-linked drawings
		const routeTimings = calculateAllRouteTimings(drawings, speedFps)

		// Build player animation states
		const playerStates: PlayerAnimationState[] = players.map((player) => {
			// Find drawing linked to this player
			const linkedDrawing = drawings.find((d) => d.playerId === player.id)

			// Get route ID and start position
			const routeId = linkedDrawing?.id ?? null
			const _routeTiming = routeId ? routeTimings.get(routeId) : null

			// Start position is either the drawing start or player position
			let startPosition = { x: player.x, y: player.y }
			if (linkedDrawing) {
				const drawingStart = getDrawingStartPoint(linkedDrawing)
				if (drawingStart) {
					startPosition = drawingStart
				}
			}

			return {
				playerId: player.id,
				currentPosition: startPosition,
				startPosition,
				progress: 0,
				routeId,
			}
		})

		// Calculate total duration (including snap count and endpoint hold)
		const totalDuration = calculateTotalDuration(routeTimings)

		return {
			playId: id,
			playerStates,
			routeTimings,
			totalDuration,
		}
	}, [playData, speedFps])
}

/**
 * Hook to get route timing for a specific drawing.
 */
export function useRouteTiming(
	drawings: Drawing[],
	drawingId: string | null,
	speedFps: number = ANIMATION_DEFAULTS.PLAYER_SPEED_FPS
): RouteTiming | null {
	return useMemo(() => {
		if (!drawingId) return null

		const drawing = drawings.find((d) => d.id === drawingId)
		if (!drawing) return null

		const timings = calculateAllRouteTimings([drawing], speedFps)
		return timings.get(drawingId) ?? null
	}, [drawings, drawingId, speedFps])
}

/**
 * Hook to check if a play has any animatable routes.
 */
export function useHasAnimatableRoutes(drawings: Drawing[]): boolean {
	return useMemo(() => {
		return drawings.some((d) => d.playerId && d.segments.length > 0)
	}, [drawings])
}

/**
 * Hook to get estimated animation duration for a play.
 */
export function useEstimatedDuration(
	drawings: Drawing[],
	speedFps: number = ANIMATION_DEFAULTS.PLAYER_SPEED_FPS
): number {
	return useMemo(() => {
		const timings = calculateAllRouteTimings(drawings, speedFps)
		return calculateTotalDuration(timings)
	}, [drawings, speedFps])
}
