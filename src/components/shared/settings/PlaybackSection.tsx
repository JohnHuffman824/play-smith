import { useSettings } from '@/contexts/SettingsContext'
import { Switch } from '@/components/ui/switch'

export function PlaybackSection() {
	const { moveSkillsOnHashChange, setMoveSkillsOnHashChange } = useSettings()

	return (
		<div>
			<h3 className="text-lg font-medium mb-4">Playback</h3>
			<div className="space-y-4">
				{/* Move Skills on Hash Change */}
				<div className="flex items-center justify-between">
					<div>
						<label className="font-medium">Move Skills on Hash Change</label>
						<p className="text-sm text-muted-foreground">
							Automatically move skill position players when hash position changes
						</p>
					</div>
					<Switch checked={moveSkillsOnHashChange} onCheckedChange={setMoveSkillsOnHashChange} />
				</div>
			</div>
		</div>
	)
}
