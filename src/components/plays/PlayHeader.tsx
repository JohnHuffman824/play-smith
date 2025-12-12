import { UnifiedSearchBar } from '../search/UnifiedSearchBar'
import { Button } from '@/components/ui/button'
import './play-header.css'

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
		<div className="play-header">
			<div className="play-header__content">
				<div className="play-header__search">
					<UnifiedSearchBar
						teamId={teamId}
						playbookId={playbookId}
						placeholder="Search formations, concepts, groups..."
					/>
				</div>

				{onBackToPlaybook && (
					<Button onClick={onBackToPlaybook}>
						Back to Playbook
					</Button>
				)}
			</div>
		</div>
	)
}
