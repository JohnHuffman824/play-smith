import { useRef, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { PlayCard } from '../playbook-editor/PlayCard'
import type { Play } from '../../hooks/usePlaybookData'

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
	const { theme } = useTheme()
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
			className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} relative`}
			style={{
				height: showPlayBar ? '340px' : '0px',
				overflow: 'visible',
				zIndex: 0,
				transition: 'height 800ms ease-in-out',
			}}
		>
			{/* Render content when visible OR during hide animation (delayed unmount) */}
			{shouldRenderContent && (
				<div className="h-[340px] px-4 pt-4 flex items-start">
					<div
						ref={scrollContainerRef}
						className="flex gap-4 overflow-x-auto overflow-y-visible py-2"
						style={{ scrollbarGutter: 'stable' }}
					>
						{plays
							.filter((play) => play.id !== currentPlayId)
							.map((play) => (
								<div key={play.id} className="flex-shrink-0 px-1">
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
							className={`flex-shrink-0 w-64 h-[283px]
								rounded-xl border-2 border-dashed
								transition-all flex flex-col
								items-center justify-center gap-2
								${isAddingPlay
									? 'cursor-wait opacity-50'
									: 'cursor-pointer'
								}
								${theme === 'dark'
									? `bg-gray-800/50 border-gray-600
										${!isAddingPlay && 'hover:border-blue-400 hover:bg-gray-700 hover:text-blue-400'}
										text-gray-400`
									: `bg-gray-50 border-gray-300
										${!isAddingPlay && 'hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500'}
										text-gray-400`
								}`}
						>
							{isAddingPlay ? (
								<>
									<div
										className={`w-12 h-12 rounded-xl
											flex items-center justify-center
											${theme === 'dark'
												? 'bg-gray-700'
												: 'bg-gray-100'
											}`}
									>
										<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500" />
									</div>
									<span className="text-sm font-medium">Creating...</span>
								</>
							) : (
								<>
									<div
										className={`w-12 h-12 rounded-xl
											flex items-center justify-center
											${theme === 'dark'
												? 'bg-gray-700'
												: 'bg-gray-100'
											}`}
									>
										<Plus size={24} />
									</div>
									<span className="text-sm font-medium">Add Play</span>
								</>
							)}
						</button>
						{plays.length === 0 && (
							<div
								className={`flex items-center
									justify-center w-full
									${theme === 'dark'
										? 'text-gray-500'
										: 'text-gray-400'
									}`}
							>
								No plays in this playbook
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
