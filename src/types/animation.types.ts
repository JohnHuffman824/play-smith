/**
 * Animation types for play visualization.
 */

import type { Coordinate } from './field.types'

/**
 * Animation playback phases.
 */
export type AnimationPhase = 'ready' | 'snapCount' | 'execution' | 'complete'

/**
 * Playback speed options.
 */
export type PlaybackSpeed = 0.25 | 0.5 | 1 | 1.5 | 2

/**
 * Animation state for a single player during playback.
 */
export interface PlayerAnimationState {
	playerId: string
	currentPosition: Coordinate
	startPosition: Coordinate
	progress: number // 0-1 along route
	routeId: string | null // Linked drawing ID
}

/**
 * Timing data for a single path segment.
 */
export interface SegmentTiming {
	type: 'line' | 'quadratic' | 'cubic'
	length: number // feet
	startTime: number // ms offset from animation start
	endTime: number // ms offset from animation start
	points: Coordinate[] // Resolved coordinates for interpolation
}

/**
 * Timing data for an entire route (drawing linked to player).
 */
export interface RouteTiming {
	drawingId: string
	playerId: string | null
	totalLength: number // feet
	duration: number // ms at default speed
	segments: SegmentTiming[]
}

/**
 * Main animation state.
 */
export interface AnimationState {
	// Playback state
	phase: AnimationPhase
	isPlaying: boolean
	currentTime: number // ms since execution start
	totalDuration: number // ms for full animation
	playbackSpeed: PlaybackSpeed

	// Data
	playId: string | null
	playerStates: PlayerAnimationState[]

	// Options
	showGhostTrail: boolean
	loopMode: boolean

	// Timing data (keyed by drawing ID)
	routeTimings: Map<string, RouteTiming>
}

/**
 * Animation context actions.
 */
export type AnimationAction =
	| { type: 'LOAD_PLAY'; payload: LoadPlayPayload }
	| { type: 'SET_PHASE'; phase: AnimationPhase }
	| { type: 'PLAY' }
	| { type: 'PAUSE' }
	| { type: 'STOP' }
	| { type: 'SEEK'; progress: number }
	| { type: 'SET_SPEED'; speed: PlaybackSpeed }
	| { type: 'TICK'; deltaTime: number }
	| { type: 'RESET' }
	| { type: 'TOGGLE_GHOST_TRAIL' }
	| { type: 'TOGGLE_LOOP' }
	| { type: 'UPDATE_PLAYER_STATES'; states: PlayerAnimationState[] }

/**
 * Payload for loading a play into the animation engine.
 */
export interface LoadPlayPayload {
	playId: string
	playerStates: PlayerAnimationState[]
	routeTimings: Map<string, RouteTiming>
	totalDuration: number
}

/**
 * Default animation constants.
 */
export const ANIMATION_DEFAULTS = {
	/** Player movement speed in feet per second */
	PLAYER_SPEED_FPS: 15,

	/** Snap count duration in milliseconds */
	SNAP_COUNT_DURATION: 500,

	/** Hold time at route endpoint before loop (ms) */
	ENDPOINT_HOLD_DURATION: 500,

	/** Default playback speed */
	DEFAULT_SPEED: 1 as PlaybackSpeed,

	/** Available speed options */
	SPEED_OPTIONS: [0.25, 0.5, 1, 1.5, 2] as PlaybackSpeed[],

	/** Minimum movement in feet to show ghost trail */
	GHOST_MOVEMENT_THRESHOLD: 0.5,

	/** Epsilon for direction calculation at segment boundaries */
	DIRECTION_EPSILON: 0.001,

	/** Step percentage for arrow key scrubbing (5%) */
	SCRUB_STEP_PERCENT: 0.05,
} as const

/**
 * Initial animation state.
 */
export const initialAnimationState: AnimationState = {
	phase: 'ready',
	isPlaying: false,
	currentTime: 0,
	totalDuration: 0,
	playbackSpeed: ANIMATION_DEFAULTS.DEFAULT_SPEED,
	playId: null,
	playerStates: [],
	showGhostTrail: false,
	loopMode: false,
	routeTimings: new Map(),
}
