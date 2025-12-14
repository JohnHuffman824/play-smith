/**
 * Tests for AnimationContext reducer logic
 */

import { describe, test, expect } from 'bun:test'
import type {
	AnimationState,
	AnimationAction,
	LoadPlayPayload,
	PlayerAnimationState,
	RouteTiming,
} from '../types/animation.types'
import { initialAnimationState } from '../types/animation.types'

// Import the reducer from the context file
// Note: We test the reducer logic directly without rendering components
import { updatePlayerPositions, animationReducer } from './AnimationContext'

// Test fixture factories
function createTestPlayerState(): PlayerAnimationState {
	return {
		playerId: 'player1',
		currentPosition: { x: 0, y: 0 },
		startPosition: { x: 0, y: 0 },
		progress: 0,
		routeId: null,
	}
}

function createTestRouteTiming(overrides?: Partial<RouteTiming>): RouteTiming {
	return {
		drawingId: 'drawing1',
		playerId: 'player1',
		totalLength: 10,
		duration: 1000,
		segments: [],
		startOffset: 0,
		...overrides,
	}
}

function createTestAnimationState(overrides?: Partial<AnimationState>): AnimationState {
	return {
		...initialAnimationState,
		...overrides,
	}
}

describe('animationReducer', () => {
	describe('LOAD_PLAY', () => {
		test('sets phase to ready', () => {
			const payload: LoadPlayPayload = {
				playId: 'play1',
				playerStates: [],
				routeTimings: new Map(),
				totalDuration: 5000,
			}
			const action: AnimationAction = { type: 'LOAD_PLAY', payload }
			const state = animationReducer(initialAnimationState, action)

			expect(state.phase).toBe('ready')
		})

		test('resets currentTime to 0', () => {
			const initialState = createTestAnimationState({ currentTime: 1000 })
			const payload: LoadPlayPayload = {
				playId: 'play1',
				playerStates: [],
				routeTimings: new Map(),
				totalDuration: 5000,
			}
			const action: AnimationAction = { type: 'LOAD_PLAY', payload }
			const state = animationReducer(initialState, action)

			expect(state.currentTime).toBe(0)
		})

		test('loads player states and route timings', () => {
			const playerStates = [createTestPlayerState()]
			const routeTimings = new Map([['drawing1', createTestRouteTiming()]])
			const payload: LoadPlayPayload = {
				playId: 'play1',
				playerStates,
				routeTimings,
				totalDuration: 5000,
			}
			const action: AnimationAction = { type: 'LOAD_PLAY', payload }
			const state = animationReducer(initialAnimationState, action)

			expect(state.playId).toBe('play1')
			expect(state.playerStates).toBe(playerStates)
			expect(state.routeTimings).toBe(routeTimings)
			expect(state.totalDuration).toBe(5000)
		})
	})

	describe('PLAY', () => {
		test('sets isPlaying to true', () => {
			const action: AnimationAction = { type: 'PLAY' }
			const state = animationReducer(initialAnimationState, action)

			expect(state.isPlaying).toBe(true)
		})

		test('resets to 0 when at end of animation', () => {
			const initialState = createTestAnimationState({
				currentTime: 5000,
				totalDuration: 5000,
			})
			const action: AnimationAction = { type: 'PLAY' }
			const state = animationReducer(initialState, action)

			expect(state.currentTime).toBe(0)
			expect(state.isPlaying).toBe(true)
		})

		test('transitions from ready to execution phase', () => {
			const initialState = createTestAnimationState({ phase: 'ready' })
			const action: AnimationAction = { type: 'PLAY' }
			const state = animationReducer(initialState, action)

			expect(state.phase).toBe('execution')
		})
	})

	describe('PAUSE', () => {
		test('sets isPlaying to false', () => {
			const initialState = createTestAnimationState({ isPlaying: true })
			const action: AnimationAction = { type: 'PAUSE' }
			const state = animationReducer(initialState, action)

			expect(state.isPlaying).toBe(false)
		})

		test('preserves current time', () => {
			const initialState = createTestAnimationState({
				isPlaying: true,
				currentTime: 2500,
			})
			const action: AnimationAction = { type: 'PAUSE' }
			const state = animationReducer(initialState, action)

			expect(state.currentTime).toBe(2500)
		})
	})

	describe('STOP', () => {
		test('sets isPlaying to false', () => {
			const initialState = createTestAnimationState({ isPlaying: true })
			const action: AnimationAction = { type: 'STOP' }
			const state = animationReducer(initialState, action)

			expect(state.isPlaying).toBe(false)
		})

		test('resets currentTime to 0', () => {
			const initialState = createTestAnimationState({ currentTime: 2500 })
			const action: AnimationAction = { type: 'STOP' }
			const state = animationReducer(initialState, action)

			expect(state.currentTime).toBe(0)
		})

		test('sets phase to ready', () => {
			const initialState = createTestAnimationState({ phase: 'execution' })
			const action: AnimationAction = { type: 'STOP' }
			const state = animationReducer(initialState, action)

			expect(state.phase).toBe('ready')
		})
	})

	describe('SEEK', () => {
		test('updates currentTime based on progress', () => {
			const initialState = createTestAnimationState({ totalDuration: 5000 })
			const action: AnimationAction = { type: 'SEEK', progress: 0.5 }
			const state = animationReducer(initialState, action)

			expect(state.currentTime).toBe(2500)
		})
	})

	describe('SET_SPEED', () => {
		test('updates playback speed', () => {
			const action: AnimationAction = { type: 'SET_SPEED', speed: 2 }
			const state = animationReducer(initialAnimationState, action)

			expect(state.playbackSpeed).toBe(2)
		})
	})

	describe('TICK', () => {
		test('advances currentTime by deltaTime', () => {
			const initialState = createTestAnimationState({
				currentTime: 1000,
				totalDuration: 5000,
			})
			const action: AnimationAction = { type: 'TICK', deltaTime: 100 }
			const state = animationReducer(initialState, action)

			expect(state.currentTime).toBe(1100)
		})

		test('caps at totalDuration', () => {
			const initialState = createTestAnimationState({
				currentTime: 4900,
				totalDuration: 5000,
			})
			const action: AnimationAction = { type: 'TICK', deltaTime: 200 }
			const state = animationReducer(initialState, action)

			expect(state.currentTime).toBe(5000)
		})

		test('sets phase to complete when done', () => {
			const initialState = createTestAnimationState({
				currentTime: 4900,
				totalDuration: 5000,
				phase: 'execution',
			})
			const action: AnimationAction = { type: 'TICK', deltaTime: 200 }
			const state = animationReducer(initialState, action)

			expect(state.phase).toBe('complete')
		})

		test('stops playing when complete and not looping', () => {
			const initialState = createTestAnimationState({
				currentTime: 4900,
				totalDuration: 5000,
				isPlaying: true,
				loopMode: false,
			})
			const action: AnimationAction = { type: 'TICK', deltaTime: 200 }
			const state = animationReducer(initialState, action)

			expect(state.isPlaying).toBe(false)
		})

		test('continues playing when looping', () => {
			const initialState = createTestAnimationState({
				currentTime: 4900,
				totalDuration: 5000,
				isPlaying: true,
				loopMode: true,
			})
			const action: AnimationAction = { type: 'TICK', deltaTime: 200 }
			const state = animationReducer(initialState, action)

			expect(state.isPlaying).toBe(true)
		})
	})

	describe('RESET', () => {
		test('resets to ready state', () => {
			const initialState = createTestAnimationState({
				currentTime: 2500,
				phase: 'execution',
			})
			const action: AnimationAction = { type: 'RESET' }
			const state = animationReducer(initialState, action)

			expect(state.currentTime).toBe(0)
			expect(state.phase).toBe('ready')
		})
	})

	describe('TOGGLE_GHOST_TRAIL', () => {
		test('toggles ghost trail flag', () => {
			const initialState = createTestAnimationState({ showGhostTrail: false })
			const action: AnimationAction = { type: 'TOGGLE_GHOST_TRAIL' }
			const state = animationReducer(initialState, action)

			expect(state.showGhostTrail).toBe(true)
		})
	})

	describe('TOGGLE_LOOP', () => {
		test('toggles loop mode flag', () => {
			const initialState = createTestAnimationState({ loopMode: false })
			const action: AnimationAction = { type: 'TOGGLE_LOOP' }
			const state = animationReducer(initialState, action)

			expect(state.loopMode).toBe(true)
		})
	})
})

describe('updatePlayerPositions', () => {
	test('returns start position when no route', () => {
		const playerState: PlayerAnimationState = {
			playerId: 'player1',
			currentPosition: { x: 10, y: 10 },
			startPosition: { x: 0, y: 0 },
			progress: 0,
			routeId: null,
		}
		const state = createTestAnimationState({ playerStates: [playerState] })
		const updated = updatePlayerPositions(state, 1000)

		expect(updated[0].currentPosition).toEqual({ x: 0, y: 0 })
		expect(updated[0].progress).toBe(0)
	})

	test('returns start position before route starts', () => {
		const routeTiming = createTestRouteTiming({
			startOffset: -1000, // Pre-snap route
		})
		const playerState: PlayerAnimationState = {
			playerId: 'player1',
			currentPosition: { x: 10, y: 10 },
			startPosition: { x: 0, y: 0 },
			progress: 0,
			routeId: 'drawing1',
		}
		const state = createTestAnimationState({
			playerStates: [playerState],
			routeTimings: new Map([['drawing1', routeTiming]]),
		})

		// At time 0 (before pre-snap offset), player hasn't started yet
		const updated = updatePlayerPositions(state, 0)

		expect(updated[0].currentPosition).toEqual({ x: 0, y: 0 })
		expect(updated[0].progress).toBe(0)
	})

	test('respects startOffset for pre-snap routes', () => {
		const routeTiming = createTestRouteTiming({
			startOffset: -1000, // Starts 1 second before snap
			duration: 1000,
		})
		const playerState: PlayerAnimationState = {
			playerId: 'player1',
			currentPosition: { x: 0, y: 0 },
			startPosition: { x: 0, y: 0 },
			progress: 0,
			routeId: 'drawing1',
		}
		const state = createTestAnimationState({
			playerStates: [playerState],
			routeTimings: new Map([['drawing1', routeTiming]]),
		})

		// At current time = -500, which is 500ms into the pre-snap route
		const updated = updatePlayerPositions(state, -500)

		// Progress should be 0.5 (500ms out of 1000ms duration)
		expect(updated[0].progress).toBe(0.5)
	})
})
