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
import { cn } from '../ui/utils'
import { useAnimation } from '../../contexts/AnimationContext'
import { ANIMATION_DEFAULTS } from '../../types/animation.types'
import type { PlaybackSpeed } from '../../types/animation.types'
import {
	useAnimationProgress,
	useFormattedTime,
	useFormattedDuration,
} from '../../hooks/useAnimationEngine'

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
		<div
			className={cn(
				'flex flex-col gap-3 rounded-lg bg-black/80 p-4',
				className
			)}
		>
			{/* Progress scrubber */}
			<div className='flex items-center gap-3'>
				<span className='min-w-10 text-xs text-white'>
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
				<span className='min-w-10 text-xs text-white'>
					{totalDuration}
				</span>
			</div>

			{/* Control buttons */}
			<div className='flex items-center justify-center gap-4'>
				<Button
					variant='ghost'
					size='icon'
					onClick={onPrevPlay}
					disabled={!hasPrevPlay}
					aria-label='Previous play (Shift+Left)'
					className='text-white hover:bg-white/10 disabled:opacity-30'
				>
					<ChevronLeft className='size-6' />
				</Button>

				<Button
					variant='ghost'
					size='icon'
					onClick={reset}
					aria-label='Reset (R)'
					className='text-white hover:bg-white/10'
				>
					<RotateCcw className='size-5' />
				</Button>

				<Button
					onClick={handlePlayPause}
					aria-label={state.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
					className='size-12 rounded-full bg-blue-500 hover:bg-blue-600'
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
					className={cn(
						'text-white hover:bg-white/10',
						state.loopMode ? 'text-blue-500' : 'opacity-50'
					)}
				>
					<Repeat className='size-5' />
				</Button>

				<Button
					variant='ghost'
					size='icon'
					onClick={onNextPlay}
					disabled={!hasNextPlay}
					aria-label='Next play (Shift+Right)'
					className='text-white hover:bg-white/10 disabled:opacity-30'
				>
					<ChevronRight className='size-6' />
				</Button>
			</div>

			{/* Secondary controls */}
			<div className='flex items-center justify-center gap-4'>
				<div className='flex items-center gap-2'>
					<span className='text-xs text-white'>Speed:</span>
					<Select
						value={String(state.playbackSpeed)}
						onValueChange={handleSpeedChange}
					>
						<SelectTrigger
							className='h-8 w-20 border-white/20 bg-white/10 text-white'
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
					className={cn(
						'gap-1 text-white hover:bg-white/10',
						state.showGhostTrail ? 'text-blue-500' : 'opacity-50'
					)}
				>
					<Ghost className='size-4' />
					<span className='text-xs'>Trail</span>
				</Button>
			</div>

			{/* Keyboard hints */}
			<div className='flex justify-center gap-4 text-[10px] text-white/40'>
				<span>Space: Play/Pause</span>
				<span>←/→: Step</span>
				<span>1-5: Speed</span>
			</div>
		</div>
	)
}
