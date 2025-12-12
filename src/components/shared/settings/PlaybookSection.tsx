import { useSettings } from '@/contexts/SettingsContext'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import './settings-section.css'

export function PlaybookSection() {
	const {
		autoSaveInterval,
		setAutoSaveInterval,
		showPlayCount,
		setShowPlayCount,
		confirmBeforeDelete,
		setConfirmBeforeDelete,
	} = useSettings()

	return (
		<div className="settings-section">
			<h3 className="settings-section-title">Playbooks</h3>
			<div className="settings-section-content">
				{/* Auto-save Interval */}
				<div className="settings-row">
					<div className="settings-label-group">
						<label className="settings-label">Auto-save Interval</label>
						<p className="settings-description">
							How often to automatically save changes
						</p>
					</div>
					<div className="settings-control">
						<Select value={autoSaveInterval} onValueChange={setAutoSaveInterval}>
							<SelectTrigger className="w-[180px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10">10 seconds</SelectItem>
								<SelectItem value="30">30 seconds</SelectItem>
								<SelectItem value="60">1 minute</SelectItem>
								<SelectItem value="300">5 minutes</SelectItem>
								<SelectItem value="manual">Manual only</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Show Play Count */}
				<div className="settings-row">
					<div className="settings-label-group">
						<label className="settings-label">Show Play Count</label>
						<p className="settings-description">
							Display the number of plays on playbook cards
						</p>
					</div>
					<div className="settings-control">
						<Switch checked={showPlayCount} onCheckedChange={setShowPlayCount} />
					</div>
				</div>

				{/* Confirm Before Delete */}
				<div className="settings-row">
					<div className="settings-label-group">
						<label className="settings-label">Confirm Before Delete</label>
						<p className="settings-description">
							Show confirmation dialog when deleting playbooks or plays
						</p>
					</div>
					<div className="settings-control">
						<Switch checked={confirmBeforeDelete} onCheckedChange={setConfirmBeforeDelete} />
					</div>
				</div>
			</div>
		</div>
	)
}
