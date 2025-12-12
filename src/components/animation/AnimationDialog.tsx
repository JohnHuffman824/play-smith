/**
 * AnimationDialog - Simple dialog for playing animations.
 * Shows animation canvas with minimal controls (play/pause, speed).
 */

import { useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '../ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import { Button } from '../ui/button'
import { AnimationProvider, useAnimation } from '../../contexts/AnimationContext'
import { AnimationCanvas } from './AnimationCanvas'
import { useAnimationTiming } from '../../hooks/useAnimationTiming'
import { usePlayContent } from '../../hooks/usePlayContent'
import { cn } from '../ui/utils'
import type { PlaybackSpeed } from '../../types/animation.types'

type AnimationDialogProps = {
	isOpen: boolean
	onClose: () => void
	playId: string | null
	playName?: string
}

function AnimationDialogContent({
	playId,
	playName,
}: {
	playId: string | null
	playName?: string
}) {
	const { playContent, isLoading } = usePlayContent({
		playId,
		enabled: playId !== null,
	})

	const playTiming = useAnimationTiming(
		playContent
			? {
					id: playContent.id,
					players: playContent.players,
					drawings: playContent.drawings,
				}
			: null
	)

	const { state, loadPlay, stop, play, pause, setSpeed } = useAnimation()
	const previousPlayIdRef = useRef<string | null>(null)

	useEffect(() => {
		const currentPlayId = playContent?.id ?? null

		if (playTiming && currentPlayId !== previousPlayIdRef.current) {
			previousPlayIdRef.current = currentPlayId
			stop()
			loadPlay(playTiming)
		}
	}, [playTiming, playContent?.id, loadPlay, stop])

	const handleTogglePlay = () => {
		if (state.isPlaying) {
			pause()
		} else {
			play()
		}
	}

	const handleSpeedChange = (value: string) => {
		const speed = parseFloat(value) as PlaybackSpeed
		setSpeed(speed)
	}

	const displayName = playContent?.name || playName || 'Play Animation'

	return (
		<div className='flex h-full flex-col gap-4'>
			<DialogHeader className='flex-shrink-0'>
				<DialogTitle>{displayName}</DialogTitle>
				<DialogDescription className='sr-only'>
					Play animation viewer
				</DialogDescription>
			</DialogHeader>

			{isLoading ? (
				<div className='flex min-h-[400px] items-center justify-center'>
					<p className='text-sm text-muted-foreground'>Loading animation...</p>
				</div>
			) : !playContent ? (
				<div className='flex min-h-[400px] items-center justify-center'>
					<p className='text-sm text-destructive'>Failed to load animation</p>
				</div>
			) : (
				<>
					<div className='flex-1 min-h-0 w-full overflow-hidden rounded-lg bg-black'>
						<AnimationCanvas
							drawings={playContent.drawings}
							players={playContent.players}
						/>
					</div>

					<div className='flex flex-shrink-0 items-center justify-center gap-4 pb-2'>
						<Button
							variant='outline'
							size='icon'
							onClick={handleTogglePlay}
							aria-label={state.isPlaying ? 'Pause' : 'Play'}
						>
							{state.isPlaying ? (
								<Pause className='size-4' />
							) : (
								<Play className='size-4' />
							)}
						</Button>

						<Select
							value={(state.speed ?? 1).toString()}
							onValueChange={handleSpeedChange}
						>
							<SelectTrigger className='w-24'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='0.5'>0.5x</SelectItem>
								<SelectItem value='1'>1x</SelectItem>
								<SelectItem value='1.5'>1.5x</SelectItem>
								<SelectItem value='2'>2x</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</>
			)}
		</div>
	)
}

export function AnimationDialog({
	isOpen,
	onClose,
	playId,
	playName,
}: AnimationDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className={cn('w-[95vw] h-[95vh] max-w-none p-6')}>
				<AnimationProvider>
					<AnimationDialogContent playId={playId} playName={playName} />
				</AnimationProvider>
			</DialogContent>
		</Dialog>
	)
}
