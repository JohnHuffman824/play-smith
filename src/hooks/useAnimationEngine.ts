/**
 * Animation engine hook - manages the RequestAnimationFrame loop.
 */

import { useEffect, useRef, useCallback } from 'react'
import type { AnimationState, AnimationAction } from '../types/animation.types'

type UseAnimationEngineOptions = {
	state: AnimationState
	dispatch: React.Dispatch<AnimationAction>
	onComplete?: () => void
}

/**
 * Hook that manages the animation loop using RequestAnimationFrame.
 * Updates animation state at 60fps when playing.
 */
export function useAnimationEngine({
	state,
	dispatch,
	onComplete,
}: UseAnimationEngineOptions) {
	const rafIdRef = useRef<number | null>(null)
	const lastTimeRef = useRef<number>(0)
	const onCompleteRef = useRef(onComplete)

	// Keep onComplete callback ref up to date
	useEffect(() => {
		onCompleteRef.current = onComplete
	}, [onComplete])

	// Animation loop
	useEffect(() => {
		// Only run when playing and in execution phase
		if (!state.isPlaying || state.phase !== 'execution') {
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current)
				rafIdRef.current = null
			}
			lastTimeRef.current = 0
			return
		}

		function animate(timestamp: number) {
			// Initialize lastTime on first frame
			if (lastTimeRef.current === 0) {
				lastTimeRef.current = timestamp
			}

			// Calculate delta time with playback speed applied
			const rawDelta = timestamp - lastTimeRef.current
			const deltaTime = rawDelta * state.playbackSpeed
			lastTimeRef.current = timestamp

			// Dispatch tick to update state
			dispatch({ type: 'TICK', deltaTime })

			// Check if we should continue
			const newTime = state.currentTime + deltaTime

			if (newTime < state.totalDuration) {
				// Continue animation
				rafIdRef.current = requestAnimationFrame(animate)
			} else {
				// Animation complete
				if (state.loopMode) {
					// Reset and continue
					dispatch({ type: 'RESET' })
					dispatch({ type: 'PLAY' })
					rafIdRef.current = requestAnimationFrame(animate)
				} else {
					// Stop
					rafIdRef.current = null
					onCompleteRef.current?.()
				}
			}
		}

		// Start the animation loop
		rafIdRef.current = requestAnimationFrame(animate)

		// Cleanup on unmount or when dependencies change
		return () => {
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current)
				rafIdRef.current = null
			}
			lastTimeRef.current = 0
		}
	}, [
		state.isPlaying,
		state.phase,
		state.playbackSpeed,
		state.loopMode,
		state.totalDuration,
		// Note: We intentionally don't include state.currentTime
		// as it changes every frame and would cause infinite re-renders
		dispatch,
	])

	// Handle visibility change (pause when tab is hidden)
	useEffect(() => {
		function handleVisibilityChange() {
			if (document.hidden && state.isPlaying) {
				// Tab became hidden, pause animation
				dispatch({ type: 'PAUSE' })
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [state.isPlaying, dispatch])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current)
			}
		}
	}, [])
}

/**
 * Hook to check if animation is currently running.
 */
export function useIsAnimating(state: AnimationState): boolean {
	return state.isPlaying && state.phase === 'execution'
}

/**
 * Hook to get animation progress as percentage.
 */
export function useAnimationProgress(state: AnimationState): number {
	if (state.totalDuration <= 0) return 0
	return Math.min(100, (state.currentTime / state.totalDuration) * 100)
}

/**
 * Hook to get current time formatted as string (e.g., "1.5s").
 */
export function useFormattedTime(state: AnimationState): string {
	const seconds = state.currentTime / 1000
	return `${seconds.toFixed(1)}s`
}

/**
 * Hook to get total duration formatted as string.
 */
export function useFormattedDuration(state: AnimationState): string {
	const seconds = state.totalDuration / 1000
	return `${seconds.toFixed(1)}s`
}
