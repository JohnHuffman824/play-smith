import { UnifiedSearchBar } from '../search/UnifiedSearchBar'

interface PlayHeaderProps {
	teamId: string
	playbookId?: string
	onBackToPlaybook?: () => void
}

export function PlayHeader({
	teamId,
	playbookId,
	onBackToPlaybook
}: PlayHeaderProps) {
	return (
		<div className="px-8 pt-6 pb-1">
			<div className="flex gap-4 items-center">
				<div className="flex-1">
					<UnifiedSearchBar
						teamId={teamId}
						playbookId={playbookId}
						placeholder="Search formations, concepts, groups..."
					/>
				</div>

				{onBackToPlaybook && (
					<button
						onClick={onBackToPlaybook}
						className="px-4 py-2 rounded-lg bg-action-button text-action-button-foreground hover:bg-action-button/90 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						Back to Playbook
					</button>
				)}
			</div>
		</div>
	)
}
