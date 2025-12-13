/**
 * AnimationControls - Playback control bar for animation.
 * Includes play/pause, speed control, scrubber, and options.
 */

import { useCallback, useEffect } from 'react'
import {
	Play,
	Pause,
	RotateCcw,
	Repeat,
	ChevronLeft,
	ChevronRight,
	Ghost,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Slider } from '../ui/slider'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import { useAnimation } from '../../contexts/AnimationContext'
import { ANIMATION_DEFAULTS } from '../../types/animation.types'
import type { PlaybackSpeed } from '../../types/animation.types'
import {
	useAnimationProgress,
	useFormattedTime,
	useFormattedDuration,
} from '../../hooks/useAnimationEngine'
import './animation-controls.css'

type AnimationControlsProps = {
	className?: string
	onPrevPlay?: () => void
	onNextPlay?: () => void
	hasPrevPlay?: boolean
	hasNextPlay?: boolean
}

export function AnimationControls({
	className,
	onPrevPlay,
	onNextPlay,
	hasPrevPlay = false,
	hasNextPlay = false,
}: AnimationControlsProps) {
	const {
		state,
		play,
		pause,
		reset,
		seek,
		setSpeed,
		toggleGhostTrail,
		toggleLoop,
	} = useAnimation()

	const progress = useAnimationProgress(state)
	const currentTime = useFormattedTime(state)
	const totalDuration = useFormattedDuration(state)

	const handlePlayPause = useCallback(() => {
		if (state.isPlaying) {
			pause()
		} else {
			play()
		}
	}, [state.isPlaying, play, pause])

	const handleScrubberChange = useCallback(
		(value: number[]) => {
			const newProgress = (value[0] ?? 0) / 100
			seek(newProgress)
		},
		[seek]
	)

	const handleSpeedChange = useCallback(
		(value: string) => {
			const speed = parseFloat(value) as PlaybackSpeed
			setSpeed(speed)
		},
		[setSpeed]
	)

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return
			}

			const step = ANIMATION_DEFAULTS.SCRUB_STEP_PERCENT

			switch (e.key) {
				case ' ':
					e.preventDefault()
					handlePlayPause()
					break
				case 'ArrowLeft':
					if (e.shiftKey && onPrevPlay) {
						onPrevPlay()
					} else {
						const newProgress = Math.max(0, progress / 100 - step)
						seek(newProgress)
					}
					break
				case 'ArrowRight':
					if (e.shiftKey && onNextPlay) {
						onNextPlay()
					} else {
						const newProgress = Math.min(1, progress / 100 + step)
						seek(newProgress)
					}
					break
				case 'r':
				case 'R':
					reset()
					break
				case 'l':
				case 'L':
					toggleLoop()
					break
				case 'g':
				case 'G':
					toggleGhostTrail()
					break
				case '1':
					setSpeed(0.25)
					break
				case '2':
					setSpeed(0.5)
					break
				case '3':
					setSpeed(1)
					break
				case '4':
					setSpeed(1.5)
					break
				case '5':
					setSpeed(2)
					break
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [
		handlePlayPause,
		progress,
		seek,
		reset,
		toggleLoop,
		toggleGhostTrail,
		setSpeed,
		onPrevPlay,
		onNextPlay,
	])

	return (
		<div className={`animation-controls ${className || ''}`}>
			{/* Progress scrubber */}
			<div className='animation-controls-scrubber'>
				<span className='animation-controls-time'>
					{currentTime}
				</span>
				<Slider
					value={[progress]}
					onValueChange={handleScrubberChange}
					max={100}
					step={0.1}
					className='flex-1'
					aria-label='Animation progress'
				/>
				<span className='animation-controls-time'>
					{totalDuration}
				</span>
			</div>

			{/* Control buttons */}
			<div className='animation-controls-buttons'>
				<Button
					variant='ghost'
					size='icon'
					onClick={onPrevPlay}
					disabled={!hasPrevPlay}
					aria-label='Previous play (Shift+Left)'
					className='animation-controls-button-ghost'
				>
					<ChevronLeft className='size-6' />
				</Button>

				<Button
					variant='ghost'
					size='icon'
					onClick={reset}
					aria-label='Reset (R)'
					className='animation-controls-button-ghost'
				>
					<RotateCcw className='size-5' />
				</Button>

				<Button
					onClick={handlePlayPause}
					aria-label={state.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
					className='animation-controls-button-play'
				>
					{state.isPlaying ? (
						<Pause className='size-6' />
					) : (
						<Play className='ml-0.5 size-6' />
					)}
				</Button>

				<Button
					variant='ghost'
					size='icon'
					onClick={toggleLoop}
					aria-label={`Loop ${state.loopMode ? 'on' : 'off'} (L)`}
					className='animation-controls-button-ghost animation-controls-button-loop'
					data-active={state.loopMode}
				>
					<Repeat className='size-5' />
				</Button>

				<Button
					variant='ghost'
					size='icon'
					onClick={onNextPlay}
					disabled={!hasNextPlay}
					aria-label='Next play (Shift+Right)'
					className='animation-controls-button-ghost'
				>
					<ChevronRight className='size-6' />
				</Button>
			</div>

			{/* Secondary controls */}
			<div className='animation-controls-secondary'>
				<div className='animation-controls-speed-group'>
					<span className='animation-controls-speed-label'>Speed:</span>
					<Select
						value={String(state.playbackSpeed)}
						onValueChange={handleSpeedChange}
					>
						<SelectTrigger
							className='animation-controls-speed-select'
							aria-label='Playback speed'
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ANIMATION_DEFAULTS.SPEED_OPTIONS.map((speed) => (
								<SelectItem key={speed} value={String(speed)}>
									{speed}x
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Button
					variant='ghost'
					size='sm'
					onClick={toggleGhostTrail}
					aria-label={`Ghost trail ${state.showGhostTrail ? 'on' : 'off'} (G)`}
					className='animation-controls-button-ghost animation-controls-button-ghost-trail'
					data-active={state.showGhostTrail}
				>
					<Ghost className='size-4' />
					<span className='animation-controls-ghost-trail-text'>Trail</span>
				</Button>
			</div>

			{/* Keyboard hints */}
			<div className='animation-controls-hints'>
				<span>Space: Play/Pause</span>
				<span>←/→: Step</span>
				<span>1-5: Speed</span>
			</div>
		</div>
	)
}
