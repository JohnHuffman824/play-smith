import { useRef, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { PlayCard } from '../playbook-editor/PlayCard'
import type { Play } from '../../hooks/usePlaybookData'
import { Button } from '@/components/ui/button'
import './play-cards-section.css'

const ANIMATION_DURATION = 800 // ms - must match CSS transition duration

interface PlayCardsSectionProps {
	plays: Play[]
	currentPlayId?: string
	showPlayBar: boolean
	onOpenPlay: (id: string) => void
	onAddPlay: () => void
	isAddingPlay?: boolean
	onRenamePlay?: (id: string) => void
	onDeletePlay?: (id: string) => void
	onDuplicatePlay?: (id: string) => void
}

const NOOP = () => {}

export function PlayCardsSection({
	plays,
	currentPlayId,
	showPlayBar,
	onOpenPlay,
	onAddPlay,
	isAddingPlay,
	onRenamePlay,
	onDeletePlay,
	onDuplicatePlay
}: PlayCardsSectionProps) {
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	// Track whether content should be rendered (delayed unmount on hide)
	const [shouldRenderContent, setShouldRenderContent] = useState(showPlayBar)

	// Handle delayed unmount: render immediately on show, delay unmount on hide
	useEffect(() => {
		if (showPlayBar) {
			// Show immediately
			setShouldRenderContent(true)
		} else {
			// Delay unmount until animation completes
			const timer = setTimeout(() => {
				setShouldRenderContent(false)
			}, ANIMATION_DURATION)
			return () => clearTimeout(timer)
		}
	}, [showPlayBar])

	return (
		<div
			className="play-cards-section"
			style={{
				height: showPlayBar ? '324px' : '0px',
			}}
		>
			{/* Render content when visible OR during hide animation (delayed unmount) */}
			{shouldRenderContent && (
				<div className="play-cards-section__content">
					<div
						ref={scrollContainerRef}
						className="play-cards-section__scroll"
					>
						{plays
							.filter((play) => play.id !== currentPlayId)
							.map((play) => (
								<div key={play.id} className="play-cards-section__card-wrapper">
									<PlayCard
										{...play}
												onOpen={onOpenPlay}
										onRename={onRenamePlay ?? NOOP}
										onDelete={onDeletePlay ?? NOOP}
										onDuplicate={onDuplicatePlay ?? NOOP}
									/>
								</div>
							))}
						{/* Add Play button */}
						<button
							onClick={onAddPlay}
							disabled={isAddingPlay}
							className="play-cards-section__add-button"
							aria-label="Add Play"
						>
							{isAddingPlay ? (
								<>
									<div className="play-cards-section__add-icon">
										<div className="play-cards-section__add-spinner" />
									</div>
									<span className="play-cards-section__add-text">Creating...</span>
								</>
							) : (
								<>
									<div className="play-cards-section__add-icon">
										<Plus size={24} />
									</div>
									<span className="play-cards-section__add-text">Add Play</span>
								</>
							)}
						</button>
						{plays.length === 0 && (
							<div className="play-cards-section__empty">
								No plays in this playbook
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
