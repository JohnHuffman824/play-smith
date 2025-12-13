import { useSettings } from '@/contexts/SettingsContext'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import './settings-section.css'

export function AppearanceSection() {
	const { theme, setTheme } = useSettings()

	return (
		<div className="settings-section">
			<h3 className="settings-section-title">Appearance</h3>
			<div className="settings-row">
				<div className="settings-label-group">
					<label className="settings-label">Theme</label>
					<p className="settings-description">
						Choose your preferred color theme
					</p>
				</div>
				<div className="settings-control">
					<Select value={theme} onValueChange={setTheme}>
						<SelectTrigger className="settings-select-trigger">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="light">Light</SelectItem>
							<SelectItem value="dark">Dark</SelectItem>
							<SelectItem value="system">System</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	)
}
