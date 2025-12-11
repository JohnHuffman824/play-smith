import { useRef } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { PlayCard } from '../playbook-editor/PlayCard'
import type { Play } from '../../hooks/usePlaybookData'

interface PlayCardsSectionProps {
	plays: Play[]
	currentPlayId?: string
	showPlayBar: boolean
	onOpenPlay: (id: string) => void
}

export function PlayCardsSection({
	plays,
	currentPlayId,
	showPlayBar,
	onOpenPlay
}: PlayCardsSectionProps) {
	const { theme } = useTheme()
	const scrollContainerRef = useRef<HTMLDivElement>(null)

	return (
		<div
			className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} relative`}
			style={{
				height: showPlayBar ? '220px' : '0px',
				overflow: 'hidden',
				zIndex: 0,
				transition: 'height 800ms ease-in-out',
			}}
		>
			{/* Only render content when visible for performance */}
			{showPlayBar && (
				<div className="h-[220px] px-4 py-3">
					<div
						ref={scrollContainerRef}
						className="flex gap-4 h-full overflow-x-auto overflow-y-hidden pb-2"
						style={{ scrollbarGutter: 'stable' }}
					>
						{plays.map((play) => (
							<div
								key={play.id}
								className="flex-shrink-0 w-64"
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
