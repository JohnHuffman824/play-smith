import { useSettings } from '@/contexts/SettingsContext'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import './settings-section.css'

export function DisplaySection() {
	const { viewMode, setViewMode, cardsPerRow, setCardsPerRow } = useSettings()

	return (
		<div className="settings-section">
			<h3 className="settings-section-title">Display</h3>
			<div className="settings-section-content">
				{/* View Mode */}
				<div className="settings-row">
					<div className="settings-label-group">
						<label className="settings-label">Default View Mode</label>
						<p className="settings-description">
							Choose how playbooks are displayed by default
						</p>
					</div>
					<div className="settings-control">
						<Select value={viewMode} onValueChange={setViewMode}>
							<SelectTrigger className="settings-select-trigger">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="grid">Grid</SelectItem>
								<SelectItem value="list">List</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Cards per Row */}
				<div className="settings-row">
					<div className="settings-label-group">
						<label className="settings-label">Cards per Row</label>
						<p className="settings-description">
							Number of playbook cards to display per row in grid view
						</p>
					</div>
					<div className="settings-control">
						<Select value={cardsPerRow.toString()} onValueChange={(val) => setCardsPerRow(Number(val))}>
							<SelectTrigger className="settings-select-trigger">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="2">2</SelectItem>
								<SelectItem value="3">3</SelectItem>
								<SelectItem value="4">4</SelectItem>
								<SelectItem value="5">5</SelectItem>
								<SelectItem value="6">6</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
		</div>
	)
}
