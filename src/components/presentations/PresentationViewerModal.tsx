import {
	useEffect,
	useState,
	useCallback,
	useRef
} from 'react'
import { X, Pencil, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { cn } from '../ui/utils'
import {
	AnimationProvider,
	useAnimation,
} from '../../contexts/AnimationContext'
import { AnimationCanvas } from '../animation/AnimationCanvas'
import { AnimationControls } from '../animation/AnimationControls'
import { useAnimationTiming } from '../../hooks/useAnimationTiming'
import { usePlayContent } from '../../hooks/usePlayContent'
import { usePresentationDetail } from '../../hooks/usePresentationsData'

type PresentationViewerModalProps = {
	isOpen: boolean
	onClose: () => void
	presentationId: number
	playbookId: number
}

function LoadingState() {
	return (
		<div
			className='flex flex-1 flex-col items-center justify-center gap-4'
		>
			<Loader2 className='size-12 animate-spin text-white' />
			<p className='text-sm text-white/70'>
				Loading presentation...
			</p>
		</div>
	)
}

function PresentationViewerContent({
	presentationId,
	playbookId,
	onClose,
}: {
	presentationId: number
	playbookId: number
	onClose: () => void
}) {
	const navigate = useNavigate()
	const {
		presentation,
		slides,
		isLoading: slidesLoading
	} = usePresentationDetail(presentationId)
	const [currentIndex, setCurrentIndex] = useState(0)

	const currentSlide = slides[currentIndex]
	const currentPlayId = currentSlide?.play_id?.toString() ?? null

	const {
		playContent,
		isLoading: playLoading,
		error
	} = usePlayContent({
		playId: currentPlayId,
		enabled: currentPlayId !== null,
	})

	const { loadPlay, stop, play } = useAnimation()

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
		const currentId = playContent?.id ?? null

		if (playTiming && currentId !== previousPlayIdRef.current) {
			previousPlayIdRef.current = currentId
			stop()
			loadPlay(playTiming)
		}
	}, [playTiming, playContent?.id, loadPlay, stop])

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			switch (e.key) {
				case 'Escape':
					onClose()
					break
				case 'ArrowLeft':
					if (e.shiftKey) {
						setCurrentIndex((prev) =>
							Math.max(0, prev - 1)
						)
					}
					break
				case 'ArrowRight':
					if (e.shiftKey) {
						setCurrentIndex((prev) =>
							Math.min(slides.length - 1, prev + 1)
						)
					}
					break
				case ' ':
					e.preventDefault()
					play()
					break
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () =>
			window.removeEventListener('keydown', handleKeyDown)
	}, [onClose, slides.length, play])

	const handlePrevSlide = useCallback(() => {
		setCurrentIndex((prev) => Math.max(0, prev - 1))
	}, [])

	const handleNextSlide = useCallback(() => {
		setCurrentIndex((prev) =>
			Math.min(slides.length - 1, prev + 1)
		)
	}, [slides.length])

	const handleEdit = useCallback(() => {
		navigate(`/playbooks/${playbookId}/play/${currentPlayId}`)
	}, [navigate, playbookId, currentPlayId])

	const isLoading = slidesLoading || playLoading
	const displayName = playContent?.name ||
		currentSlide?.play_name ||
		'Untitled'

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
			className='fixed inset-0 z-50 flex flex-col bg-black'
		>
			{/* Header */}
			<div
				className={cn(
					'flex items-center justify-between',
					'border-b border-white/10 px-6 py-4'
				)}
			>
				<div className='flex items-center gap-4'>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						aria-label='Close (Esc)'
						className='text-white hover:bg-white/10'
					>
						<X className='size-6' />
					</Button>
					<div>
						<h2
							className='text-lg font-semibold text-white'
						>
							{presentation?.name}
						</h2>
						<span className='text-xs text-white/50'>
							Slide {currentIndex + 1} of{' '}
							{slides.length}: {displayName}
						</span>
					</div>
				</div>

				<Button
					variant='outline'
					onClick={handleEdit}
					className={cn(
						'gap-2 border-white/20 bg-white/10',
						'text-white hover:bg-white/20'
					)}
				>
					<Pencil className='size-4' />
					Edit Play
				</Button>
			</div>

			{/* Canvas area */}
			{isLoading ? (
				<LoadingState />
			) : error ? (
				<div
					className='flex flex-1 items-center justify-center'
				>
					<p className='text-red-500'>{error}</p>
				</div>
			) : (
				<div className='relative flex-1 overflow-hidden'>
					<AnimationCanvas
						drawings={playContent?.drawings ?? []}
						players={playContent?.players ?? []}
					/>
				</div>
			)}

			{/* Controls */}
			<div className='border-t border-white/10 px-6 py-4'>
				<AnimationControls
					onPrevPlay={handlePrevSlide}
					onNextPlay={handleNextSlide}
					hasPrevPlay={currentIndex > 0}
					hasNextPlay={currentIndex < slides.length - 1}
				/>
			</div>
		</motion.div>
	)
}

export function PresentationViewerModal({
	isOpen,
	onClose,
	presentationId,
	playbookId,
}: PresentationViewerModalProps) {
	return (
		<AnimatePresence>
			{isOpen && (
				<AnimationProvider>
					<PresentationViewerContent
						presentationId={presentationId}
						playbookId={playbookId}
						onClose={onClose}
					/>
				</AnimationProvider>
			)}
		</AnimatePresence>
	)
}
