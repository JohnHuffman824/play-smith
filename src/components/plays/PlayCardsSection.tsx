import { useRef } from 'react'
import { Plus } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { PlayCard } from '../playbook-editor/PlayCard'
import type { Play } from '../../hooks/usePlaybookData'

interface PlayCardsSectionProps {
	plays: Play[]
	currentPlayId?: string
	showPlayBar: boolean
	onOpenPlay: (id: string) => void
	onAddPlay: () => void
}

export function PlayCardsSection({
	plays,
	currentPlayId,
	showPlayBar,
	onOpenPlay,
	onAddPlay
}: PlayCardsSectionProps) {
	const { theme } = useTheme()
	const scrollContainerRef = useRef<HTMLDivElement>(null)

	return (
		<div
			className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} relative`}
			style={{
				height: showPlayBar ? '320px' : '0px',
				overflow: 'hidden',
				zIndex: 0,
				transition: 'height 800ms ease-in-out',
			}}
		>
			{/* Only render content when visible for performance */}
			{showPlayBar && (
				<div className="h-[320px] px-4 py-4">
					<div
						ref={scrollContainerRef}
						className="flex gap-4 h-full overflow-x-auto overflow-y-hidden pb-2"
						style={{ scrollbarGutter: 'stable' }}
					>
						{plays.map((play) => (
							<div
								key={play.id}
								className="flex-shrink-0 w-64 [&>div]:border-gray-200 dark:[&>div]:border-gray-700"
							>
								<PlayCard
									{...play}
									selected={play.id === currentPlayId}
									onSelect={() => {}}
									onOpen={onOpenPlay}
									onRename={() => {}}
									onDelete={() => {}}
									onDuplicate={() => {}}
								/>
							</div>
						))}
						{/* Add Play button */}
						<button
							onClick={onAddPlay}
							className={`flex-shrink-0 w-64 h-[280px] rounded-xl border-2 border-dashed
								transition-all flex flex-col items-center justify-center gap-2 cursor-pointer
								${theme === 'dark'
									? 'bg-gray-800/50 border-gray-600 hover:border-blue-400 hover:bg-gray-700 text-gray-400 hover:text-blue-400'
									: 'bg-gray-50 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-500'
								}`}
						>
							<div className={`w-12 h-12 rounded-xl flex items-center justify-center
								${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
								<Plus size={24} />
							</div>
							<span className="text-sm font-medium">Add Play</span>
						</button>
						{plays.length === 0 && (
							<div className={`flex items-center justify-center w-full ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
								No plays in this playbook
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
