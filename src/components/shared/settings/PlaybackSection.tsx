import { useSettings } from '@/contexts/SettingsContext'
import { Switch } from '@/components/ui/switch'
import './settings-section.css'

export function PlaybackSection() {
	const { moveSkillsOnHashChange, setMoveSkillsOnHashChange } = useSettings()

	return (
		<div className="settings-section">
			<h3 className="settings-section-title">Playback</h3>
			<div className="settings-section-content">
				{/* Move Skills on Hash Change */}
				<div className="settings-row">
					<div className="settings-label-group">
						<label className="settings-label">Move Skills on Hash Change</label>
						<p className="settings-description">
							Automatically move skill position players when hash position changes
						</p>
					</div>
					<div className="settings-control">
						<Switch checked={moveSkillsOnHashChange} onCheckedChange={setMoveSkillsOnHashChange} />
					</div>
				</div>
			</div>
		</div>
	)
}
