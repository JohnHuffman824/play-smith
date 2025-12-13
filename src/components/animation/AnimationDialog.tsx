/**
 * AnimationDialog - Simple dialog for playing animations.
 * Shows animation canvas with minimal controls (play/pause, speed).
 */

import { useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import {
	Dialog,
	DialogContent,
} from '../ui/dialog'
import { DialogCloseButton } from '../ui/dialog-close-button'
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
import type { PlaybackSpeed } from '../../types/animation.types'
import './animation-dialog.css'

type AnimationDialogProps = {
	isOpen: boolean
	onClose: () => void
	playId: string | null
	playName?: string
}

function AnimationDialogContent({
	playId,
	playName,
	onClose,
}: {
	playId: string | null
	playName?: string
	onClose: () => void
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
		<div className='animation-dialog-content'>
			<div className='animation-dialog-header'>
				<span className='animation-dialog-title'>{displayName}</span>
				<DialogCloseButton onClose={onClose} />
			</div>

			{isLoading ? (
				<div className='animation-dialog-loading'>
					<p className='animation-dialog-loading-text'>Loading animation...</p>
				</div>
			) : !playContent ? (
				<div className='animation-dialog-error'>
					<p className='animation-dialog-error-text'>Failed to load animation</p>
				</div>
			) : (
				<>
					<div className='animation-dialog-canvas-container'>
						<AnimationCanvas
							drawings={playContent.drawings}
							players={playContent.players}
						/>
					</div>

					<div className='animation-dialog-controls'>
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
							value={(state.playbackSpeed ?? 1).toString()}
							onValueChange={handleSpeedChange}
						>
							<SelectTrigger className='animation-dialog-speed-select'>
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
			<DialogContent className='animation-dialog-wrapper'>
				<AnimationProvider>
					<AnimationDialogContent playId={playId} playName={playName} onClose={onClose} />
				</AnimationProvider>
			</DialogContent>
		</Dialog>
	)
}
