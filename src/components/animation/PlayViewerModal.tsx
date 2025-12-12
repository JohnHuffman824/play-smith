/**
 * PlayViewerModal - Full-screen modal for viewing and animating plays.
 * Provides slideshow navigation between plays in a playbook.
 * Fetches full play content (players, drawings) on-demand from API.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { X, Pencil, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import {
	AnimationProvider,
	useAnimation,
} from '../../contexts/AnimationContext'
import { AnimationCanvas } from './AnimationCanvas'
import { AnimationControls } from './AnimationControls'
import { useAnimationTiming } from '../../hooks/useAnimationTiming'
import { usePlayContent, type PlayContent } from '../../hooks/usePlayContent'
import './play-viewer-modal.css'

type PlayMetadata = {
	id: string
	name: string
}

type PlayViewerModalProps = {
	isOpen: boolean
	onClose: () => void
	playbookId: string
	initialPlayId: string
	plays: PlayMetadata[]
	canEdit?: boolean
}

function LoadingState() {
	return (
		<div className='play-viewer-loading'>
			<Loader2 className='play-viewer-loading-spinner' />
			<p className='play-viewer-loading-text'>Loading play...</p>
		</div>
	)
}

function ErrorState({ message }: { message: string }) {
	return (
		<div className='play-viewer-error'>
			<p className='play-viewer-error-title'>Failed to load play</p>
			<p className='play-viewer-error-message'>{message}</p>
		</div>
	)
}

function PlayViewerContent({
	playbookId,
	playContent,
	currentMetadata,
	currentIndex,
	totalPlays,
	isLoading,
	error,
	onClose,
	onPrevPlay,
	onNextPlay,
	canEdit = false,
}: {
	playbookId: string
	playContent: PlayContent | null
	currentMetadata: PlayMetadata
	currentIndex: number
	totalPlays: number
	isLoading: boolean
	error: string | null
	onClose: () => void
	onPrevPlay: () => void
	onNextPlay: () => void
	canEdit?: boolean
}) {
	const navigate = useNavigate()
	const { loadPlay, stop } = useAnimation()

	const playTiming = useAnimationTiming(
		playContent
			? {
					id: playContent.id,
					players: playContent.players,
					drawings: playContent.drawings,
				}
			: null
	)

	const previousPlayIdRef = useRef<string | null>(null)

	useEffect(() => {
		const currentPlayId = playContent?.id ?? null

		if (playTiming && currentPlayId !== previousPlayIdRef.current) {
			previousPlayIdRef.current = currentPlayId
			stop()
			loadPlay(playTiming)
		}
	}, [playTiming, playContent?.id, loadPlay, stop])

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				onClose()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [onClose])

	const handleEdit = useCallback(() => {
		navigate(`/playbooks/${playbookId}/play/${currentMetadata.id}`)
	}, [navigate, playbookId, currentMetadata.id])

	const displayName =
		playContent?.name || currentMetadata.name || 'Untitled Play'

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
			className='play-viewer-modal'
		>
			{/* Header */}
			<div className='play-viewer-header'>
				<div className='play-viewer-header-left'>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						aria-label='Close (Esc)'
						className='play-viewer-close-button'
					>
						<X className='size-6' />
					</Button>
					<div className='play-viewer-title-group'>
						<h2 className='play-viewer-title'>
							{displayName}
						</h2>
						<span className='play-viewer-counter'>
							{currentIndex + 1} of {totalPlays}
						</span>
					</div>
				</div>

				{canEdit && (
					<Button
						variant='outline'
						onClick={handleEdit}
						className='play-viewer-edit-button'
					>
						<Pencil className='size-4' />
						Edit
					</Button>
				)}
			</div>

			{/* Canvas area */}
			{isLoading ? (
				<LoadingState />
			) : error ? (
				<ErrorState message={error} />
			) : (
				<div className='play-viewer-canvas'>
					<AnimationCanvas
						drawings={playContent?.drawings ?? []}
						players={playContent?.players ?? []}
					/>
				</div>
			)}

			{/* Controls */}
			<div className='play-viewer-controls-footer'>
				<AnimationControls
					onPrevPlay={onPrevPlay}
					onNextPlay={onNextPlay}
					hasPrevPlay={currentIndex > 0}
					hasNextPlay={currentIndex < totalPlays - 1}
				/>
			</div>
		</motion.div>
	)
}

export function PlayViewerModal({
	isOpen,
	onClose,
	playbookId,
	initialPlayId,
	plays,
	canEdit = false,
}: PlayViewerModalProps) {
	const [currentIndex, setCurrentIndex] = useState(() => {
		const index = plays.findIndex((p) => p.id === initialPlayId)
		return index >= 0 ? index : 0
	})

	const currentMetadata = plays[currentIndex]
	const currentPlayId = currentMetadata?.id ?? null

	const { playContent, isLoading, error } = usePlayContent({
		playId: currentPlayId,
		enabled: isOpen && currentPlayId !== null,
	})

	useEffect(() => {
		const index = plays.findIndex((p) => p.id === initialPlayId)
		if (index >= 0) {
			setCurrentIndex(index)
		}
	}, [initialPlayId, plays])

	const handlePrevPlay = useCallback(() => {
		setCurrentIndex((prev) => Math.max(0, prev - 1))
	}, [])

	const handleNextPlay = useCallback(() => {
		setCurrentIndex((prev) => Math.min(plays.length - 1, prev + 1))
	}, [plays.length])

	return (
		<AnimatePresence>
			{isOpen && currentMetadata && (
				<AnimationProvider>
					<PlayViewerContent
						playbookId={playbookId}
						playContent={playContent}
						currentMetadata={currentMetadata}
						currentIndex={currentIndex}
						totalPlays={plays.length}
						isLoading={isLoading}
						error={error}
						onClose={onClose}
						onPrevPlay={handlePrevPlay}
						onNextPlay={handleNextPlay}
						canEdit={canEdit}
					/>
				</AnimationProvider>
			)}
		</AnimatePresence>
	)
}
