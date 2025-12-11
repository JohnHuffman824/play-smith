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
						className="px-6 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition-all shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer"
					>
						Back to Playbook
					</button>
				)}
			</div>
		</div>
	)
}
