/**
 * Animation state management context
 * Provides centralized state management for play animation playback
 */

import { createContext, useContext, useReducer, useCallback } from 'react'
import type { ReactNode } from 'react'
import type {
	AnimationState,
	AnimationAction,
	AnimationPhase,
	PlaybackSpeed,
	PlayerAnimationState,
	LoadPlayPayload,
} from '../types/animation.types'
import { initialAnimationState, ANIMATION_DEFAULTS } from '../types/animation.types'
import { getPositionAlongRoute, calculateProgress } from '../utils/animation.utils'

type AnimationContextType = {
	state: AnimationState
	dispatch: React.Dispatch<AnimationAction>
	loadPlay: (payload: LoadPlayPayload) => void
	play: () => void
	pause: () => void
	stop: () => void
	seek: (progress: number) => void
	setSpeed: (speed: PlaybackSpeed) => void
	reset: () => void
	toggleGhostTrail: () => void
	toggleLoop: () => void
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

/**
 * Update player positions based on current time.
 */
function updatePlayerPositions(
	state: AnimationState,
	currentTime: number
): PlayerAnimationState[] {
	return state.playerStates.map((playerState) => {
		// If player has no route, stay at start position
		if (!playerState.routeId) {
			return {
				...playerState,
				progress: 0,
				currentPosition: playerState.startPosition,
			}
		}

		// Get route timing for this player's linked drawing
		const routeTiming = state.routeTimings.get(playerState.routeId)
		if (!routeTiming) {
			return {
				...playerState,
				progress: 0,
				currentPosition: playerState.startPosition,
			}
		}

		// Calculate position along route
		const currentPosition = getPositionAlongRoute(routeTiming, currentTime)
		const progress = calculateProgress(currentTime, routeTiming.duration)

		return {
			...playerState,
			currentPosition,
			progress,
		}
	})
}

/**
 * Reducer for animation state.
 */
function animationReducer(
	state: AnimationState,
	action: AnimationAction
): AnimationState {
	switch (action.type) {
		case 'LOAD_PLAY':
			return {
				...state,
				phase: 'ready',
				isPlaying: false,
				currentTime: 0,
				playId: action.payload.playId,
				playerStates: action.payload.playerStates,
				routeTimings: action.payload.routeTimings,
				totalDuration: action.payload.totalDuration,
			}

		case 'SET_PHASE':
			return {
				...state,
				phase: action.phase,
			}

		case 'PLAY':
			// If at end, reset first
			if (state.currentTime >= state.totalDuration) {
				return {
					...state,
					isPlaying: true,
					currentTime: 0,
					phase: 'execution',
					playerStates: updatePlayerPositions(state, 0),
				}
			}
			return {
				...state,
				isPlaying: true,
				phase: state.phase === 'ready' ? 'execution' : state.phase,
			}

		case 'PAUSE':
			return {
				...state,
				isPlaying: false,
			}

		case 'STOP':
			return {
				...state,
				isPlaying: false,
				currentTime: 0,
				phase: 'ready',
				playerStates: updatePlayerPositions(state, 0),
			}

		case 'SEEK': {
			const newTime = action.progress * state.totalDuration
			return {
				...state,
				currentTime: newTime,
				playerStates: updatePlayerPositions(state, newTime),
			}
		}

		case 'SET_SPEED':
			return {
				...state,
				playbackSpeed: action.speed,
			}

		case 'TICK': {
			const newTime = Math.min(
				state.currentTime + action.deltaTime,
				state.totalDuration
			)
			const newPhase: AnimationPhase =
				newTime >= state.totalDuration ? 'complete' : state.phase

			return {
				...state,
				currentTime: newTime,
				phase: newPhase,
				isPlaying: newPhase === 'complete' && !state.loopMode ? false : state.isPlaying,
				playerStates: updatePlayerPositions(state, newTime),
			}
		}

		case 'RESET':
			return {
				...state,
				currentTime: 0,
				phase: 'ready',
				playerStates: updatePlayerPositions(state, 0),
			}

		case 'TOGGLE_GHOST_TRAIL':
			return {
				...state,
				showGhostTrail: !state.showGhostTrail,
			}

		case 'TOGGLE_LOOP':
			return {
				...state,
				loopMode: !state.loopMode,
			}

		case 'UPDATE_PLAYER_STATES':
			return {
				...state,
				playerStates: action.states,
			}

		default:
			return state
	}
}

type AnimationProviderProps = {
	children: ReactNode
}

export function AnimationProvider({ children }: AnimationProviderProps) {
	const [state, dispatch] = useReducer(animationReducer, initialAnimationState)

	// Convenience methods
	const loadPlay = useCallback((payload: LoadPlayPayload) => {
		dispatch({ type: 'LOAD_PLAY', payload })
	}, [])

	const play = useCallback(() => {
		dispatch({ type: 'PLAY' })
	}, [])

	const pause = useCallback(() => {
		dispatch({ type: 'PAUSE' })
	}, [])

	const stop = useCallback(() => {
		dispatch({ type: 'STOP' })
	}, [])

	const seek = useCallback((progress: number) => {
		dispatch({ type: 'SEEK', progress })
	}, [])

	const setSpeed = useCallback((speed: PlaybackSpeed) => {
		dispatch({ type: 'SET_SPEED', speed })
	}, [])

	const reset = useCallback(() => {
		dispatch({ type: 'RESET' })
	}, [])

	const toggleGhostTrail = useCallback(() => {
		dispatch({ type: 'TOGGLE_GHOST_TRAIL' })
	}, [])

	const toggleLoop = useCallback(() => {
		dispatch({ type: 'TOGGLE_LOOP' })
	}, [])

	const value: AnimationContextType = {
		state,
		dispatch,
		loadPlay,
		play,
		pause,
		stop,
		seek,
		setSpeed,
		reset,
		toggleGhostTrail,
		toggleLoop,
	}

	return (
		<AnimationContext.Provider value={value}>
			{children}
		</AnimationContext.Provider>
	)
}

/**
 * Hook to access animation context.
 * @throws Error if used outside AnimationProvider
 */
export function useAnimation(): AnimationContextType {
	const context = useContext(AnimationContext)
	if (context === undefined) {
		throw new Error('useAnimation must be used within an AnimationProvider')
	}
	return context
}

/**
 * Optional hook that returns null if not within provider.
 * Useful for components that may or may not be in animation mode.
 */
export function useAnimationOptional(): AnimationContextType | null {
	const context = useContext(AnimationContext)
	return context ?? null
}
